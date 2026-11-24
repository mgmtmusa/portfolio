// Hero scene lifecycle (HoE checkpoint findings 1 and 6): whatever happens while the slab is docked, the
// return to the top shows the slab at its rest rect with the bend and its knock-out built from that rect.
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { openHome } from './helpers';

type Snap = {
  slab: { x: number; y: number; w: number; h: number };
  rel: { x: number; y: number; w: number; h: number };
  vb: number[] | null;
  transform: string;
  clip: string;
  visibility: string;
  opacity: string;
  holes: { name: string; overlap: [number, number]; hole: [number, number] | null; want: [number, number] }[];
};

const snap = (page: Page): Promise<Snap> =>
  page.evaluate(() => {
    const slab = document.querySelector<HTMLElement>('[data-slab]')!;
    const hero = document.querySelector('[data-hero]')!.getBoundingClientRect();
    const s = slab.getBoundingClientRect();
    const cs = getComputedStyle(slab);
    const nums = (v: string) => (v.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    // Each knock-out target: how far the slab overlaps it now, and where its mask hole is. The mask is one SVG layer
    // the target's size plus the slab's, with the hole at (target width, target height) inside it.
    const holes = [...document.querySelectorAll<HTMLElement>('.mast [data-line], [data-portrait]')].map((el, i) => {
      const st = el.style as CSSStyleDeclaration & { webkitMaskPosition?: string; webkitMaskImage?: string };
      const on = !!(st.maskImage || st.webkitMaskImage); // clearing a mask empties the image only
      const r = el.getBoundingClientRect();
      const p = nums(st.maskPosition || st.webkitMaskPosition || '');
      return {
        name: `target ${i}`,
        overlap: [Math.min(s.right, r.right) - Math.max(s.left, r.left), Math.min(s.bottom, r.bottom) - Math.max(s.top, r.top)] as [number, number],
        hole: on && p.length >= 2 ? ([p[0] + r.width, p[1] + r.height] as [number, number]) : null,
        want: [s.left - r.left, s.top - r.top] as [number, number],
      };
    });
    return {
      slab: { x: s.left, y: s.top, w: s.width, h: s.height },
      rel: { x: s.left - hero.left, y: s.top - hero.top, w: s.width, h: s.height },
      vb: slab.parentElement!.querySelector(':scope > svg.bend')?.getAttribute('viewBox')?.split(/\s+/).map(Number) ?? null,
      transform: cs.transform,
      clip: cs.clipPath,
      visibility: cs.visibility,
      opacity: cs.opacity,
      holes,
    };
  });

const waitState = (page: Page, s: string) => page.waitForFunction((want) => window.__scene?.state() === want, s, { timeout: 8000 });

/** Scroll to the top through the scene hook and wait until the slab has landed with its bend rebuilt. */
async function toTop(page: Page) {
  await page.evaluate(() => window.__scene!.setProgress(0));
  await waitState(page, 'rest');
  await page.waitForFunction(() => !!window.__bend, null, { timeout: 10000 });
  await page.waitForTimeout(400);
}

/** The rest geometry of a fresh load at the same viewport, for comparison. */
async function freshRest(ctx: BrowserContext, viewport: { width: number; height: number }) {
  const page = await ctx.newPage();
  await page.setViewportSize(viewport);
  await openHome(page);
  const s = await snap(page);
  await page.close();
  return s;
}

const near = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol;

function expectAtRest(got: Snap, rest: Snap) {
  expect(got.transform, 'no FLIP transform left').toBe('none');
  expect(got.clip, 'no dock clip left').toBe('none');
  expect(got.visibility).toBe('visible');
  expect(got.opacity).toBe('1');
  for (const k of ['x', 'y', 'w', 'h'] as const) expect(near(got.slab[k], rest.slab[k]), `slab ${k}: ${got.slab[k]} vs rest ${rest.slab[k]}`).toBe(true);
  expect(got.vb, 'bend built').not.toBeNull();
  const [x, y, w, h] = got.vb!;
  const r = got.rel;
  expect(near(x, r.x) && near(y, r.y) && near(w, r.w) && near(h, r.h), `viewBox ${got.vb!.join(' ')} vs slab ${r.x} ${r.y} ${r.w} ${r.h}`).toBe(true);
  // The knock-out hole sits exactly under the slab, and only targets the slab overlaps are masked
  // (a stale hole knocks out letters outside the slab).
  for (const h of got.holes) {
    const [ox, oy] = h.overlap;
    if (ox > 1 && oy > 1) {
      expect(h.hole, `${h.name} masked`).not.toBeNull();
      expect(near(h.hole![0], h.want[0]) && near(h.hole![1], h.want[1]), `${h.name} hole ${h.hole} vs slab ${h.want}`).toBe(true);
    } else if (ox < -1 || oy < -1) {
      expect(h.hole, `${h.name} not under the slab, so not masked`).toBeNull();
    }
  }
}

test.describe('hero states (HoE finding 1)', () => {
  test.describe.configure({ timeout: 90_000 });
  test('1a: arriving docked (restored scroll), then going to the top, builds the bend from the rest rect', async ({ page }) => {
    const vp = page.viewportSize()!;
    const rest = await freshRest(page.context(), vp);
    await page.addInitScript(() => { (window as unknown as { __v3test: boolean }).__v3test = true; });
    await page.goto('/#work-h');
    await waitState(page, 'docked');
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(90);
    expect(await page.evaluate(() => window.__bend ?? null), 'no bend built from the dock rect').toBeNull();
    await toTop(page);
    expectAtRest(await snap(page), rest);
  });

  test('1a: back to a docked home, then to the top, builds the bend from the rest rect', async ({ page }) => {
    const vp = page.viewportSize()!;
    const rest = await freshRest(page.context(), vp);
    await openHome(page);
    await page.evaluate(() => scrollTo(0, 600));
    await waitState(page, 'docked');
    await page.locator('a[href="/work/evitech/"]').first().click();
    await page.waitForURL(/\/work\/evitech\/$/);
    await page.goBack();
    await page.waitForURL(/\/$/);
    await waitState(page, 'docked');
    await page.waitForTimeout(600);
    await toTop(page);
    expectAtRest(await snap(page), rest);
  });

  test('1b: a resize while docked leaves no stale bend or mask hole', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => scrollTo(0, 600));
    await waitState(page, 'docked');
    const next = page.viewportSize()!.width < 640 ? { width: 360, height: 700 } : { width: 1280, height: 800 };
    await page.setViewportSize(next);
    await page.waitForTimeout(300);
    await toTop(page);
    const got = await snap(page);
    expectAtRest(got, await freshRest(page.context(), next));
  });

  test('1c: switching to reduced motion while docked returns an unsquashed slab', async ({ page }) => {
    await openHome(page);
    const rest = await snap(page);
    await page.evaluate(() => scrollTo(0, 600));
    await waitState(page, 'docked');
    await page.evaluate(() => {
      document.documentElement.dataset.motion = 'reduce';
      window.dispatchEvent(new CustomEvent('motionchange', { detail: { reduce: true } }));
    });
    await page.waitForTimeout(100);
    await toTop(page);
    expectAtRest(await snap(page), rest);
  });
});

/** Edge fragments of every masthead glyph whose box overlaps the slab. `dx` moves both edges. */
const fragments = (page: Page) =>
  page.evaluate(() => {
    const slab = document.querySelector<HTMLElement>('[data-slab]')!;
    const s = slab.getBoundingClientRect();
    const u = s.width / (innerWidth < 640 ? 210 : 360);
    const glyphs: { ch: string; l: number; r: number }[] = [];
    for (const line of document.querySelectorAll('.mast [data-line]')) {
      const wk = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      for (let n = wk.nextNode() as Text | null; n; n = wk.nextNode() as Text | null) {
        for (let i = 0; i < n.length; i++) {
          if (n.data[i] === ' ') continue;
          const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1);
          const g = rg.getBoundingClientRect();
          if (g.width && g.top < s.bottom && g.bottom > s.top) glyphs.push({ ch: n.data[i], l: g.left, r: g.right });
        }
      }
    }
    // Negative tracking makes neighbouring glyph boxes overlap: an edge within 0.5px of a box edge cuts nothing (as in hero-math).
    const T = 0.5;
    const worst = (dx: number) => {
      let w = Infinity;
      for (const e of [s.left + dx, s.right + dx]) for (const g of glyphs) if (e > g.l + T && e < g.r - T) w = Math.min(w, e - g.l, g.r - e);
      return w;
    };
    const cuts = [s.left, s.right].flatMap((e) => glyphs.filter((g) => e > g.l + T && e < g.r - T).map((g) => `${g.ch} ${(e - g.l).toFixed(1)}/${(g.r - e).toFixed(1)}`));
    // Where the layout alone puts the slab (no pin, no nudge), and the best worst fragment within ±48u of it.
    const keep = slab.getAttribute('style');
    for (const k of ['position', 'left', 'top', 'width', 'height', 'margin-left']) slab.style.removeProperty(k);
    slab.style.translate = 'none';
    const css = slab.getBoundingClientRect().left;
    slab.setAttribute('style', keep ?? '');
    let best = -Infinity;
    const tries: number[] = [];
    for (let d = -48 * u; d <= 48 * u; d += 0.25) tries.push(css + d);
    for (const g of glyphs) for (const off of [0, s.width]) tries.push(g.l - off, g.r - off);
    for (const x of tries) if (x >= css - 48 * u - 0.01 && x <= css + 48 * u + 0.01) best = Math.max(best, worst(x - s.left));
    return { u, worst: worst(0), best, cuts, rows: glyphs.length };
  });

test.describe('slab edges over every masthead row (HoE finding 6)', () => {
  test.describe.configure({ timeout: 60_000 });
  test('the rest snap reads every row under the slab', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout: the masthead wraps to three rows under the slab');
    await openHome(page);
    const f = await fragments(page);
    expect(f.rows).toBeGreaterThan(0);
  });

  // Creative director ruling (round 1, item 4): no fragment under 18u from 640px up; below 640px the floor is 16 CSS px.
  test('no glyph fragment under the floor at either vertical edge at rest (16px phone, 18u from 640px)', async ({ page }) => {
    await openHome(page);
    const f = await fragments(page);
    const min = page.viewportSize()!.width < 640 ? 16 : 18 * f.u;
    expect(f.worst, `cuts: ${f.cuts.join(', ')}`).toBeGreaterThanOrEqual(min - 0.5);
  });

  // Motion review 9: the edges stay clear while the name slides up through the slab, not only at rest.
  for (const y of [30, 60, 88]) {
    test(`no glyph fragment under 18u at the edges during the slide (scrolled ${y}px)`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'desktop slide');
      await openHome(page);
      await page.evaluate((v) => window.__scene!.setProgress(v), y);
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => window.__scene!.state())).toBe('rest');
      const f = await fragments(page);
      expect(f.worst, `cuts: ${f.cuts.join(', ')}`).toBeGreaterThanOrEqual(18 * f.u - 0.5);
    });
  }
});
