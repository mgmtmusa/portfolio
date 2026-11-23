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
| `--text-2` | `#A3A19B` (7.3:1) | Secondary text, strip labels, dock labels at rest. |
| `--text-3` | `#827F7A` (4.7:1) | Tertiary, on `--bg` only. |
| `--line` | `rgb(243 238 228 / .08)` | Hairlines. |
| `--accent` | `#D8C69E` (11.2:1) | Champagne: footnote markers and focus rings only; under 1% of any screen. Never a button fill. |
| `--rim-catch` | `rgb(240 226 196)` | Glass rims only, alpha ≤ .80 on the slab, ≤ .35 elsewhere. |
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
| The line | Host Grotesk 480 | 40u / 1.06 / −0.022em, hand-broken |
| Body | Geist 400 | 17 / 1.55 |
| UI | Geist 500 | 14 to 15 |
| Live metadata, markers | Geist Mono 400 / 500 | 11px, +0.08em, sentence case |

Host from 24px up, Geist below. No Instrument Serif, no Fraunces. No functional text under 11px.

### Layout

12 columns, 24px gutters, margins `clamp(20px, 4vw, 58px)`. The hero uses its own unit: `u = min(100vw / 1440, 100svh / 900)`, height `100svh` (min 600px), width `min(100%, 1440u)`.

### Glass (one recipe)

- Clear first: fill `rgb(255 250 240 / .03 → .01)`, blur 8px (dock 16px), `saturate(160%) brightness(1.08)`, a 1px rim lit top left (`rim-catch` at .35 → .10 → .07 → .16), a 1px outer line `rgb(6 5 4 / .6)`.
- The slab (hero): no backdrop blur at rest; `radial-gradient(70% 110% at 10% 0%, rgb(255 226 190 / .10), transparent 58%), linear-gradient(180deg, rgb(255 248 236 / .05), rgb(255 248 236 / .015) 60%)`; `box-shadow: inset 0 1px 0 rgb(255 244 224 / .24), inset 1px 0 0 rgb(255 244 224 / .10), inset 0 -12px 24px rgb(6 5 4 / .26), 0 0 0 1px rgb(6 5 4 / .45)`; rim 1.5px with a top-left catch of .80; an inner rim inset 7px; contact shadow `rgb(6 5 4 / .25)`, offset (10u, 16u), blur 28u. The bend is an inline SVG copy of what lies under the slab (glyphs placed one by one from the page's own layout), sampled inward, band 40 / scale 18 desktop, band 20 / scale 9 phone, never folding (scale < 1.2 × band).
- The dock: blur 16, fill `rgb(26 24 22 / .55)` (up to .62 if a label falls under 4.5:1), labels `#F3F1EC` 500, auto width.
- Budget: at most 4 blurred surfaces visible. Solid `#211F1C` with the same shape and rim under reduced transparency, high contrast, or no `backdrop-filter`.
- Glass sits over real content or the light field, never over flat black; body text never sits on glass.

### Motion

- Entrances: expo-out `cubic-bezier(.16, 1, .3, 1)`. Springs: critically damped (damping 1) for anything that moves to a place; no overshoot without a gesture.
- Signature moments are slow and weighty; everything repeated is instant or near-instant.
- Lenis smooth scroll, off under reduced motion; GSAP ScrollTrigger only where scroll drives a scene; Astro view transitions with the strip, dock and ⌘K persisting.
- Reduced motion is a complete version: everything present at first paint, no slide, no spring, cross-fades of 160ms at most.

### The portrait

Option 1 everywhere: the whole photo graded, the backdrop darkened toward a warm wall through the matte (never cut), an elliptical dissolve to the page, shirt peaking at `#DDD6CA`, black exactly `#121110`. No AI changes, no colour on his face, whole layers move 8px at most, never cropped at the eyes or chin, no glass over his face, hair or glasses, rendered at most 620 CSS px tall. Recipe: `scripts/portrait/README.md`.

### The status strip and the dock

- Strip: 32px (28 on phones), no fill at rest, a scroll-edge mask once scrolled (`linear-gradient(#121110 0, rgb(18 17 16 / .86) 32px, transparent 64px)`), Melbourne time with seconds, `site.availability` verbatim on one line or not at all, `site.replyTime` verbatim; below 1180px the availability slot drops; phones show the clock only. Padding aligned with the hero's 58u margin.
- Dock: one rounded glass object, bottom centre on every screen, never over the masthead at rest. Get in touch is a direct button; Menu (⌘K) opens with Download CV (PDF), LinkedIn and Copy email as its first visible rows. `inert` while hidden.

## Bans (this project)

The human-versus-machine idea, the lens, the robot, "I sell like a human"; kickers and eyebrows above headings; section numbers; same-size icon cards; gradient text; glass as decoration; middle-dot meta strings; arrows appended to buttons; pulsing "available" dots; split-text entrances; scroll-jacking; idle motion; anything lifted from carterogunsola.com or unanim.studio (brief 2.4), including a name bleeding off the edge, a lanyard or strap, gravity or pendulum physics, and 3D tilt.
