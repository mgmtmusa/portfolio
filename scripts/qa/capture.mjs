// Screenshot every page at the four review viewports and report layout problems.
// Usage: node scripts/qa/capture.mjs <baseUrl> <outdir> [full]
// Phones use real device emulation (touch, mobile UA). Motion is reduced so captures are settled.
import { chromium, webkit, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , base = 'http://127.0.0.1:4322', out = 'docs/evidence/latest', full] = process.argv;
mkdirSync(out, { recursive: true });
const pages = ['/', '/work/', '/work/evitech/', '/work/i-heart-uni/', '/work/the-lil-project/', '/about/', '/contact/', '/cv/', '/missing-page/'];
const vps = [
  ['1440', chromium, { viewport: { width: 1440, height: 900 } }],
  ['1024', chromium, { viewport: { width: 1024, height: 768 } }],
  ['390', webkit, { ...devices['iPhone 14'] }],
  ['375', webkit, { ...devices['iPhone SE (3rd gen)'] }],
];
const report = [];
for (const [tag, engine, opts] of vps) {
  const b = await engine.launch();
  const ctx = await b.newContext({ ...opts, reducedMotion: 'no-preference' });
  for (const path of pages) {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errs.push(m.text()));
    p.on('response', (r) => r.status() >= 400 && !/missing-page|_vercel\/insights/.test(r.url()) && errs.push(`${r.status()} ${r.url()}`));
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1800);
    const m = await p.evaluate(() => {
      const vw = innerWidth;
      const over = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect();
        if (r.width === 0 || r.right <= vw + 1) return false;
        for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) if (/hidden|clip/.test(getComputedStyle(a).overflowX)) return false;
        return getComputedStyle(e).position !== 'fixed';
      }).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`);
      return { sw: document.documentElement.scrollWidth, vw, over };
    });
    const name = path === '/' ? 'home' : path.replaceAll('/', '_').replace(/^_|_$/g, '');
    // Full-page shots freeze position:fixed layers at the first viewport (a false seam where the field and grain end).
    // For the shot only, stretch the body::before field to the document height.
    if (full) await p.addStyleTag({ content: `body::before { position: absolute !important; top: 0 !important; bottom: auto !important; height: ${await p.evaluate(() => document.documentElement.scrollHeight)}px !important; }` });
    await p.screenshot({ path: `${out}/${name}-${tag}.jpg`, type: 'jpeg', quality: 70, fullPage: !!full });
    report.push({ page: path, vp: tag, overflowX: m.sw > m.vw, over: m.over, errs });
    await p.close();
  }
  await ctx.close();
  await b.close();
}
const bad = report.filter((r) => r.overflowX || r.over.length || r.errs.length);
writeFileSync(`${out}/capture-report.json`, JSON.stringify(report, null, 2));
console.log(bad.length ? `PROBLEMS ${JSON.stringify(bad, null, 1)}` : `clean: ${report.length} captures`);
if (bad.length) process.exitCode = 1;
