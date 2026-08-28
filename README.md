# ghaplan

ghaplan plans a GitHub Actions workflow before you push.

It is for developers checking a workflow file.

Open the browser planner at <https://gha-dry-run-planner.sociobot.in>.

The sample demo is at <https://gha-dry-run-planner.sociobot.in/demo>.

## Install

Build the command-line tool from source.

```sh
git clone https://github.com/B-Divyesh/sf-gha-dry-run-planner.git
cd sf-gha-dry-run-planner
cargo install --path .
```

## Try the sample

Run the shipped pull request sample from any directory.

```sh
ghaplan demo
# or: ghaplan --demo
```

The command writes its sample file to a temporary directory and prints its plan.

## Command-line usage

Run `ghaplan` in a repository, or pass a workflow file path.

Use `ghaplan -` when another command provides the workflow.

```sh
ghaplan --event pull-request --base main --head feature/cache --paths src/cache.rs
ghaplan .github/workflows/release.yml --event workflow-dispatch --input release=true --json
cat .github/workflows/ci.yml | ghaplan - --event push --head main
```

Use `ghaplan --help` for the event and input options.

## Browser demo and privacy

The demo opens an isolated sample plan at `/demo` or `?demo=1`.

Demo edits are stored in this browser under `demo:workflow-source`.

Use **Reset demo** to restore the shipped sample.

Read the [privacy policy](https://gha-dry-run-planner.sociobot.in/privacy) and
[terms](https://gha-dry-run-planner.sociobot.in/terms).

## Develop and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run audit:a11y
```

The static site is written to `dist/site`.

Run each command in `.factory/claims.json` after a clean checkout.

Check the Rust release package with `npm run pack:cli`.

## License

MIT. See [LICENSE](LICENSE).
