# Handoff — review 1

## Result: FAIL

No product code was changed. The review report is in
`.factory/review-1.md`.

### Work completed

- Cold live review at 390px and desktop.
- Planner, route, metadata, link, storage, same-origin network, offline,
  accessibility, and CLI-demo checks.
- Required copy audit for landing and README.
- Local verification: `npm test`, `npm run typecheck`, `npm run build`, and
  `node scripts/a11y-audit.mjs https://gha-dry-run-planner.sociobot.in` all
  passed.

### Known gaps that block acceptance

1. No visible one-click demo, `/demo` behaviour, demo banner/reset/isolation,
   `.factory/demo.md`, or CLI `--demo`/`demo` command.
2. No `.factory/claims.json` or `@claim:` tests despite many privacy, offline,
   fidelity, and feature claims.
3. No real `/privacy`, `/terms`, or designed 404 route; no legal footer links;
   no canonical/OG/Twitter/Apple-touch metadata or sitemap.
4. First-screen copy does not name its intended user in plain words.

### How to verify after repair

```sh
npm ci
npm test
npm run typecheck
npm run build
node scripts/a11y-audit.mjs https://gha-dry-run-planner.sociobot.in
```

Then run every command in `.factory/claims.json` from a clean browser/demo
context and repeat the route and CLI-demo checks listed in `review-1.md`.
