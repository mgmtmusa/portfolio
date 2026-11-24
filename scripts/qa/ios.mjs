// Scripted iOS Simulator gate (head of engineering finding 2). Usage: node scripts/qa/ios.mjs <port> <outdir>
// Drives xcrun simctl on the iPhone 17 simulator; loads http://127.0.0.1:<port>/ (IPv4 only), waits for paint by
// sampling screenshot brightness and for the strip clock's digits, then captures at least 1600ms later: rest,
// scrolled 45px (dev server only: ?qa-y=45), docked and back (same-document #top). Fails on a white page, a scrolled
// rest capture, a missing masthead, no dock pill when docked, captures that did not change between states, or a
// missing slab: the rest capture is diffed against the same page under Increase Contrast (prefers-contrast: more,
// where the slab is display: none), and the difference must be a slab-sized rectangle with its lit top rim.
// Mid-drag is not captured (cannot be driven from simctl).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [, , port = '4341', out = 'docs/evidence/round-2/ios'] = process.argv;
const DEVICE_NAME = 'iPhone 17';
let UDID = '';
const base = `http://127.0.0.1:${port}/`;
mkdirSync(out, { recursive: true });
const sh = (...a) => execFileSync('xcrun', ['simctl', ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function boot() {
  const list = JSON.parse(sh('list', 'devices', '-j')).devices;
  const all = Object.values(list).flat().filter((d) => d.name === DEVICE_NAME && d.isAvailable !== false);
  const dev = all.find((d) => d.state === 'Booted') ?? all[0];
  if (!dev) throw new Error('simulator named ' + DEVICE_NAME + ' not found');
  UDID = dev.udid;
  if (dev.state !== 'Booted') { try { sh('boot', UDID); } catch { /* already booting */ } }
  sh('bootstatus', UDID, '-b');
}
async function openUrl(url) {
  for (let i = 0; i < 30; i++) {
    try { sh('openurl', UDID, url); return; } catch { await sleep(1000); }
  }
  throw new Error('openurl never accepted: ' + url);
}
const shot = async (file) => { sh('io', UDID, 'screenshot', '--type=png', file); return sharp(file); };

async function stats(file, rect) {
  const img = sharp(file);
  const { width, height } = await img.metadata();
  const r = { left: Math.round(rect[0] * width), top: Math.round(rect[1] * height), width: Math.round(rect[2] * width), height: Math.round(rect[3] * height) };
  const { data, info } = await sharp(file).extract(r).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let sum = 0, sum2 = 0;
  for (let i = 0; i < data.length; i += 3) { const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; sum += l; sum2 += l * l; }
  const mean = sum / n;
  return { mean, std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)) };
}
// Fraction of pixels in a region that differ from `bg` (rgb) by more than `tol` on any channel.
async function diffShare(file, rect, bg, tol = 10) {
  const { width, height } = await sharp(file).metadata();
  const r = { left: Math.round(rect[0] * width), top: Math.round(rect[1] * height), width: Math.round(rect[2] * width), height: Math.round(rect[3] * height) };
  const { data } = await sharp(file).extract(r).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let k = 0, n = data.length / 3;
  for (let i = 0; i < data.length; i += 3) if (Math.abs(data[i] - bg[0]) > tol || Math.abs(data[i + 1] - bg[1]) > tol || Math.abs(data[i + 2] - bg[2]) > tol) k++;
  return k / n;
}
async function pixel(file, x, y) {
  const { data } = await sharp(file).extract({ left: x, top: y, width: 1, height: 1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return [data[0], data[1], data[2]];
}

// The strip clock's digits (Melbourne hh:mm:ss) appear once chrome.ts has run: a proxy for "scripts are live".
async function waitClock(file) {
  for (let i = 0; i < 20; i++) {
    sh('io', UDID, 'screenshot', '--type=png', file);
    const b = await brightShare(file, [0.23, 0.078, 0.16, 0.02], 110);
    if (b > 0.04) return b;
    await sleep(500);
  }
  return 0;
}
const MIN_AFTER_PAINT = 1600;
async function capture(file, settleMs) {
  await waitPaint(file);
  const t0 = Date.now();
  const clock = await waitClock(file);
  await sleep(Math.max(0, Math.max(MIN_AFTER_PAINT, settleMs) - (Date.now() - t0)));
  sh('io', UDID, 'screenshot', '--type=png', file);
  return { clock: +clock.toFixed(3), msAfterPaint: Date.now() - t0 };
}

async function waitPaint(file, settleMs = 0) {
  for (let i = 0; i < 40; i++) {
    await sleep(750);
    sh('io', UDID, 'screenshot', '--type=png', file);
    const s = await stats(file, [0.25, 0.25, 0.5, 0.5]);
    if (s.mean >= 8 && s.mean <= 120) {
      if (!settleMs) return s.mean;
      await sleep(settleMs); // let hero.ts build the bend, then re-capture and re-check
      sh('io', UDID, 'screenshot', '--type=png', file);
      const t = await stats(file, [0.25, 0.25, 0.5, 0.5]);
      if (t.mean >= 8 && t.mean <= 120) return t.mean;
    }
  }
  throw new Error('page never painted (centre mean outside 8..120)');
}


const results = { checks: [] };
const check = (name, ok, detail) => { results.checks.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${JSON.stringify(detail)}`); };

// Fraction of "bright" pixels (luminance above `min`) in a region.
async function brightShare(file, rect, min = 150) {
  const { width, height } = await sharp(file).metadata();
  const r = { left: Math.round(rect[0] * width), top: Math.round(rect[1] * height), width: Math.round(rect[2] * width), height: Math.round(rect[3] * height) };
  const { data } = await sharp(file).extract(r).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let k = 0;
  for (let i = 0; i < data.length; i += 3) if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] > min) k++;
  return k / (data.length / 3);
}
const fileHash = async (f) => (await sharp(f).raw().toBuffer()).toString('base64').length + ':' + (await sharp(f).stats()).channels.map((c) => c.mean.toFixed(2)).join(',');

// Rest-state assertions, shared by "rest" and "back": the page is at the top, dark, with the masthead, portrait and slab where they belong.
async function assertRest(name, file) {
  const full = await stats(file, [0, 0, 1, 1]);
  check(`${name}: dark page, not a white or blank load`, full.mean < 120 && full.std > 12, { mean: +full.mean.toFixed(1), std: +full.std.toFixed(1) });
  // At the top: the role line is a bright text band above the portrait.
  const role = await brightShare(file, [0.06, 0.12, 0.88, 0.12], 150);
  check(`${name}: role line band at the top (page not scrolled)`, role > 0.01, { brightShare: +role.toFixed(3) });
  const face = await stats(file, [0.2, 0.26, 0.6, 0.18]);
  check(`${name}: portrait has detail`, face.std > 20, { std: +face.std.toFixed(1) });
  // Masthead rows (phone: three rows, about y 0.54 to 0.77) outside the slab (x 0.07 to 0.60, y 0.575 to 0.73):
  // glyphs above it ("Musa"), below it ("Walid") and to its right ("lah" of "Abdullah"). Any one missing is the original iOS bug.
  for (const [where, rect] of [['above', [0.04, 0.545, 0.5, 0.03]], ['below', [0.04, 0.737, 0.5, 0.03]], ['right of', [0.62, 0.61, 0.16, 0.07]]]) {
    const g = await brightShare(file, rect, 150);
    check(`${name}: masthead glyphs ${where} the slab`, g > 0.02, { brightShare: +g.toFixed(3) });
  }
  const bg = await pixel(file, Math.round(W * 0.03), Math.round(H * 0.3));
  const under = await diffShare(file, [0.14, 0.50, 0.72, 0.13], bg, 14);
  check(`${name}: glyph pixels under the slab`, under > 0.03, { diffShare: +under.toFixed(3) });
}

// The slab itself: diff the capture against the same page with no slab (Increase Contrast). The strong differences
// in the masthead band must form a slab-sized box (210 x 130 phone units, 3 device px per CSS px), and along the box's
// top edge, wherever the page behind is dark, the lit rim must show.
async function assertSlab(name, file, noSlab) {
  const band = { top: Math.round(H * 0.42), bottom: Math.round(H * 0.82) };
  const read = async (f) => (await sharp(f).extract({ left: 0, top: band.top, width: W, height: band.bottom - band.top }).removeAlpha().raw().toBuffer());
  const [A, B] = [await read(file), await read(noSlab)];
  const h = band.bottom - band.top, at = (x, y) => (y * W + x) * 3;
  const d = (x, y) => { const i = at(x, y); return Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); };
  // Rows and columns where at least 12% of the expected extent differs strongly: the box's span.
  const dpr = 3, p = W / dpr / 390, expW = 210 * p * dpr, expH = 130 * p * dpr;
  const rowHits = new Array(h).fill(0), colHits = new Array(W).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) if (d(x, y) > 24) { rowHits[y]++; colHits[x]++; }
  const rows = rowHits.map((n, y) => (n > expW * 0.12 ? y : -1)).filter((y) => y >= 0);
  const cols = colHits.map((n, x) => (n > expH * 0.12 ? x : -1)).filter((x) => x >= 0);
  const box = rows.length && cols.length ? { x0: cols[0], x1: cols[cols.length - 1], y0: rows[0], y1: rows[rows.length - 1] } : null;
  const bw = box ? box.x1 - box.x0 : 0, bh = box ? box.y1 - box.y0 : 0;
  check(`${name}: slab present (diff box ${Math.round(bw)} x ${Math.round(bh)} vs ${Math.round(expW)} x ${Math.round(expH)} device px)`, !!box && bw > expW * 0.8 && bw < expW * 1.4 && bh > expH * 0.7 && bh < expH * 1.5, { box: box && { ...box, y0: box.y0 + band.top, y1: box.y1 + band.top } });
  if (!box) { check(`${name}: slab top rim lit`, false, { reason: 'no slab' }); return; }
  // Top rim: in the first 9 rows of the box, columns (inside the corners) whose no-slab pixel is dark background.
  const r = 32 * dpr, lum = (i, buf) => 0.299 * buf[i] + 0.587 * buf[i + 1] + 0.114 * buf[i + 2];
  let dark = 0, lit = 0;
  for (let x = box.x0 + r; x < box.x1 - r; x++) {
    let isDark = true, hit = false;
    for (let y = box.y0; y < Math.min(h, box.y0 + 9); y++) { if (lum(at(x, y), B) > 60) isDark = false; if (lum(at(x, y), A) - lum(at(x, y), B) > 8) hit = true; }
    if (isDark) { dark++; if (hit) lit++; }
  }
  check(`${name}: slab top rim lit`, dark > 20 && lit / dark > 0.6, { darkColumns: dark, litShare: dark ? +(lit / dark).toFixed(3) : 0 });
}

boot();
const contrastWas = (() => { try { return sh('ui', UDID, 'increase_contrast').trim(); } catch { return 'unsupported'; } })();
const setContrast = (v) => { try { sh('ui', UDID, 'increase_contrast', v); } catch { /* unsupported */ } };
setContrast('disabled');
try { sh('launch', UDID, 'com.apple.mobilesafari'); } catch { /* ok */ }
await openUrl('about:blank').catch(() => {});
await sleep(1500);
const url = (extra = '') => `${base}?v=${Date.now()}${extra}#top`;
const topUrl = url();
await openUrl(topUrl);
const rest = `${out}/iphone17-rest.png`;
results.rest = await capture(rest, 2500);
const meta = await sharp(rest).metadata();
const W = meta.width, H = meta.height;
results.size = [W, H];
await assertRest('rest', rest);

// Scrolled 45px, the name part-way through the slab (hero.ts honours ?qa-y on the dev server only).
await openUrl(url('&qa-y=45'));
const mid = `${out}/iphone17-scrolled-45.png`;
results.scrolled = await capture(mid, 3000);
const sigMid = await fileHash(mid);
check('scrolled 45: differs from rest (needs the dev server)', sigMid !== (await fileHash(rest)), {});

// Docked: a fresh cache-busted load that anchors to #path-h (below the hero).
const dq = `${base}?d=${Date.now()}`;
await openUrl(dq + '#path-h');
await sleep(1500);
const docked = `${out}/iphone17-docked.png`;
results.docked = await capture(docked, 2500);
{
  const full = await stats(docked, [0, 0, 1, 1]);
  check('docked: dark page, not a white or blank load', full.mean < 120 && full.std > 12, { mean: +full.mean.toFixed(1), std: +full.std.toFixed(1) });
  const pill = await brightShare(docked, [0.1, 0.83, 0.8, 0.03], 120);
  check('docked: dock pill present in the bottom band', pill > 0.03, { brightShare: +pill.toFixed(3) });
}

// Back: same-document navigation to #top (no reload), then the rest checks again (finding 1 on iOS).
await openUrl(dq + '#top'); // same document, only the fragment changes
await sleep(1500);
const back = `${out}/iphone17-back.png`;
results.back = await capture(back, 3000);
await assertRest('back', back);

// Last (Safari picks the setting up lazily, so nothing is captured after it): the same page with no slab
// (Increase Contrast), then back to the normal setting. Rest and back must each differ from it by the slab.
let noSlab = null;
if (contrastWas !== 'unsupported') {
  setContrast('enabled');
  await sleep(800);
  await openUrl(url('&c=1'));
  noSlab = `${out}/iphone17-contrast.png`;
  results.contrast = await capture(noSlab, 2500);
  setContrast('disabled');
  await sleep(800);
}
if (noSlab) { await assertSlab('rest', rest, noSlab); await assertSlab('back', back, noSlab); }
else check('rest: slab present', false, { reason: 'Increase Contrast unsupported on this runtime: cannot diff the slab' });

// The three captures must differ from each other (a frozen or repeated screenshot cannot pass).
const sig = { rest: await fileHash(rest), docked: await fileHash(docked), back: await fileHash(back) };
const mean = { rest: (await stats(rest, [0, 0, 1, 1])).mean, docked: (await stats(docked, [0, 0, 1, 1])).mean };
check('rest and docked captures differ', sig.rest !== sig.docked && Math.abs(mean.rest - mean.docked) > 1, { restMean: +mean.rest.toFixed(1), dockedMean: +mean.docked.toFixed(1) });
check('docked and back captures differ', sig.docked !== sig.back, {});

if (contrastWas === 'enabled') setContrast('enabled');
results.pass = results.checks.every((c) => c.ok);
writeFileSync(`${out}/ios-summary.json`, JSON.stringify(results, null, 2));
console.log(results.pass ? 'iOS GATE PASS' : 'iOS GATE FAIL');
process.exit(results.pass ? 0 : 1);
