// The slab's bend: an inline-SVG copy of exactly what lies under the slab (the masthead glyphs and the
// portrait), displaced at the slab's edges. SVG-native content because WebKit ignores feImage maps in CSS
// filters on HTML. Each glyph is placed from the page's own layout because WebKit also ignores
// letter-spacing on SVG text. The originals are knocked out under the slab only while it is visible.
import { assertNoFold } from '../lib/bend-field';

const SVG = 'http://www.w3.org/2000/svg';
const XL = 'http://www.w3.org/1999/xlink';
const maps = new Map<string, string>();

/**
 * setVisible(on, knock): `on` draws the bent copy; `knock` (default `on`) also cuts the originals out under the slab.
 * While the slab is still fading in, draw the copy over intact originals (knock false) so the name never dims.
 */
export type Bend = { shift(dx: number, dy: number): void; setStrength(s: number): void; setVisible(on: boolean, knock?: boolean): void; setOpacity(o: number): void; readonly strength: number; destroy(): void };

export function bendSupported(): boolean {
  if (matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)').matches) return false;
  const c = document.createElement('canvas');
  return !!c.getContext?.('2d') && typeof SVGFEDisplacementMapElement !== 'undefined';
}

// The map is built at device resolution (one map pixel per device pixel), so the displaced contours step by
// at most one device pixel: feDisplacementMap samples nearest-neighbour in Chromium and WebKit, and an upscaled
// half-resolution map turned every map pixel into a 2 to 4 device-pixel tooth. The cold build stays cheap because
// only the edge band is computed (one quadrant, mirrored); the centre is a flat neutral fill.
// Nearest-neighbour sampling still leaves one-device-pixel stairs and notches on displaced contours (the "A" leg, the
// "d" stem and foot near the corners): an output pixel takes whichever source pixel is nearest, so anti-aliasing
// pixels are skipped or doubled where the displacement changes. The fix is supersampling inside the filter, in both
// engines: four displacement passes, each offset by a rotated-grid sub-pixel step (in device px), averaged. The
// offsets are weighted by the band (map B channel), so the undisplaced centre stays an exact copy. This replaces the
// old Chromium-only blur (WebKit rounded that blur up to a visible box kernel, so WebKit had no smoothing at all).
const RGSS: [number, number][] = [[-0.375, -0.125], [0.125, -0.375], [0.375, 0.125], [-0.125, 0.375]];
const supersample = (scale: number) => `${RGSS.map((_, i) => `<feColorMatrix in="map" type="matrix" data-ss="${i}" values="${ssMatrix(i, scale)}" result="m${i}"/>
      <feDisplacementMap in="SourceGraphic" in2="m${i}" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d${i}"/>`).join('\n      ')}
      <feComposite in="d0" in2="d1" operator="arithmetic" k1="0" k2=".5" k3=".5" k4="0" result="p"/>
      <feComposite in="d2" in2="d3" operator="arithmetic" k1="0" k2=".5" k3=".5" k4="0" result="q"/>
      <feComposite in="p" in2="q" operator="arithmetic" k1="0" k2=".5" k3=".5" k4="0"/>`;
// The map channel shift that moves a pass by its sub-pixel offset: shift = scale * k * B, so k = offset / scale.
// At scale 0 nothing is displaced (an exact copy); a small scale caps k so the channel stays inside [0, 1].
function ssMatrix(i: number, scale: number): string {
  const [ox, oy] = RGSS[i].map((v) => v / dpr());
  const k = (o: number) => (scale > 0 ? Math.max(-0.45, Math.min(0.45, o / scale)) : 0).toFixed(5);
  return `1 0 ${k(ox)} 0 0  0 1 ${k(oy)} 0 0  0 0 1 0 0  0 0 0 1 0`;
}
const dpr = () => Math.min(3, Math.max(1, window.devicePixelRatio || 1));
const mapKey = (w: number, h: number, r: number, band: number) => `${Math.round(w)}x${Math.round(h)}r${r}b${band}d${dpr()}`;

function sdRR(px: number, py: number, hw: number, hh: number, r: number): number {
  const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
  const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0;
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * The same field as src/lib/bend-field.ts (inward), written straight into a 24-bit top-down BMP: band only, one
 * quadrant mirrored, the centre a flat neutral fill. A BMP needs no compression or checksums, so the cold build
 * costs only the band maths (a canvas PNG encode at device resolution cost more than the field itself).
 */
function bmpField(W: number, H: number, r: number, band: number): Uint8Array<ArrayBuffer> {
  const stride = (W * 3 + 3) & ~3, off = 54;
  const buf = new Uint8Array(off + stride * H);
  // Neutral pixel: B 0 (B carries the supersampling weight, non-zero only in the displaced band), G 128, R 128.
  const rowT = new Uint8Array(stride);
  for (let x = 0; x < W; x++) { rowT[x * 3 + 1] = 128; rowT[x * 3 + 2] = 128; }
  for (let y = 0; y < H; y++) buf.set(rowT, off + y * stride);
  const dv = new DataView(buf.buffer);
  buf[0] = 0x42; buf[1] = 0x4d; dv.setUint32(2, buf.length, true); dv.setUint32(10, off, true);
  dv.setUint32(14, 40, true); dv.setInt32(18, W, true); dv.setInt32(22, -H, true);
  dv.setUint16(26, 1, true); dv.setUint16(28, 24, true); dv.setUint32(34, stride * H, true);
  dv.setInt32(38, 2835, true); dv.setInt32(42, 2835, true);
  const hw = W / 2, hh = H / 2, e = 0.5;
  const qw = Math.ceil(W / 2), qh = Math.ceil(H / 2);
  for (let y = 0; y < qh; y++) {
    const py = y + 0.5 - hh;
    // Rows deeper than the band below the top edge only need their left band (corners included).
    const xEnd = y < band + 1 ? qw : Math.min(qw, Math.ceil(band + r) + 1);
    const row1 = off + y * stride, row2 = off + (H - 1 - y) * stride;
    for (let x = 0; x < xEnd; x++) {
      const px = x + 0.5 - hw;
      const d = -sdRR(px, py, hw, hh, r);
      if (!(d >= 0 && d < band)) continue;
      const gx = sdRR(px + e, py, hw, hh, r) - sdRR(px - e, py, hw, hh, r);
      const gy = sdRR(px, py + e, hw, hh, r) - sdRR(px, py - e, hw, hh, r);
      const gl = Math.hypot(gx, gy) || 1;
      const t = 1 - d / band, m = t * t * (3 - 2 * t);
      const vx = (-gx / gl) * m * 127, vy = (-gy / gl) * m * 127;
      const R1 = Math.round(128 + vx), R2 = Math.round(128 - vx), G1 = Math.round(128 + vy), G2 = Math.round(128 - vy);
      const c1 = x * 3, c2 = (W - 1 - x) * 3; // BGR: G at +1, R at +2
      // Full supersampling from a third of the way into the band; it fades out with the displacement itself.
      const B = Math.round(Math.min(1, 3 * m) * 255);
      buf[row1 + c1] = B; buf[row1 + c1 + 1] = G1; buf[row1 + c1 + 2] = R1;
      buf[row1 + c2] = B; buf[row1 + c2 + 1] = G1; buf[row1 + c2 + 2] = R2;
      buf[row2 + c1] = B; buf[row2 + c1 + 1] = G2; buf[row2 + c1 + 2] = R1;
      buf[row2 + c2] = B; buf[row2 + c2 + 1] = G2; buf[row2 + c2 + 2] = R2;
    }
  }
  return buf;
}

function mapUrl(w: number, h: number, r: number, band: number): string {
  const key = mapKey(w, h, r, band);
  const hit = maps.get(key);
  if (hit) return hit;
  const k = dpr();
  const W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
  const url = URL.createObjectURL(new Blob([bmpField(W, H, r * (W / w), band * (W / w))], { type: 'image/bmp' }));
  maps.set(key, url);
  return url;
}

const paneMapArgs = (pane: HTMLElement) => {
  const prev = { tr: pane.style.translate, tf: pane.style.transform };
  pane.style.translate = 'none'; pane.style.transform = 'none';
  const P = pane.getBoundingClientRect();
  pane.style.translate = prev.tr; pane.style.transform = prev.tf;
  return { w: P.width, h: P.height, r: parseFloat(getComputedStyle(pane).borderTopLeftRadius) || 24 };
};

/** True when the next build for this pane is warm (its map is cached). */
export function bendMapReady(pane: HTMLElement, band: number): boolean {
  const a = paneMapArgs(pane);
  return !bendSupported() || !a.w || !a.h || maps.has(mapKey(a.w, a.h, a.r, band));
}

/** Fill the map cache for a slab of this size ahead of time (call from an idle callback), so the next build is warm. */
export function warmBendMap(pane: HTMLElement, band: number): void {
  if (!bendSupported()) return;
  const a = paneMapArgs(pane);
  if (!a.w || !a.h) return;
  mapUrl(a.w, a.h, a.r, band);
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
export type Glyph = { ch: string; left: number; right: number; top: number; bottom: number };
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
      out.push({ ch: node.data[i], left: b.left, right: b.right, top: b.top, bottom: b.bottom });
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
  // The copy lives in the page, beside the slab (not inside it): it scrolls with the masthead, so between two script
  // updates (threaded scrolling, or a smooth-scroll frame that lands after ours) the copy and the knock-out move
  // together with the originals and never fall out of register. Only the glass edge can trail by that frame.
  const host = pane.parentElement ?? root;
  host.querySelectorAll(':scope > svg.bend').forEach((el) => el.remove());
  const R = host.getBoundingClientRect();
  const P = pane.getBoundingClientRect();
  if (!P.width || !P.height) { pane.dataset.bend = 'off'; return null; }
  const px = P.left - R.left, py = P.top - R.top, pw = P.width, ph = P.height;
  const radius = parseFloat(getComputedStyle(pane).borderTopLeftRadius) || 24;
  const id = `bend-${Math.random().toString(36).slice(2, 7)}`;
  // The filter only samples up to strength / 2 outside the slab.
  const pad = Math.ceil(o.strength / 2) + 4;

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'bend');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('viewBox', `${px} ${py} ${pw} ${ph}`);
  svg.setAttribute('width', String(pw));
  svg.setAttribute('height', String(ph));
  Object.assign(svg.style, { left: `${px}px`, top: `${py}px`, width: `${pw}px`, height: `${ph}px`, borderRadius: `${radius}px` });
  svg.innerHTML = `<defs>
    <clipPath id="${id}-c"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${radius}"/></clipPath>
    <filter id="${id}" x="${px - pad}" y="${py - pad}" width="${pw + pad * 2}" height="${ph + pad * 2}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="none" result="map"/>
      ${supersample(o.strength)}
    </filter></defs><g clip-path="url(#${id}-c)"><g filter="url(#${id})"><g class="bend-content"></g></g></g>`;
  const fe = svg.querySelector('feImage')!;
  const url = mapUrl(pw, ph, radius, o.band);
  fe.setAttribute('href', url);
  fe.setAttributeNS(XL, 'xlink:href', url);
  const content = svg.querySelector<SVGGElement>('g.bend-content')!;
  const dms = [...svg.querySelectorAll('feDisplacementMap')];
  const cms = [...svg.querySelectorAll('feColorMatrix[data-ss]')];

  o.images.forEach((img, i) => {
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
    // The phone portrait dissolves through a CSS mask on its box (Hero.astro, --dsv-*): the copy gets the same one,
    // so the slab never shows parts of the photo the page has faded out.
    const box = img.closest<HTMLElement>('[data-dissolve]');
    const cs = box ? getComputedStyle(box) : null;
    const v = (k: string) => parseFloat(cs?.getPropertyValue(`--dsv-${k}`) ?? '');
    if (box && Number.isFinite(v('rx'))) {
      const b = box.getBoundingClientRect();
      const cx = v('cx') / 100, cy = v('cy') / 100, rx = v('rx') / 100, ry = v('ry') / 100, solid = v('solid') / 100;
      const defs = svg.querySelector('defs')!;
      defs.insertAdjacentHTML('beforeend', `<radialGradient id="${id}-g${i}" gradientUnits="objectBoundingBox" cx="${cx}" cy="${cy}" r="${rx}" gradientTransform="translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})"><stop offset="${solid}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="${id}-m${i}" maskUnits="userSpaceOnUse" x="${b.left - R.left}" y="${b.top - R.top}" width="${b.width}" height="${b.height}"><rect x="${b.left - R.left}" y="${b.top - R.top}" width="${b.width}" height="${b.height}" fill="url(#${id}-g${i})"/></mask>`);
      const g = document.createElementNS(SVG, 'g');
      g.setAttribute('mask', `url(#${id}-m${i})`);
      g.appendChild(im);
      content.appendChild(g);
    } else content.appendChild(im);
  });
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
  pane.before(svg);

  // The knock-out: one mask layer per target, an SVG of a solid rect with the rounded hole cut out
  // (evenodd). One layer means no internal edges, so nothing can seam at a fractional device-pixel
  // ratio (Pixel 7), and no mask-composite (iOS Safari mis-composites exclude/xor and hides the whole
  // element). The image is the target's size plus the slab's on each axis, so the hole can sit anywhere
  // over the target with solid mask around it; moving the slab only changes mask-position.
  const rr = Math.min(radius, pw / 2, ph / 2);
  const targets = [...o.lines, ...o.images].map((el) => {
    const r = el.getBoundingClientRect();
    const w = r.width, h = r.height, mw = 2 * w + pw, mh = 2 * h + ph;
    const n = (v: number) => +v.toFixed(3);
    const hole = `M${n(w + rr)} ${n(h)}H${n(w + pw - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(w + pw)} ${n(h + rr)}V${n(h + ph - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(w + pw - rr)} ${n(h + ph)}H${n(w + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(w)} ${n(h + ph - rr)}V${n(h + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(w + rr)} ${n(h)}Z`;
    const svgSrc = `<svg xmlns="${SVG}" width="${n(mw)}" height="${n(mh)}" viewBox="0 0 ${n(mw)} ${n(mh)}" preserveAspectRatio="none"><path fill-rule="evenodd" d="M0 0H${n(mw)}V${n(mh)}H0Z${hole}"/></svg>`;
    return { el, w, h, base: { x: P.left - r.left, y: P.top - r.top }, image: `url("data:image/svg+xml,${encodeURIComponent(svgSrc)}")`, size: `${n(mw)}px ${n(mh)}px`, on: false };
  });
  let dx = 0, dy = 0, visible = false, knock = false, strength = o.strength;
  const paintMasks = () => {
    for (const t of targets) {
      const st = t.el.style;
      const hx = t.base.x + dx, hy = t.base.y + dy;
      const hit = visible && knock && hx < t.w && hx + pw > 0 && hy < t.h && hy + ph > 0;
      if (!hit) {
        if (t.on) { t.on = false; st.webkitMaskImage = st.maskImage = st.webkitMaskRepeat = st.maskRepeat = st.webkitMaskSize = st.maskSize = st.webkitMaskPosition = st.maskPosition = ''; }
        continue;
      }
      if (!t.on) {
        t.on = true;
        st.webkitMaskImage = st.maskImage = t.image;
        st.webkitMaskRepeat = st.maskRepeat = 'no-repeat';
        st.webkitMaskSize = st.maskSize = t.size;
      }
      st.webkitMaskPosition = st.maskPosition = `${(hx - t.w).toFixed(3)}px ${(hy - t.h).toFixed(3)}px`;
    }
  };
  pane.dataset.bend = 'on';
  return {
    shift(x, y) {
      dx = x; dy = y;
      svg.style.translate = `${x}px ${y}px`;
      content.setAttribute('transform', `translate(${-x} ${-y})`);
      paintMasks();
    },
    setStrength(v) {
      strength = v;
      dms.forEach((d) => d.setAttribute('scale', String(v)));
      cms.forEach((c, i) => c.setAttribute('values', ssMatrix(i, v)));
    },
    setOpacity(v) { svg.style.opacity = v >= 1 ? '' : String(v); },
    get strength() { return strength; },
    setVisible(on, k = on) {
      visible = on; knock = on && k;
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

// Test-only hook (perf gate, head of engineering finding 9): times one build, cold (map cache cleared) by
// default or warm. Stripped from production builds; in dev it still needs the __v3test flag.
if (!import.meta.env.PROD && typeof window !== 'undefined' && (window as unknown as { __v3test?: boolean }).__v3test) {
  (window as unknown as { __bendBuild?: (warm?: boolean) => number | null }).__bendBuild = (warm = false) => {
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const slab = hero?.querySelector<HTMLElement>('[data-slab]');
    const img = hero?.querySelector<HTMLImageElement>('[data-portrait]');
    if (!hero || !slab || !img) return null;
    const phone = innerWidth < 700;
    if (!warm) { maps.forEach((u) => URL.revokeObjectURL(u)); maps.clear(); }
    const t0 = performance.now();
    buildBend(slab, hero, { lines: [...hero.querySelectorAll<HTMLElement>('.mast [data-line]')], images: [img], band: phone ? 20 : 40, strength: phone ? 9 : 18 });
    return performance.now() - t0;
  };
}
