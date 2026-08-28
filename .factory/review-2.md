# Adversarial first-read review 2

**Product:** ghaplan / gha-dry-run-planner  
**Reviewed:** 2026-08-28  
**Verdict:** **FAIL**

The cold landing screen now explains the product, audience, and first action.
The review still fails on two blocking demo defects: the demo banner appears on
every route, including after leaving the demo, and the demo's actual plan is
below the first viewport at both required widths. The claim commands all pass,
but several live and README claims remain outside the claim registry.

## Method and evidence

- Opened production in fresh Chromium contexts at 390×844 and 1440×900 before
  scrolling. Saved viewport screenshots in `/tmp/gha-mobile-cold.png` and
  `/tmp/gha-desktop-cold.png`; no console or page errors occurred.
- Entered **Try it with sample data** from a fresh 390px context. The sample
  event, workflow, and generated result were present without another action.
- Edited and reset the demo while a sentinel `real:workflow-source` value was
  present. Reset restored the sample, preserved the real sentinel, and leaving
  the demo removed `demo:workflow-source`.
- Intercepted the whole live demo flow. All four requests were same-origin.
  A fresh first visit to `/demo` also reloaded successfully after the context
  was taken offline.
- Ran every command in `.factory/claims.json` independently from fresh clone
  `/tmp/ghaplan-review2-9Ann3P`; all six passed.
- Ran `npm test`, `npm run typecheck`, and `npm run build` in that clone. All
  passed. The build produced 22.60 kB gzip JavaScript and 4.43 kB gzip CSS.
- Ran the accessibility audit against production in light and dark/reduced-
  motion modes: no serious/critical Axe finding, console error, horizontal
  overflow, or offline-reload failure was reported.
- Crawled all unique live links. Every HTTP link returned 200 and all three
  same-page fragment targets existed.
- Opened `/`, `/demo`, `/privacy`, `/terms`, and an unknown deep link. Titles,
  descriptions, canonicals, social metadata, favicon, and one exposed h1 per
  route were present. The OG image is 1200×630 and the touch icon is 180×180.
- Ran `ghaplan demo` from a new temporary directory. It printed the generated
  sample path and a two-job plan without writing into the working directory.

## Cold first screen

At both widths, before scrolling, my answers were:

- **What does this do?** It predicts which parts of a GitHub Actions workflow
  will run or skip without running the workflow.
- **For whom?** Developers editing GitHub Actions workflow files.
- **What should I click first?** **Try it with sample data**.

The copy supporting those answers is **“Plan a GitHub Actions workflow”**,
**“For developers editing workflow files who need to see jobs and steps before
pushing.”**, and **“Try it with sample data.”** This part passes. On mobile,
the action and all three plain facts are visible within the initial 844px.

The unexpected demo strip above this otherwise clear hero creates the first
blocking finding below.

## Findings

### B1 — Demo state is falsely displayed on every route

**Quote / evidence:** **“Demo — sample data, nothing is saved”**, **“Reset
demo”**, and **“Start for real”** are visible on `/`, `/privacy`, `/terms`, and
the 404 view, not only on `/demo`. On `/`, the element reports `hidden=true`
but computed `display:flex`. After selecting **Start for real**, the URL and
title change to the ordinary home page, `demo:workflow-source` is removed, yet
the same demo strip remains visible.

**Why a first-time visitor is lost or misled:** The page labels real mode as a
demo before the visitor has tried anything. Leaving the sandbox produces no
visible state change, so the visitor cannot tell whether subsequent workflow
text is demo data or their real input. The banner's “nothing is saved” promise
is also impossible to interpret reliably when it is shown outside demo mode.

**Concrete fix:** Ensure the HTML `hidden` state wins, for example with
`.demo-banner[hidden] { display: none; }`, and show the strip only when the
current route is `/demo` or `?demo=1`. Add browser assertions that the strip is
absent on `/`, legal routes, and the 404; visible on `/demo`; and absent again
after **Start for real**. Rename that action **Plan my workflow** so it names
the resulting mode.

### B2 — The first demo screen does not show the promised plan

**Quote / evidence:** The landing note promises **“See a pull-request workflow
plan immediately.”** After one click, the first 390×844 screen shows the demo
heading and the top of the event form. The plan summary **“Workflow RUN · 2
jobs · 4 cells · 8 steps”** starts at y=2,010px. At 1440×900 it starts at
y=1,247px. It is outside both first viewports.

**Why a first-time visitor is lost or misled:** The result is the product's
value. A phone visitor instead sees another long form and must scroll past the
remaining event fields, workflow source, and controls before discovering that
a result already exists. The current `sample-plan` claim test only checks that
text exists in the DOM; it does not check that the promised immediate result is
visible.

**Concrete fix:** Put a compact sample outcome above the inputs in demo mode,
or scroll/focus the visitor to a result-first demo layout while keeping the
sticky banner visible. The initial 390×844 viewport should show at least
**“Workflow RUN · 2 jobs · 4 cells · 8 steps”** and one explained job decision.
Extend `@claim:sample-plan` with `toBeInViewport()` at 390px and desktop widths.

### Major F3 — Claim-like capability statements are absent from `claims.json`

All registered tests pass, but each row below is still an unlisted or
under-specified claim. A visitor can rely on these statements, while the claim
suite cannot prove their full meaning.

| ID | Quote | Why it is not covered | Concrete fix |
|---|---|---|---|
| U1 | “ghaplan plans a GitHub Actions workflow before you push.” / “See which jobs will run or skip” | `sample-plan` proves only one bundled fixture, not the general planner promise. | Add `workflow-decisions` with push and pull-request fixtures asserting workflow, job, and step outcomes; list both locations. |
| U2 | “The planner evaluates triggers, conditions, matrices, and dependencies.” / “Common GitHub events, branch and path rules, job conditions, matrices, and dependencies.” | No registry entry names this feature coverage. One test cannot safely imply every listed evaluator. | Split this into narrow claims and tests for event filters, expressions, matrix include/exclude, and `needs`. |
| U3 | “Each run, skip, or unknown result includes a reason.” | The sample test does not assert all three states or their explanations. | Add a fixture producing run, skip, and unknown; assert a non-empty reason for each result. |
| U4 | “Run the same check in scripts, hooks, or an editor.” / “Use a repository workflow or name a file.” | `cli-demo` exercises only the bundled sample command. | Add a CLI-input claim that runs a named workflow and stdin input from a temp repository and asserts equivalent output. |
| U5 | “Secret values, runner files, remote workflows, and live GitHub state are marked unknown.” | The current sample checks only a referenced secret. | Narrow the sentence to the tested secret behavior or add fixtures for every listed unknown source. |
| U6 | “Rust 1.85 or newer is required.” | No claim test or CI result in the registry verifies the minimum supported compiler. | Add an MSRV build test pinned to Rust 1.85, or state only the version used for verification. |
| U7 | “The command writes its sample file to a temporary directory and prints its plan.” | `cli-demo` asserts plan text but not the printed path or generated file. | Parse the printed path, assert it is under the temp directory, and confirm the sample file exists and matches the bundled input. |
| U8 | “The static site is written to `dist/site`.” | This documented build-output promise has no registry entry. | Add `site-build-output` running the build and asserting `dist/site/index.html` plus required assets, or remove the promise. |

### Major F4 — Back navigation does not restore focus to the home heading

**Quote / evidence:** Navigating from `/` to **Privacy** focuses **“Privacy for
the workflow planner”** as expected. Pressing browser Back returns to `/`, but
the active element is the body rather than **“Plan a GitHub Actions workflow.”**

**Why a first-time visitor is lost or misled:** Keyboard and screen-reader
users receive no focused route destination after returning home, despite the
route-change announcement contract.

**Concrete fix:** Make the home h1 programmatically focusable with
`tabindex="-1"`, focus it on `popstate`, and add a browser test for focus after
Back and Forward on every route.

### Major F5 — The designed not-found view returns HTTP 200

**Quote / evidence:** `/not-a-real-route` displays **“This workflow path does
not exist”** with the correct title and recovery action, but its HTTP response
is 200. `/404.html` also returns 200.

**Why a first-time visitor is lost or misled:** The visual recovery works, but
crawlers, link checkers, and integrations are told that an invalid address is
a valid page.

**Concrete fix:** Configure the deployed host to serve the designed 404 body
with status 404 for unknown paths while preserving 200 deep links for `/demo`,
`/privacy`, and `/terms`. Add a response-status check to the route suite.

### Major F6 — Several mobile targets are smaller than 44px

**Quote / evidence:** At 390px, **Reset demo** and **Start for real** are 36px
high. Footer links are about 20px high with only 8px vertical separation. The
automated audit sampled other controls and therefore did not catch these.

**Why a first-time visitor is lost or misled:** The most important demo-state
controls and legal links are harder to tap accurately on a phone and do not
meet the stated 44px interaction baseline.

**Concrete fix:** Give banner and footer links a minimum 44×44px hit area. Add
an all-routes mobile test that measures every visible interactive target, with
documented exceptions only where surrounding spacing supplies the equivalent
target area.

## Copy findings and proposed rewrites

No landing or README sentence exceeds 22 words. Both sets average 7.3 words per
sentence. No banned marketing adjective appears. These remaining flags are
separate findings:

| ID | Severity | Quote | Flag and first-read effect | Proposed rewrite |
|---|---|---|---|---|
| C1 | Minor | “Start for real” | The action does not name its result and remains visible after use. | “Plan my workflow” |
| C2 | Minor | “What will happen” | The heading has no subject when heard in a heading list. | “Workflow run and skip results” |
| C3 | Minor | “Ready when the workflow is” | This is metaphorical and does not describe the empty state. | “No workflow plan yet” |
| C4 | Minor | “pull-request”, “pull request”, and `pull_request` | The same event uses three forms in prose and controls. | Use “pull request” in prose and reserve `pull_request` for the literal event value. |
| C5 | Minor | “Expand all” | The control does not say what will expand. | “Expand all jobs” |
| C6 | Minor | “Use a repository workflow or name a file.” | “Repository workflow” and “name a file” do not say whether the CLI discovers or receives a path. | “Run `ghaplan` in a repository, or pass a workflow file path.” |
| C7 | Minor | “Demo edits use the `demo:workflow-source` browser-storage key.” | “browser-storage” is implementation jargon. | “Demo edits are stored in this browser under `demo:workflow-source`.” |
| C8 | Minor | “Create a registry-ready crate with `npm run pack:cli`.” | “registry-ready crate” assumes Rust publishing knowledge. | “Check the Rust release package with `npm run pack:cli`.” |

## Copy audit

Counts use whitespace-delimited rendered words. Code blocks and URLs count as
one token. Conditional empty-state and toast sentences are included.

### Landing-page sentences

| # | Words | Sentence |
|---:|---:|---|
| 1 | 14 | For developers editing workflow files who need to see jobs and steps before pushing. |
| 2 | 6 | See a pull-request workflow plan immediately. |
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
| 16 | 12 | Common GitHub events, branch and path rules, job conditions, matrices, and dependencies. |
| 17 | 13 | Secret values, runner files, remote workflows, and live GitHub state are marked unknown. |
| 18 | 8 | Plan a GitHub Actions workflow before you push. |
| 19 | 7 | Paste or open a workflow to begin. |
| 20 | 7 | Choose a workflow smaller than 1 MB. |
| 21 | 5 | Show a workflow plan first. |
| 22 | 3 | Workflow plan copied. |
| 23 | 3 | Sample plan reset. |

### README sentences

| # | Words | Sentence |
|---:|---:|---|
| 1 | 9 | ghaplan plans a GitHub Actions workflow before you push. |
| 2 | 8 | It is for developers checking a workflow file. |
| 3 | 6 | Open the browser planner at `https://gha-dry-run-planner.sociobot.in`. |
| 4 | 6 | The sample demo is at `https://gha-dry-run-planner.sociobot.in/demo`. |
| 5 | 6 | Build the command-line tool from source. |
| 6 | 6 | Rust 1.85 or newer is required. |
| 7 | 8 | Run the shipped pull-request sample from any directory. |
| 8 | 14 | The command writes its sample file to a temporary directory and prints its plan. |
| 9 | 8 | Use a repository workflow or name a file. |
| 10 | 9 | Use `ghaplan --help` for the event and input options. |
| 11 | 11 | The demo opens an isolated sample plan at `/demo` or `?demo=1`. |
| 12 | 7 | Demo edits use the `demo:workflow-source` browser-storage key. |
| 13 | 8 | Use **Reset demo** to restore the shipped sample. |
| 14 | 6 | Read the privacy policy and terms. |
| 15 | 7 | The static site is written to `dist/site`. |
| 16 | 9 | Run each command in `.factory/claims.json` after a clean checkout. |
| 17 | 8 | Create a registry-ready crate with `npm run pack:cli`. |
| 18 | 1 | MIT. |
| 19 | 2 | See LICENSE. |

### Landing headings, controls, labels, and other fragments

These are not grammatical sentences, but they are included because headings
and controls are part of the requested copy audit.

| Words | Copy | Type / flag |
|---:|---|---|
| 7 | Demo — sample data, nothing is saved | Banner; blocking state error B1 |
| 2 | Reset demo | Button |
| 3 | Start for real | Link action; C1 |
| 4 | GitHub Actions workflow planner | Eyebrow |
| 5 | Plan a GitHub Actions workflow | h1 |
| 5 | Try it with sample data | Link action |
| 3 | Plan my workflow | Link action |
| 2 | Workflow planner | Eyebrow |
| 7 | See which jobs will run or skip | h2; unlisted claim U1 |
| 2 | GitHub event | h3 |
| 5 | Describe the event to check | Supporting label |
| 1 | Event | Label |
| 2 | Base branch | Label |
| 2 | Head branch | Label |
| 6 | Changed paths — one per line | Label and hint |
| 6 | Inputs — KEY=VALUE, one per line | Label and hint |
| 5 | Pull request labels — comma-separated | Label and hint |
| 4 | Show this workflow’s plan | Button |
| 5 | Works offline after first load | Status |
| 2 | Workflow file | h3 |
| 6 | Workflow text stays in this browser | Supporting claim |
| 2 | Open file | File action |
| 2 | Workflow plan | Eyebrow |
| 3 | What will happen | h3; C2 |
| 2 | Expand all | Button; C5 |
| 5 | Copy workflow plan as JSON | Button |
| 5 | Ready when the workflow is | h4; C3 |
| 2 | Three steps | Eyebrow |
| 5 | How the workflow planner works | h2 |
| 4 | Describe the GitHub event | h3 |
| 3 | Check workflow rules | h3 |
| 4 | Read each job result | h3 |
| 2 | Command-line tool | Eyebrow |
| 6 | Use the planner from your terminal | h2 |
| 3 | Read installation notes | Link |
| 1 | Limits | Eyebrow |
| 6 | What ghaplan can and cannot evaluate | h2 |
| 4 | What ghaplan can evaluate | h3 |
| 4 | What ghaplan leaves unknown | h3 |

README headings are **ghaplan** (1), **Install** (1), **Try the sample** (3),
**CLI usage** (2), **Browser demo and privacy** (4), **Develop and verify**
(3), and **License** (1). Each makes sense in the README outline.

## Registered claim results

| Claim | Result | Evidence |
|---|---|---|
| `sample-plan` | PASS | `/demo` contained the banner, bundled workflow, two-job result, reset, and real-mode exit. |
| `demo-storage` | PASS | Demo edit/reset/exit affected `demo:workflow-source` and preserved the sentinel real key. |
| `offline-reload` | PASS | The clean local demo reloaded offline after its controlled visit; production also reloaded offline after its first visit. |
| `local-browser` | PASS | The demo planning flow emitted only same-origin requests. |
| `free-no-account` | PASS | The landing fact was present and no sign-in or payment control existed. |
| `cli-demo` | PASS | The bundled CLI sample ran from a temporary directory and printed the sample plan. |

Passing these tests does not clear B1, B2, or F3 because the current assertions
do not check banner absence, first-viewport visibility, or the unlisted claims.

## Structure and identity result

The title pattern, route-specific descriptions and canonicals, OG/Twitter
metadata, local favicon and touch icon, sitemap, deep links, shared header and
footer, Privacy/Terms links, one exposed h1 per route, no-dead-link crawl, and
console checks pass. Back navigation changes the URL correctly but fails focus
restoration (F4). The unknown route is designed but reports the wrong status
(F5).

The glacial ceramic treatment is distinct rather than a generic SaaS template:
the original porcelain workflow tray, mineral status marks, cool stone palette,
irregular slab shapes, and rail-based plan hierarchy match `.factory/design.md`.
The identity itself passes.
