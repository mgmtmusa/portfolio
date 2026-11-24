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

  // Head of engineering r2, fix 1: at a fractional device-pixel ratio (Pixel 7, 2.625) a multi-layer mask seamed
  // along the slab's edges. With the bent copy hidden, masks on vs masks off must differ only inside the hole:
  // no original left inside it, and not one pixel changed more than 2px outside it.
  for (const y of [0, 45]) {
    test(`knock-out at y ${y}: originals gone inside the hole, nothing changed outside it`, async ({ page }, info) => {
      test.skip(!['mobile-chrome', 'mobile-safari'].includes(info.project.name), 'phone engines (fractional DPR on Pixel 7)');
      await openHome(page);
      await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'on');
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate((s) => scrollTo(0, s), y);
      await page.waitForTimeout(700);
      await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'on');
      await page.addStyleTag({ content: '[data-slab]{background:none!important;box-shadow:none!important}[data-slab]::before,[data-slab]::after{display:none!important}[data-slab-shadow]{display:none!important}svg.bend{visibility:hidden!important}' });
      const g = await page.evaluate(() => {
        const s = document.querySelector<HTMLElement>('[data-slab]')!, r = s.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height, r: parseFloat(getComputedStyle(s).borderTopLeftRadius), vw: innerWidth };
      });
      const pad = 40;
      const clip = { x: Math.max(0, g.x - pad), y: Math.max(0, g.y - pad), width: 0, height: g.h + pad * 2 };
      clip.width = Math.min(g.w + pad * 2, g.vw - clip.x);
      const masked = await page.screenshot({ clip, animations: 'disabled' });
      const targets = '.mast [data-line], [data-portrait]';
      const layers = await page.evaluate((sel) => [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.style.maskImage || e.style.webkitMaskImage).length, targets);
      expect(layers, 'masks are on').toBeGreaterThan(0);
      await page.evaluate((sel) => { for (const e of document.querySelectorAll<HTMLElement>(sel)) { e.style.maskImage = 'none'; e.style.webkitMaskImage = 'none'; } }, targets);
      const bare = await page.screenshot({ clip, animations: 'disabled' });
      const res = await page.evaluate(async ([a, b, rect]) => {
        const load = (s: string) => new Promise<ImageData>((ok) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d')!; x.drawImage(i, 0, 0); ok(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + s; });
        const [A, B] = await Promise.all([load(a as string), load(b as string)]);
        const R = rect as { x: number; y: number; w: number; h: number; r: number; cw: number };
        const k = A.width / R.cw; // device px per CSS px
        const cx = R.x + R.w / 2, cy = R.y + R.h / 2, hw = R.w / 2, hh = R.h / 2;
        const sd = (px: number, py: number) => { const qx = Math.abs(px - cx) - (hw - R.r), qy = Math.abs(py - cy) - (hh - R.r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R.r; };
        let insideOriginal = 0, outsideChanged = 0, outMax = 0;
        for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) {
          const i = (y * A.width + x) * 4, d = sd((x + 0.5) / k, (y + 0.5) / k);
          const la = Math.max(A.data[i], A.data[i + 1], A.data[i + 2]), lb = Math.max(B.data[i], B.data[i + 1], B.data[i + 2]);
          if (d < -2) { if (la > 90 && lb > 90) insideOriginal++; }
          else if (d > 2) { const dd = Math.abs(la - lb); outMax = Math.max(outMax, dd); if (dd > 10) outsideChanged++; }
        }
        return { insideOriginal, outsideChanged, outMax };
      }, [masked.toString('base64'), bare.toString('base64'), { x: g.x - clip.x, y: g.y - clip.y, w: g.w, h: g.h, r: g.r, cw: clip.width }] as const);
      expect(res.insideOriginal, 'original pixels left inside the hole').toBe(0);
      expect(res.outsideChanged, `pixels changed outside the hole (max ${res.outMax} levels)`).toBe(0);
    });
  }

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
