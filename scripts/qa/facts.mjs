// Facts gate (docs/plans/v3.md Task 12, amendment F5).
// Fails when the built site shows a number that doesn't trace to src/data/site.ts (whole tokens, so "28" never
// matches "2028"), a scoped figure without its scope label or note, a figure more than twice on one page, an
// abbreviated count such as "13.2K", or a data-fact value that isn't in site.ts.
// Scans visible text and <title>, meta content, alt / aria-label / title / placeholder, JSON-LD, llms*.txt, sitemap*.xml.
// docs/v3/story.md is a secondary source: tokens found only there pass but are listed under INFO.
// Structural numbers allowed, narrowly: footnote marker digits (popovertarget / data-fn buttons, .fn-n, .notes-n,
// aria-label "Note N"); a clock time inside [data-clock] (never "00:00:00"); the year right after "©" (2000 to next
// year); an "n / N" counter where N is the number of cases; a "Weekday D Month" date right after "reply by".
// Other attributes (style, srcset, width, viewBox, href...) and the structural meta keys below are never scanned.
// Usage: node scripts/qa/facts.mjs [--dir <built dir>]   (default: dist). Exit 1 on any failure.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const argv = process.argv.slice(2);
const at = argv.indexOf('--dir');
const DIR = resolve(at >= 0 ? argv[at + 1] : argv.find((a) => !a.startsWith('--')) ?? join(ROOT, 'dist'));
const YEAR = new Date().getFullYear();
if (!existsSync(DIR)) { console.error(`facts gate: no such directory ${DIR}`); process.exit(2); }

const META_SKIP = new Set(['viewport', 'theme-color', 'color-scheme', 'og:image:width', 'og:image:height', 'og:type', 'og:locale', 'twitter:card', 'robots', 'generator', 'referrer', 'format-detection', 'astro-view-transitions-enabled', 'astro-view-transitions-fallback']);
const ATTRS = ['alt', 'aria-label', 'title', 'placeholder', 'aria-description', 'aria-valuetext', 'aria-roledescription', 'label'];

// ── tokens ──────────────────────────────────────────────────────────
const A = String.raw`[$£€]?\d+(?:,\d{3})*(?:\.\d+)?(?:[KMB]\+?|%|×|\+)?`;
const PRE = String.raw`(?<![\w.,$£€])`;
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const WORDS = 'two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundreds?|thousands?|millions?|dozens?';
const COMPOUND = [
  ['range', new RegExp(`${PRE}(${A})\\s*(?:→|->|–|\\bto\\b)\\s*(${A})(?!\\w)`, 'g')],
  ['date', new RegExp(`\\b(?:(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day )?(\\d{1,2}) (${MONTHS})\\b`, 'g')],
  ['time', /\b\d{1,2}:\d{2}(?::\d{2})?\b/g],
  ['counter', /\b(\d{1,2}) \/ (\d{1,2})\b/g],
];
const ATOM = new RegExp(`${PRE}${A}(?!\\w)`, 'g');
const WORD = new RegExp(`\\b(?:${WORDS})\\b`, 'gi');
const blank = (m) => ' '.repeat(m.length);

/** Number-like tokens: ranges (separator normalised to →), day-month dates, times, n / N counters, atoms, number words. */
function tokenize(raw) {
  let text = raw.replace(/\b(?:https?:\/\/|mailto:|www\.)\S+/g, blank).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, blank);
  const out = [];
  for (const [kind, rx] of COMPOUND) {
    text = text.replace(rx, (...g) => {
      const m = g[0], idx = g.find((x) => typeof x === 'number');
      if (kind === 'range') out.push({ tok: `${g[1]} → ${g[2]}`, kind, idx }, { tok: g[1], kind: 'atom', idx }, { tok: g[2], kind: 'atom', idx });
      else if (kind === 'date') out.push({ tok: `${g[1]} ${g[2]}`, kind, idx });
      else if (kind === 'counter') out.push({ tok: m, kind, idx, n: +g[1], d: +g[2] });
      else out.push({ tok: m, kind, idx });
      return blank(m);
    });
  }
  for (const m of text.matchAll(ATOM)) out.push({ tok: m[0], kind: 'atom', idx: m.index });
  for (const m of text.matchAll(WORD)) out.push({ tok: m[0].toLowerCase(), kind: 'word', idx: m.index });
  return out;
}

// ── sources ─────────────────────────────────────────────────────────
function walk(v, path, out) {
  if (typeof v === 'string') out.push([path, v]);
  else if (typeof v === 'number') out.push([path, String(v)]);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k, out);
}
const indexOf = (pairs) => { const m = new Map(); for (const [where, s] of pairs) for (const t of tokenize(s)) if (!m.has(t.tok)) m.set(t.tok, where); return m; };
const js = ts.transpileModule(readFileSync(join(ROOT, 'src/data/site.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const site = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const siteEntries = []; walk(site, '', siteEntries); // values only: comments in site.ts are not facts
const SITE = indexOf(siteEntries.map(([p, s]) => [`site.ts ${p}`, s]));
const STORY = indexOf(readFileSync(join(ROOT, 'docs/v3/story.md'), 'utf8').split('\n').map((l, i) => [`story.md:${i + 1}`, l]));

// Scope requirements: a result's `scope`; a growthWork `note` binds to that item's scoped results, or to all of
// its results when none is scoped. Any accepted string must sit in the same block (or its footnote) as the figure.
const REQ = new Map();
const need = (v, s) => { for (const t of tokenize(v)) if (t.kind === 'atom') (REQ.get(t.tok) ?? REQ.set(t.tok, new Set()).get(t.tok)).add(s); };
for (const c of site.cases) for (const r of c.results) if (r.scope) need(r.v, r.scope);
for (const g of site.growthWork) {
  for (const r of g.results) if (r.scope) need(r.v, r.scope);
  if (g.note) { const scoped = g.results.filter((r) => r.scope); for (const r of scoped.length ? scoped : g.results) need(r.v, g.note); }
}
const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').replace(/\.$/, '').trim();

// ── html ────────────────────────────────────────────────────────────
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', rarr: '→', times: '×', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', middot: '·' };
const decode = (s) => s.replace(/&(?:#(\d+)|#x([\da-f]+)|(\w+));/gi, (m, d, h, n) => (d ? String.fromCodePoint(+d) : h ? String.fromCodePoint(parseInt(h, 16)) : ENT[n] ?? m)).replace(/[  ]/g, ' ');
const strip = (h) => decode(h.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ');
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function removeElements(html, test) {
  const re = /<([a-zA-Z][\w-]*)\b[^>]*>/g; let out = '', i = 0, m;
  while ((m = re.exec(html))) {
    if (!test(m[0])) continue;
    const name = m[1].toLowerCase(); let end = re.lastIndex;
    if (!VOID.has(name) && !m[0].endsWith('/>')) {
      const inner = new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi'); inner.lastIndex = end; let depth = 1, n;
      while (depth && (n = inner.exec(html))) depth += n[1] ? -1 : 1;
      end = n ? inner.lastIndex : html.length;
    }
    out += html.slice(i, m.index) + ' '; i = end; re.lastIndex = end;
  }
  return out + html.slice(i);
}

// ── checks ──────────────────────────────────────────────────────────
const problems = new Map(), storyOnly = new Map();
const fail = (cls, page, tok, where, detail) => { const k = `${cls}|${page}|${tok}|${where}`; const p = problems.get(k); if (p) p.n++; else problems.set(k, { cls, page, tok, where, detail, n: 1 }); };
function lev(a, b) { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const q = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; } } return d[b.length]; }
function closest(tok) { let best = null, bd = Infinity; for (const k of SITE.keys()) { const d = lev(tok, k); if (d < bd) { bd = d; best = k; } } return best ? `closest "${best}" (${SITE.get(best)})` : 'no close match'; }
const ctx = (text, idx) => `"…${text.slice(Math.max(0, idx - 30), idx + 30).trim()}…"`;

function trace(text, page, where) {
  for (const t of tokenize(text)) {
    if (t.kind === 'counter' && t.d === site.cases.length && t.n >= 1 && t.n <= t.d) continue;
    if (t.kind === 'date' && /reply by\s*$/i.test(text.slice(Math.max(0, t.idx - 24), t.idx))) continue;
    if (t.kind === 'atom' && /^\d[\d.,]*[KMB]\+?$/.test(t.tok) && !SITE.has(t.tok)) { fail('format', page, t.tok, where, `${closest(t.tok)} ${ctx(text, t.idx)}`); continue; }
    if (SITE.has(t.tok)) continue;
    if (STORY.has(t.tok)) { storyOnly.set(`${t.tok}|${page}`, `${JSON.stringify(t.tok)}  ${page}  ${where}  (${STORY.get(t.tok)})`); continue; }
    fail('untraced', page, t.tok, where, `${closest(t.tok)} ${ctx(text, t.idx)}`);
  }
}
function scope(unit, page, where, facts) {
  const n = norm(unit);
  for (const t of tokenize(unit)) {
    const acc = t.kind === 'atom' && REQ.get(t.tok);
    if (!acc) continue;
    const ok = [...acc].some((s) => n.includes(norm(s)));
    if (!ok) fail('scope', page, t.tok, where, `needs one of ${[...acc].map((s) => `"${s}"`).join(' / ')} ${ctx(unit, t.idx)}`);
    if (facts && !facts.has(t.tok)) fail('markup', page, t.tok, where, ok ? 'scope present in the block, but no data-fact' : 'no data-fact and no scope');
  }
}
const label = (f) => '/' + relative(DIR, f).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1');
const factsIn = (s) => { const set = new Set(); for (const f of s.matchAll(/\bdata-fact="([^"]*)"/g)) for (const v of decode(f[1]).split(/\s*\|\s*/)) for (const t of tokenize(v)) set.add(t.tok); return set; };

function scanHtml(file) {
  const page = label(file);
  let html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const out = []; walk(JSON.parse(m[1]), '', out); for (const [p, s] of out) { trace(s, page, `json-ld ${p}`); scope(s, page, `json-ld ${p}`); } }
    catch { fail('untraced', page, 'JSON-LD', 'json-ld', 'does not parse'); }
  }
  html = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(button|a|sup)\b([^>]*\b(?:popovertarget|data-fn)\b[^>]*)>\s*\d{1,2}\s*<\/\1>/gi, (m, t, a) => `<${t}${a.replace(/\saria-label="Note \d{1,2}"/, '')}></${t}>`)
    .replace(/<span\b[^>]*\bclass="[^"]*\b(?:fn-n|notes-n)\b[^"]*"[^>]*>\s*\d{1,2}\s*<\/span>/gi, ' ')
    .replace(/(<[^>]*\bdata-clock\b[^>]*>)\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*</g, (m, open, t) => (t === '00:00:00' ? m : `${open}<`));
  trace(strip(html).replace(/©\s*((?:19|20)\d{2})/g, (m, y) => (+y >= 2000 && +y <= YEAR + 1 ? '©' : m)), page, 'text');
  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const tag = m[1].toLowerCase(), a = Object.fromEntries([...m[2].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map((x) => [x[1].toLowerCase(), decode(x[2])]));
    if (tag === 'meta') { const key = a.name ?? a.property; if (a.content && key && !META_SKIP.has(key)) { trace(a.content, page, `meta ${key}`); scope(a.content, page, `meta ${key}`); } continue; }
    for (const k of ATTRS) if (a[k]) trace(a[k], page, `@${k}`);
    if (a['data-fact'] !== undefined) for (const v of a['data-fact'].split(/\s*\|\s*/)) for (const t of tokenize(v)) if (!SITE.has(t.tok)) fail('data-fact', page, t.tok, 'data-fact', closest(t.tok));
  }
  const body = (html.match(/<body[\s\S]*<\/body>/i) ?? [html])[0];
  // Block = text between list item, table row, dl pair (dt) and section-level boundaries; popover notes stay in.
  for (const seg of body.split(/(?=<(?:\/?(?:li|tr|section|article|header|footer|main|dl|ul|ol|table)\b|dt\b))/i)) scope(strip(seg), page, 'text', factsIn(seg));
  const vis = strip(removeElements(body, (t) => /\s(?:popover|inert|hidden)(?=[\s>=\/])|\saria-hidden="true"/i.test(t) || /^<(?:noscript|template)\b/i.test(t)));
  const counts = new Map();
  for (const t of tokenize(vis)) if (t.kind === 'atom' && !/^\d$/.test(t.tok) && !/^(?:19|20)\d{2}$/.test(t.tok)) counts.set(t.tok, (counts.get(t.tok) ?? 0) + 1);
  for (const [k, n] of counts) if (n > 2) fail('repeated', page, k, 'visible text', `${n} times (limit 2)`);
}

const files = [];
(function w(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) w(p); else if (p.endsWith('.html')) files.push(p); } })(DIR);
files.sort().forEach(scanHtml);
const txt = [];
for (const f of readdirSync(DIR).sort()) {
  if (/^llms.*\.txt$/.test(f)) { txt.push(f); readFileSync(join(DIR, f), 'utf8').split('\n').forEach((l, i) => { trace(l, `/${f}`, `line ${i + 1}`); scope(l, `/${f}`, `line ${i + 1}`); }); }
  else if (/^sitemap.*\.xml$/.test(f)) { txt.push(f); trace(strip(readFileSync(join(DIR, f), 'utf8')), `/${f}`, 'text'); }
}

// ── report ──────────────────────────────────────────────────────────
const ORDER = [['untraced', 'Not traceable to site.ts or story.md'], ['format', 'Abbreviated count (F5: one format per number)'], ['scope', 'Scope label or note missing beside a scoped figure'], ['repeated', 'Figure appears more than twice on one page'], ['data-fact', 'data-fact value not in site.ts'], ['markup', 'F5 markup: scoped figure with no data-fact in its block']];
const all = [...problems.values()];
console.log(`facts gate on ${DIR}\n  ${files.length} HTML pages${txt.length ? `, ${txt.join(', ')}` : ' (no llms.txt or sitemap.xml found)'}`);
for (const [cls, title] of ORDER) {
  const rows = all.filter((p) => p.cls === cls);
  if (!rows.length) continue;
  console.log(`\nFAIL ${title} (${rows.length})`);
  for (const p of rows) console.log(`  ${JSON.stringify(p.tok).padEnd(10)} ${p.page.padEnd(24)} ${p.where.padEnd(14)} ${p.detail}${p.n > 1 ? ` (x${p.n})` : ''}`);
}
if (storyOnly.size) { console.log(`\nINFO traced to story.md only (${storyOnly.size})`); for (const s of storyOnly.values()) console.log(`  ${s}`); }
console.log(`\nfacts gate: ${all.length ? `FAIL, ${all.length} problem(s)` : 'PASS'}`);
if (all.length) process.exitCode = 1;
