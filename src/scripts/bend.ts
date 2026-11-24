// The slab's bend: an inline-SVG copy of exactly what lies under the slab (the masthead glyphs and the
// portrait), displaced at the slab's edges. SVG-native content because WebKit ignores feImage maps in CSS
// filters on HTML. Each glyph is placed from the page's own layout because WebKit also ignores
// letter-spacing on SVG text. The originals are knocked out under the slab only while it is visible.
import { displacementField, assertNoFold } from '../lib/bend-field';

const SVG = 'http://www.w3.org/2000/svg';
const XL = 'http://www.w3.org/1999/xlink';
const maps = new Map<string, string>();

export type Bend = { shift(dx: number, dy: number): void; setStrength(s: number): void; setVisible(on: boolean): void; destroy(): void };

export function bendSupported(): boolean {
  if (matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)').matches) return false;
  const c = document.createElement('canvas');
  return !!c.getContext?.('2d') && typeof SVGFEDisplacementMapElement !== 'undefined';
}

function mapUrl(w: number, h: number, r: number, band: number): string {
  const key = `${Math.round(w)}x${Math.round(h)}r${r}b${band}`;
  const hit = maps.get(key);
  if (hit) return hit;
  const W = Math.round(w), H = Math.round(h);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  img.data.set(displacementField(W, H, r, band));
  ctx.putImageData(img, 0, 0);
  const url = c.toDataURL('image/png');
  maps.set(key, url);
  return url;
}

/** Baseline of a line, measured with an inline-block probe (font metrics vary by engine). */
function baselineOf(line: HTMLElement): number {
  const probe = document.createElement('span');
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  line.appendChild(probe);
  const y = probe.getBoundingClientRect().bottom;
  probe.remove();
  return y;
}

/** Glyph boxes of a line, in viewport coordinates. */
export type Glyph = { ch: string; left: number; right: number; top: number };
export function glyphBoxes(line: HTMLElement): Glyph[] {
  const out: Glyph[] = [];
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    for (let i = 0; i < node.length; i++) {
      const r = document.createRange();
      r.setStart(node, i);
      r.setEnd(node, i + 1);
      const b = r.getBoundingClientRect();
      if (!b.width && node.data[i] !== ' ') continue;
      out.push({ ch: node.data[i], left: b.left, right: b.right, top: b.top });
    }
  }
  return out;
}

export function buildBend(
  pane: HTMLElement,
  root: HTMLElement,
  o: { lines: HTMLElement[]; images: HTMLImageElement[]; band: number; strength: number },
): Bend | null {
  if (!bendSupported()) { pane.dataset.bend = 'off'; return null; }
  assertNoFold(o.strength, o.band);
  pane.querySelector('svg.bend')?.remove();
  const R = root.getBoundingClientRect();
  const P = pane.getBoundingClientRect();
  if (!P.width || !P.height) { pane.dataset.bend = 'off'; return null; }
  const px = P.left - R.left, py = P.top - R.top, pw = P.width, ph = P.height;
  const radius = parseFloat(getComputedStyle(pane).borderTopLeftRadius) || 24;
  const id = `bend-${Math.random().toString(36).slice(2, 7)}`;
  const pad = o.band * 2;

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'bend');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('viewBox', `${px} ${py} ${pw} ${ph}`);
  svg.innerHTML = `<defs>
    <clipPath id="${id}-c"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${radius}"/></clipPath>
    <filter id="${id}" x="${px - pad}" y="${py - pad}" width="${pw + pad * 2}" height="${ph + pad * 2}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${o.strength}" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs><g clip-path="url(#${id}-c)"><g filter="url(#${id})"><g class="bend-content"></g></g></g>`;
  const fe = svg.querySelector('feImage')!;
  const url = mapUrl(pw, ph, radius, o.band);
  fe.setAttribute('href', url);
  fe.setAttributeNS(XL, 'xlink:href', url);
  const content = svg.querySelector<SVGGElement>('g.bend-content')!;
  const dm = svg.querySelector('feDisplacementMap')!;

  for (const img of o.images) {
    const r = img.getBoundingClientRect();
    const im = document.createElementNS(SVG, 'image');
    const src = img.currentSrc || img.src;
    im.setAttribute('href', src);
    im.setAttributeNS(XL, 'xlink:href', src);
    im.setAttribute('x', String(r.left - R.left));
    im.setAttribute('y', String(r.top - R.top));
    im.setAttribute('width', String(r.width));
    im.setAttribute('height', String(r.height));
    im.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    content.appendChild(im);
  }
  for (const line of o.lines) {
    const s = getComputedStyle(line);
    const glyphs = glyphBoxes(line);
    if (!glyphs.length) continue;
    // One <text> per visual line (the phone masthead wraps); the baseline sits a fixed distance below each line's top.
    const rows = new Map<number, Glyph[]>();
    for (const g of glyphs) {
      const key = [...rows.keys()].find((k) => Math.abs(k - g.top) < 4) ?? g.top;
      rows.set(key, [...(rows.get(key) ?? []), g]);
    }
    const lastTop = Math.max(...rows.keys());
    const drop = baselineOf(line) - lastTop;
    for (const [top, row] of rows) {
      const clean = row.filter((g, i) => !(g.ch === ' ' && (i === 0 || i === row.length - 1)));
      const t = document.createElementNS(SVG, 'text');
      t.textContent = clean.map((g) => g.ch).join('');
      t.setAttribute('x', clean.map((g) => (g.left - R.left).toFixed(2)).join(' '));
      t.setAttribute('y', String(top + drop - R.top));
      t.setAttribute('fill', s.color);
      t.style.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      t.style.letterSpacing = '0px';
      t.style.whiteSpace = 'pre';
      content.appendChild(t);
    }
  }
  pane.prepend(svg);

  const hole = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='${SVG}' width='${pw}' height='${ph}'><rect width='${pw}' height='${ph}' rx='${radius}'/></svg>`)}")`;
  const targets = [...o.lines, ...o.images].map((el) => {
    const r = el.getBoundingClientRect();
    return { el, base: { x: P.left - r.left, y: P.top - r.top } };
  });
  let dx = 0, dy = 0, visible = false;
  const paintMasks = () => {
    for (const { el, base } of targets) {
      const st = el.style;
      if (!visible) { st.webkitMaskImage = st.maskImage = ''; continue; }
      st.webkitMaskImage = st.maskImage = `linear-gradient(#000 0 0), ${hole}`;
      st.webkitMaskRepeat = st.maskRepeat = 'no-repeat';
      st.webkitMaskSize = st.maskSize = `100% 100%, ${pw}px ${ph}px`;
      st.webkitMaskPosition = st.maskPosition = `0 0, ${base.x + dx}px ${base.y + dy}px`;
      st.setProperty('-webkit-mask-composite', 'xor');
      st.setProperty('mask-composite', 'exclude');
    }
  };
  pane.dataset.bend = 'on';
  return {
    shift(x, y) {
      dx = x; dy = y;
      content.setAttribute('transform', `translate(${-x} ${-y})`);
      paintMasks();
    },
    setStrength(v) { dm.setAttribute('scale', String(v)); },
    setVisible(on) {
      visible = on;
      svg.style.visibility = on ? 'visible' : 'hidden';
      paintMasks();
    },
    destroy() {
      visible = false;
      paintMasks();
      svg.remove();
      pane.dataset.bend = 'off';
    },
  };
}
