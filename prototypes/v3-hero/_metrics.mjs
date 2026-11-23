import { chromium } from '@playwright/test';
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://127.0.0.1:4411/fonts.html');
const r = await p.evaluate(async () => {
  await document.fonts.load('540 1000px Host');
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;top:0;left:0;font:540 1000px/1 Host;white-space:nowrap';
  d.innerHTML = 'Musa<span style="display:inline-block;width:1px;height:0"></span>';
  document.body.appendChild(d);
  const base = d.querySelector('span').getBoundingClientRect().bottom - d.getBoundingClientRect().top;
  const c = document.createElement('canvas').getContext('2d'); c.font = '540 1000px Host';
  const m = c.measureText('M'); const w = (s) => c.measureText(s).width;
  return { lineH: d.getBoundingClientRect().height, baselineFromTop_lh1: base, cap: m.actualBoundingBoxAscent, ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent,
    widthsEm: { 'Musa Abdullah': w('Musa Abdullah')/1000, Abdullah: w('Abdullah')/1000, Walid: w('Walid')/1000, Musa: w('Musa')/1000 } };
});
console.log(JSON.stringify(r)); await b.close();
