// Screenshot pages at representative viewports and report layout problems.
// Usage: node scripts/qa/capture.mjs <baseUrl> <outdir> [full]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const [,, base = 'http://127.0.0.1:4321', out = 'docs/evidence/latest', full] = process.argv;
mkdirSync(out, { recursive: true });
const pages = ['/', '/work/evitech/', '/work/i-heart-uni/', '/work/the-lil-project/', '/nope-404/'];
const vps = [[320, 640], [390, 844], [844, 390], [768, 1024], [1024, 768], [1366, 700], [1440, 900], [1920, 1080]];
const b = await chromium.launch();
const report = [];
for (const [w, h] of vps) {
  const mobile = w < 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile && h > w, hasTouch: mobile });
  for (const path of pages) {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && errs.push(m.text()));
    p.on('response', (r) => r.status() >= 400 && !r.url().includes('nope-404') && errs.push(`${r.status()} ${r.url()}`));
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1100);
    const m = await p.evaluate(() => {
      const over = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect();
        if (r.width === 0 || r.right <= innerWidth + 1) return false;
        for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
          if (/hidden|clip/.test(getComputedStyle(a).overflowX)) return false;
        }
        return true;
      }).slice(0, 3).map((e) => e.className || e.tagName);
      const name = document.querySelector('.hero-name');
      const spans = name ? [...name.querySelectorAll('span')].map((s) => {
        const r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect().right;
      }) : [];
      const cta = document.querySelector('.hero-actions .btn');
      return {
        sw: document.documentElement.scrollWidth,
        over,
        nameRight: spans.length ? Math.round(Math.max(...spans)) : null,
        ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : null,
      };
    });
    const tag = path === '/' ? 'home' : path.replaceAll('/', '_').replace(/^_|_$/g, '');
    await p.screenshot({ path: `${out}/${tag}-${w}x${h}.jpg`, type: 'jpeg', quality: 55, fullPage: !!full && (w === 390 || w === 1440) });
    report.push({ page: path, vp: `${w}x${h}`, overflowX: m.sw > w, ...m, errs });
    await p.close();
  }
  await ctx.close();
}
await b.close();
const bad = report.filter((r) => r.overflowX || r.over.length || r.errs.length || (r.nameRight && r.nameRight > +r.vp.split('x')[0] - 8));
console.log(JSON.stringify(report.filter((r) => r.page === '/').map(({ vp, nameRight, ctaBottom }) => ({ vp, nameRight, ctaBottom }))));
console.log('PROBLEMS', JSON.stringify(bad, null, 1));
