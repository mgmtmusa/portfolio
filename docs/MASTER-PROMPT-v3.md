# Master prompt v3: the dark rebuild

**How to use this file**

1. In the Claude desktop app, open a **new Code session** with **`untitled folder`** (the folder that contains `portfolio`) as the working directory.
   - That's where the Impeccable skill and its five agents are installed (`untitled folder/.claude/`), so starting inside `portfolio` would lose them.
   - The repo, and every command, lives in `portfolio/`.
   - Use the same account, so the same skills and plugins load, and pick Opus at high effort.
2. Make sure the session is on the branch `redesign/v3-dark`.
3. Connect what you can before starting (see section 7.3): Figma, Higgsfield, Canva and Vercel.
4. Send this one line:

> Read `docs/MASTER-PROMPT-v3.md` and run it end to end. Don't come back to me until the principal has approved and the gates in section 9 pass, unless you're blocked on something only I can give you.

**This replaces every earlier brief.** `docs/MASTER-PROMPT-the-seam.md`, `docs/CREATIVE-DIRECTION.md`, the robot half of `docs/HIGGSFIELD-PROMPTS.md`, and the hero, lens and "machine theme" notes in `SUMMARY-lighter-v2.md` are superseded. The human-versus-machine idea is gone entirely: no Seam, no lens, no robot, no "machine mode", and not the line "I sell like a human. I measure like a machine."

---

## 0. The mission and the studio

Rebuild Musa Abdullah Walid's portfolio from scratch, as a dark, elegant, tasteful, ultra-premium site. A studio billing $10,000 a month should recognise it as its own standard. Apple's Liquid Glass should feel at home on it.

**The test:** a CMO at a billion-dollar company finishes the visit thinking, *"If he does this for himself, imagine what he'd do for us."* That CMO should be visibly impressed by how much care went into it.

**You (the main session) are the studio lead.** You plan, build and run the loop. You answer to a studio of four, defined in `.claude/agents/`:

| Agent | Owns | Can veto on |
|---|---|---|
| `creative-director` | Art direction, taste, motion, the portrait, glass | Anything that looks generic, off-brief or unrefined |
| `head-of-engineering` | Architecture, plan, performance, accessibility, tests, release | Any failed gate in section 9 |
| `chief-marketing-officer` | Positioning, story, proof, copy, conversion path | Anything a CMO wouldn't believe or remember |
| `principal` | The final call, AI-slop hunting, conflicts between the others | Everything. Nothing reaches Musa without the principal's APPROVED |

None of the four edit code; they review and direct. You build. You may hand build tasks to fresh subagents (`superpowers:subagent-driven-development`), but every round goes back through the studio.

**Subagents can't start other subagents.** So you run the Impeccable reviewers and the three.js reviewers yourself, and hand their output to the studio.

**If the four studio agents don't appear as agent types** (their files live in `portfolio/.claude/agents/`, one folder below the session root): start a `general-purpose` subagent for each one. Tell it to read its definition file first and act exactly as that file says.

---

## 1. Who Musa is: the raw material

**Every fact comes from `src/data/site.ts`.** Read all of it. Never invent a number. Never drop a scope note: "Company pipeline", "Company revenue", "Team outcome", "Organisation total", and the overlap notes in `growthWork`. If a feature needs a fact that isn't there, use a labelled placeholder and add it to `ASSETS_NEEDED.md`.

The shape of the story, as the data tells it:

- **Career** (`career`): door-to-door solar sales (April 2021), where he set the company's highest day-one sales record.
  - Then B2B sales executive and team leader within six months, with more than $2M personally closed to date.
  - Then he helped establish the NSW hub within four months, recruiting 23 sales executives and coaching a team that grew to 35.
  - Marketing and Growth Specialist at Evitech since January 2023.
- **Cases** (`cases`):
  - **Evitech:** 28% lower CPA and 65% more qualified leads, two results from the same initiative, on paid media of roughly $15K to $30K a month. Plus company-level pipeline and revenue figures, each with its scope label.
  - **I Heart Uni:** a social audience grown from 400 to 13,200; 18 sold-out events as lead MC; 70% more revenue per event; five cities.
  - **The Lil Project:** 768 children reached (organisation total).
- **Selected growth work** (`growthWork`): six projects. Present them as growth projects or selected results, never as "experiments" or "tests". Keep each `note` beside its numbers.
- **Recognition** (`recognition`):
  - represented Bangladesh at the Asian Schools Debate Championship (Kuala Lumpur, 2014, 28 nations)
  - one of four national delegates to the UNESCO ASPnet ESD Summit (Okayama, Japan, 2014)
  - SBI-NUJS Parliamentary Debate (Kolkata, 2015)
  - convener of the Rajuk Nationals Debate Championship (60 schools, $30K AUD raised)
- **The stage:** MC for University of Melbourne O-Week cohorts of 1,000 students (already in `experience`).
- **Not yet in `site.ts`:** his languages (native English and Bangla, fluent Hindi) and his presidency of the Multicultural and Multi-Faith Club at Trinity College.
  - Use them only if Musa has added them to `site.ts` before this run.
  - Otherwise leave them out and list them in `ASSETS_NEEDED.md`.
- **Wording rules:**
  - Say "helped establish" the NSW hub everywhere. `career` says "Opened", but Musa's own description says "helped establish".
  - Keep "Schools" and the year in every debating credit.
- **Tools** (`tools`, `capabilities`): GA4, Tag Manager, Looker Studio, HubSpot, GoHighLevel, Salesforce, Zapier, Claude and more.

**Settled decisions. Use these exactly:**

- **Availability:** `site.availability`, "Based in Melbourne. Open to conversations about marketing, growth and business development opportunities." It promises no start date.
- **Work rights:** `site.workRights`, "Full work rights until January 2028 (subclass 485 visa), open to employer sponsorship." Use that exact sentence wherever work rights appear.
- **CV:**
  - `site.cv` (`/cv/Musa-Walid-CV.pdf`), a direct download with no email gate.
  - The current file is a placeholder that Musa will swap. Keep the path.
- **Reply time:** `site.replyTime`, "I aim to respond within two business days." Confirmed. Business days are Monday to Friday, Melbourne time.
- **Live cursors,** if you build them, are off by default and opt-in.
- **Photos:** only real ones. Event photo slots stay unpublished until Musa supplies originals. Never use a generated image presented as a real event, person or place.
- **No phone number or street address** anywhere. Email and LinkedIn are the contact routes.

**Assets on hand:**
- `src/assets/portrait/musa-portrait.jpg`: 1254×1254 studio portrait. Navy double-breasted pinstripe suit, white shirt, diamond-pattern tie, gold wire glasses, plain light-grey backdrop.
- The placeholder CV.

**Not yet on hand:** handwriting scans, event photos, voice clips, the final CV, the turn video (Appendix A).

---

## 2. The look

### 2.0 The idea: one light, every number footnoted

**One light.** A dark room with one warm key light, high on the left: the light an MC stands in. It lights the portrait, every glass rim and the ambient field, always from the same side.

**Every number footnoted.** Musa has no project imagery (the ad accounts belong to his employers), so his numbers *are* the imagery:
- They're set as display type, each with a footnote marker that opens its scope note.
- That's where the honesty rules become the aesthetic.

**Any feature that serves neither idea is cut.**

### 2.1 In one paragraph

A dark, quiet, expensive room lit by a single soft source. Huge, confident type. Real glass that bends the light and content behind it. Musa's portrait handled like a magazine cover. Motion that is slow where it should impress and instant where it should serve. Every detail finished. Nothing shouts. Everything is considered.

### 2.2 Reference one (the favourite): carterogunsola.com

I studied it live. What makes it work:
- **It feels inhabited and open about itself.**
  - A thin status strip on every page: local time, live visitors, page speed, and when he can next take work.
  - Opt-in live cursors and "someone joined" toasts.
  - A ⌘K command menu holding pages and tools.
  - A "What's new" changelog behind a bell.
- **Physical objects as interface:** a draggable 3D ID badge on a lanyard (three.js), a postage-stamp portrait that expands into a short signed letter, and a contact form written as a letter with an intake receipt that fills in live.
- **The home page is a 3D index:**
  - Project images sit on floating tiles that travel through space as you scroll.
  - A large centred title rolls letter by letter, with a numbered counter (N°01 / 17).
- **A lab** of small experiments on a rotary wheel, with list and grid alternatives.
- **Craft details:**
  - the logo label changes per page
  - light and dark themes
  - expo-out easing everywhere
  - a WebGL paper texture
  - Astro with view transitions, Lenis and three.js (the same framework as this repo)
- **Type and colour:** a neutral grotesk for the interface, a mono for labels, a near-black background (#1E1E1E), and one small warm accent.

### 2.3 Reference two: unanim.studio

What makes it work:
- **Confidence through restraint:**
  - a full-bleed dark hero photograph with the studio name set edge to edge at the bottom, repeated at the top of the footer
  - a live clock with seconds and the city
- **It sells the whole way down:** a booking card that follows you, and a pitch deck behind "ask for download".
- **Navigation** is a single floating pill at the bottom centre, which opens upward into the menu.
- **Work:**
  - laid out in a strict checkerboard, half image and half plain panel, with two-line captions
  - images resolve from coarse pixels into focus
  - a case opens as a sheet sliding over the work index, with a counter and Close
  - each case starts with a year chip, one sentence of what was done, and a services and technology table
- **The work index:** a giant title with the count in brackets, filter chips with counts, a grid/list toggle, and an awards count.
- **The footer** leaves an image trail under the cursor.

### 2.4 Take the principles, never the signatures

**General web patterns are fine to use:** a floating dock, a status strip, a ⌘K menu, a sheet over an index, filter chips with counts, a name set large. They're what gives the family resemblance.

**Distinctive pieces are not.** Do not reproduce:
- **From Carter:** the lanyard badge, the postage stamp, the animal-name cursors, the letter-and-intake-receipt contact form, the floating 3D tile index, the lab wheel, the `KEY::VALUE` label syntax, the "N°" counter styling, or his wording.
- **From Unanim:** the checkerboard work grid, the pixel-resolve images, the wordmark treatment, or the copy.
- **From both:** the fonts (Oracle, PP Neue Montreal Mono and Saans are commercial) and any images.

**Translate their ideas into Musa's own objects, words and details** (section 2.0 shows how). Being in the same family is the goal; being a clone is a failure the principal will reject.

### 2.5 Liquid Glass, properly

Load `apple-design` before designing any glass. The rules:

1. **Glass needs something to refract.** On flat black it reads as a grey box. Every glass surface sits over real content: the portrait, the giant type, imagery, or a slow ambient light field. Design the layer behind first.
2. **Use it for chrome and moments, not for content blocks.** Good uses:
   - the navigation dock
   - the ⌘K menu
   - the case sheet
   - the availability card
   - toasts
   - the hero pane

   Body text never sits on glass over a busy background.
3. **One recipe, used everywhere** (Appendix B): a light blur, a gradient specular rim lit from the key light's side, a fine dark outer line for depth, and edge-only refraction where the browser supports it. Every glass surface sits over the fixed warm light field.
4. **The hero pane:**
   - One thick, flat glass pane with rounded corners. Never a sphere, torus, blob, disc or lens, and never over his face.
   - It crosses the masthead below his shoulders. The name bends through its edges, and the key light catches its top-left rim.
   - On scroll it settles into the dock.
   - **Build it in CSS** with the Appendix B recipe, but the bend must show in WebKit too, proven by the WebKit and iPhone 14 hero screenshots. If CSS can't bend the name convincingly there, use three.js `MeshPhysicalMaterial` (transmission, thickness, IOR), lazy-loaded. Transmission refracts only what's inside the three.js scene, never the page behind the canvas. So draw the name into the scene as a texture, and keep the real DOM text underneath for LCP, accessibility and no-JS. Load `threejs-fundamentals`, `threejs-shaders`, `threejs-textures` and `threejs-performance`, and pin `three@0.186` so the skills match.
5. **Budgets and fallbacks:**
   - At most 4 blurred surfaces visible at once.
   - No backdrop blur on large surfaces that scroll on phones.
   - Under `prefers-reduced-transparency: reduce`, without `backdrop-filter`, or under `prefers-contrast: more`: solid surfaces with the same shape and borders.

### 2.6 Palette and type (defaults; the creative director may refine them)

**Palette:** near-black and warm (red above blue in every neutral), never blue-black.

| Role | Value | Contrast on the background |
|---|---|---|
| Background | `#121110` | |
| Raised | `#1A1816` | |
| Glass fallback | `#211F1C` | |
| Text | `#F3F1EC` | 16.7:1 |
| Secondary | `#A3A19B` | 7.3:1 |
| Tertiary | `#827F7A` | 4.7:1 (use it on the background only; on raised or glass surfaces use secondary) |
| Hairlines | `rgb(255 255 255 / .08)` | |
| Accent, champagne | `#D8C69E` | 11.2:1 |

- **The accent** covers at most 1% of any screen: footnote markers, focus rings, the key light's rim, one key number. The creative director may change it in phase 2, but not to purple, blue or neon.
- **No decorative gradients.** The glass recipe and the light field are the only gradients.

**Type:** all free under the OFL.
- **Display face:** compare Host Grotesk, Schibsted Grotesk and Funnel Display side by side at 200px, with `ui-ux-pro-max:ui-ux-pro-max` for pairing notes. Use Geist for display only if it wins that comparison.
- **Geist** for interface text, and **Geist Mono** for labels, numbers in tables and the status strip.
- **No** Instrument Serif or Fraunces. They're the default AI landing-page accent.

**Scale (starting values):**

| Role | Size / line height / tracking |
|---|---|
| Masthead | `clamp(88px, 15vw, 248px)` / 0.86 / -0.045em |
| H1 | `clamp(44px, 6vw, 80px)` / 0.98 / -0.03em |
| Body | 17px / 1.55 |
| Mono labels | 11px minimum, +0.08em. No functional text under 11px. |

**Grid:** 12 columns, 24px gutters, margins `clamp(20px, 4vw, 64px)`.

### 2.7 Motion

Load `animate`, `choreograph` and `universal-patterns` before animating anything.
- **Interface:** expo-out (`cubic-bezier(.16, 1, .3, 1)`) for entrances; springs (per `apple-design`) for the dock, sheets and anything you drag.
- **Signature moments:** slow and weighty. Everything else is instant or near-instant.
- **Scroll:** Lenis smooth scroll, off under reduced motion. GSAP ScrollTrigger for scroll-linked scenes. No scroll-jacking that traps the visitor.
- **Page changes:** Astro view transitions (`ClientRouter`), with the status strip and dock persisting.
- **Reduced motion:** a complete, deliberate version, not a broken one.

### 2.8 The portrait, handled with grace

The portrait is the one image of Musa. Treat it like a magazine cover, not a gimmick. Two options for the creative director to prototype:

1. **Low-key grade (preferred):**
   - Keep the photo whole and grade it dark: lifted blacks, warm skin, the backdrop falling into the page.
   - The key light matches section 2.0.
2. **Cover depth:**
   - Remove the grey backdrop (Canva `remove-background`, or a careful mask), so he stands on the dark page with the giant name partly behind his shoulders, like a magazine masthead.
   - Use this only if, at 200%, no grey shows inside the lenses of his glasses, no light fringe shows on his hair or beard, and the grade matches the page light.

**Rules:**
- **No AI changes** to his face, body, clothes or expression in the portrait. No robot. No depth-map warping: it bends the glasses.
- **Grade the whole image.** No coloured light on his face.
- **Movement:** only whole layers move, by at most 8px.
- **Cropping:** never crop at the eyes or chin.
- **Glass:** never over his face, hair or glasses. Only the hero pane may cross him, below the shoulders (2.5).
- **Resolution:** the source is 1254px, so render it at most 620 CSS px tall. No AI upscaling. Add the full-resolution original and any outtakes to `ASSETS_NEEDED.md`.
- **The one sanctioned exception** is the turn film in Appendix A. Musa asked for it himself. It's generated from his real portrait, presented as a styled film rather than as footage of an event, and ships only if his face is indistinguishable from the portrait and he approves it. On the page it carries a footnote: "Generated with AI from my studio portrait."

---

## 3. Positioning and story (the CMO leads)

**Positioning**
- The CMO proposes three positioning lines, picks one and justifies it. The old line is retired.
- **One idea, not a list of traits:** a marketer who learnt the job carrying a sales target, so he judges marketing by what closes. The stage, the languages and AI support the line; they aren't the line.
- **After 90 seconds, a CMO should remember three things:**
  - the sales-to-marketing path
  - the Evitech result with its spend
  - 18 sold-out events as lead MC

**Proof rules**
- **Hero proof uses only figures Musa can claim personally:**
  - 28% lower CPA and 65% more qualified leads, shown together with "Two results from the same initiative", on paid media of roughly $15K to $30K a month
  - more than $2M in B2B contracts personally closed to date
  - a social audience grown from 400 to 13,200
- **Company-level figures** (80% pipeline growth, 2.6× revenue) appear only in the Evitech case and their two ledger rows, each with its scope label beside the number. (The 80% row in `growthWork` now carries `scope: 'Company pipeline'`.)
- **Never add** a timeframe or baseline that `site.ts` lacks; ask for it in `ASSETS_NEEDED.md` instead.
- **No number appears more than twice on a page.**

**The story order for a busy executive**
1. Who he is, in one line.
2. Proof up front, under the proof rules.
3. The path: from field sales in April 2021 to Marketing & Growth Specialist in January 2023, four roles from `career`, each with its one metric.
4. How he thinks: two or three principles from `approach`.
5. The work, in depth: the three cases, with the selected growth work alongside them in the work index (no separate page that repeats the same numbers).
6. Beyond work, one line each, on About: the debating credits, the stage, the cause work.
7. An effortless next step.

**The conversion path:** "Get in touch" (email), "Download CV" and LinkedIn, reachable within one action from anywhere.

**Marketing craft, in the site itself**
- **Share preview:**
  - 1200×630 OG and Twitter images built from the real portrait, the name and the line.
  - Each case gets its own, with its headline number and scope label.
  - Check them in LinkedIn Post Inspector.
  - The em dash ban covers titles, meta tags and JSON-LD too.
- **Structured data:** `ProfilePage` with a `Person`: name, `jobTitle` from `site.role`, `addressLocality` Melbourne, `sameAs` LinkedIn, `knowsAbout` from `capabilities`, `worksFor` Evitech. Nothing that isn't in `site.ts`.
- **AI visibility:**
  - Every fact is in plain HTML that renders without JavaScript.
  - The full name is used the same way everywhere.
  - Generate `/llms.txt` from `site.ts`.
  - robots.txt allows AI crawlers.
- **Analytics events:**
  - The events: `case_open {slug, from}`, `cv_download {from}`, `contact_start`, `contact_send`, `email_copy`, `linkedin_click {from}`, `for_view {key}`.
  - Never put form contents or names in event properties.
  - Check that the Vercel plan records custom events, since some plans may not. If it doesn't, say so in the hand-back.
- **Company links (recommended):**
  - Build static `/for/<key>/` pages from a config file. Each tailors the intro line and the lead case for one target company.
  - They're noindex, left out of the sitemap, and canonical to `/`. Each carries its own OG title, so the LinkedIn message preview is tailored too.
  - Unknown keys fall back to the normal page.
  - Don't swap content with client-side JavaScript after load; it would shift the hero and fail the CLS gate.
  - Musa supplies the companies and lines. Until then, build the mechanism with one clearly fake example key that's excluded from production.

---

## 4. Site architecture and signature moments

The creative director may restructure this. The principal must approve any change.

**On every page:**
- **A thin status strip:** Melbourne time with seconds, availability and reply time.
  - No live visitor count: a counter showing 1 tells a CMO nobody visits.
  - Opt-in live cursors (Musa's choice: off by default, with a toggle) need a realtime service account that only Musa can provide.
    - This run lists them in `ASSETS_NEEDED.md` instead of building them.
    - When built later, they must not change the design and never show a count.
- **A floating glass dock:**
  - pages, ⌘K, and "Get in touch"
  - bottom centre on phones; position on desktop to be decided in phase 2
  - a spring opening
  - the hero pane settles into it on scroll
- **A ⌘K command menu** in glass: pages, cases, Download CV, Copy email, LinkedIn and reduced motion. Use `pick-ui-library` to choose or hand-build it, within the JS budget.
- **No "What's new" log.** There are no real, dated entries to fill it at launch.

**Pages:**
1. **Home:**
   - **Hero:** the portrait (2.8), the name set as the masthead, the positioning line, and the glass pane (2.5).
   - Then proof (numbers as display type, footnoted), the path from `career`, approach, the work, and the next step.
2. **Work index:**
   - Each case's cover is its headline figure at display size, plus one real chart drawn from `site.ts` data (`dataviz`). No floating tiles and no stock imagery.
   - Filter chips with counts. Each figure carries its footnote marker.
   - When a case opens, its figure lifts into the headline of a glass sheet over the index, using a view transition. The sheet has a year chip, the outcome sentence, a Channels / Tools / Measured by table, then the story.
   - Keep the deep links: `/work/<slug>/` must still work and be shareable.
   - **The six growth projects:** a typeset ledger under the cases, one row per project with its figure and footnoted `note`, expanding in place. No dial, and no page of their own.
3. **About:**
   - A short, signed note in Musa's voice. Use the handwriting scan when it arrives, and a typeset signature until then.
   - It states only `site.ts` facts: no invented anecdotes, motives or quotes. It ships marked as a draft for Musa's approval.
   - Recognition: one line per debating credit. Then the stage and the cause work.
   - The turn film (Appendix A), only if Musa supplies it and approves it.
4. **Contact, "the brief":**
   - The form is a short client brief:
     - who you are
     - the role or project
     - timeline
     - how you found me
   - Beside it, a one-page brief typesets itself as they write, in the site's type, footnoted, ending with "Aim to reply by <date>": two business days on, Monday to Friday, Melbourne time.
   - No letter or receipt styling (that's Carter's signature).
   - **How it reaches Musa:** by default the form composes a `mailto:` to `site.email` with the fields filled in, so there's no backend and no keys. It works without JavaScript as a plain mailto link.
     - A server route that sends mail needs an email provider account and an API key from Musa.
     - List it in `ASSETS_NEEDED.md`, and don't build it without them.
   - The direct CV download, email and LinkedIn.
5. **`/cv`:** a plain, fast recruiter page, plus the PDF.
6. **404:** in voice, with a way back, stating only facts.

**The three moments people would screen-record:**
- the hero pane bending the name, then settling into the dock
- a figure lifting into its case sheet
- the brief writing itself

Make each one perfect before adding anything else.

---

## 5. Copy and content rules

- **Voice:** plain, confident, specific numbers, short sentences. One person, not a brand.
  - Australian English.
  - First person in page copy; third person only in meta tags and structured data.
  - Match the voice of `approach[0]` in `site.ts`.
- **Process:** run `humanizer` and `writing-guidelines` on every piece of copy, and `design:ux-copy` on interface text.
- **Banned:**
  - em dashes (a test enforces this)
  - "Passionate", "leverage", "unlock", "elevate", "seamless", "synergy", "results-driven", "cutting-edge", "world-class", "journey", "drive", "empower", "innovative", "data-driven", "strategic", "impact" as a verb, and "Hi, I'm"
  - "not X, but Y" contrasts. Rewrite the three already in `site.ts`: "not just the ads", and "not clicks" twice. That's copy, not facts, so editing it is fine.
  - automatic lists of three, one-line closers, rhetorical questions and exclamation marks
- **No placeholders shipped unlabelled.** No lorem ipsum. No fake testimonials, logos or quotes.
- **Accessibility:** alt text describes, it doesn't sell. Link text says where it goes.

---

## 6. Engineering (the head of engineering leads)

**Stack:**
- Keep Astro 5. It's fast, the Playwright suite exists, and the reference site runs on the same stack.
- Add React islands only where a chosen library needs them. If you add any, apply `vercel-react-best-practices` and `vercel-composition-patterns` to them.
- GSAP with ScrollTrigger (load the `gsap-skills:*` skills, including `gsap-frameworks` for Astro), Lenis, and three.js r186, lazy-loaded.
- Vercel hosting, with `@vercel/analytics` already installed.

**Keep from the current code:**
- portrait delivery through `astro:assets`
- the `site.workRights`, `site.cv` and `site.replyTime` usage
- the copy-hygiene tests in `cases.spec.ts` (em dashes, phone numbers, addresses)
- `scripts/qa/lighthouse.mjs` and `scripts/qa/capture.mjs`, both fixed as described in section 9
- the Playwright projects (Chromium, WebKit, Pixel 7, iPhone 14)
- Person JSON-LD and the sitemap

**Remove:**
- `tests/e2e/lens.spec.ts`
- `tests/e2e/hero.spec.ts` and its PNG snapshots. The whole file tests the old card hand.
- the robot image (`src/assets/portrait/musa-robot.png`) and its import in `src/pages/index.astro`
- the lens code in `src/scripts/main.ts` and `src/styles/global.css`
- `scripts/qa/engines.mjs`, `scripts/qa/interactions.mjs` and `scripts/qa/hero-shots.mjs`
- the "I sell like a human" headline
- `prototypes/` stays in the repo as history, but nothing from it ships

**Rewrite for the new site:**
- the CV test (`home.spec.ts` expects exactly two CV links)
- the home and keyboard tests
- the selectors in `a11y.spec.ts` (it targets `.hand` and `.top`)
- the font test in `cases.spec.ts` (it fetches `archivo.woff2`)
- the page lists in `capture.mjs`, `a11y.spec.ts` and `src/pages/sitemap.xml.ts`

**Budgets:** see section 9.

**Testing:**
- Use `superpowers:test-driven-development` for every piece of logic: the aim-to-reply-by date, the typeset brief's state, filters, command-menu search, the `/for/<key>/` config.
- Write Playwright tests for every interaction, on all four projects.
- **Visual regression:**
  - If three.js is used and Deno is installed, run `parallax-threejs:init`, exclude `test/visual`, `lib` and the copied `scripts` from `tsconfig.json` so `astro check` stays at 0 errors, and protect the signature moments with scenarios (`parallax-threejs:scenario-author`).
  - Deno isn't installed today. If it's still missing, list it for the hand-back and use Playwright screenshot tests for the signature moments.

**Commit** after each finished piece, with plain messages. Stay on `redesign/v3-dark`. Add `docs/v3/research/` to `.gitignore`, so screenshots of the reference sites never reach GitHub.

**Previews only:**
- **Every round:** `npx vercel@<pinned version> deploy -y` from a clean tree builds a preview without pushing.
  - The project is already linked to Vercel (`.vercel/project.json`).
  - Check the latest version once with `npm view vercel version`, then pin it.
  - Add `docs/v3/research/` to `.vercelignore`.
  - If the deploy fails, review the local `astro preview` instead and note it in the log.
- **GitHub:** pushing publishes the branch, so don't push during the run. Ask in the hand-back, beside the merge question. A yes covers `redesign/v3-dark` only.
- **Never stop mid-run to ask.** Anything only Musa can give goes in `ASSETS_NEEDED.md` and the hand-back: the push, Deno, a realtime service account for live cursors, an email provider key.
- **Never** `--prod`, `--temporary`, `promote`, a force-push, or a push to `main`.
- **Never** merge to `main` or deploy to production without Musa's explicit yes. `main` is the live site.
- **SEO is measured on the local production build.** Vercel previews send `x-robots-tag: noindex`, so they can't score it.

---

## 7. Skills, agents and connectors

### 7.1 Every installed skill, and where it's used

Load a skill when its phase begins: `Skill` tool, exact name.

| Area | Skills | Phase | Used by |
|---|---|---|---|
| Ways of working | `superpowers:using-superpowers`, `superpowers:brainstorming` (the brief answers its questions; don't stop to ask Musa), `superpowers:writing-plans`, `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents`, `superpowers:executing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`, `superpowers:requesting-code-review`, `superpowers:receiving-code-review`, `superpowers:finishing-a-development-branch` | All | Studio lead, head of engineering |
| Direction and taste | `impeccable`, `taste-skill:design-taste-frontend`, `learn-taste`, `frontend-design:frontend-design` (and the repo's `portfolio:frontend-design`), `prototype`, `ui-ux-pro-max:ui-ux-pro-max`, `ui-ux-pro-max:design-system`, `ui-ux-pro-max:brand`, `design:design-system`, `design:design-critique`, `design:design-handoff`, `design:research-synthesis` (for the reference study) | 1, 2, 5 | Creative director |
| Apple and interaction craft | `apple-design`, `emil-design-eng`, `ask-emil`, `gestures`, `mobile-native`, `pick-ui-library`, `break-ui`, `web-design-guidelines` | 2 to 5 | Creative director, studio lead |
| Motion: deciding | `animate`, `choreograph`, `animation-vocabulary`, `find-animation-opportunities`, `remove-animations` | 2 to 5 | Creative director |
| Motion: patterns | `universal-patterns`, `entrance-animations`, `exit-animations`, `scroll-animations`, `hover-interactions`, `state-changes`, `transition-sequences`, `loading-states`, `feedback-indicators`, `attention-grabbers`, `continuous-loops`, `gesture-responses` | 4 | Studio lead |
| Motion: quality | `review-animations`, `improve-animations`, `animation-performance` | 5 | Creative director, head of engineering |
| GSAP | `gsap-skills:gsap-core`, `gsap-skills:gsap-timeline`, `gsap-skills:gsap-scrolltrigger`, `gsap-skills:gsap-plugins`, `gsap-skills:gsap-utils`, `gsap-skills:gsap-frameworks`, `gsap-skills:gsap-performance`, and `gsap-skills:gsap-react` only for React islands | 4, 5 | Studio lead |
| 3D and glass | `threejs-fundamentals`, `threejs-geometry`, `threejs-shaders`, `threejs-textures`, `threejs-performance` | 4, 5 | Studio lead |
| 3D verification | `parallax-threejs:init`, `parallax-threejs:checkpoint`, `parallax-threejs:diff`, `parallax-threejs:sweep`, `parallax-threejs:sync-view`, `parallax-threejs:replay`, `parallax-threejs:memcheck`, `parallax-threejs:export-report`, `parallax-threejs:qa-visual-test-harness`, `parallax-threejs:ship-check` | 4, 5 | Studio lead, head of engineering |
| Copy and marketing | `humanizer`, `writing-guidelines`, `design:ux-copy`, `marketing:brand-review`, `marketing:content-creation`, `searchfit-seo:seo-check`, `searchfit-seo:schema-markup`, `searchfit-seo:on-page-seo`, `searchfit-seo:technical-seo`, `searchfit-seo:ai-visibility` | 2, 5 | Chief marketing officer |
| Visual assets | `image-generation:image-generation` (abstract textures and ambient plates only, never people or events), `ui-ux-pro-max:design` (monogram), `ui-ux-pro-max:banner-design` (OG and LinkedIn images built from the real portrait), `dataviz` (any chart of results) | 2, 4 | Creative director |
| Review and safety | `code-review`, `simplify`, `security-review`, `design:accessibility-review` | 5 | Head of engineering |
| Running and shipping | `run`, `vercel:deploy`, `deploy-to-vercel`, `vercel:verification`, `vercel:access-protected-vercel-deployment`, `vercel:vercel-cli`, `vercel:env-vars`, `vercel:status`, and `vercel-optimize` once the preview has traffic data | 6 | Head of engineering |
| Framework notes | `vercel-react-view-transitions` (concepts only; Astro has its own view transitions), `vercel-react-best-practices` and `vercel-composition-patterns` (React islands only) | 4 | Studio lead |

**Installed but out of scope** (say so in the hand-back; don't force them in):
- `animate-expo`, `vercel-react-native-skills` and `write-swift`, which are for native apps
- `ask-sonner`, unless a React toast island is chosen
- `vercel-cli-with-tokens`, unless the CLI login fails
- `ui-ux-pro-max:slides` and `ui-ux-pro-max:ui-styling` (shadcn), not used on an Astro site without React
- `superpowers:using-git-worktrees`: stay on the branch
- `superpowers:writing-skills` and `superpowers:diagnosing-superpowers`, which are tooling for skills themselves
- `find-skills`: run it once in phase 0 and report anything worth adding, but install nothing without Musa's yes
- the LinkedIn, sales, finance, HR and small-business plugins

### 7.2 Agents

- **The studio:** `creative-director`, `head-of-engineering`, `chief-marketing-officer`, `principal` (in `.claude/agents/`).
- **Impeccable:**
  - `impeccable-finish-reviewer` (whole-build review against the direction contract)
  - `impeccable-motion-reviewer` (captured motion)
  - `impeccable-documenter` (writes `DESIGN.md` from the finished build)
  - `impeccable-asset-producer` (clean raster assets from approved references)
- **three.js:**
  - `parallax-threejs:shader-reviewer` (before any GLSL runs)
  - `parallax-threejs:visual-debugger` (when a scene looks wrong)
  - `parallax-threejs:scenario-author` (regression scenarios for the signature moments)
- **Built in:** `Explore` for wide code searches.

### 7.3 Connectors

| Connector | Use | Status |
|---|---|---|
| Built-in browser, Playwright and Chrome DevTools MCPs | Study the references, review every round, take screenshots and traces | Available |
| three.js DevTools MCP | Inspect the scene, draw calls and memory | Available with the parallax-threejs plugin |
| Spector MCP | GPU frame capture | Failed to connect last session. Optional |
| Canva | `remove-background` for the portrait cut-out; OG and social images | Connected. Its `export-design` refused before, so download results through the asset or thumbnail URLs, or ask Musa to download |
| Higgsfield | Model catalog (`models_list`, `models_get`) and past generations (`show_generations`). It **cannot generate**: Musa generates in the Higgsfield app from Appendix A's prompts. Ask before downloading any result | Connected |
| Figma | If connected, lay out the design system and the key screens as frames for the creative director's review, and read any frames Musa adds. If it can only read, use it for reading | Needs Musa to connect it |
| Vercel | Preview deploys, logs, analytics | Plugin installed |

---

## 8. The process: phases and the loop

Keep a running log in `docs/v3/LOG.md`: decisions, round numbers, verdicts and links to evidence.

**Phase 0: set up (studio lead)**
- Read the repo, `site.ts`, `SUMMARY-lighter-v2.md`, the tests and this file.
- Confirm the branch.
- Check that every skill and agent in section 7 loads. Note any that don't, and carry on.
- **Five skills can't be called through the Skill tool:** `prototype`, `learn-taste`, `pick-ui-library`, `review-animations` and `ask-emil` (they set `disable-model-invocation`). Read their `SKILL.md` files in `~/.claude/skills/` directly and follow them.
- **Always invoke skills with task-specific `args`.** Some, like `animate`, only reply with a greeting when called without arguments, and that would stall an unattended run.
- **Cost:** up to 8 rounds of six agents is expensive. Re-read this file and `docs/v3/LOG.md` at the start of every round. If usage limits are near, stop at a clean commit and hand back with the log.
- Check the connectors.
- Run `find-skills` once.

**Phase 1: research (creative director and CMO, with the studio lead driving the browser)**
- Study both references live in the browser at desktop and phone sizes. Scroll, open things, capture motion.
- Save notes and internal reference screenshots to `docs/v3/research/`. These are never shipped or published.
- Study Liquid Glass with `apple-design`.
- Output: a one-page research synthesis (`design:research-synthesis`).

**Phase 2: direction.** The studio lead builds and writes; the agents direct and approve.
- The CMO sets the positioning and the story order (section 3). The studio lead writes them to `docs/v3/story.md`.
- **The creative director directs three genuinely different hero directions.** The studio lead builds them, following the `prototype` skill, behind a picker. Each has the portrait, the name, the type, the glass pane and the palette.
- `ui-ux-pro-max` supplies the palette and type candidates.
- The studio lead runs `taste-skill` and `impeccable` critique on all three and hands the results to the creative director.
- The principal picks one (or STOPs and asks for new ones) and records why.
- The studio lead writes the direction contract to `DESIGN.md` (`impeccable`), and the creative director approves it. The accent and fonts are now fixed.
- Don't stop to ask Musa. Record the alternatives for the hand-back.

**Phase 3: plan**
- The studio lead writes `docs/plans/v3.md` with `superpowers:writing-plans`: architecture, components, data flow, motion system, glass system, test plan, budgets and task order.
- The head of engineering approves the plan before any build starts.

**Phase 4: build (studio lead)**
- Execute the plan in order (`superpowers:subagent-driven-development` or `superpowers:executing-plans`), TDD for logic.
- Build the signature moments first and get them reviewed early. Don't polish the margins of a direction that isn't working.
- Commit per finished task.

**Phase 5: the loop.** At most 8 rounds; each round is a fresh, complete pass:
1. **Studio lead:**
   - run build, types and tests
   - deploy a Vercel preview
   - take screenshots of every page at 1440, 1024, 390 and 375
   - record the three signature moments
2. **Run `head-of-engineering` alone first.** Builds, Lighthouse and traces need the machine to themselves; machine noise has already skewed one Lighthouse run.
3. **Then run in parallel,** against the preview: `creative-director`, `chief-marketing-officer`, `impeccable-finish-reviewer` and `impeccable-motion-reviewer`.
   - Each browser MCP is one shared browser, so only one agent drives it at a time. The others use headless Playwright through Bash.
   - The studio lead runs `code-review`, `security-review` and (if shaders changed) `parallax-threejs:shader-reviewer`, and passes the output on.
4. **Then the `principal`,** with all the reports and the evidence.
5. **If CHANGES REQUIRED:** fix the principal's top three first, then the rest by impact. Use `superpowers:receiving-code-review` (verify each point before acting on it). Follow `learn-taste` (read its SKILL.md) to turn repeated corrections into `DESIGN.md` rules. Start the next round.
6. **If STOP:** go back to phase 2 with the principal's reasons.
7. **Exit only when all four studio agents return APPROVED in the same round and every gate in section 9 passes** with evidence (`superpowers:verification-before-completion`).
8. **If round 8 ends without approval:** stop. Hand back honestly, with what passes, what doesn't and why.

**Phase 6: hand back**
- `impeccable-documenter` updates `DESIGN.md` from the shipped build.
- Write `SUMMARY-v3.md` (section 10).
- Use `superpowers:finishing-a-development-branch` to present the options, but merge to `main` or deploy to production only on Musa's explicit yes.

---

## 9. Gates and definition of done

**Hard gates** (the head of engineering measures them):

**Fix `scripts/qa/lighthouse.mjs` first:**
- Write to a fresh output folder each round.
- Fail loudly instead of `catch {}`, which silently re-reads an old JSON.
- Count JavaScript requested before `load` separately from lazy-loaded chunks.

| Gate | Pass | How it's measured |
|---|---|---|
| Build and types | 0 errors | `npm run build`, `npx astro check` |
| Playwright | 0 failures across Chromium, WebKit, Pixel 7 and iPhone 14; every new interaction tested | `npm run test:e2e` |
| Lighthouse, mobile | Performance ≥ 90, Accessibility 100, Best Practices ≥ 96, SEO 100 | Local `astro preview`, median of 5. If the page uses WebGL, the final screenshot must show it actually rendered, not the fallback |
| Lighthouse, desktop | Performance ≥ 95, other scores as mobile | Same |
| LCP and CLS | LCP < 1.8s, CLS < 0.02 | Lighthouse, mobile |
| INP | ≤ 200ms for the worst interaction | DevTools performance trace at 4× CPU throttling (Lighthouse navigation mode doesn't measure INP) |
| JavaScript | ≤ 150 KB gzipped requested before `load`. three.js boots after load and idle. If WebGL fails, the fallback shows with no console error | Network log |
| Frame rate | ≥ 95% of frames under 16.7ms, no task over 50ms | Headed Chrome on this Mac, a 5-second scroll trace over the hero and the work index |
| Glass | ≤ 4 visible `backdrop-filter` elements; solid fallbacks work | A Playwright test that counts them. Reduced transparency emulated through CDP in Chromium (Safari doesn't support that media query) |
| Accessibility | axe 0 violations; full keyboard path; visible focus; reduced motion complete; no-JS shows all content | Playwright and axe |
| Hygiene | No console errors except the known local analytics 404; no em dashes, phone numbers or addresses | Playwright |
| Facts | Every figure traces to `site.ts` with its scope note | Grep against `site.ts` |
| 3D | `parallax-threejs:memcheck` clean after navigating away and back; shader review clean; draw calls and texture memory recorded | parallax-threejs and the three.js DevTools MCP |

**Taste gates:**
- The creative director and the CMO score every line 4 or above.
- The principal finds no slop.

**Definition of done:**
- [ ] A stranger can say who Musa is and what he's great at within five seconds of landing.
- [ ] A CMO remembers three specific things after 90 seconds, and would take the meeting.
- [ ] At least three moments worth screen-recording, each one polished.
- [ ] It is unmistakably in the family of the two references, and copies neither.
- [ ] Liquid Glass that refracts real content, with fallbacks.
- [ ] Phones feel native: no hover-only content, no broken states at 375px.
- [ ] Every gate above passes, with evidence in `docs/v3/LOG.md`.

---

## 10. The hand-back (what Musa receives)

**Write `SUMMARY-v3.md`, and send Musa a message with:**
1. **The preview link** (Vercel preview, never production) and how to open it if it's protected.
2. **Screenshots,** desktop and phone, of every page, plus the three signature moments as short recordings or frame strips.
3. **The final round's verdicts** from all four studio agents, and the gate table with measured values.
4. **The direction chosen** and the two alternatives, each with one screenshot, so he can change course.
5. **Skills:** which were used and where, and which were out of scope and why.
6. **Placeholders and needs:**
   - the final CV PDF
   - handwriting scans: name, signature and short notes
   - event photos
   - the turn film (Appendix A)
   - companies and one-line intros for the `/for/<key>/` pages
   - enabling Web Analytics in the Vercel dashboard, if still off
7. **The decisions for Musa:**
   - "Push `redesign/v3-dark` to GitHub?"
   - "Merge to `main` and go live?"

   Nothing is pushed or goes live without his yes. Also list everything in `ASSETS_NEEDED.md` that only he can provide, such as Deno, a realtime account or an email provider key.

---

## 11. Never

- Never bring back the human-versus-machine idea, the Seam, the lens or the robot.
- Never invent or round up a fact, or drop a scope note.
- Never ship a generated image presented as a real photo, or alter Musa's face or body. The turn film (Appendix A) is the one sanctioned exception, under the conditions in section 2.8.
- Never copy a signature piece, image, font or line of copy from either reference.
- Never merge to `main`, deploy to production, buy anything, or change account settings without Musa's explicit yes.
- Never hand back work the principal hasn't approved, unless round 8 has ended. In that case, say plainly that it isn't approved.

---

## Appendix A: the turn film, in the dark (optional; Musa generates it in Higgsfield)

A 6-second photoreal shot for the About page, requested by Musa: the one sanctioned exception to the no-generated-imagery rule (section 2.8). It's used only if Musa supplies it, his face is indistinguishable from the portrait, and both he and the creative director approve it.

1. **Start frame (Nano Banana Pro, 2k, 16:9, reference: the portrait):**

> The same man as in image 1, seen from directly behind, standing with his back to the camera in a dark, low-key studio with a near-black backdrop. A single soft warm key light from above left, a subtle rim light on his shoulders and hair. Wide shot from mid-thigh up, centred, with plenty of dark space on both sides. His swept-back black hair, the arms of his gold wire glasses visible over his ears, his navy double-breasted pinstripe suit jacket seen from behind, hands relaxed at his sides. Photorealistic, cinematic, sharp, 16:9.

2. **End frame (same settings; references: the portrait, then the start frame):**

> The same man as image 1, in the same dark studio and light as image 2. Medium close-up from the waist up, centred, facing the camera and looking straight into the lens, arms folded firmly across his chest. Composed, serious, confident, mouth closed. Keep his face exactly as in image 1: same full beard, swept-back black hair, gold wire square aviator glasses, navy double-breasted pinstripe suit, white shirt, dark diamond-pattern tie. Warm key light, soft rim light, near-black background. Photorealistic, sharp, 16:9.

3. **Video:**
   - Seedance 2.0. Start image: the start frame. End image: the end frame. Image reference: the portrait.
   - 6s, 16:9, 1080p, audio off.
   - Backup: Minimax Hailuo 2.3 at 1080 with the same frames.

> One continuous shot, no cuts. A slow, steady dolly push-in from a wide shot to a medium close-up. He stands with his back to the camera. As the camera moves in, he turns his head over his shoulder, then turns his whole body to face the camera and looks straight into the lens. Holding eye contact, he folds his arms across his chest, firm and deliberate, and gives one small nod. He holds still for the final second. Dark low-key studio, warm key light, natural human motion, his face identical to the reference.

**When it arrives:**
- Re-encode it for scroll scrubbing with `prototypes/portrait-lens/prep-turn.sh`. It sets a keyframe every 4 frames and no B-frames.
- Then scrub it with scroll, using the time-based easing approach from that prototype.
- Phones get a 4:5 crop so the folded arms stay in frame.
- Reduced motion gets the end frame.
- If anything looks uncanny, don't use it.

## Appendix B: the glass recipe (a starting point)

Frosted iOS 7 glass (a heavy blur with a white fill) greys everything out, and that's the "grey box" to avoid. Liquid Glass is mostly clear: the rim and the edges do the work.

- **Blur:** 8px for the dock and toasts, 14px for ⌘K and the sheet header.
- **Fill:** white at .03, fading to .01, with `saturate(160%) brightness(1.08)`.
- **Rim:** a 1px gradient border on `::before`, brightest where the key light hits: .35 at the top left, .08 on the sides, .12 at the bottom.
- **Depth** comes from the rim and a 1px outer line in `rgb(0 0 0 / .6)`, not from a big drop shadow (that disappears on near-black).
- **Refraction:**
  - A displacement map built from the element's own rounded rectangle: neutral in the centre, bending only the outer 12 to 16px.
  - Generate it at runtime for each element size (a small canvas into `feImage`, then `feDisplacementMap`).
  - Never `feTurbulence`.
  - Enable it only in Chromium, which renders it through `backdrop-filter: url(#…)`. Use the user-agent check in the CSS comment below. Verify that the fallback looks right in WebKit and Firefox.
- **The light field:** a fixed layer behind the whole site, made of two warm radial pools at 4 to 6% luminance, with 2% grain to prevent banding. This is what the glass refracts when nothing else is behind it.
- **On phones** the case sheet is solid, and only its header is glass.

```css
.glass {
  --glass-blur: 8px;
  position: relative;
  border-radius: 22px;
  background: linear-gradient(180deg, rgb(255 255 255 / .03), rgb(255 255 255 / .01));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%) brightness(1.08);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%) brightness(1.08);
  box-shadow: 0 0 0 1px rgb(0 0 0 / .6);               /* depth: fine outer line */
}
.glass--strong { --glass-blur: 14px; }                  /* ⌘K, sheet header */

/* Specular rim: 1px gradient border, lit from the key light's side (top left). */
.glass::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit; padding: 1px; pointer-events: none;
  background: linear-gradient(135deg,
    rgb(255 255 255 / .35), rgb(255 255 255 / .08) 35%,
    rgb(255 255 255 / .08) 65%, rgb(255 255 255 / .12));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
}

/* Edge refraction. Add .glass--refract only when
   navigator.userAgentData?.brands.some(b => b.brand === 'Chromium').
   CSS.supports() can't be trusted here: Safari reports url() as supported, then drops the whole backdrop.
   Keep the SVG filter in a transition:persist element. Never animate opacity or filter on an ancestor of a
   glass surface. prefers-reduced-transparency works in Chromium only (no Safari support through 27.x). */
.glass--refract {
  backdrop-filter: url(#glass-edge) blur(var(--glass-blur)) saturate(160%) brightness(1.08);
}

/* The light field behind everything. */
body::before {
  content: "";
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(60vw 50vh at 18% 10%, rgb(255 214 170 / .06), transparent 70%),
    radial-gradient(50vw 40vh at 82% 78%, rgb(255 196 150 / .04), transparent 70%);
}

/* Solid fallbacks: same shape and rim, no blur. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: #211F1C; }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass, .glass--refract {
    -webkit-backdrop-filter: none; backdrop-filter: none;
    background: #211F1C;
  }
}
```

The creative director tunes the values. The head of engineering checks the cost. Design what sits behind the glass first.
