import { describe, expect, it } from 'vitest';
import { pages, resolveHead, profilePage, sitemapXml, llmsText, SITEMAP_PATHS } from '../../src/lib/meta';
import { site, cases } from '../../src/data/site';

const origin = site.url;
const all = JSON.stringify([pages, profilePage(origin), llmsText(origin), sitemapXml(origin)]);

describe('page metadata', () => {
  it('gives every page a unique title and description', () => {
    const titles = Object.values(pages).map((p) => p.title);
    const descriptions = Object.values(pages).map((p) => p.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
  it('uses the story.md titles', () => {
    expect(pages['/'].title).toBe('Musa Abdullah Walid, Marketing & Growth Specialist');
    expect(pages['/work/evitech/'].title).toBe('Evitech: paid media rebuilt around lead quality');
    expect(pages['/cv/'].title).toBe('CV, Musa Abdullah Walid, Marketing & Growth Specialist');
  });
  it('has no em dash anywhere', () => expect(all).not.toContain('—'));
  it('has one OG image per case', () => {
    for (const c of cases) expect(pages[`/work/${c.slug}/`].og).toBe(`/og/${c.slug}.png`);
  });
});

describe('resolveHead', () => {
  it('prefers the story entry for known pages and builds absolute URLs', () => {
    const h = resolveHead({ path: '/work/evitech/', title: 'stale v2 title' }, origin);
    expect(h.title).toBe(pages['/work/evitech/'].title);
    expect(h.canonical).toBe(`${origin}/work/evitech/`);
    expect(h.ogImage).toBe(`${origin}/og/evitech.png`);
    expect(h.robots).toBeUndefined();
    expect(h.jsonLd).toBeUndefined();
  });
  it('forces /for/* to noindex with canonical / and the home image', () => {
    const h = resolveHead({ path: '/for/acme/', title: 'Acme', ogTitle: 'For Acme', canonicalPath: '/x/' }, origin);
    expect(h.robots).toBe('noindex');
    expect(h.canonical).toBe(`${origin}/`);
    expect(h.ogTitle).toBe('For Acme');
    expect(h.ogImage).toBe(`${origin}/og/home.png`);
  });
  it('noindexes the 404', () => expect(resolveHead({ path: '/404/' }, origin).robots).toBe('noindex'));
  it('puts JSON-LD on home only', () => {
    expect(resolveHead({ path: '/' }, origin).jsonLd).toBeTruthy();
    expect(resolveHead({ path: '/about/' }, origin).jsonLd).toBeUndefined();
  });
});

describe('JSON-LD', () => {
  const p = (profilePage(origin) as { mainEntity: Record<string, unknown> }).mainEntity;
  it('carries exactly the planned Person fields', () => {
    expect(Object.keys(p).sort()).toEqual(['@type', 'address', 'description', 'email', 'image', 'jobTitle', 'knowsAbout', 'name', 'sameAs', 'url', 'worksFor']);
    expect(p.jobTitle).toBe(site.role);
    expect(p.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Melbourne' });
    expect(p.sameAs).toEqual([site.linkedin]);
    expect(p.knowsAbout).toEqual(['Performance marketing', 'Paid media', 'Google Ads', 'Meta Ads Manager', 'GA4', 'Looker Studio', 'HubSpot', 'CRM and automation', 'Event marketing']);
    expect(p.worksFor).toEqual({ '@type': 'Organization', name: 'Evitech' });
    expect(p.image).toBe(`${origin}/og/musa-portrait.jpg`);
  });
  it('has no phone number or street address', () => expect(JSON.stringify(p)).not.toMatch(/telephone|streetAddress|\+?\d{8,}/));
});

describe('I Heart Uni share metadata', () => {
  const m = pages['/work/i-heart-uni/'];
  const note = 'These outcomes overlap with the organic audience growth work.';
  it('restores 18 with the overlap note in description and alt, and keeps the title without it', () => {
    expect(m.description).toContain(`18 sold-out events as I Heart Uni’s lead MC across five cities. ${note}`);
    expect(m.ogAlt).toContain(`18 sold-out events hosted as lead MC. ${note}`);
    expect(m.ogTitle).not.toMatch(/18/);
  });
});

describe('sitemap', () => {
  it('lists exactly 8 URLs and never /for or the 404', () => {
    expect(SITEMAP_PATHS).toHaveLength(8);
    const xml = sitemapXml(origin);
    expect(xml.match(/<loc>/g)).toHaveLength(8);
    expect(xml).not.toContain('/for');
    expect(xml).not.toContain('/404');
  });
});

describe('llms.txt', () => {
  const text = llmsText(origin);
  it('carries every case figure with its scope label or note', () => {
    for (const c of cases) {
      const line = text.split('\n').find((l) => l.includes(`/work/${c.slug}/`))!;
      expect(line).toContain(c.title);
      for (const r of c.results) {
        expect(line).toContain(r.v);
        if (r.scope) expect(line).toContain(`(${r.scope})`);
      }
    }
    expect(text).toMatch(/28% lower cost per acquisition and 65% more qualified leads \(two results from the same initiative\); 80%/);
    expect(text).toMatch(/18 sold-out events.*overlap with the organic audience growth work\./);
  });
  it('has no phone number or street address', () => expect(text).not.toMatch(/\+?\d[\d ]{8,}\d|\bStreet\b/));
});
