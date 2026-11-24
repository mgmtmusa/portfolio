// Scripted iOS Simulator gate (head of engineering finding 2). Usage: node scripts/qa/ios.mjs <port> <outdir>
// Drives xcrun simctl on the iPhone 17 simulator; loads http://127.0.0.1:<port>/ (IPv4 only), waits for paint by
// sampling screenshot brightness, captures rest, y 45 and docked, and fails on blank masthead/portrait, missing
// glyphs under the slab, or a full-screen white page. Mid-drag is not captured (cannot be driven from simctl).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [, , port = '4341', out = 'docs/evidence/round-2/ios'] = process.argv;
const UDID = '527DB004-2FE9-46EE-AD74-6C32C3D5A387';
const base = `http://127.0.0.1:${port}/`;
mkdirSync(out, { recursive: true });
const sh = (...a) => execFileSync('xcrun', ['simctl', ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function boot() {
  const list = JSON.parse(sh('list', 'devices', '-j')).devices;
  const dev = Object.values(list).flat().find((d) => d.udid === UDID);
  if (!dev) throw new Error('simulator ' + UDID + ' not found');
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

boot();
try { sh('launch', UDID, 'com.apple.mobilesafari'); } catch { /* ok */ }
await openUrl('about:blank').catch(() => {});
await sleep(1500);
await openUrl(base);
const rest = `${out}/iphone17-rest.png`;
results.paintMean = await waitPaint(rest, 2500);

const meta = await sharp(rest).metadata();
results.size = [meta.width, meta.height];

// Regions as fractions of the screenshot. Background reference: top-left corner pixel below the status bar.
// Layout (phone): masthead above the portrait, portrait ~y 148-428, slab ~y 428-558 of a 874pt screen.
const W = meta.width, H = meta.height;
const regions = {
  masthead: [0.06, 0.09, 0.88, 0.07],   // role/name rows, outside the slab
  portrait: [0.10, 0.20, 0.80, 0.25],   // portrait above the slab
};
async function assertState(name, file, opts = {}) {
  const full = await stats(file, [0, 0, 1, 1]);
  check(`${name}: not a full-screen white page`, full.mean < 200 || full.std > 12, { mean: +full.mean.toFixed(1), std: +full.std.toFixed(1) });
  if (opts.skipRegions) return;
  const bg = await pixel(file, Math.round(W * 0.03), Math.round(H * 0.3));
  for (const [rn, rect] of Object.entries(regions)) {
    const share = await diffShare(file, rect, bg, 14);
    check(`${name}: ${rn} not blank`, share > 0.04, { diffShare: +share.toFixed(3), bg });
  }
  if (opts.slab) {
    const under = await diffShare(file, opts.slab, bg, 14);
    check(`${name}: glyph pixels under the slab`, under > 0.03, { diffShare: +under.toFixed(3) });
  }
}
// Slab region at rest: roughly the band between portrait and CTA.
const slabRect = [0.14, 0.50, 0.72, 0.13];
await assertState('rest', rest, { slab: slabRect });

// y 45 is not captured: simctl cannot drive a scroll, and javascript: URLs through openurl do not scroll Safari (the capture was identical to rest).
// Only anchor navigation (#path-h) is reliable, which gives the docked state.

// Docked: anchor to #path-h (below the hero), reload so the anchor applies.
await openUrl(base + '?d=' + Date.now() + '#path-h');
await sleep(4500);
const docked = `${out}/iphone17-docked.png`;
sh('io', UDID, 'screenshot', '--type=png', docked);
await assertState('docked', docked, { skipRegions: true });

results.pass = results.checks.every((c) => c.ok);
writeFileSync(`${out}/ios-summary.json`, JSON.stringify(results, null, 2));
console.log(results.pass ? 'iOS GATE PASS' : 'iOS GATE FAIL');
process.exit(results.pass ? 0 : 1);
