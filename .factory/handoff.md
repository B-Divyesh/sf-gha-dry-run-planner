# Handoff — gha-dry-run-planner v0.1.0

## What shipped

- A typed Rust planning library plus the `ghaplan` single-binary CLI. It reads
  explicit workflow paths, stdin, or `.github/workflows/*`; accepts synthetic
  push/PR/dispatch/schedule/merge-group/workflow-run event data; and emits an
  explained tree or stable `--json` output.
- Static evaluation for ordered branch/path filters, event action types, core
  GitHub expression operators and functions, `github`/`inputs`/`matrix`/
  `needs`/`env` contexts, object-filter wildcards, matrix Cartesian expansion
  with include/exclude, needs ordering, job and step conditions, resolved
  `run:` templates, secret references, and permission declarations.
- Explicit run, skip, unknown, and error states. `--strict` makes unknowns fail
  CI with exit code 2. No workflow command, action, or secret is executed/read.
- A responsive static product site and live browser planner in `dist/site`.
  It supports paste, local file open, synthetic paths/branches/inputs/labels,
  keyboard planning (Ctrl/Cmd+Enter), JSON copy, mobile layout, dark mode,
  reduced motion, error/empty/offline states, and service-worker caching.
- Product documentation, MIT license, changelog, a tiny typed public API, and
  ready-to-package Cargo metadata. Privacy/terms routes are intentionally not
  present because the free product has no account, payment, analytics,
  tracking, upload, or persisted user data.

## Visual system and original asset

The glacial minimal ceramics system is documented in `.factory/design.md`.
The hero was generated specifically for this product via
`/opt/fleet/lib/gen-image.sh` using the factory `gpt-image-2` deployment. The
full prompt and generation metadata are in
`.factory/assets/hero-ceramic-source.png.json`; the source is beside it. The
site consumes original 84 KB and 25 KB responsive WebP derivatives. No
third-party runtime fonts, scripts, or imagery are used.

## Verification performed

- `npm test`: pass — 6 Rust unit tests, 1 compiling Rust doctest, and 4 browser
  engine tests.
- `npm run build`: pass — optimized binary plus `dist/site/index.html`.
- Production payload: 60.81 KB JS / 21.36 KB gzip, 13.91 KB CSS / 4.05 KB
  gzip, 84 KB desktop hero, and 25 KB mobile hero.
- `cargo package --allow-dirty`: pass. Final crate contents are limited to the
  Rust sources and package documentation; the factory can publish with
  `cargo package`/`cargo publish` when credentials are available.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence`: pass;
  HTTP 200, title/lang/main/one H1/alt labels valid, and zero console errors.
- Playwright + axe audit: zero serious/critical findings in light and dark +
  reduced-motion modes; interactive planning passed; 390 px horizontal
  overflow was 0; an offline reload succeeded.
- Lighthouse mobile (local production build): Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0, total
  blocking time 0 ms. Lab measurements vary by host.

## Run it

```sh
npm install
npm test
npm run build
npm run preview
```

CLI smoke test:

```sh
cargo run -- --event pull_request --base main --head feat --paths src/a.ts
```

## Known fidelity limits

- `hashFiles()`, secret values, runner filesystem/state, live concurrency
  cancellation, remote reusable workflows, and composite-action internals are
  declared unknown rather than guessed.
- `workflow_run` and a few undocumented GitHub expression/path-filter corners
  remain best-effort. No static tool can determine outputs produced only by a
  step that has not run.
- The browser and Rust planners share fixtures and behavior but are separate
  compact implementations; the Rust CLI is the automation-grade reference.

## Recommended next steps

1. Publish a versioned 200-expression conformance corpus and track fidelity
   against GitHub's observed behavior.
2. Add local reusable-workflow resolution and more event payload fields.
3. Publish signed release binaries for macOS, Linux, and Windows after the
   factory configures release credentials.
