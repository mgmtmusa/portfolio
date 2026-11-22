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

/** Collect console errors and failed same-origin requests for the life of the page. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/status of 404/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    const own = r.url().startsWith(new URL(page.url() || 'http://x').origin);
    // /_vercel/insights is Vercel Web Analytics: it only exists on Vercel, so it 404s on a local preview.
    if (own && r.status() >= 400 && !/\/missing-page|\/_vercel\/insights\//.test(r.url())) errors.push(`${r.status()} ${r.url()}`);
  });
  return { assertClean: () => expect(errors, errors.join('\n')).toEqual([]) };
}

export async function inViewport(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  const vp = page.viewportSize()!;
  return !!box && box.y >= 0 && box.y + box.height <= vp.height + 1;
}
