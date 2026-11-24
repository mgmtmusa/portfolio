import { test, expect } from '@playwright/test';
import { openHome } from './helpers';

test.describe('layout guardrails', () => {
  test('G1: the masthead is two lines inside the margins (desktop)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await openHome(page);
    const r = await page.evaluate(() => {
      const hero = document.querySelector('.hero')!.getBoundingClientRect(); const u = hero.width / 1440;
      const rects: DOMRect[] = []; const tops = new Set<number>();
      for (const span of document.querySelectorAll('.mast [data-line]')) {
        const t = span.firstChild!; const rr = document.createRange(); rr.selectNodeContents(t);
        for (const x of rr.getClientRects()) { rects.push(x); tops.add(Math.round(x.top)); }
      }
      return { lines: tops.size, left: Math.min(...rects.map((x) => x.left)) - hero.left, right: hero.right - Math.max(...rects.map((x) => x.right)), u };
    });
    expect(r.lines).toBe(2);
    expect(r.left).toBeGreaterThanOrEqual(58 * r.u - 8);
    expect(r.right).toBeGreaterThanOrEqual(58 * r.u - 8);
  });

  test('drag, dock, back: the slab returns to where it was dragged', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse drag on desktop');
    await openHome(page);
    const slab = page.locator('[data-slab]');
    const b0 = (await slab.boundingBox())!;
    await page.mouse.move(b0.x + 60, b0.y + 60);
    await page.mouse.down();
    await page.mouse.move(b0.x + 260, b0.y + 60, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(1500);
    const dragged = (await slab.boundingBox())!;
    expect(dragged.x - b0.x, 'the drag moved the slab').toBeGreaterThan(100);
    await page.evaluate(() => window.__scene?.setProgress(200));
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 5000 });
    await page.evaluate(() => { window.__scene?.setProgress(0); scrollTo(0, 0); });
    await page.waitForFunction(() => window.__scene?.state() === 'rest', null, { timeout: 6000 });
    await page.waitForTimeout(1500);
    const back = (await slab.boundingBox())!;
    expect(Math.abs(back.x - dragged.x), 'slab x after docking and coming back').toBeLessThan(2);
    expect(Math.abs(back.y - dragged.y)).toBeLessThan(2);
  });

  test('G6: no line of the pitch or the availability block ends on a single word', async ({ page }) => {
    await openHome(page);
    for (const sel of ['.hero .line', '[data-hero-avail] p']) {
      const lastWords = await page.locator(sel).evaluateAll((els) => els.map((el) => {
        const r = document.createRange(); r.selectNodeContents(el);
        const rects = [...r.getClientRects()]; const lastTop = Math.max(...rects.map((x) => Math.round(x.top)));
        const words = el.textContent!.trim().split(/\s+/);
        let count = 0;
        for (let i = 0, pos = 0; i < words.length; i++) {
          pos = el.textContent!.indexOf(words[i], pos);
          const n = [...el.childNodes].find((c) => c.nodeType === 3 && c.textContent!.includes(words[i])) as Text | undefined;
          if (!n) continue;
          const k = n.data.indexOf(words[i]); const wr = document.createRange(); wr.setStart(n, k); wr.setEnd(n, k + words[i].length);
          if (Math.round(wr.getBoundingClientRect().top) >= lastTop - 2) count++;
        }
        return count;
      }));
      for (const c of lastWords) expect(c, sel).toBeGreaterThanOrEqual(2);
    }
  });

  test('G3: the strip lines up with the page edge at 1920', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openHome(page);
    const d = await page.evaluate(() => {
      const clock = document.querySelector('.strip p')!.getBoundingClientRect().left;
      const role = document.querySelector('.hero .role')!.getBoundingClientRect().left;
      return Math.abs(clock - role);
    });
    expect(d).toBeLessThanOrEqual(2);
  });

  // Finding 5: the proof column and the availability block clear line 1 of the masthead.
  for (const [w, h] of [[1024, 768], [1100, 900], [1180, 820], [1280, 720], [1440, 789]]) {
    test(`proof and availability clear "Abdullah" at ${w}x${h}`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'desktop');
      await page.setViewportSize({ width: w, height: h });
      await openHome(page);
      await page.evaluate(() => document.fonts.ready);
      const m = await page.evaluate(() => {
        const hero = document.querySelector('.hero')!.getBoundingClientRect(); const u = hero.width / 1440;
        const l1 = document.querySelector('.mast [data-line="1"]') as HTMLElement;
        const probe = document.createElement('span'); probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        l1.appendChild(probe); const baseline = probe.getBoundingClientRect().bottom; probe.remove();
        const cs = getComputedStyle(l1); const c = document.createElement('canvas').getContext('2d')!;
        c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const cap = c.measureText('H').actualBoundingBoxAscent;
        return {
          u, capTop: baseline - cap, baseline,
          proofBottom: document.querySelector('.hero .proof')!.getBoundingClientRect().bottom,
          availTop: document.querySelector('[data-hero-avail]')!.getBoundingClientRect().top,
        };
      });
      expect(m.proofBottom, 'proof bottom <= cap top - 24u').toBeLessThanOrEqual(m.capTop - 24 * m.u + 1);
      expect(m.availTop, 'availability top >= baseline + 24u').toBeGreaterThanOrEqual(m.baseline + 24 * m.u - 1);
    });
  }

  test('G7: below 1180px the figure pairs stack and labels are at least 14ch', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await page.setViewportSize({ width: 1024, height: 768 });
    await openHome(page);
    const r = await page.evaluate(() => {
      const pair = document.querySelector('.proof-pair')!;
      const figs = [...pair.querySelectorAll('.fig')].map((e) => e.getBoundingClientRect());
      const labs = [...pair.querySelectorAll('.lab')];
      const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden;width:14ch;font:' + getComputedStyle(labs[0]).font;
      document.body.appendChild(probe); const ch14 = probe.getBoundingClientRect().width; probe.remove();
      return {
        sameColumn: Math.abs(figs[0].left - figs[1].left) < 1, stacked: figs[1].top >= figs[0].bottom - 1,
        labWidths: labs.map((e) => e.getBoundingClientRect().width), ch14,
      };
    });
    expect(r.sameColumn && r.stacked, 'figures stack').toBe(true);
    for (const w of r.labWidths) expect(w).toBeGreaterThanOrEqual(r.ch14 - 0.5);
  });

  // Ruling 2: the phone role line stays three rows, measured at y 61 to 145 at 390x664.
  for (const [w, h] of [[320, 640], [375, 667], [390, 664], [412, 915]]) {
    test(`phone: the line stays three rows at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await openHome(page);
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const el = document.querySelector('.hero .line')!;
        const rg = document.createRange(); rg.selectNodeContents(el);
        const tops = new Set([...rg.getClientRects()].map((x) => Math.round(x.top)));
        const b = el.getBoundingClientRect();
        return { rows: tops.size, top: b.top + scrollY, bottom: b.bottom + scrollY, photo: document.querySelector('.hero .photo')!.getBoundingClientRect().top + scrollY };
      });
      expect(r.rows).toBe(3);
      // Creative director, ruling 5: at 320 the line (24px) ends above the portrait, which moves down 12px.
      if (w === 320) expect(r.bottom, 'line clears the portrait').toBeLessThanOrEqual(r.photo + 0.5);
      if (w === 390) { expect(Math.abs(r.top - 61)).toBeLessThanOrEqual(2); expect(Math.abs(r.bottom - 145)).toBeLessThanOrEqual(2); }
    });
  }

  // Creative director fix 6: a paired teaser figure ends at least 48px left of its label column.
  for (const [w, h] of [[1024, 768], [1280, 800], [1440, 900]]) {
    test(`home Work row: figures clear the label column by 48px at ${w}`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'desktop');
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const gaps = await page.evaluate(() => [...document.querySelectorAll('.case')].map((c) => {
        const fig = c.querySelector('.case-fig')!, body = c.querySelector('.case-body')!;
        const r = document.createRange(); r.selectNodeContents(fig);
        const right = Math.max(...[...r.getClientRects()].map((x) => x.right));
        return body.getBoundingClientRect().left - right;
      }));
      expect(gaps.length).toBeGreaterThan(0);
      for (const g of gaps) expect(g).toBeGreaterThanOrEqual(48);
    });
  }

  // Creative director fix 1: the phone portrait dissolves into the page; no edge of its box steps against the field.
  for (const [w, h] of [[375, 667], [390, 844], [412, 915]]) {
    test(`phone portrait: every edge within a level of the page at ${w}`, async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phone layout');
      await page.setViewportSize({ width: w, height: h });
      await openHome(page);
      await page.addStyleTag({ content: '.hero .mast,.hero .lead,[data-slab],[data-slab-shadow],.strip,svg.bend{visibility:hidden!important}' });
      await page.waitForTimeout(200);
      const b = (await page.locator('.hero .photo').boundingBox())!;
      const pad = 12;
      const clip = { x: Math.max(0, b.x - pad), y: b.y - pad, width: Math.min(w - Math.max(0, b.x - pad), b.width + pad * 2), height: b.height + pad * 2 };
      const shot = await page.screenshot({ clip });
      const steps = await page.evaluate(async ([png, box, c]) => {
        const img: ImageData = await new Promise((res) => { const i = new Image(); i.onload = () => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + png; });
        const k = img.width / c.width;
        const L = (x: number, y: number) => { const i = (Math.round(y * k) * img.width + Math.round(x * k)) * 4; return (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3; };
        const bx = box.x - c.x, by = box.y - c.y;
        // Mean along each edge, 1px inside vs 6px outside, over the middle 80% of the edge.
        const edge = (inside: (t: number) => [number, number], outside: (t: number) => [number, number]) => {
          let a = 0, o = 0, n = 0;
          for (let t = 0.1; t <= 0.9; t += 0.01) { a += L(...inside(t)); o += L(...outside(t)); n++; }
          return Math.abs(a / n - o / n);
        };
        return {
          top: edge((t) => [bx + t * box.w, by + 1], (t) => [bx + t * box.w, by - 6]),
          bottom: edge((t) => [bx + t * box.w, by + box.h - 1], (t) => [bx + t * box.w, by + box.h + 6]),
          left: edge((t) => [bx + 1, by + t * box.h], (t) => [Math.max(0, bx - 6), by + t * box.h]),
          right: edge((t) => [bx + box.w - 1, by + t * box.h], (t) => [Math.min(c.width - 1, bx + box.w + 6), by + t * box.h]),
        };
      }, [shot.toString('base64'), { x: b.x, y: b.y, w: b.width, h: b.height }, clip] as const);
      for (const [k, v] of Object.entries(steps)) expect(v, `${k} edge step (levels)`).toBeLessThanOrEqual(1);
    });
  }

  // Creative director r2 fix 1 and HoE r2: both light pools fade to nothing before their box edges. Everything but the
  // pools is hidden (the page grain too: it is noise by design); no adjacent pixels on any sampled row or column may step by more than 2 levels.
  for (const [w, h, phone] of [[1440, 900, false], [1024, 768, false], [390, 844, true], [320, 640, true]] as const) {
    test(`light pools have no hard edge at ${w}`, async ({ page, isMobile }) => {
      test.skip(isMobile !== phone, phone ? 'phone widths' : 'desktop widths');
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      for (const pool of ['.path-light', '.teasers']) {
        await page.evaluate(([sel, vh]) => {
          const el = document.querySelector<HTMLElement>(sel as string)!;
          const r = el.getBoundingClientRect();
          // The pool's centre: the moving light's own box centre, or the teasers pool at the section's y 120.
          const cy = sel === '.teasers' ? r.top + 120 : r.top + r.height / 2;
          window.scrollTo({ top: scrollY + cy - (vh as number) / 2, behavior: 'instant' });
        }, [pool, h]);
        await page.waitForTimeout(1200);
        const style = await page.addStyleTag({ content: 'body::before{display:none!important}body *{visibility:hidden!important;transition:none!important}.path-light,.teasers::before{visibility:visible!important}' });
        await page.waitForTimeout(100);
        const shot = await page.screenshot();
        await style.evaluate((n) => (n as Element).remove());
        const r = await page.evaluate(async (png) => {
          const img: ImageData = await new Promise((res) => { const i = new Image(); i.onload = () => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d')!; x.drawImage(i, 0, 0); res(x.getImageData(0, 0, i.width, i.height)); }; i.src = 'data:image/png;base64,' + png; });
          const { width: W, height: H, data: d } = img;
          let max = 0, at = '', lit = 0;
          const step = (i: number, j: number) => Math.max(Math.abs(d[i] - d[j]), Math.abs(d[i + 1] - d[j + 1]), Math.abs(d[i + 2] - d[j + 2]));
          for (let y = 0; y < H; y += 3) for (let x = 1; x < W; x++) { const s = step((y * W + x) * 4, (y * W + x - 1) * 4); if (s > max) { max = s; at = `row ${y} x ${x}`; } }
          for (let x = 0; x < W; x += 3) for (let y = 1; y < H; y++) { const s = step((y * W + x) * 4, ((y - 1) * W + x) * 4); if (s > max) { max = s; at = `col ${x} y ${y}`; } }
          for (let i = 0; i < d.length; i += 4) lit = Math.max(lit, d[i]);
          return { max, at, lit };
        }, shot.toString('base64'));
        expect(r.lit, `${pool} is lit on screen`).toBeGreaterThan(22);
        expect(r.max, `${pool}: largest adjacent step ${r.max} levels at ${r.at} (device px)`).toBeLessThanOrEqual(2);
      }
    });
  }

  // Creative director fix 12: on /contact/ the dock's Get in touch (pointing at the page you are on) is gone.
  test('contact: the dock has no Get in touch', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.locator('[data-dock]')).toBeVisible();
    await expect(page.locator('[data-dock] .dock-cta')).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingBottom)).toBe('112px');
  });

  // Motion review 8: the dock's Get in touch folds in and out; the dock never jumps width.
  test('the dock CTA folds over time instead of popping', async ({ page }) => {
    await page.goto('/work/');
    const dock = page.locator('[data-dock]');
    const wrap = dock.locator('.dock-cta-wrap');
    await expect(dock.locator('.dock-cta')).toBeVisible();
    const full = (await wrap.boundingBox())!.width;
    const widths = await dock.evaluate(async (d) => {
      const w = d.querySelector('.dock-cta-wrap')!;
      d.dataset.ctaHidden = '';
      const out: number[] = [];
      const t0 = performance.now();
      await new Promise<void>((done) => { const tick = () => { out.push(w.getBoundingClientRect().width); if (performance.now() - t0 < 300) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); });
      return out;
    });
    const mid = widths.slice(1).reduce((m, v) => (Math.abs(v - full / 2) < Math.abs(m - full / 2) ? v : m), widths[0]);
    await page.waitForTimeout(500);
    const folded = (await wrap.boundingBox())?.width ?? 0;
    expect(folded).toBeLessThan(full - 60);
    expect(mid, `mid-fold width ${mid} between ${folded} and ${full}`).toBeGreaterThan(folded + 4);
    expect(mid).toBeLessThan(full - 1);
    await expect(dock.locator('.dock-cta')).toBeHidden();
  });
});
