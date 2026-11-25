# DESIGN.md: the v3 direction contract

> Phase 2 contract, written before the build for the creative director's approval (brief section 8). In phase 6 the Impeccable documenter replaces it with the system as shipped. The six-block contract for the home page lives in `.impeccable/surfaces/src-pages-index-astro.md`.

## The idea

**One light, every number footnoted.** A dark, quiet, warm room lit by one soft key light high on the left: the light an MC stands in. It lights the portrait, every glass rim and the field, always from the same side. Musa has no project imagery, so his numbers are the imagery: display type, each with a champagne footnote marker that opens its scope note.

**Direction C, "Cover line"** (picked by the principal). The first viewport is an inverted magazine cover: the cover line and the action in the key light top left, the graded portrait at the centre, the name across the foot, one thick glass slab crossing the name below his shoulders.

## Fixed now

### Colour

| Token | Value | Use |
|---|---|---|
| `--bg` | `#121110` | Page. Red above blue in every neutral; never blue-black. |
| `--raised` | `#1A1816` | Raised panels. |
| `--glass-solid` | `#211F1C` | Glass fallback (reduced transparency, high contrast, no `backdrop-filter`). |
| `--text` | `#F3F1EC` (16.7:1) | Text, the primary CTA fill. |
| `--ink-mast` | `#E7E2D7` (15.2:1) | The masthead and other name settings. |
| `--text-2` | `#A3A19B` (7.3:1) | Secondary text, strip labels, figure labels. |
| `--text-3` | `#827F7A` (4.7:1) | Tertiary, on `--bg` only. |
| `--line` | `rgb(243 238 228 / .08)` | Hairlines. |
| `--accent` | `#D8C69E` (11.2:1) | Champagne: footnote markers and focus rings only; under 1% of any screen. Never a button fill. |
| `--rim-catch` | `rgb(240 226 196)` | Glass rims only: at most .80 on the slab at rest, .95 on hover, at most .35 everywhere else. |
| `--shadow-ink` | `rgb(6 5 4)` | Shadows and outer lines; never pure black. |
| `--key` | `rgb(255 212 166)` | Every light pool. |

No decorative gradients. The glass recipe and the light field are the only gradients. Never purple, blue or neon.

### Type

| Role | Face, weight | Size / line height / tracking |
|---|---|---|
| Masthead | Host Grotesk 540 | 213u (`clamp(76px, 14.8vw, 232px)` off the hero) / .84 / −0.045em; phone 20vw / .84 / −0.04em |
| Section display figures | Host Grotesk 500 | `clamp(96px, 11vw, 168px)` / .86 / −0.045em, lining proportional |
| Hero proof figures | Host Grotesk 500 | 36u desktop, 30px phone / 1 / −0.03em |
| H2 | Host Grotesk 520 | `clamp(44px, 6vw, 80px)` / .98 / −0.03em, `text-wrap: balance` |
| The line | Host Grotesk 480 | 40u / 1.06 / −0.022em, hand-broken; phone 26px / 1.08 / −0.018em |
| Figure labels | Geist 400 | 13 / 18, `--text-2` |
| ⌘K keycap | Geist Mono 500 | 11px |
| Body | Geist 400 | 17 / 1.55 |
| UI | Geist 500 | 14 to 15 |
| Live metadata, markers | Geist Mono 400 / 500 | 11px, +0.08em, sentence case |

Host weights by role, one variable file (axis 480 to 540): 480 the line, 500 figures, 520 H2, 540 the masthead. Host from 24px up, Geist below. No Instrument Serif, no Fraunces. No functional text under 11px.

### Layout

12 columns, 24px gutters. The hero unit is `u = min(100vw / 1440, 100svh / 900, 1px)` (never above 1px, so the 1254px portrait never renders over 620 CSS px); the hero is `100svh` tall (min 600px), `min(100%, 1440u)` wide, centred. One edge for the whole page: `--edge: max(clamp(20px, 4vw, 58px), calc((100vw - 1440 * var(--u)) / 2 + 58 * var(--u)))`, used by the strip, the hero, every section and the footer.

Phone role line: the line ("I carried a sales target / first, so I judge / marketing by what closes.") stays three rows at 360, 375, 390, 402 and 412 (below 360px, e.g. 320, the line is 24px, still three rows, and the portrait moves down 12px) and sits at y 61 to 145 at 390×664 (role label at y 38 to 55 above it). This replaces the earlier 44 to 128; the portrait follows at y 148 to 428.

Text rise: the hero text rise starts at paint (first paint), not after load or fonts.

Below 1440px wide the cover lines start at 88u instead of 128u, and below 1180px the availability block widens to x 996 to 1382u, so the proof column clears the cap line of "Abdullah" by 24u and the availability block clears its baseline by 24u at every width.

### Glass (one recipe)

- Clear first: fill `rgb(255 250 240 / .03 → .01)`, blur 8px (dock 16px; the dock fill is `rgb(26 24 22 / .62)`, the top of the .55 to .62 range, so every dock label clears 4.5:1), `saturate(160%) brightness(1.08)`, a 1px rim lit top left (`rim-catch` at .35 → .10 → .07 → .16), a 1px outer line `rgb(6 5 4 / .6)`.
- The slab (hero): no backdrop blur at rest; `radial-gradient(70% 110% at 10% 0%, rgb(255 226 190 / .10), transparent 58%), linear-gradient(180deg, rgb(255 248 236 / .05), rgb(255 248 236 / .015) 60%)`; `box-shadow: inset 0 1px 0 rgb(255 244 224 / .24), inset 1px 0 0 rgb(255 244 224 / .10), inset 0 -12px 24px rgb(6 5 4 / .26), 0 0 0 1px rgb(6 5 4 / .45)`; rim 1.5px with a top-left catch of .80; an inner rim inset 7px; contact shadow `rgb(6 5 4 / .25)`, offset (10u, 16u), blur 28u, layered below the type (under the masthead, over the portrait), so it never dims a letter. The bend is an inline SVG copy of what lies under the slab (glyphs placed one by one from the page's own layout), sampled inward, band 40 / scale 18 desktop, band 20 / scale 9 phone, never folding (scale < 1.2 × band). The displacement is supersampled in 4 passes, each offset by a rotated-grid sub-pixel step (device px) and averaged, so the bent copy shows no stair-steps; the copy sits in the page under the slab and carries the slab fill itself.
  - Registration: at strength 0 the bent copy matches the page within 1px at 2× in Chromium and WebKit.
  - Knock-out: the originals are cut out under the slab only while its opacity is above 0.
  - Edges: no horizontal slab edge within 24u of the cap line or baseline of any glyph under it; no glyph fragment narrower than 18u at either vertical edge at 640px and up; below 640px the floor is 16 CSS px. The snap always picks the position that maximises the smallest fragment.
  - No text or controls on the slab.
  - In flight (to and from the dock): bend off, `backdrop-filter: blur(4px)`, body gradient and rim kept.
  - Hover: rim .95 and contact shadow (14u, 22u) over 160ms; press: scale .985; cursor `grab` / `grabbing`. Touch: the bend switches off while the slab moves and rises over 200ms (ease-out) once it settles.
  - Under reduced transparency, `prefers-contrast: more` and forced colours: the slab and its shadow are `display: none` and there is no knock-out, so every letter of the name shows.
- The dock: blur 16, fill `rgb(26 24 22 / .55)` (up to .62 if a label falls under 4.5:1), labels `#F3F1EC` 500, content width and centred on every screen; on phones `max-width: calc(100vw - 32px)`, never spanning the column.
- Budget: at most 4 blurred surfaces visible. Solid `#211F1C` with the same shape and rim under reduced transparency, high contrast, or no `backdrop-filter`.
- Glass sits over real content or the light field, never over flat black; body text never sits on glass.

### Motion

- Entrances: expo-out `cubic-bezier(.16, 1, .3, 1)`. Springs: critically damped (damping 1) for anything that moves to a place; no overshoot without a gesture.
- Signature moments are slow and weighty; everything repeated is instant or near-instant.
- Lenis smooth scroll, off under reduced motion; GSAP ScrollTrigger only where scroll drives a scene; Astro view transitions with the strip, dock and ⌘K persisting.
- The third signature moment is the Path key light: one `--key` pool (.07 from 768px, .05 below) that moves rung to rung to the one being read (the rung crossing 35% to 45% down the viewport), translate only, 900ms expo-out, no idle drift. The first placement is instant and lands on the rung being read, so a restored scroll or a view-transition return to mid-Path never sweeps in from the first rung. Phone rungs sit flush to the edge (the light moves vertically only); the staircase indent holds from 640px. With no JS it rests at the first rung's figure; under reduced motion it jumps with no transition.
- Reduced motion is a complete version: everything present at first paint, no slide, no spring, cross-fades of 160ms at most.
- The portrait and the masthead are painted at first paint and never hidden (they are the LCP). Home load order: the masthead and the portrait are simply there; 400 to 1500ms the slab glides in from opacity 0 at −240u; from first paint the top-left block rises 8px (transform only, 500ms, no opacity hold, full loads only); 950 to 1450ms the cover lines, 70ms apart; 1100 to 1500ms the availability block.

### The portrait

Option 1 everywhere: the whole photo graded, the backdrop darkened toward a warm wall through the matte (never cut), an elliptical dissolve to the page, the shirt peaking near `#DEDEDB` with highlights eased to neutral and never above `#E2E2DF`, black exactly `#121110`. Acceptance at 200%: all four edges within 1 level of the page; a ±1-level ordered dither wherever the matte is below .05, with no contours in a ×10 stretch of the master or of the 620w and 1240w derivatives (WebP q ≥ 82, AVIF q ≥ 62); no pixel within 4px of the silhouette brighter than the wall by more than 4 levels (real highlights 6px or more inside the hair excepted); R ≥ G ≥ B in shadows below L 40. No AI changes, no colour on his face, whole layers move 8px at most, never cropped at the eyes or chin, no glass over his face, hair or glasses, rendered at most 620 CSS px tall. The `<img>` is `decoding="sync"` with `loading="eager"` and `fetchpriority="high"`, and `Base.astro` preloads the same srcset and sizes character for character, so WebKit reuses the preload and paints it in the masthead's first frame. Recipe: `scripts/portrait/README.md`.

### The status strip and the dock

- Strip: 32px (28 on phones), no fill at rest, a scroll-edge mask once scrolled (`linear-gradient(#121110 0, rgb(18 17 16 / .86) 32px, transparent 64px)`), Melbourne time with seconds, `site.availability` verbatim on one line or not at all, `site.replyTime` verbatim; below 1180px the availability slot drops; phones show the clock only. `padding-inline: var(--edge)`.
- Every strip label measures at least 4.5:1 against the real pixels behind it. On home the availability slot hides while the hero availability block is at least 50% in view.
- Dock: one rounded glass object, bottom centre on every screen, never over the masthead at rest. Get in touch is a direct button and hides while the hero CTA is at least 50% in view; Menu (⌘K) opens with Download CV (PDF), LinkedIn and Copy email as its first visible rows. `inert` while hidden. On /contact/ the dock is hidden at rest (and out of the tab order), shows past 160px of scroll, and on phones hides again while focus is inside the brief form.

## Bans (this project)

The human-versus-machine idea, the lens, the robot, "I sell like a human"; kickers and eyebrows above headings; section numbers; same-size icon cards; gradient text; glass as decoration; middle-dot meta strings; arrows appended to buttons; pulsing "available" dots; split-text entrances; scroll-jacking; idle motion; anything lifted from carterogunsola.com or unanim.studio (brief 2.4), including a name bleeding off the edge, a lanyard or strap, gravity or pendulum physics, and 3D tilt. Also: text or controls on the slab, grain over the portrait or the type, and cut-out portraits.
