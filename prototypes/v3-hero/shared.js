// Shared behaviour for the v3 hero prototypes: Melbourne clock and the SVG glass lens.
import { displacementMap } from './glass.js';

const SVG = 'http://www.w3.org/2000/svg';
const XL = 'http://www.w3.org/1999/xlink';

/** Live Melbourne time with seconds in every [data-clock]. */
export function startClock() {
  const fmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const els = [...document.querySelectorAll('[data-clock]')];
  const tick = () => { const t = fmt.format(new Date()); els.forEach((e) => (e.textContent = t)); };
  tick();
  setInterval(tick, 1000);
}

function fontAscent(style) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const m = c.measureText('Hxgy');
  return m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent;
}

/**
 * Builds an inline SVG copy of the content under `pane` (text lines and images), bent at the
 * pane's edges with a displacement filter, and knocks the originals out under the pane so the
 * straight and bent copies never double up.
 * @param {HTMLElement} pane  the glass pane (position: absolute inside `root`)
 * @param {HTMLElement} root  the positioned hero that both pane and sources live in
 * @param {{ lines: HTMLElement[], images: HTMLImageElement[], radius: number, band?: number, strength?: number }} o
 */
export function buildLens(pane, root, o) {
  const band = o.band ?? 36, strength = o.strength ?? 40;
  pane.querySelector('svg.lens')?.remove();
  const R = root.getBoundingClientRect();
  const P = pane.getBoundingClientRect();
  const px = P.left - R.left, py = P.top - R.top, pw = P.width, ph = P.height;
  const id = `bend-${Math.random().toString(36).slice(2, 7)}`;

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'lens');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', pw);
  svg.setAttribute('height', ph);
  svg.setAttribute('viewBox', `${px} ${py} ${pw} ${ph}`);
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;overflow:hidden;pointer-events:none;z-index:1';
  const map = displacementMap(pw, ph, o.radius, band);
  svg.innerHTML = `<defs>
    <clipPath id="${id}-c"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${o.radius}"/></clipPath>
    <filter id="${id}" x="${px - band * 2}" y="${py - band * 2}" width="${pw + band * 4}" height="${ph + band * 4}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength}" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs><g clip-path="url(#${id}-c)"><g filter="url(#${id})"></g></g>`;
  const fe = svg.querySelector('feImage');
  fe.setAttribute('href', map);
  fe.setAttributeNS(XL, 'xlink:href', map);
  const g = svg.querySelector('g[filter]');

  for (const img of o.images) {
    const r = img.getBoundingClientRect();
    const im = document.createElementNS(SVG, 'image');
    const src = img.currentSrc || img.src;
    im.setAttribute('href', src);
    im.setAttributeNS(XL, 'xlink:href', src);
    im.setAttribute('x', r.left - R.left);
    im.setAttribute('y', r.top - R.top);
    im.setAttribute('width', r.width);
    im.setAttribute('height', r.height);
    im.setAttribute('preserveAspectRatio', getComputedStyle(img).objectFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice');
    const op = getComputedStyle(img).opacity;
    if (op !== '1') im.setAttribute('opacity', op);
    g.appendChild(im);
  }
  for (const line of o.lines) {
    const s = getComputedStyle(line);
    const range = document.createRange();
    range.selectNodeContents(line);
    const rects = [...range.getClientRects()];
    const r = rects[0];
    if (!r) continue;
    const t = document.createElementNS(SVG, 'text');
    t.textContent = line.textContent;
    t.setAttribute('x', r.left - R.left);
    t.setAttribute('y', r.top - R.top + fontAscent(s));
    t.setAttribute('fill', s.color);
    t.style.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    t.style.letterSpacing = s.letterSpacing;
    t.style.fontKerning = 'normal';
    g.appendChild(t);
  }
  pane.prepend(svg);

  // Knock the originals out under the pane.
  const hole = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='${SVG}' width='${pw}' height='${ph}'><rect width='${pw}' height='${ph}' rx='${o.radius}'/></svg>`)}")`;
  for (const el of [...o.lines, ...o.images]) {
    const r = el.getBoundingClientRect();
    el.style.webkitMaskImage = el.style.maskImage = `linear-gradient(#000 0 0), ${hole}`;
    el.style.webkitMaskRepeat = el.style.maskRepeat = 'no-repeat';
    el.style.webkitMaskPosition = el.style.maskPosition = `0 0, ${P.left - r.left}px ${P.top - r.top}px`;
    el.style.webkitMaskSize = el.style.maskSize = `100% 100%, ${pw}px ${ph}px`;
    el.style.webkitMaskComposite = 'xor';
    el.style.maskComposite = 'exclude';
  }
  pane.dataset.lens = 'on';
  return () => {
    svg.remove();
    for (const el of [...o.lines, ...o.images]) { el.style.webkitMaskImage = el.style.maskImage = ''; }
    pane.dataset.lens = 'off';
  };
}
