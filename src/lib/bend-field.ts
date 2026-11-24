// The slab's edge refraction, as data: a displacement field built from the pane's own rounded rectangle.
// Neutral (128) in the centre; inside the outer `band` the sample point shifts along the edge normal.
// Inward (default) magnifies what lies under the rim; outward gathers what lies just beyond it.

function sdRoundRect(px: number, py: number, hw: number, hh: number, r: number): number {
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** RGBA field: R = x offset, G = y offset (128 = none), B = 128, A = 255. */
export function displacementField(w: number, h: number, r: number, band: number, outward = false): Uint8ClampedArray {
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  const out = new Uint8ClampedArray(W * H * 4);
  const hw = W / 2, hh = H / 2, e = 0.5, dir = outward ? 1 : -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - hw, py = y + 0.5 - hh;
      const d = -sdRoundRect(px, py, hw, hh, r);
      let dx = 0, dy = 0;
      if (d >= 0 && d < band) {
        const gx = sdRoundRect(px + e, py, hw, hh, r) - sdRoundRect(px - e, py, hw, hh, r);
        const gy = sdRoundRect(px, py + e, hw, hh, r) - sdRoundRect(px, py - e, hw, hh, r);
        const gl = Math.hypot(gx, gy) || 1;
        const t = 1 - d / band;
        const m = t * t * (3 - 2 * t);
        dx = dir * (gx / gl) * m;
        dy = dir * (gy / gl) * m;
      }
      const i = (y * W + x) * 4;
      out[i] = Math.round(128 + dx * 127);
      out[i + 1] = Math.round(128 + dy * 127);
      out[i + 2] = 128;
      out[i + 3] = 255;
    }
  }
  return out;
}

/** The mapping folds over itself (smear, mirrored glyphs) once the filter scale reaches about 1.2 × band. */
export function assertNoFold(strength: number, band: number): void {
  if (!(strength < 1.2 * band)) throw new Error(`bend would fold: strength ${strength} must be under 1.2 × band (${band})`);
}
