# v3 dark rebuild: running log

Branch `redesign/v3-dark`. Brief: `docs/MASTER-PROMPT-v3.md`. Nothing pushed, nothing deployed to production.

## Phase 0: set up (24 November 2026)

- Branch confirmed: `redesign/v3-dark` (clean except the pre-existing untracked `docs/evidence/prod/case/`, left alone).
- Read: `site.ts`, `SUMMARY-lighter-v2.md`, every test, both QA scripts, the brief.
- **Skills:** every skill named in section 7.1 appears in this session's skill list, including the repo's `threejs-*` and `portfolio:frontend-design`. The five with `disable-model-invocation` (`prototype`, `learn-taste`, `pick-ui-library`, `review-animations`, `ask-emil`) exist in `~/.claude/skills/` and are read and followed directly.
- **Agents:** the four studio agents live in `portfolio/.claude/agents/` and are not registered as agent types in this session (it started at `untitled folder/`). Per section 0 they run as `general-purpose` subagents told to read their definition file first and act exactly as it says, read-only. Impeccable's agents and the parallax-threejs agents are registered.
- **Connectors:** Vercel MCP connected; Canva connected; Higgsfield connected (catalog only); Playwright, Chrome DevTools and three.js DevTools MCPs connected; Spector failed to connect (optional); Figma needs Musa to authorise it, so it isn't used.
- **Tooling:** Node 26.13.1, npm 11.20. Deno not installed (Playwright screenshot tests protect the signature moments instead; listed for the hand-back). Vercel CLI latest is 66.6.0, pinned as `vercel@66.6.0`.
- **Impeccable:** no PRODUCT.md existed. Impeccable's init normally interviews; the brief says never stop to ask Musa, so `PRODUCT.md` was written from the brief and `site.ts` only, labelled as such. The brief pins the world and the first viewport in words, so Impeccable's concept roll is skipped (`seed: none (pinned)`); the three hero directions run inside that pinned world. Build path: code-led (no image-generation tool for comps; the brief limits generated images to abstract textures anyway).

## Phase 1: research

- Live study of both references at 1440×900 and iPhone 14, plus Carter's ⌘K. Screenshots in `docs/v3/research/` (ignored by git and Vercel).
- Synthesis: `docs/v3/research-synthesis.md`.

## Phase 2: direction (in progress)

- **Story:** the CMO set the positioning and story order. Chosen line: "I carried a sales target first, so I judge marketing by what closes." Full document: `docs/v3/story.md`.
- **Portrait:** graded on-device. Apple Vision person segmentation (`scripts/portrait/mask.swift`) gives the matte; `scripts/portrait/grade.swift` erodes the outer 2px, decontaminates edge pixels from the grey backdrop, then applies one whole-image grade (exposure 0.90, mids gamma 1.06, highlight roll-off above 0.62, blacks lifted to 0.032, warmth R×1.05 B×0.90, a luminance-only key falloff from the upper left). Two outputs: `frame` (backdrop kept, graded into a warm dark pool, fading to transparent at the frame) and `cut` (subject only). The portrait never left the machine. At 200%: no grey in the lenses, no fringe on hair, beard or cheek.
- **Display faces** compared at 200px: `docs/v3/research/font-compare.jpg`.
- **Hero pane bend, engine evidence:**
  - CSS `filter: url(#svg-filter)` with `feDisplacementMap` on an HTML copy bends in Chromium, but WebKit ignores the `feImage` map (data URL, same-origin file, blob URL and in-SVG `<image>` reference all failed), so the copy slides out of line.
  - The same filter on **SVG-native content** (an inline SVG with `<text>` and `<image>`, clipped to the pane) bends identically in Chromium and WebKit.
  - Decision: the bend is an inline SVG lens inside the pane, built after load from the measured positions of the real HTML masthead and portrait. No WebGL, no `backdrop-filter`, nothing on the critical path. Without JS the Appendix B CSS pane shows with no bend. three.js is therefore not needed for the pane; the brief's three.js route stays unused unless the principal rejects the bend.
- **Bend tuning:** sampling inward (magnify) folds and smears at strong settings. Switched to outward sampling (the rim gathers what lies just beyond the edge and compresses it) with the filter region grown by 2× the rim on each side; strength must stay under about 1.2× the rim width so the mapping never folds. Chosen: rim 36px, strength 42.
- **⌘K:** the curated pick (cmdk) needs React, which this site doesn't otherwise load, so ⌘K is hand-built on a native `<dialog>` with the same keyboard model.
- **find-skills (phase 0, report only, nothing installed):** `astrolicious/agent-skills@astro` (20.3K installs) could help with Astro view transitions; `affaan-m/ecc@liquid-glass-design` (14.1K) is general Liquid Glass guidance; the Lighthouse skills all have under 600 installs and aren't worth adding. Any install needs Musa's yes.
- **Prototype harness:** `prototypes/v3-hero/` (picker `index.html`, `shared.css`, `shared.js` with `buildLens`, `glass.js`, `bend-svg.html` proof). Serve with the `v3-hero` launch config (port 4411). Directions `a.html`, `b.html`, `c.html` not built yet.
- **Plan drafted:** `docs/plans/v3.md` (hero task defers to `DESIGN.md`). Head-of-engineering review started, then paused when usage ran out; re-run it.

## Paused (usage limit), 24 November ~04:45

Next steps, in order:
1. Collect the creative director's three hero directions (re-run the CD brief if its report is missing), then build `a/b/c.html` behind the picker with the SVG lens, and rename the picker items.
2. Run `taste-skill` and Impeccable critique on all three; hand to the CD; the principal picks.
3. Write the direction contract (surface brief + `DESIGN.md`), CD approves.
4. Re-run the head-of-engineering plan review on `docs/plans/v3.md`, apply findings, then build (phase 4).

## Resumed 24 November 05:21

- The creative director's three hero directions arrived (A Cover, B Stage, C Cover line; display face Host Grotesk 540; dock bottom centre; `--ink-mast #E7E2D7`; CTA filled `#F3F1EC`, not champagne, to keep champagne under 1% on phones). The CD's lean: A if the shoulder matte passes at 200%; C has the strongest screen-recordable moment; B is the safe fallback.
- Portrait grades per direction from the parametrised `grade.swift` (black lands exactly on the page colour; navy pulled 35% toward luminance so the suit reads as ink): A cut-out; B stage (key falls to 0.60 at the lower right); C lit wall (`#2A2520` glow up and left of his head).
- Built all three behind the picker (`prototypes/v3-hero/`, `npm`-free, served on port 4411). Each works at rest and in motion in Chromium and WebKit at 1440×900 and iPhone 14: A scroll-scrubbed (the name slides through the fixed pane for 90px, then the pane morphs into the dock), B spring-to-dock at 64px with 24px hysteresis, C 1:1 drag with rubber-band and projected momentum plus fling-down or scroll to dock. Evidence: `.impeccable/review/directions/` (ignored by git).
- Conflict for the principal: the CMO makes the positioning line the H1; the CD makes the name the H1. The prototypes use the name as the H1.
- Strip: the full `site.availability` plus `site.replyTime` don't fit at 1440 in 11px mono, so the strip drops the "Based in Melbourne." clause (the clock already says Melbourne) and truncates on phones; the full sentence appears verbatim in the page's next step.
- Deno 2.9.8 is now installed and Figma is connected (Starter, View seat). The brief ties the parallax-threejs harness to three.js; no three.js is used, so Playwright screenshot tests protect the signature moments. Figma stays optional and unused to save its read quota.

## Phase 3: plan review, round 0

- **Head of engineering: CHANGES REQUIRED** (23 findings; architecture sound, gaps in measurement, view-transition and lifecycle details). Two live bugs confirmed and fixed: Astro's swap wiped `<html>` classes and `data-motion` after the first navigation (verified in `swap-functions.js`), and the grain was a blended layer over the page. Also fixed: analytics only on Vercel (protects Best Practices headroom), `three` removed, `.vercelignore` widened, near-opaque footnote notes. Every other finding is written into `docs/plans/v3.md` as an amendment. Build paused until re-approval; plan resubmitted.
- **Plan round 1: APPROVED** by the head of engineering, on two conditions: rewrite the lifecycle paragraph to match the F6 and F16 amendments (done), and send Task 5 back once the direction is picked. Round-1 notes applied: footnote notes use a rim-only class (no hidden blur), only Host Grotesk is preloaded, plus a Roboto fallback for Android (to do with the font fallbacks), a `/for` slash test, and a CMO or principal ruling on whether ⌘K counts as "one action" for LinkedIn.
- **Independent critique** (taste-skill gate + Impeccable rubric): taste gate FAIL on all three (A 46, B 41, C 45 findings, many kit page-structure rules); Impeccable heuristics A 15/28, B 16/28, C 17/28. Ranks C first on audience identification and product clarity. Ten shared defects. Two were factual bugs and are fixed in the prototypes: WebKit ignores `letter-spacing` on SVG `<text>`, so the bent copy drifted (now one x per glyph from the page's own layout), and the hero was sized by width only, so laptops lost the pitch and CTAs below the fold (now `min(100vw/1440, 100svh/900)`). The rest (glass body and edge mapping, strip and dock legibility, `inert`, whole-photo grade, the line as H1, FLIP morphs) go to the creative director and principal.
- **Portrait, option 1 (whole photo):** new `photo` mode in `grade.swift`: the backdrop is darkened toward a warm wall through the matte (never cut), the frame dissolves elliptically (no straight edges), warmth eases off in the highlights so the shirt reads white; 1px matte erosion keeps a photographic hair edge. Master: `src/assets/portrait/musa-portrait-graded.webp`; recipe in `scripts/portrait/README.md`.

## Phase 2 decision: the principal picked C, "Cover line"

- Reasons, rulings, accepted and modified changes, and guardrails G1 to G8: `docs/v3/reviews/phase2-directions.md` (end). Alternatives kept for the hand-back: A "Cover" (most editorial; the name behind his shoulder) and B "Stage" (the glass bar is the navigation), both in `prototypes/v3-hero/`.
- The H1 is the name; the CMO's line keeps its weight by position and size and is read first.
- Usage limit hit around 06:20 while the creative director (contract approval) and the head of engineering (Task 5 approval) were reviewing; both resumed after the 10:20 reset.
