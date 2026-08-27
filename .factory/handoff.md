# Verification handoff — FAIL

**Candidate verified:** `a1b4aa816b3f57c179fecc9382a6c895f4b2a20e`
**Live deployment verified:** https://gha-dry-run-planner.sociobot.in/
**Full evidence:** `.factory/verification.md`

## Status

**FAIL — do not release this candidate as an accurate GitHub Actions planner.**
The Rust CLI and browser planner both wrongly skip a job with `needs` and
`if: always()` when its dependency is skipped. GitHub Actions permits that job
to run; this is a high-severity defect in the product's core promise to explain
which jobs will run.

Minimal regression case:

```yaml
on: push
jobs:
  upstream:
    if: false
    steps: [{ run: echo upstream }]
  cleanup:
    needs: upstream
    if: always()
    steps: [{ run: echo cleanup }]
```

The candidate returns `cleanup: skip (dependency upstream did not succeed)` in
both interfaces; expected behavior is that `cleanup` runs.

## What passed

- Clean `npm ci`, `npm test`, `npm run build`, `cargo fmt --check`, and
  `cargo package --allow-dirty`.
- Clean extracted-crate install, installed CLI JSON exercise, and a clean Rust
  consumer of the public library API.
- Normal, boundary path-filter, malformed-input, recovery, and explicit
  unknown/`--strict` end-to-end scenarios.
- Desktop and 390 px mobile planning, keyboard Ctrl/Cmd+Enter, visible focus,
  reduced-motion behavior, zero serious/critical axe findings, zero observed
  console/page errors, PWA offline reload, and same-origin-only browser
  requests.
- Production bundles are within budget (60,808 B JS, 13,905 B CSS; 24,652 B
  mobile hero); live HTML/assets match the candidate build byte-for-byte and
  have restrictive CSP/security headers and immutable hashed asset caching.

## Remaining defects

1. **High:** Fix `needs`/status-function semantics above in both engines and
   add regression tests.
2. **Medium:** At 390 px, wordmark/Source links and Expand all/Copy JSON
   controls measure 36–39.7 px high, below the specified 44 px target.
3. **Low:** Static checks are not clean: `cargo clippy --all-targets
   --all-features -- -D warnings` fails on `clippy::map_flatten`, and an
   explicit strict TypeScript no-emit check fails because `ImportMeta.env` is
   undeclared (there is no repository typecheck script/configuration).

## Verification commands

```sh
npm ci
npm test
npm run build
npx tsc --noEmit --target ES2022 --moduleResolution bundler --module ESNext --strict site/src/app.ts site/src/engine.ts
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run pack:cli
npm run preview
npm run audit:a11y
```

After resolving the high-severity defect, rerun the independent verification
and update this handoff to PASS only if that regression passes in both the CLI
and browser engine.
