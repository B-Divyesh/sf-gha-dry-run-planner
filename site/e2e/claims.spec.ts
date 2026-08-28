import { expect, test, type Page } from 'playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = process.cwd();
const binary = join(root, 'target/debug/ghaplan');

async function plan(page: Page, yaml: string, event = 'pull_request') {
  await page.goto('/demo');
  await page.locator('#workflow-source').fill(yaml);
  await page.locator('#event').selectOption(event);
  await page.getByRole('button', { name: /Show this workflow/ }).click();
  await expect(page.locator('#result')).not.toHaveAttribute('aria-busy', 'true');
  return page.locator('#result');
}

test('@claim:sample-plan opens an immediate, explained sample result in both first viewports', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/demo');
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    const summary = page.locator('#result .summary');
    await expect(summary).toContainText('Workflow RUN');
    await expect(summary).toContainText('2 jobs');
    await expect(summary).toContainText('4 cells');
    await expect(summary).toContainText('8 steps');
    await expect(summary).toBeInViewport();
    const firstJob = page.locator('#result details').first().locator('summary');
    await expect(firstJob).toContainText('Job if evaluated to true.');
    await expect(firstJob).toBeInViewport();
  }
});

test('@claim:demo-storage keeps sample edits away from real storage', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => localStorage.setItem('real:workflow-source', 'do not read this'));
  await page.locator('#workflow-source').fill('name: Demo edit\non: push\njobs: {}');
  await page.getByRole('button', { name: /Show this workflow/ }).click();
  const stored = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])));
  expect(stored['demo:workflow-source']).toContain('Demo edit');
  expect(stored['real:workflow-source']).toBe('do not read this');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#workflow-source')).toHaveValue(/Pull request checks/);
  expect(await page.evaluate(() => localStorage.getItem('real:workflow-source'))).toBe('do not read this');
  await page.getByRole('link', { name: 'Plan my workflow' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#demo-banner')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('demo:workflow-source'))).toBeNull();
  await page.locator('#workflow-source').fill('name: Real edit\non: push\njobs: {}');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['real:workflow-source']);
});

test('@claim:offline-reload reloads the demo after its first controlled visit', async ({ page, context }) => {
  await page.goto('/demo', { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#result')).toContainText('Pull request checks');
  await context.setOffline(false);
});

test('@claim:local-browser makes no network request after loading while planning', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'networkidle' });
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('#workflow-source').press('End');
  await page.locator('#workflow-source').press('Enter');
  await page.getByRole('button', { name: /Show this workflow/ }).click();
  await expect(page.locator('#result')).toContainText('Pull request checks');
  expect(requests).toEqual([]);
});

test('@claim:free-no-account shows a zero-price, account-free entry point', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to use. No account.')).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in|log in|register|subscribe/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /sign in|log in|pay|subscribe/i })).toHaveCount(0);
});

test('@claim:workflow-decisions explains workflow, job, and step outcomes for pull request and push events', async ({ page }) => {
  const yaml = `name: Decision fixture
on:
  pull_request:
  push:
jobs:
  check:
    if: github.event_name == 'pull_request'
    steps:
      - name: Event-specific step
        if: github.event_name == 'push'
        run: echo event
`;
  let result = await plan(page, yaml, 'pull_request');
  await expect(result).toContainText('Workflow RUN');
  await expect(result).toContainText('Job if evaluated to true.');
  await result.locator('details').first().evaluate((element) => { (element as HTMLDetailsElement).open = true; });
  await expect(result).toContainText('Step if evaluated to false.');
  result = await plan(page, yaml, 'push');
  await expect(result).toContainText('Job if evaluated to false.');
});

test('@claim:event-filters applies event, branch, and path filters', async ({ page }) => {
  const yaml = `name: Filter fixture
on:
  pull_request:
    branches: [main]
    paths: ['src/**']
jobs:
  check:
    steps: [{ run: echo check }]
`;
  const result = await plan(page, yaml);
  await expect(result).toContainText('matched all configured trigger filters');
  await page.locator('#base').fill('release');
  await page.getByRole('button', { name: /Show this workflow/ }).click();
  await expect(result).toContainText('did not match branches');
  await page.locator('#base').fill('main');
  await page.locator('#paths').fill('docs/readme.md');
  await page.getByRole('button', { name: /Show this workflow/ }).click();
  await expect(result).toContainText('No changed path matched paths');
});

test('@claim:expressions evaluates job and step conditions', async ({ page }) => {
  const result = await plan(page, `name: Expression fixture
on: pull_request
jobs:
  check:
    if: startsWith(github.head_ref, 'feature/')
    steps:
      - name: Matching condition
        if: contains(github.head_ref, 'quiet')
        run: echo yes
      - name: Nonmatching condition
        if: github.base_ref == 'release'
        run: echo no
`);
  await result.locator('details').first().evaluate((element) => { (element as HTMLDetailsElement).open = true; });
  await expect(result).toContainText('Job if evaluated to true.');
  await expect(result).toContainText('Matching condition');
  await expect(result).toContainText('Step if evaluated to true.');
  await expect(result).toContainText('Step if evaluated to false.');
});

test('@claim:matrix-expansion applies Cartesian products plus include and exclude rules', async ({ page }) => {
  const result = await plan(page, `name: Matrix fixture
on: pull_request
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu, windows]
        node: [20, 22]
        exclude: [{ os: windows, node: 20 }]
        include: [{ os: macos, node: 22 }]
    steps: [{ run: echo test }]
`);
  await expect(result.locator('.summary')).toContainText('4 cells');
  await result.locator('details').first().evaluate((element) => { (element as HTMLDetailsElement).open = true; });
  for (const value of ['os=ubuntu node=20', 'os=ubuntu node=22', 'os=windows node=22', 'os=macos node=22']) await expect(result).toContainText(value);
  await expect(result).not.toContainText('os=windows node=20');
});

test('@claim:dependencies applies needs results and explicit status checks', async ({ page }) => {
  const result = await plan(page, `name: Dependency fixture
on: pull_request
jobs:
  upstream:
    if: false
    steps: [{ run: echo upstream }]
  blocked:
    needs: upstream
    steps: [{ run: echo blocked }]
  cleanup:
    needs: upstream
    if: always()
    steps: [{ run: echo cleanup }]
`);
  await expect(result.locator('summary').filter({ hasText: 'blocked' })).toContainText('Job if evaluated to false.');
  await expect(result.locator('summary').filter({ hasText: 'cleanup' })).toContainText('Job if evaluated to true.');
});

test('@claim:decision-reasons gives non-empty reasons for run, skip, and unknown results', async ({ page }) => {
  const result = await plan(page, `name: Reason fixture
on: pull_request
jobs:
  runs:
    if: true
    steps: [{ run: echo run }]
  skips:
    if: false
    steps: [{ run: echo skip }]
  unknown:
    if: secrets.MISSING != ''
    steps: [{ run: echo unknown }]
`);
  const rows = result.locator('summary');
  await expect(rows.filter({ hasText: 'runs' })).toContainText('Job if evaluated to true.');
  await expect(rows.filter({ hasText: 'skips' })).toContainText('Job if evaluated to false.');
  await expect(rows.filter({ hasText: 'unknown' })).toContainText('secrets.MISSING is not declared in this synthetic event.');
});

test('@claim:unknown-sources marks secrets, runner files, remote workflows, and live GitHub state unknown', async ({ page }) => {
  const result = await plan(page, `name: Unknown fixture
on: workflow_run
concurrency: release
jobs:
  remote:
    uses: owner/repository/.github/workflows/shared.yml@main
  inspect:
    steps:
      - if: hashFiles('**/Cargo.lock') != ''
        env:
          TOKEN: \${{ secrets.RELEASE_TOKEN }}
        run: echo inspect
`, 'workflow_run');
  for (const text of ['Secret values stay unknown', 'Runner files used by hashFiles() stay unknown', 'Remote reusable workflows are not loaded', 'Live GitHub concurrency state stays unknown', 'Live workflow_run payload details stay unknown']) await expect(result).toContainText(text);
});

test('@claim:supported-events plans every event offered by the browser', async ({ page }) => {
  await page.goto('/demo');
  const options = await page.locator('#event option').evaluateAll((items) => items.map((item) => (item as HTMLOptionElement).value));
  for (const event of options) {
    await page.locator('#workflow-source').fill(`name: ${event} fixture\non: ${event}\njobs:\n  check:\n    steps: [{ run: echo check }]\n`);
    await page.locator('#event').selectOption(event);
    await page.getByRole('button', { name: /Show this workflow/ }).click();
    await expect(page.locator('#result .summary')).toContainText('Workflow RUN');
  }
  expect(options).toEqual(['pull_request', 'push', 'workflow_dispatch', 'merge_group', 'schedule', 'workflow_run']);
});

test('@claim:browser-file-input plans an opened local workflow without uploading it', async ({ page }) => {
  await page.goto('/');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('#workflow-file').setInputFiles({
    name: 'local.yml',
    mimeType: 'text/yaml',
    buffer: Buffer.from('name: Local file\non: push\njobs:\n  check:\n    steps: [{ run: echo local }]\n'),
  });
  await expect(page.locator('#result')).toContainText('Local file');
  expect(requests).toEqual([]);
});

test('@claim:json-export copies the complete workflow plan as JSON', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Copy workflow plan as JSON' }).click();
  const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(copied.name).toBe('Pull request checks');
  expect(copied.jobs).toHaveLength(2);
  expect(copied.jobs[0].cells).toHaveLength(3);
});

test('@claim:cli-demo writes and reports the bundled sample in an isolated temporary directory', () => {
  execFileSync('cargo', ['build', '--quiet', '--bin', 'ghaplan'], { cwd: root });
  const dir = mkdtempSync(join(tmpdir(), 'ghaplan-claim-'));
  try {
    const run = spawnSync(binary, ['demo'], { cwd: dir, encoding: 'utf8' });
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('workflow Pull request checks');
    expect(run.stdout).toContain('job quality');
    const match = run.stderr.match(/Demo sample written to (.+pull-request\.yml)/);
    expect(match).not.toBeNull();
    const samplePath = match![1].trim();
    expect(samplePath.startsWith(tmpdir())).toBeTruthy();
    expect(readFileSync(samplePath, 'utf8')).toBe(readFileSync(join(root, 'examples/pull-request.yml'), 'utf8'));
    expect(readdirSync(dir)).toEqual([]);
    rmSync(resolve(samplePath, '..'), { recursive: true, force: true });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('@claim:cli-input accepts repository discovery, a named file, and standard input with equivalent decisions', () => {
  execFileSync('cargo', ['build', '--quiet', '--bin', 'ghaplan'], { cwd: root });
  const dir = mkdtempSync(join(tmpdir(), 'ghaplan-input-'));
  const yaml = 'name: CLI input\non: push\njobs:\n  check:\n    steps: [{ run: echo check }]\n';
  try {
    const workflows = join(dir, '.github/workflows');
    mkdirSync(workflows, { recursive: true });
    const path = join(workflows, 'ci.yml');
    writeFileSync(path, yaml);
    const args = ['--event', 'push', '--head', 'main', '--json'];
    const named = JSON.parse(execFileSync(binary, [path, ...args], { cwd: dir, encoding: 'utf8' }));
    const discovered = JSON.parse(execFileSync(binary, args, { cwd: dir, encoding: 'utf8' }));
    const stdin = spawnSync(binary, ['-', ...args], { cwd: dir, input: yaml, encoding: 'utf8' });
    expect(stdin.status).toBe(0);
    const fromStdin = JSON.parse(stdin.stdout);
    const decisions = (value: any) => value.workflows.map((workflow: any) => [workflow.decision.outcome, ...workflow.jobs.map((job: any) => job.decision.outcome)]);
    expect(decisions(discovered)).toEqual(decisions(named));
    expect(decisions(fromStdin)).toEqual(decisions(named));
    expect(decisions(named)).toEqual([['run', 'run']]);
    const help = execFileSync(binary, ['--help'], { cwd: dir, encoding: 'utf8' });
    expect(help).toContain('WORKFLOW');
    expect(help).toContain('--input');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('@claim:site-build-output produces the complete static site in dist/site', () => {
  for (const file of ['index.html', '404.html', 'staticwebapp.config.json', 'sitemap.xml', 'sw.js']) expect(existsSync(join(root, 'dist/site', file))).toBeTruthy();
  expect(readdirSync(join(root, 'dist/site/assets')).some((file) => /^index-.*\.js$/.test(file))).toBeTruthy();
});

test('@claim:cli-package creates a Rust release package', () => {
  execFileSync('cargo', ['package', '--allow-dirty', '--no-verify'], { cwd: root, encoding: 'utf8' });
  expect(existsSync(join(root, 'target/package/gha-dry-run-planner-0.1.0.crate'))).toBeTruthy();
});
