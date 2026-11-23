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
