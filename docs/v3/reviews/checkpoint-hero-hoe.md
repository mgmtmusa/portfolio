# Hero studio checkpoint (plan F22, Task 5 acceptance): head of engineering

Date: 24 November 2026, about 16:05. Reviewed against `docs/plans/v3.md` (Task 5, H1 to L14, amendments table), `DESIGN.md`, `.impeccable/surfaces/src-pages-index-astro.md`, `docs/v3/reviews/phase2-directions.md` (G1 to G8) and brief section 9. Live checks were run with Playwright against `http://localhost:4323`, serving the 15:56 `dist` (it includes the new additive `paintMasks`). Scratch scripts are in the session scratchpad, not the repo.

Cut short at the coordinator's request (usage limit). The section "Not reviewed" lists what still has to be done.

## Verdict: CHANGES REQUIRED

The hero mostly works. INP, frame rate and the knock-out geometry pass when re-measured live. But three scene-lifecycle bugs leave a misregistered or misplaced slab on screen, the slab's rim is not rendered, the line and CTA start at opacity 0, there is a layout collision at 1024×768, and several Task 5 tests are missing. One evidence script also mislabels its viewport.

## Gates (re-measured where allowed)

| Gate | Measured | How |
|---|---|---|
| Build, types | Not run (forbidden this checkpoint; other agents share the tree) | n/a |
| Playwright | Not re-run. The prerun's 130/34/0 predates the 15:56 `paintMasks` rewrite, so it is stale | `docs/evidence/round-1/prerun.log` |
| INP (4× CPU) | Worst 64ms over 18 interactions, including slab press and drag. PASS | `node scripts/qa/perf.mjs http://localhost:4323 <scratch>/perf` |
| Frames | 99.8% of 603 frames under 16.7ms, no task over 50ms. PASS (see risk R2) | same |
| Bend build | Script reports 14.1ms desktop and 14.5ms phone, but the method is flawed (fix 9). A cold rebuild at 4× CPU caused no long task; PNG encode took 7.5ms at load | `perf.mjs`; scratch `cold.mjs` |
| Knock-out geometry (new `paintMasks`) | Chromium 1440, WebKit 1440 and iPhone 14 WebKit, at y 0 and y 45: 0 originals left inside the hole and 0 changed pixels outside it. Pixel 7 (DPR 2.625): 84 device px outside the hole up to 13% darker (a seam) | scratch `knock.mjs` |
| Lighthouse, LCP, CLS, JS | Not re-run. LOG numbers predate today's changes | `docs/v3/LOG.md` |
| Glass count, axe, no-JS | Not re-run | n/a |
| iOS Safari | Old build: masthead and portrait hidden except under the slab. Fixed build: correct at rest (`iphone17-rest-fixed.png`). No fixed captures yet at y 45, mid-drag or after docking | `docs/evidence/round-1/ios/` |

## Rulings on the two logged deviations

1. **Masthead not faded in at load: APPROVED.** Plan F9 and Task 5 forbid opacity 0 on the masthead, and DESIGN.md's own sentence says the masthead is "never hidden". Remove "0–240ms the masthead fades in" from the load order in DESIGN.md and in the surface brief, so the contract no longer contradicts itself.
2. **Phone role line: APPROVED, with conditions.** The surface brief's STORY needs the role read within 5 seconds, but the phone spec left it out. The build is right to add it.
   - Measured at 390×664: role y 38–55; line y 61–145 (spec 44–128, so 17px low); portrait 148–428 (spec 136–416); slab 428–558, masthead and CTA 604–652 on spec.
   - The line stays three rows at 360, 375, 390, 402 and 412.
   - Conditions: record the new phone values in DESIGN.md; the creative director confirms the line clears his hair by 24px; a test asserts three rows at 375, 390 and 412.

## Fixes, in order

1. **`src/scripts/hero.ts`: three scene-lifecycle bugs, all reproduced in Chromium and WebKit.**
   - **A. Back at y > 90, then scroll to the top.** `start()`'s docked branch calls `buildNow()` while the slab carries the dock FLIP transform. The bend is built from the dock rect (viewBox `497 3880 445 56`), but the slab lands at 612,452, 360×241: wrong copy, no knock-out. The rest nudge is also skipped (x 612, not 621).
   - **B. Resize while docked, then scroll to the top.** The resize handler doesn't rebuild when docked, so the old bend (viewBox `621 452 360 241`) and its mask hole stay. The slab is now at 544,402, 320×214, so letters outside the slab get knocked out.
   - **C. Reduce motion (⌘K) while docked, then scroll to the top.** The reduced `flyTo(0)` never clears `transform` or `clip-path`. The slab shows at 549,820, 324×56, squashed over the dock area.
   - **Fix:** build only from untransformed rest geometry (clear `transform`, `clip-path` and `visibility` before measuring, as `measureRest` does). Mark the bend stale on resize, fonts and swap, and rebuild in `land(0)` when stale. In `motionchange` and in reduced `flyTo`, reset `transform`, `clip-path` and shadow `opacity`. Re-run the nudge in the docked branch.
   - **Verify:** a `home.spec` case for each of A, B and C asserts that the `svg.bend` viewBox equals the slab rect within 1px and that the slab rect equals rest. The H2 registration test runs after each.
2. **`src/scripts/bend.ts`: the new `paintMasks`, plus the missing iOS check.** I agree it is a finding: Playwright WebKit cannot stand in for iOS Safari compositing.
   - The new additive layers are geometrically correct (see the gates).
   - Snap mask sizes and positions to device pixels (`Math.round(v * devicePixelRatio) / devicePixelRatio`) to remove the fractional-DPR seam on Android.
   - Add `scripts/qa/ios-sim.mjs`: `xcrun simctl openurl` plus `simctl io screenshot` at rest, y 45, docked and back. Assert that the masthead pixels outside the slab are bright and that no originals remain inside it.
   - Make it a checkpoint gate. Also capture real macOS Safari once (plan F3).
   - **Verify:** the fixed captures in all four states, and the knock-out check on Pixel 7 at 0 seam pixels.
3. **`src/components/Hero.astro`: the slab has no rim.**
   - The slab carries `glass--slab` but not `glass`, and `.slab::before` has no `content` (computed `content: none`).
   - So the 1.5px rim with a .80 top-left catch is missing, and the hover `--rim: .95` transition animates nothing.
   - **Fix:** give `.slab::before` `content`, `inset: 0`, the rim gradient using `rgb(var(--rim-catch) / var(--rim))`, and the two-layer mask, then check that rim on the iOS Simulator too.
   - **Verify:** computed `::before` content is `""`, and a hover screenshot diff at the top-left rim.
4. **`Hero.astro`: line and CTA invisible at first paint.**
   - `.lead { animation: rise … 800ms both }` uses `opacity: 0` in `from`, so the line, role and CTA measure opacity 0 at 71ms and stay hidden until about 1.3s.
   - This breaks Task 5 ("No opacity-0 start on the masthead, portrait, line or CTA") and contradicts the code's own comment.
   - **Fix:** a transform-only rise for `.lead`. The proof and availability may keep the fade. Update the DESIGN.md load order to match.
   - **Verify:** the M7 test asserts `.lead` opacity 1 at DOMContentLoaded.
5. **`Hero.astro`: collision at 1024×768.**
   - The proof column overruns 420u (299px). Its bottom is at 368px, about 7px above the cap line of "Abdullah" (about 375px), with "from 400" sitting on the "lla" ascenders.
   - The availability block's top (480) sits about 4px under that line's baseline.
   - **Fix:** a re-flow below 1180px approved by the creative director. For example, labels on one line, a shorter proof, or the availability block moved to screen two as on phones.
   - **Verify:** `layout.spec` asserts proof bottom ≤ line-1 cap top − 24u and availability top ≥ line-1 baseline + 24u at 1024×768, 1100×900, 1180×820, 1280×720 and 1440×789.
6. **`hero.ts`: phone edge fragments.**
   - At 375 the slab's left edge leaves "b" 13px, "a" (Walid) 11px and "u" 16px, all under 18u (17.3px). It is the same at 360, 390 and 402.
   - The rest snap reads line 1 only, ignores rows, and silently returns 0 when nothing in ±48u is clear.
   - **Fix:** clearance over every row that intersects the slab's y range, and a best worst-fragment fallback when no position is fully clear. Escalate to the creative director if no x passes.
   - **Verify:** a phone version of the drag-clearance test on Pixel 7 and iPhone 14.
7. **Missing Task 5 tests:**
   - `moments.spec.ts` (F12 and M6, with a mid-morph frame), not present.
   - The M7 first-paint test.
   - The M9 pixel-contrast check. On iOS the strip clock sits over the next section's heading and the dock's "Menu" over a blurred "$2M+".
   - H2 repeats after fonts, a resize and home → work → home.
   - M5 touch drag on the phone projects (today only `touch-action` is checked).
   - G7: labels ≥ 14ch.
   - A row-aware G1 right margin.
   - Drag then dock. It passes live (it returns to x 981), but it is untested.
   - `nav.spec` (F2, F13, F16) is deferred to Task 11 in the log. Keep it on the list.
8. **`scripts/qa/capture.mjs`: mislabelled evidence.**
   - The "375" captures use `devices['iPhone SE']`, which is 320×568. Use `{ ...devices['iPhone SE'], viewport: { width: 375, height: 667 } }`.
   - The prerun's "no overflow" claim is wrong: at 320 the home page scrolls sideways (scrollWidth 361, Path rungs), and the line wraps to four rows ending on "closes.".
   - 320 is not a listed width. Either fix it or record it as out of scope.
9. **`scripts/qa/perf.mjs`: the bend-build timing is invalid.** It times one rAF wait with the map already cached.
   - Add a test hook that times `buildBend` synchronously after clearing the cache, at 4× CPU, desktop and phone.
   - Make the frame gate refresh-aware (≤ 1.5 × the measured vsync interval). On a 120Hz panel, 16.7ms hides dropped frames.
10. **Low:**
    - `glass.css` still says "SVG lens in src/scripts/lens.ts" (F21).
    - The hero proof is hand-typed literals. Bind it to `site.ts` (`cases`, `career`) and add the `data-fact` attributes F5 needs.
    - The phone AVIF at DPR 3 picks 1240w at 48 KB, over the 40 KB budget. Add a 1060w candidate or record the exception.
    - The reduced-motion cross-fade is forced to 0.01ms by the global `!important`. That is within DESIGN's "at most 160ms", so note it in the plan.
    - Before `hero.ts` starts, the home dock is invisible but not `inert`. Set it inert from the inline script.
    - If the hero chunk fails to load, the dock never shows. Catch the import and show the dock.

## Risks

- R1: the old Playwright run and Lighthouse numbers predate the masks change. Re-run everything before approval.
- R2: the frame gate is lenient on 120Hz displays (fix 9).
- R3: compositing differs between WebKit builds and iOS. Only the simulator or a real device proves the bend (fix 2).
- R4: `capture.mjs` and `hero-states.mjs` swallow some failures. The prerun's "not a regression" note missed real overflow.

## Not reviewed (time)

- Build and `astro check`; the full Playwright run.
- Lighthouse on the current build.
- axe, the glass count and no-JS after the change.
- The fixed iOS captures beyond rest, and real macOS Safari.
- The F16 leak check.
- `code-review` and `security-review` output (not handed over).
- A line-by-line read of `Path`, `CaseTeasers` and `NextStep`.
