# Handoff — adversarial first-read review 2

## Result

Completed the requested read-only review of the deployed product and recorded
it in `.factory/review-2.md`.

**Verdict: FAIL.** Two blocking demo findings remain:

1. The demo banner and controls are visible on every route, including the real
   home page and after **Start for real**.
2. The sample plan result begins below the first viewport at both required
   widths, despite the promise to show a plan immediately.

The report also records unlisted claims, missing focus restoration after browser
Back, a 200 response for unknown routes, undersized mobile targets, and eight
specific copy issues. No product code was changed.

## Verification performed

- Fresh production browser contexts at 390×844 and 1440×900.
- Live demo entry, edit, reset, exit, storage sentinel, same-origin request
  interception, and offline reload.
- Every `.factory/claims.json` command, independently, from fresh clone
  `/tmp/ghaplan-review2-9Ann3P`: all six passed.
- `npm test`: 8 Rust/doc tests, 5 Vitest tests, and 9 Playwright tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; output was 22.60 kB gzip JS and 4.43 kB gzip CSS.
- Production accessibility audit in light and dark/reduced-motion modes: zero
  serious/critical Axe findings, console errors, or horizontal overflow.
- Production route metadata, one exposed h1 per route, canonical/OG/favicon,
  1200×630 OG image, 180×180 touch icon, deep links, history, and link crawl.
- CLI demo from a fresh temporary directory; it printed its sample path and
  plan without writing to that directory.

## Next steps

Fix B1 and B2 first, add regression assertions for both, then register or
remove every claim listed in F3. After that, repair home-route focus, return a
real 404 status, enlarge mobile targets, apply the copy rewrites, and repeat
this review from a fresh deployed browser context.
