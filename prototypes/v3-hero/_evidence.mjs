// Evidence pack for the direction review: rest + motion states per direction, desktop and phone.
import { chromium, webkit, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const base = 'http://127.0.0.1:4411/';
const plans = {
  a: [['rest', 0], ['slide-60', 60], ['morph-220', 220], ['docked', 420]],
  b: [['rest', 0], ['slide-40', 40], ['docked', 200]],
  c: [['rest', 0], ['docked', 200]],
};
for (const [bn, bt] of [['chromium', chromium], ['webkit', webkit]]) {
  const b = await bt.launch();
  for (const [vp, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', { ...devices['iPhone 14'], defaultBrowserType: undefined }]]) {
    if (vp === 'phone' && bn === 'chromium') continue;
    for (const [d, states] of Object.entries(plans)) {
      const ctx = await b.newContext(opts); const p = await ctx.newPage();
      await p.goto(base + d + '.html'); await p.waitForFunction(() => document.documentElement.dataset.ready === '1'); await p.waitForTimeout(2600);
      for (const [name, y] of states) {
        await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(y ? 1300 : 200);
        await p.screenshot({ path: `${out}/${d}-${vp}-${bn}-${name}.png` });
      }
      if (d === 'c' && vp === 'desktop') { // drag the slab right with momentum
        await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1400);
        const box = await p.locator('.pane').boundingBox();
        await p.mouse.move(box.x + 60, box.y + 60); await p.mouse.down();
        for (let i = 1; i <= 8; i++) { await p.mouse.move(box.x + 60 + i * 30, box.y + 60); await p.waitForTimeout(16); }
        await p.mouse.up(); await p.waitForTimeout(1400);
        await p.screenshot({ path: `${out}/c-desktop-${bn}-dragged.png` });
      }
      await ctx.close();
    }
  }
  await b.close();
}
console.log('done');
