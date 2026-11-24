# Studio round 1: impeccable-finish-reviewer

**Verdict: CHANGES REQUIRED** (disposition: fix). Not reviewed: below-the-fold story beats (captures are first viewport only). No Refuse-list violations. Persistence pass; fidelity matches FIRST VIEWPORT except MATERIAL (slab bend) and the phone portrait dissolve. Ceiling: light field sits flat; key light barely lifts slab rim or masthead.

1. **Slab bend draws in hard horizontal steps** (jaggies on the "A" leg, "b"/"d" bowls, "d" stem foot clipped at the edge). Where: SVG bend (`src/scripts/bend.ts`, `.slab` in `Hero.astro`). Evidence: `docs/evidence/round-3/capture/home-1440.jpg`, `hero/webkit-1-rest.png` (x 560-1040, y 430-720). Signature element reads as a sampling glitch; sample finer or smooth the bands, both engines. (Check whether the r2 half-resolution map caused it.)
2. **Phone portrait is a hard-edged box**: straight cut across the suit at about y 428, side edges visible, 2-4 level step vs field (19 vs 23). Where: phone portrait mask/crop in `Hero.astro`. Evidence: `capture/home-390.jpg`, `ios/iphone17-rest.png`. Contract: elliptical dissolve, every edge within 1 level of the page.
3. **iOS rest capture has no slab, yet the gate passed.** Where: `scripts/qa/ios.mjs` checks (lines 91-108). Evidence: slab missing in `ios/iphone17-rest.png`, present in `iphone17-back.png`. Capture after 1600ms, test the slab rim, recapture.
4. **"28%" has no footnote marker; only "65%" carries one.** Where: hero cover lines. Evidence: `capture/home-1440.jpg`. Thesis: every number footnoted.

Keep: inverted-cover layout, warm single light, masthead painted at first paint.
