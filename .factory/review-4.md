# Adversarial first-read review 4

**Product:** ghaplan / gha-dry-run-planner  
**Reviewed:** 2026-08-28  
**Live URL:** <https://gha-dry-run-planner.sociobot.in>  
**Candidate:** `caf5cd2cee132e4c39a5f526b0bc733d80de664f`  
**Verdict:** **PASS**

No finding remains. The cold first screen identifies the job, audience, and
first action at both requested widths. The sample is one click away and
result-first. Every registered claim passed independently from a clean clone,
no claim-like sentence is unlisted, and every earlier finding remains fixed in
production and code.

## Cold first read

I opened production in fresh Chromium contexts at 390×844 and 1440×900 before
scrolling or setting storage.

- **What does this do?** It shows which GitHub Actions jobs and steps will run
  or skip before the workflow is pushed.
- **For whom?** Developers editing GitHub Actions workflow files.
- **What should I click first?** **Try it with sample data**.

The exact supporting copy is **“Plan a GitHub Actions workflow”**, **“For
developers editing workflow files who need to see jobs and steps before
pushing.”**, **“Try it with sample data”**, and **“See a pull request workflow
plan immediately.”**

At 390px the primary action ends at y=498 and the three facts end at y=685,
inside the 844px viewport. At desktop width the facts end at y=729 inside the
900px viewport. No blocking first-screen finding applies.

## Findings

None.

## Copy audit

Counts are whitespace-delimited rendered words. The landing list includes
authored interaction states because a first-time visitor can encounter them.
Code examples and generated plan reasons are data, not landing sentences. No
sentence exceeds 22 words, no banned marketing adjective appears, and no term
or result-action flag remains.

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
| 10 | 9 | Choose an event, branches, changed paths, labels, and inputs. |
| 11 | 15 | The planner checks when the workflow starts, each job rule, job variants, and job order. |
| 12 | 9 | Each run, skip, or unknown result includes a reason. |
| 13 | 14 | Run the command from a shell script, a Git hook, or your code editor. |
| 14 | 13 | Checks pushes, pull requests, manual runs, schedules, merge queues, and completed workflow runs. |
| 15 | 14 | It also checks branch and path rules, job rules, job variants, and job order. |
| 16 | 13 | Secret values, runner files, remote workflows, and live GitHub state are marked unknown. |
| 17 | 8 | Plan a GitHub Actions workflow before you push. |
| 18 | 7 | Your explained workflow plan will appear here. |
| 19 | 8 | Press “Show this workflow’s plan” or ⌘ ↵. |
| 20 | 7 | Paste or open a workflow to begin. |
| 21 | 7 | Choose a workflow smaller than 1 MB. |
| 22 | 5 | Show a workflow plan first. |
| 23 | 3 | Workflow plan copied. |
| 24 | 3 | Sample plan reset. |
| 25 | 8 | Fix the YAML error below, then plan again. |
| 26 | 10 | No jobs are planned because the workflow trigger is skip. |
| 27 | 5 | Offline — planner still works. |

The head copy is also within the limit: **“Plan a GitHub Actions workflow
before you push.”** (8), **“See which jobs and steps will run or skip in your
browser.”** (12), and the social description **“See which GitHub Actions jobs
and steps will run before you push.”** (12).

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
| 9 | 9 | Use `ghaplan -` when another command provides the workflow. |
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

### Headings, actions, and terminology

The heading outline makes sense without surrounding text: **Plan a GitHub
Actions workflow**, **See which jobs will run or skip**, **Workflow run and
skip results**, **How the workflow planner works**, **Use the planner from your
terminal**, and the two explicit capability headings.

Every action begins with a result-naming verb: **Try it with sample data**,
**Plan my workflow**, **Show this workflow’s plan**, **Open file**, **Expand all
jobs**, **Copy workflow plan as JSON**, **Reset demo**, **Read installation
notes**, and **Return to the planner**. The README consistently uses
**command-line**. Prose uses **pull request** while controls use the literal
`pull_request` event value. GitHub Actions, YAML, matrix, and `needs` occur only
where the developer audience or source format makes them necessary.

## Demo and sandbox

The landing action opens `/demo` in one click. The first 390×844 demo viewport
already contains **“Workflow RUN · 2 jobs · 4 cells · 8 steps”** at y=456 and
an explained job ending at y=642. The desktop result ends at y=662 inside the
900px viewport. The sample is a realistic pull-request workflow with a matrix,
dependent preview job, steps, permissions, and a referenced secret.

The persistent banner says **“Demo — sample data, nothing is saved”** and
provides **Reset demo** and **Plan my workflow**. During a fresh live run:

- editing wrote only `demo:workflow-source`;
- a seeded `real:sentinel=untouched` value survived edit, reset, and exit;
- Reset restored the bundled sample;
- exit removed the demo key, hid the banner, and returned to `/`;
- real mode made no storage write;
- request interception after the controlled load observed zero requests while
  editing and planning;
- the service-worker-controlled demo reloaded offline; and
- the CLI demo claim ran from an empty temporary directory, checked the
  reported sample path and bytes, printed the plan, and left its caller
  directory empty.

## Claims

I cloned commit `caf5cd2` to `/tmp/ghaplan-review4-clean-UinYmB`, ran `npm ci`,
and ran all 21 `test` commands from `.factory/claims.json` independently. Each
claim ID also maps to exactly one tagged test.

| Claim | Result | Observable evidence |
|---|---|---|
| `sample-plan` | PASS | The summary and explained job were in both first viewports. |
| `demo-storage` | PASS | Demo reset/exit removed only `demo:` data and preserved the real sentinel. |
| `offline-reload` | PASS | The controlled demo reloaded after the browser went offline. |
| `local-browser` | PASS | Editing and planning emitted zero requests after load. |
| `free-no-account` | PASS | Free/no-account copy was present; sign-in and payment controls were absent. |
| `workflow-decisions` | PASS | Pull-request and push workflow, job, and step decisions matched. |
| `event-filters` | PASS | Matching and rejected branch/path cases matched. |
| `expressions` | PASS | True and false job and step conditions matched. |
| `matrix-expansion` | PASS | Include/exclude produced the exact four expected cells. |
| `dependencies` | PASS | Implicit skip and `always()` cleanup behavior matched. |
| `decision-reasons` | PASS | Run, skip, and unknown results had specific reasons. |
| `unknown-sources` | PASS | Secrets, runner files, remote workflows, concurrency, and workflow-run state produced warnings. |
| `supported-events` | PASS | Every browser event option produced a matching workflow plan. |
| `browser-file-input` | PASS | A local YAML file planned without a network request. |
| `json-export` | PASS | Clipboard JSON parsed and contained workflow, jobs, and matrix cells. |
| `cli-demo` | PASS | The temporary sample path, bytes, output, and caller isolation matched. |
| `cli-input` | PASS | Repository discovery, named file, pipe input, and help matched. |
| `site-build-output` | PASS | The complete static site appeared in `dist/site`. |
| `cli-package` | PASS | The versioned Rust crate archive was created. |
| `mit-license` | PASS | LICENSE, footer, Terms, README, and Cargo metadata agreed. |
| `cli-install` | PASS | The documented source install produced a working version and demo. |

The live landing, route metadata, Privacy, Terms, and README were
cross-checked against the registry. There is no unlisted claim-like sentence
and no untested registered claim.

## Earlier-finding verification

I read all three earlier reviews, both polish records, and the prior handoff.
“PASS” below means the current production behavior and corresponding code or
test were checked again; it does not repeat the repair record as evidence.

### Review 1

| Earlier ID | Result | Current verification |
|---|---|---|
| B1 | PASS | `/demo`, `?demo=1`, banner, reset/exit, `demo:` storage, bundled CLI demo, and `demo.md` work. |
| B2 | PASS | All 21 registered claims have one tagged test and passed independently. |
| B3 | PASS | Demo/legal/404 routes, metadata, sitemap, shared chrome, status codes, focus, and legal links pass. |
| B4 | PASS | Both first screens state the job, audience, sample action, expected result, and three facts. |
| M1 | PASS | Workflow, result, terminal, capability, and limit headings make sense in isolation. |
| C1 | PASS | The headline is “Plan a GitHub Actions workflow.” |
| C2 | PASS | “Synthetic event” is absent from visitor copy. |
| C3 | PASS | The first screen names jobs and steps. |
| C4 | PASS | “Every branch accounted for” is absent. |
| C5 | PASS | The result heading names workflow run and skip results. |
| C6 | PASS | The how-it-works heading names the workflow planner. |
| C7 | PASS | The terminal heading names the planner and context. |
| C8 | PASS | The capability and unknown headings name ghaplan. |
| C9 | PASS | Capability copy is split into 13- and 14-word sentences. |
| C10 | PASS | Terminal copy explicitly names a shell script, Git hook, and code editor. |
| C11 | PASS | JSON copy has a concrete label and observable clipboard test. |
| C12 | PASS | The README introduction is nine words. |
| C13 | PASS | The README audience sentence is eight words. |
| C14 | PASS | The former long status-check explanation remains absent. |
| C15 | PASS | The former long README feature dump remains absent. |
| C16 | PASS | The planner action is “Show this workflow’s plan.” |
| C17 | PASS | The export action is “Copy workflow plan as JSON.” |
| C18 | PASS | YAML failure copy identifies the problem and directs another attempt. |
| UI fragments | PASS | Payload/live/fidelity jargon remains absent; privacy text is registered and the demo action is primary. |

### Review 2

| Earlier ID | Result | Current verification |
|---|---|---|
| B1 | PASS | The banner is absent on real routes, present on demo, absent after exit, and does not affect real data. |
| B2 | PASS | The summary and first explained job remain inside both first viewports. |
| F3/U1 | PASS | `workflow-decisions` covers general workflow, job, and step outcomes. |
| F3/U2 | PASS | Event, filter, expression, matrix, dependency, and supported-event claims remain separate and pass. |
| F3/U3 | PASS | `decision-reasons` verifies run, skip, and unknown explanations. |
| F3/U4 | PASS | `cli-input` verifies repository discovery, a file path, piped input, and help. |
| F3/U5 | PASS | `unknown-sources` verifies every listed unknown category. |
| F3/U6 | PASS | The unverified minimum-Rust statement remains absent. |
| F3/U7 | PASS | `cli-demo` verifies the path, sample bytes, output, and empty caller directory. |
| F3/U8 | PASS | `site-build-output` verifies the documented output. |
| F4 | PASS | Browser Back and Forward focus and announce the active route H1. |
| F5 | PASS | Known routes return 200; missing paths and `/404.html` return 404. |
| F6 | PASS | Every visible interactive target measured at least 44px at 390px. |
| C1 | PASS | Demo exit says “Plan my workflow.” |
| C2 | PASS | The result heading says “Workflow run and skip results.” |
| C3 | PASS | The empty-state heading says “No workflow plan yet.” |
| C4 | PASS | Prose uses “pull request”; only literal values use `pull_request`. |
| C5 | PASS | Expand/collapse controls name jobs. |
| C6 | PASS | README distinguishes repository discovery from a file path. |
| C7 | PASS | README describes the demo key in plain words. |
| C8 | PASS | README says “Check the Rust release package.” |

### Review 3

| Earlier ID | Result | Current verification |
|---|---|---|
| F-3-1 / review-1 B3 | PASS | Both 404 paths have shared chrome, complete metadata, requested-path canonicals, and HTTP 404. |
| F-3-2 | PASS | Every tested route has exactly one H1 in the document. |
| F-3-3 | PASS | `mit-license` is registered and passed. |
| F-3-4 | PASS | `cli-install` is registered and passed. |
| F-3-5 | PASS | Workflow-rule copy uses plain job-rule language. |
| F-3-6 | PASS | Event copy uses pushes, manual runs, merge queues, and completed workflow runs. |
| F-3-7 | PASS | The terminal copy specifies a Git hook. |
| F-3-8 | PASS | README explains piped input through what the other command does. |
| F-3-9 | PASS | “Command-line” is consistent across landing and README. |
| F-3-10 | PASS | Every GitHub link has a visible `↗` and accessible external-link suffix. |

## Structure, accessibility, and identity

| Check | Result |
|---|---|
| Titles | PASS — `ghaplan — Plan GitHub Actions workflows`, `Demo — ghaplan`, `Privacy — ghaplan`, `Terms — ghaplan`, and `Page not found — ghaplan`. |
| Document structure | PASS — `lang=en`, one H1, ordered headings, header/nav/main/footer, skip link, labels, and alt text. |
| Metadata | PASS — route descriptions/canonicals, OG/Twitter fields, manifest, SVG favicon, 180×180 touch icon, and local 1200×630 social image. |
| Routes and history | PASS — deep links reload, Back/Forward restore H1 focus, and route changes announce the title and heading. |
| 404 | PASS — both `/404.html` and arbitrary missing paths return the designed page with HTTP 404 and a planner return action. |
| Crawl | PASS — every published HTTP destination returned its expected status and every fragment target existed. |
| Shared chrome | PASS — all six checked routes have identical header/footer links, Privacy, Terms, factory credit, and build ID. |
| Security/privacy | PASS — same-origin CSP, `nosniff`, no-referrer, permissions policy, no runtime third-party script/font, and zero planning requests. |
| Accessibility | PASS — zero serious/critical Axe findings in light and dark/reduced-motion modes, visible focus, no overflow, and 44px targets. |
| Payload | PASS — main JavaScript is 64.63 kB raw / 22.53 kB gzip. |
| Identity | PASS — porcelain workflow art, glacial palette, irregular slabs, mineral status marks, and rail hierarchy match `.factory/design.md` and are not a generic SaaS template. |

The production `index.html`, `404.html`, JavaScript, CSS, and referenced hero
asset matched the clean local build by SHA-256 during the live audit.

## Missed leverage

No missing AI, import/export, or sync feature is implied. The browser already
opens local workflow files and exports the plan as JSON; the CLI supports
repository discovery, file input, and pipes. Cloud sync would conflict with
the local privacy model. An AI explanation layer would make deterministic
workflow decisions less auditable and is not needed for the stated job.

## Verification summary

- `npm ci`: passed with zero vulnerabilities.
- Every one of the 21 claim commands: passed independently.
- `npm test`: 7 Rust tests, 1 doctest, 5 Vitest tests, and 30 Playwright tests passed.
- `npm run typecheck`: passed.
- `npm run build`: produced the release CLI and `dist/site`.
- Live all-route audit and link crawl: passed.
- Live Axe in light and dark/reduced-motion modes: zero serious/critical findings.
- Live offline reload: passed.
- Console errors and horizontal overflow: zero.

## What would make this perfect

Nothing remains within the brief, factory contract, or review checklist. A new
feature should require new user evidence rather than being added to manufacture
work after a zero-finding review.
