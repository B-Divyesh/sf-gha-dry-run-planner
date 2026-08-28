import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { existsSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:4173';
const fleetChromium = '/opt/pw-browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch(existsSync(fleetChromium) ? { executablePath: fleetChromium } : {});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(String(error)));
await page.goto(`${url}/demo`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Show this workflow/ }).click();
await page.waitForTimeout(250);
const resultText = await page.locator('#result').innerText();
if (!resultText.includes('Pull request checks')) throw new Error(`Planner interaction failed: ${resultText.slice(0,300)}`);
const targetHeights = await page.evaluate(() => Object.fromEntries([
  ['wordmark', document.querySelector('.site-header .wordmark')],
  ['source', document.querySelector('.repo-link')],
  ['expand', document.querySelector('#expand-all')],
  ['copy', document.querySelector('#copy-json')],
].map(([name, element]) => [name, Math.round(element.getBoundingClientRect().height)])));
if (Object.values(targetHeights).some((height) => height < 44)) throw new Error(`Controls below 44px: ${JSON.stringify(targetHeights)}`);
await page.locator('#event').selectOption('push');
await page.locator('#workflow-source').fill(`name: Needs always
on: push
jobs:
  upstream:
    if: false
    steps: [{ run: echo upstream }]
  cleanup:
    needs: upstream
    if: always()
    steps: [{ run: echo cleanup }]
`);
await page.getByRole('button', { name: /Show this workflow/ }).click();
const cleanup = await page.locator('summary').filter({ hasText: 'cleanup' }).innerText();
if (!cleanup.includes('Job if evaluated to true.')) throw new Error(`always() regression: ${cleanup}`);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const lightReport = await new AxeBuilder({ page }).analyze();
await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
const darkReport = await new AxeBuilder({ page }).analyze();
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: 'networkidle' });
await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
const offlineReload = (await page.title()).includes('ghaplan');
await context.setOffline(false);
const seriousOrCritical = [...lightReport.violations, ...darkReport.violations].filter(v => ['serious','critical'].includes(v.impact ?? ''));
const output = { seriousOrCritical, themesChecked: ['light','dark + reduced motion'], offlineReload, consoleErrors: errors, horizontalOverflow: overflow, targetHeights };
console.log(JSON.stringify(output, null, 2));
await browser.close();
if (output.seriousOrCritical.length || errors.length || overflow > 1 || !offlineReload) process.exit(1);
