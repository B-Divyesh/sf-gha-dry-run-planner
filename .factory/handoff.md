# Handoff — gha-dry-run-planner repair

**Base reviewed:** `95bbe9a581d51d3c508c8dba7182b898a56def57`
**Deployment:** https://gha-dry-run-planner.sociobot.in/

## What changed

- Corrected job-level `needs` gating in the Rust CLI/library and browser
  engine. A job condition is evaluated first; the implicit dependency
  `success()` gate applies only when the condition has no status function.
  Consequently, a cleanup job with `needs: upstream` and `if: always()` runs
  when `upstream` is skipped, matching GitHub Actions behavior.
- Status functions now read planner job status context (`always`, `success`,
  `failure`, and `cancelled`) rather than treating every status check as a
  fixed value. Step conditions retain their existing per-step success behavior.
- Added identical Rust and browser-engine regressions for the skipped-upstream
  `always()` workflow, plus a browser production E2E assertion for it.
- Raised the 390 px wordmark, Source link, Expand all, and Copy JSON controls
  to at least 44 CSS px. The E2E audit measures all four.
- Replaced the Clippy `map(...).flatten()` warning with `and_then`, and added a
  strict `npm run typecheck` gate with Vite `ImportMeta.env` typing.

## Verification

Run from a clean checkout:

```sh
npm ci
npm run typecheck
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
npm run pack:cli
npm run preview
npm run audit:a11y
```

Completed for this repair:

- Clean `npm ci`; strict TypeScript check; `npm test` (7 Rust unit tests, one
  Rust doctest, and 5 browser-engine tests); `cargo fmt --check`; and strict
  Clippy all passed.
- Production CLI E2E passed for the exact skipped-upstream `if: always()`
  reproducer: `upstream=skip`, `cleanup=run`, and its cleanup step runs.
- `npm run build` produced `dist/site`; `npm run pack:cli` produced a
  registry-ready crate. The extracted crate installed successfully and its
  `ghaplan --version` command passed. A fresh Rust consumer compiled and ran
  against `plan_workflow`, `Event`, `PlanOptions`, `Outcome`, and `evaluate`.
- Local production browser audit passed at 390×844: zero serious/critical axe
  findings, zero console errors, no horizontal overflow, offline reload,
  reduced-motion/dark-mode checks, exact `always()` planner E2E, and measured
  target heights of 44 px for wordmark, Source, Expand all, and Copy JSON.
- Standard static deployment completed. The live `index.html` SHA-256 matches
  the local production build, `verify-url.sh` passed (HTTP 200, title/lang,
  one H1, main landmark, image alt labels, and no console errors), and the
  same live 390 px audit passed with the exact 44 px controls and `always()`
  regression.

## Release notes

The site is static, has no runtime CDN or telemetry, and is deployed with the
factory Standard Static Web Apps flow. The crate is ready for the factory to
publish with `cargo package` / `cargo publish`; no registry publishing was
performed here.

## Known fidelity limits

This remains a no-execution planner. It does not discover runner failures or
cancellations from a live run, execute steps, read secret values, evaluate
`hashFiles()`, load remote reusable workflows, or observe live concurrency.
Those cases remain explicit static limits rather than guesses.
