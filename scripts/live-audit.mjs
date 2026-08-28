import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const base = new URL(process.argv[2] ?? 'https://gha-dry-run-planner.sociobot.in').origin;
const evidenceDir = process.argv[3] ?? '.factory/evidence/polish-3';
const chromiumPath = '/opt/pw-browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch(existsSync(chromiumPath) ? { executablePath: chromiumPath } : {});
mkdirSync(evidenceDir, { recursive: true });

const routes = [
  ['/', 200], ['/demo', 200], ['/privacy', 200], ['/terms', 200], ['/404.html', 404], ['/not-a-real-route', 404],
];
const requiredMetadata = [
  'meta[name="description"]', 'link[rel="canonical"]', 'link[rel="manifest"]',
  'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]',
  'meta[name="twitter:card"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'meta[name="twitter:image"]',
];
const routeAudit = [];
let expectedChrome;

for (const [route, expectedStatus] of routes) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    const expected404 = expectedStatus === 404 && message.text().includes('Failed to load resource: the server responded with a status of 404');
    if (message.type() === 'error' && !expected404) errors.push(message.text());
  });
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  const state = await page.evaluate(selectors => {
    const readLinks = selector => [...document.querySelectorAll(selector)].map(link => {
      const url = new URL(link.href);
      return `${link.textContent?.replace(/\s+/g, ' ').trim()}|${url.origin === location.origin ? `${url.pathname}${url.hash}` : url.href}`;
    });
    const external = [...document.querySelectorAll('a[href^="http"]')].map(link => ({
      href: link.href,
      classed: link.classList.contains('external-link'),
      hasVisibleMark: Boolean(link.querySelector('.external-mark')),
      hasScreenReaderLabel: Boolean(link.querySelector('.sr-only')?.textContent?.match(/external link/i)),
    }));
    const undersized = [...document.querySelectorAll('a,button,input,select,textarea,summary,label.file-button')]
      .filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return !(element instanceof HTMLInputElement && element.type === 'file') && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 1 && rect.height > 1;
      })
      .filter(element => element.getBoundingClientRect().width < 44 || element.getBoundingClientRect().height < 44)
      .map(element => `${element.tagName.toLowerCase()}#${element.id}:${Math.round(element.getBoundingClientRect().width)}x${Math.round(element.getBoundingClientRect().height)}`);
    return {
      title: document.title,
      h1Count: document.querySelectorAll('h1').length,
      h1: document.querySelector('h1')?.textContent?.trim(),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      missingMetadata: selectors.filter(selector => !document.querySelector(selector)),
      header: readLinks('#site-header a'),
      footer: readLinks('#site-footer a'),
      footerText: document.querySelector('#site-footer')?.textContent?.replace(/\s+/g, ' ').trim(),
      external,
      undersized,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, requiredMetadata);
  const chrome = { header: state.header, footer: state.footer, footerText: state.footerText };
  expectedChrome ??= chrome;
  routeAudit.push({ route, expectedStatus, status: response?.status(), ...state, chromeMatchesHome: JSON.stringify(chrome) === JSON.stringify(expectedChrome), errors });
  if (route === '/') await page.screenshot({ path: join(evidenceDir, 'live-home-mobile.png') });
  if (route === '/404.html') await page.screenshot({ path: join(evidenceDir, 'live-404-mobile.png') });
  await context.close();
}

async function viewportEvidence(viewport, route, screenshot) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(evidenceDir, screenshot) });
  const firstScreen = await page.evaluate(size => {
    const rect = selector => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box && box.width > 0 && box.height > 0 ? { top: Math.round(box.top), bottom: Math.round(box.bottom) } : null;
    };
    return {
      heading: document.querySelector('h1')?.textContent?.trim(),
      action: document.querySelector('.hero-actions .primary')?.textContent?.trim(),
      facts: document.querySelector('.plain-facts')?.textContent?.replace(/\s+/g, ' ').trim(),
      summary: document.querySelector('#result .summary')?.textContent?.replace(/\s+/g, ' ').trim(),
      firstJob: document.querySelector('#result details summary')?.textContent?.replace(/\s+/g, ' ').trim(),
      actionBox: rect('.hero-actions .primary'),
      factsBox: rect('.plain-facts'),
      summaryBox: rect('#result .summary'),
      firstJobBox: rect('#result details summary'),
      viewport: size,
    };
  }, viewport);
  await context.close();
  return firstScreen;
}

const firstScreens = {
  mobileHome: await viewportEvidence({ width: 390, height: 844 }, '/', 'live-home-mobile-viewport.png'),
  desktopHome: await viewportEvidence({ width: 1440, height: 900 }, '/', 'live-home-desktop-viewport.png'),
  mobileDemo: await viewportEvidence({ width: 390, height: 844 }, '/demo', 'live-demo-mobile.png'),
  desktopDemo: await viewportEvidence({ width: 1440, height: 900 }, '/demo', 'live-demo-desktop.png'),
};

const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const demoPage = await demoContext.newPage();
await demoPage.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
const queryEntry = await demoPage.evaluate(() => ({
  path: `${location.pathname}${location.search}`,
  title: document.title,
  bannerVisible: !document.querySelector('#demo-banner')?.hidden,
  summary: document.querySelector('#result .summary')?.textContent?.replace(/\s+/g, ' ').trim(),
}));
const requestsAfterLoad = [];
demoPage.on('request', request => requestsAfterLoad.push(request.url()));
await demoPage.evaluate(() => localStorage.setItem('real:sentinel', 'untouched'));
await demoPage.locator('#workflow-source').fill('name: Demo edit\non: push\njobs: {}');
await demoPage.getByRole('button', { name: /Show this workflow/ }).click();
const editedStorage = await demoPage.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])));
await demoPage.getByRole('button', { name: 'Reset demo' }).click();
const resetRestoredSample = await demoPage.locator('#workflow-source').inputValue().then(value => value.includes('Pull request checks'));
await demoPage.getByRole('link', { name: 'Plan my workflow' }).click();
const exitState = await demoPage.evaluate(() => ({
  path: location.pathname,
  bannerHidden: document.querySelector('#demo-banner')?.hidden,
  demoValue: localStorage.getItem('demo:workflow-source'),
  realSentinel: localStorage.getItem('real:sentinel'),
}));
await demoContext.close();

const focusContext = await browser.newContext();
const focusPage = await focusContext.newPage();
await focusPage.goto(base);
await focusPage.getByRole('link', { name: 'Privacy' }).first().click();
await focusPage.waitForFunction(() => document.activeElement?.id === 'privacy-title');
const privacyFocus = await focusPage.evaluate(() => document.activeElement?.textContent?.trim());
await focusPage.goBack();
await focusPage.waitForFunction(() => document.activeElement?.id === 'hero-title');
const backFocus = await focusPage.evaluate(() => document.activeElement?.textContent?.trim());
await focusContext.close();

const crawlContext = await browser.newContext();
const crawlPage = await crawlContext.newPage();
const links = new Set();
const fragments = [];
for (const [route] of routes.slice(0, 5)) {
  await crawlPage.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  for (const href of await crawlPage.locator('a[href]').evaluateAll(items => items.map(item => item.href))) links.add(href);
}
const linkResults = [];
for (const href of links) {
  const url = new URL(href);
  if (url.hash && url.origin === base) {
    await crawlPage.goto(url.href, { waitUntil: 'networkidle' });
    fragments.push({ href, found: await crawlPage.locator(url.hash).count() === 1 });
  }
  url.hash = '';
  const response = await fetch(url.href, { redirect: 'follow' });
  linkResults.push({ href: url.href, status: response.status });
}
await crawlContext.close();

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const localIndex = readFileSync('dist/site/index.html');
const liveIndex = Buffer.from(await (await fetch(`${base}/`)).arrayBuffer());
const local404 = readFileSync('dist/site/404.html');
const live404 = Buffer.from(await (await fetch(`${base}/404.html`)).arrayBuffer());
const assetPaths = [...new Set([
  ...String(localIndex).matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g),
  ...String(local404).matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g),
].map(match => match[1]))];
const assetHashes = [];
for (const path of assetPaths) {
  const local = readFileSync(join('dist/site/assets', basename(path)));
  const live = Buffer.from(await (await fetch(`${base}${path}`)).arrayBuffer());
  assetHashes.push({ path, matches: sha256(local) === sha256(live), bytes: local.length });
}

const report = {
  checkedAt: new Date().toISOString(),
  base,
  routeAudit,
  firstScreens,
  demo: { queryEntry, requestsAfterLoad, editedStorage, resetRestoredSample, exitState },
  focus: { privacyFocus, backFocus },
  crawl: { links: linkResults, fragments },
  deploymentParity: {
    indexMatches: sha256(localIndex) === sha256(liveIndex),
    notFoundMatches: sha256(local404) === sha256(live404),
    assets: assetHashes,
  },
};
writeFileSync(join(evidenceDir, 'live-check.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();

const failures = [];
for (const route of routeAudit) {
  if (route.status !== route.expectedStatus) failures.push(`${route.route}: status ${route.status}`);
  if (route.h1Count !== 1) failures.push(`${route.route}: ${route.h1Count} h1 elements`);
  if (route.missingMetadata.length) failures.push(`${route.route}: missing metadata`);
  if (!route.chromeMatchesHome) failures.push(`${route.route}: chrome differs from home`);
  if (route.external.some(link => !link.classed || !link.hasVisibleMark || !link.hasScreenReaderLabel)) failures.push(`${route.route}: unmarked external link`);
  if (route.undersized.length) failures.push(`${route.route}: undersized controls`);
  if (route.overflow > 1) failures.push(`${route.route}: horizontal overflow`);
  if (route.errors.length) failures.push(`${route.route}: console errors`);
}
for (const key of ['mobileHome', 'desktopHome']) {
  const screen = firstScreens[key];
  if (screen.heading !== 'Plan a GitHub Actions workflow' || screen.action !== 'Try it with sample data' || screen.factsBox?.bottom > screen.viewport.height) failures.push(`${key}: incomplete first screen`);
}
for (const key of ['mobileDemo', 'desktopDemo']) {
  const screen = firstScreens[key];
  if (!screen.summary?.includes('Workflow RUN') || !screen.firstJob?.includes('Job if evaluated to true.') || screen.firstJobBox?.bottom > screen.viewport.height) failures.push(`${key}: sample result outside first screen`);
}
if (!queryEntry.bannerVisible || !queryEntry.summary?.includes('Workflow RUN')) failures.push('query demo did not open immediately');
if (requestsAfterLoad.length || !resetRestoredSample || exitState.path !== '/' || !exitState.bannerHidden || exitState.demoValue !== null || exitState.realSentinel !== 'untouched') failures.push('demo isolation/reset/exit failed');
if (privacyFocus !== 'Privacy for the workflow planner' || backFocus !== 'Plan a GitHub Actions workflow') failures.push('route focus restoration failed');
if (linkResults.some(link => link.status >= 400 && !link.href.endsWith('/404.html')) || fragments.some(fragment => !fragment.found)) failures.push('link crawl failed');
if (!report.deploymentParity.indexMatches || !report.deploymentParity.notFoundMatches || assetHashes.some(asset => !asset.matches)) failures.push('deployment differs from dist/site');
if (failures.length) throw new Error(`Live audit failed:\n${failures.join('\n')}`);
