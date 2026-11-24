// Scripted iOS Simulator gate (head of engineering finding 2). Usage: node scripts/qa/ios.mjs <port> <outdir>
// Drives xcrun simctl on the iPhone 17 simulator; loads http://127.0.0.1:<port>/ (IPv4 only), waits for paint by
// sampling screenshot brightness, captures rest, docked and back (same-document #top). Fails on a white page, a scrolled
// rest capture, a missing masthead, no dock pill when docked, or captures that did not change between states.
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

boot();
try { sh('launch', UDID, 'com.apple.mobilesafari'); } catch { /* ok */ }
await openUrl('about:blank').catch(() => {});
await sleep(1500);
const url = (extra = '') => `${base}?v=${Date.now()}${extra}#top`;
const topUrl = url();
await openUrl(topUrl);
const rest = `${out}/iphone17-rest.png`;
results.paintMean = await waitPaint(rest, 2500);
const meta = await sharp(rest).metadata();
const W = meta.width, H = meta.height;
results.size = [W, H];
await assertRest('rest', rest);

// Docked: a fresh cache-busted load that anchors to #path-h (below the hero).
const dq = `${base}?d=${Date.now()}`;
await openUrl(dq + '#path-h');
await sleep(1500);
const docked = `${out}/iphone17-docked.png`;
await waitPaint(docked, 2500);
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
await waitPaint(back, 3000);
await assertRest('back', back);

// The three captures must differ from each other (a frozen or repeated screenshot cannot pass).
const sig = { rest: await fileHash(rest), docked: await fileHash(docked), back: await fileHash(back) };
const mean = { rest: (await stats(rest, [0, 0, 1, 1])).mean, docked: (await stats(docked, [0, 0, 1, 1])).mean };
check('rest and docked captures differ', sig.rest !== sig.docked && Math.abs(mean.rest - mean.docked) > 1, { restMean: +mean.rest.toFixed(1), dockedMean: +mean.docked.toFixed(1) });
check('docked and back captures differ', sig.docked !== sig.back, {});

results.pass = results.checks.every((c) => c.ok);
writeFileSync(`${out}/ios-summary.json`, JSON.stringify(results, null, 2));
console.log(results.pass ? 'iOS GATE PASS' : 'iOS GATE FAIL');
process.exit(results.pass ? 0 : 1);
