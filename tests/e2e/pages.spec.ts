import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AVAILABILITY, WORK_RIGHTS, REPLY, LINE, CV, EMAIL, LINKEDIN, watchErrors } from './helpers';

// Task 9: About, CV and the /for/<key>/ company links. Copy from docs/v3/story.md §6 and §7.
const NAME = 'Musa Abdullah Walid';
const SITE_URL = 'https://portfolio-omega-gold-33.vercel.app';
const ON_VERCEL = /vercel\.app/.test(process.env.BASE_URL ?? '');
const BANNED = /\b(passionate|leverage|unlock|elevate|seamless|synergy|results-driven|cutting-edge|world-class|journey|drive|empower|innovative|data-driven|strategic)\b|Hi, I’m|Hi, I'm/i;
const PAGES = ['/about/', '/cv/', '/for/example-company/'];

async function meta(page: Page, sel: string) {
  return page.locator(sel).first().getAttribute('content');
}

test.describe('About', () => {
  test('title, description and the H1', async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto('/about/');
    await expect(page).toHaveTitle(`About ${NAME}`);
    expect(await meta(page, 'meta[name="description"]')).toBe(
      `${NAME} moved from field sales into marketing. He has been an O-Week MC and represented Bangladesh at the 2014 Asian Schools Debate Championship.`,
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE_URL}/about/`);
    await page.waitForTimeout(1500);
    errs.assertClean();
  });

  test('the note is labelled as a draft, visibly, and signed', async ({ page }) => {
    await page.goto('/about/');
    const draft = page.locator('[data-draft]');
    await expect(draft).toBeVisible();
    await expect(draft).toHaveText('Draft for Musa’s approval');
    expect(await draft.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(11);
    const note = page.locator('[data-note]');
    await expect(note).toContainText(
      'I started at Evitech in April 2021, selling solar, battery and HVAC upgrades door to door. Within six months I was a team leader in B2B sales, and in 2022 I helped establish the NSW hub and recruited 23 sales executives for it.',
    );
    await expect(note).toContainText(
      'Since January 2023 I’ve run Evitech’s paid media, reporting and CRM. Because of those years in sales, I judge that work on qualified leads and cost per acquisition. I’ve also managed the I Heart Uni brand since 2021, and hosted 18 sold-out events as its lead MC across five cities.',
    );
    await expect(note.locator('.sig')).toHaveText(NAME);
  });

  test('recognition, the stage and the cause work, verbatim', async ({ page }) => {
    await page.goto('/about/');
    const credits = page.locator('.credits li');
    await expect(credits).toHaveText([
      'Asian Schools Debate Championship, 2014. Represented Bangladesh in Kuala Lumpur, among 28 nations.',
      'UNESCO ASPnet ESD Summit, 2014. One of four delegates selected nationally, in Okayama, Japan, with 60 nations attending.',
      'SBI-NUJS Parliamentary Debate, 2015. Represented Bangladesh in Kolkata.',
      'Rajuk Nationals Debate Championship, 2015. Convener for 60 schools; raised $30K AUD.',
    ]);
    await expect(page.getByRole('heading', { name: 'The stage' })).toBeVisible();
    await expect(page.locator('section[aria-labelledby="stage-h"]')).toContainText(
      'MC for University of Melbourne O-Week cohorts of 1,000 students, as a Commerce Student Ambassador.',
    );
    const cause = page.locator('section[aria-labelledby="cause-h"]');
    await expect(cause).toContainText(
      'Event Coordinator for The Lil Project, 2023 to 2025: gigs with Melbourne artists that fund school construction in Zambia. 768 children reached to date (Organisation total).',
    );
    await expect(cause.locator('a[href="/work/the-lil-project/"]')).toHaveText('The Lil Project');
  });

  test('every scoped figure carries a footnote marker and its note', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('article .fn')).toHaveCount(3);
    await expect(page.locator('.notes li')).toHaveCount(3);
    await expect(page.locator('[data-fact="768"] .fn')).toHaveCount(1);
    await expect(page.locator('[data-fact="18"]')).toContainText('18 sold-out events');
    await expect(page.locator('.notes')).toContainText('Organisation total for The Lil Project');
    await expect(page.locator('.notes')).toContainText('These outcomes overlap with the organic audience growth work.');
  });

  test('a footnote opens its scope note', async ({ page }) => {
    await page.goto('/about/');
    await page.waitForTimeout(1500);
    const fn = page.locator('[data-fact="768"] .fn');
    await fn.scrollIntoViewIfNeeded();
    await fn.click();
    await expect(page.locator('#fn-ab-lil')).toBeVisible();
    await expect(page.locator('#fn-ab-lil')).toContainText('Organisation total');
  });

  test('the next step carries the settled sentences and the CV', async ({ page }) => {
    await page.goto('/about/');
    const next = page.locator('.next');
    for (const s of [AVAILABILITY, WORK_RIGHTS, REPLY]) await expect(next).toContainText(s);
    await expect(next.locator(`a[href="${CV}"]`)).toHaveText('Download CV (PDF)');
    await expect(next.locator('a[href="/contact/"]')).toHaveText('Get in touch');
  });
});

test.describe('CV', () => {
  test('title, description, name, role and the settled sentences', async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto('/cv/');
    await expect(page).toHaveTitle(`CV, ${NAME}, Marketing & Growth Specialist`);
    expect(await meta(page, 'meta[name="description"]')).toBe(
      `The CV of ${NAME}, Marketing & Growth Specialist in Melbourne: roles, results, tools and work rights, with the PDF as a direct download.`,
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAME);
    await expect(page.locator('.cv-role')).toHaveText('Marketing & Growth Specialist, Melbourne');
    await expect(page.locator('.cv-line')).toHaveText(LINE);
    const facts = page.locator('.cv-facts');
    for (const s of [AVAILABILITY, WORK_RIGHTS, REPLY]) await expect(facts).toContainText(s);
    await page.waitForTimeout(1500);
    errs.assertClean();
  });

  test('the PDF download resolves, with no gate', async ({ page, request }) => {
    await page.goto('/cv/');
    const link = page.locator('[data-cv-pdf]');
    await expect(link).toHaveText('Download CV (PDF)');
    await expect(link).toHaveAttribute('href', CV);
    await expect(link).toHaveAttribute('download', '');
    const res = await request.get(CV);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
    // The header link and the footer link, nothing more.
    await expect(page.locator(`a[href="${CV}"]`)).toHaveCount(2);
  });

  test('contact routes: email and LinkedIn, no phone number', async ({ page }) => {
    await page.goto('/cv/');
    const acts = page.locator('.cv-acts');
    await expect(acts.locator(`a[href="${EMAIL}"]`)).toHaveText('mgmtmusa@gmail.com');
    const li = acts.locator(`a[href="${LINKEDIN}"]`);
    await expect(li).toHaveAttribute('target', '_blank');
    await expect(li).toHaveAttribute('rel', /noopener/);
    await expect(li).toHaveAccessibleName('LinkedIn (opens in a new tab)');
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test('experience: the four Evitech roles, most recent first, then every other role', async ({ page }) => {
    await page.goto('/cv/');
    await expect(page.locator('.roles .role-t')).toHaveText([
      'Marketing & Growth Specialist',
      'Business Development & People Operations Manager',
      'B2B Sales Executive & Team Leader',
      'Field Sales Representative',
    ]);
    await expect(page.locator('.org-t')).toHaveText([
      'Evitech', 'I Heart Uni', 'The Lil Project', 'University of Melbourne', 'Kerry Logistics', 'Fraser’s Medical (GAMSAT)', 'Roger David',
    ]);
    await expect(page.locator('.roles .role-when').first()).toHaveText('January 2023 to now');
    for (const s of ['highest day-one sales record', 'more than $2M personally closed to date', 'Recruited 23 sales executives', 'roughly $15K to $30K a month', 'Top three in store at 118% of target.']) {
      await expect(page.locator('.orgs')).toContainText(s);
    }
  });

  test('every figure keeps its qualifier and footnote', async ({ page }) => {
    await page.goto('/cv/');
    const pair = page.locator('[data-fact="28% 65%"]');
    await expect(pair).toContainText('28% lower cost per acquisition and 65% more qualified leads. Two results from the same initiative.');
    await expect(pair.locator('.fn')).toHaveCount(1);
    await expect(page.locator('[data-fact="768"]')).toContainText('768 children reached to date (Organisation total).');
    await expect(page.locator('[data-fact="18"]')).toContainText('18 sold-out events hosted as lead MC.');
    await expect(page.locator('.cv .fn')).toHaveCount(6);
    await expect(page.locator('.cv-notes .notes li')).toHaveCount(6);
    // Company-level figures stay on the Evitech case.
    const text = await page.locator('main').innerText();
    expect(text).not.toContain('80%');
    expect(text).not.toContain('2.6×');
  });

  test('capabilities, tools and recognition from site.ts', async ({ page }) => {
    await page.goto('/cv/');
    await expect(page.locator('.cap-t')).toHaveText(['Performance marketing', 'Analytics and reporting', 'CRM and automation', 'Brand, events and teams']);
    for (const t of ['Google Ads', 'GA4', 'Tag Manager', 'Looker Studio', 'HubSpot', 'GoHighLevel', 'Salesforce', 'Zapier', 'Claude']) await expect(page.locator('.tools')).toContainText(t);
    await expect(page.locator('.recs li')).toHaveText([
      'Asian Schools Debate Championship, 2014. Represented Bangladesh in Kuala Lumpur, 28 nations.',
      'UNESCO ASPnet ESD Summit, 2014. One of four delegates selected nationally. Okayama, Japan, 60 nations.',
      'SBI-NUJS Parliamentary Debate, 2015. Represented Bangladesh in Kolkata.',
      'Rajuk Nationals Debate Championship, 2015. Convener for 60 schools. Raised $30K AUD.',
    ]);
  });

  test('Copy email copies with JavaScript and is hidden without it', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/cv/');
    await expect(page.locator('.copy')).toBeHidden();
    await expect(page.locator('[data-cv-pdf]')).toBeVisible();
    await ctx.close();
  });
});

test.describe('/for/<key>/ company links', () => {
  test('the example renders in development: noindex, canonical /, its own titles', async ({ page }) => {
    test.skip(ON_VERCEL, 'the example key is dropped from production builds; previews keep it');
    const errs = watchErrors(page);
    const res = await page.goto('/for/example-company/');
    expect(res?.status()).toBe(200);
    expect(await meta(page, 'meta[name="robots"]')).toBe('noindex');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE_URL}/`);
    expect(await meta(page, 'meta[property="og:url"]')).toBe(`${SITE_URL}/`);
    const ogTitle = `${NAME}, for Example Company (placeholder)`;
    expect(await meta(page, 'meta[property="og:title"]')).toBe(ogTitle);
    expect(await meta(page, 'meta[name="twitter:title"]')).toBe(ogTitle);
    await expect(page).toHaveTitle(ogTitle);
    await page.waitForTimeout(1500);
    errs.assertClean();
  });

  test('the intro line and the lead case are tailored, in the HTML', async ({ page }) => {
    test.skip(ON_VERCEL, 'the example key is dropped from production builds');
    await page.goto('/for/example-company/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAME);
    await expect(page.locator('.fr-intro')).toHaveText('Placeholder intro for a company link. Musa replaces this with a real line before using it.');
    await expect(page.locator('[data-for-key]')).toHaveAttribute('data-for-key', 'example-company');
    await expect(page.locator('.fc-case').first()).toHaveAttribute('data-case', 'evitech');
    await expect(page.locator('.fc-case')).toHaveCount(3);
    await expect(page.locator('.fc-lead')).toContainText('Two results from the same initiative.');
    await expect(page.locator('.fc .fn')).toHaveCount(3);
    await expect(page.locator('.fr-notes .notes li')).toHaveCount(3);
    await expect(page.locator('.fc-case', { hasText: '768' })).toContainText('Organisation total');
  });

  test('works with and without the trailing slash', async ({ request }) => {
    test.skip(ON_VERCEL, 'the example key is dropped from production builds');
    for (const p of ['/for/example-company/', '/for/example-company']) expect((await request.get(p)).status(), p).toBeLessThan(400);
  });

  test('an unknown key 404s locally and falls back to the home page on Vercel', async ({ page }) => {
    for (const p of ['/for/no-such-company/', '/for/no-such-company']) {
      const res = await page.goto(p);
      if (ON_VERCEL) {
        expect(res?.status(), p).toBe(200);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Musa Abdullah\s*Walid/);
      } else {
        expect(res?.status(), p).toBe(404);
      }
    }
  });

  test('never in the sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('<urlset');
    expect(xml).not.toContain('/for/');
  });

  test('vercel.json rewrites unknown keys to / (static files win first)', async () => {
    const cfg = JSON.parse(readFileSync('vercel.json', 'utf8')) as { rewrites: { source: string; destination: string }[] };
    for (const source of ['/for/:key', '/for/:key/']) expect(cfg.rewrites).toContainEqual({ source, destination: '/' });
  });
});

for (const path of PAGES) {
  test(`copy hygiene on ${path}`, async ({ page }) => {
    test.skip(ON_VERCEL && path.startsWith('/for/'), 'the example key is dropped from production builds');
    await page.goto(path);
    const html = await page.content();
    expect(html, 'em dash in page source').not.toMatch(/—|&mdash;|&#8212;/);
    expect(html, 'phone link').not.toMatch(/href="tel:/);
    const text = await page.locator('body').innerText();
    expect(text, 'Australian phone number').not.toMatch(/(\+61|\(0\d\)|\b04\d{2})[\s\d]{6,}/);
    expect(text, 'street address').not.toMatch(/\b\d+\s+\w+\s+(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Court|Ct)\b/);
    expect(text, 'banned word').not.toMatch(BANNED);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sideways scroll').toBe(true);
  });

  test(`axe finds no WCAG 2.2 AA violations on ${path}`, async ({ page }) => {
    test.skip(ON_VERCEL && path.startsWith('/for/'), 'the example key is dropped from production builds');
    await page.goto(path);
    await page.waitForTimeout(1800);
    const { violations } = await new AxeBuilder({ page })
      .exclude('astro-dev-toolbar')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });

  test(`no JavaScript: every fact on ${path} is in the HTML`, async ({ browser }) => {
    test.skip(ON_VERCEL && path.startsWith('/for/'), 'the example key is dropped from production builds');
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(path);
    const text = await page.locator('main').innerText();
    const expected: Record<string, string[]> = {
      '/about/': ['Draft for Musa’s approval', '23 sales executives', '18 sold-out events', 'Asian Schools Debate Championship, 2014.', '1,000 students', '768 children reached to date (Organisation total).', WORK_RIGHTS],
      '/cv/': ['Download CV (PDF)', AVAILABILITY, WORK_RIGHTS, REPLY, '28% lower cost per acquisition', 'Two results from the same initiative.', '$2M', '768'],
      '/for/example-company/': ['Placeholder intro for a company link.', '28%', '65%', '18', '768', 'Organisation total', WORK_RIGHTS],
    };
    for (const s of expected[path]) expect(text, s).toContain(s);
    // The in-page note list is the no-JS route to every scope note.
    expect(await page.locator('.notes li').count()).toBeGreaterThan(0);
    await ctx.close();
  });
}
