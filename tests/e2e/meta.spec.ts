import { test, expect } from '@playwright/test';
import { pages } from '../../src/lib/meta';
import { site, capabilities } from '../../src/data/site';

// Pages that are still being rebuilt may 404; those cases skip rather than fail.
const PATHS = Object.keys(pages).filter((p) => p !== '/404/');

test.describe('metadata', () => {
  const seen = new Map<string, string>();
  for (const path of PATHS) {
    test(`${path}: title, description, canonical and share image`, async ({ page, request, baseURL }) => {
      const res = await page.goto(path);
      test.skip(!res || res.status() === 404, `${path} is not built yet`);
      const want = pages[path];
      await expect(page).toHaveTitle(want.title);
      const meta = (sel: string) => page.locator(sel).first().getAttribute('content');
      expect(await meta('meta[name="description"]')).toBe(want.description);
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(new URL(path, site.url).href);
      expect(await meta('meta[property="og:title"]')).toBe(want.ogTitle ?? want.title);
      expect(await meta('meta[property="og:image:width"]')).toBe('1200');
      expect(await meta('meta[property="og:image:height"]')).toBe('630');
      expect(await meta('meta[name="twitter:image"]')).toBe(await meta('meta[property="og:image"]'));

      // The image is served by this origin: take the path from the absolute URL.
      const img = new URL((await meta('meta[property="og:image"]'))!);
      expect(img.pathname).toBe(want.og);
      const r = await request.get(new URL(img.pathname, baseURL).href);
      expect(r.status()).toBe(200);
      const b = await r.body();
      expect(b.readUInt32BE(16), 'png width').toBe(1200);
      expect(b.readUInt32BE(20), 'png height').toBe(630);

      expect(seen.get(`t:${want.title}`) ?? path).toBe(path);
      seen.set(`t:${want.title}`, path);
      expect(seen.get(`d:${want.description}`) ?? path).toBe(path);
      seen.set(`d:${want.description}`, path);
    });
  }

  test('home JSON-LD is a ProfilePage with the planned Person fields', async ({ page, request, baseURL }) => {
    await page.goto('/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).not.toContain('—');
    const ld = JSON.parse(blocks[0]);
    expect(ld['@type']).toBe('ProfilePage');
    const p = ld.mainEntity;
    expect(p['@type']).toBe('Person');
    expect(Object.keys(p).sort()).toEqual(['@type', 'address', 'image', 'jobTitle', 'knowsAbout', 'name', 'sameAs', 'worksFor']);
    expect(p.name).toBe(site.name);
    expect(p.jobTitle).toBe(site.role);
    expect(p.address.addressLocality).toBe('Melbourne');
    expect(p.sameAs).toEqual([site.linkedin]);
    expect(p.knowsAbout).toEqual(capabilities.map((c) => c.t));
    expect(p.worksFor.name).toBe('Evitech');
    const r = await request.get(new URL(new URL(p.image).pathname, baseURL).href);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('image/jpeg');
  });

  test('inner pages carry no JSON-LD', async ({ page }) => {
    const res = await page.goto('/about/');
    test.skip(!res || res.status() === 404, 'not built yet');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });

  test('/sitemap.xml has exactly 8 URLs and no /for', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(locs).toHaveLength(8);
    expect(locs.some((l) => l.startsWith('/for'))).toBe(false);
    expect(locs.sort()).toEqual(['/', '/about/', '/contact/', '/cv/', '/work/', '/work/evitech/', '/work/i-heart-uni/', '/work/the-lil-project/'].sort());
  });

  test('/for/example-company/ is noindex with canonical /', async ({ page }) => {
    const res = await page.goto('/for/example-company/');
    test.skip(!res || res.status() === 404, 'example key is not built here');
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${site.url}/`);
  });

  test('/llms.txt carries each case figure with its scope', async ({ request }) => {
    const t = await (await request.get('/llms.txt')).text();
    expect(t).not.toContain('—');
    expect(t).toContain('Two results from the same initiative.');
    expect(t).toContain('(Organisation total)');
    expect(t).toContain('overlap with the organic audience growth work');
  });
});
