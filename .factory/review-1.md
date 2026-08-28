# Adversarial first-read review 1

**Product:** ghaplan / gha-dry-run-planner  
**Reviewed:** 2026-08-28  
**Verdict:** **FAIL**

The product has four blocking findings. It is visually distinct and its existing
planner works, but a first-time visitor cannot enter a declared, isolated demo;
claims have no registry or tests; required legal/demo routes are absent; and the
first screen does not identify its audience in plain words.

## Method and observed evidence

- Opened the live site in new Playwright contexts at 390×844 and 1440×900 before
  scrolling. No console or page errors occurred.
- Pressed **Plan a workflow** in a fresh context. The built-in, prefilled
  pull-request workflow produced a plan with two jobs, four cells, and eight
  steps. This is useful sample-like content, but it is not labelled or isolated
  as a demo.
- Requested `/demo`, `/?demo=1`, `/privacy`, `/terms`, and `/not-a-real-route`.
  Each returned the same 8,725-byte landing document with the same title and
  h1. `robots.txt` returns 200; `/sitemap.xml` is missing and falls back to the
  landing HTML.
- Ran `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and
  `node scripts/a11y-audit.mjs https://gha-dry-run-planner.sociobot.in` from
  this clean worktree. All passed. The a11y smoke test reported zero
  serious/critical Axe findings, no console errors, no horizontal overflow, and
  a successful offline reload. The production JS is 21.58 kB gzip.
- Checked a fresh live context after the first load with network set offline.
  The service worker served a 200 reload. In the `?demo=1` planning flow, all
  four requests were same-origin (document, JS, CSS, hero image) and both
  `localStorage` and `sessionStorage` were empty before and after planning.
  This is an observation, not a substitute for a claim test or demo sandbox.
- Ran `/work/repo/target/release/ghaplan --demo` from a new `mktemp -d`
  directory. It exited with `error: unexpected argument '--demo' found`.
- Crawled all live anchors. The five same-page fragments existed and the three
  GitHub repository links returned 200. No dead published anchor was found.

## Cold first screen

At both viewport sizes, before scrolling, I understood this as a browser tool
that predicts which GitHub Actions workflow parts would run without running
them. I could infer the action: click **“Plan a workflow”**. I could **not**
answer who it is for from the first screen without inferring that the visitor is
a developer from the technical nouns.

The text that fails to name the audience is:

> “Give ghaplan a workflow and a synthetic event. It traces triggers, filters,
> conditions, matrices, and dependencies—without executing a single step.”

The headline, **“Know the plan before the push.”**, is six words but does not
name GitHub Actions, a workflow, or a user. The first screen also offers no
**“Try it with sample data”** action or adjacent explanation of what a visitor
will see after trying it.

## Findings

### B1 — No one-click demo or isolated demo sandbox

**Quote / evidence:** The only hero actions are **“Plan a workflow”** and
`cargo install --path .`; there is no **“Try it with sample data”** text in the
live document. `/demo` and `/?demo=1` render the ordinary landing page. Neither
contains **“Demo — sample data, nothing is saved”**, **“Reset demo”**, or
**“Start for real”**. `ghaplan --demo` is not implemented.

**Why this loses or misleads a first-time visitor:** The normal form happens to
contain sample-looking YAML, but the visitor is never told that it is sample
data, never sees a result until submitting a form, and cannot tell whether
editing it will affect real work. A verifier also has no stable sandbox entry
point. The CLI product has no shipped demo command or `examples/` sample.

**Concrete fix:** Add a first-screen button labelled **“Try it with sample
data”** with adjacent text **“See a pull-request workflow plan immediately.”**
It must navigate to `/demo` or `?demo=1`, auto-render the realistic workflow
and event result, and display a persistent **“Demo — sample data, nothing is
saved”** banner with **“Reset demo”** and **“Start for real”**. Use a distinct
`demo:` storage namespace and verify that it cannot read or write real state.
For the CLI, ship `ghaplan demo`/`--demo` plus an `examples/` workflow and run it
in a temp directory. Add `.factory/demo.md` documenting the URL/command,
sample, reset behaviour, and namespace.

### B2 — Claims are unlisted and therefore untestable

**Quote / evidence:** `.factory/claims.json` does not exist, and `rg
'@claim:'` found no tagged tests. Consequently there were zero listed claim
tests to run from the clean worktree. The following visitor-relevant live and
README claims are unlisted:

| Unlisted claim-like copy | Where |
|---|---|
| “No runner. No push. No surprise.” | hero |
| “Your workflow never leaves this tab.” | hero |
| “Every branch accounted for.” | hero art caption |
| “Planning happens entirely in your browser.” | planner |
| “Works offline after first load” | planner |
| “YAML stays on this device” | workflow panel |
| “JSON output is stable for automation.” | CLI section |
| “Unknown is shown explicitly, never guessed.” | limits |
| “No analytics · no uploads” | footer |
| “It does not execute `run:`, load actions, read secrets, contact GitHub, or fetch reusable workflows.” | README |
| “It has no runtime CDNs, tracking, accounts, cookies, or server.” | README |
| “The Rust CLI has no telemetry.” | README |

**Why this loses or misleads a first-time visitor:** Privacy, offline support,
scope, and fidelity are exactly the promises someone may rely on before
pasting workflow code. Observing same-origin requests and an offline reload
once is insufficient: none is repeatable through the required clean demo
entry point.

**Concrete fix:** Create `.factory/claims.json`, list every retained claim with
one `@claim:<id>` test, and run every listed command in CI. For example:
`offline-reload` must load `/demo`, wait for the service worker, set the
context offline, and reload; `local-only-demo` must intercept the full demo
flow and assert same-origin requests only; a planner-result claim must assert
the seeded workflow's observable run/skip results. Remove “Every branch
accounted for” unless its scope is defined and tested.

### B3 — Required routes, legal links, 404, and metadata are absent

**Quote / evidence:** The header contains **“Planner / Install / Limits /
Source”**; the footer contains **“GitHub / Fidelity / No analytics · no
uploads”**. Neither contains Privacy or Terms. Direct requests to `/demo`,
`/privacy`, `/terms`, and `/not-a-real-route` all return the landing page, with
title **“ghaplan — GitHub Actions dry-run planner”** and h1 **“Know the plan
before the push.”** The head has an SVG favicon, description, and title, but
no canonical link, Open Graph/Twitter tags, OG image, or 180px Apple touch
icon. `/sitemap.xml` is landing HTML rather than a sitemap.

**Why this loses or misleads a first-time visitor:** The privacy promise has no
policy page to confirm it. A pasted `/privacy` or `/demo` URL does not identify
the intended destination, and an invalid URL pretends to be the product home
instead of providing a designed recovery route. Browser history changes only
hashes, so there is no route-change focus/title/announcement behaviour to
verify.

**Concrete fix:** Implement real `/demo`, `/privacy`, `/terms`, and designed
`/404` routes with deep-link reload support. Give each a correct route title
(for example, **“Privacy — ghaplan”**) and focus/announce its h1 on navigation.
Add Privacy and Terms in the shared header/footer, a build/version identifier,
canonical and OG/Twitter metadata with a 1200×630 product image, an Apple
touch icon, and a real sitemap listing every route.

### B4 — The first screen does not name the user or job plainly

**Quote:** **“Know the plan before the push.”** and **“Give ghaplan a workflow
and a synthetic event.”**

**Why this loses or misleads a first-time visitor:** A visitor unfamiliar with
the name has to decode “plan,” “workflow,” and “synthetic event.” The screen
does not say “GitHub Actions” in the headline or say “developers editing
workflow files,” so the required audience answer is inference rather than
copy.

**Concrete fix:** Replace the h1 with **“Plan a GitHub Actions workflow”** and
use the 16-word lede **“For developers editing workflow files who need to see
jobs and steps before pushing.”** Keep one real action beside the sample action:
**“Plan my workflow”**.

### M1 — Landing copy relies on jargon and contextless headings

**Quote:** **“The quiet path to certainty”**, **“Static answers, useful
reasons.”**, **“Understood”**, **“Left unknown”**, and **“The same question,
right beside your code.”**

**Why this loses a first-time visitor:** These headings do not state what the
section contains when read in a screen-reader heading list. The adjacent copy
uses GitHub-specific terms before it says who needs them.

**Concrete fix:** Use **“How the workflow planner works”**, **“Why a job will
run or skip”**, **“What ghaplan can evaluate”**, **“What ghaplan leaves
unknown”**, and **“Use the planner from your terminal.”**

## Copy audit

Counts are whitespace-delimited prose tokens. The two tables include every
complete static sentence in the landing document and README, including
conditional empty/error/toast text; labels, code examples, and headings without
sentence punctuation are audited in the fragments table below.

### Landing sentences

| # | Words | Sentence |
|---:|---:|---|
| 1 | 2 | No runner. |
| 2 | 2 | No push. |
| 3 | 2 | No surprise. |
| 4 | 6 | Know the plan before the push. |
| 5 | 8 | Give ghaplan a workflow and a synthetic event. |
| 6 | 12 | It traces triggers, filters, conditions, matrices, and dependencies—without executing a single step. |
| 7 | 3 | Local by design. |
| 8 | 6 | Your workflow never leaves this tab. |
| 9 | 4 | Every branch accounted for. |
| 10 | 3 | Shape the event. |
| 11 | 3 | Read the outcome. |
| 12 | 7 | Paste YAML or open a local file. |
| 13 | 6 | Planning happens entirely in your browser. |
| 14 | 7 | Your explained workflow plan will appear here. |
| 15 | 6 | Press “Plan workflow” or ⌘ ↵. |
| 16 | 4 | Static answers, useful reasons. |
| 17 | 10 | Choose an event, branch, changed paths, labels, and dispatch inputs. |
| 18 | 11 | Trigger filters, expressions, matrices, and the needs graph are evaluated locally. |
| 19 | 12 | Run, skip, and unknown outcomes include the reason—not just a colored light. |
| 20 | 7 | The same question, right beside your code. |
| 21 | 13 | The typed Rust library and single binary fit scripts, pre-commit hooks, and editors. |
| 22 | 6 | JSON output is stable for automation. |
| 23 | 5 | A planner, not a runner. |
| 24 | 24 | Common push, pull request, dispatch, schedule, and merge-group triggers; ordered branch/path filters; core expression functions; matrix include/exclude; needs; env; inputs; referenced secrets and permissions. |
| 25 | 15 | Secret values, live concurrency state, hashFiles(), remote reusable workflows, composite-action internals, and runner filesystem state. |
| 26 | 6 | Unknown is shown explicitly, never guessed. |
| 27 | 2 | Plan locally. |
| 28 | 2 | Push deliberately. |
| 29 | 7 | Paste or open a workflow to begin. |
| 30 | 7 | Choose a workflow smaller than 1 MB. |
| 31 | 4 | Plan a workflow first. |
| 32 | 3 | Plan JSON copied. |
| 33 | 3 | Install command copied. |
| 34 | 4 | That YAML needs attention. |

### README sentences

| # | Words | Sentence |
|---:|---:|---|
| 1 | 25 | ghaplan explains which GitHub Actions workflows, jobs, matrix cells, and steps will run for a synthetic event—without Docker, runner setup, command execution, or a push. |
| 2 | 27 | It is for developers editing `.github/workflows` who need quick answers about triggers, ordered branch/path filters, `if:` expressions, matrix expansion, needs ordering, expression values, permissions, and referenced secrets. |
| 3 | 18 | The static browser planner runs at the listed site; workflow text stays in the tab and no analytics are collected. |
| 4 | 10 | At job level, ghaplan models GitHub’s implicit `success()` dependency gate. |
| 5 | 23 | An explicit status check such as `if: always()` is evaluated against the `needs` results, so cleanup jobs can run after a skipped dependency. |
| 6 | 6 | Rust 1.85 or newer is supported. |
| 7 | 18 | The factory owns publishing credentials; this repository is ready for `cargo package` but the worker does not publish. |
| 8 | 11 | Repeat `--paths`, `--label`, and `--input`, or use comma-separated paths and labels. |
| 9 | 13 | `--strict` exits with code 2 for undecidable expressions as well as invalid workflows. |
| 10 | 19 | Normal mode exits 0 for a valid plan even when something is explicitly unknown, and 2 for input/YAML errors. |
| 11 | 7 | `ghaplan --help` lists all events and flags. |
| 12 | 7 | Human output gives each decision and reason. |
| 13 | 8 | The public surface is intentionally small and typed. |
| 14 | 9 | `evaluate(expression, context)` is also exported for isolated expression inspection. |
| 15 | 12 | Both APIs return known, unknown, or error states rather than inventing values. |
| 16 | 8 | ghaplan is a static planner, not a runner. |
| 17 | 15 | It does not execute `run:`, load actions, read secrets, contact GitHub, or fetch reusable workflows. |
| 18 | 35 | It models common `push`, `pull_request`, `pull_request_target`, `workflow_dispatch`, `schedule`, `merge_group`, and `workflow_run` entry points; ordered branch and path patterns; core operators/functions; `github`, `inputs`, `matrix`, `needs`, and `env` contexts; Cartesian matrices with include/exclude; and the needs DAG. |
| 19 | 21 | Runner-derived state, `hashFiles()`, secret values, dynamic remote workflows, composite-action internals, live concurrency cancellation, and obscure `workflow_run` payload corners are declared unknown. |
| 20 | 13 | GitHub has undocumented edge cases, so compare high-risk release rules against GitHub’s documentation. |
| 21 | 10 | The site uses Vite, vanilla TypeScript, and one YAML parser. |
| 22 | 10 | It has no runtime CDNs, tracking, accounts, cookies, or server. |
| 23 | 6 | The Rust CLI has no telemetry. |
| 24 | 1 | MIT. |
| 25 | 2 | See LICENSE. |

### Flagged copy findings and proposed replacements

Each row is a separate copy finding. “Jargon” is flagged where a cold visitor
must know GitHub Actions internals before receiving the benefit.

| ID | Severity | Quote | Flag | Proposed replacement |
|---|---|---|---|---|
| C1 | Blocking (B4) | “Know the plan before the push.” | Does not name product job or audience. | “Plan a GitHub Actions workflow.” |
| C2 | Minor | “Give ghaplan a workflow and a synthetic event.” | “Synthetic event” is unexplained jargon. | “Choose the GitHub event you want to check.” |
| C3 | Minor | “It traces triggers, filters, conditions, matrices, and dependencies…” | Dense jargon list. | “It shows which workflows, jobs, and steps will run or skip.” |
| C4 | Minor | “Every branch accounted for.” | Absolute, untested marketing claim. | Remove, or “Shows the branches and paths you enter.” |
| C5 | Minor | “Static answers, useful reasons.” | Contextless heading. | “Why each job will run or skip.” |
| C6 | Minor | “The quiet path to certainty” | Metaphorical/contextless heading. | “How the planner works.” |
| C7 | Minor | “The same question, right beside your code.” | Contextless heading. | “Run the planner in your terminal.” |
| C8 | Minor | “Understood” / “Left unknown” | Headings make no sense in isolation. | “What ghaplan can evaluate” / “What ghaplan leaves unknown.” |
| C9 | Minor | 24-word “Common push, pull request…” sentence | Over 22 words and dense jargon. | “It checks common GitHub events, branch and path rules, job conditions, matrices, and dependencies.” |
| C10 | Minor | “The typed Rust library and single binary fit scripts, pre-commit hooks, and editors.” | Rust/binary/pre-commit jargon on the landing page. | “Use the command-line tool in scripts or your editor.” |
| C11 | Minor | “JSON output is stable for automation.” | Unsupported claim and jargon. | “Copy the plan as JSON.” (only if that output is tested) |
| C12 | Minor | README sentence 1 (25 words) | Over 22 words and starts with implementation detail. | “ghaplan shows which GitHub Actions jobs and steps will run before you push.” |
| C13 | Minor | README sentence 2 (27 words) | Over 22 words and glossary-like jargon dump. | “It is for developers checking a workflow before they push a change.” |
| C14 | Minor | README sentence 5 (23 words) | Over 22 words and advanced jargon. | “`if: always()` can run cleanup after a skipped job.” |
| C15 | Minor | README sentence 18 (35 words) | Over 22 words; feature dump. | Split into short supported-events and supported-rules lists. |
| C16 | Minor | Button “Plan a workflow” | It names an action but not the immediate result. | “Show this workflow’s plan.” |
| C17 | Minor | Button “Copy JSON” | Result is ambiguous before a plan exists. | “Copy workflow plan as JSON.” |
| C18 | Minor | Error “That YAML needs attention” | Does not say what failed or the next action; the parser reason alone is insufficient. | “Fix the YAML error below, then plan again.” |

### UI fragments checked

The following are not complete sentences but affect first-read clarity:

| Fragment | Check |
|---|---|
| “Build the synthetic payload” | Replace with “Describe the GitHub event”; “payload” is jargon. |
| “YAML stays on this device” | Privacy claim; add to claims registry. |
| “Live planner” / “PLAN” / “CLI” | Understandable labels, but “Live” could imply a GitHub connection; use “Workflow planner.” |
| “No analytics · no uploads” | Privacy claims; add to claims registry and link Privacy. |
| “Fidelity” | Footer link label hides its destination; use “Limits.” |
| `cargo install --path .` with “Copy” | A developer command, not the required sample-demo action. |

## Structure, accessibility, and identity checks

| Check | Result |
|---|---|
| Title pattern on `/` | Pass: `ghaplan — GitHub Actions dry-run planner` is descriptive and under 60 characters. |
| One h1, lang, landmarks, labels, image alt, focus/touch smoke test | Pass in the live accessibility script. |
| Meta description / SVG favicon / theme colour / CSP/security headers | Present. |
| Canonical, OG/Twitter card, real 1200×630 OG image, Apple touch icon | Fail: absent. |
| `robots.txt` | Pass. |
| Sitemap | Fail: `/sitemap.xml` falls back to `index.html`. |
| `/demo`, `/privacy`, `/terms`, designed 404, route titles | Fail: all route requests render home. |
| Deep links, back button, route-change focus/announcement | Fail/not applicable: only hash navigation exists; no real route state. |
| Header/footer Privacy + Terms + build id | Fail: neither legal link exists and no build identifier is shown. |
| Dead published links | Pass: all anchors resolve (same-page fragments exist; repository links return 200). |
| Visual identity | Pass: the porcelain/glacial art, mineral markers, restrained palette, and system type are distinct from a generic SaaS template and align with `.factory/design.md`. |

## Required re-review evidence

Re-review only after the project provides a `claims.json` and `demo.md`, a
working `/demo`/CLI demo, real Privacy/Terms/404 routes, route metadata and
sitemap, and claim tests run from a fresh demo context. Include screenshots of
the first screen and immediately-rendered demo result, an intercepted-network
test, storage namespace assertions, offline reload test, and the output of
every claims command.
