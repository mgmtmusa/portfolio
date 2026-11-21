// Renders public/og.png (1200×630) from the site's own font and palette.
// Usage: node scripts/og.mjs   (run after `npm run build` so dist/fonts exists)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const font = readFileSync('public/fonts/archivo.woff2').toString('base64');
const card = (bg, fg, org, title, v, l, r, x, y, z) => `
  <div style="box-sizing:border-box;position:absolute;left:${x}px;top:${y}px;width:178px;height:262px;border-radius:14px;background:${bg};color:${fg};
    transform:rotate(${r}deg);z-index:${z};padding:16px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:5px 6px 0 rgba(0,0,0,.28)">
    <div><div style="font-weight:750;font-size:13px">${org}</div>
      <div style="font-stretch:62%;font-weight:850;text-transform:uppercase;font-size:20px;line-height:.92;margin-top:10px">${title}</div></div>
    <div><div style="font-stretch:62%;font-weight:850;font-size:56px;line-height:.85">${v}</div><div style="font-weight:600;font-size:12px;margin-top:6px;line-height:1.25">${l}</div></div>
  </div>`;
const html = `<!doctype html><html><head><style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 900;font-stretch:62% 100%}
body{margin:0;width:1200px;height:630px;background:#ede8de;color:#171512;font-family:A;position:relative;overflow:hidden}
</style></head><body>
<div style="position:absolute;left:64px;top:56px;font-stretch:62%;font-weight:850;text-transform:uppercase;font-size:128px;line-height:.86">Musa<br>Abdullah<br>Walid</div>
<div style="position:absolute;left:64px;bottom:58px;font-weight:750;font-size:30px">Marketing &amp; Growth Specialist in Melbourne</div>
${card('#d8cfbd', '#171512', 'The Lil Project', 'Gigs that fund<br>school buildings', '768', 'children reached<br>(organisation total)', -4, 640, 190, 1)}
${card('#124734', '#ede8de', 'Evitech', 'Paid media rebuilt<br>around lead quality', '28%', 'lower cost per<br>acquisition', 0, 826, 170, 3)}
${card('#bd2617', '#ede8de', 'I Heart Uni', 'A student brand<br>grown city by city', '13.2K', 'audience, built<br>from 400', 4, 1000, 190, 2)}
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'public/og.png' });
await b.close();
console.log('wrote public/og.png');
