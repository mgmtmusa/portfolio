# Portfolio release checkpoint

_Last updated: phase 7 — APPROVED. Release candidate f2add8b (app code); handoff commit is the branch head (docs only on top)._

## Where things are

- **Production branch:** `main` (Vercel auto-deploys `main` to https://portfolio-omega-gold-33.vercel.app)
- **Feature branch:** `redesign/case-studies` (Vercel builds a preview for every push)
- **Latest commit:** see `git log -1` on the feature branch
- **Stack:** Astro 5.18 static output, plain CSS, one small client script. npm + `package-lock.json`. Node 26 locally. No CI configured in the repo; Vercel Git integration is the only pipeline.

## Commands

```bash
npm ci                      # reproducible install
npm run build               # static build to dist/
npm run preview             # serve dist/ on :4321
npm run check               # astro check (types)          [added in phase 2]
npm run test:e2e            # Playwright suite against the production build [added in phase 2]
node scripts/qa/capture.mjs <url> <outdir> [full]   # all pages × 8 viewports + overflow/name metrics
node scripts/qa/engines.mjs <url> <outdir>          # hero in Chromium, WebKit, iPhone portrait/landscape
node scripts/qa/interactions.mjs <url> <outdir>     # hover, keyboard focus, reduced motion
npm run og                                          # regenerate public/og.png
node scripts/qa/lighthouse.mjs <url> <outdir> 3 mobile   # median of 3 Lighthouse runs
```

## Baseline (production, commit 7d645d4, 22 Nov 2026)

Evidence: `docs/evidence/baseline/`

| Check | Result |
| --- | --- |
| Lighthouse mobile, median of 3 | Perf 100 · A11y 100 · BP 100 · SEO 100 · LCP 1,233 ms · CLS 0 · TBT 0 ms |
| Transfer | JS 48.0 KB · fonts 31.7 KB · images 0 · total 89.8 KB |
| Horizontal overflow | none at 320–1920 |
| Console / network errors | none |

Initial observations verified:

1. **Hero name reaches the right edge — confirmed.** Name right edge is 2–4 px from the viewport edge at 320–1440 and overflows at 1920 (1925 px > 1920 px, clipped).
2. **Counters expose intermediate numbers — confirmed.** Mid-animation accessibility snapshot reads "20% Lower cost per acquisition", "$1M+ B2B contracts…", "543 Children…".
3. **Work deserves deeper views — confirmed.** Evitech, I Heart Uni and The Lil Project each have enough verified detail in the master résumé for a case study; the site only has one-line rows.

Other baseline problems:
- The hero card stack is decorative (`aria-hidden`), not clickable, and overlaps the name.
- The same metrics repeat across the impact grid, timeline, experience rows and card faces.
- No case-study routes, no 404 page, no canonical URL, no social image, no structured data.
- Frontend Design skill audit: all-caps mono eyebrows over every heading, single red word accents in headlines, middle-dot meta strings, arrows appended to links, scroll fade-ups everywhere.

## Claim review (source: Musa_Abdullah_Walid_Master_Resume.pdf supplied in thread)

| Claim on live site | Status | Action |
| --- | --- | --- |
| "A promotion every year" | Résumé says "a promotion roughly every twelve months" | Qualify to "roughly every twelve months" |
| 28% lower CPA, 65% more qualified leads | Stated as Musa's result of restructuring paid media | Keep, attributed to that work |
| 80% pipeline growth QoQ | Résumé lists it alongside reporting work, not as sole cause | Present as context ("pipeline grew…"), not a personal result |
| 2.6× revenue in under three years | Company-level outcome | Label as Evitech company growth or drop from personal metrics |
| $2M+ B2B contracts | "personally closed contract value to date" | Keep |
| 768 children reached | The Lil Project's organisational outcome | Attribute to the organisation |
| 13.2K audience from 400 | "Built a national student community…" | Keep |
| 35 team coached, 23 recruited | Résumé: recruited 23, coached a team that grew to 35 | Keep wording precise |
| Role titles & dates | Match résumé | Keep |
| BCom Marketing & Accounting, UniMelb, 2025 | Matches | Keep |
| "Full Australian working rights" | Matches résumé | Keep, low prominence |
| Debate entries | Match (represented Bangladesh; not "champion") | Keep |

## Design decisions (phase 1)

- Follow the brief's pinned direction (cream + ink, selective red and green, condensed display, layered cards) and drop the generated-page tells listed above.
- Signature interaction: the hero card hand becomes three real links to case studies.
- Case studies as static Astro routes at `/work/<slug>/` (simplest deep-linkable, shareable, back-button-safe option).

## Phase 2–3: redesign (commits b9f8a99, ca4a5f0 + working tree)

Design plan (Frontend Design skill, revised against the brief):
- Palette: paper #ede8de, ink #171512, stone #5e584f, signal red #bd2617 (sparingly), court green #124734, card cream #d8cfbd.
- Type: Archivo variable only. Condensed 850 uppercase for the name and section headlines; sentence case everywhere else. No mono labels, no single-word headline accents, no middle-dot strings, no appended arrows.
- One bold element: the hero hand of three case-study cards (real links). Everything else quiet and editorial.
- Motion tokens: 160 ms feedback, 300 ms secondary, 700 ms hero deal-in. One orchestrated load moment; the career staircase rises once on view. No count-ups, no section fade-ups. GSAP removed.
- Content: metrics live where they were earned (case results; career rungs). The impact grid is gone. Company/organisation outcomes are labelled.

Routes: `/`, `/work/evitech/`, `/work/i-heart-uni/`, `/work/the-lil-project/`, `/404`, `/sitemap.xml`.

## Test results so far

| Check | Result | Evidence |
| --- | --- | --- |
| `npx astro check` | 0 errors | — |
| Playwright, local build (chromium, webkit, Pixel 7 emu, iPhone 14 emu) | 84 passed, 32 intentional skips | `npx playwright test` |
| Playwright vs protected Vercel preview (OIDC header) | 83 passed, 1 failed (iPhone anchor load) → fixed in ca4a5f0, 12/12 on repeat | — |
| Width sweep 320–1920 + 1366×700 + 844×390 | no overflow; name ≥ 12 px from the right edge | `docs/evidence/pass2/` |
| axe WCAG 2.2 AA (home, 3 cases, 404) | 0 violations after label-in-name and stacking fixes | test suite |
| Lighthouse mobile, local build, median of 3 | Perf 100 · LCP 1,053 ms · CLS 0 · TBT 13 ms · 41.8 KB total (was 89.8 KB) | `docs/evidence/pass1/lh-mobile-summary.json` |
| Preview smoke (vercel curl) | all routes 200, 404 page 404, assets 200; HTML identical to local build except Vercel Live script | — |

Blocked / limited:
- **Firefox:** Playwright's Firefox build exits with "Could not find profile folder" on this macOS release (also outside the tool sandbox and after a forced reinstall). Project gated behind `PW_FIREFOX=1`.
- **Real iPhone:** not available; WebKit + iPhone 14 emulation only.
- **Field data (INP):** no real-user data available for this site.
- **Preview access:** Vercel Deployment Protection kept on. Preview checked with `vercel curl` and Playwright using the local OIDC header.

## New-copy claim review (source: master résumé PDF)

| Copy | Résumé source | Status |
| --- | --- | --- |
| "door to door" (hero, approach, career rung 1) | "I came up through sales, from door-to-door to leading a team" | Supported |
| "flew to Sydney weekly … negotiated its warehouse lease" | "Flew to Sydney weekly and negotiated the warehouse lease" | Supported |
| Claude, Zapier, GoHighLevel for "lead scoring" | "AI and workflow automation with Claude, Zapier and GoHighLevel for reporting, lead scoring and production" | Supported |
| "Most of the growth came from organic content" | "mostly through organic content and a community-first approach" | Supported; "rather than paid reach" removed |
| "One calendar for five cities" | "Set brand positioning, content direction and the event marketing calendar" | Reworded to the résumé's own claim |
| "I led event production and marketing" (The Lil Project, Event Coordinator) | "Led event production and marketing strategy for a social impact music organisation" | Supported by résumé wording; owner to confirm title vs scope |
| "Meta Business Suite" | Résumé tools: "Meta Business Suite · Meta Pixel" | Supported |
| "Three promotions in under two years" | Dates: Apr 2021 → Jul 2021 → Jan 2022 → Jan 2023 | Supported by dates (replaces "roughly every twelve months", which contradicted them) |

## Review cycle 1 — Head of Engineering verdict: BLOCK (on ca4a5f0)

| # | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| 1 | Critical | Hero cards blank in WebKit (3D `::after` edge painted over faces) | Edge layer removed; thickness is a flat offset edge on the face. Verified in WebKit desktop, iPhone 14 portrait and landscape. Visual baselines per engine added (`tests/e2e/hero.spec.ts`). |
| 2 | Major | Hover jitter at card edge | The face lifts; the link's hit area stays still. Hover-stability test added. |
| 3 | Major | 844×390: CTA cut off, red card clipped | Landscape sizing by height, smaller hand with specific selectors. Geometry test (CTA fully visible, cards inside frame, no text under cards) at 8 sizes. |
| 4 | Major (process) | Evidence not tied to one SHA | Release candidate frozen and re-verified on a single commit (see below). |
| 5 | Minor | Focus ring detached from lifted card | Ring moved to the card face. Test added. |
| 6 | Minor | Reduced motion still moved cards | No movement; outline + underline cue. Test added. |
| 7 | Minor | New copy claims unreviewed | Table above. |
| 8 | Minor | 768 unlabelled on hero card and OG | "(organisation total)" on card and OG image. |
| 9 | Minor | Duplicated claims | Feature card removed from Selected work; decorative card removed from case pages; Evitech experience rows merged into one; I Heart Uni attendance shown once (chart). |
| 10 | Minor | "Read the The Lil Project" | Tile links read "Read the case study" with the org name for screen readers. |
| 11 | Minor | Redundant tab stops | Tile and feature headings are no longer links. |
| 12 | Minor | "Roughly every twelve months" contradicted the dates | "Three promotions in under two years". |
| 13 | Minor | Test gaps | Geometry, visual, hover, focus and reduced-motion tests added. |
| 14 | Nit | Canonical on 404 | Canonical omitted when `noindex`. |
| 15 | Nit | Stale `snapshot.mjs`, stale doc | Script removed; doc updated. |
| 16 | Nit | Skill committed | Kept on purpose: the brief asked for the skill at project scope. |
| 17 | Nit | Hero choreography ~1,000 ms | 560 ms with 70 ms stagger, finishes ≈ 760 ms. |
| 18 | Nit | OG image unfinished | Re-laid out; all three cards readable. |
| 19 | Nit | Staircase competes with the hand | Staircase made smaller and monochrome (ink, stone, one light-red top); the hand keeps the colour. Eyebrow above case H1 removed. |

## Review cycle 2 — Head of Engineering verdict: BLOCK (on 14fc013)

All 19 cycle-1 findings confirmed fixed. New findings:

| # | Severity | Finding | Resolution (f2add8b) |
| --- | --- | --- | --- |
| 1 | Major | The Lil Project hero card couldn't be clicked, tapped or hovered (it sat behind the hand's full-size 3D plane, which won hit-testing). Also present in ca4a5f0. | `.hand-in` passes pointer events through; every card sits in front of the plane. New test clicks/taps each card at an exposed point in all four engines. |
| 2 | Minor | Case facts touched the results rule (padding lost with the removed wrapper) | `.case-head` padding restored |
| 3 | Nit | Card text 6–8 px on phones | Floors of 9.5–10 px on small card text |
| 4 | Nit | Selected work is text-only at desktop | Kept on purpose: the cards live in the hero; Selected work is the typographic reading layer |

## Release candidate f2add8b — verification

Preview of exactly this SHA: https://portfolio-1921l3we7-musa-c771.vercel.app (Vercel API `gitSource.sha` f2add8b9885f…; protected, `x-robots-tag: noindex`).

| Check | Result |
| --- | --- |
| `npx astro check` | 0 errors |
| Playwright, local build | 113 passed |
| Playwright, preview (OIDC header) | 113 passed |
| Lighthouse mobile home, 5 runs | 100 ×5 · LCP 1,053 ms · TBT 0–55 ms (median 37) · CLS 0 |
| Lighthouse mobile /work/evitech/, 3 runs | 100 ×3 · LCP 1,053 ms · TBT 0–75 ms |
| Preview smoke (`vercel curl`) | 5 routes 200, 404 → 404, og/sitemap/robots 200 |
| Evidence | `docs/evidence/rc-final/` regenerated from f2add8b |

## Release candidate 14fc013 — verification

App code frozen at **14fc013** (later commits on the branch touch only `docs/`).
Preview of exactly this SHA (Vercel API `gitSource.sha` = 14fc013b61bc…): https://portfolio-q8mresl69-musa-c771.vercel.app — protected by Vercel Authentication, `x-robots-tag: noindex`. Branch alias: https://portfolio-git-redesign-case-studies-musa-c771.vercel.app

| Check | Before (prod 7d645d4) | After (RC 14fc013) | Evidence |
| --- | --- | --- | --- |
| `npm ci && npm run build` | — | clean | — |
| `npx astro check` | — | 0 errors, 0 warnings | — |
| Playwright, local build | — | 101 passed | `npx playwright test` |
| Playwright, RC preview (OIDC header) | — | 101 passed | `BASE_URL=<preview> vercel env run -- npx playwright test` |
| Lighthouse mobile home (5 runs) | 100 · LCP 1,233 · TBT 0 (median of 3) | 100 ×5 · LCP 1,054 · TBT median 27, max 31 | `docs/evidence/rc-final/lh-mobile-summary.json` |
| Lighthouse desktop home | — | 100 · LCP 251 ms | `docs/evidence/rc-2a37962/lh-desktop-summary.json` |
| Case pages, Lighthouse mobile | n/a (no routes) | 100 each, LCP ≈ 1,053 ms | `docs/evidence/pass2/case-*` |
| Transfer, home | 89.8 KB (JS 48 KB, font 31.7 KB) | 41.9 KB (JS inline < 1 KB, font 31.8 KB) | Lighthouse summaries |
| Overflow / clipping, 5 routes × 8 viewports | name clipped at 1920 | none; name ≥ 12 px from edge; cards inside frame | `docs/evidence/rc-final/*.jpg` |
| Engines | — | Chromium, WebKit desktop, iPhone 14 portrait + landscape (emulation) | `docs/evidence/rc-final/*-first-screen.png` |
| axe WCAG 2.2 AA (5 routes) | — | 0 violations | test suite |
| Preview smoke | — | 5 routes 200, 404 → 404, og/sitemap 200 | `vercel curl` |

Lighthouse note: on 2a37962 one of eight runs scored 75 (TBT 1,376 ms, unattributed style/layout tasks) and two showed ~120–155 ms; on 14fc013 five of five runs scored 100.

## Review cycle 3 — Head of Engineering verdict: APPROVE (f2add8b)

- Lil Project card fixed: hittable area in every engine (e.g. 39,552 px² desktop, 14,288 px² iPhone 14 emulation; was 0). Clicks and taps open the right case study.
- Case facts spacing fixed (32–48 px gap). Card text floors applied; nothing clipped at 320/360/390/768/844×390.
- Reviewer's independent runs: Playwright 113 passed on its own build and on the preview; Lighthouse mobile home 5/5 = 100.
- Non-blocking notes: a lifted side card keeps hover while you sweep onto Evitech (it is visually on top); 1–3 corner pixels per engine with unstable hover; ~1 in 200 boundary taps resolve to the overlapping neighbour (normal touch adjustment); Firefox unverified.

## Open items for the owner

- Confirm "I led event production and marketing" for The Lil Project against the Event Coordinator title.
- Check the site once in Firefox (Playwright Firefox can't launch on this Mac).
- Check on a real iPhone (only WebKit/iPhone emulation was available).
- Production publication was not authorised in the thread: merging PR #1 to `main` publishes to the live URL.

## Next action

None pending. To release: review the preview, then merge https://github.com/mgmtmusa/portfolio/pull/1 (Vercel deploys `main` to production), then run `BASE_URL=https://portfolio-omega-gold-33.vercel.app npx playwright test` and `node scripts/qa/lighthouse.mjs https://portfolio-omega-gold-33.vercel.app/ docs/evidence/prod 3 mobile`.

To resume after an interruption: `git switch redesign/case-studies && npm ci && npm run build && npx playwright test`.
