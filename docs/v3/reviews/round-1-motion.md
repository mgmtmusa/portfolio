# Studio round 1: impeccable-motion-reviewer

**Verdict: CHANGES REQUIRED** (disposition: recapture). The reviewer has no browser: no filmstrips exist, so continuity, timing and reduced motion are unverified by frames. Needed next round: normal and reduced-motion frame sequences (before/first/mid/last/settled) of glide-in, dock and back, drag and release, home to /work/ and back, ⌘K; 1440x900 chromium and iPhone webkit.

Material fixes (from code and round-3 stills):
1. **Interruption:** `flyTo` and `pointerdown` don't cancel the glide; scrolling past 90px mid-glide keeps writing `dragX` and `bend.setVisible(true)` during flight (holes in the name). hero.ts:160-165, 233-234, 319.
2. **Dock hand-off:** landing hides the slab instantly while the dock fades 0 to 1 over 240ms (a gap); going back, the dock fades over the visible slab (both show). hero.ts:165-166, 194-198; Dock.astro:26-28.
3. **Bend snap:** bend off and blur on in one frame at flight start; bend back at full strength in one frame on landing. Ramp strength as touch does. hero.ts:164, 204; Hero.astro:145.
4. **Press scale** `.985` pivots top-left; bent copy drifts up to ~5px from the cut-out while dragging. hero.ts:43; Hero.astro:143.
5. **Release velocity** uses only the last pointer moves, ignores release time: pause then release still flings. hero.ts:252-253.
6. **Entrance replay:** returning home from /work/ replays glide and text rise; the /work/ dock sits over the masthead up to 1.2s then fades. hero.ts:300-323, 381, 392; Hero.astro:174-179.
7. **Load order:** glide waits for first paint plus two idle callbacks (up to ~2s; WebKit timers) while the text rise is fixed at 800ms, so order inverts; `rise` has no opacity, text sits 8px low then shifts. Base.astro:77-83; hero.ts:15, 326; Hero.astro:181.
8. **Dock width jump:** Get in touch loses `display:none` when the hero CTA leaves view. Dock.astro:37; chromium-3-docked.png.
9. **Edge slivers in the slide:** chromium-2-slide.png fragments at x 622-650 and 938-970; edge clearance only checked at rest. hero.ts:106.
10. **Landing hitch after resize:** cites round-2 perf (21.5ms). Coordinator note: superseded by 0eed933 (cold 8.9ms, warm pre-built); re-verify.
11. **Reduced motion:** inline 160ms slab fade overridden to 0s by global.css:99; hard cut acceptable, dead intent. hero.ts:171.

Keep: critically damped springs, transform/clip-path only, 160ms reduced-motion view-transition fades, Lenis off under reduced motion.
