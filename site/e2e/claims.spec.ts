import { expect, test } from 'playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('@claim:sample-plan opens an immediate, explained sample result', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#result')).toContainText('Pull request checks');
  await expect(page.locator('#result')).toContainText('2 jobs');
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start for real' })).toBeVisible();
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
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem('demo:workflow-source'))).toBeNull();
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

test('@claim:local-browser makes no cross-origin request while planning', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo', { waitUntil: 'networkidle' });
  await page.locator('#workflow-source').press('End');
  await page.locator('#workflow-source').press('Enter');
  await page.getByRole('button', { name: /Show this workflow/ }).click();
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((request) => new URL(request).origin === 'http://127.0.0.1:4173')).toBeTruthy();
});

test('@claim:free-no-account shows a zero-price, account-free entry point', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to use. No account.')).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in|log in|register|subscribe/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /sign in|log in|pay|subscribe/i })).toHaveCount(0);
});

test('@claim:cli-demo runs the bundled workflow from a temporary directory', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ghaplan-claim-'));
  try {
    const output = execFileSync('cargo', ['run', '--quiet', '--manifest-path', join(process.cwd(), 'Cargo.toml'), '--', 'demo'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(output).toContain('workflow Pull request checks');
    expect(output).toContain('job quality');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
