import { test, expect, type Page } from '@playwright/test';
import { openHome } from './helpers';

/** Visible elements (and their ::before, ::after, ::backdrop) with a backdrop blur. */
const blurred = (page: Page) => page.evaluate(() => {
  const out: string[] = [];
  const vis = (el: Element) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0; };
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    for (const pseudo of [null, '::before', '::after', '::backdrop']) {
      const s = getComputedStyle(el, pseudo);
      const f = s.backdropFilter || (s as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter;
      if (f && f !== 'none') out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}${pseudo ?? ''}`);
    }
  }
  return out;
});

test.describe('glass budget and fallbacks', () => {
  test('at most 4 blurred surfaces: rest, mid-flight, docked, ⌘K open with a toast', async ({ page, isMobile }) => {
    await openHome(page);
    expect((await blurred(page)).length).toBeLessThanOrEqual(4);
    await page.evaluate(() => scrollTo(0, 200));
    await page.waitForTimeout(150);
    expect((await blurred(page)).length).toBeLessThanOrEqual(4);
    await page.waitForFunction(() => window.__scene?.state() === 'docked');
    expect((await blurred(page)).length).toBeLessThanOrEqual(4);
    if (!isMobile) {
      await page.keyboard.press('Control+k');
      await page.locator('#cmdk-q').fill('email');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Control+k');
      expect((await blurred(page)).length).toBeLessThanOrEqual(4);
    }
  });

  test('on phones every blurred element is fixed or small', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await openHome(page);
    await page.evaluate(() => scrollTo(0, 400));
    await page.waitForTimeout(1200);
    const big = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => {
      const s = getComputedStyle(el); const f = s.backdropFilter || (s as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter;
      if (!f || f === 'none') return false;
      const r = el.getBoundingClientRect();
      return s.position !== 'fixed' && r.width * r.height > innerWidth * innerHeight * 0.25;
    }).length);
    expect(big).toBe(0);
  });

  test('reduced transparency (Chromium, through CDP): solid chrome, no slab, the name fully visible', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP emulation');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
    await openHome(page, { settle: false });
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-slab]')).toBeHidden();
    expect(await page.locator('.mast').evaluate((el) => getComputedStyle(el).maskImage)).toBe('none');
    const dock = await page.locator('[data-dock]').evaluate((el) => ({ f: getComputedStyle(el).backdropFilter, bg: getComputedStyle(el).backgroundColor }));
    expect(dock.f).toBe('none');
    expect(dock.bg).toBe('rgb(33, 31, 28)');
  });

  test('high contrast and forced colours: no slab', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' } as never);
    await openHome(page, { settle: false });
    await page.waitForTimeout(1200);
    await expect(page.locator('[data-slab]')).toBeHidden();
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(page.locator('[data-slab]')).toBeHidden();
  });
});
