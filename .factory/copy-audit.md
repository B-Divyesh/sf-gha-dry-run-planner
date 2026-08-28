# Copy audit — polish 2

Audited the rendered landing, demo, legal, 404, dynamic states, metadata, and
README on 2026-08-28. Whitespace-delimited counts are shown below. No sentence
exceeds 22 words. No banned marketing word appears.

## First screen

| Location | Words | Copy |
|---|---:|---|
| H1 | 5 | Plan a GitHub Actions workflow |
| Audience | 14 | For developers editing workflow files who need to see jobs and steps before pushing. |
| Demo result | 7 | See a pull request workflow plan immediately. |
| Fact | 6 | Workflow text stays in this browser. |
| Fact | 6 | Works offline after the first load. |
| Facts | 5 | Free to use. No account. |

The first screen names the job, audience, sample action, resulting state, and
three concrete facts. It can be read aloud in one breath.

## Landing, demo, and route sentences

| Words | Sentence |
|---:|---|
| 4 | Enter a GitHub event. |
| 3 | Read each result. |
| 14 | Paste YAML or open a local file, then choose the GitHub event to check. |
| 9 | Choose an event, branches, changed paths, labels, and inputs. |
| 8 | The planner evaluates triggers, conditions, matrices, and dependencies. |
| 9 | Each run, skip, or unknown result includes a reason. |
| 10 | Run the same check in scripts, hooks, or an editor. |
| 11 | Push, pull request, dispatch, schedule, merge group, and workflow run events. |
| 12 | It also checks branch and path rules, job conditions, matrices, and dependencies. |
| 12 | Secret values, runner files, remote workflows, and live GitHub state are marked unknown. |
| 9 | Plan a GitHub Actions workflow before you push. |
| 8 | Planning sends no workflow text, analytics, or uploads. |
| 10 | Demo edits use keys beginning with `demo:` in this browser. |
| 4 | Reset demo removes them. |
| 6 | Real planning does not use browser storage. |
| 5 | The site has no accounts. |
| 14 | Questions about this policy can be sent through the project’s issue tracker. |
| 9 | Use ghaplan to inspect workflow rules before you push. |
| 5 | ghaplan explains static workflow rules. |
| 10 | Check important release rules against GitHub documentation before relying on a result. |
| 11 | The command-line project is available under the MIT License. |
| 10 | The page may have moved, or the address may be incomplete. |

## Dynamic state sentences

| Words | Sentence |
|---:|---|
| 7 | Your explained workflow plan will appear here. |
| 8 | Press “Show this workflow’s plan” or ⌘ ↵. |
| 7 | Paste or open a workflow to begin. |
| 7 | Choose a workflow smaller than 1 MB. |
| 5 | Show a workflow plan first. |
| 3 | Workflow plan copied. |
| 3 | Sample plan reset. |
| 8 | Fix the YAML error below, then plan again. |
| 10 | No jobs are planned because the workflow trigger is skip. |

## README sentences

| Words | Sentence |
|---:|---|
| 9 | ghaplan plans a GitHub Actions workflow before you push. |
| 8 | It is for developers checking a workflow file. |
| 6 | Open the browser planner at the published URL. |
| 6 | The sample demo is at the demo URL. |
| 6 | Build the command-line tool from source. |
| 8 | Run the shipped pull request sample from any directory. |
| 14 | The command writes its sample file to a temporary directory and prints its plan. |
| 9 | Run `ghaplan` in a repository, or pass a workflow file path. |
| 6 | Pass `-` to read standard input. |
| 9 | Use `ghaplan --help` for the event and input options. |
| 11 | The demo opens an isolated sample plan at `/demo` or `?demo=1`. |
| 7 | Demo edits are stored in this browser under `demo:workflow-source`. |
| 8 | Use **Reset demo** to restore the shipped sample. |
| 6 | Read the privacy policy and terms. |
| 7 | The static site is written to `dist/site`. |
| 9 | Run each command in `.factory/claims.json` after a clean checkout. |
| 8 | Check the Rust release package with `npm run pack:cli`. |
| 1 | MIT. |
| 2 | See LICENSE. |

## Headings and controls changed in this round

| Before | After |
|---|---|
| Start for real | Plan my workflow |
| What will happen | Workflow run and skip results |
| Ready when the workflow is | No workflow plan yet |
| Expand all | Expand all jobs |
| pull-request (prose) | pull request |

## Terminology

| Concept | One term |
|---|---|
| GitHub configuration file | workflow |
| Simulated GitHub input | GitHub event |
| Isolated try-out | demo |
| Planner result | workflow plan |
| Not decidable result | unknown |
| Standard GitHub identifier | literal code form such as `pull_request` |
