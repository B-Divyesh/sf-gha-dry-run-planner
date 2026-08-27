# Independent verification 2 — PASS

**Candidate tested:** `8a69c9d6a18ae0bdf5c8d8af183f51a8c6493080`
**Live URL:** <https://gha-dry-run-planner.sociobot.in/>
**Verified:** 2026-08-27
**Method:** clean detached clone at the exact candidate; no product source was modified.

## Verdict

**PASS.** The candidate satisfies the researched v1 job-to-be-done: the local
CLI and static browser application explain trigger, filter, expression,
matrix, `needs`, secret-reference, and permission decisions without executing
workflow code. The deployed public artefacts are byte-for-byte the artefacts
from the clean candidate production build.

This independently rechecks the defect that made the previous report fail:
with a skipped `upstream` job and `cleanup` using `needs: upstream` plus
`if: always()`, the release CLI reports `upstream=skip` and `cleanup=run`.
The browser's production audit exercises the same case and reports that its
cleanup job condition evaluated to true.

## Clean-checkout gates

Clean checkout: `/tmp/ghaplan-verify-8a69c9d`, detached at the candidate.

| Check | Result |
|---|---|
| `npm ci` | Pass; 61 packages audited, 0 vulnerabilities reported |
| `npm run typecheck` | Pass |
| `npm test` | Pass: 7 Rust unit tests, 1 Rust doctest, 5 Vitest engine tests |
| `cargo fmt --check` | Pass |
| `cargo clippy --all-targets --all-features -- -D warnings` | Pass |
| `npm run build` | Pass; release binary plus `dist/site` |
| `npm run pack:cli` | Pass; registry validation passed and produced a 21.4 kB `.crate` |

## End-to-end CLI and library evidence

- Installed the packed crate into a clean Cargo prefix. Its installed
  `ghaplan --version` returned `ghaplan 0.1.0`.
- Built and ran a separate clean Rust consumer against the packed source,
  using `plan_workflow`, `Event`, `PlanOptions`, `evaluate`, and `EvalResult`.
- Exercised the release binary from stdin with a representative pull-request
  workflow: main branch/path filters, ready label, boolean dispatch-like
  input, job and step expressions, a 2×2 matrix with one exclusion and one
  inclusion, a downstream `needs` job, permission, and secret reference. It
  planned four matrix cells, reported run/skip step reasons, `TOKEN` as a
  referenced secret without exposing a value, and `contents: read`.
- Boundary: `src/docs/a.ts` was skipped by the ordered `!src/docs/**` filter.
- Invalid YAML returned structured `invalid YAML` output and exit code 2;
  replacing it with valid YAML immediately yielded a running job.
- `hashFiles()` was explicit `unknown`: normal mode exited 0 and `--strict`
  exited 2, as documented.
- The exact skipped-need `if: always()` regression passed (`upstream: skip`,
  `cleanup: run`). No `run:` command or action was executed in any check.
- `ghaplan --help` documents all accepted events, input flags, `--json`,
  `--strict`, stdin use, examples, and exit behavior.

## Browser, accessibility, PWA, and privacy

The locally built production site and the live site were exercised at desktop
1440×960 and mobile 390×844.

- Normal planner, malformed-YAML error, and valid-YAML recovery all worked in
  both viewports. The default representative plan covers branch/path filters,
  job and step conditions, matrix expansion, and `needs`.
- Keyboard-only smoke test: focusing the editor and pressing Ctrl+Enter plans
  the workflow and moves focus to `#result-heading`. A keyboard-focused editor
  has a visible `rgb(23, 122, 145)` solid 3 px outline. No horizontal overflow
  was measured on either viewport.
- Automated axe checks found **zero serious or critical violations** in light
  and dark/reduced-motion modes, locally and live. The live page has title,
  `lang="en"`, exactly one H1, and a main landmark.
- Reduced motion takes effect (the repository audit checks dark/reduced mode);
  the site uses no looping animation. All four measured 390 px controls
  (wordmark, Source, Expand all, Copy JSON) are 44 px high.
- Console and page errors: none. Browser-observed runtime requests used only
  the respective same origin; no CDN, analytics, API, font, or tracking request
  was made.
- Live cookies, localStorage, and sessionStorage were empty. Source review
  found no analytics/telemetry or data upload; the only runtime fetch is the
  same-origin service-worker cache strategy.
- PWA: the service worker was active on local and live origins, `update()` left
  no waiting worker for this unchanged build, and the repository audit's offline
  reload succeeded without errors.

## Production identity, response policy, and performance

- The live `index.html`, hashed JS/CSS, both WebP images, favicon, manifest,
  robots file, and service worker had the same SHA-256 bytes as `dist/site`
  built from this candidate. The live index references
  `index-C4imhl6O.js` and `index-CiSteOwO.css`, exactly as the build does.
- Live root response: HTTPS 200, HSTS with `includeSubDomains; preload`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, restrictive
  camera/microphone/geolocation Permissions-Policy, and a self-only CSP with
  `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'`.
- Caching is appropriate: HTML and service worker are `max-age=30`; hashed
  JS/CSS assets are `max-age=31536000, immutable`.
- Production sizes: initial JS 61,588 B (<200 kB), CSS 14,061 B (<50 kB),
  mobile hero 24,652 B (<300 kB), desktop hero 85,308 B; only system fonts.
- Lighthouse mobile, live: Performance **99**, Accessibility **100**, LCP
  **1,203 ms**, CLS **0**. (Chrome was launched explicitly with remote
  debugging because the CLI launcher could not auto-discover a browser in this
  container.)

## Visual inspection

Desktop and 390 px screenshots show the documented glacial-ceramic visual
system intact: readable hierarchy, original tray/DAG image, deliberate mobile
stacking, and no clipped primary controls. The visual result matches
`.factory/design.md` rather than a framework default.

## Defects

No high, medium, or low severity defects found.

## Declared product limits (not defects)

This is correctly a static planner, not a runner. Secret values, runner and
filesystem state, `hashFiles()`, remote reusable workflows, composite-action
internals, live concurrency/cancellation, and undocumented GitHub edge cases
remain explicit unknowns. Those limits are stated in the README and UI.
