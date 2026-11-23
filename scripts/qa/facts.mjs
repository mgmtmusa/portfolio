// Facts gate: every number-like token in the built HTML must exist in src/data/site.ts.
// Usage: node scripts/qa/facts.mjs [distDir=dist]
// Single digits (footnote markers, counters such as "1 / 3") and the 404 code are allowed.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const source = readFileSync('src/data/site.ts', 'utf8');
const allowed = new Set(['404', '00:00:00', '1200', '630']);
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(dist);

const problems = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/g, ' ');
  for (const raw of text.match(/\$?\d[\d,.]*(?:%|×|K|M\+?|\+)?/g) ?? []) {
    const t = raw.replace(/[.,]$/, '');
    if (t.length === 1 || allowed.has(t)) continue;
    if (!source.includes(t)) problems.push(`${f}: ${t}`);
  }
}
console.log(problems.length ? `UNTRACED FIGURES\n${[...new Set(problems)].join('\n')}` : `facts clean across ${files.length} pages`);
if (problems.length) process.exitCode = 1;
