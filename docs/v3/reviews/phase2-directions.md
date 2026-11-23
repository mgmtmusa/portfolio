# Phase 2: the three hero directions, reviewed

Prototypes: `prototypes/v3-hero/` (served on port 4411; picker at `/`, directions at `a.html`, `b.html`, `c.html`). Evidence: `.impeccable/review/directions/` (rest and motion, 1440×900 Chromium and WebKit, iPhone 14 WebKit). Since the reviews, two factual bugs were fixed in the prototypes: per-glyph positions for the bent copy (WebKit ignores `letter-spacing` on SVG text) and height-aware sizing (`--u: min(100vw / 1440, 100svh / 900)`).

## Independent critique (taste-skill gate + Impeccable rubric; degraded single-context run)

- Taste gate: FAIL on all three (A 46, B 41, C 45 findings; many are kit page-structure rules). Impeccable heuristics: A 15/28, B 16/28, C 17/28. Cognitive load: A 3 failures, B 4, C 2.
- Shared defects: S1 WebKit letter-spacing misregistration (fixed); S2 outward edge sampling cuts letter feet and doubles adjacent lines, and the pane has almost no body; S3 width-only sizing (fixed); S4 strip has no background; S5 dock unreadable over large type; S6 hidden controls stay in the Tab order; S7 portraits are cut-outs with hard hair edges, and B and C sit on a painted backdrop sheet with banding and straight edges; S8 the pitch line is a 26px caption under a 213px name; S9 morphs animate layout properties; S10 footnotes jump to a list.
- A: most editorial, weakest at selling (pitch and CTA below the fold on laptops; the lapel turns "Abdullah" into "Abdullab"; phone scrolls sideways). B: most literal, most template-like (a nav toolbar parked across the hero; stock split hero). C: the only one whose reading order sells (role, pitch, CTA, then face, name, proof; the slab is a real object and bends the photograph too).
- Ranking on audience identification and product clarity: **C, A, B**. Recommendation: build C.

## Creative director (CHANGES REQUIRED on all three; recommends C)

| Area | A | B | C |
|---|---|---|---|
| First five seconds | 3 | 2 | 4 |
| Family resemblance | 4 | 3 | 4 |
| Typography | 3 | 3 | 3 |
| Glass | 2 | 1 | 2 |
| Portrait | 3 | 2 | 3 |
| Composition | 3 | 2 | 4 |
| Motion | 3 | 3 | 3 |
| Mobile | 2 | 2 | 2 |
| Originality | 4 | 2 | 4 |
| Slop check | 3 | 2 | 3 |

Extra defects the director confirmed: a black hole under the pane during the load and after the reduced-motion fade (the knock-out runs before the pane is visible); the pane's horizontal edges within ~22px of the cap line and baseline read as a highlight box; the morph's middle is a flat pill then a blur smear; at 1024 the strip wraps; the shirt grades muddy (#C9C2B8).

**Required changes to C before it becomes the contract** (1440 grid, `u` units):
1. Bend alignment: per-glyph x (done); baseline from a DOM probe; at strength 0 the copy matches within 1px at 2× in Chromium and WebKit.
2. Bend mapping: inward sampling; desktop band 40, scale 18; phone band 20, scale 9; filter region = pane + 2× band; no glyph fragment narrower than 18u either side of a vertical edge (nudge the pane x by up to ±12u).
3. Knock-out timing: the hole exists only while the pane's opacity is above 0 (load, reduced-motion fade, dock morph).
4. Pane at rest: x 612–972 (360u), y 452–686 (234u), radius 52u; refracts the tie, shirt V, lapels and "Abd"; top edge 52u below the shoulder line; no horizontal edge within 24u of any cap line or baseline; never over the word space.
5. Pane body: `radial-gradient(70% 110% at 10% 0%, rgb(255 226 190 / .10), transparent 58%), linear-gradient(180deg, rgb(255 248 236 / .05), rgb(255 248 236 / .015) 60%)`; `box-shadow: inset 0 1px 0 rgb(255 244 224 / .24), inset 1px 0 0 rgb(255 244 224 / .10), inset 0 -12px 24px rgb(6 5 4 / .26), 0 0 0 1px rgb(6 5 4 / .45)`; rim 1.5px, top-left catch .80; inner rim kept; contact shadow `rgb(6 5 4 / .25)` offset (10u, 16u) blur 28u.
6. Affordance: pointer enter rim .80→.95 and shadow (14u, 22u) over 160ms; press scale .985; cursor grab/grabbing; load glide response 1.1, damping 1, no overshoot; horizontal drag only; fling-to-dock removed.
7. Scroll, with A's choreography: 0–90px pane fixed with the bend live and line 1 sliding through; 90–360px scrubbed FLIP morph to the dock (`power3.inOut`, `clip-path: inset(… round …)`); during the morph the bend is off, blur 4px, body gradient and rim kept; a 200ms stop between .05 and .95 springs the pane to the nearer end (response .45, damping 1) without moving the page.
8. Fit: hero `height: 100svh`, `min-height: 600px`; at 1440×789, 1280×720 and 1024×768 the baseline of "Walid", the line and the CTA are in the first viewport.
9. Re-flow: role at 112u; the line in Host 480 at 40u/1.06, −0.022em, max 520u, three balanced lines (136–264u); CTA row 296–344u; proof as cover lines right of his head (x 1090–1382u, y 128–420u; figures Host 500 36u; labels Geist 13/18; 24u gaps); masthead unchanged (line 1 cap top 514u, line 2 baseline 847u); right of "Walid" (x 732–1382u, y 720–847u) the full `site.availability` and the reply time, Geist 14/1.45, secondary, max 440u; C's hero light pool removed (two glows at most).
10. Portrait, option 1 everywhere: the whole photo graded, backdrop darkened by multiply (never cut): #1F1C19 at 38%, 18% falling to #151311 within 300u; frame edges dissolve through `radial-gradient(62% 60% at 47% 40%, #000 60%, transparent 100%)` plus a bottom fade 80→100%; shirt peaks at #DDD6CA; at 200% no banding or straight edges, outer 24px band within 1/255 of the page in mean luminance, a photographic hair edge.
11. Strip: no fill at rest; past 8px of scroll a mask behind it, `linear-gradient(#121110 0, rgb(18 17 16 / .86) 32px, transparent 64px)`, fading in over 180ms; below 1180px drop the availability slot; phone shows the clock only.
12. Dock: blur 16px, fill `rgb(26 24 22 / .55)`, labels `#F3F1EC` 500, auto width with 4px gaps, `inert` while hidden; the dock's "Get in touch" hides while the hero CTA is at least 50% in view.
13. Phone (390×664 visible): strip clock only (28px); line Host 480 30px/1.06 at y 44–140; portrait 280×280 centred at y 136–416 (tight crop ≥ 1000 source px, dissolving 340–416); masthead three lines at 20vw (78px), −0.04em, at y 400–457, 465–522, 530–587; pane 210×112, radius 32, x 100–310, y 450–562 over "Abdullah"; CTA and Download CV at y 604–652; availability and proof start screen two; no sideways scroll at 375.
14. Grain: delete the fixed overlay; a static noise tile baked into the body light field only (the production build already does this).
15. Footnotes: a popover at each marker (the production build already does this).

**Keep:** the Host Grotesk masthead (540, 213u/.84/−0.045em, `#E7E2D7`); "Musa Abdullah" at full width across the foot; the warm, faithful skin grade; C's centred face; the pane refracting pinstripes and tie; A's slide-through moment, now in C; champagne footnote markers; the `#F3F1EC` CTA; the strip clock; B's and C's clean reduced-motion versions.

## Conflicts for the principal to rule on

1. **The H1.** CMO (`story.md`): the positioning line is the H1. Creative director: the name is the H1 (the entity that ProfilePage JSON-LD, share previews and AI answers key on); the line is the first paragraph after it, at display size, placed first in reading order.
2. **The strip.** Critique: a solid `rgb(18 17 16 / .88)` bar with a 12px blur. Director: no fill at rest, a scroll-edge mask once scrolled (a bar is a header, not chrome).
3. **The dock fill.** Critique: blur 20, fill .72. Director: blur 16, fill .55 (worst-case label still about 6.9:1).
4. **The grain.** Critique: delete it. Director: keep it, baked into the light field (Appendix B wants it against banding).
5. **Drag affordance.** Critique: a 16px settle overshoot after the glide. Director: no overshoot without a gesture; a hover and press lift instead.
6. **"One action" for the conversion path** (head of engineering N4): is ⌘K / Menu (one action from the dock) close enough for LinkedIn and Download CV, given the footer and next step also carry them?
