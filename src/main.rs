use anyhow::{Context, Result};
use clap::{ArgAction, Parser, ValueEnum};
use ghaplan::{plan_workflow, Event, Outcome, Plan, PlanOptions, WorkflowPlan};
use serde_json::Value;
use std::{
    collections::BTreeMap,
    fs,
    io::{self, Read},
    path::{Path, PathBuf},
    process::ExitCode,
};

#[derive(Parser, Debug)]
#[command(
    name = "ghaplan",
    version,
    about = "Explain a GitHub Actions plan without running it",
    long_about = "Statically evaluate workflow triggers, branch/path filters, job and step if conditions, matrix expansion, needs ordering, expressions, permissions, and secret references. No steps or actions are executed.",
    after_help = "Examples:\n  ghaplan --event pull_request --base main --head feat --paths src/a.ts\n  ghaplan .github/workflows/ci.yml --event push --head main --json\n  cat ci.yml | ghaplan - --event workflow_dispatch --input release=true"
)]
struct Cli {
    /// Workflow YAML files. Defaults to .github/workflows/*.yml and *.yaml. Use - for stdin.
    #[arg(value_name = "WORKFLOW")]
    workflows: Vec<PathBuf>,
    /// Synthetic GitHub event name.
    #[arg(long, value_enum, default_value = "pull-request")]
    event: EventName,
    /// Event action, for example opened or synchronize.
    #[arg(long)]
    action: Option<String>,
    /// Pull request base branch.
    #[arg(long)]
    base: Option<String>,
    /// Head or pushed branch.
    #[arg(long)]
    head: Option<String>,
    /// Full git ref such as refs/heads/main or refs/tags/v1.0.0.
    #[arg(long = "ref")]
    git_ref: Option<String>,
    /// Changed path. Repeat the flag or provide a comma-separated list.
    #[arg(long, value_delimiter = ',', action = ArgAction::Append)]
    paths: Vec<String>,
    /// Pull request label. Repeat the flag or provide a comma-separated list.
    #[arg(long, value_delimiter = ',', action = ArgAction::Append)]
    label: Vec<String>,
    /// workflow_dispatch input as KEY=VALUE. Repeat for multiple inputs.
    #[arg(long, value_name = "KEY=VALUE", action = ArgAction::Append)]
    input: Vec<String>,
    /// Repository slug exposed as github.repository.
    #[arg(long, default_value = "local/repository")]
    repository: String,
    /// Emit stable JSON for scripts.
    #[arg(long)]
    json: bool,
    /// Exit 2 when any decision is unknown or invalid; otherwise only invalid YAML exits 2.
    #[arg(long)]
    strict: bool,
}

#[derive(Copy, Clone, Debug, ValueEnum)]
enum EventName {
    Push,
    PullRequest,
    PullRequestTarget,
    WorkflowDispatch,
    Schedule,
    MergeGroup,
    WorkflowRun,
}

impl EventName {
    fn as_str(self) -> &'static str {
        match self {
            Self::Push => "push",
            Self::PullRequest => "pull_request",
            Self::PullRequestTarget => "pull_request_target",
            Self::WorkflowDispatch => "workflow_dispatch",
            Self::Schedule => "schedule",
            Self::MergeGroup => "merge_group",
            Self::WorkflowRun => "workflow_run",
        }
    }
}

fn main() -> ExitCode {
    match run() {
        Ok(code) => code,
        Err(error) => {
            eprintln!("ghaplan: {error:#}");
            ExitCode::from(2)
        }
    }
}

fn run() -> Result<ExitCode> {
    let cli = Cli::parse();
    let inputs = parse_inputs(&cli.input)?;
    let event = Event {
        name: cli.event.as_str().into(),
        action: cli.action.or_else(|| {
            matches!(
                cli.event,
                EventName::PullRequest | EventName::PullRequestTarget
            )
            .then(|| "synchronize".into())
        }),
        base: cli.base,
        head: cli.head,
        git_ref: cli.git_ref,
        paths: cli.paths,
        labels: cli.label,
        inputs,
    };
    let files = discover_files(&cli.workflows)?;
    if files.is_empty() {
        anyhow::bail!("no workflow files found; pass a path or create .github/workflows/*.yml");
    }
    let mut workflows = Vec::new();
    for path in files {
        let (label, yaml) = if path == Path::new("-") {
            let mut text = String::new();
            io::stdin()
                .read_to_string(&mut text)
                .context("read workflow from stdin")?;
            ("<stdin>".into(), text)
        } else {
            (
                path.display().to_string(),
                fs::read_to_string(&path).with_context(|| format!("read {}", path.display()))?,
            )
        };
        workflows.push(plan_workflow(
            &yaml,
            &event,
            &PlanOptions {
                file: label,
                repository: cli.repository.clone(),
                actor: "local".into(),
            },
        ));
    }
    let plan = Plan { event, workflows, warnings: vec!["Planning is static: run commands, action internals, remote reusable workflows, live concurrency, and secret values are never evaluated.".into()] };
    if cli.json {
        println!("{}", serde_json::to_string_pretty(&plan)?);
    } else {
        print_human(&plan);
    }
    let has_error = plan.workflows.iter().any(|w| {
        w.decision.outcome == Outcome::Error
            || w.jobs.iter().any(|j| j.decision.outcome == Outcome::Error)
    });
    let has_unknown = plan.workflows.iter().any(has_unknowns);
    Ok(if has_error || (cli.strict && has_unknown) {
        ExitCode::from(2)
    } else {
        ExitCode::SUCCESS
    })
}

fn parse_inputs(raw: &[String]) -> Result<BTreeMap<String, Value>> {
    raw.iter()
        .map(|entry| {
            let (key, value) = entry
                .split_once('=')
                .with_context(|| format!("input '{entry}' must be KEY=VALUE"))?;
            let parsed =
                serde_json::from_str(value).unwrap_or_else(|_| Value::String(value.into()));
            Ok((key.into(), parsed))
        })
        .collect()
}

fn discover_files(given: &[PathBuf]) -> Result<Vec<PathBuf>> {
    if !given.is_empty() {
        return Ok(given.to_vec());
    }
    let dir = Path::new(".github/workflows");
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut files: Vec<_> = fs::read_dir(dir)?
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| matches!(p.extension().and_then(|v| v.to_str()), Some("yml" | "yaml")))
        .collect();
    files.sort();
    Ok(files)
}

fn has_unknowns(workflow: &WorkflowPlan) -> bool {
    workflow.decision.outcome == Outcome::Unknown
        || workflow.jobs.iter().any(|j| {
            j.decision.outcome == Outcome::Unknown
                || j.matrix.iter().any(|c| {
                    c.decision.outcome == Outcome::Unknown
                        || c.steps
                            .iter()
                            .any(|s| s.decision.outcome == Outcome::Unknown)
                })
        })
}

fn icon(outcome: &Outcome) -> &'static str {
    match outcome {
        Outcome::Run => "RUN ",
        Outcome::Skip => "SKIP",
        Outcome::Unknown => " ?  ",
        Outcome::Error => "ERR ",
    }
}

fn print_human(plan: &Plan) {
    println!(
        "PLAN  event={} paths={} inputs={}",
        plan.event.name,
        plan.event.paths.len(),
        plan.event.inputs.len()
    );
    for workflow in &plan.workflows {
        println!(
            "\n{} workflow {}",
            icon(&workflow.decision.outcome),
            workflow.name
        );
        println!("     └─ {}", workflow.decision.reason);
        for (job_index, job) in workflow.jobs.iter().enumerate() {
            println!(
                "     {}─ {} job {}{}",
                if job_index + 1 == workflow.jobs.len() {
                    "└"
                } else {
                    "├"
                },
                icon(&job.decision.outcome),
                job.id,
                if job.needs.is_empty() {
                    String::new()
                } else {
                    format!(" (needs: {})", job.needs.join(", "))
                }
            );
            println!("     │  └─ {}", job.decision.reason);
            for cell in &job.matrix {
                if !cell.values.is_empty() {
                    println!(
                        "     │     matrix #{} {}",
                        cell.index,
                        cell.values
                            .iter()
                            .map(|(k, v)| format!(
                                "{k}={}",
                                v.as_str()
                                    .map(str::to_owned)
                                    .unwrap_or_else(|| v.to_string())
                            ))
                            .collect::<Vec<_>>()
                            .join(" ")
                    );
                }
                for (step_index, step) in cell.steps.iter().enumerate() {
                    println!(
                        "     │     {} {} step {} — {}",
                        if step_index + 1 == cell.steps.len() {
                            "└─"
                        } else {
                            "├─"
                        },
                        icon(&step.decision.outcome),
                        step.name,
                        step.decision.reason
                    );
                }
            }
        }
        if !workflow.referenced_secrets.is_empty() {
            println!(
                "     secrets referenced: {} (values unknown)",
                workflow.referenced_secrets.join(", ")
            );
        }
        if !workflow.permissions.is_empty() {
            println!("     permissions: {}", workflow.permissions.join(", "));
        }
        for warning in &workflow.warnings {
            println!("     warning: {warning}");
        }
    }
}
