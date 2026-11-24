// Task 11, F13, F18: with JavaScript off every fact is in the HTML and the page still works.
import { test, expect } from '@playwright/test';
import { allPages, CASES, EMAIL, WORK_RIGHTS } from './helpers';
import { site, cases } from '../../src/data/site';

test.use({ javaScriptEnabled: false });

test('home: every hero and proof fact is in the HTML, the dock shows, the menu and the clock do not', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  for (const s of ['Musa Abdullah', site.line.slice(0, 22), '28%', '65%', '$2M+', '13,200', 'Two results from the same initiative']) expect(text).toContain(s);
  await expect(page.locator('[data-dock]')).toBeVisible();
  await expect(page.locator('[data-dock]')).not.toHaveAttribute('inert', '');
  await expect(page.locator('.dock-menu')).toBeHidden();
  await expect(page.locator('#cmdk')).toBeHidden();
  // No placeholder clock: the time element stays empty.
  expect((await page.locator('[data-clock]').first().textContent())?.trim()).toBe('');
  expect(text).not.toMatch(/\b00:00(:00)?\b/);
});

test('home: the CSS pane has no bend and the slab is a plain pane', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('svg.bend').count()).toBe(0);
  const slab = page.locator('[data-slab]');
  expect(await slab.getAttribute('data-bend')).toBeNull();
  expect(await slab.evaluate((el) => getComputedStyle(el).backdropFilter.includes('url('))).toBe(false);
});

test('home: every footnote is reachable in the in-page list', async ({ page }) => {
  await page.goto('/');
  const notes = await page.locator('button.fn[data-fn]').evaluateAll((els) =>
    els.map((e) => (document.getElementById((e as HTMLElement).dataset.fn!)?.textContent ?? '').replace(/^\d+/, '').trim()),
  );
  expect(notes.length).toBeGreaterThan(0);
  const list = (await page.locator('ol.notes').first().innerText()).replace(/\s+/g, ' ');
  for (const n of notes) {
    expect(n.length).toBeGreaterThan(8);
    expect(list, `note missing from the in-page list: ${n}`).toContain(n.replace(/\s+/g, ' '));
  }
});

test('contact: the brief is a mailto form with maxlengths (F18)', async ({ page }) => {
  await page.goto('/contact/');
  const form = page.locator('form[data-brief]');
  expect(await form.getAttribute('action')).toBe(`${EMAIL}?subject=Brief`);
  expect(await form.getAttribute('method')).toBe('post');
  expect(await form.getAttribute('enctype')).toBe('text/plain');
  const max: Record<string, string> = { who: '200', role: '2000', timeline: '200', source: '200' };
  for (const [name, n] of Object.entries(max)) expect(await page.locator(`[name="${name}"]`).getAttribute('maxlength')).toBe(n);
  await expect(page.getByRole('button', { name: 'Email the brief' }).first()).toBeVisible();
  await expect(page.locator('main').getByText('I aim to respond within two business days.', { exact: true })).toBeVisible();
});

for (const c of cases) {
  test(`/work/${c.slug}/: the headline, every result and its scope are in the HTML`, async ({ page }) => {
    await page.goto(`/work/${c.slug}/`);
    const text = await page.locator(`main [data-sheet="${c.slug}"]`).innerText();
    expect(text).toContain(c.title);
    for (const r of c.results) {
      expect(text, `${c.slug} result ${r.v}`).toContain(r.v);
      if (r.scope) expect(text, `${c.slug} scope for ${r.v}`).toContain(r.scope);
    }
  });
}

test('about and cv: work rights and availability appear verbatim', async ({ page }) => {
  await page.goto('/about/');
  expect(await page.locator('body').innerText()).toContain(site.availability);
  await page.goto('/cv/');
  const t = await page.locator('body').innerText();
  expect(t).toContain(WORK_RIGHTS);
});

test('no page shows a placeholder clock or a hidden footer without JavaScript', async ({ page }) => {
  for (const path of allPages()) {
    await page.goto(path);
    expect((await page.locator('[data-clock]').first().textContent())?.trim(), path).toBe('');
    await expect(page.locator('.foot'), path).toBeVisible();
    await expect(page.locator('[data-dock]'), path).toBeVisible();
  }
});
void CASES;
