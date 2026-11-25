// Record frame sequences of key motion. Usage: node scripts/qa/motion.mjs <baseUrl> <outdir>
// Contexts: chromium 1440x900, webkit iPhone 14. Modes: normal, reduced. Frames via timed screenshots
// (ms in the name is the real elapsed time at capture), downscaled 50% with ffmpeg when available.
import { chromium, webkit, devices } from '@playwright/test';
import { mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [, , base = 'http://127.0.0.1:4322', out = 'docs/evidence/round-4/motion'] = process.argv;
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
async function cast(page, ctx, mode, seq, action, { tail = 600 } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const frames = []; const notes = []; const t0 = Date.now();
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
for (const [ctx, bt, opts, phone] of contexts) {
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
    { const page = await fresh();
      const nav = page.goto(base + '/', { waitUntil: 'load' }).catch(() => {});
      const e = await record(page, ctx, mode, 'load', async () => { await nav; await page.waitForTimeout(2300); }, { duration: 2800, interval: 100 });
      console.log(ctx, mode, 'load', e.frameCount); await page.close(); }

    // 1b chromium only: CDP screencast started before navigation, so frames before the first paint are kept.
    if (ctx === 'chromium') { const page = await fresh(); const cdp = await context.newCDPSession(page);
      const frames = []; const t0 = Date.now();
      cdp.on('Page.screencastFrame', async (f) => { const ms = Date.now() - t0; const file = `${ctx}-${mode}-loadcast-${pad(ms)}.jpg`; writeFileSync(`${out}/${file}`, Buffer.from(f.data, 'base64')); frames.push({ ms, file }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
      await page.goto(base + '/', { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(2300);
      await cdp.send('Page.stopScreencast').catch(() => {});
      index.sequences.push({ context: ctx, mode, sequence: 'loadcast', frameCount: frames.length, frames, sheet: null, notes: ['CDP screencast from before navigation; ms is time since screencast start (navigation begins about 0 to 30ms later); frames only exist where the compositor produced one'] });
      console.log(ctx, mode, 'loadcast', frames.length); await page.close(); }

    // 2 scroll to dock and back
    { const page = await fresh(); await settle(page);
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
    { const page = await fresh(); await settle(page);
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
    { const page = await fresh(); await settle(page);
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
    { const page = await fresh(); await settle(page);
      const e = await record(page, ctx, mode, 'vt', async () => {
        await page.evaluate(() => [...document.querySelectorAll('a[href="/work/"]')].find((a) => a.offsetParent !== null)?.click() ?? document.querySelector('a[href="/work/"]')?.click());
        await page.waitForURL('**/work/', { timeout: 5000 }); await page.waitForTimeout(1200);
        await page.evaluate(() => [...document.querySelectorAll('a[href="/"]')].find((a) => a.offsetParent !== null)?.click() ?? document.querySelector('a[href="/"]')?.click());
        await page.waitForURL((u) => u.pathname === '/', { timeout: 5000 }); await page.waitForTimeout(1200);
      }, { duration: 4200, interval: 175 });
      console.log(ctx, mode, 'vt', e.frameCount); await page.close(); }

    // 5 command menu
    { const page = await fresh(); await settle(page);
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

index.runSeconds = Math.round((Date.now() - t00) / 100) / 10;
index.totalFrames = index.sequences.reduce((n, s) => n + s.frameCount, 0);
writeFileSync(`${out}/index.json`, JSON.stringify(index, null, 2));
console.log(`done: ${index.totalFrames} frames in ${index.runSeconds}s, ${readdirSync(out).length} files`);
