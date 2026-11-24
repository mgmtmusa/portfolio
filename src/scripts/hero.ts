// The hero slab (direction C): glide in, drag along the name, let the name slide up through it for 90px,
// then settle into the dock. Built per page load; torn down before every swap.
import { buildBend, bendMapReady, glyphBoxes, warmBendMap, type Bend } from './bend';
import { springAt, project, rubberband, snapClearX, edgesClear, glyphsUnder, flip, type Rect } from '../lib/hero-math';

declare global {
  interface Window { __v3test?: boolean; __bend?: Bend | null; __scene?: { state: () => string; setProgress: (y: number) => void }; __landBuildMs?: number; __heroLog?: { t: number; o: number; knock: boolean }[] }
}

const SLIDE = 90; // px of scroll the name slides through the fixed slab
const BACK = 60; // below this the slab springs back from the dock
const FADE = 240; // ms: the slab and the dock cross-fade over the dock's own fade (--dur-ui)
const FALL = 120; // ms: the bend eases out before the slab leaves, while the blur comes in
const RISE = 200; // ms: the bend eases back in once the slab has settled
let teardown: (() => void) | null = null;
let live: HTMLElement | null = null; // the hero this document is already running (astro:page-load can follow start())

const reducedNow = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
const easeOut = (k: number) => 1 - (1 - k) ** 3;

function init() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero && hero === live && teardown) return; // same page, already running: never replay the entrance
  teardown?.();
  teardown = null;
  live = hero;
  const dock = document.querySelector<HTMLElement>('[data-dock]');
  if (!hero || !dock) {
    if (dock) { dock.dataset.shown = ''; dock.inert = false; }
    return;
  }
  const root = document.documentElement;
  const slab = hero.querySelector<HTMLElement>('[data-slab]')!;
  const shadow = hero.querySelector<HTMLElement>('[data-slab-shadow]')!;
  const img = hero.querySelector<HTMLImageElement>('[data-portrait]')!;
  const lines = [...hero.querySelectorAll<HTMLElement>('.mast [data-line]')];
  const heroCta = hero.querySelector<HTMLElement>('[data-hero-cta]');
  const heroAvail = hero.querySelector<HTMLElement>('[data-hero-avail]');
  const strip = document.querySelector<HTMLElement>('.strip');
  const coarse = matchMedia('(pointer: coarse)').matches;
  // A view-transition arrival (Base.astro marks it): no entrance replay, the slab is simply there.
  const soft = root.classList.contains('soft-nav');
  let phone = false, BAND = 40, STR = 18;
  const sizeClass = () => { phone = matchMedia('(max-width: 639px)').matches; BAND = phone ? 20 : 40; STR = phone ? 9 : 18; };
  sizeClass();
  const off: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(t: Window | Document | HTMLElement, ev: K | string, fn: (e: any) => void, opt?: AddEventListenerOptions) => {
    t.addEventListener(ev, fn, opt);
    off.push(() => t.removeEventListener(ev, fn, opt));
  };
  function showDock(yes: boolean) {
    if (yes) dock!.dataset.shown = ''; else delete dock!.dataset.shown;
    dock!.inert = !yes;
  }

  // The dock never sits over the masthead: hidden from the first frame unless the page is already past the slide.
  showDock(scrollY > SLIDE);
  // The strip is persistent: on a soft arrival it still carries the last page's state.
  if (strip && heroAvail) strip.dataset.availHidden = '';

  // ----- Chrome hand-offs: dock CTA and strip availability stay off-screen while the hero shows them -----
  const fallback = getComputedStyle(slab).display === 'none';
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const vis = en.intersectionRatio >= 0.5;
      if (en.target === heroCta) {
        vis ? (dock.dataset.ctaHidden = '') : delete dock.dataset.ctaHidden;
        // No slab (contrast, reduced transparency, forced colours): the dock arrives once the hero CTA leaves.
        if (fallback) showDock(!vis);
      }
      if (en.target === heroAvail && strip) vis ? (strip.dataset.availHidden = '') : delete strip.dataset.availHidden;
    }
  }, { threshold: [0, 0.5, 1] });
  if (heroCta) io.observe(heroCta);
  if (heroAvail) io.observe(heroAvail);
  off.push(() => { io.disconnect(); delete dock.dataset.ctaHidden; if (strip) delete strip.dataset.availHidden; });
  if (fallback) {
    teardown = () => { off.forEach((f) => f()); showDock(true); };
    return;
  }

  slab.style.transformOrigin = '0 0';
  shadow.style.transformOrigin = '0 0';

  let reduced = reducedNow();
  let bend: Bend | null = null;
  let nudge = 0; // rest offset that keeps both vertical edges clear of glyph slivers
  let built = { dx: 0, s: 0 };
  let dragX = 0, settledX = 0;
  let mode: 'rest' | 'docked' | 'flying' = 'rest';
  let aim: 0 | 1 = 0; // where the current flight is heading
  let holding = false; // the bend easing out before take-off: the slab is still pinned at rest
  let t = 0, tv = 0, stopFlight: (() => void) | null = null;
  let raf = 0;
  let gliding = false, touchMoving = false;

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
  // Creative director, round 1: no fragment under 18u at either edge from 640px up; below 640px the floor is 16px.
  const floor = () => (phone ? 16 : 18 * unit());
  // Glyphs of every masthead row that passes under the slab while the name slides up from `c0` to `c1` px.
  const edgeGlyphs = (c0: number, c1 = c0): [number, number][] => {
    const sy = scrollY;
    const boxes = lines.flatMap((l) => glyphBoxes(l)).filter((g) => g.ch.trim()).map((g) => ({ left: g.left, right: g.right, top: g.top + sy, bottom: g.bottom + sy }));
    return glyphsUnder(boxes, R0.y + c0, R0.y + c1 + R0.h, R0.x);
  };
  const cover = () => (reduced ? 0 : Math.min(scrollY, SLIDE));
  const l1 = () => { const g = glyphBoxes(lines[0]); return { min: Math.min(...g.map((x) => x.left)) - R0.x, max: Math.max(...g.map((x) => x.right)) - R0.x - R0.w }; };
  // Nearest clear x, judged over every row the rest of the slide will bring under the slab; when the whole slide
  // can't be kept clear, over the rows under it now (snapClearX keeps the widest worst fragment if nothing clears).
  const snapX = (x: number, bounds: [number, number], c = cover(), slide = !reduced) => {
    const min = floor();
    if (slide && c < SLIDE) {
      const all = edgeGlyphs(c, SLIDE);
      const n = snapClearX(x, R0.w, all, min, bounds);
      if (edgesClear(n, R0.w, all, min)) return n;
    }
    return snapClearX(x, R0.w, edgeGlyphs(c), min, bounds);
  };

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

  // Rest geometry: the slab's own layout rect plus the clear-edge nudge (every masthead row under it through the
  // slide, ±12u, wider only if needed). Clears every transform first, so it never reads a docked or squashed slab.
  const restGeometry = () => {
    unpin();
    slab.style.transform = ''; slab.style.clipPath = ''; shadow.style.transform = '';
    nudge = 0;
    R0 = measureRest();
    const u = unit(), min = floor();
    // Judged from the top of the slide (scrollY 0), whatever the page's scroll is now (a resize while docked), and the
    // same in either motion mode, so switching reduced motion never moves the slab.
    const near = snapX(0, [-12 * u, 12 * u], 0, true);
    const n = edgesClear(near, R0.w, edgeGlyphs(0), min) ? near : snapX(0, [-48 * u, 48 * u], 0, true);
    nudge = n;
    R0 = { ...R0, x: R0.x + n };
    pin();
  };

  // ----- The bend: built at the rest rect, shown only at rest, eased in and out (never switched at full strength) -----
  let rampRaf = 0;
  const dropBend = () => {
    cancelAnimationFrame(rampRaf);
    bend?.destroy(); bend = null;
    if (window.__v3test) window.__bend = null;
  };
  const opaque = () => (slab.style.opacity || getComputedStyle(slab).opacity) === '1';
  // What the bend should show now, from the scene state.
  const bendWanted = () => (mode === 'rest' || holding) && !(coarse && touchMoving);
  const syncBend = () => {
    if (!bend) return;
    const show = bendWanted();
    bend.setVisible(show, show && opaque());
    slab.dataset.bend = show ? 'on' : 'off';
  };
  let bornAt = 0;
  // Always built from the slab's rest rect: no FLIP transform, clip or drag offset while measuring.
  const buildNow = (strength = STR) => {
    dropBend();
    const prev = { tr: slab.style.translate, tf: slab.style.transform, cp: slab.style.clipPath };
    slab.style.translate = 'none'; slab.style.transform = 'none'; slab.style.clipPath = '';
    // Pinned, the slab is fixed while the hero scrolls, so the copy is offset by the full scroll; unpinned, by nothing.
    built = { dx: 0, s: reduced ? 0 : scrollY };
    bend = buildBend(slab, hero, { lines, images: [img], band: BAND, strength: STR });
    bornAt = performance.now();
    slab.style.translate = prev.tr; slab.style.transform = prev.tf; slab.style.clipPath = prev.cp;
    window.__bend = window.__v3test ? bend : undefined;
    if (bend) { bend.setStrength(strength); syncBend(); place(); }
  };
  const ramp = (to: number, ms: number, done?: () => void) => {
    cancelAnimationFrame(rampRaf);
    if (!bend) { done?.(); return; }
    const from = bend.strength, t0 = performance.now();
    if (reduced || ms <= 0 || from === to) { bend.setStrength(to); done?.(); return; }
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      bend?.setStrength(from + (to - from) * easeOut(k));
      if (k < 1) rampRaf = requestAnimationFrame(step); else done?.();
    };
    rampRaf = requestAnimationFrame(step);
  };
  // Show the bend at rest, easing in from 0. A warm map builds now; a cold one only ever in an idle callback.
  let pendingIdle = false;
  const arrive = () => {
    if (bend) { syncBend(); if (bendWanted() && !gliding) ramp(STR, RISE); return; }
    const go = (warm: boolean) => {
      const t0 = performance.now();
      buildNow(0);
      if (warm && window.__v3test) window.__landBuildMs = performance.now() - t0; // perf gate: a build outside idle is warm
      if (bendWanted() && !gliding) ramp(STR, RISE); // the glide eases a mid-glide arrival in itself
    };
    if (bendMapReady(slab, BAND)) go(true);
    else if (!pendingIdle) {
      pendingIdle = true;
      idle(() => { pendingIdle = false; if (!bend && mode === 'rest') go(false); });
    }
  };

  // On touch, the bend stays off while the slab moves and rises over 200ms once it settles.
  const bendMoving = (moving: boolean) => {
    if (!coarse) return;
    touchMoving = moving;
    if (!bend) return;
    if (moving) { cancelAnimationFrame(rampRaf); bend.setStrength(0); syncBend(); return; }
    syncBend();
    if (bendWanted()) ramp(STR, RISE);
  };

  // ----- Morph to and from the dock (transform and clip-path only), cross-faded with the dock -----
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
  const fadeSlab = (to: '0' | '1', ms: number) => {
    // Keeps the blur's own 120ms ease (Hero.astro) alongside the opacity.
    slab.style.transition = `opacity ${ms}ms ease-out, -webkit-backdrop-filter ${FALL}ms ease-out, backdrop-filter ${FALL}ms ease-out`;
    slab.style.opacity = to;
  };
  let handedOff = false;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  function flyTo(target: 0 | 1) {
    // Anything in progress yields to the flight: the glide, a drag (and its pointer capture), a hold or a ramp.
    stopGlide?.();
    stopDrag?.();
    if (drag) { try { slab.releasePointerCapture(drag.id); } catch { /* already released */ } drag = null; }
    if (coarse && !gliding) touchMoving = false;
    stopFlight?.();
    clearTimeout(hideTimer);
    const easeOutFirst = target === 1 && t === 0 && !reduced && !!bend && bend.strength > 0.01 && bendWanted();
    cancelAnimationFrame(rampRaf);
    mode = 'flying'; aim = target;
    slab.dataset.moving = '';
    slab.style.visibility = '';
    if (target === 0) {
      showDock(false);
      handedOff = false;
      slab.style.pointerEvents = '';
      fadeSlab('1', reduced ? 160 : FADE);
    }
    if (reduced) {
      // A cross-fade in place: no morph, so nothing is left scaled or clipped at the dock.
      holding = false; syncBend();
      t = target; tv = 0;
      slab.style.transform = ''; slab.style.clipPath = ''; shadow.style.transform = '';
      if (target) { fadeSlab('0', 160); showDock(true); }
      shadow.style.opacity = target ? '0' : '1';
      land(target);
      return;
    }
    const takeOff = () => {
      holding = false;
      syncBend();
      const from = t, v0 = tv, t0 = performance.now();
      let alive = true;
      stopFlight = () => { alive = false; };
      const step = (now: number) => {
        if (!alive) return;
        const s = springAt((now - t0) / 1000, from, target, 0.5, 1, v0);
        t = Math.min(1, Math.max(0, s.x)); tv = s.v;
        render();
        // Near the dock the slab hands over: it fades out while the dock fades in, at the same rect.
        if (target === 1 && !handedOff && t >= 0.85) { handedOff = true; slab.style.pointerEvents = 'none'; fadeSlab('0', FADE); showDock(true); }
        if (Math.abs(s.x - target) < 0.001 && Math.abs(s.v) < 0.01) { t = target; tv = 0; render(); land(target); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    // Leaving rest: the bend eases to nothing (pinned, still registered) while the blur comes in, then the slab goes.
    if (easeOutFirst) {
      holding = true;
      let alive = true;
      stopFlight = () => { alive = false; holding = false; cancelAnimationFrame(rampRaf); };
      ramp(0, FALL, () => { if (alive) takeOff(); });
      return;
    }
    takeOff();
  }
  function land(target: 0 | 1) {
    stopFlight = null;
    holding = false;
    delete slab.dataset.moving;
    if (target === 1) {
      mode = 'docked';
      // The glide or a drag may have left the slab off its settled x; the next return starts from there.
      dragX = settledX;
      shadow.style.opacity = '0';
      showDock(true);
      slab.style.pointerEvents = 'none';
      syncBend();
      if (reduced) {
        // Hidden once the 160ms cross-fade has finished.
        hideTimer = setTimeout(() => { if (mode === 'docked') slab.style.visibility = 'hidden'; }, 170);
      } else {
        // Already faded out at the dock; at opacity 0 the return can fade it back in against the dock.
        slab.style.transition = ''; slab.style.opacity = '0'; slab.style.visibility = 'hidden';
      }
    } else {
      mode = 'rest';
      handedOff = false;
      slab.style.visibility = '';
      slab.style.pointerEvents = '';
      showDock(false);
      place();
      // A bend dropped while away (dock arrival, resize, fonts, motion change) is rebuilt from the rest rect.
      arrive();
      setTimeout(() => { if (mode === 'rest') slab.style.transition = ''; }, FADE);
    }
  }

  // ----- Scroll -----
  let scrollRest: ReturnType<typeof setTimeout> | undefined;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const s = scrollY;
      const flying = mode === 'flying';
      if (s > SLIDE && (mode === 'rest' || (flying && aim === 0))) flyTo(1);
      else if (s < BACK && (mode === 'docked' || (flying && aim === 1))) flyTo(0);
      else if (mode === 'rest' || holding) {
        place();
        if (coarse && mode === 'rest') { bendMoving(true); clearTimeout(scrollRest); scrollRest = setTimeout(() => bendMoving(false), 140); }
      }
    });
  };

  // ----- Drag: horizontal, 1:1, rubber-banded past line 1, momentum projected, snapped clear of glyph edges -----
  let drag: { id: number; sx: number; x0: number; hist: { t: number; x: number }[] } | null = null;
  let stopDrag: (() => void) | null = null;
  on(slab, 'pointerdown', (e: PointerEvent) => {
    if (mode !== 'rest' || e.button > 0) return;
    stopGlide?.(); // catch the slab mid-glide where it is
    stopDrag?.();
    slab.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, sx: e.clientX, x0: dragX, hist: [{ t: e.timeStamp, x: e.clientX }] };
    bendMoving(true);
  });
  on(slab, 'pointermove', (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.hist.push({ t: e.timeStamp, x: e.clientX });
    if (drag.hist.length > 12) drag.hist.shift();
    const b = l1();
    let x = drag.x0 + (e.clientX - drag.sx);
    if (x < b.min) x = b.min - rubberband(b.min - x, innerWidth);
    else if (x > b.max) x = b.max + rubberband(x - b.max, innerWidth);
    dragX = x;
    place();
  });
  // Release velocity over the last 100ms up to the release itself: a pause before letting go means no fling.
  const releaseVelocity = (h: { t: number; x: number }[], tUp: number, xUp: number) => {
    const recent = h.filter((p) => tUp - p.t <= 100);
    if (!recent.length) return 0;
    const a = recent[0];
    return ((xUp - a.x) / Math.max(16, tUp - a.t)) * 1000;
  };
  const release = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const v = releaseVelocity(drag.hist, e.timeStamp, e.clientX);
    drag = null;
    const b = l1();
    const projected = Math.min(b.max, Math.max(b.min, reduced ? dragX : dragX + project(v)));
    const target = snapX(projected, [b.min, b.max]);
    if (reduced) { dragX = target; settledX = target; place(); bendMoving(false); return; }
    const from = dragX, t0 = performance.now();
    let alive = true;
    stopDrag = () => { alive = false; stopDrag = null; };
    const step = (now: number) => {
      if (!alive) return;
      const s = springAt((now - t0) / 1000, from, target, 0.6, 1, v);
      dragX = s.x; place();
      if (Math.abs(s.x - target) < 0.3 && Math.abs(s.v) < 2) { stopDrag = null; dragX = target; settledX = target; place(); bendMoving(false); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  on(slab, 'pointerup', release);
  on(slab, 'pointercancel', release);

  // ----- Start -----
  let stopGlide: (() => void) | null = null;
  const settle = () => { slab.style.opacity = '1'; shadow.style.opacity = '1'; slab.style.translate = 'none'; shadow.style.translate = 'none'; };
  const start = () => {
    restGeometry();
    if (scrollY > SLIDE) {
      // Back or a restored scroll: arrive docked. The bend waits for the return to rest (land(0)).
      mode = 'docked'; t = 1;
      settle();
      if (!reduced) render();
      slab.style.opacity = '0'; slab.style.visibility = 'hidden'; slab.style.pointerEvents = 'none'; shadow.style.opacity = '0';
      showDock(true);
      dropBend();
      return;
    }
    showDock(false);
    if (reduced || soft) { settle(); place(); arrive(); return; }
    // Glide in from −240u: opacity over the first 200ms, a critically damped spring (response 1.1). The originals
    // stay intact until the slab is opaque, so the name never dims under it; the bend eases in with the glide.
    const startX = -240 * (R0.w / 360);
    dragX = startX;
    gliding = true;
    if (coarse) touchMoving = true;
    place();
    arrive();
    const t0 = performance.now();
    let alive = true;
    stopGlide = () => {
      alive = false; stopGlide = null; gliding = false;
      if (coarse) touchMoving = false;
      slab.style.opacity = shadow.style.opacity = '1';
      settledX = 0;
      syncBend();
    };
    const step = (now: number) => {
      if (!alive) return;
      const el = (now - t0) / 1000;
      const s = springAt(el, startX, 0, 1.1, 1, 0);
      dragX = s.x;
      const o = String(Math.min(1, el / 0.2));
      const wasOpaque = opaque();
      slab.style.opacity = o; shadow.style.opacity = o;
      place();
      // A bend that arrives mid-glide (its cold build waits for idle) eases in over 200ms on top of the glide's own rise.
      if (bend && !coarse) { cancelAnimationFrame(rampRaf); bend.setStrength(STR * Math.min(1, el / 1.1) * easeOut(Math.min(1, (now - bornAt) / RISE))); }
      if (opaque() !== wasOpaque) syncBend();
      if (window.__v3test) (window.__heroLog ??= []).push({ t: el, o: +o, knock: lines.some((l) => !!(l.style.maskImage || l.style.webkitMaskImage)) });
      if (Math.abs(s.x) < 0.3 && el > 0.3) {
        stopGlide = null; gliding = false; dragX = 0; settledX = 0; place();
        if (coarse) bendMoving(false); else ramp(STR, RISE);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  // The glide starts 400ms after first paint (DESIGN.md load order) or as soon as this module runs, if later.
  // It no longer waits for `load` plus idle: only a cold bend build waits for idle, and the glide doesn't need it.
  const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
  const startTimer = setTimeout(start, soft ? 0 : Math.max(0, fcp + 400 - performance.now()));
  off.push(() => clearTimeout(startTimer));

  on(window, 'scroll', onScroll, { passive: true });
  let lastW = innerWidth;
  on(window, 'resize', () => {
    if (innerWidth === lastW) return; // iOS fires resize as its toolbar moves
    lastW = innerWidth;
    sizeClass();
    stopDrag?.(); drag = null;
    dragX = settledX = 0;
    restGeometry();
    // Drop the bend (and its mask hole); at rest it comes back (warm now, or cold in idle); away, land(0) brings it.
    dropBend();
    if (mode === 'rest') arrive();
    else {
      if (t > 0 && !reduced) render();
      const band = BAND;
      idle(() => { if (!bend) warmBendMap(slab, band); });
    }
    place();
  });
  on(document.fonts as unknown as HTMLElement, 'loadingdone', () => {
    if (mode === 'rest' && !drag && !gliding && !stopDrag) { restGeometry(); dropBend(); arrive(); }
    else if (mode !== 'rest') dropBend();
  });
  on(window, 'motionchange', () => {
    reduced = reducedNow();
    stopGlide?.(); stopFlight?.(); stopDrag?.(); drag = null; holding = false;
    clearTimeout(hideTimer);
    slab.style.transition = ''; delete slab.dataset.moving;
    slab.style.translate = shadow.style.translate = 'none';
    dragX = settledX = 0;
    restGeometry(); // also resets transform and clip-path
    const docked = mode === 'docked' || (mode === 'flying' && aim === 1);
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
  // QA only (dev server): ?qa-y=45 holds the page part-way through the slide for the iOS Simulator capture.
  if (import.meta.env.DEV) {
    const y = Number(new URLSearchParams(location.search).get('qa-y'));
    if (y > 0) setTimeout(() => scrollTo(0, y), 1200);
  }

  teardown = () => {
    off.forEach((f) => f());
    stopGlide?.(); stopFlight?.(); stopDrag?.(); cancelAnimationFrame(raf); cancelAnimationFrame(rampRaf); clearTimeout(scrollRest); clearTimeout(hideTimer);
    bend?.destroy(); bend = null;
    unpin();
    slab.style.pointerEvents = '';
    showDock(true);
    window.__bend = undefined; window.__scene = undefined;
  };
}

let wired = false;
/** Called once when the module loads (after first paint); later navigations re-run init on astro:page-load. */
export function start() {
  if (!wired) {
    wired = true;
    document.addEventListener('astro:page-load', init);
    document.addEventListener('astro:before-swap', () => { teardown?.(); teardown = null; live = null; });
  }
  init();
}
