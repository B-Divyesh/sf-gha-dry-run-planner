# Copy audit — polish 3

Audited the rendered landing, demo, legal, 404, dynamic states, metadata, and
README on 2026-08-28. Counts are whitespace-delimited. No sentence exceeds 22
words, and no banned marketing word appears.

## First screen

| Location | Words | Copy |
|---|---:|---|
| H1 | 5 | Plan a GitHub Actions workflow |
| Audience | 14 | For developers editing workflow files who need to see jobs and steps before pushing. |
| Demo result | 7 | See a pull request workflow plan immediately. |
| Fact | 6 | Workflow text stays in this browser. |
| Fact | 6 | Works offline after the first load. |
| Facts | 5 | Free to use. No account. |

The first screen names the job and audience, offers the sample action, states
its result, and gives three concrete facts. It reads aloud in one breath.

## Landing, demo, and route sentences

| Words | Sentence |
|---:|---|
| 4 | Enter a GitHub event. |
| 3 | Read each result. |
| 14 | Paste YAML or open a local file, then choose the GitHub event to check. |
| 9 | Choose an event, branches, changed paths, labels, and inputs. |
| 15 | The planner checks when the workflow starts, each job rule, job variants, and job order. |
| 9 | Each run, skip, or unknown result includes a reason. |
| 14 | Run the command from a shell script, a Git hook, or your code editor. |
| 13 | Checks pushes, pull requests, manual runs, schedules, merge queues, and completed workflow runs. |
| 14 | It also checks branch and path rules, job rules, job variants, and job order. |
| 12 | Secret values, runner files, remote workflows, and live GitHub state are marked unknown. |
| 8 | Plan a GitHub Actions workflow before you push. |
| 5 | ghaplan runs in your browser. |
| 8 | Planning sends no workflow text, analytics, or uploads. |
| 10 | Demo edits use keys beginning with `demo:` in this browser. |
| 4 | Reset demo removes them. |
| 6 | Real planning does not use browser storage. |
| 5 | The site has no accounts. |
| 12 | Questions about this policy can be sent through the project’s issue tracker. |
| 9 | Use ghaplan to inspect workflow rules before you push. |
| 5 | ghaplan explains static workflow rules. |
| 10 | Check important release rules against GitHub documentation before relying on a result. |
| 9 | The command-line project is available under the MIT License. |
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
| 4 | Offline — planner still works. |

## README sentences

| Words | Sentence |
|---:|---|
| 9 | ghaplan plans a GitHub Actions workflow before you push. |
| 8 | It is for developers checking a workflow file. |
| 6 | Open the browser planner at the published URL. |
| 6 | The sample demo is at the demo URL. |
| 6 | Build the command-line tool from source. |
| 9 | Run the shipped pull request sample from any directory. |
| 14 | The command writes its sample file to a temporary directory and prints its plan. |
| 11 | Run `ghaplan` in a repository, or pass a workflow file path. |
| 8 | Use `ghaplan -` when another command provides the workflow. |
| 9 | Use `ghaplan --help` for the event and input options. |
| 11 | The demo opens an isolated sample plan at `/demo` or `?demo=1`. |
| 9 | Demo edits are stored in this browser under `demo:workflow-source`. |
| 8 | Use **Reset demo** to restore the shipped sample. |
| 6 | Read the privacy policy and terms. |
| 7 | The static site is written to `dist/site`. |
| 9 | Run each command in `.factory/claims.json` after a clean checkout. |
| 9 | Check the Rust release package with `npm run pack:cli`. |
| 1 | MIT. |
| 2 | See LICENSE. |

## Headings, controls, and terminology

The round-3 flagged terms now use one plain form:

| Finding | Final wording |
|---|---|
| F-3-5 | The planner checks when the workflow starts, each job rule, job variants, and job order. |
| F-3-6 | Checks pushes, pull requests, manual runs, schedules, merge queues, and completed workflow runs. |
| F-3-7 | Run the command from a shell script, a Git hook, or your code editor. |
| F-3-8 | Use `ghaplan -` when another command provides the workflow. |
| F-3-9 | “Command-line tool” and “Command-line usage” are used consistently. |

Every GitHub link ends with a visible `↗` and includes the screen-reader suffix
“(external link)”. Headings name their subject. Buttons use result-oriented
verbs. Prose uses “pull request”; code uses the literal `pull_request` value.

| Concept | One term |
|---|---|
| GitHub configuration file | workflow |
| Simulated GitHub input | GitHub event |
| Isolated try-out | demo |
| Planner result | workflow plan |
| Not decidable result | unknown |
| Terminal product | command-line tool |
