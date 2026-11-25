# v3 dark portfolio: summary

Branch `redesign/v3-dark`. Not pushed, not merged, not live. Preview only.

## Preview

https://portfolio-kp3i7gtj0-musa-c771.vercel.app (round 5; the round 4 preview was portfolio-68qs8xcwz-musa-c771.vercel.app)

It is behind Vercel Authentication (it returns a 302 to the Vercel login). Open it while logged in to the `musa-c771` Vercel account, or turn on a shareable link in the dashboard under Project, Settings, Deployment Protection.

## What it is

A dark, single-light rebuild of the portfolio, in Astro 5 with GSAP and Lenis. It has no React and no three.js.

- **The hero ("Cover line"):** the name is set as a masthead next to the graded portrait. A Liquid Glass slab sits across the masthead below the shoulders and bends the letters and the pinstripes through an SVG displacement map, in Chromium and WebKit. Visitors can drag the slab, and it springs back. On scroll it hands off to the dock, a glass bar at the bottom of the screen, and it returns when they scroll back to the top.
- **One warm key light** sits high on the left, and every number is footnoted to `src/data/site.ts` with its scope note.
- **Pages:** home, work index, three case sheets (Evitech, I Heart Uni, The Lil Project), about, contact (the brief form), CV, 404, and `/for/<key>/` company pages (the mechanism is built, but there are no real companies yet).
- **The three signature moments:** the slab bending the masthead, the slab-to-dock hand-off, and the Path key light stepping down the career rungs.

## Studio verdicts (final round, round 4)

| Reviewer | Verdict | Report |
|---|---|---|
| Head of engineering | APPROVED (full section 9 gate run) | `docs/v3/reviews/round-4-hoe.md` |
| Creative director | APPROVED, every line 4 or above (round 3; nothing in its areas changed since) | `docs/v3/reviews/round-3-creative-director.md` |
| Chief marketing officer | APPROVED, every line 4 or above (round 3; nothing in its areas changed since) | `docs/v3/reviews/round-3-cmo.md` |
| Finish (Impeccable) | APPROVED | `docs/v3/reviews/round-4-finish.md` |
| Motion (Impeccable) | APPROVED after re-check | `docs/v3/reviews/round-4-motion.md` |
| Principal | APPROVED, no slop found | `docs/v3/reviews/round-4-principal.md` |

Round 5 (the four round 4 polish items) was re-checked only by the reviewers who raised them: finish APPROVED (item 1), head of engineering NO CHANGE (item 2), motion APPROVED (item 4, including the WebKit landing fix). Record: `docs/v3/reviews/round-5-polish.md`.

## Gates (measured at round 4; round 5 re-ran the rows it touches)

| Gate | Target | Measured |
|---|---|---|
| Build, types | 0 errors | Build OK; `astro check` 0 errors, 0 warnings (round 5 again) |
| Unit tests | pass | 99 of 99 (round 5 again) |
| Playwright, 4 projects | 0 failures | Round 4: 938 passed, 0 failed, 110 skipped (project-scoped). Round 5, the 8 affected specs (work, pages, layout, hero-states, home, bend, moments, glass): 455 passed, 0 failed, 109 skipped |
| Lighthouse mobile, median of 5 | Perf ≥ 90, A11y 100, BP ≥ 96, SEO 100 | 100, 100, 100, 100; LCP 1503 ms; CLS 0 |
| Lighthouse desktop, median of 5 | Perf ≥ 95, rest same | 100 across the board; LCP 363 ms |
| INP, 4x CPU | ≤ 200 ms | 80 ms worst |
| Frames | ≥ 95% under 16.7 ms, no task over 50 ms | 100% of 602 within 12.5 ms (120 Hz); 0 long tasks |
| JS before load | ≤ 150 KB gzipped | 8.0 KB |
| Glass | ≤ 4 visible blurred surfaces, fallbacks | 2 at most; solid fallbacks ship |
| Accessibility | axe 0, keyboard, reduced motion, no-JS | axe 0 (Playwright); no-JS content complete on all pages |
| Hygiene | no console errors, em dashes, phone or address | 0 |
| Facts | every figure traced with scope | `facts.mjs` PASS (round 5 again) |

## Screenshots

Desktop (1440) and phone (375, 390) captures of every page are in `docs/evidence/round-6/capture/` (`home`, `about`, `contact`, `cv`, `work`, `work_evitech`, `work_i-heart-uni`, `work_the-lil-project`, `missing-page`).

The signature moments as frame strips:
- Slab bend and hand-off: `docs/evidence/round-6/hero/` (rest, slide, docked, back, dragged, in Chromium and WebKit) and `docs/evidence/round-6/motion/sheet-*-scroll.png`, `sheet-*-drag.png`.
- Path key light: `docs/evidence/round-6/motion/sheet-*-pathlight*.png`.
- On the iPhone Simulator: `docs/evidence/round-5/ios/`, and round 5's `docs/evidence/polish-r5/ios/`.
- Round 5: the slab hand-off filmed in motion on WebKit and the drag release spring (`docs/evidence/polish-r5/motion/`, `motion-fix/`), the separated work figures and the phone slab crops (`docs/evidence/polish-r5/crops/`).

## Direction

The direction chosen is **C, Cover line**. The two alternatives:
- **A, Cover:** a scroll-scrubbed pane over a cut-out portrait. Rejected because it misread the name and depended on a cut-out.
- **B, Stage:** a split hero. Rejected because it used glass as a container for nav links.

Screenshots: `docs/evidence/round-6/directions/direction-{a,b,c}-1440.jpg`. The working prototypes are in `prototypes/v3-hero/`, and the reasoning is in `docs/v3/reviews/phase2-directions.md`.

## Skills

**Used:**
- Impeccable: the design contract, the finish and motion reviewers, and the documenter for `DESIGN.md`.
- superpowers: planning, test-driven development for `src/lib`, receiving code review, and verification.
- taste-skill and frontend-design: the direction gate.
- animate, apple-design and emil-design-eng: the springs, the hand-off and the key light.
- deploy-to-vercel: preview only.

The full record is in `docs/v3/LOG.md` (phase 0).

**Out of scope:**
- The parallax-threejs and threejs-* tooling, because the bend is SVG, not three.js. Playwright covers its regressions.
- Installing any new skill, which needs Musa's yes.

## Placeholders and needs

Full list in `ASSETS_NEEDED.md`. The main items:
- **Final CV PDF:** the file in `public/cv/` is a 954-byte placeholder. Drop the real one in under the same name.
- Handwriting scans (name, signature, short notes), event photos, and the turn film.
- Companies and one-line intros for the `/for/<key>/` pages. The current copy is a placeholder.
- Web Analytics enabled in the Vercel dashboard.
- **Facts:** the period and baseline for 28%, 65% and 70%; the currency for $2M+ and $15K to $30K a month.
- **About note:** it ships marked as a draft and needs approval.
- **Production domain.**
- **Phone portrait AVIF:** it is 48 KB against a 40 KB budget. Adding a 1060w width in `src/lib/portrait.ts` brings it to 38.4 KB; it needs a yes.

## Round 4 polish: outcome (round 5)

Details and evidence in `docs/v3/reviews/round-5-polish.md`.

1. **Work page figures: fixed.** "28%" and "65%" now sit apart, with a wider gap and a thin hairline between them, on `/work/` and the Evitech case sheet. The facts, the single footnote (its note covers both) and the "Two results from the same initiative" line are unchanged.
2. **Phone slab over "Musa" and "Walid": checked, no change.** On the iOS Simulator (iPhone 17, iOS gate PASS) and in WebKit at 375 and 390, the bend shifts parts of "u", "s", "W" and "a", but every letter reads as itself, with nothing split, doubled or missing. The head of engineering ruled no change.
3. **Contact page dock on desktop: won't fix.** At rest the dock would cover a form field at every width from 640px up: at 1440x900 it sits on the role textarea's right edge and resize handle (x 558 to 596, y 820 to 872), and the same holds at 1024, 1280, 1366, 1920 and on a 768 tablet. The creative director's round 3 fix 3 ruled exactly that overlap a defect, so the dock still waits for 160px of scroll on `/contact/` at every width. A possible later change: narrow the contact form column on wide screens so it ends before the dock (a layout change that needs a creative director re-check).
4. **Motion evidence: filmed.** The WebKit hand-off is now filmed in motion both ways, and the drag release spring is filmed moving (no overshoot). The film caught a real WebKit defect: landing back at rest, the slab flashed solid black for about 120ms. It is fixed in `hero.ts`, covered by a new test, and re-filmed clean.

Pre-existing note for later (motion reviewer): when the slab lands at rest, the bent copy switches on in one frame, so the glass goes from blurred to crisp at once. A short cross-fade (about 80 to 120ms) would soften it.

## Decisions for Musa

1. Push `redesign/v3-dark` to GitHub?
2. Merge to `main` and go live?

Nothing is pushed or goes live without his yes.
