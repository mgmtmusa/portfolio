import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

export const CASES = [
  { slug: 'evitech', org: 'Evitech', title: 'Paid media rebuilt around lead quality' },
  { slug: 'i-heart-uni', org: 'I Heart Uni', title: 'A student brand grown city by city' },
  { slug: 'the-lil-project', org: 'The Lil Project', title: 'Gigs that fund school buildings' },
];
export const EMAIL = 'mailto:mgmtmusa@gmail.com';
export const LINKEDIN = 'https://www.linkedin.com/in/musa-abdullah-walid';
export const CV = '/cv/Musa-Walid-CV.pdf';
export const WORK_RIGHTS = 'Full work rights until January 2028 (subclass 485 visa), open to employer sponsorship.';
export const AVAILABILITY = 'Based in Melbourne. Open to conversations about marketing, growth and business development opportunities.';
export const REPLY = 'I aim to respond within two business days.';
export const LINE = 'I carried a sales target first, so I judge marketing by what closes.';

/** Collect console errors and failed same-origin requests for the life of the page. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !(/status of 404/.test(m.text()) && /\/_vercel\/insights|\/missing-page/.test(m.location().url))) errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    const own = r.url().startsWith(new URL(page.url() || 'http://x').origin);
    if (own && r.status() >= 400 && !/\/missing-page|\/_vercel\/insights\//.test(r.url())) errors.push(`${r.status()} ${r.url()}`);
  });
  return { assertClean: () => expect(errors, errors.join('\n')).toEqual([]) };
}

/** Load a page with the test hooks on and wait for the hero's glide to settle. */
export async function openHome(page: Page, opts: { settle?: boolean } = {}) {
  await page.addInitScript(() => { (window as unknown as { __v3test: boolean }).__v3test = true; });
  await page.goto('/');
  if (opts.settle !== false) {
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-slab]')!).opacity === '1', null, { timeout: 8000 });
    await page.waitForTimeout(1600);
  }
}

export async function inViewport(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  const vp = page.viewportSize()!;
  return !!box && box.y >= 0 && box.y + box.height <= vp.height + 1 && box.x >= 0 && box.x + box.width <= vp.width + 1;
}

/** Every page, enumerated from src/pages (static routes) plus each /work/<case>/ and the example /for/ page. */
export function allPages(): string[] {
  const dir = path.resolve(process.cwd(), 'src/pages');
  const routes: string[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.astro') || f.startsWith('404')) continue;
    const name = f.replace(/\.astro$/, '');
    routes.push(name === 'index' ? '/' : `/${name}/`);
  }
  routes.push('/work/', ...CASES.map((c) => `/work/${c.slug}/`), '/for/example-company/', '/missing-page/');
  return [...new Set(routes)];
}

/** Hide the Astro dev toolbar (dev server only), and switch on the test hooks. */
export async function prepPage(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __v3test: boolean }).__v3test = true;
    // The view-transition swap replaces <head>, so the style goes back in after every swap.
    const hide = () => {
      const s = document.createElement('style');
      s.textContent = 'astro-dev-toolbar { display: none !important; }';
      document.head.appendChild(s);
    };
    addEventListener('DOMContentLoaded', hide);
    document.addEventListener('astro:after-swap', hide);
  });
}

/** The Tab key for this engine (WebKit only tabs to links with Alt held). */
export const tabKey = (browserName: string) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
