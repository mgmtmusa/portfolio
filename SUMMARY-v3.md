# v3 dark portfolio: summary

Branch `redesign/v3-dark`. Not pushed, not merged, not live. Preview only.

## Preview

https://portfolio-68qs8xcwz-musa-c771.vercel.app

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

## Gates (measured at round 4)

| Gate | Target | Measured |
|---|---|---|
| Build, types | 0 errors | Build OK; `astro check` 0 errors, 0 warnings |
| Unit tests | pass | 99 of 99 |
| Playwright, 4 projects | 0 failures | 938 passed, 0 failed, 110 skipped (project-scoped) |
| Lighthouse mobile, median of 5 | Perf ≥ 90, A11y 100, BP ≥ 96, SEO 100 | 100, 100, 100, 100; LCP 1503 ms; CLS 0 |
| Lighthouse desktop, median of 5 | Perf ≥ 95, rest same | 100 across the board; LCP 363 ms |
| INP, 4x CPU | ≤ 200 ms | 80 ms worst |
| Frames | ≥ 95% under 16.7 ms, no task over 50 ms | 100% of 602 within 12.5 ms (120 Hz); 0 long tasks |
| JS before load | ≤ 150 KB gzipped | 8.0 KB |
| Glass | ≤ 4 visible blurred surfaces, fallbacks | 2 at most; solid fallbacks ship |
| Accessibility | axe 0, keyboard, reduced motion, no-JS | axe 0 (Playwright); no-JS content complete on all pages |
| Hygiene | no console errors, em dashes, phone or address | 0 |
| Facts | every figure traced with scope | `facts.mjs` PASS |

## Screenshots

Desktop (1440) and phone (375, 390) captures of every page are in `docs/evidence/round-6/capture/` (`home`, `about`, `contact`, `cv`, `work`, `work_evitech`, `work_i-heart-uni`, `work_the-lil-project`, `missing-page`).

The signature moments as frame strips:
- Slab bend and hand-off: `docs/evidence/round-6/hero/` (rest, slide, docked, back, dragged, in Chromium and WebKit) and `docs/evidence/round-6/motion/sheet-*-scroll.png`, `sheet-*-drag.png`.
- Path key light: `docs/evidence/round-6/motion/sheet-*-pathlight*.png`.
- On the iPhone Simulator: `docs/evidence/round-5/ios/`.

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

## Open, non-blocking polish (from round 4)

1. The work page sets "28%" and "65%" side by side at display size, so they read as one run with a single marker. A visible gap or a marker on each would fix it.
2. On phones the slab clips letterforms of "Musa" and "Walid". This is the intended bend, but it is worth a look on a real device.
3. `/contact/` shows no navigation at rest on desktop, because the dock waits for 160px of scroll at every width. Limiting that rule to phones would restore it.
4. The motion evidence has not filmed the WebKit hand-off in motion (only the settled states), and has not shown the drag release spring moving.

## Decisions for Musa

1. Push `redesign/v3-dark` to GitHub?
2. Merge to `main` and go live?

Nothing is pushed or goes live without his yes.
