// Renders the share images (1200×630) and the JSON-LD portrait.
//   public/og/home.png, public/og/<case slug>.png, public/og/musa-portrait.jpg
// The graded portrait is placed whole (resized, never cropped or tinted). Text is rendered by Playwright's
// Chromium from the self-hosted fonts and composited over it with sharp. Every string comes from src/data/site.ts.
// Usage: npm run og
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { site, cases, growthWork } from '../src/data/site.ts';

const W = 1200, H = 630, BG = '#121110';
const font = (file) => readFileSync(`public/fonts/${file}`).toString('base64');
const faces = `
@font-face{font-family:'Host Grotesk';src:url(data:font/woff2;base64,${font('host-grotesk.woff2')}) format('woff2');font-weight:300 800}
@font-face{font-family:'Geist';src:url(data:font/woff2;base64,${font('geist.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url(data:font/woff2;base64,${font('geist-mono.woff2')}) format('woff2');font-weight:100 900}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const css = `${faces}
html,body{margin:0;background:transparent}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;color:#f3f1ec;font-family:'Geist',sans-serif}
.col{position:absolute;left:64px;top:56px;bottom:56px;width:540px;display:flex;flex-direction:column}
.label{font:500 17px/1 'Geist Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#d8c69e}
.name{font:560 92px/.92 'Host Grotesk',sans-serif;letter-spacing:-.04em;color:#e7e2d7;margin:0}
.role{font:500 30px/1.15 'Geist',sans-serif;color:#f3f1ec;margin:28px 0 0}
.line{font:400 24px/1.3 'Geist',sans-serif;color:#a3a19b;margin:20px 0 0;max-width:460px}
.fig{font:560 176px/.82 'Host Grotesk',sans-serif;letter-spacing:-.05em;color:#f3f1ec;margin:34px 0 0}
.figl{font:500 30px/1.15 'Geist',sans-serif;color:#f3f1ec;margin:20px 0 0;max-width:540px}
.second{font:400 24px/1.3 'Geist',sans-serif;color:#a3a19b;margin:14px 0 0}
.scope{font:500 15px/1.35 'Geist Mono',monospace;letter-spacing:.04em;text-transform:uppercase;color:#d8c69e;margin:22px 0 0;max-width:480px}
.foot{margin-top:auto;font:500 20px/1.3 'Geist',sans-serif;color:#a3a19b}
.foot b{font-weight:560;color:#e7e2d7}
.small{font:400 17px/1.35 'Geist',sans-serif;color:#827f7a;margin:10px 0 0;max-width:500px}`;

function homeBody() {
  return `<div class="col"><div class="label">${esc(site.city)}</div>
  <p class="name" style="margin-top:22px">${site.name.split(' ').map(esc).join('<br>')}</p>
  <p class="role">${esc(site.role)}</p>
  <p class="line">${esc(site.line)}</p></div>`;
}

function caseBody(c) {
  const g = growthWork.filter((x) => x.case === c.slug && x.note).map((x) => x.note);
  const scopeLabel = c.results.find((r) => r.v === c.card.v)?.scope;
  const notes = [scopeLabel, ...g].filter(Boolean);
  const second = c.slug === 'evitech' ? `${c.results[1].v} ${c.results[1].l}` : '';
  const extra = c.slug === 'evitech' ? 'Paid media of roughly $15K to $30K a month' : '';
  return `<div class="col"><div class="label">${esc(c.org)}</div>
  <p class="fig">${esc(c.card.v)}</p>
  <p class="figl">${esc(c.card.l.replace(/\s*\(organisation total\)$/, ''))}</p>
  ${second ? `<p class="second">and ${esc(second)}</p>` : ''}
  ${notes.map((n) => `<p class="scope">${esc(n.replace(/\.$/, ''))}</p>`).join('')}
  ${extra ? `<p class="small">${esc(extra)}</p>` : ''}
  <p class="foot"><b>${esc(site.name)}</b>, ${esc(site.role)}</p></div>`;
}

mkdirSync('public/og', { recursive: true });
const portrait = sharp('src/assets/portrait/musa-portrait-graded.webp');

// The whole portrait, square, flush right: nothing is cropped.
const portraitLayer = await portrait.clone().resize(H, H).png().toBuffer();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
async function textLayer(body) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page.screenshot({ type: 'png', omitBackground: true });
}
async function render(file, body) {
  const text = await textLayer(body);
  await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite([{ input: portraitLayer, left: W - H, top: 0 }, { input: text, left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(`public/og/${file}`);
  console.log(`wrote public/og/${file}`);
}

await render('home.png', homeBody());
for (const c of cases) await render(`${c.slug}.png`, caseBody(c));
await browser.close();

// JSON-LD image: the whole portrait on the page background.
await portrait.clone().resize(1200, 1200).flatten({ background: BG }).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og/musa-portrait.jpg');
console.log('wrote public/og/musa-portrait.jpg');
