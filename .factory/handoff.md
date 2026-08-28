# Handoff — perfection loop round 2

## Result

All findings in `.factory/review-1.md` and `.factory/review-2.md` are resolved.
The repaired CLI and static site are pushed on `main` and deployed at
<https://gha-dry-run-planner.sociobot.in>.

Product repair commits:

- `4ad768e` — demo, copy, claims, tests, routing, 404 page, focus, and mobile repairs
- `4569a62` — Azure-valid 404 status rule

Deployment ID: `7d073cc4-eff2-46cf-90d1-49e8940a72ae`.

## What changed

- The first screen retains the direct job, audience, two actions, and three
  facts. Prose now uses **pull request** consistently.
- `/demo` and `/?demo=1` open a result-first, isolated sample. The banner is
  absent everywhere else. Reset and **Plan my workflow** clear only `demo:`
  storage.
- The plan summary and first explained job are inside the initial 390×844 and
  1440×900 viewports.
- `.factory/claims.json` now has 19 narrow claims and exactly one tagged test
  for each. Coverage includes browser and CLI input, filters, expressions,
  matrices, dependencies, reasons, unknown sources, export, offline use,
  privacy, build output, and package output.
- Back/Forward restores heading focus. Known routes return 200. Unknown routes
  and `/404.html` return the product-styled page with HTTP 404.
- All visible mobile controls meet the 44px target baseline. Copy fixes include
  explicit result, empty-state, expand, demo-exit, README storage, input, and
  package language.
- The porcelain/glacial visual system and original art remain unchanged.

The complete finding map is in `.factory/polish-2.md`. The updated sentence
and terminology audit is in `.factory/copy-audit.md`.

## Verification evidence

Clean clone: `/tmp/ghaplan-polish2-clean-20260828`.

- Every one of the 19 `.factory/claims.json` commands ran independently and
  passed.
- `npm test` passed: 7 Rust unit tests, 1 Rust doc test, 5 Vitest tests, and 25
  Playwright tests.
- `npm run typecheck` passed.
- `npm run build` passed. `dist/site` contains the complete static artifact.
- `npm run pack:cli` passed and verified the packaged crate.
- Build sizes: JavaScript 64.92 kB / 22.68 kB gzip; CSS 16.82 kB / 4.62 kB
  gzip; HTML 10.85 kB / 3.67 kB gzip.
- `npm run audit:a11y` passed with zero serious/critical Axe findings, zero
  unexpected console errors, no horizontal overflow, 44px sampled controls,
  and a working offline reload.
- Live Axe passed all app and 404 routes in light and dark/reduced-motion modes.
- Live Lighthouse mobile scores: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100.
- `/opt/fleet/lib/verify-url.sh` passed against live `/` and `/demo` with valid
  title, language, main landmark, image alternatives, and no app console error.
- Live status checks: `/`, `/demo`, `/privacy`, `/terms`, `/?demo=1` → 200;
  `/not-a-real-route`, `/404.html` → 404.
- Live demo positions: mobile summary y=456 and first job y=567 within 844px;
  desktop summary y=503 and first job y=616 within 900px.
- Live storage audit preserved `real:workflow-source`, removed the `demo:` key
  on exit, and showed no banner outside demo mode.
- Live planning issued zero network requests after load. Offline demo reload
  succeeded. Every crawled link and fragment target resolved.

Evidence files committed with the handoff:

- `.factory/evidence/polish-2/live-demo-mobile.png`
- `.factory/evidence/polish-2/live-demo-desktop.png`
- `.factory/evidence/polish-2/live-check.json`

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run audit:a11y
npm run pack:cli
```

Run each command in `.factory/claims.json` independently for the acceptance
claim gate. Use `npm run dev` for the site and `cargo run -- demo` for the CLI
sample.

## Known gaps and next steps

None for the reviewed scope. The tool remains an honest static planner, not a
GitHub runner; its explicit unknown states are documented and tested.
