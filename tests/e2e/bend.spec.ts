import { test, expect, type Page } from '@playwright/test';
import { openHome } from './helpers';

const crop = async (page: Page) => {
  const b = (await page.locator('[data-slab]').boundingBox())!;
  return { buf: await page.screenshot({ clip: b, animations: 'disabled' }), b };
};

test.describe('the slab bend (brief 2.5, point 4)', () => {
  test('bends at the edges and stays neutral in the middle', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'on');
    const full = await crop(page);
    await page.evaluate(() => window.__bend?.setStrength(0));
    await page.waitForTimeout(100);
    const zero = await crop(page);
    const diff = await page.evaluate(async ([a, b]) => {
      const load = (s: string) => new Promise<ImageData>((res) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + s; });
      const [A, B] = await Promise.all([load(a), load(b)]);
      const w = A.width, h = A.height, band = Math.round(w * 40 / 360), inset = band + 6;
      let edge = 0, edgeContent = 0, innerBad = 0, inner = 0, innerMax = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
        const inBand = x < band || y < band || x >= w - band || y >= h - band;
        const deep = x >= inset && y >= inset && x < w - inset && y < h - inset;
        const content = Math.max(A.data[i], B.data[i]) > 60;
        if (inBand && content) { edgeContent++; if (d > 12) edge++; }
        if (deep) { inner++; innerMax = Math.max(innerMax, d); if (d > 2) innerBad++; }
      }
      return { edgeShare: edge / Math.max(1, edgeContent), innerOk: 1 - innerBad / inner, innerMax };
    }, [full.buf.toString('base64'), zero.buf.toString('base64')]);
    expect(diff.edgeShare, 'edge band bends').toBeGreaterThan(0.03);
    expect(diff.innerOk, 'centre neutral').toBeGreaterThanOrEqual(0.995);
    expect(diff.innerMax).toBeLessThanOrEqual(8);
  });

  test('registration: at strength 0 the copy sits on the page within 2 device px', async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await openHome(page);
    await page.evaluate(() => window.__bend?.setStrength(0));
    const b = (await page.locator('[data-slab]').boundingBox())!;
    const clip = { x: b.x + 30, y: b.y + 30, width: b.width - 60, height: b.height - 60 };
    await page.addStyleTag({ content: '[data-slab]{background:none!important;box-shadow:none!important}[data-slab]::before,[data-slab]::after{display:none!important}' });
    const withCopy = await page.screenshot({ clip });
    await page.evaluate(() => window.__bend?.destroy());
    const originals = await page.screenshot({ clip });
    const best = await page.evaluate(async ([a, b]) => {
      const load = (s: string) => new Promise<ImageData>((res) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + s; });
      const [A, B] = await Promise.all([load(a), load(b)]);
      const w = A.width, h = A.height;
      let bestD = Infinity, bx = 0, by = 0;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        let sum = 0;
        for (let y = 8; y < h - 8; y += 2) for (let x = 8; x < w - 8; x += 2) {
          const i = (y * w + x) * 4, j = ((y + dy) * w + (x + dx)) * 4;
          sum += Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]);
        }
        if (sum < bestD) { bestD = sum; bx = dx; by = dy; }
      }
      return { bx, by };
    }, [withCopy.toString('base64'), originals.toString('base64')]);
    expect(Math.abs(best.bx), 'x offset (device px)').toBeLessThanOrEqual(2);
    expect(Math.abs(best.by), 'y offset (device px)').toBeLessThanOrEqual(2);
    await ctx.close();
  });

  test('without canvas the plain slab stays, with no bend and no console error', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errs.push(m.text()));
    await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = (() => null) as never; });
    await openHome(page);
    await expect(page.locator('[data-slab]')).toBeVisible();
    await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'off');
    expect(errs).toEqual([]);
  });

  test('on touch the bend is off while the slab moves and back once it settles', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch only');
    await openHome(page);
    await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'on');
    await page.evaluate(() => scrollTo(0, 30));
    await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'off');
    await page.waitForTimeout(600);
    await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'on');
  });
});
