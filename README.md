# ghaplan

`ghaplan` explains which GitHub Actions workflows, jobs, matrix cells, and
steps will run for a synthetic event—without Docker, runner setup, command
execution, or a push.

It is for developers editing `.github/workflows` who need quick answers about
triggers, ordered branch/path filters, `if:` expressions, matrix expansion,
`needs` ordering, expression values, permissions, and referenced secrets.
The static browser planner runs at <https://gha-dry-run-planner.sociobot.in>;
workflow text stays in the tab and no analytics are collected.

## Install

Until the first registry release, build the single binary from source:

```sh
git clone https://github.com/B-Divyesh/sf-gha-dry-run-planner.git
cd sf-gha-dry-run-planner
cargo install --path .
```

Rust 1.85 or newer is supported. The factory owns publishing credentials;
this repository is ready for `cargo package` but the worker does not publish.

## CLI usage

From a repository containing `.github/workflows`:

```sh
ghaplan --event pull-request --base main --head feature/cache --paths src/cache.rs
```

Or name files explicitly, supply inputs, and emit JSON:

```sh
ghaplan .github/workflows/release.yml \
  --event workflow-dispatch \
  --input release=true \
  --json
```

Read a workflow from stdin:

```sh
cat .github/workflows/ci.yml | ghaplan - --event push --head main
```

Repeat `--paths`, `--label`, and `--input`, or use comma-separated paths and
labels. `--strict` exits with code 2 for undecidable expressions as well as
invalid workflows. Normal mode exits 0 for a valid plan even when something
is explicitly unknown, and 2 for input/YAML errors. `ghaplan --help` lists all
events and flags.

Human output gives each decision and reason:

```text
PLAN  event=pull_request paths=1 inputs=0

RUN  workflow CI
     └─ pull_request matched all configured trigger filters
     ├─ RUN  job test
     │  └─ job if evaluated to true
     │     matrix #1 os=ubuntu node=22
     │     └─ RUN  step Test — step if evaluated to true
     └─ SKIP job publish (needs: test)
        └─ job if evaluated to false
```

## Rust library

The public surface is intentionally small and typed:

```rust
use ghaplan::{plan_workflow, Event, PlanOptions};

let workflow = "name: CI\non: push\njobs:\n  check:\n    steps:\n      - run: cargo test\n";
let event = Event {
    name: "push".into(), action: None, base: None,
    head: Some("main".into()), git_ref: None,
    paths: vec!["src/lib.rs".into()], labels: vec![], inputs: Default::default(),
};
let plan = plan_workflow(workflow, &event, &PlanOptions::default());
assert_eq!(plan.jobs[0].id, "check");
```

`evaluate(expression, context)` is also exported for isolated expression
inspection. Both APIs return known, unknown, or error states rather than
inventing values.

## Fidelity and safety

`ghaplan` is a static planner, not a runner. It does not execute `run:`, load
actions, read secrets, contact GitHub, or fetch reusable workflows. It models
common `push`, `pull_request`, `pull_request_target`, `workflow_dispatch`,
`schedule`, `merge_group`, and `workflow_run` entry points; ordered branch and
path patterns; core operators/functions; `github`, `inputs`, `matrix`,
`needs`, and `env` contexts; Cartesian matrices with include/exclude; and the
needs DAG.

Runner-derived state, `hashFiles()`, secret values, dynamic remote workflows,
composite-action internals, live concurrency cancellation, and obscure
`workflow_run` payload corners are declared unknown. GitHub has undocumented
edge cases, so compare high-risk release rules against GitHub's documentation.

## Develop and verify

```sh
npm install
npm run dev          # browser planner
npm test             # Rust + browser-engine tests
npm run build        # release CLI + static site in dist/site
npm run preview
npm run pack:cli     # registry-ready crate validation/package
```

The site uses Vite, vanilla TypeScript, and one YAML parser. It has no runtime
CDNs, tracking, accounts, cookies, or server. The Rust CLI has no telemetry.

## License

MIT. See [LICENSE](LICENSE).
