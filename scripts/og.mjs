// Renders public/og.png (1200×630) from the site's own font and palette.
// Usage: node scripts/og.mjs   (run after `npm run build` so dist/fonts exists)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const font = readFileSync('public/fonts/archivo.woff2').toString('base64');
const card = (bg, fg, org, v, l, r, x, z) => `
  <div style="position:absolute;left:${x}px;top:140px;width:230px;height:322px;border-radius:14px;background:${bg};color:${fg};
    transform:rotate(${r}deg);z-index:${z};padding:20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 0 0 1px rgba(0,0,0,.06)">
    <div style="font-weight:750;font-size:16px">${org}</div>
    <div><div style="font-stretch:62%;font-weight:850;font-size:78px;line-height:.85">${v}</div><div style="font-weight:600;font-size:14px;margin-top:6px">${l}</div></div>
  </div>`;
const html = `<!doctype html><html><head><style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 900;font-stretch:62% 100%}
body{margin:0;width:1200px;height:630px;background:#ede8de;color:#171512;font-family:A;position:relative;overflow:hidden}
</style></head><body>
<div style="position:absolute;left:64px;top:56px;font-stretch:62%;font-weight:850;text-transform:uppercase;font-size:148px;line-height:.86">Musa<br>Abdullah<br>Walid</div>
<div style="position:absolute;left:64px;bottom:58px;font-weight:750;font-size:30px">Marketing &amp; Growth Specialist in Melbourne</div>
${card('#d8cfbd', '#171512', 'The Lil Project', '768', 'children reached', -9, 700, 1)}
${card('#bd2617', '#ede8de', 'I Heart Uni', '13.2K', 'audience, built from 400', 9, 900, 2)}
${card('#124734', '#ede8de', 'Evitech', '28%', 'lower cost per acquisition', 0, 800, 3)}
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'public/og.png' });
await b.close();
console.log('wrote public/og.png');
