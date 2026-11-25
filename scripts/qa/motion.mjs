// Record frame sequences of key motion. Usage: node scripts/qa/motion.mjs <baseUrl> <outdir>
// Contexts: chromium 1440x900, webkit iPhone 14. Modes: normal, reduced. Frames via timed screenshots
// (ms in the name is the real elapsed time at capture), downscaled 50% with ffmpeg when available.
import { chromium, webkit, devices } from '@playwright/test';
import { mkdirSync, writeFileSync, readdirSync, renameSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [, , base = 'http://127.0.0.1:4322', out = 'docs/evidence/round-4/motion', onlyArg] = process.argv;
// Optional 3rd arg: comma list of sequences to run (load,scroll,drag,pathlight,vt,cmdk,handoff,release). No arg = the original run only.
const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim()).filter(Boolean)) : null;
const want = (n) => !only || only.has(n);
const OLD = ["load", "scroll", "drag", "pathlight", "vt", "cmdk"];
mkdirSync(out, { recursive: true });
const MAX = 25; // default frame cap; sequences may raise it with { max }
const e0 = {}, e1 = {};
const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const t00 = Date.now();
const index = { base, generated: new Date().toISOString(), ffmpeg: hasFfmpeg, sequences: [] };
const pad = (n) => String(n).padStart(5, '0');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run `action` while grabbing frames until it ends and `tail` ms passed, or MAX frames.
async function record(page, ctx, mode, seq, action, { duration = 2500, interval = 100, max = MAX, settled = 0 } = {}) {
  const prefix = `${ctx}-${mode}-${seq}`;
  const frames = []; const notes = [];
  const t0 = Date.now();
  let done = false;
  const act = Promise.resolve().then(action).then((r) => { done = true; return r; }).catch((e) => { done = true; notes.push('action error: ' + e.message.split('\n')[0]); });
  while (frames.length < max && Date.now() - t0 < duration) {
    const ts = Date.now() - t0;
    const file = `${prefix}-${pad(ts)}.png`;
    try { await page.screenshot({ path: `${out}/${file}`, animations: 'allow', caret: 'initial', timeout: 3000 }); frames.push({ ms: ts, file }); } catch (e) { if (!notes.some((n) => n.startsWith('shot error'))) notes.push('shot error (before first paint, frames skipped): ' + e.message.split('\n')[0]); await sleep(40); }
    const wait = interval - (Date.now() - t0 - ts);
    if (wait > 0) await sleep(wait);
  }
  await act;
  if (!done) notes.push('action not finished');
  // WebKit screenshots contend with a scripted scroll, so the last timed frame can predate the action's end. A settled
  // frame, taken `settled` ms after the action finished, shows where the motion actually came to rest.
  if (settled) { await sleep(settled); const ts = Date.now() - t0; const file = `${prefix}-${pad(ts)}.png`; await page.screenshot({ path: `${out}/${file}` }).then(() => { frames.push({ ms: ts, file }); notes.push(`settled frame ${file}, ${settled}ms after the action ended at ${ts - settled}ms`); }).catch(() => {}); }
  if (frames.length >= max && Date.now() - t0 < duration) notes.push(`frame cap hit at ${frames[frames.length - 1].ms}ms of ${duration}ms`);
  if (hasFfmpeg && frames.length) {
    for (const f of frames) {
      const p = `${out}/${f.file}`;
      try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', p, '-vf', 'scale=iw/2:ih/2', `${p}.tmp.png`]); renameSync(`${p}.tmp.png`, p); } catch (e) { notes.push('downscale failed ' + f.file); }
    }
    try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', `${out}/${prefix}-*.png`, '-vf', 'scale=320:-1,tile=5x5:padding=4', '-frames:v', '1', `${out}/sheet-${prefix}.png`]); } catch { notes.push('contact sheet failed'); }
  }
  const gaps = frames.slice(1).map((f, i) => f.ms - frames[i].ms);
  if (gaps.length) notes.push(`frame gaps ms: median ${[...gaps].sort((a, b) => a - b)[gaps.length >> 1]}, max ${Math.max(...gaps)}`);
  const entry = { context: ctx, mode, sequence: seq, frameCount: frames.length, frames, sheet: hasFfmpeg ? `sheet-${prefix}.png` : null, notes };
  index.sequences.push(entry);
  return entry;
}
function skip(ctx, mode, seq, why) { index.sequences.push({ context: ctx, mode, sequence: seq, frameCount: 0, frames: [], skipped: why, notes: [why] }); console.log(`  skip ${ctx}-${mode}-${seq}: ${why}`); }

// Chromium only: dense frames from a CDP screencast (every compositor frame, jpeg) while `action` runs plus `tail` ms.
async function cast(page, ctx, mode, seq, action, { tail = 600, onStart } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const frames = []; const notes = []; const t0 = Date.now(); onStart?.(t0);
  cdp.on('Page.screencastFrame', (f) => { const ms = Date.now() - t0; const file = `${ctx}-${mode}-${seq}-${pad(ms)}.jpg`; writeFileSync(`${out}/${file}`, Buffer.from(f.data, 'base64')); frames.push({ ms, file }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
  try { await action(); } catch (e) { notes.push('action error: ' + e.message.split('\n')[0]); }
  await sleep(tail);
  await cdp.send('Page.stopScreencast').catch(() => {});
  const gaps = frames.slice(1).map((f, i) => f.ms - frames[i].ms);
  if (gaps.length) notes.push(`frame gaps ms: median ${[...gaps].sort((a, b) => a - b)[gaps.length >> 1]}, max ${Math.max(...gaps)}`);
  notes.push('CDP screencast: ms is time since screencast start; frames exist only where the compositor produced one');
  const entry = { context: ctx, mode, sequence: seq, frameCount: frames.length, frames, sheet: null, notes };
  index.sequences.push(entry);
  return entry;
}

const contexts = [
  ['chromium', chromium, { viewport: { width: 1440, height: 900 } }, false],
  ['webkit', webkit, { ...devices['iPhone 14'] }, true],
];
for (const [ctx, bt, opts, phone] of (only && !OLD.some(want) ? [] : contexts)) {
  const browser = await bt.launch();
  for (const mode of ['normal', 'reduced']) {
    const context = await browser.newContext({ ...opts, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
    await context.addInitScript(() => { window.__v3test = true; });
    const errs = [];
    const fresh = async () => {
      const page = await context.newPage();
      page.on('pageerror', (e) => errs.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      return page;
    };
    const settle = async (page) => { await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(3200); };
    const wheel = async (page, dy) => {
      if (phone) { const steps = Math.max(8, Math.round(Math.abs(dy) / 12)); for (let i = 0; i < steps; i++) { await page.evaluate((d) => window.scrollBy(0, d), dy / steps); await page.waitForTimeout(30); } return; } await page.mouse.move(opts.viewport?.width ? opts.viewport.width / 2 : 195, 400); await page.mouse.wheel(0, dy); };
    const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));

    // 1 first load
    if (want("load")) { const page = await fresh();
      const nav = page.goto(base + '/', { waitUntil: 'load' }).catch(() => {});
      const e = await record(page, ctx, mode, 'load', async () => { await nav; await page.waitForTimeout(2300); }, { duration: 2800, interval: 100 });
      console.log(ctx, mode, 'load', e.frameCount); await page.close(); }

    // 1b chromium only: CDP screencast started before navigation, so frames before the first paint are kept.
    if (want("load") && ctx === "chromium") { const page = await fresh(); const cdp = await context.newCDPSession(page);
      const frames = []; const t0 = Date.now();
      cdp.on('Page.screencastFrame', async (f) => { const ms = Date.now() - t0; const file = `${ctx}-${mode}-loadcast-${pad(ms)}.jpg`; writeFileSync(`${out}/${file}`, Buffer.from(f.data, 'base64')); frames.push({ ms, file }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
      await page.goto(base + '/', { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(2300);
      await cdp.send('Page.stopScreencast').catch(() => {});
      index.sequences.push({ context: ctx, mode, sequence: 'loadcast', frameCount: frames.length, frames, sheet: null, notes: ['CDP screencast from before navigation; ms is time since screencast start (navigation begins about 0 to 30ms later); frames only exist where the compositor produced one'] });
      console.log(ctx, mode, 'loadcast', frames.length); await page.close(); }

    // 2 scroll to dock and back
    if (want("scroll")) { const page = await fresh(); await settle(page);
      const e = await record(page, ctx, mode, 'scroll', async () => {
        // Phone: scripted scrollBy in ~12px steps (a swipe, slower than the desktop wheel), long enough to reach the dock and return.
        await wheel(page, 45); await page.waitForTimeout(300); await wheel(page, phone ? 420 : 250); await page.waitForTimeout(phone ? 1400 : 900);
        e0.docked = await scrollY(page);
        await wheel(page, phone ? -900 : -700);
        if (phone) { await page.evaluate(() => window.scrollTo(0, 0)); } // make sure the slab's return to rest is reached and filmed
        await page.waitForTimeout(phone ? 2200 : 1200);
        e0.back = await scrollY(page);
      }, { duration: phone ? 12000 : 3400, interval: 140, max: phone ? 85 : MAX, settled: 1500 });
      e.notes.push(`scrollY after return ${e0.back}`);
      e.notes.push(`scrollY at dock ${e0.docked}`);
      console.log(ctx, mode, 'scroll', e.frameCount); await page.close(); }

    // 3 slab drag
    if (want("drag")) { const page = await fresh(); await settle(page);
      const box = await page.locator('[data-slab]').boundingBox().catch(() => null);
      if (!box || box.width < 5) skip(ctx, mode, 'drag', 'slab not visible in this context/mode');
      else {
        const dragAction = async () => {
          const x = box.x + box.width / 2, y = box.y + box.height / 2;
          await page.mouse.move(x, y); await page.mouse.down();
          for (let i = 1; i <= 10; i++) { await page.mouse.move(x + i * 20, y); await page.waitForTimeout(16); }
          await page.waitForTimeout(250); await page.mouse.up(); await page.waitForTimeout(1100);
        };
        // Chromium: every compositor frame from the screencast. WebKit has no screencast: back-to-back screenshots (interval 0), the densest feasible.
        const e = ctx === 'chromium' ? await cast(page, ctx, mode, 'drag', dragAction, { tail: 300 })
          : await record(page, ctx, mode, 'drag', dragAction, { duration: 2100, interval: 0, max: 70 });
        if (phone) e.notes.push('mouse events used on webkit phone (no CDP touch)');
        console.log(ctx, mode, 'drag', e.frameCount);
      }
      await page.close(); }

    // 3b Path key light: all four rungs in one slow scroll, then a fast scroll that skips rungs.
    // The light's computed translate is sampled every animation frame (notes), so the glide is on record even where screenshots are sparse.
    if (want("pathlight")) { const page = await fresh(); await settle(page);
      const has = await page.evaluate(() => !!document.querySelector('.path-light') && document.querySelectorAll('.path .rung').length);
      if (!has) skip(ctx, mode, 'pathlight', 'no .path-light on the page');
      else {
        const sample = () => page.evaluate(() => { window.__lt = []; const l = document.querySelector('.path-light'); const t0 = performance.now(); const tick = () => { window.__lt.push([Math.round(performance.now() - t0), getComputedStyle(l).translate, l.dataset.rung]); window.__ltR = requestAnimationFrame(tick); }; tick(); });
        const collect = async (e, label) => { const s = await page.evaluate(() => { cancelAnimationFrame(window.__ltR); return window.__lt; }); const moves = s.filter((r, i) => i && r[1] !== s[i - 1][1]); e.notes.push(`${label}: ${moves.length} translate changes over ${s.length} rAF samples; first ${moves[0]?.[0] ?? '-'}ms, last ${moves.at(-1)?.[0] ?? '-'}ms; rungs seen ${[...new Set(s.map((r) => r[2]))].join(',')}`); e.lightSamples = s.filter((r, i) => !i || r[1] !== s[i - 1][1]); };
        const toRung = (i, instant = true) => page.evaluate(([n, inst]) => { const r = document.querySelectorAll('.path .rung')[n]; const y = r.getBoundingClientRect().top + scrollY - innerHeight * 0.4 + 6; window.scrollTo({ top: y, behavior: inst ? 'instant' : 'auto' }); }, [i, instant]);
        const slow = async () => { await sample(); for (const i of [0, 1, 2, 3]) { await toRung(i); await sleep(1300); } };
        const fast = async () => { await toRung(0); await sleep(1300); await sample(); await page.evaluate(() => { const rs = document.querySelectorAll('.path .rung'); const a = scrollY, b = rs[3].getBoundingClientRect().top + scrollY - innerHeight * 0.4 + 6; let n = 0; const step = () => { n++; window.scrollTo(0, a + (b - a) * Math.min(1, n / 5)); if (n < 5) requestAnimationFrame(step); }; step(); }); await sleep(1500); };
        if (ctx === 'chromium') {
          const e = await cast(page, ctx, mode, 'pathlight', slow, { tail: 200 }); await collect(e, 'rungs 0-3');
          const e2 = await cast(page, ctx, mode, 'pathlight-fast', fast, { tail: 200 }); await collect(e2, 'fast scroll skipping rungs');
        } else {
          // WebKit: back-to-back screenshots through each 900ms move (frames at or under 100ms where the engine allows; the gaps are in the notes).
          const e = await record(page, ctx, mode, 'pathlight', slow, { duration: 6200, interval: 0, max: 90 }); await collect(e, 'rungs 0-3');
          const e2 = await record(page, ctx, mode, 'pathlight-fast', fast, { duration: 3200, interval: 0, max: 40 }); await collect(e2, 'fast scroll skipping rungs');
        }
        console.log(ctx, mode, 'pathlight');
      }
      await page.close(); }

    // 4 view transition home -> work -> home
    if (want("vt")) { const page = await fresh(); await settle(page);
      const e = await record(page, ctx, mode, 'vt', async () => {
        await page.evaluate(() => [...document.querySelectorAll('a[href="/work/"]')].find((a) => a.offsetParent !== null)?.click() ?? document.querySelector('a[href="/work/"]')?.click());
        await page.waitForURL('**/work/', { timeout: 5000 }); await page.waitForTimeout(1200);
        await page.evaluate(() => [...document.querySelectorAll('a[href="/"]')].find((a) => a.offsetParent !== null)?.click() ?? document.querySelector('a[href="/"]')?.click());
        await page.waitForURL((u) => u.pathname === '/', { timeout: 5000 }); await page.waitForTimeout(1200);
      }, { duration: 4200, interval: 175 });
      console.log(ctx, mode, 'vt', e.frameCount); await page.close(); }

    // 5 command menu
    if (want("cmdk")) { const page = await fresh(); await settle(page);
      const e = await record(page, ctx, mode, 'cmdk', async () => {
        await page.waitForTimeout(150); await page.keyboard.press('Control+K'); await page.waitForTimeout(900);
        e1.open = await page.evaluate(() => document.querySelector('#cmdk')?.open);
        await page.keyboard.press('Escape'); await page.waitForTimeout(700);
        e1.closed = await page.evaluate(() => !document.querySelector('#cmdk')?.open);
      }, { duration: 2000, interval: 80 });
      e.notes.push(`dialog open=${e1.open} closedAfterEscape=${e1.closed}`);
      console.log(ctx, mode, 'cmdk', e.frameCount); await page.close(); }

    if (errs.length) index.sequences.push({ context: ctx, mode, sequence: 'page-errors', frameCount: 0, frames: [], notes: [...new Set(errs)] });
    await context.close();
  }
  await browser.close();
}

// ===== Optional sequences, only when named in the 3rd arg: handoff (webkit video), release (chromium cast + webkit video) =====
const bin = (cmd, args) => execFileSync(cmd, args, { maxBuffer: 1 << 29, stdio: ['ignore', 'pipe', 'ignore'] });
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[a.length >> 1] : null);
const r1 = (n) => Math.round(n * 10) / 10;
const gapsOf = (ts) => ts.slice(1).map((t, i) => r1(t - ts[i]));
const thin = (a, max) => (a.length <= max ? a : Array.from({ length: max }, (_, i) => a[Math.round((i * (a.length - 1)) / (max - 1))]));
let PT = ['-fps_mode', 'passthrough'];
if (only && hasFfmpeg) { try { bin('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'nullsrc=s=16x16:d=0.1', ...PT, '-f', 'null', '-']); } catch { PT = ['-vsync', '0']; } }

// Page-side probe: black 12px marker top-left (flashed white once for video sync) + a rAF sampler of the slab and dock.
// Row: [ms since probe, scrollY, slab opacity, slab transform, dock opacity, slab rect left, top, width, flying 0/1]
const probe = (page) => page.evaluate(() => {
  const slab = document.querySelector('[data-slab]'), dock = document.querySelector('[data-dock]');
  const m = document.createElement('div'); m.style.cssText = 'position:fixed;left:0;top:0;width:12px;height:12px;background:#000;z-index:2147483647;pointer-events:none'; document.body.appendChild(m);
  const p0 = performance.now(); window.__s = []; window.__run = true; window.__p0 = p0;
  addEventListener('pointerup', () => { window.__up = performance.now() - p0; }, true);
  const tick = () => { if (!window.__run) return; const cs = getComputedStyle(slab), b = slab.getBoundingClientRect();
    window.__s.push([Math.round((performance.now() - p0) * 10) / 10, Math.round(scrollY), +(+cs.opacity).toFixed(3), cs.transform, +(+getComputedStyle(dock).opacity).toFixed(3), Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, slab.hasAttribute('data-moving') ? 1 : 0]);
    requestAnimationFrame(tick); };
  tick();
  window.__mark = () => requestAnimationFrame(() => { m.style.background = '#fff'; window.__flash = performance.now() - p0; setTimeout(() => m.remove(), 500); });
  return Date.now(); // epoch ms at p0
});
const collect = (page) => page.evaluate(() => { window.__run = false; return { s: window.__s, flash: window.__flash ?? null, up: window.__up ?? null }; });
const rowsOf = (s) => s.map((r) => ({ ms: r[0], y: r[1], so: r[2], tf: r[3], dop: r[4], l: r[5], t: r[6], w: r[7], fly: r[8] }));
const nearest = (rs, ms) => { let lo = 0, hi = rs.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (rs[mid].ms < ms) lo = mid; else hi = mid; } return Math.abs(rs[lo].ms - ms) <= Math.abs(rs[hi].ms - ms) ? rs[lo] : rs[hi]; };
const isBetween = (r) => r.fly || (r.so > 0.01 && r.so < 0.99) || (r.dop > 0.01 && r.dop < 0.99);
function flightRuns(rs, merge = 300) { const runs = []; let cur = null; for (const r of rs) if (isBetween(r)) { if (cur && r.ms - cur.end <= merge) cur.end = r.ms; else { cur = { start: r.ms, end: r.ms }; runs.push(cur); } } return runs; }

async function filmed(bt, opts, name, fn) {
  const browser = await bt.launch();
  const vdir = `${out}/_video-${name}`; mkdirSync(vdir, { recursive: true });
  const context = await browser.newContext({ ...opts, reducedMotion: 'no-preference', recordVideo: { dir: vdir, size: { ...opts.viewport } } });
  await context.addInitScript(() => { window.__v3test = true; });
  const page = await context.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  let data, err;
  try { data = await fn(page); } catch (e) { err = e; }
  const video = page.video(); await context.close();
  const vpath = await video.path().catch(() => null);
  await browser.close();
  return { data, err, vpath, vdir, errs };
}
// Video facts: per-frame times (native fps, no resampling), the frame where the white marker first appears, and offset = video time minus probe time.
function videoFacts(vpath, flashMs) {
  const times = bin('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', vpath]).toString().split('\n').map(parseFloat).filter(Number.isFinite);
  const raw = bin('ffmpeg', ['-v', 'error', '-i', vpath, '-vf', 'crop=12:12:0:0,format=gray', ...PT, '-f', 'rawvideo', '-']);
  let fi = -1; for (let i = 0; i < raw.length / 144; i++) { let s = 0; for (let k = 0; k < 144; k++) s += raw[i * 144 + k]; if (s / 144 > 200) { fi = i; break; } }
  return { times, rawFrames: raw.length / 144, flashFrame: fi, offset: fi >= 0 && flashMs != null ? times[fi] - flashMs / 1000 : null };
}
function extractFrames(vpath, dir) { rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); bin('ffmpeg', ['-y', '-v', 'error', '-i', vpath, ...PT, '-q:v', '3', `${dir}/%05d.jpg`]); return readdirSync(dir).length; }
function sheet(files, crop, name, { cols = 6, tileW = 220 } = {}) {
  const tmp = `${out}/_sel`; rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const ext = files[0].split('.').pop(); files.forEach((f, i) => copyFileSync(f, `${tmp}/${pad(i + 1)}.${ext}`));
  const vf = `${crop ? `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},` : ''}scale=${tileW}:-1,tile=${cols}x${Math.ceil(files.length / cols)}:padding=3:color=gray`;
  bin('ffmpeg', ['-y', '-v', 'error', '-framerate', '1', '-i', `${tmp}/%05d.${ext}`, '-vf', vf, '-frames:v', '1', `${out}/${name}`]);
  rmSync(tmp, { recursive: true, force: true });
}
const mkCrop = (boxes, pd, W, H) => { const x0 = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.x)) - pd)), y0 = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.y)) - pd)), x1 = Math.min(W, Math.ceil(Math.max(...boxes.map((b) => b.x + b.width)) + pd)), y1 = Math.min(H, Math.ceil(Math.max(...boxes.map((b) => b.y + b.height)) + pd)); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
const phoneScroll = async (page, dy) => { const steps = Math.max(8, Math.round(Math.abs(dy) / 12)); for (let i = 0; i < steps; i++) { await page.evaluate((d) => window.scrollBy(0, d), dy / steps); await page.waitForTimeout(30); } };

async function runHandoff() {
  const ctx = 'webkit', mode = 'normal', seq = 'handoff', notes = [];
  const t = await filmed(webkit, devices['iPhone 14'], seq, async (page) => {
    await page.goto(base + '/', { waitUntil: 'load' });
    await probe(page); await page.waitForTimeout(300); await page.evaluate(() => window.__mark()); await page.waitForTimeout(2900); // settled 3.2s at the top
    const slabBox = await page.locator('[data-slab]').boundingBox();
    await phoneScroll(page, 45); await page.waitForTimeout(300); await phoneScroll(page, 420); await page.waitForTimeout(1400);
    const docked = await page.evaluate(() => ({ y: Math.round(scrollY), dock: (({ x, y, width, height }) => ({ x, y, width, height }))(document.querySelector('[data-dock]').getBoundingClientRect()) }));
    await phoneScroll(page, -900); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(2000);
    return { slabBox, docked, ...(await collect(page)) };
  });
  const entry = { context: ctx, mode, sequence: seq, frameCount: 0, frames: [], sheet: null, notes };
  index.sequences.push(entry);
  if (t.err || !t.vpath) { notes.push('failed: ' + (t.err?.message.split('\n')[0] ?? 'no video')); return; }
  const d = t.data, rs = rowsOf(d.s);
  const dtMed = med(gapsOf(rs.map((r) => r.ms)));
  notes.push(`rAF samples ${rs.length}, median rAF dt ${dtMed}ms, scrollY at dock ${d.docked.y}`);
  writeFileSync(`${out}/${ctx}-${mode}-${seq}-samples.json`, JSON.stringify({ columns: ['ms', 'scrollY', 'slabOpacity', 'slabTransform', 'dockOpacity', 'slabLeft', 'slabTop', 'slabWidth', 'flying'], rows: d.s }));
  const final = `${ctx}-${mode}-${seq}.webm`; renameSync(t.vpath, `${out}/${final}`); rmSync(t.vdir, { recursive: true, force: true });
  entry.video = final;
  if (!hasFfmpeg) { notes.push('no ffmpeg: video kept, frames not extracted'); return; }
  const vf = videoFacts(`${out}/${final}`, d.flash);
  entry.videoFrames = vf.times.length; entry.videoFps = r1((vf.times.length - 1) / (vf.times.at(-1) - vf.times[0]));
  const vg = gapsOf(vf.times.map((x) => x * 1000)); entry.videoFrameGapMs = { median: med(vg), max: Math.max(...vg), over60: vg.filter((g) => g > 60).length };
  notes.push(`video ${vf.times.length} frames at native ${entry.videoFps}fps, gaps median ${entry.videoFrameGapMs.median}ms max ${entry.videoFrameGapMs.max}ms; sync marker frame ${vf.flashFrame}, probe-to-video offset ${vf.offset == null ? 'unknown' : r1(vf.offset * 1000) + 'ms'}`);
  if (vf.offset == null) { notes.push('sync marker not found in video; windows not mapped'); return; }
  const nFiles = extractFrames(`${out}/${final}`, `${out}/_f`);
  if (nFiles !== vf.times.length) notes.push(`WARNING: extracted ${nFiles} frames, ffprobe ${vf.times.length}`);
  const crop = mkCrop([d.slabBox, d.docked.dock], 14, 390, 664);
  entry.cropRect = crop;
  entry.windows = [];
  flightRuns(rs).forEach((run, wi) => {
    const inW = rs.filter((r) => r.ms >= run.start && r.ms <= run.end);
    const endState = rs[Math.min(rs.length - 1, rs.indexOf(inW.at(-1)) + 1)];
    const dir = endState && endState.dop >= 0.99 ? 'to-dock' : 'to-rest';
    const frames = [];
    vf.times.forEach((ft, i) => { const ms = (ft - vf.offset) * 1000; if (ms >= run.start - 80 && ms <= run.end + 80) { const r = nearest(rs, ms); frames.push({ videoMs: Math.round(ft * 1000), probeMs: r1(ms), n: i + 1, slabOpacity: r.so, dockOpacity: r.dop, flying: r.fly, scrollY: r.y, between: !!isBetween(r) }); } });
    const sums = inW.map((r) => r.so + r.dop), steps = inW.slice(1).map((r, i) => Math.hypot(r.l - inW[i].l, r.t - inW[i].t) + Math.abs(r.w - inW[i].w));
    const fg = gapsOf(frames.map((f) => f.videoMs));
    const win = { name: `${wi + 1}-${dir}`, probeStartMs: run.start, probeEndMs: run.end, durationMs: Math.round(run.end - run.start), samples: inW.length, framesBetween: frames.filter((f) => f.between).length, frameGapMs: { median: med(fg), max: fg.length ? Math.max(...fg) : null },
      slabPlusDockOpacity: { max: r1(Math.max(...sums) * 100) / 100, min: r1(Math.min(...sums) * 100) / 100 }, samplesBothOpaque: inW.filter((r) => r.so >= 0.99 && r.dop >= 0.99).length, maxOverlap: Math.max(...inW.map((r) => Math.min(r.so, r.dop))),
      maxStepPerRafPx: r1(Math.max(0, ...steps)), frames };
    entry.windows.push(win);
    const sel = thin(frames, 36);
    if (sel.length) { const nm = `sheet-${ctx}-${mode}-${seq}-${win.name}.png`; try { sheet(sel.map((f) => `${out}/_f/${pad(f.n)}.jpg`.replace('/_f/', '/_f/')), crop, nm, { cols: 6, tileW: 200 }); win.sheet = nm; } catch (e) { notes.push('sheet failed ' + win.name); } }
  });
  // extracted frames are named %05d (1-based); pad() is 5 wide so the paths above match
  rmSync(`${out}/_f`, { recursive: true, force: true });
  entry.frameCount = entry.windows.reduce((n, w) => n + w.frames.length, 0);
  entry.frames = entry.windows.flatMap((w) => w.frames.map((f) => ({ ms: f.videoMs, window: w.name, slab: f.slabOpacity, dock: f.dockOpacity })));
  entry.sheet = entry.windows.map((w) => w.sheet).filter(Boolean);
  console.log(ctx, mode, seq, entry.windows.map((w) => `${w.name}:${w.framesBetween}f/${w.durationMs}ms`).join(' '));
}

// Drag the slab and release while still moving; sample the slab rect every rAF through the settle.
const prepRelease = async (page, flash) => {
  await page.goto(base + '/', { waitUntil: 'load' });
  const date0 = await probe(page); await page.waitForTimeout(300); if (flash) await page.evaluate(() => window.__mark()); await page.waitForTimeout(2900);
  const box = await page.locator('[data-slab]').boundingBox().catch(() => null);
  return { date0, box };
};
const dragRelease = async (page, box) => {
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(x + i * 20, y); if (i < 10) await page.waitForTimeout(16); }
  await page.mouse.up(); // straight after the last move, no pause
  await page.waitForTimeout(1200);
};
function analyzeRelease(rs, up) {
  const pre = rs.filter((r) => r.ms <= up), post = rs.filter((r) => r.ms >= up);
  const startX = pre.at(-1).l, final = rs.at(-1).l, dir = Math.sign(startX - final) || 1;
  const overshoot = Math.max(0, ...post.map((r) => (final - r.l) * dir));
  let settleMs = null; for (let i = post.length - 1; i >= 0; i--) { if (Math.abs(post[i].l - final) > 0.5) { settleMs = post[Math.min(post.length - 1, i + 1)].ms - up; break; } }
  const dxs = post.slice(1).map((r, i) => r.l - post[i].l).filter((v) => Math.abs(v) > 0.05); let rev = 0; for (let i = 1; i < dxs.length; i++) if (Math.sign(dxs[i]) !== Math.sign(dxs[i - 1])) rev++;
  const p3 = pre.at(-4) ?? pre[0], vel = pre.at(-1).ms > p3.ms ? r1(((pre.at(-1).l - p3.l) / (pre.at(-1).ms - p3.ms)) * 1000) : 0;
  return { upMs: r1(up), leftAtRelease: startX, leftFinal: final, travelPx: r1(Math.abs(startX - final)), releaseVelocityPxPerS: vel, overshootPx: r1(overshoot), directionReversals: rev, settleMsAfterRelease: settleMs == null ? 0 : Math.round(settleMs), maxStepPerRafPx: r1(Math.max(0, ...post.slice(1).map((r, i) => Math.abs(r.l - post[i].l)))), trajectory: post.filter((r, i) => i % 1 === 0).slice(0, 45).map((r) => [Math.round(r.ms - up), r.l]) };
}
async function runRelease() {
  const mode = 'normal';
  // chromium: CDP screencast
  { const ctx = 'chromium'; const browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    await context.addInitScript(() => { window.__v3test = true; }); const page = await context.newPage();
    const { date0, box } = await prepRelease(page, false);
    if (!box || box.width < 5) skip(ctx, mode, 'release', 'slab not visible');
    else { let castT0 = 0;
      const e = await cast(page, ctx, mode, 'release', () => dragRelease(page, box), { tail: 300, onStart: (t) => { castT0 = t; } });
      const d = await collect(page), rs = rowsOf(d.s); const a = analyzeRelease(rs, d.up);
      e.release = a; e.notes.push(`rAF samples ${rs.length}; drag released at ${a.upMs}ms moving ${a.releaseVelocityPxPerS}px/s, travel ${a.travelPx}px, settle ${a.settleMsAfterRelease}ms, overshoot ${a.overshootPx}px, reversals ${a.directionReversals}, max step ${a.maxStepPerRafPx}px/rAF`);
      writeFileSync(`${out}/${ctx}-${mode}-release-samples.json`, JSON.stringify({ columns: ['ms', 'scrollY', 'slabOpacity', 'slabTransform', 'dockOpacity', 'slabLeft', 'slabTop', 'slabWidth', 'flying'], rows: d.s }));
      const upCast = date0 + d.up - castT0; const lo = upCast - 120, hi = upCast + a.settleMsAfterRelease + 160;
      e.windowFrames = e.frames.filter((f) => f.ms >= lo && f.ms <= hi).map((f) => ({ ms: f.ms, msAfterRelease: Math.round(f.ms - upCast) }));
      const wg = gapsOf(e.windowFrames.map((f) => f.ms)); e.notes.push(`screencast frames from 120ms before to settle+160ms: ${e.windowFrames.length}, gaps median ${med(wg)}ms max ${wg.length ? Math.max(...wg) : '-'}ms`);
      const sel = thin(e.windowFrames, 36);
      if (hasFfmpeg && sel.length) { const nm = `sheet-${ctx}-${mode}-release.png`; try { sheet(sel.map((f) => `${out}/${e.frames.find((g) => g.ms === f.ms).file}`), mkCrop([box], 24, 1440, 900).w ? { ...mkCrop([box], 24, 1440, 900), w: Math.min(1440, Math.ceil(box.width + 24 * 2 + 260)) } : null, nm, { cols: 6, tileW: 260 }); e.sheet = nm; } catch { e.notes.push('sheet failed'); } }
      console.log(ctx, mode, 'release', e.frameCount, 'frames; overshoot', a.overshootPx, 'settle', a.settleMsAfterRelease); }
    await context.close(); await browser.close(); }
  // webkit phone: recordVideo
  { const ctx = 'webkit', seq = 'release', notes = [];
    const t = await filmed(webkit, devices['iPhone 14'], 'release', async (page) => { const { box } = await prepRelease(page, true); if (!box || box.width < 5) return { skipped: true }; await dragRelease(page, box); return { box, ...(await collect(page)) }; });
    if (t.err || !t.vpath || t.data?.skipped) { if (t.vdir) rmSync(t.vdir, { recursive: true, force: true }); return t.data?.skipped ? skip(ctx, mode, seq, 'slab not visible') : index.sequences.push({ context: ctx, mode, sequence: seq, frameCount: 0, frames: [], notes: ['failed: ' + (t.err?.message.split('\n')[0] ?? 'no video')] }); }
    const d = t.data, rs = rowsOf(d.s), a = analyzeRelease(rs, d.up);
    const entry = { context: ctx, mode, sequence: seq, frameCount: 0, frames: [], sheet: null, notes, release: a };
    index.sequences.push(entry);
    notes.push(`rAF samples ${rs.length}; released at ${a.upMs}ms moving ${a.releaseVelocityPxPerS}px/s, travel ${a.travelPx}px, settle ${a.settleMsAfterRelease}ms, overshoot ${a.overshootPx}px, reversals ${a.directionReversals}, max step ${a.maxStepPerRafPx}px/rAF; mouse events on webkit phone`);
    writeFileSync(`${out}/${ctx}-${mode}-release-samples.json`, JSON.stringify({ columns: ['ms', 'scrollY', 'slabOpacity', 'slabTransform', 'dockOpacity', 'slabLeft', 'slabTop', 'slabWidth', 'flying'], rows: d.s }));
    const final = `${ctx}-${mode}-${seq}.webm`; renameSync(t.vpath, `${out}/${final}`); rmSync(t.vdir, { recursive: true, force: true }); entry.video = final;
    if (hasFfmpeg) { const vf = videoFacts(`${out}/${final}`, d.flash);
      entry.videoFrames = vf.times.length; const vg = gapsOf(vf.times.map((x) => x * 1000)); notes.push(`video ${vf.times.length} frames, gaps median ${med(vg)}ms max ${Math.max(...vg)}ms; offset ${vf.offset == null ? 'unknown' : r1(vf.offset * 1000) + 'ms'}`);
      if (vf.offset != null) { extractFrames(`${out}/${final}`, `${out}/_f`);
        const upV = vf.offset * 1000 + d.up, lo = upV - 120, hi = upV + a.settleMsAfterRelease + 160;
        const fr = []; vf.times.forEach((ft, i) => { const ms = ft * 1000; if (ms >= lo && ms <= hi) { const r = nearest(rs, ms - vf.offset * 1000); fr.push({ ms: Math.round(ms), msAfterRelease: Math.round(ms - upV), n: i + 1, slabLeft: r.l }); } });
        const g = gapsOf(fr.map((f) => f.ms)); notes.push(`video frames in release window: ${fr.length}, gaps median ${med(g)}ms max ${g.length ? Math.max(...g) : '-'}ms`);
        entry.frames = fr.map(({ n, ...f }) => f); entry.frameCount = fr.length;
        if (fr.length) { const nm = `sheet-${ctx}-${mode}-${seq}.png`; try { sheet(thin(fr, 36).map((f) => `${out}/_f/${pad(f.n)}.jpg`), mkCrop([d.box], 24, 390, 664), nm, { cols: 6, tileW: 220 }); entry.sheet = nm; } catch { notes.push('sheet failed'); } }
        rmSync(`${out}/_f`, { recursive: true, force: true }); } }
    console.log(ctx, mode, 'release', entry.frameCount, 'frames; overshoot', a.overshootPx, 'settle', a.settleMsAfterRelease); }
}
if (only?.has('handoff')) await runHandoff().catch((e) => { console.log('handoff failed', e.message.split('\n')[0]); index.sequences.push({ sequence: 'handoff', notes: ['failed: ' + e.message.split('\n')[0]], frames: [], frameCount: 0 }); });
if (only?.has('release')) await runRelease().catch((e) => { console.log('release failed', e.message.split('\n')[0]); index.sequences.push({ sequence: 'release', notes: ['failed: ' + e.message.split('\n')[0]], frames: [], frameCount: 0 }); });

index.runSeconds = Math.round((Date.now() - t00) / 100) / 10;
index.totalFrames = index.sequences.reduce((n, s) => n + s.frameCount, 0);
writeFileSync(`${out}/index.json`, JSON.stringify(index, null, 2));
console.log(`done: ${index.totalFrames} frames in ${index.runSeconds}s, ${readdirSync(out).length} files`);
