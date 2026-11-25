# Studio round 3: impeccable-motion-reviewer

**Verdict: CHANGES REQUIRED** (disposition: fix).

Round 2: register fixed (chromium-normal-scroll-00648; bend.ts `pane.before(svg)`, hero.ts:376 synchronous place()). Return hand-off fixed in chromium (02588 dock opaque no slab; 02884 slab in flight, dock gone; hero.ts:281-283, 306, 326; shadow clamped hero.ts:251). Evidence partly met: load screencast good (pre-portrait paints 00062-00085, portrait 00113, glide ~00502); drag frames still ~300ms chromium / 196ms webkit (motion.mjs:107); webkit scroll never returns (04816-06942 move ~70px, dock stays up), so the webkit return hand-off is not filmed. 00642 artifact accepted.

Craft: Path light code (Path.astro:47-54, 94-105) translate only, 900ms expo-out, one element, no idle drift, matches DESIGN.md; no frames of it exist. Reduced motion jumps instead of gliding (Path.astro:53-54), allowed; not filmed.

Material fixes:
1. Film the Path key light: normal and reduced scroll across all four rungs, frames ≤100ms through one 900ms move, plus a fast scroll that skips rungs.
2. Path.astro:96-102: the first IntersectionObserver callback runs after the transition is restored at :99, so a restored scroll or a view-transition return to mid-Path sweeps the light 900ms in from rung 0 (a replayed entrance). Place the first callback's rung instantly.
3. Dense drag frames (use the screencast, as for load); extend the webkit scroll-back to reach the slab's return.

Doc drift: DESIGN.md:81 says the top-left entrance is "opacity plus an 8px rise, 800-1300ms"; code (Hero.astro:186-197) is transform only from first paint.

Keep: copy and knock-out in the page; slab and shadow at 0 until the dock fades; critically damped springs; transform-only light.
