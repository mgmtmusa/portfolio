// Pure maths for the hero slab: clear-edge snapping, rects, the transform-only morph, springs and gestures.

export type Rect = { x: number; y: number; w: number; h: number };

const EPS = 1e-3;
/** Masthead tracking is negative, so neighbouring glyph boxes overlap slightly: a cut leaving under 0.5px is no cut. */
const TOUCH = 0.5;

/** Horizontal glyph intervals, relative to `originX`, of every glyph whose box overlaps the band top..bottom (any row). */
export function glyphsUnder(boxes: { left: number; right: number; top: number; bottom: number }[], top: number, bottom: number, originX = 0): [number, number][] {
  return boxes.filter((g) => g.right > g.left && g.top < bottom && g.bottom > top).map((g) => [g.left - originX, g.right - originX]);
}

/**
 * The narrowest glyph fragment either vertical edge of a pane at x (width w) leaves: Infinity when neither edge
 * cuts a glyph. An edge on a glyph boundary (or within 0.5px of it) cuts nothing.
 */
export function worstFragment(x: number, w: number, glyphs: [number, number][]): number {
  let worst = Infinity;
  for (const e of [x, x + w]) for (const [a, b] of glyphs) if (e > a + TOUCH && e < b - TOUCH) worst = Math.min(worst, e - a, b - e);
  return worst;
}

/** True when both vertical edges leave every glyph fragment at least minFrag wide. */
export const edgesClear = (x: number, w: number, glyphs: [number, number][], minFrag: number) => worstFragment(x, w, glyphs) >= minFrag - EPS;

/**
 * Nearest x (within bounds) where both vertical edges of a pane of width w leave every glyph fragment ≥ minFrag.
 * Exact: the blocked positions are open intervals, so the answer is x itself, a bound or an interval end.
 * When no position in bounds is clear, returns the one whose worst fragment is widest (nearest x on ties).
 */
export function snapClearX(x: number, w: number, glyphs: [number, number][], minFrag: number, bounds: [number, number]): number {
  const [lo, hi] = bounds;
  const start = Math.min(hi, Math.max(lo, x));
  const cands = [start, lo, hi];
  for (const off of [0, w]) {
    for (const [a, b] of glyphs) {
      // An edge at e is blocked on (a, a + minFrag) and (b - minFrag, b), or all of (a, b) when the glyph is narrower than 2 × minFrag.
      cands.push(a - off, b - off, a + minFrag - off, b - minFrag - off);
    }
  }
  let best: number | null = null;
  for (const c of cands) {
    if (c < lo - EPS || c > hi + EPS || !edgesClear(c, w, glyphs, minFrag)) continue;
    if (best === null || Math.abs(c - start) < Math.abs(best - start)) best = c;
  }
  if (best !== null) return Math.min(hi, Math.max(lo, best));
  // Nothing clears: the widest worst fragment, over every glyph boundary (an edge there cuts nothing) and a 0.25px sweep.
  const tries = cands.filter((c) => c >= lo - EPS && c <= hi + EPS);
  for (let c = lo; c <= hi + EPS; c += 0.25) tries.push(c);
  let pick = start, score = worstFragment(start, w, glyphs);
  for (const c of tries) {
    const f = worstFragment(c, w, glyphs);
    if (f > score + EPS || (Math.abs(f - score) <= EPS && Math.abs(c - start) < Math.abs(pick - start))) { pick = c; score = f; }
  }
  return Math.min(hi, Math.max(lo, pick));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/**
 * Transform-only morph of an element laid out at `from` toward `to`. The clip radius is counter-scaled
 * (elliptical radii in local space) so the visible corner stays circular at every scale.
 */
export function flip(from: Rect, to: Rect, t: number, rFrom: number, rTo: number): { transform: string; clip: string } {
  const r = lerpRect(from, to, t);
  const sx = r.w / from.w, sy = r.h / from.h;
  const rad = lerp(rFrom, rTo, t);
  return {
    transform: `translate(${+(r.x - from.x).toFixed(3)}px, ${+(r.y - from.y).toFixed(3)}px) scale(${sx}, ${sy})`,
    clip: `inset(0 round ${(rad / sx).toFixed(3)}px / ${(rad / sy).toFixed(3)}px)`,
  };
}

/** Closed-form spring (Apple's response/damping model): position and velocity at time t (seconds). */
export function springAt(t: number, from: number, to: number, response: number, damping: number, v0: number): { x: number; v: number } {
  const w = (2 * Math.PI) / response;
  const x0 = from - to;
  if (damping >= 1) {
    const e = Math.exp(-w * t);
    const c = v0 + w * x0;
    return { x: to + (x0 + c * t) * e, v: c * e - w * (x0 + c * t) * e };
  }
  const wd = w * Math.sqrt(1 - damping * damping);
  const e = Math.exp(-damping * w * t);
  const B = (v0 + damping * w * x0) / wd;
  const x = e * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t));
  const v = -damping * w * x + e * (-x0 * wd * Math.sin(wd * t) + B * wd * Math.cos(wd * t));
  return { x: to + x, v };
}

/** Where a flick comes to rest (Apple's exponential decay; 0.998 ≈ scroll feel). */
export const project = (v: number, d = 0.998) => ((v / 1000) * d) / (1 - d);

/** Progressive resistance past a boundary. */
export const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

/** A critically damped spring sampled for CSS `linear()`. */
export function springLinear(response: number, durationMs: number, samples = 18): string {
  const w = (2 * Math.PI) / response;
  const pts: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (durationMs / 1000) * (i / samples);
    pts.push(i === samples ? 1 : +(1 - (1 + w * t) * Math.exp(-w * t)).toFixed(4));
  }
  return `linear(${pts.join(', ')})`;
}
