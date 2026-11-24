import { describe, expect, it } from 'vitest';
import { snapClearX, lerpRect, flip, springAt, project, rubberband, springLinear } from '../../src/lib/hero-math';

describe('snapClearX', () => {
  // glyph intervals on one line, in px
  const glyphs: [number, number][] = [[0, 100], [110, 200], [210, 300], [310, 400], [410, 500]];
  it('keeps a position whose edges fall in gaps', () => expect(snapClearX(105, 100, glyphs, 18, [0, 500])).toBe(105));
  it('moves off an edge that would leave a sliver', () => {
    const x = snapClearX(195, 100, glyphs, 18, [0, 500]); // left edge 5px from the end of glyph 2
    const ok = (e: number) => glyphs.every(([a, b]) => e <= a || e >= b || (e - a >= 18 && b - e >= 18));
    expect(ok(x) && ok(x + 100)).toBe(true);
    expect(Math.abs(x - 195)).toBeLessThan(30);
  });
  it('respects the bounds', () => expect(snapClearX(-40, 100, glyphs, 18, [0, 400])).toBeGreaterThanOrEqual(0));
});

describe('rects and flip', () => {
  const a = { x: 0, y: 0, w: 360, h: 244 }, b = { x: 500, y: 800, w: 460, h: 56 };
  it('lerps rects', () => expect(lerpRect(a, b, 0.5)).toEqual({ x: 250, y: 400, w: 410, h: 150 }));
  it('flip is identity at 0', () => expect(flip(a, b, 0, 52, 28).transform).toBe('translate(0px, 0px) scale(1, 1)'));
  it('flip lands on the target at 1, with the clip radius counter-scaled', () => {
    const f = flip(a, b, 1, 52, 28);
    expect(f.transform).toBe(`translate(500px, 800px) scale(${460 / 360}, ${56 / 244})`);
    expect(f.clip).toBe(`inset(0 round ${(28 / (460 / 360)).toFixed(3)}px / ${(28 / (56 / 244)).toFixed(3)}px)`);
  });
});

describe('springs and gestures', () => {
  it('a critically damped spring from rest never overshoots', () => {
    let max = 0;
    for (let t = 0; t <= 2; t += 0.004) max = Math.max(max, springAt(t, 0, 100, 0.5, 1, 0).x);
    expect(max).toBeLessThanOrEqual(100);
    expect(springAt(2, 0, 100, 0.5, 1, 0).x).toBeCloseTo(100, 1);
  });
  it('an underdamped spring does overshoot', () => {
    let max = 0;
    for (let t = 0; t <= 2; t += 0.004) max = Math.max(max, springAt(t, 0, 100, 0.5, 0.6, 0).x);
    expect(max).toBeGreaterThan(100);
  });
  it('projects momentum with Apple’s decay', () => {
    expect(project(1000)).toBeCloseTo(499, 0);
    expect(project(0)).toBe(0);
  });
  it('rubber-bands: the further past, the less it follows', () => {
    expect(rubberband(100, 400)).toBeLessThan(100);
    expect(rubberband(200, 400) - rubberband(100, 400)).toBeLessThan(rubberband(100, 400));
    expect(rubberband(-100, 400)).toBeCloseTo(-rubberband(100, 400));
  });
  it('generates a monotonic CSS linear() spring ending at 1', () => {
    const css = springLinear(0.36, 450, 18);
    const v = css.slice(7, -1).split(',').map(Number);
    expect(v[0]).toBe(0);
    expect(v.at(-1)).toBe(1);
    expect(v.every((x, i) => i === 0 || x >= v[i - 1])).toBe(true);
  });
});
