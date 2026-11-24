# Studio review round 2: creative director

Reviewed against `docs/evidence/round-4/` (capture, hero states in Chromium and WebKit, iPhone 17 Simulator, motion contact sheets in normal and reduced motion) and live on the preview at http://127.0.0.1:4322/ through Playwright: Chromium and WebKit at 1440x900 (1x and 2x), 1024x768, 412, 390, 375 and 320 (3x), full-page scroll of home, /work/, /work/evitech/, /about/, /contact/ and /cv/, `prefers-contrast: more`, reduced motion, slab drag, footnote popover, the command menu and keyboard focus on /contact/. My own captures are in `/private/tmp/claude-501/cd-r2/` and are cited by file name below.

## Verdict

**CHANGES REQUIRED.**

Round 1 landed almost in full and the hero is now at the bar: the phone portrait dissolves cleanly, the bend is smooth at 2x in both engines, the seam in the "d" is gone, the name no longer dims on desktop load, the fallback mode is right and the strip no longer flashes. Two things hold the round back. The light pools I asked for in round 1 (item 14) shipped with hard edges: a 10-level horizontal line now crosses behind "Walid" in the first viewport at 1440 and 1024, another runs through "How I work", and on phones a vertical edge runs down the Path. And the site still has two moments people would record, not three.

## Scorecard

| Area | Score | Reason |
|---|---|---|
| First five seconds | 4 | Line, face and name read in order on desktop and now on phones too. The pool edge behind "Walid" is the one thing a stranger could catch. |
| Family resemblance | 4 | Same world as the references (dark, huge name, editorial portrait, glass) with nothing lifted; the name stays inside its margins. |
| Typography | 4 | 320 holds three rows at 24px, case titles are balanced, the How I work rows have a real scale. Phone H2 breaks "door- / to-door". |
| Glass | 4 | At 2x the bend is smooth with no seam (my `c2x-slab.png`, `w2x-slab.png`, `d-foot.png`); fallbacks are correct. Footnote popover still lets the figures behind it bleed through. |
| Portrait | 4 | Desktop graceful; phone edges now within 1 to 2 levels of the page at 390 and 412 (sampled), no hard box, suit never ends on a straight line. |
| Composition | 3 | Work row and How I work fixed, but both light pools draw hard edges (horizontal at 1440 and 1024, vertical on phones). This is a craft defect inside the hero. |
| Motion | 4 | Desktop load keeps every glyph at full ink (Chromium load frames 524 to 2790ms, glyph p90 224 inside and outside the slab), no strip flash, no entrance replay on return. WebKit residuals below. |
| Mobile | 4 | Native-feeling stack, portrait fixed, 320 fixed, iOS rest shows the slab with a lit rim, 16px edge holds at every phone width. |
| Originality | 3 | Still two recordable moments (the slab bend and drag; the slide into the dock). Nothing below the fold is a third. |
| Slop check | 4 | No banned patterns, no icons, no purple. The three-up template is gone. |

## Round 1 fixes and rulings: status

| Item | Status | Evidence |
|---|---|---|
| 1 Phone portrait box | Landed | `capture/home-390.jpg`, `home-375.jpg`, `ios/iphone17-rest.png`; my `c-home-390.png` row 1150 and `w-home-412.png` row 1200 stay at 20 to 24 across the old edge. |
| 2 Bend aliasing and seam | Landed at 2x (the acceptance); 1x residual noted in fix 7 | My `c2x-slab.png`, `w2x-slab.png`, `d-foot.png`; `hero/chromium-1-rest.png`. |
| 3 Name dims during glide | Landed on desktop; WebKit phone residual (fix 6) | `motion/chromium-normal-load-*` constant; `motion/webkit-normal-load-01084` to `01897` row 2 at p90 172 against 224. |
| 4 Fallback dock and strip | Landed | Live, contrast more: dock opacity 0 and `inert` at rest, strip carries `data-avail-hidden`; my `contrast-1440.png`. |
| 5 Strip flash | Landed | My `strips.png` (150, 400, 800, 1500ms): clock only. |
| 6 Work row collision | Landed | My `home-1440-4.png`: "28% 65%" ends near x 640, label column at 732. |
| 7 / ruling 5, 320 line | Landed in code and tests; DESIGN.md not updated (fix 5) | Live 320: line 24px, rows end at y 132, photo starts at 133; `Hero.astro` 235 to 239, `layout.spec.ts` 123 to 137. |
| 8 iOS gate | Landed | `ios/iphone17-rest.png` shows the slab and clock digits; `ios-summary.json` "slab top rim lit" litShare 1. |
| 9 Command menu order | Landed (label nit in fix 8) | My `cmdk.png`. |
| 10 Footnote popover | Partly: moved below the 28%/65% group, now covers $2M+ and 13,200 with visible bleed (fix 3) | My `fn.png`. |
| 11 How I work rows | Landed | My `home-1440-3.png`. |
| 12 Contact dock | Landed (`scroll-padding-bottom: 112px`, CTA hidden); rest overlap remains (fix 9) | Live; my `sheet-contact.png`. |
| 13 Widows | Landed | My `m390-a.png`, `sheet-work.png`. |
| 14 Light below the hero | Landed with hard edges: regression (fix 1) | See fix 1. |
| Ruling 4, 16px phone floor | Landed in `tests/e2e/hero-states.spec.ts` 201 to 206 (`width < 640 ? 16 : 18u`, hard assertion); DESIGN.md Edges line not amended (fix 5) | |
| Item 3 counter "1 of 3" | Landed | My `sheet-evitech.png`. |
| Item 6 /for CV links | Landed: 2 PDF links in `main` on /for/example-company/ | Live. |

## Fixes, ordered by impact

1. **Both light pools draw hard edges (home every width; also the first viewport).**
   Files: `src/components/Path.astro` line 37 (`.path::before`) and `src/components/CaseTeasers.astro` line 54 (`.teasers::before`). The box starts at `top: -140px` while the gradient centre sits only 140px below that edge, so the pool is still near full strength where the box ends; `max-width: 120vw` also cuts the circle on phones.
   Evidence: `hero/chromium-1-rest.png` column x 30 steps from 22 to 33 between y 754 and 760 (behind "Walid"); `hero/chromium-3-docked.png` the same step at y 518; my `home-1024.png` 23 to 32 at y 498 to 502 (between "Abdullah" and "Walid"); my `home-1440-3.png` 23 to 31 at y 654 to 660 (through "Speed to lead"); my `m390-01.png` row 330 drops from 30 to 23 at x 168 (a vertical edge down the Path).
   Change, both selectors: `left: -400px; top: -280px; width: 800px; height: 800px; max-width: none; background: radial-gradient(circle 400px at 400px 400px, rgb(var(--key) / .05), transparent);` (centre at the section's x 0, y 120; the box contains the whole circle, so it reaches zero before every edge; `body { overflow-x: clip }` already prevents sideways scroll). Acceptance: no adjacent-pixel step above 2 levels anywhere in the pool at 320, 390, 1024 and 1440, sampled on a column and a row through the old edges. Add the check to `layout.spec.ts` if it can be done with a screenshot sample.

2. **Originality: add the third moment, and make it the concept (home, Path).**
   The site promises "one light, every number footnoted". Make the light travel: in `src/components/Path.astro` the Path's single key pool (the one from fix 1) moves to the rung being read. One element, `translate` only, `transition: translate 900ms cubic-bezier(.16, 1, .3, 1)`; an IntersectionObserver on each rung with `rootMargin: '-35% 0px -55% 0px'` sets the target to that rung's figure (pool centre 40px left of and 60px above the figure's top-left). Nothing else moves; no idle drift; reduced motion jumps instantly with no transition; no JS leaves the pool on the first rung. Acceptance: a scroll recording through the Path at 1440 and 390 shows the light settling behind "Day one", "$2M+", "23" and "$15K to $30K" in turn, with `perf.mjs` frames still at least 95% under 16.7ms.

3. **Footnote popover covers the next figures and lets them bleed through (home hero, 1440).**
   File: `src/components/Footnote.astro` line 21 (`background: rgb(26 24 22 / .94)`) and the `glass-rim` class on line 9. Note 1 opens at x 1069 to 1409, y 262 to 388, over "$2M+" and "13,200", and the 6% bleed shows the "$" and "13,200" through the note text: body text on a translucent surface, which DESIGN.md bans.
   Evidence: my `fn.png`.
   Change: `background: var(--raised)` at full opacity, keep the 1px `--line` border, add `box-shadow: 0 18px 40px rgb(6 5 4 / .6)`, drop `glass-rim`. Position stays. Acceptance: no figure glyph visible through the open note at 2x.

4. **Phone H2 breaks the compound: "From door- / to-door sales" (home, 390 and below).**
   File: `src/components/Path.astro` line 15. Wrap the compound: `From <span class="nobr">door-to-door</span> sales to marketing, in four roles` with `.nobr { white-space: nowrap; }` (do not use U+2011; Host may not carry it). Evidence: my `m390-a.png` first panel. Acceptance: "door-to-door" on one line at 320, 375, 390 and 412.

5. **DESIGN.md does not record either round 1 ruling.**
   File: `DESIGN.md` line 63 still reads "no glyph fragment narrower than 18u at either vertical edge". Replace with: "no glyph fragment narrower than 18u at either vertical edge at 640px and up; below 640px the floor is 16 CSS px. The snap always picks the position that maximises the smallest fragment." Line 53: the width list becomes "320, 360, 375, 390, 402 and 412", with "at 320 the line is 24px and the portrait moves down 12px".

6. **WebKit motion residuals on phones (for the motion reviewer to confirm).**
   (a) During the glide the "Abdullah" row under the slab renders at about 77% ink in Playwright WebKit (`motion/webkit-normal-load-01084` to `01897`, `webkit-normal-scroll-00000` to `01826`, row 2 p90 172 to 180 against 224 outside). The iPhone 17 Simulator does not show it (`iphone17-scrolled-45.png` 224 inside and outside), so verify on the Simulator mid-glide before changing code; if it reproduces, the originals must stay at full ink while the bend is off on touch (the same rule as fix 3 of round 1).
   (b) On touch the bend is off for the whole 90px slide (`hero.ts` line 358, documented in DESIGN.md line 66), so on phones the signature moment is straight letters passing under a tinted slab (`iphone17-scrolled-45.png`). Try keeping the bend on during the slide on touch (the map is static; only the copy offset changes, as on desktop) and keep it only if `perf.mjs` at 4x CPU still passes the frame gate; otherwise keep the current behaviour and note the trade in DESIGN.md.
   (c) WebKit paints the portrait after the masthead: frame 319ms has the masthead but no portrait, frame 528ms has both (`motion/sheet-webkit-normal-load.png`). DESIGN.md says both paint at first paint. Confirm on the built preview with a cold cache; if it holds, check the preload `imagesizes` (351px phone) matches the rendered `<img sizes>` exactly so the preload is used.

7. **Bend at 1x: small teeth remain in the bottom band (desktop external monitors).**
   At 1x the bowls of "b" and "d" and the baseline of "ullah" step by 2 to 3 pixels (`hero/chromium-1-rest.png`, `webkit-5-dragged.png`, my `z1024.png`). The round 1 acceptance (2x) passes, so this is not blocking. If cheap: at `devicePixelRatio < 1.5` in Chromium raise `SOFTEN` in `src/scripts/bend.ts` line 31 from .35 to .5. Leave WebKit as it is.

8. **Command menu label (CMO to confirm).**
   `src/lib/command.ts` line 23: `label: 'Download CV'`; every other place says "Download CV (PDF)". Use `'Download CV (PDF)'`.

9. **Contact at 1440x900: the dock sits on the Timeline field at rest.**
   Dock y 820 to 876, Timeline input y 845 to 887 (live). `scroll-padding-bottom` fixes focus but not the first view. On `/contact/` keep the dock hidden and `inert` until `scrollY > 160`, using the same show and hide path as the home hero.

10. **View transition, home to /work/: one frame stacks the label on the figure.**
    `motion/sheet-chromium-normal-vt.png` frame 2 (346ms): "lower cost per acquisition" overlaps "28% 65%" while the incoming page settles. Motion reviewer to confirm and fix the entrance so the label never paints above its figure's box.

## Keep

- The desktop cover at 1440x900: line and CTA top left, portrait centred, cover lines in column 10, the name across the foot, availability on the "Walid" baseline (`hero/chromium-1-rest.png`).
- The slab as it now renders at 2x: clean refraction of the suit and the name, thin lit rim, inner rim, no seam (my `c2x-slab.png`, `w2x-slab.png`).
- The phone portrait dissolve and the phone stack order (`capture/home-390.jpg`, `home-375.jpg`, my `c-home-320.png`).
- The scroll hand-off into the dock and the return without a replayed entrance (`hero/chromium-3-docked.png`, `motion/sheet-chromium-normal-vt.png` frames 7 to 15).
- Reduced motion as a complete version (my `rm-300.png`: everything present at 300ms).
- The `prefers-contrast: more` version: full name, no slab, dock hidden at rest (my `contrast-1440.png`).
- How I work as rows, the Work rows with the paired figure at its new size, the closing footnote list.
- The command menu: Actions first, the blur over the portrait.
- /contact: "Aim to reply by" block and the brief preview.
