import { describe, expect, it } from 'vitest';
import { snapClearX, worstFragment, edgesClear, glyphsUnder, lerpRect, flip, springAt, project, rubberband, springLinear } from '../../src/lib/hero-math';

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
  it('finds a clear spot on a glyph boundary that whole-pixel steps miss', () => {
    // touching glyphs (no gaps), boundaries at fractional x; the only clear spots put both edges on boundaries
    const tight: [number, number][] = [[0, 30.4], [30.4, 60.8], [60.8, 91.2], [91.2, 121.6], [121.6, 152]];
    const x = snapClearX(25, 60.8, tight, 18, [0, 91.2]);
    expect(edgesClear(x, 60.8, tight, 18)).toBe(true);
    expect(x).toBeCloseTo(30.4, 6);
  });
  it('allows a fragment of exactly minFrag', () => {
    const wide: [number, number][] = [[0, 100]];
    expect(snapClearX(10, 300, wide, 18, [-50, 50])).toBeCloseTo(18, 6);
  });
  it('when nothing in bounds is clear, keeps the widest worst fragment', () => {
    const narrow: [number, number][] = [[0, 20], [20, 40], [40, 60], [60, 80]];
    // a 100px pane inside [-10, 10]: the right edge always lands between 90 and 110 (clear), the left edge in [-10, 10]
    const x = snapClearX(5, 100, [...narrow, [-20, 0]], 30, [5, 15]);
    // every candidate cuts a 20px glyph (minFrag 30 is impossible); the best leaves 10px each side of the cut glyph
    expect(worstFragment(x, 100, [...narrow, [-20, 0]])).toBeCloseTo(10, 1);
    expect(x).toBeCloseTo(10, 1);
  });
});

describe('edge fragments over every row', () => {
  const boxes = [
    { left: 20, right: 60, top: 0, bottom: 70 }, // row 1, above the pane
    { left: 60, right: 110, top: 60, bottom: 130 }, // row 2, under the pane
    { left: 20, right: 90, top: 120, bottom: 190 }, // row 3, its top under the pane
    { left: 90, right: 90, top: 60, bottom: 130 }, // zero width: ignored
  ];
  it('keeps glyphs of every row that overlaps the pane, relative to its left', () => {
    expect(glyphsUnder(boxes, 80, 150, 10)).toEqual([[50, 100], [10, 80]]);
  });
  it('drops rows wholly above or below', () => {
    expect(glyphsUnder(boxes, 200, 260)).toEqual([]);
    expect(glyphsUnder(boxes, -50, 0)).toEqual([]);
  });
  it('measures the narrowest fragment at either edge', () => {
    expect(worstFragment(70, 30, [[60, 110]])).toBe(10); // left edge 10 into the glyph
    expect(worstFragment(0, 105, [[60, 110]])).toBe(5); // right edge 5 short of its end
    expect(worstFragment(60, 50, [[60, 110]])).toBe(Infinity); // both edges on its boundaries
  });
  it('treats the sub-pixel overlap of tightly tracked neighbours as no cut', () => {
    const overlap: [number, number][] = [[0, 30.3], [30, 60]]; // negative tracking: boxes overlap by 0.3px
    expect(worstFragment(30.15, 100, overlap)).toBe(Infinity);
    expect(worstFragment(31, 100, overlap)).toBeCloseTo(1, 6);
  });
  it('a row the old line-1 snap ignored now moves the pane', () => {
    const rows: [number, number][] = [[0, 40], [40, 80], [5, 35]]; // line 1 (two glyphs), then a row-2 glyph
    const lineOne = snapClearX(10, 70, rows.slice(0, 2), 10, [0, 30]);
    expect(lineOne).toBe(10);
    expect(edgesClear(lineOne, 70, rows, 10)).toBe(false);
    expect(edgesClear(snapClearX(10, 70, rows, 10, [0, 30]), 70, rows, 10)).toBe(true);
  });
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
