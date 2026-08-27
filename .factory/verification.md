# Independent verification — FAIL

**Candidate:** `a1b4aa816b3f57c179fecc9382a6c895f4b2a20e` (`main` at checkout time)
**Live URL:** https://gha-dry-run-planner.sociobot.in/
**Verified:** 2026-08-27, from a detached clean worktree at the candidate.

## Verdict

**FAIL.** The core no-execution planner produces an incorrect run/skip decision
for a documented GitHub Actions `needs` + `if: always()` pattern in both
surfaces. This invalidates the product's primary promise to say which jobs
will run and why. No product code was changed during this verification.

## Release-blocking defect

### High — `always()` cannot override a skipped dependency

GitHub Actions permits a dependent job with `if: always()` to run even when a
job in `needs` was skipped or failed. The planner checks whether a dependency
succeeded before it evaluates the dependent job's `if`, so it instead reports
the job as skipped.

Reproducer used for both the release CLI and the live-equivalent browser
engine:

```yaml
name: Needs always
on: push
jobs:
  upstream:
    if: false
    steps:
      - run: echo upstream
  cleanup:
    needs: upstream
    if: always()
    steps:
      - run: echo cleanup
```

```text
$ ghaplan needs-always.yml --event push --head main --json
upstream: skip (job if evaluated to false)
cleanup:  skip (dependency upstream did not succeed)
```

The browser returned the same `Dependency upstream did not succeed.` decision.
Expected GitHub behavior: `cleanup` runs because `always()` overrides the
default success gate. This is directly within the researched brief's required
`if:` and `needs` behavior.

## Other defects / gaps

### Medium — some 390 px interactive controls are under the stated 44 px target

Measured on the production build at 390×844: wordmark link 36 px high, Source
link 39.7 px, and `Expand all` / `Copy JSON` buttons 36 px. The product has no
horizontal overflow and axe/Lighthouse did not flag target-size failures, but
these controls do not meet the work-order's explicit 44×44 CSS px target.

### Low — explicit static checks are not clean

`cargo clippy --all-targets --all-features -- -D warnings` fails under Rust
1.98.0 for `src/expression.rs:408`: `clippy::map_flatten` (use `and_then` in
place of `map(...).flatten()`). There is no declared lint npm script, so this
does not prevent the declared test/build commands from passing, but it is a
cleanliness issue for the shipped Rust CLI.

The repository also has no TypeScript typecheck script or tsconfig that loads
Vite client types. An explicit strict no-emit check fails at
`site/src/app.ts:119` because `ImportMeta` has no declared `env` property.
Vite transpiles the site successfully, but that is not a substitute for a
passing TypeScript gate.

## Checks that passed

### Clean install, test, build, and package

- `npm ci`: pass (61 packages, 0 vulnerabilities reported).
- `npm test`: pass — 6 Rust unit tests, 1 Rust doctest, and 4 Vitest engine
  tests.
- `npm run build`: pass — release binary plus `dist/site`.
- Explicit TypeScript check: fails at `site/src/app.ts:119` (`ImportMeta.env`
  is undeclared in this repository's TypeScript configuration); no repository
  typecheck script is provided.
- `cargo fmt --check`: pass.
- `npm run pack:cli` / `cargo package --allow-dirty`: pass; generated
  `gha-dry-run-planner-0.1.0.crate` (20,541 bytes).
- Extracted crate installed into a clean `cargo install --root` prefix; its
  `ghaplan --version`, JSON CLI call, and a separate clean Rust consumer using
  `plan_workflow`, `Event`, and `evaluate` all passed.

### End-to-end representative inputs

The release CLI and browser planner were exercised with a synthetic
`pull_request` workflow containing an action type, `branches`, ordered
`paths`/negative paths, labels, boolean input, job/step expressions, `needs`,
matrix Cartesian expansion with `exclude`/`include`, permissions, and a secret
reference. Normal result: workflow run; two jobs; four matrix cells (three
step runs, one step skip); downstream deploy run; secret and permissions
reported without a value.

- Boundary: `src/docs/a.ts` correctly skipped the workflow due to ordered
  `!src/docs/**` path filtering.
- Malformed YAML: CLI exited 2; browser showed its actionable YAML error.
- Recovery: replacing malformed text with valid workflow immediately produced
  the normal plan again.
- Unknown recovery: `hashFiles()` yielded an explicit unknown; normal mode
  exited 0 and `--strict` exited 2 as documented.
- No workflow commands or actions were executed during the checks.

### Browser, accessibility, PWA, privacy, and performance

- Desktop and 390×844 mobile: interactive plan succeeded; no horizontal
  overflow. Screens were visually inspected.
- Keyboard: Ctrl+Enter planned from the source editor; result heading received
  focus. Programmatically focused control had a visible `rgb(23, 122, 145)`
  3 px outline.
- Reduced motion: emulation changed scroll behavior to `auto` and transition
  duration to `0.00001s`.
- Axe: zero serious/critical violations in light and dark/reduced-motion
  checks. The repository `npm run audit:a11y` also passed with zero console
  errors, zero overflow, and successful offline reload.
- PWA: service worker became active (`/sw.js`, `ghaplan-shell-v1`), update
  check had no waiting worker for the unchanged build, and an offline reload
  rendered the app shell with no errors.
- Console/page errors: none locally or on the live site.
- Outbound requests: the browser observed only the respective same origin;
  no analytics, CDN, third-party script, font, or API request.
- Local production payload: JS 60,808 B (<200 KB), CSS 13,905 B (<50 KB),
  mobile hero 24,652 B (<300 KB), desktop hero 85,308 B; system fonts only.
- Lighthouse mobile JSON reported Performance 100 and Accessibility 100, LCP
  1.2 s and CLS 0. The Lighthouse process subsequently reported a Chromium
  target crash during full-page screenshot capture; scores were written before
  that diagnostic failure, so axe and direct checks are the authoritative
  accessibility evidence.

### Deployment equivalence and security

- Live `index.html` and all public candidate assets (`index-C-dhp1xf.js`,
  `index-B5IxkNUD.css`, both hero WebPs, `sw.js`, and manifest) were byte-for-
  byte identical by SHA-256 to `dist/site` built from the candidate.
- Live root response: HTTPS 200; HSTS (includeSubDomains/preload),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, restrictive
  Permissions-Policy, and CSP limiting default/script/style/image/connect to
  `'self'`, with `object-src 'none'`, `base-uri 'self'`, and
  `frame-ancestors 'none'`.
- Caching: HTML `max-age=30`; hashed JS `max-age=31536000, immutable`.

## Required resolution before PASS

Correct job gating so that the job `if` expression is evaluated in the proper
GitHub Actions order and `always()` (and other status-function cases) can
override the default dependency-success condition. Add CLI and browser
regression tests for the reproducer above, then rerun this verification.
