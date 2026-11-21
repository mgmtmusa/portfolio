import { chromium } from '@playwright/test';
const [,, url, out] = process.argv;
const vps = [[320,640],[390,844],[844,390],[768,1024],[1024,768],[1366,700],[1440,900],[1920,1080]];
const b = await chromium.launch({ headless: true });
const res = [];
for (const [w,h] of vps) {
  const mobile = w < 900 && h > w || w === 844;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  p.on('response', r => r.status() >= 400 && errs.push(r.status()+' '+r.url()));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1600);
  const m = await p.evaluate(() => {
    const n = document.querySelector('.name'); const lines = [...document.querySelectorAll('.name .w')];
    const right = Math.max(...lines.map(l => l.getBoundingClientRect().right));
    return { sw: document.documentElement.scrollWidth, iw: innerWidth, nameRight: Math.round(right), nameBottom: Math.round(n.getBoundingClientRect().bottom) };
  });
  await p.screenshot({ path: `${out}/home-${w}x${h}.jpg`, type: 'jpeg', quality: 55 });
  res.push({ vp: `${w}x${h}`, ...m, errs });
  await ctx.close();
}
// counter a11y mid-animation
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
await p.evaluate(() => document.getElementById('impact')?.scrollIntoView());
await p.waitForTimeout(400);
const snap = await p.locator('#impact').ariaSnapshot().catch(e => 'ERR '+e.message);
console.log(JSON.stringify(res, null, 1));
console.log('IMPACT ARIA MID-ANIMATION:\n' + snap.slice(0, 600));
// direct anchor load + reduced motion
const rm = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
await rm.goto(url + '#impact', { waitUntil: 'networkidle' }); await rm.waitForTimeout(800);
await rm.screenshot({ path: `${out}/reduced-motion-impact.jpg`, type: 'jpeg', quality: 55 });
console.log('RM values', await rm.$$eval('.stat-v', els => els.map(e => e.textContent).join(' | ')));
await b.close();
