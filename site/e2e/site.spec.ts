import { expect, test } from 'playwright/test';

const routes = [
  ['/', 'ghaplan — Plan GitHub Actions workflows', 'Plan a GitHub Actions workflow'],
  ['/demo', 'Demo — ghaplan', 'Sample GitHub Actions workflow plan'],
  ['/privacy', 'Privacy — ghaplan', 'Privacy for the workflow planner'],
  ['/terms', 'Terms — ghaplan', 'Terms for using ghaplan'],
] as const;

test('routes set titles, descriptions, canonicals, social metadata, and exactly one h1', async ({ page }) => {
  for (const [route, title, heading] of routes) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', route === '/' ? /\/$/ : new RegExp(`${route}$`));
    for (const selector of ['meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[name="twitter:card"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'meta[name="twitter:image"]']) {
      await expect(page.locator(selector)).toHaveAttribute('content', /.+/);
    }
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  }
});

test('browser Back and Forward restore route heading focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy for the workflow planner' })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Plan a GitHub Actions workflow' })).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy for the workflow planner' })).toBeFocused();

  await page.getByRole('link', { name: 'Terms' }).last().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Terms for using ghaplan' })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy for the workflow planner' })).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Terms for using ghaplan' })).toBeFocused();

  await page.goto('/');
  await page.getByRole('link', { name: 'Demo' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sample GitHub Actions workflow plan' })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Plan a GitHub Actions workflow' })).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Sample GitHub Actions workflow plan' })).toBeFocused();
});

test('demo banner appears only in demo mode and leaves cleanly', async ({ page }) => {
  for (const route of ['/', '/privacy', '/terms']) {
    await page.goto(route);
    await expect(page.locator('#demo-banner')).toBeHidden();
  }
  await page.goto('/demo');
  await expect(page.locator('#demo-banner')).toBeVisible();
  await page.getByRole('link', { name: 'Plan my workflow' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#demo-banner')).toBeHidden();
});

test('unknown routes and the 404 document return a designed HTTP 404', async ({ page, request }) => {
  for (const route of ['/not-a-real-route', '/404.html']) {
    const response = await request.get(route);
    expect(response.status()).toBe(404);
    await page.goto(route);
    await expect(page).toHaveTitle('Page not found — ghaplan');
    await expect(page.getByRole('heading', { level: 1, name: 'This workflow path does not exist' })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Return to the planner' })).toBeVisible();
    const canonicalPath = route.replace('.', '\\.');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${canonicalPath}$`));
    for (const selector of ['meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[name="twitter:card"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'meta[name="twitter:image"]', 'link[rel="manifest"]']) {
      await expect(page.locator(selector)).toHaveCount(1);
    }
  }
});

test('every route uses the same header and footer links', async ({ page }) => {
  const readChrome = () => page.evaluate(() => {
    const readLinks = (selector: string) => [...document.querySelectorAll<HTMLAnchorElement>(selector)].map((link) => {
      const url = new URL(link.href);
      return `${link.textContent?.replace(/\s+/g, ' ').trim()}|${url.origin === location.origin ? `${url.pathname}${url.hash}` : url.href}`;
    });
    return {
      header: readLinks('#site-header a'),
      footer: readLinks('#site-footer a'),
      footerText: document.querySelector('#site-footer')?.textContent?.replace(/\s+/g, ' ').trim(),
    };
  });
  await page.goto('/');
  const expected = await readChrome();
  for (const route of ['/demo', '/privacy', '/terms', '/404.html', '/not-a-real-route']) {
    await page.goto(route);
    expect(await readChrome(), `${route} must retain the shared site chrome`).toEqual(expected);
  }
});

test('every off-origin link is visibly and accessibly marked as external', async ({ page }) => {
  for (const route of ['/', '/demo', '/privacy', '/terms', '/404.html', '/not-a-real-route']) {
    await page.goto(route);
    const external = page.locator('a[href^="http"]:visible');
    for (const link of await external.all()) {
      expect(await link.getAttribute('class')).toContain('external-link');
      await expect(link).toHaveAccessibleName(/external link/i);
      await expect(link.locator('.external-mark')).toBeVisible();
    }
  }
});

test('all visible mobile controls meet the 44px target baseline on every route', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/demo', '/privacy', '/terms', '/not-a-real-route']) {
    await page.goto(route);
    const undersized = await page.locator('a,button,input,select,textarea,summary,label.file-button').evaluateAll((elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return !(element instanceof HTMLInputElement && element.type === 'file') && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 1 && rect.height > 1;
      })
      .filter((element) => element.getBoundingClientRect().width < 44 || element.getBoundingClientRect().height < 44)
      .map((element) => `${element.tagName.toLowerCase()}#${element.id}.${element.className}:${Math.round(element.getBoundingClientRect().width)}x${Math.round(element.getBoundingClientRect().height)}`));
    expect(undersized, `${route} has undersized targets`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test('the query-string demo entry opens the isolated sample', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — ghaplan');
  await expect(page.locator('#demo-banner')).toBeVisible();
  await expect(page.locator('#result')).toContainText('Pull request checks');
});
