import { chromium } from '@playwright/test';
const [,, url, out, w = '1600', h = '900', full] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: !!full, type: out.endsWith('.png') ? 'png' : 'jpeg', ...(out.endsWith('.png') ? {} : { quality: 80 }) });
await b.close();
