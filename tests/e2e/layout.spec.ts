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
    expect(r.right).toBeGreaterThanOrEqual(0);
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
});
