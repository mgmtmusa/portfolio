// The hero slab (direction C): glide in, drag along the name, let the name slide up through it for 90px,
// then settle into the dock. Built per page load; torn down before every swap.
import { buildBend, glyphBoxes, warmBendMap, type Bend } from './bend';
import { springAt, project, rubberband, snapClearX, edgesClear, glyphsUnder, flip, type Rect } from '../lib/hero-math';

declare global {
  interface Window { __v3test?: boolean; __bend?: Bend | null; __scene?: { state: () => string; setProgress: (y: number) => void }; __landBuildMs?: number }
}

const SLIDE = 90; // px of scroll the name slides through the fixed slab
const BACK = 60; // below this the slab springs back from the dock
let teardown: (() => void) | null = null;

const reducedNow = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));

function init() {
  teardown?.();
  teardown = null;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const dock = document.querySelector<HTMLElement>('[data-dock]');
  if (!hero || !dock) {
    if (dock) { dock.dataset.shown = ''; dock.inert = false; }
    return;
  }
  const slab = hero.querySelector<HTMLElement>('[data-slab]')!;
  const shadow = hero.querySelector<HTMLElement>('[data-slab-shadow]')!;
  const img = hero.querySelector<HTMLImageElement>('[data-portrait]')!;
  const lines = [...hero.querySelectorAll<HTMLElement>('.mast [data-line]')];
  const heroCta = hero.querySelector<HTMLElement>('[data-hero-cta]');
  const heroAvail = hero.querySelector<HTMLElement>('[data-hero-avail]');
  const strip = document.querySelector<HTMLElement>('.strip');
  const coarse = matchMedia('(pointer: coarse)').matches;
  let phone = false, BAND = 40, STR = 18;
  const sizeClass = () => { phone = matchMedia('(max-width: 639px)').matches; BAND = phone ? 20 : 40; STR = phone ? 9 : 18; };
  sizeClass();
  const off: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(t: Window | Document | HTMLElement, ev: K | string, fn: (e: any) => void, opt?: AddEventListenerOptions) => {
    t.addEventListener(ev, fn, opt);
    off.push(() => t.removeEventListener(ev, fn, opt));
  };
  if (getComputedStyle(slab).display === 'none') { showDock(true); return; }
  slab.style.transformOrigin = '0 0';
  shadow.style.transformOrigin = '0 0';

  let reduced = reducedNow();
  let bend: Bend | null = null;
  let nudge = 0; // rest offset that keeps both vertical edges clear of glyph slivers
  let built = { dx: 0, s: 0 };
  let dragX = 0, settledX = 0;
  let mode: 'rest' | 'docked' | 'flying' = 'rest';
  let t = 0, tv = 0, stopFlight: (() => void) | null = null;
  let raf = 0;

  // Geometry at rest, in viewport coordinates as if scrollY were 0.
  const measureRest = (): Rect => {
    const prev = { tr: slab.style.translate, tf: slab.style.transform };
    slab.style.translate = 'none';
    slab.style.transform = 'none';
    const r = slab.getBoundingClientRect();
    slab.style.translate = prev.tr;
    slab.style.transform = prev.tf;
    return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
  };
  let R0 = measureRest();
  const radius = () => parseFloat(getComputedStyle(slab).borderTopLeftRadius) || 52;
  const unit = () => R0.w / (phone ? 210 : 360);
  // Glyphs of every masthead row under the slab (relative to R0.x), with the name slid up by `cover` px.
  const edgeGlyphs = (cover: number): [number, number][] => {
    const sy = scrollY;
    const boxes = lines.flatMap((l) => glyphBoxes(l)).filter((g) => g.ch.trim()).map((g) => ({ left: g.left, right: g.right, top: g.top + sy, bottom: g.bottom + sy }));
    return glyphsUnder(boxes, R0.y + cover, R0.y + cover + R0.h, R0.x);
  };
  const cover = () => (reduced ? 0 : Math.min(scrollY, SLIDE));
  const l1 = () => { const g = glyphBoxes(lines[0]); return { min: Math.min(...g.map((x) => x.left)) - R0.x, max: Math.max(...g.map((x) => x.right)) - R0.x - R0.w }; };

  function showDock(yes: boolean) {
    if (yes) dock!.dataset.shown = ''; else delete dock!.dataset.shown;
    dock!.inert = !yes;
  }

  // While at rest the slab is pinned where it sits at scrollY 0 (fixed), so the name slides up through it.
  const pin = () => {
    // Reduced motion: the slab scrolls with the hero (no scroll-linked motion); only the rest nudge applies.
    if (reduced) { slab.style.marginLeft = shadow.style.marginLeft = `${nudge}px`; return; }
    slab.style.removeProperty('margin-left'); shadow.style.removeProperty('margin-left');
    Object.assign(slab.style, { position: 'fixed', left: `${R0.x}px`, top: `${R0.y}px`, width: `${R0.w}px`, height: `${R0.h}px` });
    Object.assign(shadow.style, { position: 'fixed', left: `${R0.x}px`, top: `${R0.y}px`, width: `${R0.w}px`, height: `${R0.h}px` });
  };
  const unpin = () => {
    for (const el of [slab, shadow]) for (const k of ['position', 'left', 'top', 'width', 'height', 'margin-left']) el.style.removeProperty(k);
  };
  const place = () => {
    slab.style.translate = `${dragX}px 0`;
    shadow.style.translate = `${dragX}px 0`;
    if (bend) bend.shift(dragX - built.dx, cover() - built.s);
  };

  // Rest geometry: the slab's own layout rect plus the clear-edge nudge (every masthead row under it,
  // ±12u, wider only if needed). Clears every transform first, so it never reads a docked or squashed slab.
  const restGeometry = () => {
    unpin();
    slab.style.transform = ''; slab.style.clipPath = ''; shadow.style.transform = '';
    nudge = 0;
    R0 = measureRest();
    const u = unit(), gl = edgeGlyphs(0), min = 18 * u;
    let n = snapClearX(0, R0.w, gl, min, [-12 * u, 12 * u]);
    // No clear x within ±48u keeps the widest worst fragment (snapClearX's fallback); the design call is the creative director's.
    if (!edgesClear(n, R0.w, gl, min)) n = snapClearX(0, R0.w, gl, min, [-48 * u, 48 * u]);
    nudge = n;
    R0 = { ...R0, x: R0.x + n };
    pin();
  };

  const dropBend = () => {
    bend?.destroy(); bend = null;
    if (window.__v3test) window.__bend = null;
  };
  // Always built from the slab's rest rect: no FLIP transform, clip or drag offset while measuring.
  const buildNow = () => {
    dropBend();
    const prev = { tr: slab.style.translate, tf: slab.style.transform, cp: slab.style.clipPath };
    slab.style.translate = 'none'; slab.style.transform = 'none'; slab.style.clipPath = '';
    // Pinned, the slab is fixed while the hero scrolls, so the copy is offset by the full scroll; unpinned, by nothing.
    built = { dx: 0, s: reduced ? 0 : scrollY };
    bend = buildBend(slab, hero, { lines, images: [img], band: BAND, strength: STR });
    slab.style.translate = prev.tr; slab.style.transform = prev.tf; slab.style.clipPath = prev.cp;
    window.__bend = window.__v3test ? bend : undefined;
    const opacity = slab.style.opacity || getComputedStyle(slab).opacity;
    if (bend) { bend.setVisible(opacity !== '0' && mode === 'rest'); place(); }
  };

  // On touch, the bend stays off while the slab moves and rises over 200ms once it settles.
  let riseRaf = 0;
  const bendMoving = (moving: boolean) => {
    if (!bend || !coarse) return;
    cancelAnimationFrame(riseRaf);
    if (moving) { bend.setStrength(0); bend.setVisible(false); slab.dataset.bend = 'off'; return; }
    bend.setVisible(true); slab.dataset.bend = 'on';
    const t0 = performance.now();
    const step = (now: number) => { const k = Math.min(1, (now - t0) / 200); bend?.setStrength(STR * (1 - (1 - k) ** 3)); if (k < 1) riseRaf = requestAnimationFrame(step); };
    riseRaf = requestAnimationFrame(step);
  };

  // ----- Morph to and from the dock (transform and clip-path only) -----
  const dockRect = (): Rect => { const r = dock.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const restRect = (): Rect => ({ x: R0.x + dragX, y: R0.y, w: R0.w, h: R0.h });
  function render() {
    if (t <= 0) {
      slab.style.transform = ''; slab.style.clipPath = ''; shadow.style.transform = ''; shadow.style.opacity = '1';
      return;
    }
    const from = restRect(), to = dockRect();
    const f = flip({ ...from, x: R0.x, y: R0.y }, { ...to, x: to.x - dragX }, t, radius(), 28);
    slab.style.transform = f.transform;
    slab.style.clipPath = f.clip;
    shadow.style.transform = f.transform;
    shadow.style.opacity = String(1 - t);
  }
  function flyTo(target: 0 | 1) {
    stopFlight?.();
    mode = 'flying';
    slab.dataset.moving = '';
    bend?.setVisible(false);
    if (target === 0) showDock(false);
    slab.style.visibility = '';
    if (reduced) {
      // A cross-fade in place: no morph, so nothing is left scaled or clipped at the dock.
      t = target; tv = 0;
      slab.style.transform = ''; slab.style.clipPath = ''; shadow.style.transform = '';
      slab.style.transition = 'opacity 160ms ease-out';
      slab.style.opacity = target ? '0' : '1';
      shadow.style.opacity = target ? '0' : '1';
      land(target);
      return;
    }
    slab.style.transition = ''; slab.style.opacity = '1';
    const from = t, v0 = tv, t0 = performance.now();
    let alive = true;
    stopFlight = () => { alive = false; };
    const step = (now: number) => {
      if (!alive) return;
      const s = springAt((now - t0) / 1000, from, target, 0.5, 1, v0);
      t = Math.min(1, Math.max(0, s.x)); tv = s.v;
      render();
      if (Math.abs(s.x - target) < 0.001 && Math.abs(s.v) < 0.01) { t = target; tv = 0; render(); land(target); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function land(target: 0 | 1) {
    stopFlight = null;
    delete slab.dataset.moving;
    if (target === 1) {
      mode = 'docked';
      slab.style.visibility = 'hidden';
      shadow.style.opacity = '0';
      showDock(true);
    } else {
      mode = 'rest';
      slab.style.visibility = '';
      showDock(false);
      // A bend dropped while away (dock arrival, resize, fonts, motion change) is rebuilt from the rest rect.
      if (bend) bend.setVisible(true);
      else {
        const t0 = performance.now();
        buildNow();
        if (window.__v3test) window.__landBuildMs = performance.now() - t0; // perf gate: this build sits inside the landing
      }
      place();
    }
  }

  // ----- Scroll -----
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const s = scrollY;
      if ((mode === 'rest' || (mode === 'flying' && tv <= 0)) && s > SLIDE) flyTo(1);
      else if ((mode === 'docked' || (mode === 'flying' && tv > 0)) && s < BACK) flyTo(0);
      else if (mode === 'rest') {
        place();
        if (coarse) { bendMoving(true); clearTimeout(scrollRest); scrollRest = setTimeout(() => bendMoving(false), 140); }
      }
    });
  };
  let scrollRest: ReturnType<typeof setTimeout> | undefined;

  // ----- Drag: horizontal, 1:1, rubber-banded past line 1, momentum projected, snapped clear of glyph edges -----
  let drag: { id: number; sx: number; x0: number; hist: { t: number; x: number }[] } | null = null;
  let stopDrag: (() => void) | null = null;
  on(slab, 'pointerdown', (e: PointerEvent) => {
    if (mode !== 'rest' || e.button > 0) return;
    stopDrag?.();
    slab.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, sx: e.clientX, x0: dragX, hist: [{ t: e.timeStamp, x: e.clientX }] };
    bendMoving(true);
  });
  on(slab, 'pointermove', (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.hist.push({ t: e.timeStamp, x: e.clientX });
    if (drag.hist.length > 6) drag.hist.shift();
    const b = l1();
    let x = drag.x0 + (e.clientX - drag.sx);
    if (x < b.min) x = b.min - rubberband(b.min - x, innerWidth);
    else if (x > b.max) x = b.max + rubberband(x - b.max, innerWidth);
    dragX = x;
    place();
  });
  const release = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const h = drag.hist, a = h[0], z = h[h.length - 1];
    const v = ((z.x - a.x) / Math.max(1, z.t - a.t)) * 1000;
    drag = null;
    const b = l1();
    const projected = Math.min(b.max, Math.max(b.min, reduced ? dragX : dragX + project(v)));
    const target = snapClearX(projected, R0.w, edgeGlyphs(cover()), 18 * unit(), [b.min, b.max]);
    if (reduced) { dragX = target; settledX = target; place(); bendMoving(false); return; }
    const from = dragX, t0 = performance.now();
    let alive = true;
    stopDrag = () => { alive = false; };
    const step = (now: number) => {
      if (!alive) return;
      const s = springAt((now - t0) / 1000, from, target, 0.6, 1, v);
      dragX = s.x; place();
      if (Math.abs(s.x - target) < 0.3 && Math.abs(s.v) < 2) { dragX = target; settledX = target; place(); bendMoving(false); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  on(slab, 'pointerup', release);
  on(slab, 'pointercancel', release);

  // ----- Chrome hand-offs: dock CTA and strip availability stay off-screen while the hero shows them -----
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const vis = en.intersectionRatio >= 0.5;
      if (en.target === heroCta) vis ? (dock.dataset.ctaHidden = '') : delete dock.dataset.ctaHidden;
      if (en.target === heroAvail && strip) vis ? (strip.dataset.availHidden = '') : delete strip.dataset.availHidden;
    }
  }, { threshold: [0, 0.5, 1] });
  if (heroCta) io.observe(heroCta);
  if (heroAvail) io.observe(heroAvail);
  off.push(() => { io.disconnect(); delete dock.dataset.ctaHidden; if (strip) delete strip.dataset.availHidden; });

  // ----- Start -----
  let stopGlide: (() => void) | null = null;
  const start = () => {
    restGeometry();
    if (scrollY > SLIDE) {
      // Back or a restored scroll: arrive docked. The bend waits for the return to rest (land(0)).
      mode = 'docked'; t = 1;
      slab.style.opacity = '1'; slab.style.translate = 'none'; shadow.style.translate = 'none';
      if (!reduced) render();
      slab.style.visibility = 'hidden'; shadow.style.opacity = '0';
      showDock(true);
      dropBend();
      return;
    }
    showDock(false);
    if (reduced) { slab.style.opacity = '1'; shadow.style.opacity = '1'; slab.style.translate = 'none'; shadow.style.translate = 'none'; buildNow(); return; }
    // Glide in from −240u: opacity over the first 200ms, a critically damped spring (response 1.1).
    const startX = -240 * (R0.w / 360);
    dragX = startX; // so place() inside buildNow() writes the glide's first position, not 0
    buildNow();
    bend?.setStrength(0);
    bendMoving(true);
    const t0 = performance.now();
    let alive = true;
    stopGlide = () => { alive = false; stopGlide = null; slab.style.opacity = shadow.style.opacity = '1'; };
    const step = (now: number) => {
      if (!alive) return;
      const el = (now - t0) / 1000;
      const s = springAt(el, startX, 0, 1.1, 1, 0);
      dragX = s.x;
      const o = String(Math.min(1, el / 0.2));
      slab.style.opacity = o; shadow.style.opacity = o;
      place();
      if (!coarse && bend) { bend.setVisible(true); bend.setStrength(STR * Math.min(1, el / 1.1)); }
      if (Math.abs(s.x) < 0.3 && el > 0.3) { stopGlide = null; dragX = 0; settledX = 0; place(); if (!coarse) bend?.setStrength(STR); bendMoving(false); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const go = () => start();
  if (document.readyState === 'complete') idle(go); else on(window, 'load', () => idle(go), { once: true });

  on(window, 'scroll', onScroll, { passive: true });
  let lastW = innerWidth;
  on(window, 'resize', () => {
    if (innerWidth === lastW) return; // iOS fires resize as its toolbar moves
    lastW = innerWidth;
    sizeClass();
    stopDrag?.(); drag = null;
    dragX = settledX = 0;
    restGeometry();
    // At rest, rebuild now; anywhere else, drop the bend (and its mask hole) so land(0) rebuilds it,
    // and warm the displacement map for the new size while idle so that rebuild is never cold.
    if (mode === 'rest') buildNow();
    else {
      dropBend();
      if (t > 0 && !reduced) render();
      const band = BAND;
      idle(() => { if (!bend) warmBendMap(slab, band); });
    }
    place();
  });
  on(document.fonts as unknown as HTMLElement, 'loadingdone', () => { if (mode === 'rest') buildNow(); else dropBend(); });
  on(window, 'motionchange', () => {
    reduced = reducedNow();
    stopGlide?.(); stopFlight?.(); stopDrag?.(); drag = null;
    slab.style.transition = ''; delete slab.dataset.moving;
    slab.style.translate = shadow.style.translate = 'none';
    dragX = settledX = 0;
    restGeometry(); // also resets transform and clip-path
    const docked = mode === 'docked' || (mode === 'flying' && scrollY > BACK);
    t = docked ? 1 : 0; tv = 0;
    slab.style.opacity = '1';
    dropBend();
    if (docked) {
      if (!reduced) render(); // sit on the dock so the spring back starts there
      land(1);
    } else {
      shadow.style.opacity = '1';
      land(0);
    }
  });

  if (window.__v3test) {
    window.__scene = {
      state: () => mode,
      setProgress: (y: number) => { scrollTo(0, y); onScroll(); },
    };
  }

  teardown = () => {
    off.forEach((f) => f());
    stopGlide?.(); stopFlight?.(); stopDrag?.(); cancelAnimationFrame(raf); cancelAnimationFrame(riseRaf); clearTimeout(scrollRest);
    bend?.destroy(); bend = null;
    unpin();
    showDock(true);
    window.__bend = undefined; window.__scene = undefined;
  };
}

let wired = false;
/** Called once when the module loads (after `load`); later navigations re-run init on astro:page-load. */
export function start() {
  if (!wired) {
    wired = true;
    document.addEventListener('astro:page-load', init);
    document.addEventListener('astro:before-swap', () => { teardown?.(); teardown = null; });
  }
  init();
}
