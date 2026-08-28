import { expect, test } from 'playwright/test';

test('routes set titles, a single visible h1, and focus destination', async ({ page }) => {
  for (const [route, title, heading] of [['/', 'ghaplan — Plan GitHub Actions workflows', 'Plan a GitHub Actions workflow'], ['/privacy', 'Privacy — ghaplan', 'Privacy for the workflow planner'], ['/terms', 'Terms — ghaplan', 'Terms for using ghaplan'], ['/not-a-real-route', 'Page not found — ghaplan', 'This workflow path does not exist']]) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy for the workflow planner' })).toBeFocused();
});

test('mobile demo stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Sample GitHub Actions workflow plan' })).toBeVisible();
});

test('the query-string demo entry opens the isolated sample', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — ghaplan');
  await expect(page.locator('#result')).toContainText('Pull request checks');
});
