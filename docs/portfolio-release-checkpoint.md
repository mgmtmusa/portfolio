# Portfolio release checkpoint

_Last updated: phase 1 — baseline_

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
node scripts/qa/snapshot.mjs <url> <outdir>          # 8-viewport screenshots + overflow/name metrics
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

## Next action

Phase 2: add `check` and `test:e2e` scripts, then redesign the homepage and build the case-study routes.
