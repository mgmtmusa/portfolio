// Median-of-N mobile Lighthouse runs. Usage: node scripts/qa/lighthouse.mjs <url> <outdir> [runs=3] [preset=mobile|desktop]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const [,, url, out, n = '3', preset = 'mobile'] = process.argv;
mkdirSync(out, { recursive: true });
const runs = [];
for (let i = 1; i <= +n; i++) {
  const file = `${out}/lh-${preset}-${i}.json`;
  const args = ['--yes', 'lighthouse@12', url, '--quiet', '--output=json', `--output-path=${file}`, '--chrome-flags=--headless=new'];
  if (preset === 'desktop') args.push('--preset=desktop');
  try { execFileSync('npx', args, { stdio: 'ignore' }); } catch {}
  const r = JSON.parse(readFileSync(file, 'utf8'));
  const a = r.audits;
  const bytes = (t) => (a['resource-summary']?.details?.items || []).find((x) => x.resourceType === t)?.transferSize ?? 0;
  runs.push({
    perf: Math.round(r.categories.performance.score * 100),
    a11y: Math.round(r.categories.accessibility.score * 100),
    bp: Math.round(r.categories['best-practices'].score * 100),
    seo: Math.round(r.categories.seo.score * 100),
    lcp: Math.round(a['largest-contentful-paint'].numericValue),
    cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
    tbt: Math.round(a['total-blocking-time'].numericValue),
    fcp: Math.round(a['first-contentful-paint'].numericValue),
    jsKB: +(bytes('script') / 1024).toFixed(1),
    fontKB: +(bytes('font') / 1024).toFixed(1),
    imgKB: +(bytes('image') / 1024).toFixed(1),
    totalKB: +(bytes('total') / 1024).toFixed(1),
  });
}
const med = (k) => { const v = runs.map((r) => r[k]).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
const median = Object.fromEntries(Object.keys(runs[0]).map((k) => [k, med(k)]));
writeFileSync(`${out}/lh-${preset}-summary.json`, JSON.stringify({ url, preset, runs, median }, null, 2));
console.log(JSON.stringify({ preset, median, runs: runs.map((r) => `${r.perf}/${r.lcp}ms/${r.tbt}ms`) }));
