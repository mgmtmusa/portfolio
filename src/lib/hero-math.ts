// Pure maths for the hero slab: clear-edge snapping, rects, the transform-only morph, springs and gestures.

export type Rect = { x: number; y: number; w: number; h: number };

/** Nearest x (within bounds) where both vertical edges of a pane of width w leave every glyph fragment ≥ minFrag. */
export function snapClearX(x: number, w: number, glyphs: [number, number][], minFrag: number, bounds: [number, number]): number {
  const clear = (e: number) => glyphs.every(([a, b]) => e <= a || e >= b || (e - a >= minFrag && b - e >= minFrag));
  const ok = (v: number) => clear(v) && clear(v + w);
  const [lo, hi] = bounds;
  const start = Math.min(hi, Math.max(lo, Math.round(x)));
  for (let d = 0; d <= hi - lo; d++) {
    if (start - d >= lo && ok(start - d)) return start - d;
    if (start + d <= hi && ok(start + d)) return start + d;
  }
  return start;
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
