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
  for (const [w, h] of [[375, 667], [390, 664], [412, 915]]) {
    test(`phone: the line stays three rows at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await openHome(page);
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const el = document.querySelector('.hero .line')!;
        const rg = document.createRange(); rg.selectNodeContents(el);
        const tops = new Set([...rg.getClientRects()].map((x) => Math.round(x.top)));
        const b = el.getBoundingClientRect();
        return { rows: tops.size, top: b.top + scrollY, bottom: b.bottom + scrollY };
      });
      expect(r.rows).toBe(3);
      if (w === 390) { expect(Math.abs(r.top - 61)).toBeLessThanOrEqual(2); expect(Math.abs(r.bottom - 145)).toBeLessThanOrEqual(2); }
    });
  }
});
