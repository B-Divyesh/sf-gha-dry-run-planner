//! Static GitHub Actions workflow planning.
//!
//! The library never executes workflow commands. [`plan_workflow`] accepts
//! workflow YAML and a synthetic [`Event`] and returns an explainable plan.

mod expression;
mod planner;

pub use expression::{evaluate, EvalResult};
pub use planner::{
    plan_workflow, Decision, Event, JobPlan, MatrixCell, Outcome, Plan, PlanOptions, StepPlan,
    WorkflowPlan,
};
