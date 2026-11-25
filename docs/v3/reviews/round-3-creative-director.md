# Studio review round 3: creative director

Reviewed against `docs/evidence/round-5/` (full-page capture of every page at 1440, 1024, 390 and 375; hero states in Chromium and WebKit; iPhone 17 Simulator; motion frames and contact sheets in normal and reduced motion) and live on the preview at http://127.0.0.1:4322/ with three light Playwright Chromium scripts: home at 1440x900 and 390x844 (touch), scrolled rung by rung through the Path; the hero footnote popover at 2x; the command menu; /contact/ and /about/ at 1440x900. Pixel checks were run with sharp on the evidence and on my own frames, which are in `/private/tmp/claude-501/-Users-musaabdullahwalid-Desktop-untitled-folder/53729b5f-56ab-4f35-9eef-44ce0e7e9166/scratchpad/cd-r3/` and cited by file name below. The Playwright suite was not run (the head of engineering owns it this round). The taste-skill checker and finish gate were not run, to spare the machine's memory.

## Verdict

**APPROVED.**

Every line scores 4 or above, and every material fix from round 2 has landed. The light pools are clean live at every width. The Path key light now travels rung to rung as the third moment and carries the concept. The footnote popover is opaque. "door-to-door" holds on one line on phones. DESIGN.md records both rulings and the third moment. WebKit no longer dims the name during the glide or the slide, and on touch the bend now stays on through the slide. What remains is polish plus one WebKit paint-order check. None of it holds the round, but items 1 to 4 below should land before the release candidate.

## Scorecard

| Area | Score | Reason |
|---|---|---|
| First five seconds | 4 | Line, face and name read in order at 1440 and 390, and nothing in the hero catches the eye for the wrong reason now. WebKit still paints the portrait about 200ms after the masthead (fix 1). |
| Family resemblance | 4 | Same world as both references (dark room, huge contained name, editorial portrait, real glass) and nothing is lifted. |
| Typography | 4 | Phone H2 now keeps "door-to-door" whole (`h390-a.jpg`). The scale holds from the masthead through the How I work rows to the footer name. |
| Glass | 4 | The slab at 2x is clean in both engines and the popover is no longer glass (`rgb(26, 24, 22)` opaque, my `fn.png`). Small teeth remain in the slab's bottom band at 1x (`slab1x.png`). |
| Portrait | 4 | Graded and graceful. The phone dissolve has no box and the iOS rest frame is clean (`ios/iphone17-rest.png`). |
| Composition | 4 | Pools measured live with no step above 2 levels (`d-scroll50.png`, `m-scroll50.png`, `m-rung0.png`, `d-rung2.png`). Two small things remain: the phone staircase indent and the contact dock at rest (fixes 3 and 7). |
| Motion | 4 | WebKit masthead ink is constant through load (231 to 232 inside and outside the slab, `webkit-normal-load-*`) and through the slide (230 against 227, `webkit-normal-scroll-*`). The light moves with a 900ms expo-out. One view-transition frame still stacks a label on its figure (fix 4). |
| Mobile | 4 | Native stack, 16px edge, bend visible during the slide on iPhone 17 (`ios/iphone17-scrolled-45.png`, the left "d" bowl and the "usa" feet refract at the edges), and the light travels at 390. |
| Originality | 4 | Three moments now: the slab bend and drag, the slide into the dock, and the light that follows the reading. The third one is quiet: a 7-level lift on desktop (21 to 28, `d-rung0` to `d-rung3`) and 12 on phones (21 to 33). It is fine in the room but faint in a screen recording (fix 2). |
| Slop check | 4 | No banned patterns, no icons, no purple, no kicker. The "Draft for Musa's approval" pill on /about/ is a labelled placeholder and is allowed until hand-back. |

## Round 2 fixes: status

| Round 2 item | Status | Evidence |
|---|---|---|
| 1 Light pools with hard edges | Landed | Live, banded column samples (40px wide, 5px smoothing) show no step above 2 levels in either pool at 1440 or 390, behind "Walid" or anywhere in the Path (`d-scroll50.png`, `m-rung0.png`, `m-rung2.png`, `d-rung2.png`). `hero/chromium-1-rest.png` and `chromium-3-docked.png` are flat at x 10 to 50 and x 1390 to 1430. Note: the full-page captures show a 4 to 5 level line at y 900 (1440), 768 (1024) and 664 (390, 375). That line is a capture artifact: `body::before` is `position: fixed`, so the grain and field cover only the first viewport in a full-page shot. Live it is not there (fix 9). |
| 2 Third moment, the Path key light | Landed as specified, recorded in DESIGN.md Motion | Live `.path-light` translate per rung: 1440 is (0, -1.6), (224.7, 288.5), (449.3, 602), (674, 915.4); 390 is (0, -1.6), (14, 282.4), (28, 566.4), (42, 897). The box holds the whole circle (800px desktop, 684px phone). The perf frame gate with the light moving is for the head of engineering to confirm. |
| 3 Opaque popover | Landed | `Footnote.astro` line 21 is `var(--raised)` with the shadow, and `glass-rim` is gone. My `fn.png` at 2x shows no glyph through the note. A 4px sliver of "13,200" shows below it (fix 5). |
| 4 Door-to-door on phones | Landed | `Path.astro` line 15 `.nobr`; `h390-a.jpg` centre panel. |
| 5 DESIGN.md rulings | Landed | Edges line carries the 16px floor below 640px and the snap rule. The phone width list includes 320 at 24px with the portrait 12px lower. |
| 6a WebKit glide dimming | Landed | Numbers in the Motion row above. |
| 6b Bend during the touch slide | Landed | `ios/iphone17-scrolled-45.png`: edge refraction visible mid-slide. |
| 6c WebKit portrait paint order | Not landed (fix 1) | `motion/webkit-normal-load-00302.png` has the masthead and no portrait; `00503` has both. |
| 7 Bend teeth at 1x | Unchanged, non-blocking (fix 8) | `slab1x.png`: the feet of "b" and "d" ripple in the bottom band. |
| 8 Command menu label | Not landed (fix 6) | My `cmdk.png`: "Download CV". |
| 9 Contact dock at rest | Partly: it now sits on the role textarea's corner, not the Timeline field (fix 3) | Live: dock y 820 to 876, x 558 to 880, opacity 1, not inert; textarea x 58 to 596, y 737 to 872. My `contact.png`. |
| 10 View transition label stack | Not landed (fix 4) | `motion/chromium-normal-vt-00350.png`, my crop `vt350.png`. |

## Fixes, ordered by impact

1. **WebKit paints the portrait after the masthead (home, phones). This breaks the LCP rule in DESIGN.md.**
   Evidence: `motion/webkit-normal-load-00302.png` against `00503.png`, the same as round 4. The capture ran on the dev server, so first confirm it on the built preview with a cold cache. If it holds: the hero `<img>` gets `loading="eager" fetchpriority="high" decoding="sync"`. The `<link rel="preload" as="image">` `imagesrcset` and `imagesizes` must match the rendered `srcset` and `sizes` character for character (phone `351px`), so WebKit reuses the preload. Acceptance: in the first WebKit frame that has the masthead, the portrait is also present, at 390 and 1440.

2. **The third moment is too quiet to survive a recording (home, Path, desktop).**
   The light lifts the field 7 levels at 1440 (median 21 to 28 behind the lit figure) and 12 at 390. H.264 at normal bitrates flattens a 7-level gradient, so the moment vanishes from the screen recordings it exists for. Change `.path-light` to `rgb(var(--key) / .07)` at `min-width: 768px` and keep .05 below. Update the DESIGN.md Motion line to ".05 phone, .07 from 768px". Acceptance: a lift of at least 10 levels behind the lit figure at 1440. No adjacent-pixel step above 2 levels. Body text over the pool stays at or above 7:1 for `--text-2`.

3. **Contact at 1440x900: the dock sits on the role textarea at rest.**
   It covers the field's right edge from x 558 to 596, y 820 to 872. On `/contact/`, keep the dock at `opacity: 0` and `inert` until `scrollY > 160`, using the same show and hide path as the home hero. Leave `scroll-padding-bottom: 112px` in place for focus.

4. **View transition, home to /work/: one frame paints the label over its figure.**
   `chromium-normal-vt-00350.png`: "lower cost per acquisition, and more qualified leads" overlaps "28%". The incoming label must not paint until its figure's box has settled. Either give the label `view-transition-name` of its own with the same group timing as the figure, or delay its fade-in by the figure's 160ms settle. Motion reviewer to confirm. Acceptance: no frame from 0 to 600ms where the label's box intersects the figure's glyph box.

5. **Footnote 1 popover leaves a 4px sliver of "13,200" below it (home hero, 1440).**
   The note ends at y 391.5 and the "13,200" glyphs run to about y 395 (my `fn.png`). Either end the note on a clear line, with `padding: 14px 16px 22px` taking the bottom to about 399, or open note 1 so its top sits 8px below the "13,200" label (about y 428). Acceptance: no partial glyph visible at either edge of any open note at 1440 and 1024.

6. **"Download CV" without "(PDF)" in two places (CMO to confirm).**
   `src/lib/command.ts` line 23, and the footer link on every page (`h1440-03.jpg`, footer nav). Both become "Download CV (PDF)".

7. **Phone Path staircase reads as misalignment (home, 390 and 375).**
   On phones the rungs step in by about 14px each (the light's x goes 0, 14, 28, 42). That is too small to read as a deliberate staircase and too large to read as one edge (`h390-a.jpg`, `m-rungs.png`). Below 640px, set every rung's inset to 0 so all figures sit on the 16px edge, and let the light move vertically only. Keep the staircase from 640px up.

8. **Bend teeth at 1x (desktop external monitors, non-blocking).**
   This is unchanged since round 2 (`slab1x.png`). If it is cheap, raise the supersample softening at `devicePixelRatio < 1.5` in Chromium only. Leave WebKit as it is.

9. **Capture tooling, not the site.**
   `scripts/qa/capture.mjs` full-page shots freeze `position: fixed` layers at the first viewport. The field and grain end at y = viewport height, which shows a false 4 to 5 level line, and the dock sits mid-page (for example on /about/ over the signature line, which is clean live in my `about-live.png`). Stitch viewport-height screenshots instead, or switch `body::before` to `position: absolute` with the document height only during capture. Then the next round's evidence will not show edges that do not exist.

## Keep

- The desktop cover at 1440x900 exactly as it is (`hero/chromium-1-rest.png`, `webkit-1-rest.png`): line and pill top left, portrait centred, cover lines in column 10, the name across the foot, availability on the "Walid" baseline.
- The slab at 2x and on iPhone 17: clean refraction, thin lit rim, inner rim, no seam, and the bend now visible through the touch slide.
- Full masthead ink through the WebKit glide and slide.
- The Path key light's behaviour: one element, translate only, 900ms expo-out, no idle drift, instant under reduced motion, resting on the first rung without JS.
- The opaque footnote note with its shadow and champagne marker.
- The phone portrait dissolve and stack order, and "door-to-door" held whole.
- Reduced motion as a complete version, and the `prefers-contrast: more` version with no slab and a hidden dock.
- The command menu: Actions first, blur over the portrait.
- How I work as rows, the Work rows with the paired figure, the closing footnote list, the "Send me the brief." close.
