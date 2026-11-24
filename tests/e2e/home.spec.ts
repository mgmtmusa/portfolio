import { test, expect } from '@playwright/test';
import { AVAILABILITY, REPLY, LINE, CV, openHome, inViewport, watchErrors } from './helpers';

test.describe('home hero (direction C)', () => {
  test('the name is the H1; role, line and actions are on the first screen', async ({ page }) => {
    const errs = watchErrors(page);
    await openHome(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Musa Abdullah\s*Walid/);
    await expect(page.locator('.hero .line')).toHaveText(LINE);
    for (const sel of ['.hero .role', '.hero .line', '[data-hero-cta]', '.hero .acts .textlink']) expect(await inViewport(page, sel), sel).toBe(true);
    await expect(page.locator('.hero .acts .textlink')).toHaveText('Download CV (PDF)');
    await expect(page.locator('.hero .acts .textlink')).toHaveAttribute('href', CV);
    errs.assertClean();
  });

  test('proof: every figure footnoted (28% and 65% share note 1), the pair carries its qualifier and spend', async ({ page }) => {
    await openHome(page);
    const proof = page.locator('.hero .proof');
    await expect(proof).toContainText('28%');
    await expect(proof).toContainText('65%');
    await expect(proof).toContainText('Two results from the same initiative at Evitech, on paid media of roughly $15K to $30K a month.');
    await expect(proof).toContainText('$2M+');
    await expect(proof).toContainText('13,200');
    await expect(proof.locator('.fn')).toHaveCount(4);
    // Finish review 4: 28% carries its own marker, inside its data-fact element with the scope note.
    const cpa = proof.locator('.fig[data-fact="28%"]');
    await expect(cpa.locator('.fn')).toHaveText('1');
    await expect(cpa.locator('.fn-pop')).toContainText('Two results from the same initiative');
  });

  test('a footnote opens its scope note on click and with the keyboard', async ({ page, isMobile }) => {
    await openHome(page);
    const fn = page.locator('.hero .proof .fn[popovertarget="fn-h-2"]');
    await fn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await fn.click();
    await expect(page.locator('#fn-h-2')).toBeVisible();
    await expect(page.locator('#fn-h-2')).toContainText('Contracts I closed myself');
    await page.keyboard.press('Escape');
    await expect(page.locator('#fn-h-2')).toBeHidden();
    if (!isMobile) {
      await fn.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#fn-h-2')).toBeVisible();
    }
  });

  test('a teaser footnote marker is clickable and opens its popover', async ({ page }) => {
    await openHome(page);
    for (const id of ['fn-t-evitech', 'fn-t-ihu', 'fn-t-lil']) {
      const fn = page.locator(`.teasers .fn[popovertarget="${id}"]`);
      await fn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await fn.click();
      await expect(page.locator(`#${id}`)).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
      await page.keyboard.press('Escape');
      await expect(page.locator(`#${id}`)).toBeHidden();
    }
  });

  test('availability and reply time appear verbatim', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('[data-hero-avail]')).toContainText(AVAILABILITY);
    await expect(page.locator('[data-hero-avail]')).toContainText(REPLY);
  });

  test('no sideways scroll', async ({ page }) => {
    await openHome(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('the portrait never renders taller than 620px', async ({ page }) => {
    await openHome(page);
    const h = (await page.locator('[data-portrait]').boundingBox())!.height;
    expect(h).toBeLessThanOrEqual(620.5);
  });
});

test.describe('home hero at other sizes', () => {
  for (const [w, h] of [[1440, 789], [1280, 720], [1024, 768], [1920, 1080], [2560, 1440]]) {
    test(`fits ${w}×${h}: line, CTA and the Walid baseline inside the first screen; portrait ≤ 620px`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'desktop sizes');
      await page.setViewportSize({ width: w, height: h });
      await openHome(page);
      for (const sel of ['.hero .line', '[data-hero-cta]', '.hero .mast-l2']) expect(await inViewport(page, sel), `${sel} at ${w}×${h}`).toBe(true);
      expect((await page.locator('[data-portrait]').boundingBox())!.height).toBeLessThanOrEqual(620.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
  for (const w of [375, 390, 412]) {
    test(`phone ${w}px wide: no sideways scroll, CTA in the first screen`, async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phone sizes');
      await page.setViewportSize({ width: w, height: Math.round((664 * w) / 390) });
      await openHome(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await inViewport(page, '[data-hero-cta]')).toBe(true);
    });
  }
});

test.describe('scene and dock', () => {
  test('rest: the dock is hidden and inert; Tab never reaches it', async ({ page, isMobile, browserName }) => {
    await openHome(page);
    await expect(page.locator('[data-dock]')).not.toHaveAttribute('data-shown', '');
    expect(await page.locator('[data-dock]').evaluate((d) => (d as HTMLElement).inert)).toBe(true);
    if (!isMobile) {
      const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press(key);
        const ok = await page.evaluate(() => { const a = document.activeElement as HTMLElement; return !a.closest('[data-dock]') && getComputedStyle(a).visibility !== 'hidden'; });
        expect(ok, `tab stop ${i}`).toBe(true);
      }
    }
  });

  test('past 90px the slab settles into the dock; below 60px it comes back', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => scrollTo(0, 200));
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 4000 });
    await expect(page.locator('[data-dock]')).toHaveAttribute('data-shown', '');
    expect(await page.locator('[data-dock]').evaluate((d) => (d as HTMLElement).inert)).toBe(false);
    await page.evaluate(() => scrollTo(0, 75));
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__scene?.state())).toBe('docked');
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => window.__scene?.state() === 'rest', null, { timeout: 4000 });
    expect(await page.locator('[data-dock]').evaluate((d) => (d as HTMLElement).inert)).toBe(true);
  });

  test('the dock’s Get in touch hides while the hero CTA is in view', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => scrollTo(0, 200));
    await page.waitForFunction(() => window.__scene?.state() === 'docked');
    await expect(page.locator('[data-dock]')).toHaveAttribute('data-cta-hidden', '');
    await page.evaluate(() => scrollTo(0, 1400));
    await expect(page.locator('[data-dock]')).not.toHaveAttribute('data-cta-hidden', '');
    await expect(page.locator('[data-dock] .dock-cta')).toBeVisible();
  });

  test('the strip’s availability yields while the hero shows it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the strip shows only the clock on phones');
    await openHome(page);
    await expect(page.locator('.strip')).toHaveAttribute('data-avail-hidden', '');
    await page.evaluate(() => scrollTo(0, 1400));
    await expect(page.locator('.strip')).not.toHaveAttribute('data-avail-hidden', '');
  });

  test('coming back to home scrolled past 90px shows the dock, not the slab', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => scrollTo(0, 600));
    await page.waitForFunction(() => window.__scene?.state() === 'docked');
    await page.locator('a[href="/work/evitech/"]').first().click();
    await page.waitForURL(/\/work\/evitech\/$/);
    await page.goBack();
    await page.waitForURL(/\/$/);
    await page.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 6000 });
    await expect(page.locator('[data-dock]')).toHaveAttribute('data-shown', '');
  });
});

test.describe('slab drag', () => {
  test('drags 1:1 and keeps the grab offset; rubber-bands past line 1; lands clear of glyph edges', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse drag on desktop; touch covered below');
    await openHome(page);
    const slab = page.locator('[data-slab]');
    const b0 = (await slab.boundingBox())!;
    await page.mouse.move(b0.x + 60, b0.y + 60);
    await page.mouse.down();
    await page.mouse.move(b0.x + 120, b0.y + 60, { steps: 6 });
    const b1 = (await slab.boundingBox())!;
    expect(Math.abs(b1.x - b0.x - 60)).toBeLessThanOrEqual(1.5);
    await page.mouse.move(b0.x + 2000, b0.y + 60, { steps: 10 });
    const b2 = (await slab.boundingBox())!;
    expect(b2.x - b0.x).toBeLessThan(1940);
    await page.mouse.up();
    await page.waitForTimeout(1500);
    const clear = await page.evaluate(() => {
      const slab = document.querySelector('[data-slab]')!.getBoundingClientRect();
      const line = document.querySelector('.mast [data-line="1"]')!;
      const u = slab.width / 360;
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      const bad: string[] = [];
      for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
        for (let i = 0; i < n.length; i++) {
          if (n.data[i] === ' ') continue;
          const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1);
          const g = r.getBoundingClientRect();
          for (const e of [slab.left, slab.right]) if (e > g.left && e < g.right && (e - g.left < 18 * u || g.right - e < 18 * u)) bad.push(n.data[i]);
        }
      }
      return bad;
    });
    expect(clear).toEqual([]);
  });

  test('press tightens the contact shadow without scaling the slab, and it returns', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pointer press');
    await openHome(page);
    const slab = page.locator('[data-slab]');
    const shadowY = () => page.locator('[data-slab-shadow]').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
    const b = (await slab.boundingBox())!;
    await page.mouse.move(b.x + 40, b.y + 40);
    await page.waitForTimeout(250);
    const hover = await shadowY();
    await page.mouse.down();
    await page.waitForTimeout(250);
    // Motion review 4: a scale would pivot and pull the bent copy off its cut-out.
    expect(['none', '1']).toContain(await slab.evaluate((el) => getComputedStyle(el).scale));
    expect(await shadowY(), 'pressed shadow sits closer').toBeLessThan(hover - 4);
    await page.mouse.up();
    await page.waitForTimeout(250);
    expect(Math.abs((await shadowY()) - hover)).toBeLessThan(1);
  });

  test('a vertical swipe that starts on the slab scrolls the page', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch');
    await openHome(page);
    expect(await page.locator('[data-slab]').evaluate((el) => getComputedStyle(el).touchAction)).toBe('pan-y');
  });
});

// Creative director round 1, fix 4: without the slab (prefers-contrast: more) the dock never sits on the masthead.
test.describe('no-slab fallback (prefers-contrast: more)', () => {
  test('the dock stays hidden at rest, arrives once the hero CTA leaves, and the strip yields availability', async ({ browser, isMobile }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, contrast: 'more' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('[data-slab]')).toBeHidden();
    await page.waitForTimeout(1500);
    const dock = page.locator('[data-dock]');
    await expect(dock).not.toHaveAttribute('data-shown', '');
    expect(await dock.evaluate((d) => (d as HTMLElement).inert)).toBe(true);
    if (!isMobile) await expect(page.locator('.strip')).toHaveAttribute('data-avail-hidden', '');
    await page.evaluate(() => scrollTo(0, 1400));
    await expect(dock).toHaveAttribute('data-shown', '');
    expect(await dock.evaluate((d) => (d as HTMLElement).inert)).toBe(false);
    await page.evaluate(() => scrollTo(0, 0));
    await expect(dock).not.toHaveAttribute('data-shown', '');
    await ctx.close();
  });
});

// Motion review 6: coming back to home by a view transition replays nothing, and the dock never covers the name.
test.describe('soft return to home', () => {
  test('no glide, no text rise; the slab is at rest and the dock hidden from the first frame', async ({ page }) => {
    await page.addInitScript(() => { (window as unknown as { __v3test: boolean }).__v3test = true; });
    await page.goto('/work/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const a = document.createElement('a'); a.href = '/'; a.id = 'go-home'; a.textContent = 'home'; document.body.appendChild(a); });
    await page.evaluate(() => {
      // Sample the first frames after the swap.
      (window as unknown as { __soft: unknown[] }).__soft = [];
      document.addEventListener('astro:after-swap', () => {
        const log = (window as unknown as { __soft: unknown[] }).__soft;
        let n = 0;
        const tick = () => {
          const slab = document.querySelector<HTMLElement>('[data-slab]');
          const dock = document.querySelector<HTMLElement>('[data-dock]')!;
          if (slab) log.push({ o: getComputedStyle(slab).opacity, tr: getComputedStyle(slab).translate, dock: getComputedStyle(dock).opacity, rise: document.querySelector('.hero .lead')!.getAnimations().length });
          if (++n < 20) requestAnimationFrame(tick);
        };
        tick();
      }, { once: true });
    });
    await page.locator('#go-home').click();
    await page.waitForURL(/\/$/);
    await page.waitForTimeout(800);
    const log = await page.evaluate(() => (window as unknown as { __soft: { o: string; tr: string; dock: string; rise: number }[] }).__soft);
    expect(log.length).toBeGreaterThan(3);
    for (const f of log) {
      expect(f.o, 'slab opacity').toBe('1');
      expect(Math.abs(parseFloat(f.tr) || 0), `slab not off to the left (${f.tr})`).toBeLessThan(0.5);
      expect(f.rise, 'no text rise').toBe(0);
      expect(Number(f.dock), 'dock not over the masthead').toBeLessThan(0.5);
    }
    await expect(page.locator('[data-slab]')).toHaveAttribute('data-bend', 'on', { timeout: 8000 });
  });
});
