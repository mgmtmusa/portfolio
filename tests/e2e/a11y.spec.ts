import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CASES } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const path of ['/', ...CASES.map((c) => `/work/${c.slug}/`), '/missing-page/']) {
  test(`axe finds no WCAG 2.2 AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(900); // let the hero deal-in finish
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });
}

test.describe('keyboard', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard journeys run on desktop projects');

  test('skip link is first and moves focus to the main content', async ({ page, browserName }) => {
    await page.goto('/');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('hero cards are reachable by keyboard with a visible focus ring', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari only tabs to links with the Option key; covered in Chromium and Firefox');
    await page.goto('/');
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      await page.keyboard.press('Tab');
      found = await page.evaluate(() => document.activeElement?.closest('.hand') !== null);
    }
    expect(found).toBe(true);
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/work\/evitech\/$/);
  });

  test('focused elements are never hidden under the sticky header', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari tab order requires Option; covered in Chromium and Firefox');
    await page.goto('/work/evitech/');
    const header = await page.locator('.top').boundingBox();
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(450); // let smooth scrolling settle
      const r = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const b = el.getBoundingClientRect();
        return { top: b.top, inHeader: !!el.closest('.top'), skip: el.classList.contains('skip') || el === document.body };
      });
      if (!r.inHeader && !r.skip) expect(r.top, `tab stop ${i} sits under the header`).toBeGreaterThanOrEqual(header!.height - 1);
    }
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no animations run and content is complete', async ({ page }) => {
    await page.goto('/#career');
    await page.waitForTimeout(300);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running).toBe(0);
    const t = await page.locator('.blk').first().evaluate((el) => getComputedStyle(el).transform);
    expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
    await expect(page.locator('.results dd').first()).toHaveText('28%');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  });
});
