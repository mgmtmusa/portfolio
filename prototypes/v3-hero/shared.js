// Shared behaviour for the v3 hero prototypes: clock, springs, and the SVG glass lens.
import { displacementMap } from './glass.js';

const SVG = 'http://www.w3.org/2000/svg';
const XL = 'http://www.w3.org/1999/xlink';
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Live Melbourne time with seconds in every [data-clock]. */
export function startClock() {
  const fmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const els = [...document.querySelectorAll('[data-clock]')];
  const tick = () => { const t = fmt.format(new Date()); els.forEach((e) => (e.textContent = t)); };
  tick();
  setInterval(tick, 1000);
}

/**
 * Closed-form spring (Apple's response/damping model). Interruptible: call the returned
 * function to stop, then start a new spring from the current value and velocity.
 */
export function spring(from, to, { response = 0.45, damping = 1, velocity = 0 } = {}, onUpdate, onDone) {
  const w = (2 * Math.PI) / response;
  const x0 = from - to;
  const t0 = performance.now();
  let raf = 0, last = { x: from, v: velocity };
  const step = (now) => {
    const t = (now - t0) / 1000;
    let x, v;
    if (damping >= 1) {
      const e = Math.exp(-w * t);
      x = (x0 + (velocity + w * x0) * t) * e;
      v = (velocity + w * x0) * e - w * (x0 + (velocity + w * x0) * t) * e;
    } else {
      const wd = w * Math.sqrt(1 - damping * damping);
      const e = Math.exp(-damping * w * t);
      const B = (velocity + damping * w * x0) / wd;
      x = e * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t));
      v = -damping * w * x + e * (-x0 * wd * Math.sin(wd * t) + B * wd * Math.cos(wd * t));
    }
    last = { x: to + x, v };
    onUpdate(last.x, v);
    if (Math.abs(x) < 0.05 && Math.abs(v) < 0.05) { onUpdate(to, 0); onDone?.(); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  const stop = () => { cancelAnimationFrame(raf); return last; };
  return stop;
}

/** Apple's momentum projection. */
export const project = (v, d = 0.998) => ((v / 1000) * d) / (1 - d);
export const rubberband = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const ease = {
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  p3inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

function fontAscentPx(s) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
  return c.measureText('Hxgy').fontBoundingBoxAscent;
}

/**
 * An inline-SVG copy of what sits under `pane`, bent at its edges by a displacement filter.
 * The originals are knocked out under the pane so straight and bent copies never double up.
 * `shift(dx, dy)` moves the pane relative to the content (drag) or the content relative to a
 * fixed pane (scroll) without rebuilding. `setStrength(s)` animates the bend.
 */
export function buildLens(pane, root, o) {
  const band = o.band ?? 24, strength = o.strength ?? 28;
  pane.querySelector('svg.lens')?.remove();
  const R = root.getBoundingClientRect();
  const P = pane.getBoundingClientRect();
  const px = P.left - R.left, py = P.top - R.top, pw = P.width, ph = P.height;
  const id = `bend-${Math.random().toString(36).slice(2, 7)}`;
  const radius = parseFloat(getComputedStyle(pane).borderTopLeftRadius) || 24;

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'lens');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `${px} ${py} ${pw} ${ph}`);
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;overflow:hidden;pointer-events:none;z-index:1';
  svg.innerHTML = `<defs>
    <clipPath id="${id}-c"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${radius}"/></clipPath>
    <filter id="${id}" x="${px - band * 2}" y="${py - band * 2}" width="${pw + band * 4}" height="${ph + band * 4}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength}" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs><g clip-path="url(#${id}-c)"><g filter="url(#${id})"><g class="content"></g></g></g>`;
  const map = displacementMap(pw, ph, radius, band);
  const fe = svg.querySelector('feImage');
  fe.setAttribute('href', map);
  fe.setAttributeNS(XL, 'xlink:href', map);
  const g = svg.querySelector('g.content');
  const dm = svg.querySelector('feDisplacementMap');

  for (const img of o.images ?? []) {
    const r = img.getBoundingClientRect();
    const im = document.createElementNS(SVG, 'image');
    const src = img.currentSrc || img.src;
    im.setAttribute('href', src);
    im.setAttributeNS(XL, 'xlink:href', src);
    im.setAttribute('x', r.left - R.left);
    im.setAttribute('y', r.top - R.top);
    im.setAttribute('width', r.width);
    im.setAttribute('height', r.height);
    im.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    g.appendChild(im);
  }
  // WebKit ignores letter-spacing on SVG <text>, so every glyph gets its own x from the page's own layout.
  for (const line of o.lines ?? []) {
    const s = getComputedStyle(line);
    const xs = [], chars = [];
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    let top = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (let i = 0; i < node.length; i++) {
        const r = document.createRange();
        r.setStart(node, i); r.setEnd(node, i + 1);
        const b = r.getBoundingClientRect();
        if (!b.width && node.data[i] !== ' ') continue;
        if (top === null) top = b.top;
        xs.push((b.left - R.left).toFixed(2));
        chars.push(node.data[i]);
      }
    }
    if (top === null) continue;
    const t = document.createElementNS(SVG, 'text');
    t.textContent = chars.join('');
    t.setAttribute('x', xs.join(' '));
    t.setAttribute('y', top - R.top + fontAscentPx(s));
    t.setAttribute('fill', s.color);
    t.style.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    t.style.letterSpacing = '0px';
    t.style.whiteSpace = 'pre';
    g.appendChild(t);
  }
  pane.prepend(svg);

  const hole = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='${SVG}' width='${pw}' height='${ph}'><rect width='${pw}' height='${ph}' rx='${radius}'/></svg>`)}")`;
  const targets = [...(o.lines ?? []), ...(o.images ?? [])].map((el) => {
    const r = el.getBoundingClientRect();
    const base = { x: P.left - r.left, y: P.top - r.top };
    const st = el.style;
    st.webkitMaskImage = st.maskImage = `linear-gradient(#000 0 0), ${hole}`;
    st.webkitMaskRepeat = st.maskRepeat = 'no-repeat';
    st.webkitMaskSize = st.maskSize = `100% 100%, ${pw}px ${ph}px`;
    st.webkitMaskComposite = 'xor';
    st.maskComposite = 'exclude';
    return { el, base };
  });
  const shift = (dx = 0, dy = 0) => {
    g.setAttribute('transform', `translate(${-dx} ${-dy})`);
    for (const { el, base } of targets) el.style.webkitMaskPosition = el.style.maskPosition = `0 0, ${base.x + dx}px ${base.y + dy}px`;
  };
  shift(0, 0);
  pane.dataset.lens = 'on';
  return {
    shift,
    setStrength: (s) => dm.setAttribute('scale', String(s)),
    destroy() {
      svg.remove();
      for (const { el } of targets) el.style.webkitMaskImage = el.style.maskImage = '';
      pane.dataset.lens = 'off';
    },
  };
}

/** Animate the bend in from 0. */
export function bendIn(lens, to, ms = 900) {
  if (reduced) { lens.setStrength(to); return; }
  const t0 = performance.now();
  const f = (now) => { const t = clamp((now - t0) / ms, 0, 1); lens.setStrength(to * ease.expoOut(t)); if (t < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

export const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
export function placeFixed(el, r, radius) {
  Object.assign(el.style, { position: 'fixed', left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`, borderRadius: `${radius}px` });
}
