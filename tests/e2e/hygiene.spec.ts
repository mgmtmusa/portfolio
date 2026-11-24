import { test, expect } from '@playwright/test';
import { watchErrors, allPages } from './helpers';

const PAGES = allPages();
const BANNED = /\b(passionate|leverage|unlock|elevate|seamless|synergy|results-driven|cutting-edge|world-class|journey|empower|innovative|data-driven|strategic)\b|Hi, I’m|Hi, I'm|I sell like a human/i;

for (const path of PAGES) {
  test(`copy hygiene on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('load');
    await page.waitForTimeout(400);
    const html = await page.content();
    expect(html, 'em dash in page source').not.toMatch(/—|&mdash;|&#8212;/);
    expect(html, 'phone link').not.toMatch(/href="tel:/);
    const text = await page.locator('body').innerText();
    expect(text, 'Australian phone number').not.toMatch(/(\+61|\(0\d\)|\b04\d{2})[\s\d]{6,}/);
    expect(text, 'street address').not.toMatch(/\b\d+\s+\w+\s+(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Court|Ct)\b/);
    expect(text, 'banned word').not.toMatch(BANNED);
  });

}

for (const path of PAGES) {
  test(`no console errors on ${path}`, async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto(path);
    await page.waitForTimeout(path === '/' ? 2500 : 1200);
    errs.assertClean();
  });
}

test('llms.txt carries every case with its scope labels', async ({ request }) => {
  const t = await (await request.get('/llms.txt')).text();
  expect(t).toContain('Paid media rebuilt around lead quality');
  expect(t).toContain('80% pipeline growth, quarter on quarter (Company pipeline)');
  expect(t).toContain('768 children reached to date (Organisation total)');
  expect(t).not.toMatch(/—/);
});

test('reduced motion: nothing animates, the slab sits at rest and scrolls with the hero', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForTimeout(1500);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
  expect(await page.locator('[data-slab]').evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
  expect(await page.locator('[data-slab]').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  await ctx.close();
});

test('no JavaScript: every hero fact is in the HTML and the dock is visible', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const text = await page.locator('body').innerText();
  for (const s of ['Musa Abdullah', 'I carried a sales target', '28%', '65%', '$2M+', '13,200', 'Two results from the same initiative']) expect(text).toContain(s);
  await expect(page.locator('[data-dock]')).toBeVisible();
  await expect(page.locator('.dock-menu')).toBeHidden();
  await ctx.close();
});
