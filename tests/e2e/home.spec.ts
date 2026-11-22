import { test, expect } from '@playwright/test';
import { CASES, CV, EMAIL, LINKEDIN, WORK_RIGHTS, watchErrors } from './helpers';

test.describe('home page', () => {
  test('first screen states name, role, angle and the route to work', async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto('/');
    // The thesis line is the headline; the name and role sit directly above it.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/I sell like a human\.\s*I measure like a machine\./);
    await expect(page.locator('.hero-name')).toHaveText('Musa Abdullah Walid');
    await expect(page.locator('.hero-name')).toBeInViewport();
    await expect(page.getByText('Marketing & Growth Specialist in Melbourne')).toBeInViewport();
    await expect(page.getByText(/came up through sales/)).toBeVisible();
    const cta = page.getByRole('link', { name: 'View selected work' });
    await expect(cta).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Contact' })).toBeInViewport();
    errs.assertClean();
  });

  test('"View selected work" lands on the work section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'View selected work' }).click();
    await expect(page).toHaveURL(/#work$/);
    await expect(page.getByRole('heading', { name: 'Selected work' })).toBeInViewport();
  });

  test('hero cards are labelled links that open case studies, and Back returns', async ({ page }) => {
    await page.goto('/');
    const hand = page.getByRole('navigation', { name: 'Case studies' });
    for (const c of CASES) {
      await expect(hand.getByRole('link', { name: new RegExp(`^${c.org} ${c.title}`) })).toHaveAttribute('href', `/work/${c.slug}/`);
    }
    await hand.getByRole('link', { name: /^Evitech / }).click();
    await expect(page).toHaveURL(/\/work\/evitech\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(CASES[0].title);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/work\/evitech\/$/);
  });

  test('contact actions point to the right places', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact$/);
    const email = page.getByRole('link', { name: /Email mgmtmusa@gmail\.com/ });
    await expect(email).toBeInViewport();
    await expect(email).toHaveAttribute('href', EMAIL);
    await expect(page.getByRole('link', { name: /LinkedIn profile/ })).toHaveAttribute('href', LINKEDIN);
  });

  test('Download CV buttons serve the PDF from /cv/Musa-Walid-CV.pdf', async ({ page, request }) => {
    await page.goto('/');
    const cvs = page.getByRole('link', { name: /Download CV/ });
    await expect(cvs).toHaveCount(2); // hero and contact footer
    for (const link of await cvs.all()) await expect(link).toHaveAttribute('href', CV);
    await expect(cvs.first()).toBeInViewport();
    const res = await request.get(CV);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('work rights use the approved 485 wording', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#contact')).toContainText(WORK_RIGHTS);
    await expect(page.locator('body')).not.toContainText(/full Australian working rights/i);
  });

  test('metrics are plain, stable text (no counting in the accessibility tree)', async ({ page }) => {
    await page.goto('/#work');
    const read = () => page.locator('.results dd').allTextContents();
    const first = await read();
    expect(first).toContain('28%');
    expect(first).toContain('65%');
    await page.waitForTimeout(1200);
    expect(await read()).toEqual(first);
  });

  test('direct anchor load to the career section shows the finished staircase', async ({ page }) => {
    await page.goto('/#career');
    await expect(page.getByRole('heading', { name: 'From the sales floor to growth' })).toBeInViewport();
    await expect(page.locator('.career')).toHaveClass(/risen/);
    await expect(page.getByRole('link', { name: 'Read the Evitech case study' }).last()).toBeVisible();
  });
});

test.describe('layout across widths', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'width sweep runs once, in desktop Chromium');
  for (const [w, h] of [[320, 640], [390, 844], [844, 390], [768, 1024], [1024, 768], [1366, 700], [1440, 900], [1920, 1080]]) {
    test(`no horizontal overflow and headline inside the frame at ${w}×${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      for (const path of ['/', ...CASES.map((c) => `/work/${c.slug}/`)]) {
        await page.goto(path);
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(sw, `${path} overflows at ${w}px`).toBeLessThanOrEqual(w);
      }
      await page.goto('/');
      const right = await page.evaluate(() =>
        Math.max(...[...document.querySelectorAll('.hero-title > span, .hero-name')].map((s) => {
          const r = document.createRange();
          r.selectNodeContents(s);
          return r.getBoundingClientRect().right;
        })),
      );
      expect(right, 'hero headline touches the right edge').toBeLessThanOrEqual(w - 12);
      await expect(page.getByRole('link', { name: 'Work', exact: true })).toBeInViewport();
    });
  }
});
