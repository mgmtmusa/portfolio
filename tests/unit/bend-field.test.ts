import { describe, expect, it } from 'vitest';
import { displacementField, assertNoFold } from '../../src/lib/bend-field';

const at = (f: Uint8ClampedArray, w: number, x: number, y: number) => [f[(y * w + x) * 4], f[(y * w + x) * 4 + 1]];

describe('displacementField', () => {
  const w = 200, h = 120, r = 24, band = 20;
  const f = displacementField(w, h, r, band);
  it('is RGBA and sized to the pane', () => expect(f.length).toBe(w * h * 4));
  it('is exactly neutral (128) in the centre', () => expect(at(f, w, 100, 60)).toEqual([128, 128]));
  it('stays neutral beyond the band', () => expect(at(f, w, 100, band + 2)).toEqual([128, 128]));
  it('bends inward by default: near the left edge it samples to the right (R > 128)', () => expect(at(f, w, 2, 60)[0]).toBeGreaterThan(128));
  it('near the top edge it samples downward (G > 128)', () => expect(at(f, w, 100, 2)[1]).toBeGreaterThan(128));
  it('outward flips the direction', () => expect(at(displacementField(w, h, r, band, true), w, 2, 60)[0]).toBeLessThan(128));
  it('blue is neutral and alpha opaque everywhere', () => {
    expect(f[2]).toBe(128);
    expect(f[3]).toBe(255);
  });
});

describe('assertNoFold', () => {
  it('accepts strength under 1.2 × band', () => expect(() => assertNoFold(18, 40)).not.toThrow());
  it('rejects a folding strength', () => expect(() => assertNoFold(48, 40)).toThrow(/fold/));
});
