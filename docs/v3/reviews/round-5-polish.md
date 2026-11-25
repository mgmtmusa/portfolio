# Round 5: the four round 4 polish items

Date: 26 November 2026. Branch `redesign/v3-dark`. Evidence: `docs/evidence/polish-r5/`.

## 1. Work page figures: fixed, finish reviewer APPROVED

"28%" and "65%" now sit apart: the gap is .56em (.48em under 900px), with a 1px hairline in `--line-strong` centred in it (`CaseFigure.astro`). The facts, the single footnote (its note covers both: "Two results from the same initiative") and the caption are unchanged. There is no overflow at 375, 390 or 1440. Crops: `crops/fig-work-{1440,390,375}.png`, `crops/fig-sheet-{1440,390,375}.png`.

Finish reviewer: APPROVED. The two figures read as two results; the hairline is structural (a column rule in an existing token), not decoration. Material fixes: none.

## 2. Phone slab clipping: checked, head of engineering NO CHANGE

- iOS Simulator (iPhone 17): `node scripts/qa/ios.mjs` printed "iOS GATE PASS" (`ios/`). `xcrun simctl shutdown all` was run afterwards.
- Playwright WebKit at 375x667 and 390x844, slab on and off: `crops/slab-375.png`, `slab-375-off.png`, `slab-390.png`, `slab-390-off.png`, `slab-ios.png`.
- Per letter: "u" and "s" in Musa, and "W" and "a" in Walid, are bent but readable. Nothing is split, doubled or missing.

Head of engineering: NO CHANGE. Every letter reads as itself; the bend is the intended glass effect.

## 3. Contact page dock: won't fix (creative director's round 3 ruling stands)

The suggested fix (apply the 160px rest rule only under 640px) assumed the desktop dock sits clear of the form. Measured on the built site, at rest it covers a form field at every width tested:

| Viewport | Dock (x, y) | Field under it |
|---|---|---|
| 1440x900 | 558 to 882, 820 to 876 | role textarea, x 58 to 596, y 737 to 873 (its right edge and resize handle) |
| 1366x768 | 521 to 845, 688 to 744 | role textarea, to x 575, y 709 to 845 |
| 1280x800 | 478 to 802, 720 to 776 | role textarea, to x 528, y 702 to 838 |
| 1024x768 | 350 to 674, 688 to 744 | role textarea, to x 420, y 689 to 825 |
| 1920x1080 | 798 to 1122, 1000 to 1056 | Timeline input, to x 836, y 1003 to 1056 |
| 768x1024 | 222 to 546, 944 to 1000 | a field label, y 974 to 995 |

Crop: `crops/contact-1440-rest.png` (taken with the trial change in place). The creative director's round 3 fix 3 ruled exactly this overlap at 1440x900 a defect ("Contact at 1440x900: the dock sits on the role textarea at rest"). The coordinator chose to keep the rest rule at every width. The trial change was reverted; `Dock.astro` is as in round 4.

Possible later change (Musa's call; a layout change, needs a creative director re-check): narrow the contact form column at 900px and up (for example columns 1 to 4 of 12) so it ends before the dock's left edge. At 768 (tablet) the rule would still be needed.

## 4. Motion evidence: filmed; one defect found and fixed; motion reviewer APPROVED

`scripts/qa/motion.mjs` takes an optional third argument, a comma list of sequences, and has two new ones: `handoff` (WebKit iPhone 14, Playwright `recordVideo` at 25fps, plus a per-rAF probe) and `release` (Chromium CDP screencast and WebKit video; the drag lets go while moving).

- Hand-off to the dock (`motion/sheet-webkit-normal-handoff-2-to-dock.png`): 693ms, 19 frames. Slab and dock opacity sum to 1 throughout, they are never both opaque, and there is no jump.
- Release spring (`motion/sheet-webkit-normal-release.png`, `index.json`): no overshoot. Chromium released at 802px/s and settled in 783ms over 52 frames with a median gap of 19ms. WebKit released at 446px/s and settled in 844ms.
- **Defect, fixed:** when it landed back at rest on WebKit, the slab painted solid black for about 120ms (`motion/crop-webkit-handoff-return-landing-black-frames.png`). The head of engineering reproduced it 3 of 3 times, on WebKit only. Cause: the 4px flight blur's `backdrop-filter` transitioned off at landing, and WebKit paints a transitioning backdrop-filter black. Fix (`hero.ts`, `land()`): at rest the slab's transition is opacity only, so the blur drops without a transition. New test `hero-states.spec.ts` "1d" fails before the fix and passes after it on webkit and mobile-safari. Re-film: `motion-fix/sheet-webkit-normal-handoff-2-to-rest.png`, no black frames.

Motion reviewer: APPROVED. A pre-existing note for later: at landing the bend copy switches on in one frame, so the slab goes from blurred to crisp at once. The same happens in Chromium with the old transition forced back in (`motion-fix/chromium-landing-strip.png`), and it was approved behaviour in rounds 3 and 4. A possible later polish is to cross-fade the bend copy in over about 80 to 120ms.
