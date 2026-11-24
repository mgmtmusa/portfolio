import { test, expect, type Page } from '@playwright/test';
import { EMAIL, REPLY, watchErrors } from './helpers';

// Task 8: the brief. Copy from docs/v3/story.md §5 and §6.
const ERR_WHO = 'Add who you are so I know who’s writing.';
const ERR_ROLE = 'Add the role or project. A line is enough.';
const BANNED = /\b(passionate|leverage|unlock|elevate|seamless|synergy|results-driven|cutting-edge|world-class|journey|drive|empower|innovative|data-driven|strategic)\b|Hi, I’m|Hi, I'm/i;

type Rec = { va: [string, { name: string; data?: Record<string, unknown> }][]; mails: string[] };

/** Records window.va calls, turns analytics on, and captures the mailto click before the browser acts on it. */
async function setup(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { va: (...a: unknown[]) => void; __rec: Rec };
    w.__rec = { va: [], mails: [] };
    w.va = (...a: unknown[]) => w.__rec.va.push(a as Rec['va'][number]);
    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="mailto:"]');
      if (a && (a as HTMLElement).hidden) { e.preventDefault(); w.__rec.mails.push(a.getAttribute('href')!); }
    }, true);
    const hide = () => { document.documentElement.dataset.analytics = 'on'; const s = document.createElement('style'); s.textContent = 'astro-dev-toolbar{display:none!important}'; document.documentElement.append(s); };
    document.addEventListener('DOMContentLoaded', hide);
  });
  await page.goto('/contact/');
  await page.waitForSelector('form[data-ready]');
  await page.waitForSelector('html[data-chrome="ready"]');
}
const rec = (page: Page) => page.evaluate(() => (window as unknown as { __rec: Rec }).__rec);

test.describe('Contact', () => {
  test('title, description, H1 and intro', async ({ page }) => {
    const errs = watchErrors(page);
    await setup(page);
    await expect(page).toHaveTitle('Send a brief to Musa Abdullah Walid');
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toBe(
      'Send Musa Abdullah Walid a short brief about a marketing, growth or business development role. The form opens your email app with the brief ready to send.',
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The brief');
    await expect(page.getByText('Tell me about the role or project, and your email app will open with the brief ready to send.')).toBeVisible();
    await expect(page.getByText('Your brief appears here as you type.')).toBeVisible();
    await expect(page.getByText('Opens your email app with everything filled in. Nothing you type is stored on this site.')).toBeVisible();
    await expect(page.locator('main').getByText(REPLY, { exact: true })).toBeVisible();
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(BANNED);
    expect(text).not.toContain('\u2014');
    errs.assertClean();
  });

  test('the preview fills line by line', async ({ page }) => {
    await setup(page);
    const line = (k: string) => page.locator(`[data-line="${k}"]`);
    await expect(line('who')).toBeHidden();
    await page.getByLabel('Who you are').fill('Sam Lee, Head of Growth, Acme');
    await expect(line('who')).toBeVisible();
    await expect(line('who').locator('dd')).toHaveText('Sam Lee, Head of Growth, Acme');
    await expect(page.locator('[data-title]')).toHaveText('Brief from Sam Lee, Head of Growth, Acme');
    await expect(line('role')).toBeHidden();
    await page.getByLabel('The role or project').fill('Growth marketer.\nSecond line.');
    await expect(line('role')).toBeVisible();
    await expect(line('role').locator('dd')).toHaveText('Growth marketer.\nSecond line.');
    await expect(line('timeline')).toBeHidden();
    await page.getByLabel('Timeline (optional)').fill('Deciding in January');
    await expect(line('timeline').locator('dd')).toHaveText('Deciding in January');
    await page.getByLabel('How you found me (optional)').fill('LinkedIn');
    await expect(line('source').locator('dd')).toHaveText('LinkedIn');
    await expect(page.locator('[data-empty]')).toBeHidden();
    await expect(page.locator('.bp-reply')).toContainText(/Aim to reply by (Monday|Tuesday|Wednesday|Thursday|Friday) \d{1,2} [A-Z][a-z]+/);
    await expect(page.locator('.bp-reply .fn')).toBeVisible();
  });

  test('required errors use the exact copy', async ({ page }) => {
    await setup(page);
    await expect(page.locator('[data-error="who"]')).toBeHidden();
    await page.getByRole('button', { name: 'Email the brief' }).click();
    await expect(page.locator('[data-error="who"]')).toHaveText(ERR_WHO);
    await expect(page.locator('[data-error="role"]')).toHaveText(ERR_ROLE);
    await expect(page.getByLabel('Who you are')).toBeFocused();
    expect((await rec(page)).mails).toEqual([]);
    await page.getByLabel('Who you are').fill('Sam');
    await expect(page.locator('[data-error="who"]')).toBeHidden();
    await expect(page.locator('[data-error="role"]')).toHaveText(ERR_ROLE);
  });

  test('submit sets a mailto whose decoded body holds each field, with awkward characters', async ({ page }) => {
    await setup(page);
    const long = 'x'.repeat(1990) + ' end';
    await page.getByLabel('Who you are').fill('Sam & Co #1 🙂');
    await page.getByLabel('The role or project').fill(long);
    await page.getByLabel('Timeline (optional)').fill('Q1 & Q2');
    await page.getByLabel('How you found me (optional)').fill('A referral');
    await page.getByRole('button', { name: 'Email the brief' }).click();
    const { mails } = await rec(page);
    expect(mails).toHaveLength(1);
    const href = mails[0];
    expect(href.startsWith(`${EMAIL}?subject=`)).toBe(true);
    const url = new URL(href);
    expect(url.pathname).toBe('mgmtmusa@gmail.com');
    const subject = decodeURIComponent(href.match(/subject=([^&]*)/)![1]);
    const body = decodeURIComponent(href.match(/body=(.*)$/)![1]);
    expect(subject).toBe('Brief from Sam & Co #1 🙂');
    for (const v of ['Sam & Co #1 🙂', long, 'Q1 & Q2', 'A referral', 'Aim to reply by ']) expect(body).toContain(v);
    expect(body).toContain('Who you are:');
  });

  test('analytics: contact_start fires once, contact_send on submit, no field values', async ({ page }) => {
    await setup(page);
    await page.getByLabel('Who you are').pressSequentially('Sam');
    await page.getByLabel('The role or project').pressSequentially('Growth role');
    const names = async () => (await rec(page)).va.map((c) => c[1].name);
    expect((await names()).filter((n) => n === 'contact_start')).toHaveLength(1);
    expect(await names()).not.toContain('contact_send');
    await page.getByRole('button', { name: 'Email the brief' }).click();
    const r = await rec(page);
    expect(r.va.filter((c) => c[1].name === 'contact_send')).toHaveLength(1);
    const dump = JSON.stringify(r.va);
    expect(dump).not.toMatch(/Sam|Growth role/);
    for (const c of r.va) expect(Object.keys(c[1].data ?? {}).every((k) => ['slug', 'from', 'key'].includes(k))).toBe(true);
  });

  test('a failed submit does not fire contact_send', async ({ page }) => {
    await setup(page);
    await page.getByRole('button', { name: 'Email the brief' }).click();
    expect((await rec(page)).va.map((c) => c[1].name)).not.toContain('contact_send');
  });

  test('alternatives: direct email, CV, LinkedIn', async ({ page }) => {
    await setup(page);
    const main = page.locator('main');
    await expect(main.getByRole('link', { name: 'mgmtmusa@gmail.com' })).toHaveAttribute('href', EMAIL);
    await expect(main.getByRole('button', { name: 'Copy email' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Download CV (PDF)' })).toHaveAttribute('href', '/cv/Musa-Walid-CV.pdf');
    const li = main.getByRole('link', { name: 'LinkedIn (opens in a new tab)' });
    await expect(li).toHaveAttribute('target', '_blank');
    await expect(li).toHaveAttribute('rel', /noopener/);
  });

  test('inputs are at least 16px (phones never zoom on focus)', async ({ page }) => {
    await setup(page);
    for (const id of ['who', 'role', 'timeline', 'source']) {
      const size = await page.locator(`#bf-${id}`).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(size).toBeGreaterThanOrEqual(16);
    }
  });

  test('no horizontal overflow', async ({ page }) => {
    await setup(page);
    await page.getByLabel('The role or project').fill('y'.repeat(1500));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await page.locator('.bp').boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  });
});

test.describe('Contact without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the form is a working mailto and the preview and Copy email stay out of the way', async ({ page }) => {
    await page.goto('/contact/');
    const form = page.locator('form[data-brief]');
    await expect(form).toHaveAttribute('action', `${EMAIL}?subject=Brief`);
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form).toHaveAttribute('enctype', 'text/plain');
    const max = async (n: string) => page.locator(`[name="${n}"]`).getAttribute('maxlength');
    expect([await max('who'), await max('role'), await max('timeline'), await max('source')]).toEqual(['200', '2000', '200', '200']);
    await expect(page.locator('[name="who"]')).toHaveAttribute('required', '');
    await expect(page.locator('[name="role"]')).toHaveAttribute('required', '');
    await expect(page.getByRole('button', { name: 'Email the brief' })).toBeVisible();
    await expect(page.locator('[data-preview]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Copy email' })).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The brief');
  });
});
