// Drive the hero through its states and capture each. Usage: node scripts/qa/hero-states.mjs <base> <outdir>
import { chromium, webkit } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const [, , base = 'http://127.0.0.1:4322', out = 'docs/evidence/hero'] = process.argv;
mkdirSync(out, { recursive: true });
for (const [name, bt] of [['chromium', chromium], ['webkit', webkit]]) {
  const b = await bt.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.addInitScript(() => { window.__v3test = true; });
  await p.goto(base + '/', { waitUntil: 'load' });
  await p.waitForTimeout(3200);
  const state = () => p.evaluate(() => ({ mode: window.__scene?.state(), bend: document.querySelector('[data-slab]')?.dataset.bend, dockShown: 'shown' in (document.querySelector('[data-dock]')?.dataset ?? {}), dockInert: document.querySelector('[data-dock]')?.inert }));
  const log = [];
  log.push(['rest', await state()]); await p.screenshot({ path: `${out}/${name}-1-rest.png` });
  await p.mouse.wheel(0, 45); await p.waitForTimeout(700);
  log.push(['slide-45', await state()]); await p.screenshot({ path: `${out}/${name}-2-slide.png` });
  await p.mouse.wheel(0, 200); await p.waitForTimeout(1400);
  log.push(['docked', await state()]); await p.screenshot({ path: `${out}/${name}-3-docked.png` });
  await p.mouse.wheel(0, -60); await p.waitForTimeout(900);
  log.push(['still docked ~185', await state()]);
  await p.mouse.wheel(0, -400); await p.waitForTimeout(1600);
  log.push(['back at rest', await state()]); await p.screenshot({ path: `${out}/${name}-4-back.png` });
  const box = await p.locator('[data-slab]').boundingBox();
  await p.mouse.move(box.x + 100, box.y + 100); await p.mouse.down();
  for (let i = 1; i <= 10; i++) { await p.mouse.move(box.x + 100 + i * 24, box.y + 100); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(1500);
  const after = await p.locator('[data-slab]').boundingBox();
  log.push(['dragged', { ...(await state()), movedBy: Math.round(after.x - box.x) }]); await p.screenshot({ path: `${out}/${name}-5-dragged.png` });
  console.log(name, JSON.stringify(log), errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
  await b.close();
}
