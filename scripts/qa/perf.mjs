// INP and frame-rate gates (brief section 9). Usage: node scripts/qa/perf.mjs <baseUrl> <outdir> [bendBaseUrl]
// INP: Chromium at 4× CPU throttling, Event Timing grouped by interactionId, worst interaction ≤ 200ms.
// Frames: headed Chromium, 5s of real wheel scrolling over the hero scene; ≥ 95% of frames within 1.5x the measured refresh interval, no task over 50ms.
// Bend build (plan F10), desktop and phone at 4× CPU, through the window.__bendBuild test hook:
//   cold (map cache cleared) ≤ 25ms, and only ever inside an idle callback; warm (cache hit) ≤ 16ms.
//   Plus one land(0) after a resize while docked (the rebuild inside the spring back) ≤ 16ms.
// __bendBuild is stripped from production builds, so the bend timings need an `astro dev` server: pass it as
// bendBaseUrl (defaults to baseUrl). INP and frames should run against `astro preview`.
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , base = 'http://127.0.0.1:4322', out = 'docs/evidence/perf', bendBase = base] = process.argv;
mkdirSync(out, { recursive: true });
const result = {};

// ---------- INP ----------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__v3test = true;
    window.__events = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__events.push({ id: e.interactionId, name: e.name, d: e.duration }); })
      .observe({ type: 'event', durationThreshold: 16, buffered: true });
  });
  const cdp = await ctx.newCDPSession(p);
  await p.goto(base + '/', { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const steps = [];
  const step = async (name, fn) => { await fn(); await p.waitForTimeout(450); steps.push(name); };
  await step('⌘K open', () => p.keyboard.press('Control+k'));
  await step('⌘K typing', () => p.keyboard.type('evitech', { delay: 60 }));
  await step('⌘K close', () => p.keyboard.press('Escape'));
  await step('footnote', () => p.locator('.hero .proof .fn').first().click());
  await step('footnote close', () => p.keyboard.press('Escape'));
  const slab = await p.locator('[data-slab]').boundingBox();
  await step('slab press and release', async () => { await p.mouse.move(slab.x + 50, slab.y + 50); await p.mouse.down(); await p.mouse.up(); });
  await step('slab drag', async () => { await p.mouse.move(slab.x + 50, slab.y + 50); await p.mouse.down(); await p.mouse.move(slab.x + 250, slab.y + 50, { steps: 12 }); await p.mouse.up(); });
  await p.waitForTimeout(1500);
  await step('Copy email', async () => { await p.keyboard.press('Control+k'); await p.keyboard.type('copy'); await p.keyboard.press('Enter'); });
  const ev = await p.evaluate(() => window.__events);
  const byId = new Map();
  for (const e of ev) byId.set(e.id, Math.max(byId.get(e.id) ?? 0, e.d));
  const worst = Math.max(0, ...byId.values());
  result.inp = { worstMs: worst, interactions: byId.size, steps, pass: worst <= 200 };
  await b.close();
}

// ---------- Bend build time (4× CPU), desktop and phone: cold, warm, and land(0) after a resize while docked ----------
const COLD_MS = 25, WARM_MS = 16;
for (const [label, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', { ...devices['Pixel 7'] }]]) {
  const b = await chromium.launch();
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__v3test = true; });
  await p.goto(bendBase + '/', { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  // Median of 5 after one warm-up, each timed synchronously by the hook.
  const ms = await p.evaluate(() => {
    const hook = window.__bendBuild;
    if (!hook) return null;
    const median = (warm) => { hook(warm); const runs = []; for (let i = 0; i < 5; i++) runs.push(hook(warm)); runs.sort((a, c) => a - c); return runs[2]; };
    return { cold: median(false), warm: median(true) };
  });
  const r = (result[`bendBuild_${label}`] = {});
  if (ms == null) {
    Object.assign(r, { cold: null, warm: null, pass: false, note: 'window.__bendBuild missing: it is stripped from production builds, so pass an astro dev URL as bendBaseUrl' });
    await b.close();
    continue;
  }
  Object.assign(r, { coldMs: Math.round(ms.cold * 10) / 10, coldPass: ms.cold <= COLD_MS, warmMs: Math.round(ms.warm * 10) / 10, warmPass: ms.warm <= WARM_MS });
  // land(0) after a resize while docked: reload unthrottled, dock, change the width (the resize handler drops the
  // bend and warms the map while idle), then throttle and scroll back to the top. The rebuild in land(0) must be warm.
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => window.__scene?.setProgress(600));
  await p.waitForFunction(() => window.__scene?.state() === 'docked', null, { timeout: 5000 }).catch(() => {});
  const vp = p.viewportSize();
  await p.setViewportSize({ width: vp.width - (label === 'phone' ? 20 : 160), height: vp.height });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__landBuildMs = undefined; });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.evaluate(() => window.__scene?.setProgress(0));
  await p.waitForFunction(() => window.__scene?.state() === 'rest' && window.__landBuildMs !== undefined, null, { timeout: 8000 }).catch(() => {});
  const land = await p.evaluate(() => window.__landBuildMs ?? null);
  Object.assign(r, { landAfterResizeMs: land == null ? null : Math.round(land * 10) / 10, landPass: land != null && land <= WARM_MS });
  r.pass = r.coldPass && r.warmPass && r.landPass;
  await b.close();
}

// ---------- Frames: headed, wheel-driven ----------
{
  const b = await chromium.launch({ headless: false });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base + '/', { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  // Measure the display refresh interval (median rAF delta over 60 frames).
  const vsync = await p.evaluate(() => new Promise((res) => { const t = []; let last = 0; const f = (n) => { if (last) t.push(n - last); last = n; t.length < 60 ? requestAnimationFrame(f) : res(t.sort((a, b) => a - b)[30]); }; requestAnimationFrame(f); }));
  const cdp = await p.context().newCDPSession(p);
  const events = [];
  cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline.frame,toplevel', transferMode: 'ReportEvents' });
  await p.mouse.move(720, 450);
  const t0 = Date.now();
  let dir = 1;
  while (Date.now() - t0 < 5000) {
    await p.mouse.wheel(0, 60 * dir);
    await p.waitForTimeout(40);
    if (Date.now() - t0 > 2500 && dir === 1) dir = -1;
  }
  await cdp.send('Tracing.end');
  await done;
  writeFileSync(`${out}/scroll-trace.json`, JSON.stringify({ traceEvents: events }));
  let draws = events.filter((e) => e.name === 'DrawFrame').map((e) => e.ts).sort((a, c) => a - c);
  if (draws.length < 50) draws = events.filter((e) => e.name === 'Commit').map((e) => e.ts).sort((a, c) => a - c);
  const deltas = [];
  for (let i = 1; i < draws.length; i++) { const d = (draws[i] - draws[i - 1]) / 1000; if (d > 0.5) deltas.push(d); }
  const limit = vsync * 1.5;
  const under = deltas.filter((d) => d <= limit).length;
  const longTasks = events.filter((e) => e.name === 'RunTask' && e.dur > 50000).map((e) => Math.round(e.dur / 1000));
  result.frames = { refreshMs: +vsync.toFixed(2), refreshHz: Math.round(1000 / vsync), limitMs: +limit.toFixed(1), frames: deltas.length, shareWithinLimit: deltas.length ? +(under / deltas.length).toFixed(3) : null, longTasksMs: longTasks, pass: deltas.length > 0 && under / deltas.length >= 0.95 && longTasks.length === 0 };
  await b.close();
}

writeFileSync(`${out}/perf-summary.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
