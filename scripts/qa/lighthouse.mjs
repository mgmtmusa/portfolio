// Median-of-N Lighthouse runs against a local production build.
// Usage: node scripts/qa/lighthouse.mjs <url> <outRoot> [runs=5] [preset=mobile|desktop]
//
// - Every invocation writes to a fresh, timestamped folder under <outRoot>; it never reads an old report.
// - Any failed run stops the script with Lighthouse's own stderr (no silent catch).
// - JavaScript is reported twice: requested before the `load` event, and requested after it (lazy).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const LIGHTHOUSE = 'lighthouse@12.8.2';
const [, , url, outRoot, n = '5', preset = 'mobile'] = process.argv;
if (!url || !outRoot) throw new Error('usage: node scripts/qa/lighthouse.mjs <url> <outRoot> [runs=5] [preset=mobile|desktop]');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = `${outRoot}/${stamp}-${preset}`;
if (existsSync(out)) throw new Error(`output folder already exists: ${out}`);
mkdirSync(out, { recursive: true });

const kb = (b) => +(b / 1024).toFixed(1);
const runs = [];
for (let i = 1; i <= +n; i++) {
  const file = `${out}/lh-${preset}-${i}.json`;
  const args = ['--yes', LIGHTHOUSE, url, '--quiet', '--output=json', `--output-path=${file}`, '--chrome-flags=--headless=new'];
  if (preset === 'desktop') args.push('--preset=desktop');
  try {
    execFileSync('npx', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    throw new Error(`Lighthouse run ${i} failed:\n${e.stderr?.toString() ?? e.message}`);
  }
  if (!existsSync(file)) throw new Error(`Lighthouse run ${i} wrote no report at ${file}`);
  const r = JSON.parse(readFileSync(file, 'utf8'));
  if (r.runtimeError) throw new Error(`Lighthouse run ${i} runtime error: ${r.runtimeError.code} ${r.runtimeError.message}`);
  const a = r.audits;

  // JS before vs after load. Request times and observedLoad share the navigation's timeline.
  const reqs = a['network-requests']?.details?.items ?? [];
  const m = a.metrics?.details?.items?.[0] ?? {};
  const loadAt = (m.observedLoad ?? Infinity) - (m.observedNavigationStart ?? 0);
  const t0 = Math.min(...reqs.map((q) => q.networkRequestTime ?? Infinity));
  const scripts = reqs.filter((q) => q.resourceType === 'Script');
  const before = scripts.filter((q) => (q.networkRequestTime ?? 0) - t0 < loadAt);
  const after = scripts.filter((q) => (q.networkRequestTime ?? 0) - t0 >= loadAt);

  const shot = a['final-screenshot']?.details?.data;
  if (shot) writeFileSync(`${out}/final-${preset}-${i}.jpg`, Buffer.from(shot.split(',')[1], 'base64'));

  runs.push({
    perf: Math.round(r.categories.performance.score * 100),
    a11y: Math.round(r.categories.accessibility.score * 100),
    bp: Math.round(r.categories['best-practices'].score * 100),
    seo: Math.round(r.categories.seo.score * 100),
    lcp: Math.round(a['largest-contentful-paint'].numericValue),
    cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
    tbt: Math.round(a['total-blocking-time'].numericValue),
    fcp: Math.round(a['first-contentful-paint'].numericValue),
    jsBeforeLoadKB: kb(before.reduce((s, q) => s + (q.transferSize ?? 0), 0)),
    jsLazyKB: kb(after.reduce((s, q) => s + (q.transferSize ?? 0), 0)),
    totalKB: kb(reqs.reduce((s, q) => s + (q.transferSize ?? 0), 0)),
    failed: Object.values(a).filter((x) => x.score !== null && x.score < 1 && ['binary', 'numeric'].includes(x.scoreDisplayMode) && x.details?.type !== 'opportunity').map((x) => x.id).slice(0, 12),
  });
  console.error(`run ${i}/${n}: perf ${runs.at(-1).perf}, lcp ${runs.at(-1).lcp}ms, tbt ${runs.at(-1).tbt}ms`);
}
const med = (k) => { const v = runs.map((r) => r[k]).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
const keys = Object.keys(runs[0]).filter((k) => typeof runs[0][k] === 'number');
const median = Object.fromEntries(keys.map((k) => [k, med(k)]));
writeFileSync(`${out}/lh-${preset}-summary.json`, JSON.stringify({ url, preset, lighthouse: LIGHTHOUSE, runs, median }, null, 2));
console.log(JSON.stringify({ out, preset, median }));
