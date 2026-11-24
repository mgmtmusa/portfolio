# Round 2 review: head of engineering

Date: 25 November 2026, 09:19 to 09:45. This re-checks every finding in `checkpoint-hero-hoe-r2.md` and the engineering side of the studio round 1 reports (`round-1-creative-director.md`, `round-1-finish.md`, `round-1-motion.md`, `round-1-cmo.md`) against HEAD 33a7617. I ran `npm run build` once at 09:19 (exit 0, 10 pages) and every gate below against that `dist/`, served by the preview at http://127.0.0.1:4322/. Bend timings ran against my own `astro dev` on port 4391, since `__bendBuild` is stripped from production. Scratch output is in the session scratchpad (`lh/`, `perf/`, `probe/`, `pw.log`).

## Verdict: CHANGES REQUIRED

Every numbered gate passes, and every r2 finding is fixed and reproduced. One regression from this round blocks approval. The new light pools at the top of the Path and Work sections are cut off by their own box on phones. That leaves a hard vertical edge 8 levels tall across both sections at every phone width, and it shows in the round 4 iOS evidence. The fix is one line per file. After it lands I need only the probe below and the phone layout specs re-run, not the full review.

## Gates

| Gate | Measured | Command |
|---|---|---|
| Build | exit 0, 10 pages, 870ms | `npm run build` |
| Types | 0 errors, 0 warnings, 16 hints | `npx astro check` |
| Playwright, 4 projects | **904 passed, 0 failed, 0 flaky, 92 skipped** in 11.2 minutes. Every skip is a project scope (desktop-only or phone-only), not a fixme. No `test.fail` or `test.fixme` remains in `tests/e2e/` | `BASE_URL=http://127.0.0.1:4322 npx playwright test --workers=2` |
| Lighthouse mobile, home, median of 5 | 100 / 100 / 100 / 100. LCP 1503ms, CLS 0, TBT 0, FCP 1203ms. JS before load 8.0 KB, lazy JS 23.4 KB | `node scripts/qa/lighthouse.mjs http://127.0.0.1:4322/ <scratch>/lh 5 mobile` |
| Lighthouse desktop, home, median of 5 | 100 / 100 / 100 / 100. LCP 363ms, CLS 0 | same, `desktop` |
| Lighthouse mobile, `/work/evitech/`, median of 5 | 100 / 100 / 100 / 100. LCP 1354ms, CLS 0. JS before load 7.8 KB | same URL, `5 mobile` |
| Lighthouse desktop, `/work/evitech/`, median of 3 | 100 / 100 / 100 / 100. LCP 364ms, CLS 0.003 | same URL, `3 desktop` |
| INP, 4× CPU | worst 56ms over 20 interactions (⌘K open, typing and close, footnote, slab press, slab drag, Copy email) | `node scripts/qa/perf.mjs http://127.0.0.1:4322 <scratch>/perf http://127.0.0.1:4391` |
| Frames, headed, wheel scroll | 120Hz measured, so the limit is 12.5ms. 100% of 602 frames within it, no task over 50ms | same |
| Bend build, 4× CPU (F10: cold ≤ 25ms in idle, warm ≤ 16ms, land after resize ≤ 16ms) | desktop: cold 5.1, warm 1.5, land 9.2. phone: cold 6.7, warm 2.1, land 10.5. All pass (r2 was 21.5 cold) | same (dev server, so unminified; production is faster) |
| Knock-out geometry (r2 fix 1) | `bend.spec` knock-out at y 0 and y 45 passes on mobile-chrome (Pixel 7, DPR 2.625) and mobile-safari: 0 pixels changed outside the hole, no originals inside it | Playwright run above |
| Glass | `glass.spec` passes on 4 projects: budget, phone blurred elements fixed or small, reduced transparency solid fallback, high contrast and forced colours remove the slab | Playwright run above |
| Accessibility | `a11y.spec` (axe on every page and state, keyboard path, focus, strict reduced motion) and `nojs.spec` pass on 4 projects | Playwright run above |
| Hygiene | `hygiene.spec` passes. My own grep of `dist/` (HTML, JS, txt, xml): 0 em dashes, 0 `&mdash;`, 0 phone patterns. `__bendBuild` absent from every `dist/_astro/*.js` | `grep -rl` for U+2014 over `dist/` |
| Facts | PASS. 10 HTML pages, llms.txt and sitemap. 8 INFO items trace to story.md only ("1" and "3" on the work pages: the "1 of 3" counter) | `node scripts/qa/facts.mjs` |
| iOS Simulator | Evidence accepted, not re-run. `docs/evidence/round-4/ios/ios-summary.json`: every check PASS, captures 3.1 to 3.6s after paint. I viewed rest, docked, back and contrast: right scroll position, slab and rim present in rest and back, dock pill in docked, masthead intact. The hardened checks close r2 fix 2 | read `ios-summary.json` and the PNGs |
| 3D | n/a (no three.js) | |
| Safety | No deploy, push or git write by me | |

## r2 findings, re-checked

| # | Finding | Status |
|---|---|---|
| 1 | Android seam | **Fixed.** `bend.ts:250-260` now builds one evenodd SVG mask per target, with no internal edges and no mask-composite. The knock-out spec passes on Pixel 7 at y 0 and 45 with 0 pixels changed |
| 2 | iOS gate passes on wrong captures | **Fixed.** `ios.mjs` finds the UDID by name, uses `&&` with a dark mean, checks the role band and the portrait, checks the masthead above, below and right of the slab, checks for the dock pill, adds a back state, requires the captures to differ, and diffs the slab and rim against Increase Contrast |
| 3 | Desktop cold bend build over budget | **Fixed.** Device-resolution BMP map, band only. Cold 5.1ms, and land after resize 9.2ms |
| 4 | M7 tests race the clock | **Fixed.** `moments.spec.ts:59` and `:76` abort the hero chunk and await `document.fonts.ready`. 0 failures under `--workers=2`. `hero.ts:435` sets `dragX = startX` before the build |
| 5 | M9 dock contrast | **Fixed.** The M9 dock and strip test passes on all 4 projects (chromium min 6.19:1) |
| Low 1 | Drag then dock test, G1 right margin, nav.spec | **Fixed.** `layout.spec.ts:22`, `layout.spec.ts:19` (58u − 8), `nav.spec.ts` |
| Low 2 | 320px line on four rows | **Fixed** per CD ruling 5: `Hero.astro:237`, tested in `layout.spec.ts:123-137` |
| Low 3 | `lens.ts` comment, hero `data-fact`, dock inert, hero `.catch` | **Fixed.** `Hero.astro:61-75`, `index.astro:36-46` |
| Low 3 | Phone AVIF over 40 KB | **Open** (Low 1 below) |
| Low 4 | `__bendBuild` in production | **Fixed.** `bend.ts:300` is gated on `!import.meta.env.PROD`, and the grep is clean |

## Round 1 studio items, engineering side

- **CD 1 and finish 2 (phone portrait box):** `layout.spec` checks every edge within a level at 375, 390 and 412, and it passes.
- **CD 2 and finish 1 (bend aliasing):** device-resolution map plus a 0.35 band-weighted blur (Chromium only). The bend specs pass.
- **CD 3 (name dims during the glide):** `moments.spec.ts:308` passes.
- **CD 4 (fallback dock):** `home.spec.ts:224` passes.
- **CD 5 (strip availability flash):** server-rendered `data-avail-hidden`, with a no-JS override at `global.css:105` and a reveal on chunk failure. Passes.
- **CD 6:** `layout.spec.ts:144` passes.
- **CD 8 and finish 3 (iOS gate):** see r2 fix 2.
- **CD 12 (contact):** `contact.astro:31` sets the scroll padding.
- **CD 14 (light pools):** implemented, but see fix 1.
- **Finish 4 (28% marker):** fixed at `Hero.astro:61`.
- **Motion 1 to 11:** covered by `moments.spec.ts:308-395` and `home.spec.ts` (press without scale, pause before release, cross-fades, reduced-motion 160ms through `.xfade` at `global.css:101-102`). All pass. Motion 10 is re-measured above: land after resize 9.2ms.

## Fixes, in order

1. **`src/components/Path.astro:37` and `src/components/CaseTeasers.astro:54`: the light pool has a hard vertical edge on every phone.**
   - **Cause:** `::before` is `left: -300px; width: 1500px; max-width: 120vw`, and its gradient is `circle 900px at 300px 140px`. Below about 700px wide, `max-width` cuts the box off while the gradient is still lit, so the pool ends in a straight line at x = 120vw − 300px.
   - **Measured (my probe, scratch `probe2.mjs`):** an 8-level step on background rows at x 168 on iPhone 14 (390) and x 194 on Pixel 7 (412), in both sections. At 900 and 1440 the step is 4 levels or less, which is grain.
   - **In the shipped evidence:** `docs/evidence/round-4/ios/iphone17-docked.png` shows the line through the strip and the Path heading. Sampled luminance falls from 35 to 26 at device x 560 (about 43% of the width).
   - **Fix, either of:**
     - Remove `max-width: 120vw`. `body` already has `overflow-x: clip` (`global.css:19`), so the 1500px box cannot add sideways scroll.
     - Keep the box and end the gradient inside it: `radial-gradient(circle min(900px, calc(120vw - 300px)) at 300px 140px, ...)`.
   - **Verify:** the phone "no sideways scroll" specs (`home.spec.ts:92`), plus a pixel check in `layout.spec`: on a background row 20px into `.path` and `.teasers`, no neighbouring-pixel step over 3 levels at 375, 390 and 412. Then recapture `ios.mjs` docked.

## Low (not blocking)

1. **Phone portrait over the F9 budget.** At DPR 2.625 and 3, `sizes="(max-width: 639px) 351px"` selects the 1240w AVIF (48,092 bytes). F9 says the mobile candidate is ≤ 40 KB. Either add an 1080w width (351 × 3 = 1053) and check its size, or lower the AVIF quality for the two largest widths.
2. **F9 LCP element record.** Mobile LCP is now the portrait `<img>` (1503ms; r2 was 1353ms with text). The likely cause is that the phone portrait grew when CD 1 removed `overflow: hidden`. It is preloaded with `fetchpriority="high"`, starts at 22ms, and the render delay is 59ms, so it is healthy. Record the change in LOG.md as F9 asks. The headroom to 1.8s is now 300ms.

## Risks

- R1: the light-pool pattern is copied in two files. A third section that copies it brings the edge back. Put it in one shared class.
- R2: `bendBuild` timings come from the dev server. Production is minified and faster, so the margins are real, but `perf.mjs` cannot measure the production bundle. Keep that limitation recorded in the script header (it already is).
- R3: the frame gate's limit is 1.5× the refresh interval. On a 60Hz machine it becomes 25ms, looser than the brief's 16.7ms. Pin the limit to `min(16.7, 1.5 × vsync)` before the release review runs anywhere else.
- R4: real macOS Safari (plan F3) has still not been run once. The simulator and Playwright WebKit stand in for it.
