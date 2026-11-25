# Studio round 4: impeccable-motion-reviewer

**Verdict: CHANGES REQUIRED** (disposition: fix; evidence only)

1. Film the Path key light: **resolved.** Chromium screencast median gap 17ms; rAF lightSamples show each step as a 900ms expo-out (start 1345ms, ~90% by 1628ms, settled 2128ms; steps 2 and 3 match). Fast scroll is one continuous retarget to rung 3, settled at 928ms, no stepping. Reduced motion: three jumps, no in-between samples, chromium and webkit. WebKit moves vertically only. Pool faint but visible.
2. First callback placed instantly: **resolved.** Path.astro:110-119 places with transition off, reflows, restores. moments.spec.ts:533 samples every frame and passes. No film of a return to mid-Path.
3. Dense drag and webkit scroll-back: **partial.** Drag resolved (17ms frames, slab tracks 1:1 from 14 to 435ms, settled 867ms, PSNR 57 vs 1827ms). WebKit scroll-back unresolved: webkit-normal-scroll-11978 still shows the dock up and the portrait cropped though the note says scrollY 0; frames trail the real scroll. Extend scripts/qa/motion.mjs:107-112 until a settled frame shows the slab at rest and no dock.

Doc drift DESIGN.md:81 fixed (matches Hero.astro:192-199).

Scope note: the drag releases after a pause, so the release spring (hero.ts:420-437) is never shown moving.

Keep: one translate-only light; instant first placement; reduced-motion jumps.

## Re-check on round-6/motion-r2 evidence: **APPROVED** (disposition: ship)

Fix 3 resolved: settled frames webkit-normal-scroll-28499.png, webkit-reduced-scroll-17662.png and crops/webkit-phone-back-settled.png show the page at the top, slab at rest over the name, no dock; index.json scrollY 460 at dock, 0 after return. Fixes 1, 2, drag and DESIGN.md:81 stay resolved.
Not covered: WebKit hand-off in motion (normal run has a 16.5s gap; probe gives states, not frames); the drag release spring is never shown moving.
Keep: translate-only key light, instant first placement, reduced-motion jumps, slab and shadow at 0 until the dock fades.
