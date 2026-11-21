// Captures hero card interaction states for review. Usage: node scripts/qa/interactions.mjs <base> <outdir>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const [,, base = 'http://127.0.0.1:4321', out = 'docs/evidence/latest'] = process.argv;
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + '/'); await p.waitForTimeout(1200);
const hand = p.locator('.hand');
await p.mouse.move(1100, 450); await p.waitForTimeout(900);
await hand.screenshot({ path: `${out}/hand-pointer-tilt.png` });
await p.locator('.card-hand').nth(1).hover({ position: { x: 200, y: 120 } }); await p.waitForTimeout(500);
await hand.screenshot({ path: `${out}/hand-hover-side-card.png` });
await p.mouse.move(10, 880); await p.waitForTimeout(600);
for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => !!document.activeElement?.closest('.hand'))) break; }
await p.waitForTimeout(500);
await hand.screenshot({ path: `${out}/hand-keyboard-focus.png` });
const rm = await (await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true })).newPage();
await rm.goto(base + '/'); await rm.waitForTimeout(300);
await rm.screenshot({ path: `${out}/reduced-motion-390.png` });
await b.close();
console.log('ok');
