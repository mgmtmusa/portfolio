# Hero studio checkpoint, re-review (round 2): head of engineering

Date: 25 November 2026, about 00:55. This re-checks every finding in `checkpoint-hero-hoe.md` against commits c06544a, d4c96ca, d6c0d06, 47551a7, 1629eb3, 0028d34, 6435ed5 and 7dfa3c7. All checks ran against `dist/` built at 00:33. That build contains 6435ed5 and the 7dfa3c7 Hero CSS: `@keyframes rise{0%{transform:translateY(8px)}}`, `calc(996 * var(--u))`, `calc(88 * var(--u))` and the `__bendBuild` hook are all in the built files. The hero source in the working tree matches HEAD. I did not rebuild. Scratch scripts are in the session scratchpad under `r2/`.

Out of scope as instructed: the docked dock and strip contrast (M9, another agent is fixing it now), the Pixel 7 18u fragment rule (marked test.fail and escalated to the creative director), and everything under /work.

## Verdict: CHANGES REQUIRED

The three scene-lifecycle bugs, the rim, the first-paint opacity, the 1024 collision, the multi-row snap and the 320 overflow are all fixed, and I reproduced each fix myself. Lighthouse, INP and frames pass. Four things still block approval:

- The Android seam fix does not work. The seams are visible on Pixel 7.
- The new iOS gate printed PASS on a blank white page.
- The desktop bend build is over its budget.
- The new M7 tests fail under load because they do not actually freeze the clock.

## Gates

| Gate | Measured | Command |
|---|---|---|
| Playwright, hero specs (home, bend, glass, layout, moments, hero-states), 4 projects | 185 passed, 4 failed, 59 skipped; 1 expected failure (Pixel 7 18u test.fail). Failures: M7 DCL screenshot on chromium (0.335 changed vs < 0.02) and on mobile-chrome (0.159); M7 translate on webkit (`0`, expected < 0); M9 dock on webkit (3.79:1, known). The three M7 tests passed 20/20 when re-run serially, so they are flaky (fix 4) | `npx playwright test <6 specs> --workers=2`; re-run `-g M7 --workers=1 --repeat-each=2` |
| Lifecycle A, B, C and drag then dock (my reproduction script) | Chromium and WebKit: after Back then top, after a resize while docked then top, and after reduce motion while docked then top, the slab sits at its rest rect (621,452,360,241; after the resize 552,402,320,214). The viewBox equals the slab rect and the mask holes sit under the slab. Drag then dock returns to x 999. No console errors | scratch `r2/states.mjs` |
| INP, 4× CPU | worst 56ms over 18 interactions. PASS | `node scripts/qa/perf.mjs http://127.0.0.1:4322 docs/evidence/round-2/perf` |
| Frames (refresh-aware) | 120Hz measured, limit 12.5ms: 99.5% of 600 frames within the limit, no task over 50ms. PASS | same |
| Bend build, cold, 4× CPU (budget 16ms, plan F10) | desktop 21.5ms FAIL, phone 10.6ms PASS. Cross-check: desktop cold median 21.8 and max 23.2, warm 1.7; phone cold 9.7, warm 2.1 | same; scratch `r2/bendtime.mjs` |
| Knock-out geometry | Chromium 1440, WebKit 1440 and iPhone 14 WebKit, at y 0 and y 45: 0 originals left inside the hole and 0 changed pixels outside it. **Pixel 7: 114 device px changed outside the hole at y 0 and 50 at y 45, up to 190 levels darker** (round 1: 84 px, up to 13% darker) | scratch `r2/knock.mjs`, `r2/p7-corner-big.png` |
| iOS Simulator (iPhone 17) | Run 1: **iOS GATE PASS on wrong captures**. "rest" was the scroll-restored Path section and "docked" was a blank white page still loading (mean 253.9, std 14.4). Run 2: correct captures; rest and docked look right (the rim shows, the masthead and portrait are intact, the strip clock overlaps the Path heading as in M9) | `node scripts/qa/ios.mjs 4342 <scratch>/r2/ios` and `/ios2` |
| Lighthouse mobile, median of 5 | 100/100/100/100, LCP 1353ms, CLS 0, TBT 0, JS before load 7.7 KB. PASS | `node scripts/qa/lighthouse.mjs http://127.0.0.1:4322/ <scratch>/r2/lh 5 mobile` |
| Lighthouse desktop, median of 5 | 100/100/100/100, LCP 324ms, CLS 0. PASS | same, `desktop` |
| Rim | `::before` content is `""`; `--rim` is .8 at rest and .95 on hover (it is registered with `@property`, so the transition runs); the hover screenshot differs at the top-left rim. PASS | scratch `r2/misc.mjs` |
| 320px | scrollWidth 320. PASS. The line still wraps to 4 rows (Low 2) | same |
| Build, astro check, axe, glass count, no-JS, full suite | Not run this round. Only the hero specs were in scope; other agents share the tree | n/a |

## Round 1 findings, re-checked

| # | Finding | Status |
|---|---|---|
| 1 | Lifecycle A, B, C | **Fixed.** `restGeometry()` clears the transform and clip before measuring. `buildNow()` measures with no transform. Resize, fonts and motionchange drop the bend so that `land(0)` rebuilds it. The reduced `flyTo` clears the transform and clip. I reproduced all three in both engines, and `hero-states.spec` covers them (it passes) |
| 2a | Device-pixel snap (Android seam) | **Not fixed.** See fix 1 |
| 2b | iOS gate | **Added, but it can pass on wrong captures.** See fix 2 |
| 3 | Slab rim | **Fixed** (glass.css `.glass--slab::before`), and confirmed on the simulator |
| 4 | First-paint opacity | **Fixed.** The rise is transform-only, and the moments load-order test asserts opacity 1 at DOMContentLoaded |
| 5 | 1024 collision | **Fixed.** `layout.spec` passes at 1024×768, 1100×900, 1180×820, 1280×720 and 1440×789. DESIGN.md records the change |
| 6 | Multi-row edge fragments | **Fixed** for iPhone 14 and the 375 and 390 widths. Pixel 7 (412) has no position that clears 18u: test.fail, with the creative director |
| 7 | Missing tests | **Mostly fixed:** moments (load order, M7, M9, H2 ×3, scroll repeat, M5 touch), G7, three-row phone line. Still missing: drag then dock (it passes live but has no test), a row-aware G1 right margin (`layout.spec.ts:19` still asserts `right >= 0`, not 58u), and `nav.spec` (deferred to Task 11) |
| 8 | capture.mjs label and 320 overflow | **Fixed.** `iPhone SE (3rd gen)` is 375×667; the 320 width no longer scrolls sideways |
| 9 | perf.mjs | **Fixed.** Cold build through `__bendBuild`, and the frame gate uses the measured refresh rate. The cold build it now measures fails (fix 3) |
| Rulings | Masthead fade and phone role line | **Applied** in DESIGN.md and the surface brief; the three-row test covers 375, 390 and 412 |
| 10 | Low items | Not addressed. Carried forward below |

## Fixes, in order

1. **`src/scripts/bend.ts:157-163`: the Android seam is still there, and it is visible.**
   - **The problem:** `px()` rounds each coordinate relative to the masked element's own box. The elements do not start on the device-pixel grid. On Pixel 7 (DPR 2.625), `.mast-l1` is at top 419.39 and left 21.125 CSS px, so every snapped edge still falls part-way through a device pixel. Where a band meets a corner piece, two partial coverages combine to less than 1.
   - **Measured:** a dark hairline crosses the "M" and "u" along the slab's top edge, and another runs down its left edge (`r2/p7-corner-big.png`). That is 114 device px outside the hole, with some pixels near black.
   - **Fix, either of:**
     - (a) Snap in viewport space. Read the element's `getBoundingClientRect()` origin `o` once per build, then use `px(v) = (Math.round((o + v) * dpr) / dpr - o)`, on each axis.
     - (b) Preferred: replace the 8 layers with one mask layer per target. That layer is an SVG data URI the size of the element: a full rect plus a rounded-rect hole path, `fill-rule="evenodd"`. It uses no mask-composite, so the iOS problem does not apply, and it has no internal edges that could seam. Moving the slab then only changes that layer's position (`mask-position`).
   - **Verify:** add the knock-out check (unchanged outside the hole beyond 2px, no originals inside) to `bend.spec` for mobile-chrome and mobile-safari at y 0 and y 45, with 0 changed pixels as the pass. Then re-run `ios.mjs`.

2. **`scripts/qa/ios.mjs`: the gate passes on a blank page and a scrolled page.** On run 1 it printed `iOS GATE PASS` for a "rest" capture of the Path section (Safari restored the last scroll) and a white, still-loading "docked" capture.
   - Line 109: `full.mean < 200 || full.std > 12` passes a white page with a toolbar. Use `&&` and a mean under 120, since the site is dark.
   - Line 98: the "masthead" region (y 0.09 to 0.16) is the role and line, not the masthead. The masthead rows are about y 0.46 to 0.67. Check the masthead outside the slab's x range (x < 0.25 and x > 0.80, y 0.46 to 0.67) for bright glyph pixels. A masthead-only regression, which was the original iOS bug, would pass the current check.
   - Rest: also assert the scroll position. Load with a cache-busting query and `#top`, and check that the role line sits above the portrait (a bright text band at y 0.12 to 0.24 and the face region std > 20).
   - Docked: assert positively that the dock pill (a bright pixel run in the bottom band at y 0.83 to 0.86) is present and the masthead region is not. Wait for paint the way rest does (`waitPaint`), not with a fixed 4.5s sleep.
   - Add the "back" state. From docked, `openurl` the same URL with `#top` (a same-document fragment, so the page does not reload), wait, and assert the rest checks again. This is the iOS proof for finding 1.
   - Fail if any two captures are byte-identical or have mean luminance within 1 of each other (the page did not change).
   - Read the UDID from `xcrun simctl list` by name (`iPhone 17`) instead of hardcoding `527DB004…`.
   - Real macOS Safari once (plan F3) is still outstanding.

3. **Bend build: desktop cold build 21.5ms against the 16ms budget (plan F10).**
   - The warm build takes 1.7ms, so nearly all of the time is the displacement map.
   - A cold build happens at start (inside `requestIdleCallback`, before the glide starts, so harmless) and after any width change. After a resize while docked, `land(0)` builds cold at the moment the slab springs back: a 22ms main-thread task inside an animation at 4×.
   - **Ruling:** I accept splitting the budget if the code no longer builds cold on an interaction path:
     - In `hero.ts`, the resize handler's non-rest branch warms the map cache for the new `(w, h, r, band)` in an idle callback. Export a `warmBendMap(...)` from `bend.ts`.
     - Plan F10 becomes "cold build ≤ 25ms at 4×, only inside an idle callback; every build reachable from scroll, drag or a landing ≤ 16ms (warm)".
     - `perf.mjs` reports and gates `cold` and `warm` separately, and times one `land(0)` after a resize while docked.
   - The alternative is to bring the cold build under 16ms, for example by generating the map at half resolution and letting `feImage` scale it.

4. **`tests/e2e/moments.spec.ts:58` and `:74`: the M7 tests do not freeze time.**
   - `page.clock.install()` installs a fake clock that keeps running, so the comments are wrong. On a loaded machine the glide starts before the evaluate or screenshot runs. Under `--workers=2` that produced 3 failures in 4 projects; the same tests pass 20/20 serially.
   - **Fix:**
     - For the first-paint state, block the hero chunk: `page.route(/\/_astro\/hero\.[^/]+\.js$/, r => r.abort())`. That shows exactly what CSS alone paints. Alternatively, call `clock.install({ time })` and then `clock.pauseAt(time + 1)` before `goto`.
     - Await `document.fonts.ready` before both screenshots, so a font swap cannot count as slab pixels.
   - **Product tidy, same area:** in `start()`, `buildNow()` calls `place()` while `dragX` is still 0, so `translate` reads `0px` until the first glide frame. Opacity is 0 then, so nobody sees it. Set `dragX = startX` before `buildNow()`.

5. **M9 (known, in progress):** the webkit dock label measures 3.79:1. The working-tree spec has the `test.fixme` removed, so this gate fails until the Dock fix ships in a build. The iOS docked capture also shows the strip clock printed over the Path heading. It must pass on all four projects before approval.

## Low (carry forward, not blocking)

1. Finding 7 leftovers: a drag-then-dock test (the `r2/states.mjs` D case is the recipe: drag 200px, dock, back, slab x equals the dragged x); a G1 right margin ≥ 58u − 8 over every row (`layout.spec.ts:19`); `nav.spec` in Task 11.
2. 320px: no sideways scroll now, but the line wraps to four rows, which breaks the "broken the same at every width" rule. Fix it, or record 320 as out of scope in DESIGN.md.
3. Round 1 Low items are untouched:
   - The `glass.css:3` comment still names `lens.ts`.
   - The hero proof is hand-typed literals with no `data-fact` (`Hero.astro:56-70`).
   - The phone AVIF at DPR 3 is over its 40 KB budget.
   - The home dock is not inert before `hero.ts` starts.
   - `index.astro:35` `import('../scripts/hero')` has no `.catch` that shows the dock.
4. `__bendBuild` ships in the production bundle. It is inert unless `__v3test` is set, but F10 says "non-production builds". Strip it with `import.meta.env.PROD`, or amend F10.

## Risks

- R1: compositing on Android at fractional DPR differs from Chromium desktop at DPR 2. Only a mobile-chrome pixel test (fix 1) catches it.
- R2: a gate that cannot fail is worse than none. Fix 2 matters more than its size suggests.
- R3: the full Playwright suite, axe, the glass count, no-JS and `astro check` were not re-run this round. The release review must run them on the final build.
- R4: tests that depend on timing under `--workers=2` on this machine. Any test that asserts state before an idle callback must block or pause it, not race it.
