// Task 11: axe WCAG 2.2 AA on every page (at rest, with the command menu open, with the case sheet open),
// the keyboard path, visible focus and the complete reduced-motion version.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { allPages, prepPage, tabKey, CASES } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PAGES = allPages();

async function settle(page: Page, path: string) {
  await prepPage(page);
  await page.goto(path);
  await page.waitForSelector('html[data-chrome="ready"]', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(path === '/' ? 2200 : 600);
}
async function axe(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('axe, at rest', () => {
  for (const path of PAGES) {
    test(`no violations on ${path}`, async ({ page }) => {
      await settle(page, path);
      expect(await axe(page)).toEqual([]);
    });
  }
});

test.describe('axe, command menu open', () => {
  for (const path of PAGES) {
    test(`no violations with the menu open on ${path}`, async ({ page }) => {
      await settle(page, path);
      await page.keyboard.press('ControlOrMeta+K');
      await expect(page.locator('#cmdk')).toBeVisible();
      await page.waitForTimeout(400);
      expect(await axe(page)).toEqual([]);
    });
  }
});

test.describe('axe, case sheet open', () => {
  for (const c of CASES) {
    test(`no violations with the ${c.org} sheet opened from /work/`, async ({ page }) => {
      await settle(page, '/work/');
      await page.waitForFunction(() => document.documentElement.dataset.work === 'ready', null, { timeout: 10000 });
      await page.locator(`#case-${c.slug} .cover-t a`).first().click();
      await expect(page).toHaveURL(new RegExp(`/work/${c.slug}/$`));
      await expect(page.locator(`main [data-sheet="${c.slug}"]`)).toBeVisible();
      await page.waitForTimeout(900);
      expect(await axe(page)).toEqual([]);
    });
  }
});

test.describe('keyboard path and visible focus', () => {
  for (const path of PAGES) {
    test(`every stop on ${path} is visible, reachable and ringed`, async ({ page, browserName }) => {
      await settle(page, path);
      const stops: string[] = [];
      const problems: string[] = [];
      for (let i = 0; i < 90; i++) {
        await page.keyboard.press(tabKey(browserName));
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body || el === document.documentElement) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          // A visually hidden radio or checkbox is fine when its label is on screen and takes the ring.
          const lbl = el instanceof HTMLInputElement ? el.labels?.[0] : undefined;
          const labelShown = !!lbl && lbl.getBoundingClientRect().width > 0;
          let hidden = !labelShown && (cs.visibility === 'hidden' || r.width === 0 || r.height === 0);
          for (let n: HTMLElement | null = el; n; n = n.parentElement) {
            if (!labelShown && (getComputedStyle(n).opacity === '0' || n.hasAttribute('inert'))) hidden = true;
          }
          const ring = (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') || (cs.boxShadow && cs.boxShadow !== 'none');
          // Radios and chips draw the ring on the label or a sibling; accept a focus-visible sibling ring.
          let sibling = false;
          if (!ring && el instanceof HTMLInputElement) {
            const lab = el.labels?.[0] ?? el.nextElementSibling;
            if (lab) { const l = getComputedStyle(lab); sibling = parseFloat(l.outlineWidth) > 0 || l.boxShadow !== 'none'; }
          }
          const id = el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`;
          return { id, hidden, ring: !!ring || sibling, text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) };
        });
        if (!info) { if (stops.length > 3) break; continue; }
        stops.push(info.id);
        if (info.hidden) problems.push(`invisible focus stop ${info.id} "${info.text}"`);
        if (!info.ring) problems.push(`no focus ring on ${info.id} "${info.text}"`);
      }
      expect(stops.length, 'at least the skip link and the dock').toBeGreaterThan(2);
      expect(problems).toEqual([]);
    });
  }

  test('the skip link is first and moves focus to main', async ({ page, browserName }) => {
    await settle(page, '/about/');
    await page.keyboard.press(tabKey(browserName));
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('Escape closes the command menu and focus returns to the control that opened it', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit' && !!page.viewportSize() && page.viewportSize()!.width < 640, 'dock Menu is the opener on phones, covered in nav.spec');
    await settle(page, '/about/');
    const btn = page.locator('.dock-menu');
    await btn.focus();
    await page.keyboard.press('ControlOrMeta+K');
    await expect(page.locator('#cmdk')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#cmdk')).toBeHidden();
    await expect(btn).toBeFocused();
  });
});

test.describe('reduced motion is the complete version', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const path of PAGES) {
    test(`nothing runs after 300ms and the content is all there on ${path}`, async ({ page }) => {
      await prepPage(page);
      await page.goto(path, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      const runningNow = () =>
        page.evaluate(() =>
          document.getAnimations().filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect | null)?.target?.closest?.('astro-dev-toolbar')).map((a) => (a as CSSAnimation).animationName ?? a.constructor.name),
        );
      // Plan Task 11: no running animations 300ms after load (run against the preview build, not dev).
      expect(await runningNow(), 'running animations').toEqual([]);
      const hidden = await page.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll<HTMLElement>('main h1, main h2, main img, main [data-slab], .hero *, .mast, .mast *').forEach((el) => {
          if (el.closest('[hidden], [popover], dialog, [inert], astro-dev-toolbar')) return;
          const cs = getComputedStyle(el);
          if (cs.opacity === '0' || cs.visibility === 'hidden') out.push(el.tagName + '.' + el.className);
        });
        return out;
      });
      expect(hidden, 'content hidden under reduced motion').toEqual([]);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
});
