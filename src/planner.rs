use crate::expression::{evaluate, EvalResult};
use globset::Glob;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map as JsonMap, Value as JsonValue};
use serde_yaml::{Mapping, Value};
use std::collections::{BTreeMap, HashMap, VecDeque};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Event {
    pub name: String,
    #[serde(default)]
    pub action: Option<String>,
    #[serde(default)]
    pub base: Option<String>,
    #[serde(default)]
    pub head: Option<String>,
    #[serde(default)]
    pub git_ref: Option<String>,
    #[serde(default)]
    pub paths: Vec<String>,
    #[serde(default)]
    pub labels: Vec<String>,
    #[serde(default)]
    pub inputs: BTreeMap<String, JsonValue>,
}

impl Event {
    pub fn pull_request(base: impl Into<String>, head: impl Into<String>) -> Self {
        Self {
            name: "pull_request".into(),
            action: Some("synchronize".into()),
            base: Some(base.into()),
            head: Some(head.into()),
            git_ref: None,
            paths: vec![],
            labels: vec![],
            inputs: BTreeMap::new(),
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct PlanOptions {
    pub file: String,
    pub repository: String,
    pub actor: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Plan {
    pub event: Event,
    pub workflows: Vec<WorkflowPlan>,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WorkflowPlan {
    pub file: String,
    pub name: String,
    pub decision: Decision,
    pub jobs: Vec<JobPlan>,
    pub referenced_secrets: Vec<String>,
    pub permissions: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct JobPlan {
    pub id: String,
    pub name: String,
    pub needs: Vec<String>,
    pub decision: Decision,
    pub matrix: Vec<MatrixCell>,
    pub permissions: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MatrixCell {
    pub index: usize,
    pub values: BTreeMap<String, JsonValue>,
    pub decision: Decision,
    pub steps: Vec<StepPlan>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StepPlan {
    pub index: usize,
    pub id: Option<String>,
    pub name: String,
    pub decision: Decision,
    pub resolved_run: Option<String>,
    pub uses: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Decision {
    pub outcome: Outcome,
    pub reason: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expression: Option<EvalResult>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Outcome {
    Run,
    Skip,
    Unknown,
    Error,
}

impl Decision {
    fn run(reason: impl Into<String>) -> Self {
        Self {
            outcome: Outcome::Run,
            reason: reason.into(),
            expression: None,
        }
    }
    fn skip(reason: impl Into<String>) -> Self {
        Self {
            outcome: Outcome::Skip,
            reason: reason.into(),
            expression: None,
        }
    }
    fn unknown(reason: impl Into<String>) -> Self {
        Self {
            outcome: Outcome::Unknown,
            reason: reason.into(),
            expression: None,
        }
    }
    fn error(reason: impl Into<String>) -> Self {
        Self {
            outcome: Outcome::Error,
            reason: reason.into(),
            expression: None,
        }
    }
}

/// Parse and plan a single workflow without executing any command or action.
pub fn plan_workflow(yaml: &str, event: &Event, options: &PlanOptions) -> WorkflowPlan {
    let parsed: Value = match serde_yaml::from_str(yaml) {
        Ok(v) => v,
        Err(e) => {
            return WorkflowPlan {
                file: options.file.clone(),
                name: options.file.clone(),
                decision: Decision::error(format!("invalid YAML: {e}")),
                jobs: vec![],
                referenced_secrets: vec![],
                permissions: vec![],
                warnings: vec![],
            }
        }
    };
    let root = match parsed.as_mapping() {
        Some(v) => v,
        None => {
            return WorkflowPlan {
                file: options.file.clone(),
                name: options.file.clone(),
                decision: Decision::error("workflow root must be a mapping"),
                jobs: vec![],
                referenced_secrets: vec![],
                permissions: vec![],
                warnings: vec![],
            }
        }
    };
    let name = scalar(root_get(root, "name")).unwrap_or_else(|| options.file.clone());
    let trigger = root_get(root, "on").or_else(|| root_get(root, "true"));
    let decision = match trigger {
        Some(on) => trigger_decision(on, event),
        None => Decision::error("missing 'on' trigger"),
    };
    let mut warnings = fidelity_warnings(root, event);
    let referenced_secrets = secret_references(yaml);
    if !referenced_secrets.is_empty() {
        warnings.push("Secret values stay unknown; only references are reported.".into());
    }
    let permissions = parse_permissions(root_get(root, "permissions"));
    let jobs_map = root_get(root, "jobs").and_then(Value::as_mapping);
    let mut jobs = Vec::new();
    if decision.outcome == Outcome::Run || decision.outcome == Outcome::Unknown {
        match jobs_map {
            Some(map) => jobs = plan_jobs(map, root, event, options, &permissions, &mut warnings),
            None => warnings.push("No jobs mapping was found.".into()),
        }
    }
    WorkflowPlan {
        file: options.file.clone(),
        name,
        decision,
        jobs,
        referenced_secrets,
        permissions,
        warnings,
    }
}

fn trigger_decision(on: &Value, event: &Event) -> Decision {
    match on {
        Value::String(name) => {
            if name == &event.name {
                Decision::run(format!("event matches {name}"))
            } else {
                Decision::skip(format!("listens for {name}, not {}", event.name))
            }
        }
        Value::Sequence(names) => {
            let supported: Vec<String> = names
                .iter()
                .filter_map(|v| v.as_str().map(str::to_owned))
                .collect();
            if supported.contains(&event.name) {
                Decision::run(format!("event {} is listed", event.name))
            } else {
                Decision::skip(format!(
                    "event {} is not in [{}]",
                    event.name,
                    supported.join(", ")
                ))
            }
        }
        Value::Mapping(events) => {
            let config = map_get(events, &event.name);
            let Some(config) = config else {
                return Decision::skip(format!("workflow does not listen for {}", event.name));
            };
            if config.is_null() {
                return Decision::run(format!("event {} matches", event.name));
            }
            let Some(filters) = config.as_mapping() else {
                return Decision::run(format!("event {} matches", event.name));
            };
            if let Some(types) = map_get(filters, "types").and_then(string_list) {
                match &event.action {
                    Some(action) if types.contains(action) => {}
                    Some(action) => {
                        return Decision::skip(format!(
                            "action {action} is excluded by types: [{}]",
                            types.join(", ")
                        ))
                    }
                    None => {
                        return Decision::unknown(
                            "event action is needed to evaluate the types filter",
                        )
                    }
                }
            }
            let branch: Option<&str> =
                if event.name == "pull_request" || event.name == "pull_request_target" {
                    event.base.as_deref()
                } else {
                    event
                        .head
                        .as_ref()
                        .or(event.git_ref.as_ref())
                        .map(|s| s.trim_start_matches("refs/heads/"))
                };
            if let Some(patterns) = map_get(filters, "branches").and_then(string_list) {
                match branch {
                    Some(value) if matches_patterns(value, &patterns, false) => {}
                    Some(value) => {
                        return Decision::skip(format!(
                            "branch {value} did not match branches: [{}]",
                            patterns.join(", ")
                        ))
                    }
                    None => {
                        return Decision::unknown(
                            "base/head branch is needed to evaluate branch filters",
                        )
                    }
                }
            }
            if let Some(patterns) = map_get(filters, "branches-ignore").and_then(string_list) {
                if let Some(value) = branch {
                    if matches_patterns(value, &patterns, false) {
                        return Decision::skip(format!("branch {value} matched branches-ignore"));
                    }
                } else {
                    return Decision::unknown(
                        "base/head branch is needed to evaluate branch filters",
                    );
                }
            }
            if let Some(patterns) = map_get(filters, "paths").and_then(string_list) {
                if event.paths.is_empty() {
                    return Decision::skip("no changed paths were supplied for the paths filter");
                }
                if !event
                    .paths
                    .iter()
                    .any(|p| matches_patterns(p, &patterns, false))
                {
                    return Decision::skip(format!(
                        "no changed path matched paths: [{}]",
                        patterns.join(", ")
                    ));
                }
            }
            if let Some(patterns) = map_get(filters, "paths-ignore").and_then(string_list) {
                if !event.paths.is_empty()
                    && event
                        .paths
                        .iter()
                        .all(|p| matches_patterns(p, &patterns, false))
                {
                    return Decision::skip("every changed path matched paths-ignore");
                }
            }
            Decision::run(format!(
                "{} matched all configured trigger filters",
                event.name
            ))
        }
        _ => Decision::error("'on' must be an event name, list, or mapping"),
    }
}

fn plan_jobs(
    jobs: &Mapping,
    root: &Mapping,
    event: &Event,
    options: &PlanOptions,
    workflow_permissions: &[String],
    warnings: &mut Vec<String>,
) -> Vec<JobPlan> {
    let ordered = job_order(jobs, warnings);
    let mut plans = Vec::new();
    let mut results: BTreeMap<String, JsonValue> = BTreeMap::new();
    for id in ordered {
        let Some(job) = map_get(jobs, &id).and_then(Value::as_mapping) else {
            warnings.push(format!("Job {id} is not a mapping."));
            continue;
        };
        let needs = parse_needs(map_get(job, "needs"));
        let blocked = needs
            .iter()
            .find(|n| results.get(*n).and_then(JsonValue::as_str) != Some("success"));
        let base_context = build_context(event, options, root, None, &results);
        let job_if = scalar(map_get(job, "if")).unwrap_or_else(|| "success()".into());
        let mut decision = if let Some(need) = blocked {
            Decision::skip(format!("dependency {need} did not succeed"))
        } else {
            expression_decision(&job_if, &base_context, "job if")
        };
        let name = scalar(map_get(job, "name")).unwrap_or_else(|| id.clone());
        let permissions = parse_permissions(map_get(job, "permissions"));
        let effective_permissions = if permissions.is_empty() {
            workflow_permissions.to_vec()
        } else {
            permissions
        };
        let mut cells = Vec::new();
        if decision.outcome == Outcome::Run || decision.outcome == Outcome::Unknown {
            match expand_matrix(job, &base_context) {
                Ok(matrix) => {
                    for (index, values) in matrix.into_iter().enumerate() {
                        let context = build_context(event, options, root, Some(&values), &results);
                        let steps = plan_steps(job, &context);
                        let cell_decision =
                            if steps.iter().any(|s| s.decision.outcome == Outcome::Unknown) {
                                Decision::unknown("cell contains an undecidable step")
                            } else {
                                Decision::run(if values.is_empty() {
                                    "single job".into()
                                } else {
                                    format!("matrix cell {}", format_matrix(&values))
                                })
                            };
                        cells.push(MatrixCell {
                            index: index + 1,
                            values,
                            decision: cell_decision,
                            steps,
                        });
                    }
                }
                Err(reason) => {
                    decision = Decision::unknown(reason);
                }
            }
        }
        results.insert(
            id.clone(),
            JsonValue::String(
                if decision.outcome == Outcome::Run {
                    "success"
                } else {
                    "skipped"
                }
                .into(),
            ),
        );
        plans.push(JobPlan {
            id,
            name,
            needs,
            decision,
            matrix: cells,
            permissions: effective_permissions,
        });
    }
    plans
}

fn plan_steps(job: &Mapping, context: &JsonValue) -> Vec<StepPlan> {
    let Some(steps) = map_get(job, "steps").and_then(Value::as_sequence) else {
        return vec![];
    };
    steps
        .iter()
        .enumerate()
        .map(|(index, value)| {
            let Some(step) = value.as_mapping() else {
                return StepPlan {
                    index: index + 1,
                    id: None,
                    name: format!("Step {}", index + 1),
                    decision: Decision::error("step must be a mapping"),
                    resolved_run: None,
                    uses: None,
                };
            };
            let id = scalar(map_get(step, "id"));
            let uses = scalar(map_get(step, "uses"));
            let run = scalar(map_get(step, "run"));
            let name = scalar(map_get(step, "name"))
                .or_else(|| uses.clone())
                .or_else(|| {
                    run.as_ref()
                        .and_then(|r| r.lines().next().map(str::to_owned))
                })
                .unwrap_or_else(|| format!("Step {}", index + 1));
            let condition = scalar(map_get(step, "if")).unwrap_or_else(|| "success()".into());
            let decision = expression_decision(&condition, context, "step if");
            let resolved_run = run.map(|r| resolve_templates(&r, context));
            StepPlan {
                index: index + 1,
                id,
                name,
                decision,
                resolved_run,
                uses,
            }
        })
        .collect()
}

fn expression_decision(source: &str, context: &JsonValue, label: &str) -> Decision {
    let result = evaluate(source, context);
    match result.truthy() {
        Some(true) => Decision {
            outcome: Outcome::Run,
            reason: format!("{label} evaluated to true"),
            expression: Some(result),
        },
        Some(false) => Decision {
            outcome: Outcome::Skip,
            reason: format!("{label} evaluated to false"),
            expression: Some(result),
        },
        None => match result {
            EvalResult::Unknown { ref reason } => Decision {
                outcome: Outcome::Unknown,
                reason: reason.clone(),
                expression: Some(result),
            },
            EvalResult::Error { ref message } => Decision {
                outcome: Outcome::Error,
                reason: message.clone(),
                expression: Some(result),
            },
            _ => unreachable!(),
        },
    }
}

fn build_context(
    event: &Event,
    options: &PlanOptions,
    root: &Mapping,
    matrix: Option<&BTreeMap<String, JsonValue>>,
    needs: &BTreeMap<String, JsonValue>,
) -> JsonValue {
    let branch = event
        .head
        .clone()
        .or_else(|| event.git_ref.clone())
        .unwrap_or_default();
    let env = yaml_map_to_json(root_get(root, "env"))
        .as_object()
        .cloned()
        .unwrap_or_default();
    let needs_obj = needs
        .iter()
        .map(|(id, result)| (id.clone(), json!({"result": result, "outputs": {}})))
        .collect::<JsonMap<_, _>>();
    let labels: Vec<_> = event
        .labels
        .iter()
        .map(|name| json!({"name": name}))
        .collect();
    json!({
        "github": {"event_name": event.name, "event": {"action": event.action, "inputs": event.inputs, "pull_request": {"base": {"ref": event.base}, "head": {"ref": event.head}, "labels": labels}}, "ref": event.git_ref.clone().unwrap_or_else(|| format!("refs/heads/{branch}")), "ref_name": branch, "base_ref": event.base, "head_ref": event.head, "repository": if options.repository.is_empty() { "local/repository" } else { &options.repository }, "actor": if options.actor.is_empty() { "local" } else { &options.actor }},
        "inputs": event.inputs,
        "matrix": matrix.cloned().unwrap_or_default(),
        "needs": needs_obj,
        "env": env,
        "vars": {}
    })
}

fn expand_matrix(
    job: &Mapping,
    context: &JsonValue,
) -> Result<Vec<BTreeMap<String, JsonValue>>, String> {
    let Some(matrix_value) = map_get(job, "strategy")
        .and_then(Value::as_mapping)
        .and_then(|s| map_get(s, "matrix"))
    else {
        return Ok(vec![BTreeMap::new()]);
    };
    if let Some(expr) = matrix_value.as_str() {
        return match evaluate(expr, context) {
            EvalResult::Known {
                value: JsonValue::Object(obj),
                ..
            } => expand_matrix_json(obj),
            EvalResult::Unknown { reason } => Err(reason),
            EvalResult::Error { message } => Err(message),
            _ => Err("matrix expression must resolve to an object".into()),
        };
    }
    let object = yaml_map_to_json(Some(matrix_value))
        .as_object()
        .cloned()
        .ok_or_else(|| "strategy.matrix must be a mapping".to_string())?;
    expand_matrix_json(object)
}

fn expand_matrix_json(
    mut object: JsonMap<String, JsonValue>,
) -> Result<Vec<BTreeMap<String, JsonValue>>, String> {
    let includes = object
        .remove("include")
        .and_then(|v| v.as_array().cloned())
        .unwrap_or_default();
    let excludes = object
        .remove("exclude")
        .and_then(|v| v.as_array().cloned())
        .unwrap_or_default();
    let mut cells = vec![BTreeMap::new()];
    for (key, values) in object {
        let values = values
            .as_array()
            .ok_or_else(|| format!("matrix axis {key} must be an array"))?;
        let mut next = Vec::new();
        for cell in &cells {
            for value in values {
                let mut expanded = cell.clone();
                expanded.insert(key.clone(), value.clone());
                next.push(expanded);
            }
        }
        cells = next;
        if cells.len() > 256 {
            return Err("matrix expands past GitHub's 256-job limit".into());
        }
    }
    cells.retain(|cell| {
        !excludes.iter().any(|exclude| {
            exclude
                .as_object()
                .is_some_and(|e| e.iter().all(|(k, v)| cell.get(k) == Some(v)))
        })
    });
    for include in includes {
        let Some(fields) = include.as_object() else {
            continue;
        };
        let mut merged = false;
        for cell in &mut cells {
            if fields
                .iter()
                .all(|(k, v)| !object_axis_conflict(cell, k, v))
            {
                for (k, v) in fields {
                    cell.insert(k.clone(), v.clone());
                }
                merged = true;
            }
        }
        if !merged {
            cells.push(fields.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
        }
    }
    if cells.is_empty() {
        return Err("matrix contains no cells after exclusions".into());
    }
    Ok(cells)
}

fn object_axis_conflict(cell: &BTreeMap<String, JsonValue>, key: &str, value: &JsonValue) -> bool {
    cell.get(key).is_some_and(|v| v != value)
}

fn job_order(jobs: &Mapping, warnings: &mut Vec<String>) -> Vec<String> {
    let ids: Vec<String> = jobs.keys().filter_map(yaml_key).collect();
    let mut indegree: HashMap<String, usize> = ids.iter().map(|id| (id.clone(), 0)).collect();
    let mut edges: HashMap<String, Vec<String>> = HashMap::new();
    for id in &ids {
        if let Some(job) = map_get(jobs, id).and_then(Value::as_mapping) {
            for need in parse_needs(map_get(job, "needs")) {
                if indegree.contains_key(&need) {
                    *indegree.get_mut(id).unwrap() += 1;
                    edges.entry(need).or_default().push(id.clone());
                } else {
                    warnings.push(format!("Job {id} needs missing job {need}."));
                }
            }
        }
    }
    let mut queue: VecDeque<String> = ids
        .iter()
        .filter(|id| indegree[*id] == 0)
        .cloned()
        .collect();
    let mut out = Vec::new();
    while let Some(id) = queue.pop_front() {
        out.push(id.clone());
        for next in edges.get(&id).into_iter().flatten() {
            let count = indegree.get_mut(next).unwrap();
            *count -= 1;
            if *count == 0 {
                queue.push_back(next.clone());
            }
        }
    }
    if out.len() != ids.len() {
        warnings.push(
            "The needs graph contains a cycle; cyclic jobs are listed in source order.".into(),
        );
        for id in ids {
            if !out.contains(&id) {
                out.push(id);
            }
        }
    }
    out
}

fn resolve_templates(source: &str, context: &JsonValue) -> String {
    let re = Regex::new(r"\$\{\{(.+?)\}\}").unwrap();
    re.replace_all(source, |caps: &regex::Captures| {
        match evaluate(caps.get(1).unwrap().as_str(), context) {
            EvalResult::Known { display, .. } => display,
            EvalResult::Unknown { reason } => format!("<unknown: {reason}>"),
            EvalResult::Error { message } => format!("<error: {message}>"),
        }
    })
    .into_owned()
}

fn matches_patterns(value: &str, patterns: &[String], default: bool) -> bool {
    let mut matched = default;
    for raw in patterns {
        let (negative, pattern) = raw
            .strip_prefix('!')
            .map(|p| (true, p))
            .unwrap_or((false, raw.as_str()));
        if Glob::new(pattern)
            .map(|g| g.compile_matcher().is_match(value))
            .unwrap_or(false)
        {
            matched = !negative;
        }
    }
    matched
}

fn secret_references(yaml: &str) -> Vec<String> {
    let re = Regex::new(r#"(?i)secrets(?:\.|\[['"])([A-Za-z_][A-Za-z0-9_]*)"#).unwrap();
    let mut out: Vec<_> = re
        .captures_iter(yaml)
        .map(|c| c[1].to_ascii_uppercase())
        .collect();
    out.sort();
    out.dedup();
    out
}
fn parse_permissions(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::String(s)) => vec![s.clone()],
        Some(Value::Mapping(m)) => m
            .iter()
            .filter_map(|(k, v)| Some(format!("{}: {}", yaml_key(k)?, scalar(Some(v))?)))
            .collect(),
        _ => vec![],
    }
}
fn parse_needs(value: Option<&Value>) -> Vec<String> {
    value.and_then(string_list).unwrap_or_default()
}
fn string_list(value: &Value) -> Option<Vec<String>> {
    match value {
        Value::String(v) => Some(vec![v.clone()]),
        Value::Sequence(v) => Some(v.iter().filter_map(|x| scalar(Some(x))).collect()),
        _ => None,
    }
}
fn scalar(value: Option<&Value>) -> Option<String> {
    match value? {
        Value::String(v) => Some(v.clone()),
        Value::Bool(v) => Some(v.to_string()),
        Value::Number(v) => Some(v.to_string()),
        _ => None,
    }
}
fn yaml_key(value: &Value) -> Option<String> {
    scalar(Some(value))
}
fn root_get<'a>(map: &'a Mapping, key: &str) -> Option<&'a Value> {
    map_get(map, key)
}
fn map_get<'a>(map: &'a Mapping, key: &str) -> Option<&'a Value> {
    map.get(Value::String(key.to_string())).or_else(|| {
        if key == "on" {
            map.get(Value::Bool(true))
        } else {
            None
        }
    })
}
fn yaml_map_to_json(value: Option<&Value>) -> JsonValue {
    value
        .and_then(|v| serde_json::to_value(v).ok())
        .unwrap_or(JsonValue::Null)
}
fn format_matrix(values: &BTreeMap<String, JsonValue>) -> String {
    values
        .iter()
        .map(|(k, v)| {
            format!(
                "{k}={}",
                v.as_str()
                    .map(str::to_owned)
                    .unwrap_or_else(|| v.to_string())
            )
        })
        .collect::<Vec<_>>()
        .join(", ")
}

fn fidelity_warnings(root: &Mapping, event: &Event) -> Vec<String> {
    let mut out = Vec::new();
    if root_get(root, "concurrency").is_some() {
        out.push("Concurrency keys are reported structurally; existing in-progress runs are unknown locally.".into());
    }
    if event.name == "workflow_run" {
        out.push("workflow_run payload semantics are only partially modeled in v0.1.".into());
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    const WORKFLOW: &str = r#"
name: CI
on:
  pull_request:
    branches: [main]
    paths: ['src/**', '!src/docs/**']
permissions:
  contents: read
jobs:
  test:
    if: github.event_name == 'pull_request'
    strategy:
      matrix:
        os: [ubuntu, windows]
        node: [20, 22]
        exclude:
          - { os: windows, node: 20 }
    steps:
      - name: Test
        if: matrix.os != 'windows'
        run: npm test -- --node=${{ matrix.node }}
  publish:
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
"#;
    #[test]
    fn plans_trigger_matrix_steps_and_needs() {
        let mut event = Event::pull_request("main", "feature");
        event.paths = vec!["src/lib.rs".into()];
        let plan = plan_workflow(
            WORKFLOW,
            &event,
            &PlanOptions {
                file: "ci.yml".into(),
                ..Default::default()
            },
        );
        assert_eq!(plan.decision.outcome, Outcome::Run);
        assert_eq!(plan.jobs.len(), 2);
        assert_eq!(plan.jobs[0].matrix.len(), 3);
        assert!(plan.jobs[0]
            .matrix
            .iter()
            .any(|c| c.steps[0].decision.outcome == Outcome::Skip));
        assert_eq!(plan.jobs[1].decision.outcome, Outcome::Skip);
    }
    #[test]
    fn explains_path_skip() {
        let mut event = Event::pull_request("main", "feature");
        event.paths = vec!["docs/readme.md".into()];
        let plan = plan_workflow(WORKFLOW, &event, &PlanOptions::default());
        assert_eq!(plan.decision.outcome, Outcome::Skip);
        assert!(plan.decision.reason.contains("changed path"));
    }
    #[test]
    fn invalid_yaml_is_an_error_plan() {
        let plan = plan_workflow(
            "jobs: [",
            &Event::pull_request("main", "x"),
            &PlanOptions::default(),
        );
        assert_eq!(plan.decision.outcome, Outcome::Error);
    }
}
