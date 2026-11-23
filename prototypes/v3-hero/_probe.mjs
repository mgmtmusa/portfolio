import { webkit, chromium } from '@playwright/test';
const S = process.argv[2];
const b = await webkit.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:4411/bend-test.html?band=30&s=34', { waitUntil: 'load' });
await p.waitForFunction(() => document.documentElement.dataset.ready === '1');
// save the map to a file via the page, then try three ways of referencing it
const dataUrl = await p.evaluate(() => document.querySelector('feImage').getAttribute('href'));
const fs = await import('node:fs');
fs.writeFileSync('map-test.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
for (const mode of ['file', 'blob', 'inline-svg-image']) {
  await p.evaluate(async (mode) => {
    const fe = document.querySelector('feImage');
    const ns = 'http://www.w3.org/1999/xlink';
    if (mode === 'file') { fe.setAttribute('href', 'map-test.png'); fe.setAttributeNS(ns, 'xlink:href', 'map-test.png'); }
    if (mode === 'blob') { const bl = await (await fetch(fe.getAttribute('href').startsWith('data:') ? fe.getAttribute('href') : 'map-test.png')).blob(); const u = URL.createObjectURL(bl); fe.setAttribute('href', u); fe.setAttributeNS(ns, 'xlink:href', u); }
    if (mode === 'inline-svg-image') {
      // reference an <image> element inside the same SVG
      const svg = fe.ownerSVGElement; let im = svg.querySelector('#mapimg');
      if (!im) { im = document.createElementNS('http://www.w3.org/2000/svg', 'image'); im.id = 'mapimg'; im.setAttribute('width', fe.getAttribute('width')); im.setAttribute('height', fe.getAttribute('height')); im.setAttributeNS(ns, 'xlink:href', 'map-test.png'); im.setAttribute('href', 'map-test.png'); svg.querySelector('defs').appendChild(im); }
      fe.setAttribute('href', '#mapimg'); fe.setAttributeNS(ns, 'xlink:href', '#mapimg');
    }
    // force re-render
    const l = document.querySelector('.lens'); l.style.filter = 'none'; l.offsetWidth; l.style.filter = '';
  }, mode);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${S}/probe-${mode}.png`, clip: { x: 240, y: 200, width: 760, height: 420 } });
}
await b.close();
