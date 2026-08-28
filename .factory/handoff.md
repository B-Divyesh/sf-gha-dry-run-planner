# Handoff — perfection loop round 3

## Result

**PASS.** Every finding in reviews 1–3 is fixed or revalidated. The Rust
command-line tool and Vite static planner remain the shipped artifact classes.
The glacial ceramic visual system is unchanged.

The production site is <https://gha-dry-run-planner.sociobot.in>. Azure Static
Web Apps deployment `c8a7ca6b-2d76-4593-af14-2280fc31289e` completed
successfully on 2026-08-28.

## What changed

- Built the 404 through Vite and sourced its header/footer from the same module
  as every app route. The 404 now has the complete navigation, footer, manifest,
  favicon, OG/Twitter metadata, requested-path canonical, and real 404 status.
- Changed route rendering so the document contains exactly one H1. Navigation,
  Back, and Forward move focus to the active route heading and announce it.
- Added `mit-license` and `cli-install` to the claim registry with executable
  tests. The registry now contains 21 uniquely tagged claims.
- Rewrote every phrase flagged in review 3 and marked every GitHub link with a
  visible `↗` plus an accessible “external link” suffix.
- Kept the one-click `/demo` and `?demo=1` result-first sandbox, separate
  `demo:` storage, reset/exit behavior, offline shell, and bundled CLI demo.
- Added reusable all-route accessibility and live deployment audit coverage.
- Updated the verb-first 80-character catalog description and full copy audit.

The finding-by-finding record is in `.factory/polish-3.md`.

## Verification

Clean checkout used for the full code gates and every independent claim command:
`/tmp/ghaplan-polish3-clean-0f8aefd`. A final clean checkout at
`/tmp/ghaplan-polish3-final` rechecked the committed handoff state.

- `npm ci`: passed; 61 packages, zero vulnerabilities.
- `npm test`: passed; 7 Rust tests, 1 doctest, 5 Vitest tests, and 30
  Playwright tests.
- `npm run typecheck`: passed.
- `cargo fmt --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `npm run build`: passed; release CLI plus `dist/site`.
- `npm run pack:cli`: passed package verification; 21.2 kB crate.
- All 21 commands in `.factory/claims.json`: passed independently from the
  clean clone.
- Local and live all-route Axe: zero serious/critical findings in light and
  dark/reduced-motion modes, exactly one H1 per route, no unexpected console
  errors, no horizontal overflow, and a successful offline reload.
- Production Lighthouse mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 1,184 ms; CLS 0; TBT 0 ms.
- Production payload: main JS 64.63 kB raw / 22.53 kB gzip; shared CSS 17.20 kB
  raw / 4.72 kB gzip; mobile hero 24.65 kB.
- `verify-url.sh`: HTTPS 200, title, `lang=en`, one H1, main landmark, image
  alt text, labelled buttons, and zero console errors.
- Cold production audit: known routes 200; missing routes and `/404.html` 404;
  complete route metadata; identical shared chrome; no undersized mobile
  targets; Back focus restored; all links and fragments valid.
- Production parity: deployed `index.html`, `404.html`, main/shared/404 JS,
  CSS, and hero image match the local build by SHA-256.

Evidence is under `.factory/evidence/polish-3/`, including mobile/desktop home
and demo screenshots, the styled 404 screenshot, `live-check.json`,
`a11y-live.json`, and `lighthouse-summary.json`.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
npm run pack:cli
```

Run each `test` command in `.factory/claims.json` independently. To repeat
the local accessibility audit, serve `dist/site` with
`node scripts/serve-site.mjs`, then run `npm run audit:a11y`.

## Known gaps and next steps

None within the reviewed scope. No AI feature was added because workflow
planning must remain deterministic, explainable, local, and testable.
