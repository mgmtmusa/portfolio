import { test, expect, type Page } from '@playwright/test';

const SIZES: [number, number][] = [[320, 640], [390, 844], [844, 390], [768, 1024], [1024, 768], [1366, 700], [1440, 900], [1920, 1080]];

const heroGeometry = (page: Page) =>
  page.evaluate(() => {
    const rect = (el: Element) => el.getBoundingClientRect();
    const cards = [...document.querySelectorAll('.card-hand .card-in')].map(rect);
    const copy = [...document.querySelectorAll('.hero-copy > *')].map(rect);
    const cta = rect(document.querySelector('.hero-actions .btn')!);
    const overlaps = copy.some((a) => cards.some((b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom));
    return {
      vw: innerWidth,
      vh: innerHeight,
      ctaBottom: cta.bottom,
      cardsLeft: Math.min(...cards.map((c) => c.left)),
      cardsRight: Math.max(...cards.map((c) => c.right)),
      textOverCards: overlaps,
    };
  });

test.describe('hero geometry (regression for clipped cards and the landscape CTA)', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'geometry sweep runs once, in desktop Chromium');
  for (const [w, h] of SIZES) {
    test(`${w}×${h}: CTA fully on the first screen, cards inside the frame, no text under cards`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 900 });
      const page = await ctx.newPage();
      await page.goto('/');
      await page.waitForTimeout(900);
      const g = await heroGeometry(page);
      if (!(w < 640 && h > w) || h >= 640) expect(g.ctaBottom, 'View selected work is cut off').toBeLessThanOrEqual(g.vh);
      expect(g.cardsLeft, 'a hero card is clipped on the left').toBeGreaterThanOrEqual(0);
      expect(g.cardsRight, 'a hero card is clipped on the right').toBeLessThanOrEqual(g.vw);
      expect(g.textOverCards, 'hero text sits under a card').toBe(false);
      await ctx.close();
    });
  }
});

test.describe('hero cards: rendering and interaction', () => {
  test('card faces render (visual baseline per engine)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(900);
    // Regression: in WebKit a 3D pseudo-layer once painted over every card face.
    await expect(page.locator('.hand')).toHaveScreenshot('hand.png', { animations: 'disabled', maxDiffPixelRatio: 0.02 });
  });

  test('hover near a card edge does not flicker', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pointer hover');
    await page.goto('/');
    await page.waitForTimeout(900);
    const card = page.locator('.card-hand').first();
    const box = (await card.boundingBox())!;
    const states: boolean[] = [];
    for (let i = 0; i < 16; i++) {
      await page.mouse.move(box.x + box.width / 2 + (i % 2), box.y + box.height - 4);
      await page.waitForTimeout(50);
      states.push(await card.evaluate((el) => el.matches(':hover')));
    }
    const toggles = states.slice(1).filter((s, i) => s !== states[i]).length;
    expect(toggles, `hover toggled ${toggles} times: ${states.join(',')}`).toBe(0);
  });

  test('keyboard focus ring travels with the lifted card face', async ({ page, isMobile, browserName }) => {
    test.skip(isMobile || browserName === 'webkit', 'keyboard Tab journeys run in desktop Chromium');
    await page.goto('/');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => !!document.activeElement?.closest('.hand'))) break;
    }
    const face = await page.evaluate(() => getComputedStyle(document.activeElement!.querySelector('.card-in')!).outlineStyle);
    expect(face).toBe('solid');
  });
});

test.describe('hero cards under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('hover gives a non-moving cue', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pointer hover');
    await page.goto('/');
    const face = page.locator('.card-hand').first().locator('.card-in');
    const before = await face.evaluate((el) => getComputedStyle(el).transform);
    await page.locator('.card-hand').first().hover();
    await page.waitForTimeout(100);
    const after = await face.evaluate((el) => ({ t: getComputedStyle(el).transform, o: getComputedStyle(el).outlineStyle }));
    expect(after.t).toBe(before);
    expect(after.o).toBe('solid');
  });
});

test('all three hero cards show their text, fully on screen (iPhone regression)', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(900);
  const vw = page.viewportSize()!.width;
  const cards = page.locator('.card-hand');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded();
    for (const part of ['.card-org', '.card-title', '.card-stat', '.card-cta']) {
      const el = card.locator(part);
      await expect(el).toBeVisible();
      const box = (await el.boundingBox())!;
      expect(box.width, `${part} has no width`).toBeGreaterThan(20);
      expect(box.x + box.width, `${part} runs off screen`).toBeLessThanOrEqual(vw);
      // Text must actually be painted in a contrasting colour, not hidden behind a layer.
      const hit = await el.evaluate((n) => {
        const r = n.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + Math.min(10, r.width / 2), r.top + r.height / 2);
        return !!top && (n === top || n.contains(top));
      });
      expect(hit, `${part} is covered by another element`).toBe(true);
    }
  }
});

test.describe('every hero card opens its case study by pointer or tap', () => {
  // Regression: a card placed behind the hand's 3D plane was unreachable by pointer and touch.
  for (const [i, slug] of ['evitech', 'i-heart-uni', 'the-lil-project'].entries()) {
    test(`card ${i + 1} → /work/${slug}/`, async ({ page, isMobile }) => {
      await page.goto('/');
      await page.waitForTimeout(900);
      // On phones the cards sit below the portrait: bring this one on screen first.
      await page.locator('.card-hand').nth(i).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      // Find a point where this card is the topmost hit target.
      const pt = await page.evaluate((idx) => {
        const card = document.querySelectorAll('.card-hand')[idx];
        const r = card.getBoundingClientRect();
        for (let y = r.top + 8; y < r.bottom - 8; y += 8)
          for (let x = r.left + 8; x < r.right - 8; x += 8)
            if (document.elementFromPoint(x, y)?.closest('.card-hand') === card) return { x, y };
        return null;
      }, i);
      expect(pt, `card ${i + 1} has no exposed, hittable area`).not.toBeNull();
      if (isMobile) await page.touchscreen.tap(pt!.x, pt!.y);
      else await page.mouse.click(pt!.x, pt!.y);
      await expect(page).toHaveURL(new RegExp(`/work/${slug}/$`));
    });
  }
});
