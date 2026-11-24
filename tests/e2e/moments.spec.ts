import { test, expect, type Page } from '@playwright/test';
import { openHome } from './helpers';

/** Task 5 moments: load order (DESIGN.md, Motion), M7, M9, H2 and the drag on touch. */

const decode = `(s) => new Promise((res) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + s; })`;

test.describe('load order (DESIGN.md, Motion)', () => {
  test('content is visible at first paint and the rise is transform-only', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const r = await page.evaluate(() => {
      const sel = ['.mast', '[data-portrait]', '.hero .lead', '.hero .proof > li:nth-child(1)', '.hero .proof > li:nth-child(2)', '.hero .proof > li:nth-child(3)', '[data-hero-avail]'];
      const out: { sel: string; opacity: string; visibility: string; props: string[] }[] = [];
      for (const s of sel) {
        const el = document.querySelector(s)!;
        const cs = getComputedStyle(el);
        const props = new Set<string>();
        for (const a of el.getAnimations()) {
          for (const kf of (a.effect as KeyframeEffect).getKeyframes()) {
            for (const k of Object.keys(kf)) if (!['offset', 'easing', 'composite', 'computedOffset'].includes(k)) props.add(k);
          }
        }
        out.push({ sel: s, opacity: cs.opacity, visibility: cs.visibility, props: [...props] });
      }
      return out;
    });
    for (const e of r) {
      expect(e.opacity, `${e.sel} opacity at first paint`).toBe('1');
      expect(e.visibility, e.sel).toBe('visible');
      for (const p of e.props) expect(p, `${e.sel} animates ${p}`).toBe('transform');
    }
    // The masthead and the portrait never animate at all.
    expect(r.find((e) => e.sel === '.mast')!.props).toEqual([]);
    expect(r.find((e) => e.sel === '[data-portrait]')!.props).toEqual([]);
  });

  test('reduced motion: everything is at rest, nothing animates', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const r = await page.evaluate(() => {
      const slab = getComputedStyle(document.querySelector('[data-slab]')!);
      return {
        slabOpacity: slab.opacity,
        slabTranslate: slab.translate,
        animated: ['.lead', '.proof > li', '[data-hero-avail]'].flatMap((s) => [...document.querySelectorAll(s)].map((e) => e.getAnimations().length)),
      };
    });
    expect(r.slabOpacity).toBe('1');
    expect(r.slabTranslate).toBe('none');
    expect(r.animated.every((n) => n === 0)).toBe(true);
    await ctx.close();
  });
});

test.describe('M7: first paint of the slab', () => {
  test('waits off to the left at opacity 0 and leaves nothing on screen', async ({ page }) => {
    // Block the hero module: first paint shows exactly what CSS alone gives, with no glide to race.
    await page.route(/\/(_astro\/hero\.[^/]+\.js|src\/scripts\/hero(\.ts)?)(\?.*)?$/, (r) => r.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const s = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('[data-slab]')!);
      const sh = getComputedStyle(document.querySelector('[data-slab-shadow]')!);
      return { o: cs.opacity, t: cs.translate, so: sh.opacity, jsClass: document.documentElement.classList.contains('js') };
    });
    expect(s.jsClass).toBe(true);
    expect(s.o).toBe('0');
    expect(s.so).toBe('0');
    expect(s.t).not.toBe('none');
    expect(parseFloat(s.t)).toBeLessThan(0);
  });

  test('a screenshot at DOMContentLoaded matches the page with the slab removed', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium screenshot per the plan');
    // Block the hero module: first paint shows exactly what CSS alone gives, with no glide to race.
    await page.route(/\/(_astro\/hero\.[^/]+\.js|src\/scripts\/hero(\.ts)?)(\?.*)?$/, (r) => r.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const b = (await page.locator('[data-slab]').boundingBox())!;
    const clip = { x: Math.max(0, b.x - 12), y: b.y, width: b.width + 24, height: b.height };
    const early = await page.screenshot({ clip, animations: 'allow' });
    await page.addStyleTag({ content: '[data-slab],[data-slab-shadow]{display:none!important}' });
    const without = await page.screenshot({ clip, animations: 'allow' });
    const share = await page.evaluate(async ([a, c]) => {
      const load = (s: string) => new Promise<ImageData>((res) => { const i = new Image(); i.onload = () => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + s; });
      const [A, B] = await Promise.all([load(a), load(c)]);
      let bad = 0;
      for (let i = 0; i < A.data.length; i += 4) if (Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2])) > 10) bad++;
      return bad / (A.data.length / 4);
    }, [early.toString('base64'), without.toString('base64')]);
    // Late rises on neighbouring content may move a few pixels; the slab itself must not show.
    expect(share).toBeLessThan(0.02);
  });

  test('without JavaScript the slab sits at rest with no bend', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    const slab = page.locator('[data-slab]');
    await expect(slab).toBeVisible();
    const s = await slab.evaluate((el) => ({ o: getComputedStyle(el).opacity, t: getComputedStyle(el).translate, bend: el.querySelectorAll('svg.bend').length, js: document.documentElement.classList.contains('js') }));
    expect(s).toEqual({ o: '1', t: 'none', bend: 0, js: false });
    await ctx.close();
  });
});

test.describe('M9: pixel contrast of text over the slab and the hero', () => {
  const lum = (r: number, g: number, b: number) => {
    const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  async function check(page: Page, label: string, only: 'dock' | 'page' = 'page') {
    const state = label;
    const targets = await page.evaluate(() => {
      const sel = ['.strip p', '.hero .role', '.hero .line', '.hero .lab', '.hero .cap', '[data-hero-avail] p', '.hero .fig', '[data-dock] button', '[data-dock] a'];
      const out: { sel: string; i: number; color: [number, number, number]; box: { x: number; y: number; width: number; height: number } }[] = [];
      const vw = innerWidth, vh = innerHeight;
      for (const s of sel) {
        [...document.querySelectorAll<HTMLElement>(s)].forEach((el, i) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (cs.visibility === 'hidden' || cs.display === 'none' || (el.closest('[inert]') && !el.closest('[data-dock][data-shown]'))) return;
          const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(vw, r.right), y1 = Math.min(vh, r.bottom);
          // Skip labels that are mostly off screen: a clipped sliver would sample the dock's resting edge instead.
          if (x1 - x0 < 4 || y1 - y0 < 4 || (x1 - x0) * (y1 - y0) < 0.6 * r.width * r.height) return;
          const m = cs.color.match(/[\d.]+/g)!.map(Number);
          out.push({ sel: s, i, color: [m[0], m[1], m[2]], box: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } });
        });
      }
      return out;
    });
    const picked = targets.filter((t) => (only === 'dock') === (t.sel.startsWith('[data-dock]') || (only === 'dock' || state === 'docked') && t.sel.startsWith('.strip')));
    expect(picked.length, `${label}: found labels`).toBeGreaterThan(0);
    await page.addStyleTag({ content: '.strip p,.hero .role,.hero .line,.hero .lab,.hero .cap,[data-hero-avail] p,.hero .fig,[data-dock] *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}' });
    await page.waitForTimeout(150);
    let minRatio = Infinity;
    for (const t of picked) {
      const buf = await page.screenshot({ clip: t.box, animations: 'disabled' });
      const brightest = await page.evaluate(async ([b]) => {
        // eslint-disable-next-line no-new-func
        const img: ImageData = await new Promise((res) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + b; });
        let best = 0, pr = 0, pg = 0, pb = 0;
        const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        for (let k = 0; k < img.data.length; k += 4) {
          const L = 0.2126 * f(img.data[k]) + 0.7152 * f(img.data[k + 1]) + 0.0722 * f(img.data[k + 2]);
          if (L > best) { best = L; pr = img.data[k]; pg = img.data[k + 1]; pb = img.data[k + 2]; }
        }
        return { L: best, rgb: [pr, pg, pb] };
      }, [buf.toString('base64')]);
      const lt = lum(...t.color);
      const ratio = (Math.max(lt, brightest.L) + 0.05) / (Math.min(lt, brightest.L) + 0.05);
      minRatio = Math.min(minRatio, ratio);
      expect(ratio, `${label} ${t.sel}[${t.i}] text ${t.color} over brightest ${brightest.rgb}`).toBeGreaterThanOrEqual(4.5);
    }
    console.log(`M9 ${label}: min contrast ${minRatio.toFixed(2)}:1`);
  }

  test('rest', async ({ page }) => {
    await openHome(page);
    await check(page, 'rest');
  });

  test('scrolled 45px, the name sliding through the slab', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => window.__scene?.setProgress(45));
    await page.waitForTimeout(400);
    await check(page, 'y45');
  });

  test('docked, over the next section', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => window.__scene?.setProgress(200));
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 5000 });
    await page.waitForTimeout(900);
    await check(page, 'docked');
  });

  test('docked, the dock and strip labels over the page behind them', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => window.__scene?.setProgress(200));
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 5000 });
    await page.waitForTimeout(900);
    await check(page, 'dock', 'dock');
  });
});

test.describe('H2: the bend stays registered', () => {
  test.beforeEach(({ browserName, isMobile }) => {
    test.skip(browserName === 'firefox' || isMobile, 'Chromium and WebKit desktop at 2x');
  });

  async function offset(page: Page) {
    await page.evaluate(() => window.__bend?.setStrength(0));
    await page.waitForTimeout(120);
    const b = (await page.locator('[data-slab]').boundingBox())!;
    const clip = { x: b.x + 30, y: b.y + 30, width: b.width - 60, height: b.height - 60 };
    await page.addStyleTag({ content: '[data-slab]{background:none!important;box-shadow:none!important}[data-slab]::before,[data-slab]::after{display:none!important}' });
    const withCopy = await page.screenshot({ clip });
    await page.evaluate(() => window.__bend?.destroy());
    const originals = await page.screenshot({ clip });
    return page.evaluate(async ([a, c]) => {
      const load = (s: string) => new Promise<ImageData>((res) => { const i = new Image(); i.onload = () => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + s; });
      const [A, B] = await Promise.all([load(a), load(c)]);
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
  }

  async function fresh(browser: import('@playwright/test').Browser, width = 1440) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await openHome(page);
    return { ctx, page };
  }
  const within = (o: { bx: number; by: number }) => { expect(Math.abs(o.bx), 'x (device px)').toBeLessThanOrEqual(2); expect(Math.abs(o.by), 'y (device px)').toBeLessThanOrEqual(2); };

  test('after the fonts have loaded', async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    within(await offset(page));
    await ctx.close();
  });

  test('after a width resize', async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(900);
    await page.waitForFunction(() => window.__scene?.state() === 'rest');
    within(await offset(page));
    await ctx.close();
  });

  test('after home, work, home', async ({ browser }) => {
    const { ctx, page } = await fresh(browser);
    await page.locator('a[href="/work/evitech/"]').first().click();
    await page.waitForURL(/\/work\/evitech\/$/);
    await page.goBack();
    await page.waitForURL(/\/$/);
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 6000 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => window.__scene?.state() === 'rest', null, { timeout: 6000 });
    await page.waitForTimeout(1800);
    within(await offset(page));
    await ctx.close();
  });
});

test.describe('scroll down and up, repeated', () => {
  test('the scene state and the dock follow the scroll every time', async ({ page }) => {
    await openHome(page);
    const rest0 = await page.locator('[data-slab]').boundingBox();
    for (let n = 0; n < 4; n++) {
      await page.evaluate(() => scrollTo(0, 260));
      await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 5000 });
      await expect(page.locator('[data-dock]')).toHaveAttribute('data-shown', '');
      expect(await page.locator('[data-dock]').evaluate((d) => (d as HTMLElement).inert), `down ${n}`).toBe(false);
      expect(await page.locator('[data-slab]').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(() => window.__scene?.state() === 'rest', null, { timeout: 5000 });
      await page.waitForTimeout(500);
      await expect.poll(() => page.locator('[data-dock]').evaluate((d) => (d as HTMLElement).inert), { message: `dock inert after scrolling up ${n}`, timeout: 3000 }).toBe(true);
      const s = await page.locator('[data-slab]').evaluate((el) => { const cs = getComputedStyle(el); return { v: cs.visibility, o: cs.opacity, bend: (el as HTMLElement).dataset.bend, r: el.getBoundingClientRect() }; });
      expect(s.v).toBe('visible');
      expect(s.o).toBe('1');
      expect(Math.abs(s.r.width - rest0!.width), `slab width ${n}`).toBeLessThan(2);
      expect(Math.abs(s.r.left - rest0!.x), `slab left ${n}`).toBeLessThan(2);
      expect(Math.abs(s.r.top - rest0!.y), `slab top ${n}`).toBeLessThan(2);
    }
  });
});

test.describe('M5: touch drag on the phone', () => {
  test('a horizontal drag on the slab moves it and does not scroll the page', async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, 'phone projects');
    test.skip(browserName !== 'chromium', 'Playwright has no touch drag outside Chromium (CDP Input.dispatchTouchEvent only); WebKit is covered by the touch-action check in home.spec');
    await openHome(page);
    const b0 = (await page.locator('[data-slab]').boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const x0 = b0.x + b0.width / 2, y0 = b0.y + b0.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 - i * 6, y: y0 }] });
      await page.waitForTimeout(16);
    }
    const mid = (await page.locator('[data-slab]').boundingBox())!;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(mid.x, 'slab follows the finger left').toBeLessThan(b0.x - 20);
    expect(await page.evaluate(() => scrollY), 'the page did not scroll').toBeLessThan(5);
    await page.waitForTimeout(900);
    const rest = (await page.locator('[data-slab]').boundingBox())!;
    expect(Math.abs(rest.y - b0.y)).toBeLessThan(2);
  });
});

// Round-1 motion and creative director fixes, as frame-level checks.
test.describe('round 1 motion', () => {
  test('CD 3: the name never dims under the gliding slab (no knock-out before the slab is opaque)', async ({ page }) => {
    await page.addInitScript(() => { (window as unknown as { __v3test: boolean }).__v3test = true; });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window.__heroLog?.length ?? 0) > 5 && getComputedStyle(document.querySelector('[data-slab]')!).opacity === '1', null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const log = await page.evaluate(() => window.__heroLog ?? []);
    expect(log.length).toBeGreaterThan(5);
    expect(log.filter((f) => f.o < 1 && f.knock), 'frames with the originals cut out while the slab is translucent').toEqual([]);
  });

  test('M1: scrolling past the slide mid-glide stops the glide; nothing writes the slab during the flight', async ({ page }) => {
    await page.addInitScript(() => { (window as unknown as { __v3test: boolean }).__v3test = true; });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window.__heroLog?.length ?? 0) > 3, null, { timeout: 15000 });
    await page.evaluate(() => window.__scene!.setProgress(300));
    const n0 = await page.evaluate(() => window.__heroLog!.length);
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 8000 });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__heroLog!.length), 'glide frames after the flight began').toBeLessThanOrEqual(n0 + 1);
    // The bend never shows during or after the flight to the dock: no holes in the name.
    expect(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.mast [data-line]')].some((l) => !!(l.style.maskImage || (l.style as CSSStyleDeclaration & { webkitMaskImage?: string }).webkitMaskImage)))).toBe(false);
  });

  test('M2/M3: the slab and the dock cross-fade; the bend eases out before take-off and back in after landing', async ({ page }) => {
    await openHome(page);
    const s0 = await page.evaluate(() => window.__bend?.strength ?? null);
    expect(s0).toBeGreaterThan(1);
    await page.evaluate(() => {
      const w = window as unknown as { __mt: { t: number; s: number | null; slab: number; dock: number; vis: string }[]; __set: number[] };
      w.__mt = [];
      // Every strength the bend is given (frame sampling alone can miss a 120ms ease on a slow headless engine).
      w.__set = [];
      const bend = window.__bend!, set = bend.setStrength.bind(bend);
      bend.setStrength = (v: number) => { w.__set.push(v); set(v); };
      const t0 = performance.now();
      const tick = () => {
        const slab = document.querySelector<HTMLElement>('[data-slab]')!;
        w.__mt.push({ t: performance.now() - t0, s: window.__bend ? window.__bend.strength : null, slab: +getComputedStyle(slab).opacity, dock: +getComputedStyle(document.querySelector('[data-dock]')!).opacity, vis: getComputedStyle(slab).visibility });
        if (performance.now() - t0 < 2600) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      window.__scene!.setProgress(300);
    });
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 8000 });
    await page.waitForTimeout(900);
    const out = await page.evaluate(() => (window as unknown as { __mt: { t: number; s: number | null; slab: number; dock: number; vis: string }[] }).__mt);
    // The bend falls through intermediate strengths (never full to nothing in one frame).
    const set = await page.evaluate(() => (window as unknown as { __set: number[] }).__set);
    expect(set.some((v) => v > 0.01 && v < s0! - 0.01), `bend eased out (${set.map((v) => v.toFixed(1)).join(' ')})`).toBe(true);
    // A dock fading in while the slab is still visible (overlap), and never a frame with neither.
    expect(out.some((f) => f.dock > 0.1 && f.dock < 0.9 && f.vis === 'visible' && f.slab > 0.1), 'cross-fade overlap').toBe(true);
    for (const f of out) if (f.t > 100) expect(f.dock > 0.05 || (f.vis === 'visible' && f.slab > 0.05), `gap at ${f.t.toFixed(0)}ms`).toBe(true);
    // Back to the top: the bend comes back from low strength.
    await page.evaluate(() => {
      const w = window as unknown as { __back: number[] };
      w.__back = [];
      const t0 = performance.now();
      const tick = () => { if (window.__bend) w.__back.push(window.__bend.strength); if (performance.now() - t0 < 2500) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      window.__scene!.setProgress(0);
    });
    await page.waitForFunction(() => window.__scene?.state() === 'rest', null, { timeout: 8000 });
    await page.waitForTimeout(1500);
    const back = await page.evaluate(() => (window as unknown as { __back: number[] }).__back);
    expect(back.length).toBeGreaterThan(2);
    expect(back[0], 'the bend returns from nothing').toBeLessThan(1);
    expect(back.some((s) => s > 1 && s < s0! - 1), 'and ramps up').toBe(true);
    expect(back[back.length - 1]).toBeCloseTo(s0!, 1);
  });

  test('M5: a pause before release does not fling', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse');
    await openHome(page);
    const slab = page.locator('[data-slab]');
    const b0 = (await slab.boundingBox())!;
    await page.mouse.move(b0.x + 60, b0.y + 60);
    await page.mouse.down();
    await page.mouse.move(b0.x + 160, b0.y + 60, { steps: 4 });
    const held = (await slab.boundingBox())!.x;
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(1500);
    const rest = (await slab.boundingBox())!.x;
    // Only the clear-edge snap may move it (at most about 48u), never a fling.
    expect(Math.abs(rest - held), `moved ${rest - held}px after a held release`).toBeLessThan(60);
  });

  test('M11: under reduced motion the slab and the dock cross-fade over 160ms', async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    const d = await page.evaluate(() => [document.querySelector('[data-slab]')!, document.querySelector('[data-dock]')!].map((e) => getComputedStyle(e).transitionDuration));
    for (const v of d) expect(v.split(',').map((x) => x.trim())).toContain('0.16s');
    await ctx.close();
  });
});

// Round-2 motion and creative director fixes.
test.describe('round 2 motion', () => {
  test('motion r2 item 1: mid-slide the cut-out stays in register, in every frame and between script updates', async ({ page, isMobile }) => {
    test.skip(isMobile, 'on touch the bend is off while the name slides');
    await openHome(page);
    await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'on');
    const r = await page.evaluate(() => new Promise<{ frames: { y: number; copy: number; glass: number; hole: number }[]; frozen: number[] }>((done) => {
      const slab = document.querySelector<HTMLElement>('[data-slab]')!;
      const line = document.querySelector<HTMLElement>('.mast [data-line="1"]')!;
      const svg = () => document.querySelector<SVGSVGElement>('svg.bend')!;
      const text = () => svg().querySelector('text')!;
      const holeTop = () => { const st = line.style as CSSStyleDeclaration & { webkitMaskPosition?: string }; const p = (st.maskPosition || st.webkitMaskPosition || '').match(/-?[\d.]+/g)!.map(Number); return line.getBoundingClientRect().top + p[1] + line.getBoundingClientRect().height; };
      // Copy vs original: the copy's first row against line 1 (a constant offset between the two boxes when in register).
      const copyOff = () => text().getBoundingClientRect().top - line.getBoundingClientRect().top;
      const frames: { y: number; copy: number; glass: number; hole: number }[] = [];
      // End of frame: ResizeObserver callbacks run after every animation-frame callback, before paint.
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:0;top:0;height:1px;width:1px;pointer-events:none;opacity:0';
      document.body.append(probe);
      const ro = new ResizeObserver(() => frames.push({ y: scrollY, copy: copyOff(), glass: slab.getBoundingClientRect().top - svg().getBoundingClientRect().top, hole: holeTop() - slab.getBoundingClientRect().top }));
      ro.observe(probe);
      let y = 0, w = 1;
      const step = () => {
        y += 4; scrollTo(0, y); probe.style.width = `${(w = 3 - w)}px`;
        if (y < 60) { requestAnimationFrame(step); return; }
        // Then freeze the script's updates (as when the compositor scrolls ahead of the main thread) and move 16px.
        setTimeout(() => {
          ro.disconnect(); probe.remove();
          const before = copyOff();
          window.__bend!.shift = () => {};
          scrollTo(0, 76);
          requestAnimationFrame(() => requestAnimationFrame(() => done({ frames, frozen: [before, copyOff()] })));
        }, 50);
      };
      // The scroller's frame loop starts first and the input follows, as with the smooth scroller and a wheel.
      requestAnimationFrame(step);
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
    }));
    expect(r.frames.length).toBeGreaterThan(8);
    const c0 = r.frames[0].copy;
    for (const f of r.frames) {
      expect(Math.abs(f.copy - c0), `copy vs originals at y ${f.y}`).toBeLessThanOrEqual(1);
      expect(Math.abs(f.glass), `glass vs copy at y ${f.y}`).toBeLessThanOrEqual(1);
      expect(Math.abs(f.hole), `knock-out vs glass at y ${f.y}`).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(r.frozen[1] - r.frozen[0]), 'copy stays on the originals with no script update').toBeLessThanOrEqual(1);
  });

  test('motion r2 item 2: on the way back the slab stays at opacity 0 until the dock has faded', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => window.__scene!.setProgress(300));
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 8000 });
    await page.waitForTimeout(600);
    const out = await page.evaluate(() => new Promise<{ slab: number; dock: number; vis: string }[]>((done) => {
      const slab = document.querySelector<HTMLElement>('[data-slab]')!, dock = document.querySelector<HTMLElement>('[data-dock]')!;
      const f: { slab: number; dock: number; vis: string }[] = [];
      const t0 = performance.now();
      const tick = () => {
        const cs = getComputedStyle(slab);
        f.push({ slab: +cs.opacity, dock: +getComputedStyle(dock).opacity, vis: cs.visibility });
        if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else done(f);
      };
      window.__scene!.setProgress(0);
      requestAnimationFrame(tick);
    }));
    const both = out.filter((f) => f.vis === 'visible' && f.slab > 0.02 && f.dock > 0.08);
    expect(both, 'frames with the slab showing while the dock still shows').toEqual([]);
    expect(out[out.length - 1].slab).toBe(1);
    expect(out[out.length - 1].dock).toBe(0);
  });

  test('CD r2 fix 6a: on touch, with the bend off while the name slides, the letters under the slab keep full ink', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch: the bend is off while the slab moves');
    await openHome(page);
    await page.waitForFunction(() => document.querySelector<HTMLElement>('[data-slab]')!.dataset.bend === 'on', null, { timeout: 10000 });
    const ink = async () => {
      const g = await page.evaluate(() => {
        const s = document.querySelector('[data-slab]')!.getBoundingClientRect();
        const rg = document.createRange(); rg.selectNodeContents(document.querySelector('.mast [data-line="1"]')!);
        const rows = [...rg.getClientRects()], row = rows[rows.length - 1];
        return { x: s.left + 8, w: s.width - 16, y: Math.max(row.top, s.top + 8), h: Math.min(row.bottom, s.bottom - 8) - Math.max(row.top, s.top + 8), bend: document.querySelector<HTMLElement>('[data-slab]')!.dataset.bend };
      });
      const buf = await page.screenshot({ clip: { x: g.x, y: g.y, width: g.w, height: g.h } });
      const p90 = await page.evaluate(async (png) => {
        const img: ImageData = await new Promise((res) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + png; });
        const a: number[] = [];
        for (let i = 0; i < img.data.length; i += 4) a.push(Math.max(img.data[i], img.data[i + 1], img.data[i + 2]));
        a.sort((m, n) => m - n);
        return a[Math.floor(a.length * 0.9)];
      }, buf.toString('base64'));
      return { p90, bend: g.bend };
    };
    const rest = await ink();
    expect(rest.bend).toBe('on');
    await page.evaluate(() => scrollTo(0, 45));
    await page.waitForTimeout(40);
    const moving = await ink();
    expect(moving.bend, 'bend off while moving').toBe('off');
    expect(moving.p90, `ink under the slab while moving (${moving.p90}) vs at rest (${rest.p90})`).toBeGreaterThanOrEqual(rest.p90 - 6);
  });

  // Creative director r2 fix 2: the third moment. One key light, translate only, moves to the rung being read.
  test('the key light settles behind each rung’s figure in turn', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const light = page.locator('[data-path-light]');
    expect(await light.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe('translate');
    const n = await page.locator('.path .rung').count();
    expect(n).toBe(4);
    for (let i = 0; i < n; i++) {
      await page.evaluate((k) => {
        const r = document.querySelectorAll('.path .rung')[k].getBoundingClientRect();
        window.scrollTo({ top: scrollY + r.top - innerHeight * 0.4 + 2, behavior: 'instant' });
      }, i);
      await expect(light).toHaveAttribute('data-rung', String(i));
      await page.waitForTimeout(1300);
      const d = await page.evaluate((k) => {
        const f = document.querySelectorAll('.path .rung-fig')[k].getBoundingClientRect();
        const l = document.querySelector('[data-path-light]')!.getBoundingClientRect();
        return { dx: l.left + l.width / 2 - (f.left - 40), dy: l.top + l.height / 2 - (f.top - 60) };
      }, i);
      expect(Math.abs(d.dx), `rung ${i} x`).toBeLessThanOrEqual(2);
      expect(Math.abs(d.dy), `rung ${i} y`).toBeLessThanOrEqual(2);
    }
  });

  test('reduced motion: the key light jumps (no transition); without JavaScript it rests on the first rung', async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    expect(await page.locator('[data-path-light]').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
    await ctx.close();
    const nojs = await browser.newContext({ ...info.project.use, javaScriptEnabled: false });
    const p2 = await nojs.newPage();
    await p2.goto('/');
    const d = await p2.evaluate(() => {
      const f = document.querySelector('.path .rung-fig')!.getBoundingClientRect();
      const l = document.querySelector('[data-path-light]')!.getBoundingClientRect();
      return { dx: l.left + l.width / 2 - (f.left - 40), dy: l.top + l.height / 2 - (f.top - 60), t: getComputedStyle(document.querySelector('[data-path-light]')!).translate };
    });
    expect(d.t).toBe('none');
    expect(Math.abs(d.dx), 'x').toBeLessThanOrEqual(24);
    expect(Math.abs(d.dy), 'y').toBeLessThanOrEqual(24);
    await nojs.close();
  });
});
