# Perfection loop round 2 — finding map

**Release candidate:** `389b984f995b385f2104b386c1ef90662f41096f`  
**Review source:** `c25a51d064f450213f87b75fd54873fe4e9e227b`  
**Repair code:** `4569a62`  
**Live URL:** <https://gha-dry-run-planner.sociobot.in>

Evidence screenshots:

- Mobile demo, 390×844: `.factory/evidence/polish-2/live-demo-mobile.png`
- Desktop demo, 1440×900: `.factory/evidence/polish-2/live-demo-desktop.png`
- Machine-readable live audit: `.factory/evidence/polish-2/live-check.json`

## Review 2

| Finding | Change made | Evidence |
|---|---|---|
| B1 | Added a global `[hidden]` rule, restricted demo routing to `/demo` or root `?demo=1`, renamed the exit to **Plan my workflow**, and clear only `demo:` keys on exit. | `demo banner appears only in demo mode and leaves cleanly`; `@claim:demo-storage`; live audit shows banner counts 0/1/0 and preserves the `real:` sentinel. |
| B2 | Reordered the demo into a compact result-first layout. Demo jobs start collapsed, while the summary and explained job rows remain visible. | `@claim:sample-plan` uses `toBeInViewport()` at both widths. Live positions: mobile summary/job y=456/567; desktop y=503/616. See both screenshots above. |
| F3 / U1 | Registered the general workflow/job/step decision claim with push and pull request fixtures. | `@claim:workflow-decisions`. |
| F3 / U2 | Split evaluator coverage into narrow event-filter, expression, matrix, and dependency claims. | `@claim:event-filters`, `@claim:expressions`, `@claim:matrix-expansion`, `@claim:dependencies`, and `@claim:supported-events`. |
| F3 / U3 | Added a fixture with run, skip, and unknown jobs and asserted a specific reason for each. | `@claim:decision-reasons`. |
| F3 / U4 | Added temporary-repository tests for discovery, a named path, stdin, equivalent JSON decisions, and `--help`. | `@claim:cli-input`. |
| F3 / U5 | Added explicit browser warnings and a fixture for secrets, `hashFiles()`, remote reusable workflows, concurrency, and `workflow_run` state. | `@claim:unknown-sources`. |
| F3 / U6 | Removed the unsupported README MSRV promise instead of implying an untested minimum. | README audit; `rg` finds no Rust-version claim. |
| F3 / U7 | Parse the CLI’s reported temporary path, compare the generated file byte-for-byte with the bundled sample, assert the plan, and confirm the caller directory stays empty. | `@claim:cli-demo`. |
| F3 / U8 | Registered and asserted the exact static build output, including the shell, 404, host config, sitemap, service worker, and hashed JavaScript. | `@claim:site-build-output`; `npm run build` produced `dist/site`. |
| F4 | Made the home h1 programmatically focusable and retained h1 focus on `popstate`. | `browser Back and Forward restore route heading focus`; live audit records home/privacy/forward headings as active elements. |
| F5 | Replaced the catch-all 200 fallback with explicit app-route rewrites and a product-styled static 404 response. | `unknown routes and the 404 document return a designed HTTP 404`; live `curl`: known routes 200, unknown and `/404.html` 404. |
| F6 | Raised banner, footer, legal, file, and result targets to at least 44px. | `all visible mobile controls meet the 44px target baseline on every route`; live audit reports no undersized target on six routes. |
| C1 | **Start for real** → **Plan my workflow**. | `demo banner appears only in demo mode and leaves cleanly`; live `/demo`. |
| C2 | **What will happen** → **Workflow run and skip results**. | Live screenshots. |
| C3 | **Ready when the workflow is** → **No workflow plan yet**. | Home empty-state browser check; `.factory/copy-audit.md`. |
| C4 | Standardized prose to **pull request**; literal values remain `pull_request`. | `rg` copy audit; live first screen and README. |
| C5 | **Expand all** → **Expand all jobs** and **Collapse all jobs**. | Live screenshot; browser interaction suite. |
| C6 | README now says: “Run `ghaplan` in a repository, or pass a workflow file path.” | `@claim:cli-input`; README. |
| C7 | README now says demo edits are stored in this browser under the named key. | `@claim:demo-storage`; README. |
| C8 | README now says: “Check the Rust release package with `npm run pack:cli`.” | `@claim:cli-package`; `npm run pack:cli`. |

## Review 1 retained findings

| Finding | Change made or revalidated | Evidence |
|---|---|---|
| B1 | One-click web demo, query-string entry, persistent isolated banner, reset/exit, separate storage, bundled CLI demo, and `.factory/demo.md` are all real. | `@claim:sample-plan`, `@claim:demo-storage`, `@claim:cli-demo`, query demo browser test, live `/demo` and `/?demo=1`. |
| B2 | Expanded `.factory/claims.json` from six broad entries to 19 narrow claims, each with exactly one tagged observable test. | All 19 registry commands passed independently from a clean clone; tag-count audit reports one test per ID. |
| B3 | Real Demo, Privacy, Terms, and 404 routes; route titles/descriptions/canonicals; OG/Twitter assets; sitemap; legal links; shared navigation; focus; and status semantics are present. | Route, focus, metadata, link-crawl, and 404 tests; live audit and `/opt/fleet/lib/verify-url.sh`. |
| B4 | The first screen retains the direct five-word job headline, named developer audience, demo action, expected result, and three plain facts. | Mobile and desktop live screenshots; `.factory/copy-audit.md`. |
| M1 | Contextless headings were replaced with **How the workflow planner works**, **Use the planner from your terminal**, and explicit capability/limit headings. | Heading audit in live DOM; Axe heading checks. |
| C1–C4 | Direct workflow headline/audience, plain event language, concrete run/skip wording, and removal of the absolute branch promise remain in place. | First-screen screenshot; `@claim:workflow-decisions`; copy audit. |
| C5–C8 | All reviewed headings now name their section: workflow results, how it works, terminal use, evaluated inputs, and unknown inputs. | Live heading outline; Axe on every route in light and dark modes. |
| C9 | The long capability sentence is now two sentences of 11 and 12 words. | `.factory/copy-audit.md`. |
| C10 | Terminal copy uses “Run the same check in scripts, hooks, or an editor.” | `@claim:cli-input`; live terminal section. |
| C11 | The retained JSON action now has a registered clipboard outcome test. | `@claim:json-export`. |
| C12–C15 | README introduction, audience, status-check explanation, and feature coverage remain split into short plain sentences. | `.factory/copy-audit.md`; no sentence over 22 words. |
| C16 | Primary planner control remains **Show this workflow’s plan**. | Browser planner tests. |
| C17 | Export control remains **Copy workflow plan as JSON**. | `@claim:json-export`. |
| C18 | YAML failures say what failed and instruct the visitor to fix the error and plan again. | Engine YAML unit test; rendered error copy audit. |
| UI fragments | Replaced payload/live/fidelity jargon, registered local/privacy promises, retained clear Limits and legal links, and kept the install command secondary to the demo action. | Copy audit, claims registry, live link crawl, and first-screen screenshots. |
| Structure checklist | Metadata, local social art, touch icon, sitemap, security headers, legal links, build ID, real routes, focus announcements, and no-dead-link behavior remain complete. | `routes set titles...`; live link crawl; live 100/100 Lighthouse accessibility/SEO; live audit JSON. |

## Verification summary

- All 19 claim commands passed independently from a clean clone.
- `npm test`: 8 Rust/doc tests, 5 Vitest tests, and 25 Playwright tests passed.
- `npm run typecheck`, `npm run build`, and `npm run pack:cli` passed.
- `npm run audit:a11y`: zero serious/critical Axe findings, zero unexpected console errors, zero overflow, and offline reload passed.
- Live Axe: zero serious/critical findings on `/`, `/demo`, `/privacy`, `/terms`, and both 404 paths in light and dark/reduced-motion modes.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Live link crawl: every HTTP link returned 200 and every fragment target existed.
- Deployment `7d073cc4-eff2-46cf-90d1-49e8940a72ae` completed successfully.
