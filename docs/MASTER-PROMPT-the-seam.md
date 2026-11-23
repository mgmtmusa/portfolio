> **Superseded on 24 November 2026 by `docs/MASTER-PROMPT-v3.md`.** The human-versus-machine concept is retired. Kept for history only; don't build from this file.

# Master prompt: "The Seam", portfolio v2

**How to use this file**

1. Open a **new** Claude Code session with the `portfolio` folder as the working directory. Use Opus at high effort.
2. Install the skills listed in section 11 first, and make sure the Higgsfield connector shows as connected.
3. Paste everything below the line. Attach your handwriting scans, photos and voice clips as you get them; the prompt tells Claude where to use each one.
4. `docs/CREATIVE-DIRECTION.md` is part of this prompt. It merges the concept with the two reference sites (carterogunsola.com and unanim.studio).

---

## 0. Your role and the bar

You are a creative director and a senior creative technologist working as a pair, at the level of the studios that win Awwwards Site of the Day (Lusion, Active Theory, Locomotive, Resn). You are rebuilding my personal portfolio in this repo.

The bar has two parts:

- A CMO at a billion-dollar company finishes the visit thinking: *"If he does this for himself, imagine what he'd do for us."*
- A studio that bills $10,000 a month for websites looks at it and sees work as good as its own.

The site is not a résumé with animations. **The site is the case study.** Every claim I make about my skills (creative judgment, analytics, AI, conversion thinking) has to be something the visitor *experiences*, not something they read.

**Read `docs/CREATIVE-DIRECTION.md` before anything else.** It's the art direction for the build and contains:
- what to take from my two reference sites
- what to leave out
- the type, mode and motion system
- the page order

Where it disagrees with this file, it wins. Take principles from the references, never their assets, copy or signature details.

**Ground rules**

- Never invent facts. All career facts come from `src/data/site.ts` and the case study pages in `src/pages/work/`. Keep qualifiers such as "organisation total" exactly as written.
- If a feature needs a fact or asset I haven't given you, use a clearly marked placeholder and add it to `ASSETS_NEEDED.md` at the repo root.
- Never generate fake photos of me, fake events, fake people or fake testimonials.
- Ask me before you depart from the concept. Make your own calls on anything smaller.

## 1. Who I am (the raw material)

**The career, in one line:** door-to-door solar sales (April 2021) → B2B sales executive and team leader within six months, $2M+ closed personally → opened the NSW hub in four months, recruited 23, coached a team that grew to 35 → Marketing & Growth Specialist at Evitech since January 2023.

**Results already on the site:** 28% lower cost per acquisition, 65% more qualified leads (Evitech); audience grown from 400 to 13.2K, 18 sold-out events as lead MC, 70% more revenue per event, across five cities (I Heart Uni); 768 children reached, organisation total (The Lil Project, gigs that fund school buildings in Zambia).

**The human threads the current site barely uses:**

- I represented Bangladesh in international debating: Asian Schools Debate Championship (Kuala Lumpur, 2014, 28 nations) and SBI-NUJS Parliamentary Debate (Kolkata, 2015). I was one of four national delegates to the UNESCO ASPnet summit (Okayama, Japan, 2014).
- English and Bangla are both native to me, and I'm fluent in Hindi.
- I'm an MC. I've hosted O-Week cohorts of 1,000 students and 18 sold-out events.
- I set Evitech's highest day-one sales record, knocking on doors.
- I was president of the Multicultural and Multi-Faith Club at Trinity College.
- I've done cause-led work: gigs that build schools.

**The machine threads:** GA4, Tag Manager, Looker Studio, HubSpot, GoHighLevel, Salesforce, Zapier, and Claude in reporting, lead scoring and production work, always with a human check before anything goes out. I judge marketing on qualified leads and CPA, not clicks.

## 2. What's wrong with the current site (keep the good parts)

- It's a résumé in website form. It *tells* the visitor I'm analytical and use AI, but nothing on it is analytical or uses AI.
- The visual language is generic: big condensed sans-serif on beige with stacked cards. Anyone could have it.
- My personality is almost absent: no face, no voice, no handwriting, no Bangladesh, no stage.
- **Keep:** the copy discipline, honesty about evidence ("ad accounts belong to Evitech, so they aren't shown"), the sales-to-marketing story, the Playwright and axe test suite, and the performance work.

## 3. The concept: The Seam

**Positioning:** *Half human. Half machine.*
**Thesis line (test against alternatives):** "I sell like a human. I measure like a machine."
Alternatives to try: "Instinct, instrumented." / "The human closes. The machine proves it."

**The core idea:** every part of the site has two layers.

- **The human layer** (on top): paper, ink, my real photographs, my handwriting, my voice. Warm, imperfect, eased motion.
- **The machine layer** (underneath): the same content, read as data. Coordinates, formulas, queries, event logs, measurements. Precise, stepped motion.

A single 1px vertical line, **the Seam**, runs the full length of the site. It's the spine of the layout and the border between the two layers. The visitor can open it.

**The rule that writes the whole site:** every human element has a machine reading, and every machine element has a human reason. When you're unsure what to put somewhere, apply the rule.

**The metaphor: the Room.** I read rooms for a living: crowds of 1,000, a debate floor, doorsteps. The site is a room:
- The human reads it. The machine measures it.
- Visitors are seen live (presence), measured privately (You, measured), and leave with a reason to call (the brief).

**Human/Machine is also the site's theme:** Human is paper, Machine is ink.

**The one deliberate exception:** The Lil Project. On that page the machine has nothing to add (see 5.3). Breaking the rule once is what shows the rule was a choice.

## 4. My portrait: the centrepiece

The portrait is at `src/assets/portrait/musa-portrait.jpg` (1254×1254, plain light-grey background, navy double-breasted pinstripe suit, white shirt, diamond-pattern tie, gold wire glasses). A working prototype of the lens on this photo is at `prototypes/portrait-lens/index.html`. Start from it.

**My decision:** under the lens, I am a robot. Not a glitch split or a wireframe skull, but a photoreal steel android lined up exactly with the photo, so the lens looks like it's seeing what's inside me. The style reference is black-and-white brushed steel: machined plates, rivets, camera-lens eyes with a white-hot core, and a wiring cutaway in one cheek. The full generation prompts are in `docs/HIGGSFIELD-PROMPTS.md`.

### 4.1 The Lens on the portrait (hero)

The hero shows the portrait as a calm, beautifully lit photograph. The cursor carries a circular lens. Inside the lens, the photo turns into the robot (`robot.jpg`, generated and pixel-aligned to the portrait), with a stepped scan line and measurement overlays. The prototype already has a code-drawn robot as a fallback for when the render isn't there.

Engineering-drawing annotations connect parts of the photo to real career facts, with leader lines, dimension ticks and coordinates. Examples to refine:

- **Eyes / glasses:** "Reads a room of 1,000. O-Week MC."
- **Mouth:** "18 sold-out events as lead MC" / "Debated for Bangladesh, 28 nations."
- **Suit lapel:** "Door to door, April 2021 → B2B, $2M+ closed."
- **Tie pattern:** "Pattern recognition: 28% lower CPA."

Annotations appear only where the lens passes. Discovery is the point.

### 4.2 The pinstripes become the data

This is the signature move. On scroll, the vertical pinstripes of the suit detach from the jacket, straighten into chart gridlines, and bend into the growth curves of the case studies (400 → 13.2K audience, the CPA line going down). The suit literally turns into the evidence.

Build it with an SVG or WebGL line set traced to match the stripe positions in the photo. Cross-fade the photo out as the lines take over.

### 4.3 The tie becomes the grid

The tie's diamond pattern resolves into the pixel and dot grid used in later sections. Use it as the transition into the work section.

### 4.4 A living portrait (Higgsfield)

Make a 3 to 5 second image-to-video loop from this exact photo: a natural blink, a slight breath, nothing else. No expression changes, no head turns, no speech.

As of November 2026 the Higgsfield connector can list models (`models_list`, `models_get`) and read past generations (`show_generations`), but it has no tool that generates media. So:
1. Use `models_list` with type `video` to recommend the best image-to-video model, and write me the exact prompt to use.
2. I generate the loop in the Higgsfield app.
3. You find the result with `show_generations` and ask me before downloading it.

- It plays only in the human layer, and only after the page is idle.
- Export it as WebM and MP4, each under 1.5MB, with the original photo as the poster frame.
- If it looks even slightly uncanny, drop it. The still photo is better than a fake-looking video.

### 4.4b The turn (Lens study 02)

A photoreal 6-second shot, generated from my real portrait, and driven by the visitor's scroll rather than played.
- **The shot:** I stand with my back to the camera in the grey studio while the camera pushes in. I turn over my shoulder, look straight into the lens and fold my arms across my chest. Then I hold.
- **The lines,** one per beat, in the serif: "I study the room first." / "Then I face it." / "Then we talk numbers."
- **The machine reads it:** a mono overlay steps through the beat name, the timecode and the frame count, with a signal-orange progress line. The motion is eased and the readout is stepped, the same split as the rest of the site.
- **Mechanics:**
  - It's a pinned section about 4 viewports tall.
  - Scroll progress sets the target time on the video, and the shown time catches up with a time-based ease (about 0.1s), so it never jumps.
  - The clip is encoded with a keyframe every 4 frames and no B-frames so seeking is instant. `prototypes/portrait-lens/prep-turn.sh` does this.
- **Phones:** a full-height crop would cut off the folded arms, so the clip sits in a 4:5 frame with the words on paper below it.
- **Reduced motion:** the end frame, with all three lines.
- **Prompts and file:** the shot list and prompts are in `docs/HIGGSFIELD-PROMPTS.md`, and the file is `turn.mp4`. `prototypes/portrait-lens/` has a working version.
- **Placement:** directly after the hero, as the transition into the story. Keep it there unless something lands harder.

### 4.5 Mobile

Long-pressing the portrait opens the lens at the finger. Annotations become a tap-through sequence. The pinstripe transition is driven by scroll, so it works the same on touch.

## 5. Signature interactions (these are the product)

### 5.1 The Lens, site-wide

The same lens works everywhere, not only on the portrait:

- Over a **paragraph**, it shows the claim and where its evidence lives.
- Over a **number**, it shows the formula and how the number is measured.
- Over a **photo**, it shows the dithered machine reading.

**Build it with two stacked DOM layers.** The machine layer is clipped by a CSS `clip-path: circle()` that tracks the pointer, which keeps text cheap and crisp. Use WebGL only for image regions. The lens copy is an `aria-hidden` duplicate.

**Global toggle:** press **M**, or use the switch in the HUD, to flip the whole page into machine mode. That mode is fully accessible, so keyboard and screen-reader users get the machine layer through it.

### 5.2 Handwritten name, machine-read

Above or beside the portrait, my name is drawn stroke by stroke from scans of my real handwriting, in **Bangla script first, then English**. I'll write both by hand. Do not typeset the Bangla yourself; wait for my scan.

After the drawing finishes, the ink strokes resample into a few thousand points that settle into place. Under the lens, they show their coordinates.

### 5.3 Case studies as "two readings"

Each case study is split along the Seam:

- **Left side: what I decided** (human). The story, in my voice, with handwritten margin notes.
- **Right side: what the data said** (machine). The metrics. Every stat can be opened to show how it was measured.

**Evitech: "Spend the budget."** The visitor splits an *illustrative* $20K/month between Meta and Google with a slider. A simple diminishing-returns model shows predicted qualified leads and CPA. Then the page reveals the principle I actually used.
- Label it clearly as an illustrative model, not Evitech data.

**I Heart Uni.** An outline map of Australia with Melbourne, Sydney, Adelaide, Brisbane and Canberra. The audience counter grows from 400 to 13.2K as you scroll, and the 18 sold-out events light up as dots. If I provide a clip, a small "MC mode" button plays my voice.

**The Lil Project.** 768 dots, one per child (organisation total), slowly assemble into the outline of a school building. No HUD, no annotations, no lens readings. If the visitor opens the lens here, it shows only: *"768 = 768. Some numbers don't need a model."*
- This is the quietest moment on the site, and it should feel that way.

### 5.4 "The Door": origin scroll scene

A pinned, scroll-driven sequence through April 2021 → highest day-one record → team leader in six months → NSW hub in four months, 23 recruited, a team of 35 → marketing in January 2023.

The Seam line bends into a funnel and pipeline chart as you scroll. The human side carries photos and handwritten notes; the machine side carries the numbers.

The loader can preview this: instead of a percentage, a counter runs doors → conversations → contracts → $2M+. Then the portrait resolves from pixels and the page settles from ink onto paper.
- Use only real numbers. If I don't supply door counts, use stages without numbers.
- It must be skippable, play only once per session, and take under 1.8 seconds.

### 5.5 "Debate me" (AI, and personal)

This uses my debating background. The visitor proposes a marketing motion, for example "This house believes brand spend is wasted in B2B."

1. Claude argues **both sides** in parliamentary format: Proposition and Opposition, three points each, revealed against a debate clock.
2. Then the page shows **my actual position**, written by me in advance for about 12 likely motions (see `ASSETS_NEEDED.md`).
3. For a motion I haven't written up, it says: *"Musa hasn't ruled on this one yet. Ask him."* That message links to contact.

Requirements:
- A server route with streaming responses.
- A system prompt grounded only in `site.ts`, my positions file and the motion. It never makes claims about me beyond those.
- Rate limiting per IP, a max-token cap, and a monthly budget guard.
- A graceful fallback when the AI is off.

### 5.6 "You, measured": the visitor is the lead

The whole site behaves like a campaign, and the visitor is the lead.

A small HUD in the corner (machine layer) tracks **this visit only, in the browser**: entry source (referrer or UTM), time on site, sections read, stats opened, lens use.

Near the end, a section turns that session into a mini report in the style of a Looker Studio dashboard, with a lead score and a recommendation. For example: *"Lead score 82: high intent. The next step in my playbook is a conversation."* It then leads into contact.
- Never promise a response time here. My reply time lives in one place (`site.replyTime`) and appears only where 5.9 and 5.11 put it.

**Privacy is non-negotiable.**
- Everything is computed client-side and is never stored or sent anywhere.
- The page says so in plain words.
- A "Forget this visit" button clears it.

This section is the strongest single proof of the pitch. Make it beautiful.

### 5.7 Account-based personalisation

A link like `?for=<slug>` loads an entry from a config file:
- the company's name
- an accent colour
- a one-line intro I wrote for them
- which case study to lead with

I'll send these links to target companies. An unknown slug falls back to the default site. Don't scrape logos; I'll supply anything that's needed.

### 5.8 Ask the machine, hand off to the human

A small Q&A for recruiters, for questions like "Has he managed a $30K/month budget?"
- Answers come only from site data, and each one cites the section it came from.
- For anything outside the data, it replies *"That one needs the human"* and offers a booking link.
- Build it behind a feature flag. You may merge it into Debate if that makes a cleaner product.

### 5.9 Contact: speed to lead

The contact section shows a live Melbourne clock and my reply time from `site.replyTime`: *"I aim to respond within two business days."* Include a prefilled email link and a meeting link.
- I've confirmed this reply time, so publish it as written.
- Business days are Monday to Friday, in Melbourne time.

**Merged with the references:** contact becomes **the brief**, a letter you write to me. A thermal **lead receipt** prints beside the form and fills in live:
- lead number
- this visit's source
- the intent they picked
- their score
- a reply-by date two business days on, from `site.replyTime`

It ends with "Keep this half". See `docs/CREATIVE-DIRECTION.md`, item 5.

### 5.11 The room: chrome on every page

These persist across page changes (Astro view transitions with `transition:persist`):
- **Telemetry strip** across the top, in mono: Melbourne time with seconds, FPS, LCP measured live, people in the room, mode, and my reply time. Every value is live or one I've approved. If a value can't be measured, show `—`.
- **Presence.** Live cursors are **off by default**. A visitor turns them on from the telemetry strip or ⌘K, and the choice lasts for the session. Once on, other visitors' cursors carry a lead tier (Cold, Warm or Hot) from their own engagement on this visit.
  - The anonymous room count shows either way.
  - It uses a hosted realtime service (Supabase Realtime, Liveblocks or PartyKit), since Vercel functions can't hold WebSockets.
  - Share no identity, source or location. Show at most 12 cursors, and never show them on phones.
- **Header:** an "M" monogram plus the section label, which steps when the page changes. Also the pill navigation (top centre on desktop, bottom centre on phones), ⌘K, a bell for the results log, and the Human/Machine switch.
- **Availability card,** top right, with my line from `site.availability`: "Based in Melbourne. Open to conversations about marketing, growth and business development opportunities."
  - Under it: **Download CV (PDF)**, a direct download with no email form, plus a separate **Get in touch** link.
  - No scarcity claims.
- **⌘K command menu:** pages, Ask the machine, Debate me, Machine mode, Measure me, Plain version, Download CV and the presence toggle.
- **Results log** behind the bell: dated, real entries only.

### 5.12 Work index, case sheets and selected growth work

- **Work index:** "WORK (3)" with filter chips by discipline, each showing its count. Tiles sit in a checkerboard, half photo and half paper, with the outcome as the caption.
- **Case sheets:** a case opens as a sheet over the index, with a counter and Close. The headline is the outcome sentence, followed by a Channels / Stack / How it was measured table, then the two readings (5.3).
- **Photos** arrive as coarse pixels and snap into focus in stepped blocks (the machine renders the human). In Machine mode they stay dithered.
- **Selected growth work:** the six projects in `growthWork` in `site.ts`, each showing what I did, the reported result and its note. Shown on a rotary wheel on desktop and as a list on phones.
  - Call them growth projects or selected results, never "experiments" or "tests". My resumes don't carry enough detail to describe them as independently measured.
  - Keep every overlap and team-outcome note visible next to its numbers.

### 5.13 Small delights

- A console message for developers who open DevTools.
- A 404 page: "This lead went cold." with a reactivation button.
- When the tab loses focus, the tab title changes to "Your lead score is dropping."
- A reduced-motion version that still looks deliberate and complete, not stripped back.

## 6. Visual language

**Avoid entirely:** neon cyberpunk, glitch effects, Matrix rain, cartoon robots, a hard down-the-middle half-face split, purple-to-blue gradients, glassmorphism, generic particle backgrounds, typing-terminal heroes, stock "AI brain" imagery. The one robot on the site is the photoreal, aligned one revealed by the lens (section 4).

**Typefaces (decided; all free under the OFL):**
- **Instrument Serif:** my voice, used for headlines, the giant name and the lines in the turn
- **Geist:** interface and body copy
- **Geist Mono:** every number, label and readout, with tabular numerals

**Human layer (the default theme):**
- warm paper `#EFE9DE` with real grain
- ink `#15130F`
- my handwriting as SVGs
- my photos with a consistent film treatment
- my name set edge to edge in the serif at the bottom of the hero and the top of the footer

**Machine layer (the M theme):**
- ink background `#121110` with paper text
- 1px hairline grids
- engineering-drawing annotation: leader lines, dimension marks, coordinates
- dithered photos
- the flip between themes is stepped (four frames), not faded

**One signal colour** shared by both worlds, for example a vermilion or sodium orange. Use it only for the Seam, the lens edge and live data.

**Motion identity:** human things move with ease and weight (ink drawing on, paper settling). Machine things move in discrete steps (snap, tick, scan). The contrast between eased and stepped motion *is* the brand.

**Sound:** off by default. Optional quiet UI ticks, plus my voice clips where I've supplied them.

## 7. Generated media rules (Higgsfield and any image model)

**Allowed:**
- the aligned robot render of my portrait (4.1) and the turn (4.4b), both generated from my real photo
- subtle motion on my *real* photos (4.4)
- abstract textures for the machine layer
- background plates

**Not allowed:** fabricated events, crowds, people, or photos of me doing things I didn't do.

**Event photo slots** (ticket stubs, any image trail) stay unpublished until I supply original photos. The footer uses my authentic portrait.

Compress everything, always provide poster frames, and lazy-load anything below the fold.

## 8. Tech

- **Framework:** keep Astro, since it's fast and the tests already exist. Add React islands only where interaction needs them. Add the `@astrojs/vercel` adapter for server routes.
- **Page changes:** use Astro's `ClientRouter` (view transitions), with `transition:persist` on the telemetry strip, the header and the presence layer.
- **Presence:** a hosted realtime service with a free tier. It must be optional, so the site works fully without it.
- **Analytics:** one privacy-friendly analytics tool and no ad pixels, to keep the privacy promise.
- **Motion:** GSAP with ScrollTrigger, and Lenis for smooth scroll (disabled under reduced motion). Use OGL or three.js for the WebGL lens and point fields; lazy-load it and enable it on desktop by default.
- **AI:** call the Anthropic API from server routes. Use `claude-sonnet-5-5` for Debate and `claude-haiku-5-5` for Q&A. I'll add the API key to Vercel environment variables myself. Never commit keys.
- **Analytics:** Vercel Analytics plus custom events: lens opened, machine mode on, stat opened, debate started, `?for=` visit, contact clicked. Later I want a private `/lab` page showing how the site itself performs.
- **Budgets:**
  - LCP under 2.0s on a mid-range phone
  - CLS under 0.05
  - first-load JS under 200KB gzipped, with WebGL lazy-loaded
  - Lighthouse 90+ for performance and 100 for accessibility
- **Accessibility and resilience:**
  - All content is reachable without WebGL or JS.
  - `prefers-reduced-motion` is respected.
  - Full keyboard and screen-reader flows work.
  - Extend the existing Playwright and axe suite to cover every new feature.
- **"Plain version" link** in the header: a 30-second recruiter view plus a PDF CV, for people in a hurry.

## 9. Copy and voice

- Write like I speak: plain, confident, specific numbers, short sentences.
- Never use "passionate", "leverage", "unlock", "synergy", "results-driven" or "cutting-edge".
- Run the `humanizer` skill over all copy.
- Drop "Specialist" from the headline title. Propose three positioning lines in the half-human, half-machine spirit, and let me choose.
- Every claim stays exactly as accurate as it is in `site.ts`.

## 10. Process

Work on a branch named `redesign/the-seam`. Deploy only to Vercel **preview** until I approve production.

- **Phase 0, direction.** Read the repo, `site.ts` and the tests. Then build three single-screen prototypes in `/prototypes`, each a different art direction of the hero (portrait, lens, name, type, colour). Wait for my pick.
- **Phase 1, foundation.** Design tokens, the Seam, the Lens, the hero with the portrait, and machine-mode toggle.
- **Phase 2, story.** The Door scroll scene, the pinstripes-to-data transition, the three case studies with their interactive pieces.
- **Phase 3, AI.** Debate me and Ask the machine, behind feature flags, with cost guards.
- **Phase 4, conversion.** You, measured; `?for=` personalisation; contact; the small delights.
- **Phase 5, polish.** Performance, accessibility, cross-device QA (screenshots at the breakpoints the repo already uses in `docs/evidence`), then a preview deploy.

**After each phase:** send screenshots, a list of what's done, what's still a placeholder, and what you need from me. Commit at the end of each phase.

## 11. Skills and connectors to use

**Load these when relevant:**
- `frontend-design` (already in `.claude/skills`)
- GSAP: `gsap-skills:gsap-core`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-performance`
- Motion: `scroll-animations`, `entrance-animations`, `hover-interactions`, `universal-patterns`
- Review and copy: `web-design-guidelines`, `design:accessibility-review`, `design:ux-copy`, `humanizer`
- Charts: `dataviz` for every chart
- Deploy: `vercel:deploy`
- Three.js (installed in `.claude/skills`, reviewed, MIT, target three.js r186): `threejs-fundamentals`, `threejs-shaders`, `threejs-textures`, `threejs-geometry` (point fields), `threejs-performance`. If you use three.js instead of OGL, pin `three@0.186` so the skills match.
- If installed: `parallax-threejs` for shader debugging

**Connectors:**
- Higgsfield for 4.4 and section 7.
- Canva is optional, only for social share cards and the OG image.

## 12. Definition of done

- [ ] Within 10 seconds on the hero, a stranger can explain the concept back to you.
- [ ] There are at least three moments a visitor would screen-record and send to someone.
- [ ] Every number is accurate and traceable to `site.ts`.
- [ ] The phone experience is fully native: touch lens, scroll-driven transitions, no hover-only content.
- [ ] The reduced-motion and no-JS versions are complete and look deliberate.
- [ ] Performance and accessibility budgets are met, and the test suite passes.
- [ ] No placeholder ships without a label, and no AI feature can run up an uncapped bill.

## 13. Assets I'll provide (also list them in `ASSETS_NEEDED.md`)

- [x] Studio portrait (`src/assets/portrait/musa-portrait.jpg`)
- [ ] Handwriting scans on white paper, in black pen:
  - my name in Bangla and in English
  - my signature
  - 10 to 15 short margin notes
- [ ] More real photos, with permission: MC'ing on stage, I Heart Uni events, Lil Project gigs, Evitech sales days or the NSW hub, debating (if any exist)
- [ ] Voice: a 20 to 40 second intro in my MC voice, plus three or four short clips
- [ ] My one-paragraph positions on about 12 marketing motions
- [ ] Three to five target companies for `?for=` links, each with a one-line intro
- [ ] Testimonials, with permission, if available
- [ ] Anthropic API key, which I'll add to Vercel myself
- [ ] My final choice of positioning line
- [x] The availability line (`site.availability`), with the CV as a direct download and no email form
- [x] Reply time confirmed: "I aim to respond within two business days" (`site.replyTime`)
- [x] Selected growth work: six projects from my resumes (`growthWork` in `site.ts`)
- [ ] My CV as a PDF, for the direct download
- [ ] Original event photos for the ticket stubs (I Heart Uni in five cities, The Lil Project, University of Melbourne ambassador events)
