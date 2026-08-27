//! Static GitHub Actions workflow planning.
//!
//! The library never executes workflow commands. [`plan_workflow`] accepts
//! workflow YAML and a synthetic [`Event`] and returns an explainable plan.
//!
//! ```
//! use ghaplan::{plan_workflow, Event, PlanOptions};
//!
//! let yaml = "name: CI\non: push\njobs:\n  check:\n    steps:\n      - run: cargo test\n";
//! let event = Event {
//!     name: "push".into(), action: None, base: None, head: Some("main".into()),
//!     git_ref: None, paths: vec![], labels: vec![], inputs: Default::default(),
//! };
//! let plan = plan_workflow(yaml, &event, &PlanOptions::default());
//! assert_eq!(plan.jobs[0].id, "check");
//! ```

mod expression;
mod planner;

pub use expression::{evaluate, EvalResult};
pub use planner::{
    plan_workflow, Decision, Event, JobPlan, MatrixCell, Outcome, Plan, PlanOptions, StepPlan,
    WorkflowPlan,
};
