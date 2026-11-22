// Screenshots of the portrait-lens hero, the lens and Machine states, and the card hand.
// Usage: node scripts/qa/hero-shots.mjs <base-url> <outdir>
import { mkdirSync } from 'node:fs';
import { chromium, webkit, devices } from '@playwright/test';

const [base, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const runs = [
  ['desk-1440', chromium, { viewport: { width: 1440, height: 900 } }],
  ['desk-1366x700', chromium, { viewport: { width: 1366, height: 700 } }],
  ['iphone14', webkit, { ...devices['iPhone 14'] }],
  ['iphone14-land', webkit, { ...devices['iPhone 14 landscape'] }],
  ['phone-320', chromium, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }],
];
for (const [name, engine, opts] of runs) {
  const b = await engine.launch();
  const p = await (await b.newContext(opts)).newPage();
  await p.goto(base + '/');
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${name}.png` });
  if (name === 'iphone14') {
    await p.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
    await p.locator('.hand').screenshot({ path: `${out}/${name}-hand.png` });
    await p.locator('.lens-toggle').tap();
    await p.waitForTimeout(800);
    await p.locator('.lens').screenshot({ path: `${out}/${name}-machine.png` });
  }
  if (name === 'desk-1440') {
    const box = await p.locator('.lens-stage').boundingBox();
    await p.mouse.move(box.x + box.width * 0.47, box.y + box.height * 0.36);
    await p.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.37, { steps: 4 });
    await p.waitForTimeout(700);
    await p.locator('.lens').screenshot({ path: `${out}/${name}-lens.png` });
    await p.mouse.move(5, 300);
    await p.locator('.lens-toggle').click();
    await p.waitForTimeout(800);
    await p.locator('.lens').screenshot({ path: `${out}/${name}-machine.png` });
    await p.evaluate(() => scrollTo(0, 700));
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/${name}-hand.png` });
  }
  await b.close();
}
console.log('done');
