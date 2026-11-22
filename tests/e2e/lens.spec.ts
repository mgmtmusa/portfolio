import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

test.describe('portrait lens hero', () => {
  test('studio portrait is in the hero with descriptive alt text and loads eagerly', async ({ page }) => {
    await page.goto('/');
    const img = page.getByRole('img', { name: /Studio portrait of Musa Abdullah Walid/ });
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('loading', 'eager');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    // The machine layer is decorative and hidden from assistive tech.
    await expect(page.locator('.lens-machine')).toHaveAttribute('alt', '');
    await expect(page.locator('.lens-machine')).toHaveAttribute('aria-hidden', 'true');
  });

  test('Machine view button toggles the robot layer and announces it', async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'Machine view' });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.lens-stage')).toHaveClass(/is-machine/);
    await expect(page.locator('[data-lens-status]')).toHaveText(/Machine view/);
    const robot = page.locator('.lens-machine');
    await expect(robot).toHaveAttribute('src', /musa-robot.*\.webp$/);
    await expect.poll(() => robot.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.lens-stage')).not.toHaveClass(/is-machine/);
    errs.assertClean();
  });

  test('mouse over the portrait opens a lens that follows the pointer', async ({ page, isMobile }) => {
    test.skip(isMobile, 'fine pointer only');
    await page.goto('/');
    const stage = page.locator('.lens-stage');
    await expect(stage).toHaveClass(/can-lens/);
    const box = (await stage.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.35, { steps: 3 });
    await expect(stage).toHaveClass(/is-lens/);
    const lx = await stage.evaluate((el) => parseFloat(el.style.getPropertyValue('--lx')));
    expect(Math.abs(lx - box.width * 0.5)).toBeLessThan(3);
    await page.mouse.move(2, box.y + box.height / 2);
    await expect(stage).not.toHaveClass(/is-lens/);
  });

  test('on touch screens the lens degrades to tap-to-toggle', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch only');
    await page.goto('/');
    const stage = page.locator('.lens-stage');
    await expect(stage).not.toHaveClass(/can-lens/);
    await expect(page.locator('.lens-hint')).toHaveText(/Tap the portrait/);
    await stage.tap();
    await expect(stage).toHaveClass(/is-machine/);
    await expect(page.getByRole('button', { name: 'Machine view' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('the robot image is not on the critical path', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(requested.some((u) => u.includes('musa-robot'))).toBe(false);
  });
});

test.describe('portrait lens under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no moving lens; the button swaps instantly', async ({ page, isMobile }) => {
    await page.goto('/');
    const stage = page.locator('.lens-stage');
    await expect(stage).not.toHaveClass(/can-lens/);
    if (!isMobile) {
      const box = (await stage.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2, { steps: 2 });
      await expect(stage).not.toHaveClass(/is-lens/);
    }
    await page.getByRole('button', { name: 'Machine view' }).click();
    await expect(stage).toHaveClass(/is-machine/);
    // Reduced motion caps transitions at 1ms, so anything still running after a moment is real motion.
    const running = () =>
      page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          .map((a) => `${(a as CSSTransition).transitionProperty ?? (a as CSSAnimation).animationName} on ${(a.effect as KeyframeEffect)?.target?.className}`),
      );
    await expect.poll(running, { timeout: 1000 }).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the portrait still shows and the toggle stays hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('img', { name: /Studio portrait/ })).toBeVisible();
    await expect(page.locator('.lens-toggle')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
