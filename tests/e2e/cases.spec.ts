import { test, expect } from '@playwright/test';
import { CASES, watchErrors } from './helpers';

for (const [i, c] of CASES.entries()) {
  test(`${c.org} case study has the full story and working navigation`, async ({ page }) => {
    const errs = watchErrors(page);
    const res = await page.goto(`/work/${c.slug}/`);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(c.title));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(c.title);
    for (const h of ['The brief', 'The commercial question', 'What I was responsible for', 'Decisions I made', 'Evidence']) {
      await expect(page.getByRole('heading', { name: h, exact: true })).toBeVisible();
    }
    const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
    expect(canonical).toBe(`https://portfolio-omega-gold-33.vercel.app/work/${c.slug}/`);
    const next = CASES[(i + 1) % CASES.length];
    await page.getByRole('link', { name: new RegExp(`Next case study.*${next.title}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/work/${next.slug}/$`));
    await page.getByRole('link', { name: 'All work', exact: true }).click();
    await expect(page).toHaveURL(/\/#work$/);
    await expect(page.getByRole('heading', { name: 'Selected work' })).toBeInViewport();
    errs.assertClean();
  });
}

test('unknown routes show the 404 page with ways back', async ({ page }) => {
  const res = await page.goto('/missing-page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page doesn’t exist');
  await page.getByRole('link', { name: 'Home page' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('the public Lil Project link opens the real site in a new tab', async ({ page }) => {
  await page.goto('/work/the-lil-project/');
  const link = page.getByRole('link', { name: /Visit thelilproject\.com/ });
  await expect(link).toHaveAttribute('href', 'https://thelilproject.com');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});

test('metadata: social image, sitemap and robots resolve', async ({ page, request }) => {
  await page.goto('/');
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe('https://portfolio-omega-gold-33.vercel.app/og.png');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('Person');
  for (const path of ['/og.png', '/favicon.svg', '/sitemap.xml', '/robots.txt', '/fonts/archivo.woff2']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  expect(await (await request.get('/sitemap.xml')).text()).toContain('/work/the-lil-project/');
});
