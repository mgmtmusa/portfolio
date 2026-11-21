// Hero hand in each engine (default, hover, focus). Usage: node scripts/qa/engines.mjs <base> <outdir>
import { chromium, webkit, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const [,, base = 'http://127.0.0.1:4321', out = 'docs/evidence/latest'] = process.argv;
mkdirSync(out, { recursive: true });
const runs = [
  ['chromium-1440', chromium, { viewport: { width: 1440, height: 900 } }],
  ['webkit-1440', webkit, { viewport: { width: 1440, height: 900 } }],
  ['webkit-iphone14', webkit, { ...devices['iPhone 14'] }],
  ['webkit-iphone14-landscape', webkit, { ...devices['iPhone 14 landscape'] }],
];
for (const [name, bt, opts] of runs) {
  const b = await bt.launch();
  const p = await (await b.newContext(opts)).newPage();
  await p.goto(base + '/'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${name}-first-screen.png` });
  if (!opts.isMobile) {
    await p.locator('.card-hand').nth(1).hover({ position: { x: 150, y: 60 } }); await p.waitForTimeout(500);
    await p.locator('.hand').screenshot({ path: `${out}/${name}-hover.png` });
  }
  await b.close();
}
console.log('ok');
