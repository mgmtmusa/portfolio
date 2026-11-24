# Studio review round 1: creative director

Reviewed live on the built preview at http://127.0.0.1:4322/ (Chromium and WebKit through Playwright at 1440x900, 1024x768, 390x844, 375x667, 412x915 and 320x640; reduced motion; `prefers-contrast: more`; slab hover, footnote popover, the command menu) and against the round-3 evidence in `docs/evidence/round-3/`. My own captures are in the session scratch folder and are cited by name below where the round-3 set does not show the problem.

## Verdict

**CHANGES REQUIRED.**

The desktop cover is close to the bar: dark, confident, and the slab refracts real content (the portrait and the name), which is the right idea of glass. It is held back by four things a stranger would notice: the phone portrait sits in a hard-edged box, the bend shows stair-stepped and torn glyph edges, the name visibly dims while the slab glides in, and the fallback mode parks the dock on top of the masthead. Below the hero, the home page is clean but ordinary.

## Scorecard

| Area | Score | Reason |
|---|---|---|
| First five seconds | 4 | Desktop cover lands: line, face and name read in that order. Phone loses it to the boxed portrait. |
| Family resemblance | 4 | Clearly in the world of the references (dark, huge name, editorial portrait) with nothing lifted: the name stays inside its margins. |
| Typography | 4 | Masthead tracking and the hand-broken line are right. 320px breaks the line into four rows; case titles leave one-word widows. |
| Glass | 3 | Refracts real content and the recipe is consistent, but the bend aliases, a seam shows in the "d", and the fallback path misplaces the dock. |
| Portrait | 3 | Desktop is graceful and clean. On phones a hard square crop cuts the dissolve: a visible 3 to 4 level step on all four edges. |
| Composition | 3 | Hero is one idea. Home Work row collides (28% 65% runs 19px into the text column); "How I work" is a three-up template. |
| Motion | 3 | Dock morph and reduced motion are good. Load dims the name under the slab and flashes the strip availability for half a second. |
| Mobile | 3 | Stack order is right, but boxed portrait, 320px collision and an iOS rest capture with no slab. |
| Originality | 3 | One strong moment (the slab) and a second (sliding into the dock). Nothing below the fold anyone would record. |
| Slop check | 4 | No banned patterns, no purple, no icons. The three equal approach columns are the only template tell. |

## Fixes, ordered by impact

1. **Phone portrait is a hard-edged box (home, all phone widths and iOS).**
   File: `src/components/Hero.astro` line 212, phone block: `.photo { width: calc(280 * var(--p)); height: calc(280 * var(--p)); overflow: hidden; }` with the 351px image offset by -21/-14. The overflow crops the asset's own elliptical dissolve, so the graded black (#121110, 18/17/16) meets the lit page (22/21/20) along straight lines: right edge at x 355 and the bottom edge under the suit, directly above "Musa".
   Evidence: `docs/evidence/round-3/ios/iphone17-rest.png`, `iphone17-back.png`, `docs/evidence/round-3/capture/home-390.jpg`, `home-375.jpg`; my `home-412-rest.png` (pixel step 18 to 22 across x 355).
   Change: remove `overflow: hidden` from the phone `.photo` and give `.photo` `-webkit-mask-image` and `mask-image: radial-gradient(ellipse 50% 50% at 50% 46%, #000 62%, transparent 100%)` so the dissolve finishes inside the box (the parent mask composes with the img's slab knock-out mask, no `mask-composite` needed). Acceptance is DESIGN.md's own: all four edges within 1 level of the page at 375, 390, 412 and in the iOS Simulator, and the suit never ends on a straight horizontal line.

2. **The bend aliases: stair-stepped contours, torn glyph bottoms, a seam in the "d" (home hero, every width).**
   File: `src/scripts/bend.ts` (`MAP_SCALE = 0.5`, filter at lines 95 to 105). `feDisplacementMap` samples nearest-neighbour in Chromium and WebKit, and the half-resolution map is upscaled, so displaced edges step. Inside the slab the bottoms of "Abd" end in teeth at y 668 to 675 (1440), and the "d" stem shows a two-tone strip at x 940 to 950.
   Evidence: `docs/evidence/round-3/hero/chromium-1-rest.png`, `webkit-1-rest.png`, `chromium-2-slide.png` (the "A" apex at the slab's top edge), `chromium-5-dragged.png` ("h" at the right edge); my 2x crops `slab-chromium.png` and `slab-webkit.png`.
   Change: build the map at device resolution (`MAP_SCALE = devicePixelRatio`, with dpr in the cache key); append `<feGaussianBlur stdDeviation="0.35"/>` after `feDisplacementMap` inside the same filter; confirm the knock-out hole and the `clipPath` rect share identical x, y, width, height and radius (the strip in the "d" reads as the original and the copy both drawing). Acceptance: at 2x no stair longer than 1 device pixel on any glyph contour inside the slab, no teeth on glyph bottoms, no seam, in Chromium, WebKit and the iOS Simulator.

3. **The name dims while the slab glides in (home, load).**
   Files: `src/scripts/hero.ts` and `src/scripts/bend.ts` (knock-out). At 120ms the glyphs under the moving slab ("sa A") render at about half brightness because the originals are cut out while the bent copy is still at the slab's partial opacity. DESIGN.md says the masthead is painted at first paint and never animates; this reads as it flickering.
   Evidence: my `load-120.png` (compare `load-720.png`).
   Change: while the slab's opacity is below 1, leave the originals intact and draw the bent copy over them at the slab's opacity; switch the knock-out on only when opacity reaches 1, and off again before any fade-out starts. Acceptance: frames at 120, 300 and 600ms show every masthead glyph at full `--ink-mast` outside and inside the slab.

4. **Fallback mode puts the dock on the masthead and duplicates availability (home, `prefers-contrast: more`, reduced transparency, forced colours).**
   File: `src/scripts/hero.ts` line 42: `if (getComputedStyle(slab).display === 'none') { showDock(true); return; }` shows the dock permanently and returns before the hand-offs at lines 274 to 284. At rest the dock (x 493 to 946, y 820 to 876) sits over the "d" of "Walid", and the strip shows `site.availability` and `site.replyTime` while the hero block shows the same text.
   Evidence: my `contrast-more.png`.
   Change: in the fallback branch keep the dock hidden and `inert` at rest, show it once the hero CTA is less than 50% in view (the same IntersectionObserver), and register the strip availability hand-off before returning. Add a Playwright case with `contrast: 'more'` asserting the dock is not shown at scrollY 0 and the strip availability is hidden.

5. **Strip availability flashes on load (home, 1180px and up).**
   File: `src/components/StatusStrip.astro`. The strip renders availability and reply time server-side, then hides them when the observer fires, so both sentences show in Geist Mono for about half a second.
   Evidence: my `load-120.png` against `docs/evidence/round-3/capture/home-1440.jpg`.
   Change: render `data-avail-hidden` on `.strip` server-side on the home page (a prop from `src/pages/index.astro`); the observer removes it once the hero availability block leaves view. Nothing in the strip changes during the first 1.5 seconds.

6. **Work row collision on home (1024 and up).**
   File: `src/components/CaseTeasers.astro`, `.case-fig` on the paired Evitech figure. "28% 65%" at 158.4px ends at x 751 while the label column starts at 732 (19px overlap at 1440, 16px at 1280, 12px at 1024), and footnote marker 1 lands on the "l" of "lower".
   Evidence: my `h1440-3.png` (the full-page split of `home1440-full.png`).
   Change: paired figure `font-size: clamp(72px, 9.4vw, 136px)` (right edge about 649 at 1440, 459 at 1024), keeping the single figures (18, 768) at the current size; rule that any `.case-fig` right edge is at least 48px left of the label column, and add it to `layout.spec.ts`. `/work/` is fine as is.

7. **320px: the line breaks to four rows and "closes." hits the hair.** See ruling on item 5 below.
   Evidence: my `home-320-rest.png`; the four rows sit at y 51, 79, 107 and 135, bottom 166, into the hair.

8. **iOS evidence does not show the slab, and the gate passed anyway.**
   File: `scripts/qa/ios.mjs`. `iphone17-rest.png` shows no slab and a strip clock without its time (scripts had not run), yet `ios-summary.json` passes "glyph pixels under the slab". In Playwright WebKit (iPhone 14) the slab is at opacity 1 by 1000ms, so this is likely capture timing, but the gate cannot tell.
   Evidence: `docs/evidence/round-3/ios/iphone17-rest.png`, `ios-summary.json`.
   Change: wait until the strip clock shows digits, then add an assertion that the slab rim is present (bright rim pixels along the slab's top edge at its expected rect) and recapture rest, scrolled 45px, mid-drag and docked. The surface brief's unresolved item (real-device bend capture) stays open until this exists; I will not sign off the signature moment without it.

9. **Command menu hides the actions DESIGN.md puts first.**
   File: `src/components/CommandMenu.astro`. On open the first visible rows are Pages (Home, Work, About, Contact, CV page), then Cases; the Actions group (Download CV (PDF), LinkedIn, Copy email) starts at the bottom edge and needs scrolling. DESIGN.md: they are the first visible rows.
   Evidence: my `cmdk.png`.
   Change: order Actions, then Cases, then Pages; drop the row for the page you are on.

10. **The footnote popover covers the figures it explains (home hero).**
    File: `src/components/Footnote.astro`. Note 1 opens at x 1085 to 1422, y 150 to 278, over "28%", "65%" and their labels.
    Evidence: my `fn.png`.
    Change: anchor the popover below the figure group it belongs to (top = bottom of that group's last label + 8px, left aligned to the cover-line column at 1069u), flipping above only when it would cross "Abdullah" by less than 24u.

11. **"How I work" is the three-up template (home).**
    File: `src/components/Approach.astro`. Three equal columns with hairline tops, title and body: the same-size card row the brief bans in spirit.
    Evidence: my `h1440-3.png`.
    Change: stack the three rules as rows: title Host 520 at 32px / 1.1 in columns 1 to 5, body Geist 17 / 1.55 in columns 7 to 11, a `--line` hairline between rows, 48px vertical padding per row. Phone keeps its single column.

12. **Contact: the dock covers form fields.**
    Files: `src/pages/contact.astro`, `src/components/Dock.astro`. At 1440x900 the dock sits over the Timeline input, and its "Get in touch" points at the page you are on.
    Evidence: `docs/evidence/round-3/capture/contact-1440.jpg`.
    Change: `scroll-padding-bottom: 112px` on `html` for pages with the dock, so a focused field never lands under it; hide the dock CTA on `/contact/`.

13. **Widowed case titles (home and /work, phone).**
    Files: `src/components/CaseTeasers.astro`, `src/components/WorkIndex.astro`. "Evitech: Paid media rebuilt around lead / quality" and "I Heart Uni: A student brand grown city by / city".
    Evidence: my `h390-5.png`.
    Change: `text-wrap: balance` on the case title element.

14. **The light dies below the hero (home and every interior page).**
    The key light that defines the concept is close to invisible after the first viewport; the lower home page is flat #121110 text. Low priority, but it is where originality is being lost.
    Change: one `--key` pool high left at the start of the Path and Work sections (radial, 900px radius, alpha .05, the same static grain inside it), nothing else. Glass and figures stay as they are.

## Rulings on the open questions

**Item 4, Pixel 7 and the 18u slab-edge rule (mine): amend the rule.**
The shortfall is 1px (best position leaves 17.7px of the 18.7px needed). The 18u floor exists so no fragment reads as a sliver; at the phone masthead (78px, Host 540) a full stem is about 11px, so any fragment of 16px or more still holds more than a whole stem and reads as intentional. Recomposing the phone hero for 1px would put the landed fixes at risk.
Record in DESIGN.md, Glass, Edges: "no glyph fragment narrower than 18u at either vertical edge at 640px and up; below 640px the floor is 16 CSS px. The snap always picks the position that maximises the smallest fragment." Replace the `test.fail` in `tests/e2e/hero-states.spec.ts` (line 205) with a hard assertion: at least 16px on the mobile projects, at least 18u elsewhere.

**Item 5, 320px (mine): fix it; do not scope it out.**
320 CSS px is what iPhone Display Zoom gives on SE and mini-class phones, and the smallest Androids. At 320 the line wraps to four rows and "closes." runs into the hair, so this is a collision, not only a broken rule.
Change in `src/components/Hero.astro`: `@media (max-width: 359px) { .line { font-size: 24px; } }` (Host's 24px floor holds). I measured it live: three rows at y 50, 76 and 102, bottom 132. Then move `.photo` down 12px at that width so the last descender clears the top of the hair by at least 16px. Add 320 to the three-row test and to the DESIGN.md phone role line list (360, 375, 390, 402, 412 become 320, 360, 375, 390, 402, 412).

**Item 3, builder-written labels (CMO's call; design comment).** The labels are fine as a system: sentence case, short, Geist Mono for metadata. One consistency fix: the case sheet counter reads "1 / 3" while the filter reads "2 of 3 cases". Use "1 of 3" in both.

**Item 6, three CV links on /for/example-company/ (CMO's call; design comment).** Cut to two. The dock's Menu already holds Download CV (PDF), so a third in-body link adds repetition without adding a way in. Keep the one nearest the hero and the one in the closing block.

Items 1 and 2 have no design stake beyond the facts rules; the CMO rules on them.

## Keep

- The desktop cover composition at 1440x900: line and CTA top left, portrait centred, cover lines in column 10, name across the foot, availability bottom-aligned to the "Walid" baseline (`docs/evidence/round-3/capture/home-1440.jpg`).
- The slab as real glass over real content, the thin lit rim and the inner rim at 7px, and its hover lift. The idea is right; only the rendering quality needs work.
- The scroll hand-off: the name sliding up through the slab and the slab springing into the dock (`hero/chromium-2-slide.png`, `chromium-3-docked.png`).
- Reduced motion as a complete version: everything present at first paint, the slab at rest, the dock appearing on scroll (my `rm-150ms.png`, `rm-scrolled.png`).
- The `prefers-contrast: more` slab removal with the full name showing (only the dock and strip behaviour need fixing).
- The ⌘K menu's blur over the portrait: the best use of glass on the site.
- The phone stack order: role, line, portrait, name, CTA, then availability and two-column cover lines on screen two.
- Footnote markers in champagne and the closing footnote list: the "every number footnoted" idea is carried through.
- The /contact brief preview and the "Aim to reply by" date block.
