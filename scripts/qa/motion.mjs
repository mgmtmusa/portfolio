// Record frame sequences of key motion. Usage: node scripts/qa/motion.mjs <baseUrl> <outdir>
// Contexts: chromium 1440x900, webkit iPhone 14. Modes: normal, reduced. Frames via timed screenshots
// (ms in the name is the real elapsed time at capture), downscaled 50% with ffmpeg when available.
import { chromium, webkit, devices } from '@playwright/test';
import { mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [, , base = 'http://127.0.0.1:4322', out = 'docs/evidence/round-4/motion'] = process.argv;
mkdirSync(out, { recursive: true });
const MAX = 25;
const e0 = {}, e1 = {};
const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const t00 = Date.now();
const index = { base, generated: new Date().toISOString(), ffmpeg: hasFfmpeg, sequences: [] };
const pad = (n) => String(n).padStart(5, '0');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run `action` while grabbing frames until it ends and `tail` ms passed, or MAX frames.
async function record(page, ctx, mode, seq, action, { duration = 2500, interval = 100 } = {}) {
  const prefix = `${ctx}-${mode}-${seq}`;
  const frames = []; const notes = [];
  const t0 = Date.now();
  let done = false;
  const act = Promise.resolve().then(action).then((r) => { done = true; return r; }).catch((e) => { done = true; notes.push('action error: ' + e.message.split('\n')[0]); });
  while (frames.length < MAX && Date.now() - t0 < duration) {
    const ts = Date.now() - t0;
    const file = `${prefix}-${pad(ts)}.png`;
    try { await page.screenshot({ path: `${out}/${file}`, animations: 'allow', caret: 'initial', timeout: 3000 }); frames.push({ ms: ts, file }); } catch (e) { if (!notes.some((n) => n.startsWith('shot error'))) notes.push('shot error (before first paint, frames skipped): ' + e.message.split('\n')[0]); await sleep(40); }
    const wait = interval - (Date.now() - t0 - ts);
    if (wait > 0) await sleep(wait);
  }
  await act;
  if (!done) notes.push('action not finished');
  if (frames.length >= MAX && Date.now() - t0 < duration) notes.push(`frame cap hit at ${frames[frames.length - 1].ms}ms of ${duration}ms`);
  if (hasFfmpeg && frames.length) {
    for (const f of frames) {
      const p = `${out}/${f.file}`;
      try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', p, '-vf', 'scale=iw/2:ih/2', `${p}.tmp.png`]); renameSync(`${p}.tmp.png`, p); } catch (e) { notes.push('downscale failed ' + f.file); }
    }
    try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', `${out}/${prefix}-*.png`, '-vf', 'scale=320:-1,tile=5x5:padding=4', '-frames:v', '1', `${out}/sheet-${prefix}.png`]); } catch { notes.push('contact sheet failed'); }
  }
  const entry = { context: ctx, mode, sequence: seq, frameCount: frames.length, frames, sheet: hasFfmpeg ? `sheet-${prefix}.png` : null, notes };
  index.sequences.push(entry);
  return entry;
}
function skip(ctx, mode, seq, why) { index.sequences.push({ context: ctx, mode, sequence: seq, frameCount: 0, frames: [], skipped: why, notes: [why] }); console.log(`  skip ${ctx}-${mode}-${seq}: ${why}`); }

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
      if (phone) { const steps = 12; for (let i = 0; i < steps; i++) { await page.evaluate((d) => window.scrollBy(0, d), dy / steps); await page.waitForTimeout(25); } return; } await page.mouse.move(opts.viewport?.width ? opts.viewport.width / 2 : 195, 400); await page.mouse.wheel(0, dy); };
    const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));

    // 1 first load
    { const page = await fresh();
      const nav = page.goto(base + '/', { waitUntil: 'load' }).catch(() => {});
      const e = await record(page, ctx, mode, 'load', async () => { await nav; await page.waitForTimeout(2300); }, { duration: 2800, interval: 100 });
      console.log(ctx, mode, 'load', e.frameCount); await page.close(); }

    // 2 scroll to dock and back
    { const page = await fresh(); await settle(page);
      const e = await record(page, ctx, mode, 'scroll', async () => {
        await wheel(page, 45); await page.waitForTimeout(300); await wheel(page, 250); await page.waitForTimeout(900);
        e0.docked = await scrollY(page);
        await wheel(page, -700); await page.waitForTimeout(1000);
      }, { duration: 3400, interval: 140 });
      e.notes.push(`scrollY at dock ${e0.docked}`);
      console.log(ctx, mode, 'scroll', e.frameCount); await page.close(); }

    // 3 slab drag
    { const page = await fresh(); await settle(page);
      const box = await page.locator('[data-slab]').boundingBox().catch(() => null);
      if (!box || box.width < 5) skip(ctx, mode, 'drag', 'slab not visible in this context/mode');
      else {
        const e = await record(page, ctx, mode, 'drag', async () => {
          const x = box.x + box.width / 2, y = box.y + box.height / 2;
          await page.mouse.move(x, y); await page.mouse.down();
          for (let i = 1; i <= 10; i++) { await page.mouse.move(x + i * 20, y); await page.waitForTimeout(16); }
          await page.waitForTimeout(250); await page.mouse.up(); await page.waitForTimeout(1100);
        }, { duration: 2200, interval: 90 });
        if (phone) e.notes.push('mouse events used on webkit phone (no CDP touch)');
        console.log(ctx, mode, 'drag', e.frameCount);
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
