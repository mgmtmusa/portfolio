---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/components/Hero.astro"]
---

# Home (`/`): surface brief

Mode: Experience leading into Persuade (a personal portfolio whose first viewport must also sell). Audience: a CMO or hiring manager with 90 seconds; recruiters on phones. Action: Get in touch, Download CV (PDF), LinkedIn. Proof: only `site.ts` figures, every one footnoted with its scope. Constraints: brief sections 2 to 5, `docs/v3/story.md`, the principal's rulings and guardrails G1 to G8 (`docs/v3/reviews/phase2-directions.md`).

## Direction contract

THESIS: One light, every number footnoted. The first viewport is an inverted magazine cover: his test ("I carried a sales target first, so I judge marketing by what closes.") and the action sit top left in the key light, his graded portrait sits at the centre, his name runs across the foot, and one thick glass slab crosses the name below his shoulders, bending the letters and the suit. It refuses the category's centred headline with a stat row and a gradient blob, and it refuses the split hero.

OWN-WORLD: A dark, warm, quiet room, #121110 with red above blue in every neutral, lit by one warm key high on the left that lights the portrait, every glass rim and the field. Host Grotesk 540 masthead in #E7E2D7 at 213u/.84/−0.045em; Host for display figures and the line; Geist for reading; Geist Mono 11px only for live metadata and footnote markers. Champagne #D8C69E only on footnote markers and focus rings, under 1% of any screen. Glass is mostly clear: a lit top-left rim, a faint warm body, bending only at its edges. One white #F3F1EC pill for the primary action. Hairlines at .08. Static grain inside the light field, never over the content.

STORY: Within 5 seconds the visitor reads the role and the line and sees his face and name. Within 30 seconds they read the footnoted proof (28% and 65% on roughly $15K to $30K a month, $2M+ personally closed, 13,200 grown from 400) and the path from door-to-door sales to marketing. Within 90 seconds the Evitech result, 18 sold-out events as lead MC and the sales-to-marketing path have stuck, and Get in touch, Download CV (PDF) or LinkedIn is one action away.

FIRST VIEWPORT: On the 1440 grid with u = min(100vw/1440, 100svh/900, 1px), hero height 100svh (min 600px), width min(100%, 1440u), centred. Role (Geist 14/500, secondary) at 112u; the line (Host 480, 40u/1.06, −0.022em, max 548u, broken "I carried a sales target / first, so I judge / marketing by what closes." at every width, at least 24u clear of the hair) at 136–264u; the CTA row at 296–344u: the white "Get in touch" pill and "Download CV (PDF)". Portrait 620u, the whole photo dissolving elliptically, centred on his face at x 435–1055u, y 3–623u. Proof as cover lines right of his head, x 1069–1382u (column 10), y 128–420u. Masthead in two title-case lines inside the 58u margins: "Musa Abdullah" (cap top 514u) and "Walid" (baseline 847u). The slab: 360×241u at x 612–972u, y 452–693u (its bottom edge on the cap line of "Walid"), radius 52u, over "Abd" and the tie. `site.availability` and `site.replyTime` verbatim at x 1069–1382u, bottom-aligned to the "Walid" baseline (847u). Status strip on top; the dock hidden and inert at rest. The primary action is the "Get in touch" pill, top left. Signature interaction: the slab. It glides in on load (spring response 1.1, damping 1, no overshoot); it drags horizontally 1:1 with the grab offset, rubber-banded past line 1, and its projected landing snaps to a position that leaves every glyph fragment at least 18u wide; on scroll the name slides up through the fixed slab for 90px, then the slab springs into the dock (response .5, damping 1, transform and clip-path only, bend off, 4px blur in flight) and springs back below 60px. Hover lifts the rim to .95 and the contact shadow to (14u, 22u) over 160ms; press scales .985. Load order: the masthead and the portrait are painted at first paint and never animate; slab 400–1500ms, top-left block 800–1300ms, cover lines 950–1450ms (70ms apart), availability 1100–1500ms. Motion grammar: expo-out entrances, critically damped springs, nothing idle, no content or function on hover alone (the slab's hover lift is only an affordance). Under reduced transparency, contrast-more and forced colours the slab and its shadow are not shown and nothing is knocked out.
Phone (390×664 visible): strip clock only (28px); the line 26px/1.08 at y 61–145 with the same breaks (role label above it at y 38–55); portrait 280×280 centred at y 148–428, cropped from at least 1000 source px; masthead three lines at 20vw (78px), −0.04em, cap top to baseline 400–457, 465–522, 530–587; slab 210×130, radius 32, x 100–310, y 428–558, band 20, scale 9; CTA row with "Download CV (PDF)" at y 604–652; screen two opens with the availability block, then the cover lines in two columns; scrollWidth equals innerWidth at 375, 390 and 412.

FORM: Direction C, "Cover line", picked by the principal from three studio directions (A Cover, B Stage, C Cover line). seed: none (pinned) "A dark, quiet, expensive room lit by a single soft source. Huge, confident type. Real glass that bends the light and content behind it. Musa's portrait handled like a magazine cover." and "the hero pane bending the name, then settling into the dock" (docs/MASTER-PROMPT-v3.md, sections 2.1 and 4).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment
The name sliding up through the slab, then the slab settling into the dock.

## Unresolved
Real-device Safari and iOS Simulator captures of the bend (required before Task 5 is accepted).
