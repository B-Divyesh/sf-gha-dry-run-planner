# Perfection loop round 3 — finding map

**Reviewed candidate:** `82b919c2a27f6cb2012f381b29af253adf3e91aa`

**Review report:** `57cdde31d33e5c291bc82815763afa5ff4623871`

**Repair commits:** `0f8aefd`, `bd2eda1`

**Deployment:** `c8a7ca6b-2d76-4593-af14-2280fc31289e`

**Live URL:** <https://gha-dry-run-planner.sociobot.in>

Evidence files:

- Mobile home: `.factory/evidence/polish-3/live-home-mobile-viewport.png`
- Desktop home: `.factory/evidence/polish-3/live-home-desktop-viewport.png`
- Mobile demo: `.factory/evidence/polish-3/live-demo-mobile.png`
- Desktop demo: `.factory/evidence/polish-3/live-demo-desktop.png`
- Mobile 404: `.factory/evidence/polish-3/live-404-mobile.png`
- Machine-readable live audit: `.factory/evidence/polish-3/live-check.json`
- Axe summary: `.factory/evidence/polish-3/a11y-live.json`
- Lighthouse summary: `.factory/evidence/polish-3/lighthouse-summary.json`

## Review 3

| Finding | Change made | Evidence |
|---|---|---|
| F-3-1 / review-1 B3 | Rebuilt `404.html` through Vite and mounted its header/footer from the same `chrome.ts` source as the app. Added manifest, OG, Twitter, icons, route-specific canonical handling, full navigation, footer links, and build line. | `every route uses the same header and footer links`; `unknown routes and the 404 document return a designed HTTP 404`; `live-check.json` records identical chrome, complete metadata, requested-path canonicals, and 404 statuses for both paths. |
| F-3-2 | Inactive route titles are H2 elements. Routing promotes only the active title to H1 and demotes the previous title. | `routes set titles, descriptions, canonicals, social metadata, and exactly one h1`; all six live routes report `h1Count: 1`; all-route Axe audit agrees. |
| F-3-3 | Added `mit-license` to `claims.json`. Its test checks the MIT grant/warranty, README, Cargo metadata, footer, and Terms link. | `@claim:mit-license`; passed alone from the clean clone and inside `npm test`. |
| F-3-4 | Added `cli-install`. It runs the documented `cargo install --path .` into a temporary root, then checks version, demo output, and an untouched caller directory. | `@claim:cli-install`; passed alone from the clean clone and inside `npm test`. |
| F-3-5 | Replaced the evaluator jargon list with “The planner checks when the workflow starts, each job rule, job variants, and job order.” | `.factory/copy-audit.md`; live home screenshots. |
| F-3-6 | Replaced API shorthand with “Checks pushes, pull requests, manual runs, schedules, merge queues, and completed workflow runs.” | `.factory/copy-audit.md`; `@claim:supported-events`; live home. |
| F-3-7 | Replaced ambiguous “hooks” copy with “Run the command from a shell script, a Git hook, or your code editor.” | `.factory/copy-audit.md`; live home. |
| F-3-8 | README now says “Use `ghaplan -` when another command provides the workflow.” | README; `@claim:cli-input`. |
| F-3-9 | README now uses “Command-line usage,” matching “Command-line tool” on the site. | README and `.factory/copy-audit.md`. |
| F-3-10 | Every GitHub link now has a visible `↗` and a screen-reader-only “(external link)” suffix. | `every off-origin link is visibly and accessibly marked as external`; `live-check.json` records all external markers and the crawl returns 200. |

## Review 2 revalidation

| Finding | Change retained or completed | Evidence |
|---|---|---|
| B1 | Demo banner is restricted to `/demo` and `/?demo=1`; reset/exit clear only `demo:` keys; exit is **Plan my workflow**. | `demo banner appears only in demo mode and leaves cleanly`; `@claim:demo-storage`; live audit shows banner hidden after exit and the real sentinel unchanged. |
| B2 | Demo remains result-first. | `@claim:sample-plan`; live mobile summary y=456 and first job bottom=642 within 844px; desktop bottom=662 within 900px. |
| F3 / U1 | General workflow, job, and step decisions are registered. | `@claim:workflow-decisions`. |
| F3 / U2 | Event filters, expressions, matrix rules, dependencies, and supported events have separate claims. | `@claim:event-filters`, `@claim:expressions`, `@claim:matrix-expansion`, `@claim:dependencies`, `@claim:supported-events`. |
| F3 / U3 | Run, skip, and unknown explanations are asserted. | `@claim:decision-reasons`. |
| F3 / U4 | Repository discovery, named paths, piped input, and help are asserted. | `@claim:cli-input`. |
| F3 / U5 | Each listed unknown source is asserted. | `@claim:unknown-sources`. |
| F3 / U6 | The unverified minimum-Rust statement remains removed. | README and copy audit. |
| F3 / U7 | CLI demo path, sample bytes, output, and caller isolation are asserted. | `@claim:cli-demo`. |
| F3 / U8 | The documented `dist/site` output is asserted. | `@claim:site-build-output`; clean build. |
| F4 | Back and Forward focus the new route H1. | `browser Back and Forward restore route heading focus`; live audit records Privacy then home H1 focus. |
| F5 | Known routes return 200; missing paths and `/404.html` return 404. | `unknown routes and the 404 document return a designed HTTP 404`; live audit. |
| F6 | Banner, footer, legal, file, and result controls retain 44px targets without overflow. | `all visible mobile controls meet the 44px target baseline on every route`; live audit reports no undersized target on six routes. |
| C1 | Demo exit remains **Plan my workflow**. | Demo route test and live audit. |
| C2 | Result heading remains **Workflow run and skip results**. | Demo screenshots. |
| C3 | Empty state remains **No workflow plan yet**. | Browser suite and copy audit. |
| C4 | Prose uses “pull request”; code uses `pull_request`. | Copy audit and source scan. |
| C5 | Control remains **Expand all jobs** / **Collapse all jobs**. | Browser suite and mobile target test. |
| C6 | README distinguishes repository discovery from a workflow file path. | `@claim:cli-input`. |
| C7 | README describes the demo key in plain words. | `@claim:demo-storage`. |
| C8 | README says **Check the Rust release package**. | `@claim:cli-package`. |

## Review 1 revalidation

| Finding | Change retained or completed | Evidence |
|---|---|---|
| B1 | One-click web demo, direct query entry, persistent banner, reset/exit isolation, bundled CLI demo, and `demo.md` remain complete. | `@claim:sample-plan`, `@claim:demo-storage`, `@claim:cli-demo`; live screenshots and audit. |
| B2 | The registry now has 21 claims, each mapped to exactly one tagged observable test. | `the claims registry maps every entry to exactly one tagged test`; all 21 claim commands pass alone. |
| B3 | Demo, Privacy, Terms, and 404 routes have correct status, titles, metadata, canonical URLs, shared chrome, focus behavior, sitemap, and legal links. | Route/404/chrome tests; `live-check.json`; `verify-url.sh`. |
| B4 | First screen states the job, audience, sample action, next result, and three facts. | Mobile and desktop home screenshots; first-screen live coordinates; copy audit. |
| M1 | All section headings identify workflow planning, terminal use, capability, or limits directly. | Heading outline in route tests and copy audit. |
| C1 | Headline is **Plan a GitHub Actions workflow**. | Home route test and screenshots. |
| C2 | “Synthetic event” remains absent from visitor copy. | Copy audit and source scan. |
| C3 | First-screen copy names jobs and steps. | Home screenshots. |
| C4 | “Every branch accounted for” remains removed. | Source scan. |
| C5 | Result heading names workflow run and skip results. | Demo screenshots. |
| C6 | How-it-works heading names the workflow planner. | Copy audit. |
| C7 | Terminal heading names the planner and context. | Copy audit. |
| C8 | Capability and unknown headings name ghaplan explicitly. | Copy audit. |
| C9 | Capability copy is split into 13- and 14-word sentences. | `.factory/copy-audit.md`. |
| C10 | Terminal copy now explicitly names a shell script, Git hook, and code editor. | F-3-7 fix and copy audit. |
| C11 | JSON output has a concrete label and observable clipboard test. | `@claim:json-export`. |
| C12 | README introduction is nine words. | Copy audit. |
| C13 | README audience sentence is eight words. | Copy audit. |
| C14 | The long status-check explanation remains removed. | README source scan. |
| C15 | The long feature dump remains removed. | README source scan. |
| C16 | Planner action remains **Show this workflow’s plan**. | Browser and claim suites. |
| C17 | Export action remains **Copy workflow plan as JSON**. | `@claim:json-export`. |
| C18 | YAML errors identify the problem and direct another planning attempt. | Engine/browser error tests and copy audit. |

Review-1 UI fragments are also closed: event, workflow, privacy, planner, limits,
and JSON wording remains plain; every retained public promise is registered.
The glacial ceramic palette, tray art, irregular slabs, mineral status marks,
rail hierarchy, responsive composition, and reduced-motion treatment are
unchanged.

## Verification

- Clean clone: `/tmp/ghaplan-polish3-clean-0f8aefd`.
- `npm ci`: 61 packages, zero vulnerabilities.
- `npm test`: 7 Rust tests, 1 doctest, 5 Vitest tests, and 30 Playwright tests passed.
- `npm run typecheck`, `cargo fmt --check`, and clippy with warnings denied passed.
- `npm run build`: produced the CLI and `dist/site`; JS 64.63 kB raw / 22.53 kB gzip; CSS 17.20 kB raw / 4.72 kB gzip.
- `npm run pack:cli`: package verification passed; crate 21.2 kB compressed.
- Every one of the 21 commands in `.factory/claims.json` passed independently.
- Local and live all-route Axe: zero serious/critical findings in light and dark/reduced-motion modes; one H1 per route; no unexpected console errors or horizontal overflow; offline reload passed.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,184 ms, CLS 0, TBT 0 ms.
- Live deployment parity: `index.html`, `404.html`, and every referenced JS/CSS/image asset matched `dist/site` by SHA-256.
- Live crawl: all published destinations returned their expected status and every fragment target existed.

No finding from reviews 1–3 remains unresolved.
