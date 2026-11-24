// INP and frame-rate gates (brief section 9). Usage: node scripts/qa/perf.mjs <baseUrl> <outdir>
// INP: Chromium at 4× CPU throttling, Event Timing grouped by interactionId, worst interaction ≤ 200ms.
// Frames: headed Chromium, 5s of real wheel scrolling over the hero scene; ≥ 95% of frames within 1.5x the measured refresh interval, no task over 50ms.
// Also times the bend build at desktop and phone sizes (cold build via window.__bendBuild, budget 16ms at 4× CPU).
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , base = 'http://127.0.0.1:4322', out = 'docs/evidence/perf'] = process.argv;
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

// ---------- Bend build time (4× CPU), desktop and phone ----------
for (const [label, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', { ...devices['Pixel 7'] }]]) {
  const b = await chromium.launch();
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__v3test = true; });
  await p.goto(base + '/', { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  // Cold build: the test hook clears the displacement-map cache and times buildBend synchronously (median of 5, after one warm-up).
  const ms = await p.evaluate(() => {
    const hook = window.__bendBuild;
    if (!hook) return null;
    hook();
    const runs = [];
    for (let i = 0; i < 5; i++) runs.push(hook());
    runs.sort((a, b) => a - b);
    return runs[2];
  });
  if (ms == null) { result[`bendBuild_${label}_ms`] = null; result[`bendBuild_${label}_pass`] = false; result[`bendBuild_${label}_note`] = 'window.__bendBuild missing: rebuild dist so the bend.ts test hook is included'; await b.close(); continue; }
  result[`bendBuild_${label}_ms`] = Math.round(ms * 10) / 10;
  result[`bendBuild_${label}_pass`] = ms <= 16;
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
