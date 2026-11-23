// Capture one URL in Chromium and WebKit. Usage: node _engines.mjs <url> <outPrefix> [w] [h] [device]
import { chromium, webkit, devices } from '@playwright/test';
const [,, url, out, w = '1440', h = '900', dev] = process.argv;
for (const [name, bt] of [['chromium', chromium], ['webkit', webkit]]) {
  const b = await bt.launch();
  const opts = dev ? { ...devices[dev] } : { viewport: { width: +w, height: +h } };
  if (name === 'chromium' && dev && devices[dev].defaultBrowserType === 'webkit') delete opts.defaultBrowserType;
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 8000 }).catch(() => errs.push('never ready'));
  await p.waitForTimeout(+(process.env.WAIT ?? 900));
  await p.screenshot({ path: `${out}-${name}.png` });
  console.log(name, errs.length ? errs : 'clean');
  await b.close();
}
