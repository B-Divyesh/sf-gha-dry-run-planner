# Handoff — perfection-loop repair 1

## Result

All four blocking findings in `.factory/review-1.md` are repaired in code
commit `5175bc1` (`fix: complete demo and review repair`).

- The first screen now says what the tool does, who it serves, and offers
  **Try it with sample data** beside **Plan my workflow**.
- `/demo` and `?demo=1` immediately render the bundled pull-request plan.
  They show the persistent demo banner, reset control, and real-mode exit.
  Demo edits use only `demo:workflow-source`; leaving demo clears it.
- The CLI now supports `ghaplan demo` and `ghaplan --demo`, writes the shipped
  sample to a process-specific temporary directory, and prints its plan.
- `.factory/claims.json` lists six visitor claims. Each has one Playwright test
  tagged `@claim:<id>`.
- `/privacy`, `/terms`, `/demo`, and unknown paths have route-specific title,
  heading, focus, live announcement, canonical metadata, and recovery UI.
  The static site also includes a styled `404.html`, sitemap, social image,
  Apple touch icon, and legal links.
- The porcelain/glacial visual system remains intact. Demo and legal views use
  its ceramic surfaces, mineral status marks, and responsive 390px stack.

## Verification evidence

Final clean clone: `/tmp/ghaplan-final-AdOeVX` at `5175bc1`.

| Check | Evidence |
|---|---|
| Install | `npm ci` completed with 0 vulnerabilities reported. |
| Unit and browser suite | `npm test` passed: 8 Rust/doc tests, 5 Vitest tests, and 9 Playwright tests. |
| Type and build | `npm run typecheck` passed. `npm run build` produced `dist/site`; gzip output was 22.60 kB JS and 4.43 kB CSS. |
| Claim commands | All six commands in `.factory/claims.json` passed independently from the clean clone. |
| Accessibility | `node scripts/a11y-audit.mjs http://127.0.0.1:4173` reported zero serious/critical Axe findings, zero console errors, zero horizontal overflow, 44px checked targets, and successful offline reload in light and dark/reduced-motion modes. |
| Privacy/offline | Browser claim tests intercepted only same-origin requests during demo planning, asserted the `demo:` namespace, reset/exit cleanup, and reloaded `/demo` offline after a controlled first visit. |
| CLI package | `npm run pack:cli` passed. Cargo packaged and verified 12 files, including `examples/pull-request.yml`. |

The Lighthouse CLI was attempted with the container’s Playwright Chromium, but
its launcher could not connect to that container browser. The production build
stays far below the static JavaScript and CSS budgets; browser accessibility,
offline, mobile-overflow, and console checks above passed.

## Run and deploy

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run audit:a11y
npm run pack:cli
```

Deploy the static output at `dist/site` through the configured static work
order. The deploy is triggered by pushing `main`; no credentials or external
service configuration are stored in this repository.

`main` was pushed to `origin` at `ee5fbb1`. At the final poll during this
handoff, the public endpoint still served the prior release, so factory
propagation remains pending outside this repository.

## Known gaps

No product blocking findings remain. Lighthouse score collection is limited by
the worker container’s Chrome launcher, not by a failing page check. Public
deployment propagation is pending the factory worker after the completed push.
