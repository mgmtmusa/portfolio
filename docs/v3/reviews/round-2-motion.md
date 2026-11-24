# Studio round 2: impeccable-motion-reviewer

**Verdict: CHANGES REQUIRED.** Evidence: docs/evidence/round-4/motion/ (frames local, contact sheets committed).

Round 1 items: 1 glide interruption fixed in code (hero.ts:260-264, 368), not filmed. 2 dock hand-off **partly fixed** (see below). 3 bend ramps fixed. 4 press pivot fixed. 5 release velocity fixed in code (drag frames ~320ms apart, too coarse to film). 6 no entrance replay: fixed (vt frames). 7 load order fixed in code (webkit-normal-load-00319 paints text before portrait: LCP note, not motion). 8 dock width fixed. 9 edge slivers fixed. 10 landing after resize accepted from commit numbers. 11 reduced-motion fade fixed (Hero.astro:53 xfade).

Remaining:
1. **Cut-out out of register while the name slides.** chromium-normal-scroll-00944: a ~24 CSS px band above the slab is missing the tops of "Abd"; copy inside the slab sits ~36px lower than outside. Likely cause: `place()` runs in rAF after the scroll event (hero.ts:147, 349-358), lagging scroll by a frame. Fix, then recapture a mid-slide still.
2. **Return hand-off double image:** chromium-normal-scroll-02233 shows the slab mid-flight at full opacity with the dock fully opaque. hero.ts:271-276 fades the slab in while the dock still shows. Keep slab at 0 until the dock has faded, or fade in from t<=0.85 only.
3. **Evidence gaps (motion.mjs):** webkit-normal-scroll never reaches the dock and back (at 03238 the slab is only just leaving); chromium load has no pre-first-paint frames; drag needs dense frames around release.
4. **Unexplained frame:** chromium-reduced-scroll-00642 shows the strip ~260px down over a dimmed hero CTA with a black top band. Check whether it is a capture artifact.

Keep: critically damped springs, transform/clip-path only, bend ramps, no replay on VT returns, reduced 160ms cross-fades.
