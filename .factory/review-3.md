# Adversarial first-read review 3

**Product:** ghaplan / gha-dry-run-planner  
**Reviewed:** 2026-08-28  
**Live URL:** <https://gha-dry-run-planner.sociobot.in>  
**Candidate:** `82b919c2a27f6cb2012f381b29af253adf3e91aa`  
**Verdict:** **FAIL**

The planner and its demo work, and all 19 declared claim tests pass from a
clean clone. The review still fails. A structure defect from review 1 is only
partly fixed on the deployed 404, the app document contains five H1 elements,
and two published claims have no entries or tests in `.factory/claims.json`.
There are also five plain-language flags and one external-link flag.

## Cold first screen

I opened `/` in fresh Chromium contexts at 390×844 and 1440×900, with no
stored state, before scrolling.

My answers at both sizes were:

- **What does it do?** It predicts which parts of a GitHub Actions workflow
  will run or skip without running the workflow.
- **For whom?** Developers editing workflow files before they push.
- **What should I click first?** **Try it with sample data**.

The exact copy supporting those answers is **“Plan a GitHub Actions
workflow”**, **“For developers editing workflow files who need to see jobs
and steps before pushing.”**, and **“Try it with sample data”**. On mobile,
the primary action begins at y=450px and all three facts end at y=685px, inside
the initial 844px viewport. On desktop they end at y=729px. This check passes.
No console or page error occurred in either context.

## Findings

### F-3-1 — BLOCKING — Review-1 B3 remains half-fixed on the real 404

**Previous ID:** review-1 `B3`.

**Exact location/evidence:** The normal desktop header is **“Demo / Planner /
Privacy / Source”** and its footer is **“Privacy / Terms / Limits”** with the
wordmark and build line. `/not-a-real-route` and `/404.html` instead serve a
separate document whose header is **“Demo / Privacy / Terms”** and footer is
only **“Privacy / Terms”**. The 404 head has no `og:title`, `og:description`,
`og:image`, Twitter card, or web manifest. Its canonical is always
`https://gha-dry-run-planner.sociobot.in/404.html`, including when the requested
URL is `/not-a-real-route`.

**Why this fails:** Review 1 required shared header/footer structure and route
metadata. Round 2 marked both fixed, but the actual 404 still changes the
navigation model and drops the social metadata. The history rule makes a
half-fixed earlier finding blocking again.

**Concrete fix:** Build the 404 from the same header/footer partial or source
as the app. Keep the regular **Demo / Planner / Privacy / Source** navigation,
the complete footer, favicon/manifest, and the same local OG/Twitter image.
Add a production test comparing header/footer links and required metadata on
`/`, every app route, `/404.html`, and an arbitrary missing path.

### F-3-2 — Major — The app document has five H1 elements

**Exact location/evidence:** The live `/`, `/demo`, `/privacy`, and `/terms`
documents each contain five `<h1>` elements: home, demo, privacy, terms, and
not-found headings. Only the active one is displayed. The factory URL verifier
reported `h1: 5`; `site/index.html` contains all five. The repository route
test asserts `h1:visible`, so it permits this state.

**Why this fails:** The structure contract says one H1 per page, not one shown
H1 among five route documents embedded in the DOM. Document-outline tools and
non-visual extractors can identify multiple competing page headlines.

**Concrete fix:** Mount only the active route's H1, or keep inactive route
content in inert templates outside the document tree. Change the route test to
`expect(page.locator('h1')).toHaveCount(1)` for every route.

### F-3-3 — Major — The MIT-license claim is unlisted and untested

**Exact quote/location:** **“MIT licensed”** in the live footer,
**“The command-line project is available under the MIT License.”** on
`/terms`, and **“MIT. See LICENSE.”** in README. No `claims.json` entry mentions
MIT or licensing.

**Why this fails:** Licensing is a statement a user may rely on. A LICENSE
file exists, but the claims contract requires every retained claim to have one
registered sandbox test.

**Concrete fix:** Add an `mit-license` claim and one tagged test that asserts
the repository license contains the canonical MIT grant and that the footer,
terms page, README, and package metadata agree.

### F-3-4 — Major — The source-install promise is unlisted and untested

**Exact quote/location:** README says **“Build the command-line tool from
source.”** and instructs the user to run `cargo install --path .`.
`cli-package` only runs `cargo package --no-verify`; no declared claim installs
the command from the documented source path.

**Why this fails:** This is the primary installation path. A first-time CLI
user relies on it before any product use, but it is outside the acceptance
claim suite.

**Concrete fix:** Add `cli-install` to `claims.json`. In a temporary directory,
run `cargo install --path . --root <temp>`, then assert the installed
`ghaplan --version` and `ghaplan demo` succeed without changing the caller's
working directory.

### F-3-5 — Minor — The workflow-rule explanation is a jargon list

**Exact quote/location:** Landing, “How the workflow planner works”:
**“The planner evaluates triggers, conditions, matrices, and dependencies.”**

**Why this fails:** “Triggers,” “matrices,” and “dependencies” require GitHub
Actions vocabulary and do not explain the change in plain words.

**Concrete rewrite:** **“The planner checks when the workflow starts, each job
rule, job variants, and job order.”**

### F-3-6 — Minor — Supported event names use unexplained shorthand

**Exact quote/location:** Landing, limits:
**“Push, pull request, dispatch, schedule, merge group, and workflow run
events.”**

**Why this fails:** “Dispatch” and “merge group” are API terms rather than
first-read descriptions.

**Concrete rewrite:** **“Checks pushes, pull requests, manual runs, schedules,
merge queues, and completed workflow runs.”**

### F-3-7 — Minor — “Hooks” is ambiguous

**Exact quote/location:** Landing, command-line section:
**“Run the same check in scripts, hooks, or an editor.”**

**Why this fails:** The page does not say whether “hooks” means Git hooks,
webhooks, or another integration.

**Concrete rewrite:** **“Run the command from a shell script, a Git hook, or
your code editor.”**

### F-3-8 — Minor — README explains stdin with implementation jargon

**Exact quote/location:** README, CLI usage: **“Pass `-` to read standard
input.”**

**Why this fails:** “Standard input” assumes shell vocabulary before showing
the concrete behavior.

**Concrete rewrite:** **“Use `ghaplan -` when another command provides the
workflow.”**

### F-3-9 — Minor — The same feature is called “command-line” and “CLI”

**Exact location:** The landing page uses **“Command-line tool”** while README
uses **“CLI usage”**.

**Why this fails:** The plain-words rule requires one term per concept, and the
acronym is less clear on first read.

**Concrete fix:** Rename the README heading to **“Command-line usage”** and use
“command-line tool” consistently.

### F-3-10 — Minor — Several external links are not identified as external

**Exact location:** **“Read installation notes →”**, **“issue tracker”**, and
**“MIT License”** navigate to GitHub without an external-link label or the
`↗` treatment used by **Source ↗**.

**Why this fails:** A phone visitor can leave the product without the link
communicating that change of site.

**Concrete fix:** Give every GitHub link the same visible `↗` convention and a
screen-reader suffix such as **“(external link)”**. Add a route-wide assertion
for every off-origin anchor.

## Demo and sandbox verification

The demo itself passes this round.

- One click on **Try it with sample data** opens `/demo` with the banner
  **“Demo — sample data, nothing is saved”**.
- At 390×844, the summary is at y=441px and the first explained job ends at
  y=627px. At 1440×900, they are at y=456px and y=615px.
- The first demo view shows **“Workflow RUN · 2 jobs · 4 cells · 8 steps”** and
  **“Job if evaluated to true.”** without another action.
- Editing creates only `demo:workflow-source`. **Reset demo** restores the
  bundled pull-request sample. Leaving through **Plan my workflow** removes the
  demo key and hides the banner.
- A seeded `real:sentinel=untouched` value survived edit, reset, and exit.
  Real mode made no browser-storage write.
- Request monitoring began after the controlled load and observed zero
  requests while editing and planning. A live demo reload also succeeded after
  the browser context was taken offline.
- The `cli-demo` claim ran the binary from an empty temporary directory,
  verified the reported temporary sample path and file contents, and confirmed
  the caller directory remained empty.

## Claim audit

I cloned the committed candidate into
`/tmp/ghaplan-review3-clean-16XZ9T`, ran `npm ci`, then ran every command in
`.factory/claims.json` independently. Each ID occurs exactly once in the test
source.

| Claim ID | Result | Observable evidence |
|---|---|---|
| `sample-plan` | PASS | Mobile and desktop demo summary and first reason are in viewport. |
| `demo-storage` | PASS | Demo key reset/exit and real sentinel preservation passed. |
| `offline-reload` | PASS | Controlled demo reloaded offline. |
| `local-browser` | PASS | Planning after load emitted zero requests. |
| `free-no-account` | PASS | Free/no-account copy and absence of account/payment controls passed. |
| `workflow-decisions` | PASS | Push and pull-request workflow, job, and step decisions matched. |
| `event-filters` | PASS | Matching and rejected branch/path cases passed. |
| `expressions` | PASS | True and false job/step conditions passed. |
| `matrix-expansion` | PASS | Exact four include/exclude cells passed. |
| `dependencies` | PASS | Implicit skip and `always()` cleanup behavior passed. |
| `decision-reasons` | PASS | Run, skip, and unknown results had specific reasons. |
| `unknown-sources` | PASS | Secret, runner-file, remote-workflow, concurrency, and workflow-run warnings appeared. |
| `supported-events` | PASS | All six browser event choices produced a matching plan. |
| `browser-file-input` | PASS | Local YAML opened and planned with no request. |
| `json-export` | PASS | Clipboard JSON parsed with workflow, jobs, and matrix cells. |
| `cli-demo` | PASS | Temporary sample path, bytes, plan, and empty caller directory passed. |
| `cli-input` | PASS | Repository discovery, named path, stdin, and help passed. |
| `site-build-output` | PASS | Required `dist/site` shell, host, sitemap, worker, and hashed JS existed. |
| `cli-package` | PASS | Versioned crate archive was created. |

The two unlisted claims are findings F-3-3 and F-3-4. Because they have no
registry entries, they remain untested claims even though the repository
contains an MIT-style LICENSE and normal builds pass.

## Copy audit

Counts are whitespace-delimited. The landing list includes the initial state
and authored dynamic states. No sentence exceeds 22 words. Landing average:
7.5 words. README average: 7.7 words. No banned marketing adjective appears.

### Landing-page sentences

| # | Words | Sentence |
|---:|---:|---|
| 1 | 14 | For developers editing workflow files who need to see jobs and steps before pushing. |
| 2 | 7 | See a pull request workflow plan immediately. |
| 3 | 6 | Workflow text stays in this browser. |
| 4 | 6 | Works offline after the first load. |
| 5 | 3 | Free to use. |
| 6 | 2 | No account. |
| 7 | 4 | Enter a GitHub event. |
| 8 | 3 | Read each result. |
| 9 | 14 | Paste YAML or open a local file, then choose the GitHub event to check. |
| 10 | 7 | Your explained workflow plan will appear here. |
| 11 | 8 | Press “Show this workflow’s plan” or ⌘ ↵. |
| 12 | 9 | Choose an event, branches, changed paths, labels, and inputs. |
| 13 | 8 | The planner evaluates triggers, conditions, matrices, and dependencies. |
| 14 | 9 | Each run, skip, or unknown result includes a reason. |
| 15 | 10 | Run the same check in scripts, hooks, or an editor. |
| 16 | 11 | Push, pull request, dispatch, schedule, merge group, and workflow run events. |
| 17 | 12 | It also checks branch and path rules, job conditions, matrices, and dependencies. |
| 18 | 13 | Secret values, runner files, remote workflows, and live GitHub state are marked unknown. |
| 19 | 8 | Plan a GitHub Actions workflow before you push. |
| 20 | 7 | Paste or open a workflow to begin. |
| 21 | 7 | Choose a workflow smaller than 1 MB. |
| 22 | 5 | Show a workflow plan first. |
| 23 | 3 | Workflow plan copied. |
| 24 | 3 | Sample plan reset. |
| 25 | 8 | Fix the YAML error below, then plan again. |
| 26 | 10 | No jobs are planned because the workflow trigger is skip. |
| 27 | 5 | Offline — planner still works. |

### README sentences

| # | Words | Sentence |
|---:|---:|---|
| 1 | 9 | ghaplan plans a GitHub Actions workflow before you push. |
| 2 | 8 | It is for developers checking a workflow file. |
| 3 | 6 | Open the browser planner at `https://gha-dry-run-planner.sociobot.in`. |
| 4 | 6 | The sample demo is at `https://gha-dry-run-planner.sociobot.in/demo`. |
| 5 | 6 | Build the command-line tool from source. |
| 6 | 9 | Run the shipped pull request sample from any directory. |
| 7 | 14 | The command writes its sample file to a temporary directory and prints its plan. |
| 8 | 11 | Run `ghaplan` in a repository, or pass a workflow file path. |
| 9 | 6 | Pass `-` to read standard input. |
| 10 | 9 | Use `ghaplan --help` for the event and input options. |
| 11 | 11 | The demo opens an isolated sample plan at `/demo` or `?demo=1`. |
| 12 | 9 | Demo edits are stored in this browser under `demo:workflow-source`. |
| 13 | 8 | Use **Reset demo** to restore the shipped sample. |
| 14 | 6 | Read the privacy policy and terms. |
| 15 | 7 | The static site is written to `dist/site`. |
| 16 | 9 | Run each command in `.factory/claims.json` after a clean checkout. |
| 17 | 9 | Check the Rust release package with `npm run pack:cli`. |
| 18 | 1 | MIT. |
| 19 | 2 | See LICENSE. |

### Copy flags

| Finding | Type | Proposed rewrite/fix |
|---|---|---|
| F-3-5 | Jargon list | “The planner checks when the workflow starts, each job rule, job variants, and job order.” |
| F-3-6 | API/event jargon | “Checks pushes, pull requests, manual runs, schedules, merge queues, and completed workflow runs.” |
| F-3-7 | Ambiguous jargon | “Run the command from a shell script, a Git hook, or your code editor.” |
| F-3-8 | CLI jargon | “Use `ghaplan -` when another command provides the workflow.” |
| F-3-9 | Inconsistent term | Use “command-line tool/usage” everywhere. |

All headings otherwise make sense when read as an outline. The headline has
five words. All product actions use a verb and name their outcome: **Try it
with sample data**, **Plan my workflow**, **Show this workflow’s plan**,
**Open file**, **Expand all jobs**, **Copy workflow plan as JSON**, **Reset
demo**, **Read installation notes**, and **Return to the planner**.

## Earlier finding verification

I read `.factory/review-1.md`, `.factory/review-2.md`,
`.factory/polish-2.md`, and `.factory/handoff.md`, then checked both current
code and production. “PASS” below means the behavior was reproduced, not just
marked fixed in the history.

### Review 1

| Earlier ID | Result | Live and code verification |
|---|---|---|
| B1 | PASS | `/demo`, `?demo=1`, banner, reset/exit, `demo:` namespace, CLI demo, and `demo.md` all work. |
| B2 | PASS | 19 registered claims exist, each has one tag, and all commands pass independently. |
| B3 | **BLOCKING / half-fixed** | App routes, status codes, titles, sitemap, and legal links pass; shared 404 chrome and 404 social metadata do not. See F-3-1. |
| B4 | PASS | First screen directly names the GitHub Actions job, developers, and sample action. |
| M1 | PASS | The earlier contextless headings were replaced with explicit workflow, terminal, and limits headings. |
| C1 | PASS | Headline is “Plan a GitHub Actions workflow.” |
| C2 | PASS | “Synthetic event” is absent from visitor copy. |
| C3 | PASS | The first-screen result is stated as jobs and steps before pushing. |
| C4 | PASS | “Every branch accounted for” was removed. |
| C5 | PASS | Result heading names workflow run and skip results. |
| C6 | PASS | How-it-works heading names the planner. |
| C7 | PASS | Terminal heading names its context. |
| C8 | PASS | Capability and unknown headings name ghaplan explicitly. |
| C9 | PASS | The former 24-word feature dump is split; neither sentence exceeds 22 words. |
| C10 | PASS | Terminal copy is shorter; its remaining “hooks” ambiguity is new F-3-7. |
| C11 | PASS | JSON copy action is concrete and covered by `json-export`. |
| C12 | PASS | README introduction is nine words. |
| C13 | PASS | README audience sentence is eight words. |
| C14 | PASS | The 23-word status-check explanation was removed from README. |
| C15 | PASS | The 35-word README feature dump was removed. |
| C16 | PASS | Planner action is “Show this workflow’s plan.” |
| C17 | PASS | JSON action is “Copy workflow plan as JSON.” |
| C18 | PASS | YAML error says what to fix and what to do next. |
| UI fragments | PASS | Payload/live/fidelity wording is gone; local/privacy text is registered; demo remains primary to install. |

### Review 2

| Earlier ID | Result | Live and code verification |
|---|---|---|
| B1 | PASS | Banner count is 0 on real routes, 1 on demo, and 0 after exit; real sentinel survives. |
| B2 | PASS | Summary/first job are inside both required first viewports. |
| F3/U1 | PASS | `workflow-decisions` covers workflow/job/step outcomes. |
| F3/U2 | PASS | Filters, expressions, matrices, dependencies, and events have separate tests. |
| F3/U3 | PASS | `decision-reasons` checks run, skip, and unknown reasons. |
| F3/U4 | PASS | `cli-input` checks repository discovery, file path, stdin, and help. |
| F3/U5 | PASS | `unknown-sources` checks every listed unknown category. |
| F3/U6 | PASS | The unsupported Rust-version statement remains removed. |
| F3/U7 | PASS | `cli-demo` verifies reported path, sample bytes, plan, and empty caller directory. |
| F3/U8 | PASS | `site-build-output` verifies the documented output. |
| F4 | PASS | Back/Forward focuses and announces the active route H1 after the route settles. |
| F5 | PASS | Missing paths and `/404.html` return HTTP 404; known deep links return 200. |
| F6 | PASS | The mobile all-route target test passes; direct live samples are at least 44px. |
| C1 | PASS | Demo exit says “Plan my workflow.” |
| C2 | PASS | Result heading says “Workflow run and skip results.” |
| C3 | PASS | Empty-state heading says “No workflow plan yet.” |
| C4 | PASS | Prose uses “pull request”; selectors retain literal `pull_request`. |
| C5 | PASS | Expand control names jobs. |
| C6 | PASS | README distinguishes repository discovery and a workflow path. |
| C7 | PASS | README describes the browser key without “browser-storage.” |
| C8 | PASS | README says “Check the Rust release package.” |

The repair claims in `polish-2.md` and the prior handoff are therefore
reproduced except for the 404 portion of review-1 B3.

## Structure, accessibility, links, and identity

| Check | Result |
|---|---|
| Route titles | PASS: home, demo, privacy, terms, and 404 follow the required pattern. |
| Descriptions/canonicals/OG/Twitter/favicon | PASS on app routes; FAIL on the 404 as described in F-3-1. |
| One H1 | FAIL: one is visible, but five exist in each app document. See F-3-2. |
| Deep links and status | PASS: known routes return 200; missing routes return designed 404 responses. |
| Back/Forward focus and announcement | PASS after route settlement. |
| Link crawl | PASS: every unique same-origin and GitHub link returned 200; all fragments exist. |
| External-link disclosure | FAIL for three GitHub links. See F-3-10. |
| Privacy/Terms/footer | PASS on app routes; inconsistent on 404. See F-3-1. |
| Keyboard/touch/overflow | PASS: focus checks, 44px target suite, and 390px overflow check pass. |
| Axe/console | PASS: zero serious/critical Axe findings and zero console/page errors in light and dark/reduced-motion checks. |
| Reduced motion/offline | PASS. |
| Build size | PASS: JS 64.92kB raw / 22.68kB gzip; CSS 16.82kB raw / 4.62kB gzip. |
| Visual identity | PASS: porcelain workflow tray, mineral markers, glacial palette, irregular slab edges, and rail hierarchy match `design.md` and are not a generic SaaS template. |

The local `npm test` run passed 7 Rust tests, 1 doc test, 5 Vitest tests,
and 25 Playwright tests. `npm run typecheck` and `npm run build` passed, and
the build produced `dist/site`. The production asset names match that clean
build.

## Missed leverage

No AI feature is warranted. Workflow evaluation must be deterministic and
explainable; model output would weaken the core result and privacy model. The
obvious import/export leverage is already present through local YAML file
input, stdin/repository discovery, clipboard JSON export, and the CLI. A sync
feature is not implied by this local, no-account brief.

## What would make this perfect

Resolve every finding above: unify the real 404 with the app skeleton and
metadata, render exactly one H1, register and test the MIT and source-install
claims, replace the five jargon/inconsistency flags, and mark every outbound
GitHub link. Then rerun every claim command and the complete cold/demo/
structure checklist from a fresh clone. Nothing else is needed for the
reviewed scope.
