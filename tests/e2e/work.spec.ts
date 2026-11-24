// Tasks 6 and 7: the work index (charts, filters, ledger) and the case sheet with /work/<slug>/ deep links.
import { test, expect, type Page } from '@playwright/test';
import { CASES, watchErrors } from './helpers';

const TAGS: Record<string, string[]> = {
  'performance-marketing': ['evitech'],
  'analytics-and-reporting': ['evitech'],
  'crm-and-automation': ['evitech'],
  'brand-events-and-teams': ['i-heart-uni', 'the-lil-project'],
};

async function prep(page: Page) {
  // The dev toolbar (dev server only) sits over the dock; never part of the site.
  await page.addInitScript(() => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'astro-dev-toolbar { display: none !important; }';
      document.head.appendChild(s);
    });
  });
}
const ready = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.work === 'ready', null, { timeout: 10000 });
async function open(page: Page, path: string) {
  await prep(page);
  const res = await page.goto(path);
  await ready(page);
  return res;
}
const isChromium = (name: string) => name === 'chromium';

test.describe('work index', () => {
  test('chip counts match the cases each capability maps to', async ({ page }) => {
    await open(page, '/work/');
    await expect(page.locator('#wt-all')).toHaveAttribute('data-count', '3');
    for (const [tag, slugs] of Object.entries(TAGS)) {
      await expect(page.locator(`label[for="wt-${tag}"] .chip-n`)).toHaveText(String(slugs.length));
      expect(await page.locator(`.cover[data-tags~="${tag}"]`).count()).toBe(slugs.length);
    }
  });

  test('filtering hides the other cases and announces the count', async ({ page }) => {
    const errs = watchErrors(page);
    await open(page, '/work/');
    await page.locator('label[for="wt-brand-events-and-teams"]').click();
    await expect(page.locator('#case-evitech')).toBeHidden();
    await expect(page.locator('#case-i-heart-uni')).toBeVisible();
    await expect(page.locator('#case-the-lil-project')).toBeVisible();
    await expect(page.locator('[data-work-count]')).toHaveText('2 of 3 cases');
    await expect(page.locator('[data-work-count]')).toHaveAttribute('aria-live', 'polite');
    await page.locator('label[for="wt-performance-marketing"]').click();
    await expect(page.locator('.cover:visible')).toHaveCount(1);
    await expect(page.locator('[data-work-count]')).toHaveText('1 of 3 cases');
    // Arrow keys move through the radio group.
    await page.locator('#wt-performance-marketing').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#wt-all')).toBeChecked();
    await expect(page.locator('.cover:visible')).toHaveCount(3);
    errs.assertClean();
  });

  test('ledger: six rows, each opens by click and by keyboard', async ({ page }) => {
    await open(page, '/work/');
    const rows = page.locator('[data-ledger] > li');
    await expect(rows).toHaveCount(6);
    const first = rows.nth(0).locator('details');
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('.row-did')).toBeVisible();
    const second = rows.nth(1).locator('details');
    await second.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(second).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(second).not.toHaveAttribute('open', '');
    // The figures stay visible while a row is closed.
    await expect(rows.nth(2).locator('.row-v')).toBeVisible();
  });

  test('each figure has its footnote marker', async ({ page }) => {
    await open(page, '/work/');
    for (const c of CASES) await expect(page.locator(`#case-${c.slug} [data-fig] .fn`)).toHaveCount(1);
    const rows = page.locator('[data-ledger] > li');
    // site.ts has no note for the interstate expansion row (4 months); every other row carries one.
    for (let i = 0; i < 6; i++) {
      const t = await rows.nth(i).locator('.row-t').textContent();
      await expect(rows.nth(i).locator('.fn')).toHaveCount(t === 'Interstate expansion' ? 0 : 1);
    }
    // Each marker opens its note.
    await page.locator('#case-evitech [data-fig] .fn').click();
    await expect(page.locator('#case-evitech [popover]:popover-open')).toContainText('Two results from the same initiative.');
  });

  test('charts are drawn to scale from site.ts', async ({ page }) => {
    await open(page, '/work/');
    const ratios = await page.locator('[data-chart="evitech"] .ev-g').evaluateAll((gs) =>
      gs.map((g) => {
        const [b, a] = [...g.querySelectorAll('.ev-bar')].map((e) => e.getBoundingClientRect().height);
        return Math.round((a / b) * 100) / 100;
      }),
    );
    expect(ratios).toEqual([0.72, 1.65]);
    const dots = await page.locator('[data-chart="the-lil-project"] .lil').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const px = (v: string, box: number) => (v.endsWith('%') ? (parseFloat(v) / 100) * box : parseFloat(v));
      const [w, h] = getComputedStyle(el).backgroundSize.split(' ');
      return Math.round(r.width / px(w, r.width)) * Math.round(r.height / px(h, r.height));
    });
    expect(dots).toBe(768);
    await expect(page.locator('[data-chart="i-heart-uni"]')).toContainText('400');
    await expect(page.locator('[data-chart="i-heart-uni"]')).toContainText('13,200');
    await expect(page.locator('[data-chart] svg text')).toHaveCount(0);
  });
});

test.describe('case sheet', () => {
  test('cold deep link: 200, the sheet open in main over the inert index, per-case canonical', async ({ page }) => {
    for (const c of CASES) {
      const res = await open(page, `/work/${c.slug}/`);
      expect(res?.status()).toBe(200);
      await expect(page.locator(`main [data-sheet="${c.slug}"]`)).toBeVisible();
      await expect(page.locator('main [data-sheet-under]')).toHaveAttribute('inert', '');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${c.org}: ${c.title}`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/work/${c.slug}/$`));
      // Only the sheet's headline carries the shared name; the inert copy never does.
      expect(await page.locator('[data-sheet-under] [data-astro-transition-scope]').count()).toBe(0);
    }
  });

  test('cold deep link, then Close: /work/ with focus on the opened case', async ({ page }) => {
    await open(page, '/work/evitech/');
    await page.locator('[data-sheet-close]').click();
    await expect(page).toHaveURL(/\/work\/#case-evitech$/);
    await ready(page);
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('#case-evitech'))).toBe(true);
    await page.goBack();
    await expect(page).toHaveURL(/\/work\/evitech\/$/);
  });

  test('Escape closes a sheet opened from /work/ (history back) and focus returns', async ({ page }) => {
    const errs = watchErrors(page);
    await open(page, '/work/');
    await page.locator('#case-i-heart-uni [data-case-link]').click();
    await expect(page).toHaveURL(/\/work\/i-heart-uni\/$/);
    await ready(page);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('sheet-h');
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/work\/$/);
    await ready(page);
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('#case-i-heart-uni'))).toBe(true);
    errs.assertClean();
  });

  test('next and previous cases, with the counter', async ({ page }) => {
    await open(page, '/work/evitech/');
    await expect(page.locator('[data-sheet-count]')).toHaveText('1 / 3');
    await page.locator('.sheet-bar a[rel="next"]').click();
    await expect(page).toHaveURL(/\/work\/i-heart-uni\/$/);
    await ready(page);
    await expect(page.locator('[data-sheet-count]')).toHaveText('2 / 3');
    await page.locator('.sheet-bar a[rel="prev"]').click();
    await expect(page).toHaveURL(/\/work\/evitech\/$/);
    await ready(page);
    await page.locator('.sheet-bar a[rel="prev"]').click();
    await expect(page).toHaveURL(/\/work\/the-lil-project\/$/);
    await ready(page);
    await expect(page.locator('[data-sheet-count]')).toHaveText('3 / 3');
    // Sheet to sheet, Close goes to the index (no /work/ entry behind it).
    await page.locator('[data-sheet-close]').click();
    await expect(page).toHaveURL(/\/work\/#case-the-lil-project$/);
  });

  test('opening from a scrolled /work/ keeps the index in place; Back restores the scroll', async ({ page }) => {
    await open(page, '/work/');
    const link = page.locator('#case-the-lil-project [data-case-link]');
    await page.evaluate(() => {
      const el = document.querySelector('#case-the-lil-project')!;
      scrollTo(0, el.getBoundingClientRect().top + scrollY - 200);
    });
    await page.waitForTimeout(400);
    const y = await page.evaluate(() => scrollY);
    expect(y).toBeGreaterThan(300);
    const before = await link.evaluate((e) => e.getBoundingClientRect().top);
    await link.click();
    await expect(page).toHaveURL(/\/work\/the-lil-project\/$/);
    await ready(page);
    const after = await page.locator('[data-sheet-under] [data-cover="the-lil-project"] .cover-t a').evaluate((e) => e.getBoundingClientRect().top);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
    await page.goBack();
    await expect(page).toHaveURL(/\/work\/$/);
    await ready(page);
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 4000 }).toBeGreaterThanOrEqual(y - 2);
    expect(await page.evaluate(() => Math.round(scrollY))).toBeLessThanOrEqual(y + 2);
  });

  test('the figure lifts into the sheet through a view transition', async ({ page }, info) => {
    test.skip(!isChromium(info.project.name), 'view-transition animations are inspected in Chromium');
    const errs = watchErrors(page);
    await open(page, '/work/');
    await page.evaluate(() => {
      const w = window as unknown as { __vt: { pseudo: string; duration: number }[] };
      w.__vt = [];
      const seen = new Set<string>();
      const tick = () => {
        for (const a of document.getAnimations()) {
          const fx = a.effect as KeyframeEffect | null;
          const pseudo = fx?.pseudoElement ?? '';
          if (pseudo.startsWith('::view-transition') && !seen.has(pseudo)) {
            seen.add(pseudo);
            w.__vt.push({ pseudo, duration: Number(fx?.getTiming().duration) || 0 });
          }
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
    await page.locator('#case-evitech [data-case-link]').click();
    await expect(page).toHaveURL(/\/work\/evitech\/$/);
    await ready(page);
    const vt = await page.evaluate(() => (window as unknown as { __vt: { pseudo: string; duration: number }[] }).__vt);
    const group = vt.find((v) => v.pseudo === '::view-transition-group(fig-evitech)');
    expect(group, JSON.stringify(vt)).toBeTruthy();
    expect(group!.duration).toBe(520);
    expect(vt.some((v) => v.pseudo === '::view-transition-new(sheet)')).toBe(true);
    errs.assertClean(); // no InvalidStateError (duplicate names) or other console errors
  });

  test('reduced motion swaps the lift for a cross-fade', async ({ page }, info) => {
    test.skip(!isChromium(info.project.name), 'view-transition animations are inspected in Chromium');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/work/');
    await page.evaluate(() => {
      const w = window as unknown as { __vt: { pseudo: string; duration: number; name: string }[] };
      w.__vt = [];
      const tick = () => {
        for (const a of document.getAnimations()) {
          const fx = a.effect as KeyframeEffect | null;
          const pseudo = fx?.pseudoElement ?? '';
          if (pseudo.startsWith('::view-transition') && !w.__vt.some((v) => v.pseudo === pseudo)) {
            w.__vt.push({ pseudo, duration: Number(fx?.getTiming().duration) || 0, name: (a as CSSAnimation).animationName ?? '' });
          }
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
    await page.locator('#case-evitech [data-case-link]').click();
    await expect(page).toHaveURL(/\/work\/evitech\/$/);
    await ready(page);
    const vt = await page.evaluate(() => (window as unknown as { __vt: { pseudo: string; duration: number; name: string }[] }).__vt);
    expect(vt.filter((v) => v.pseudo.startsWith('::view-transition-group')), JSON.stringify(vt)).toEqual([]);
    const fades = vt.filter((v) => /::view-transition-(old|new)/.test(v.pseudo));
    expect(fades.length, JSON.stringify(vt)).toBeGreaterThan(0);
    for (const f of fades) {
      expect(f.duration).toBeLessThanOrEqual(160);
      expect(f.name).toMatch(/^vt-fade-(in|out)$/);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('filters, ledger and the sheet all work', async ({ page }) => {
    await page.goto('/work/');
    await page.locator('label[for="wt-brand-events-and-teams"]').click();
    await expect(page.locator('#case-evitech')).toBeHidden();
    await expect(page.locator('.cover:visible')).toHaveCount(2);
    const row = page.locator('[data-ledger] > li').first().locator('details');
    await row.locator('summary').click();
    await expect(row).toHaveAttribute('open', '');
    await page.goto('/work/evitech/');
    await expect(page.locator('main [data-sheet="evitech"]')).toBeVisible();
    await expect(page.locator('[data-sheet-close]')).toHaveAttribute('href', '/work/#case-evitech');
    await expect(page.locator('[data-sheet] .sheet-out')).toBeVisible();
  });
});

test('copy hygiene on the work pages', async ({ page }) => {
  for (const p of ['/work/', ...CASES.map((c) => `/work/${c.slug}/`)]) {
    await page.goto(p);
    const text = await page.evaluate(() => document.body.innerText + ' ' + document.title + ' ' + (document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''));
    expect(text, p).not.toContain('—');
    expect(text, p).not.toMatch(/\b(passionate|leverage|unlock|elevate|seamless|synergy|results-driven|cutting-edge|world-class|journey|drive|empower|innovative|data-driven|strategic)\b|Hi, I’m|Hi, I'm|flew to Sydney/i);
  }
});
