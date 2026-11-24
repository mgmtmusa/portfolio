# Agent brief (v3 dark portfolio)

Read this INSTEAD of the long docs. Sources if you must dig: `docs/MASTER-PROMPT-v3.md` (brief), `docs/plans/v3.md` (plan; its amendments table overrides task text), `DESIGN.md` (contract), `docs/v3/story.md` (copy). Stack: Astro 5, TypeScript strict, GSAP + ScrollTrigger, Lenis, Vitest, Playwright + axe. Branch `redesign/v3-dark`. No React, no three.js.

## 1. File map

- `src/pages/` : routes: `index`, `about`, `contact`, `cv`, `404`, `work/`, `for/`, `llms.txt.ts`, `sitemap.xml.ts`
- `src/components/` : Astro components (Hero, Dock, StatusStrip, CommandMenu, Footnote, Ledger, WorkIndex, CaseSheet, CaseChart, CaseFigure, CaseTeasers, BriefForm, Approach, Notes, Path, NextStep, ForCases)
- `src/layouts/Base.astro` : shell, persistent chrome, view-transition lifecycle
- `src/lib/` : pure, unit-tested logic (bend-field, hero-math, reply-by, brief, filters, command, work, meta, analytics, portrait)
- `src/scripts/` : client modules (motion, hero, bend, chrome, footnotes, brief, work)
- `src/data/site.ts` : single source of every fact; also `for.ts`, `notes.ts`
- `src/styles/` : `tokens.css`, `glass.css`, `global.css`
- `tests/unit/` : Vitest, one file per `src/lib` module
- `tests/e2e/` : Playwright specs (bend, contact, glass, hero-states, home, hygiene, layout, meta, moments, pages, work) plus `helpers.ts`
- `scripts/qa/` : `facts.mjs`, `capture.mjs`, `hero-states.mjs`, `ios.mjs`, `perf.mjs`, `lighthouse.mjs`
- `docs/v3/` : `LOG.md` (evidence log), `story.md`, `reviews/` (checkpoint and review notes), `research/` (gitignored)
- `docs/evidence/` : captures, traces and reports, one folder per round (`round-1`, `round-2`, `rc-final`, ...)
- `.impeccable/surfaces/src-pages-index-astro.md` : home page six-block contract

## 2. Test commands

- Types: `npx astro check` (must be 0 errors)
- Unit: `npm run test:unit` (Vitest, plus reply-by under `TZ=America/Los_Angeles`)
- Facts gate: `node scripts/qa/facts.mjs [--dir dist]` (needs a built `dist/`; coordinator builds; exit 1 on failure)
- E2E: `BASE_URL=http://127.0.0.1:<port> npx playwright test <spec> --project=chromium --project=mobile-safari`. Projects: `chromium`, `webkit`, `mobile-chrome` (Pixel 7), `mobile-safari` (iPhone 14)
- Capture: `node scripts/qa/capture.mjs <baseUrl> <outdir> [full]` (every page, four viewports, overflow report)
- Hero states: `node scripts/qa/hero-states.mjs <base> <outdir>`
- iOS Simulator: `node scripts/qa/ios.mjs <port> <outdir>` (loads `http://127.0.0.1:<port>/`)
- Perf: `node scripts/qa/perf.mjs <baseUrl> <outdir>` (INP at 4x CPU, frames, bend build time)
- Lighthouse: `node scripts/qa/lighthouse.mjs <url> <outRoot> [runs=5] [mobile|desktop]` (fresh timestamped folder, local `astro preview` only)

## 3. Helper rules

- Edit only files on your ownership list. Anything else, report it instead.
- Use your own dev port from your brief: `npx astro dev --port <port> --host 127.0.0.1`.
- No `npm run build` and no git. The coordinator builds and commits.
- While building, run only the specs you touch, on the two projects above. The full four-project matrix runs only at review gates.
- iOS Simulator: IPv4 `127.0.0.1` only (never `localhost`), driven through `scripts/qa/ios.mjs`.
- Pure logic goes through test-driven development in `src/lib` with a Vitest file.
- Report back in under 150 words: what changed, files touched, test results, open issues.

## 4. Content rules

- No em dashes anywhere (copy, titles, meta, JSON-LD, alt, comments shipped to HTML). A test enforces it.
- Facts come only from `src/data/site.ts`. Never invent, round up or reformat a figure (write `18`, never `13.2K`). Scope notes travel with their number (for example `80%` pipeline growth carries scope "Company pipeline"; `2.6×` carries "Company revenue"; `768` carries "Organisation total"). Organisation outcomes are never presented as personal.
- Scoped figures carry `data-fact="<figure>"` on the figure or footnote markup, with the scope or note inside that element. The facts gate checks this.
- No number more than twice in visible text on one page.
- Use `site.availability`, `site.workRights`, `site.replyTime.text` and `site.cv` verbatim.
- No phone number, no street address. Email and LinkedIn come from `site`.
- Voice: plain, confident, specific numbers, short sentences. Australian English. First person in page copy, third person in meta and JSON-LD. Match `approach[0]` in `site.ts`. Curly apostrophe (’) as in `site.ts`.
- Home H1 is `site.line`: "I carried a sales target first, so I judge marketing by what closes."
- No placeholders shipped unlabelled, no lorem ipsum, no fake testimonials, logos or quotes. Alt text describes, it does not sell. Link text says where it goes.
- Never deploy with `--prod`, `--temporary` or `promote`. Never push, force-push or merge to `main`. Previews only, by the coordinator (`npx vercel@66.6.0 deploy -y`).

## 5. Banned words and patterns

- Words (brief section 5): "Passionate", "leverage", "unlock", "elevate", "seamless", "synergy", "results-driven", "cutting-edge", "world-class", "journey", "drive", "empower", "innovative", "data-driven", "strategic", "impact" as a verb, "Hi, I'm".
- Retired idea: "I sell like a human" (and "I measure like a machine"), the Seam, the lens, the robot, "machine mode". Code says "bend", never "lens".
- Patterns: "not X, but Y" contrasts, automatic lists of three, one-line closers, rhetorical questions, exclamation marks, em dashes.
- Design bans (DESIGN.md): kickers and eyebrows above headings; section numbers; same-size icon cards; gradient text; glass as decoration; middle-dot meta strings; arrows appended to buttons; pulsing "available" dots; split-text entrances; scroll-jacking; idle motion; text or controls on the slab; grain over the portrait or type; cut-out portraits; anything from carterogunsola.com or unanim.studio (name bleeding off the edge, lanyard or strap, gravity or pendulum physics, 3D tilt); purple, blue or neon; Instrument Serif and Fraunces.

## 6. Design tokens (DESIGN.md)

Concept: one warm key light high on the left; every number footnoted; direction C "Cover line". Dark, never blue-black.

- Colour: `--bg #121110`, `--raised #1A1816`, `--glass-solid #211F1C` (fallback), `--text #F3F1EC`, `--ink-mast #E7E2D7` (masthead), `--text-2 #A3A19B`, `--text-3 #827F7A` (on `--bg` only), `--line rgb(243 238 228 / .08)`, `--accent #D8C69E` (footnote markers and focus rings only, under 1% of a screen, never a button fill), `--rim-catch rgb(240 226 196)` (glass rims; .80 max on slab at rest, .95 hover, .35 elsewhere), `--shadow-ink rgb(6 5 4)` (never pure black), `--key rgb(255 212 166)` (light pools).
- No decorative gradients; only the glass recipe and the light field.
- Type: Host Grotesk (variable, 24px and up): masthead 540, `clamp(76px, 14.8vw, 232px)` / .84 / -0.045em; display figures 500, `clamp(96px, 11vw, 168px)`; H2 520, `clamp(44px, 6vw, 80px)` balanced; the line 480. Geist 400/500 below 24px: body 17 / 1.55, labels 13 / 18, UI 14 to 15. Geist Mono 400/500 for metadata and markers, 11px, +0.08em. No functional text under 11px.
- Layout: 12 columns, 24px gutters. Hero unit `u = min(100vw / 1440, 100svh / 900, 1px)`. One shared `--edge` (strip, hero, sections, footer). Status strip 32px (28 phone). Dock bottom centre, never over the masthead at rest.
- Glass: one recipe. Clear fill, blur 8px (dock 16px, fill `rgb(26 24 22 / .55 to .62)`), `saturate(160%) brightness(1.08)`, 1px lit top-left rim, 1px outer line `rgb(6 5 4 / .6)`. At most 4 visible blurred surfaces. Solid `#211F1C` fallback under reduced transparency, `prefers-contrast: more` and no `backdrop-filter`; the slab is `display: none` there. Glass sits over content or light, never flat black; body text never on glass.
- Motion: entrances expo-out `cubic-bezier(.16, 1, .3, 1)`; critically damped springs, no overshoot without a gesture; repeated things are instant. Lenis off under reduced motion. Reduced motion is a complete version (everything at first paint, cross-fades 160ms max). Portrait and masthead paint at first paint, never hidden (LCP).
- Portrait: graded whole photo, never cropped at eyes or chin, no AI changes, at most 620 CSS px tall; via `astro:assets`.

## 7. Gates (brief section 9)

- Build and types: `npm run build` and `npx astro check`, 0 errors.
- Playwright: 0 failures on all four projects; every new interaction tested.
- Lighthouse mobile (local preview, median of 5): Performance >= 90, Accessibility 100, Best Practices >= 96, SEO 100. Desktop: Performance >= 95, rest same. LCP < 1.8s, CLS < 0.02.
- INP <= 200ms worst interaction at 4x CPU. Frames: >= 95% under 16.7ms, no task over 50ms.
- JavaScript before `load` <= 150 KB gzipped.
- Glass: <= 4 visible `backdrop-filter` elements, solid fallbacks work.
- Accessibility: axe 0 violations, full keyboard path, visible focus, complete reduced motion, no-JS shows all content.
- Hygiene: no console errors (except the known local analytics 404); no em dashes, phone numbers or addresses.
- Facts: every figure traces to `site.ts` with its scope note (`facts.mjs`).
- Taste: creative director and CMO score every line 4 or above; the principal finds no slop.

## 8. Hand-back (brief section 10)

The coordinator writes `SUMMARY-v3.md` and the message: preview link (never production), desktop and phone screenshots of every page and the three signature moments, final verdicts and measured gate table, chosen direction plus two alternatives, skills used, placeholders and needs (`ASSETS_NEEDED.md`: final CV PDF, handwriting scans, event photos, turn film, `/for` companies, Web Analytics), and two decisions for Musa: push `redesign/v3-dark`? merge to `main` and go live? Nothing is pushed or live without his yes. Helpers never write this; they report to the coordinator.
