# Creative direction: The Seam, merged with the references

This merges everything you've asked for in this project (the Seam, the lens and robot, the turn, the master prompt's features) with what works on two sites you like. I studied both live on 23 November 2026:
- **carterogunsola.com:** your favourite, so it carries more weight.
- **unanim.studio.**

Where this file and `MASTER-PROMPT-the-seam.md` disagree, this file wins.

---

## The idea in one line

**The Room.**

You read rooms for a living: O-Week crowds of 1,000, a debate floor with 28 nations, doorsteps, sales floors. So the site is a room:
- The human reads it. The machine measures it.
- Every visitor walks in and is seen live. They're measured too, but privately, in their own browser.
- They leave with a reason to call.

The thesis line stays: **"I sell like a human. I measure like a machine."**

---

## 1. What each reference does best

### Carter Ogunsola (your favourite)

What's on the site:
- **A telemetry strip on every page:** local time, frame rate, people online, page load speed (LCP), whether presence is on, and the next quarter he can take bookings.
- **Live presence:**
  - Other visitors' cursors move around the page, each labelled with a generated nickname.
  - Toasts in the corner report people joining and leaving, with a live count.
  - You can switch presence off.
- **Physical objects as the interface:**
  - a three.js ID badge on a lanyard that you can drag and swing
  - a postage-stamp portrait, postmarked with his move from Lagos to Utah
  - a short signed letter that opens with the line "you pulled my file"
  - a contact form written as a letter, with an intake receipt clipped on that fills in as you type
- **The home page is a 3D carousel.** Project tiles float through space as you scroll, while a large centred title rolls letter by letter beside a numbered counter.
- **A lab of small experiments** on a rotary wheel, with list and grid alternatives.
- **A ⌘K command menu** that holds pages and tools, and a "What's new" changelog behind a bell icon.
- The logo's label changes with the page, and there are light and dark themes.
- **Stack:** Astro with view transitions, Lenis smooth scrolling, three.js and a WebGL paper texture. That's the same framework your portfolio already uses.

**Why it works:** the site feels inhabited and is open about itself. It shows its own performance, who's there right now and what changed recently. A creative developer proves his craft by showing the machine running.

### Unanim

What's on the site:
- **The name, edge to edge:** a black hero with the studio name set across the full width at the bottom of the screen, repeated at the top of the footer.
- **A live clock** with seconds and the city name.
- **Sales built into the page:**
  - A booking card follows you down the page, saying how many call slots are left this month.
  - A pitch deck is "ask for download", which captures a lead.
- **Navigation:** one floating pill at the bottom centre opens into the menu.
- **Work** sits in a strict checkerboard: half image, half plain panel with a two-line caption.
- **Images resolve from coarse pixels** into the photo.
- **Case studies** open as a sheet over the work index, with a counter and a Close button. Each starts with a year, one sentence saying what was done, and a services and technology table.
- **The work index** shows a giant title with the count in brackets, filter chips with counts, a grid/list toggle and an awards count.
- **The footer** leaves a trail of images under the cursor.
- **The copy** is short and declarative, and ties creativity, technology and AI to business results.

**Why it works:** the confidence comes from restraint, and it sells the whole way down: scarcity, a gated deck, and a booking link everywhere.

---

## 2. What I'm taking, and what it becomes on your site

| # | Move | From | On your site |
|---|---|---|---|
| 1 | Telemetry strip | Carter | Your machine layer, always visible: `MEL 14:09:07 · FPS 60 · LCP 0.9s · IN THE ROOM 4 · MODE HUMAN · REPLY ≤ 2 BUSINESS DAYS`. Every value is live or a commitment you've approved. |
| 2 | Live presence | Carter | **The room.** Live cursors are **off by default**. A visitor can turn them on from the telemetry strip or ⌘K. Once on, other visitors' cursors carry a lead label instead of a nickname (Cold, Warm or Hot) based on how engaged they've been this visit, using the You, measured score. The anonymous room count stays visible either way. |
| 3 | Light and dark themes | Carter | **Human/Machine is the theme.** Human is paper and Machine is ink. Pressing M flips the whole site in stepped frames, not a fade. One toggle, two meanings. |
| 4 | Physical objects | Carter | Objects from *your* career, not his: the portrait with its robot, a signed letter, a lead receipt, event ticket stubs and a debate motion card. The ticket stubs appear only once real event photos exist (see section 6). |
| 5 | The contact letter and receipt | Carter + your speed-to-lead idea | **The brief.** The visitor writes to you, and a thermal "lead receipt" prints beside the form as they type. It shows a lead number, the source of this visit, the intent they picked and their score. Its reply-by date is two business days on from now, Monday to Friday in Melbourne. It ends with "Keep this half." |
| 6 | The letter | Carter | Your About page is a short letter in your voice, signed with your scanned Bangla and English signature. |
| 7 | ⌘K command menu | Carter | Holds Ask the machine, Debate me, Machine mode, "Measure me", Plain version, Download CV and the presence toggle. |
| 8 | What's new | Carter | A **results log**: dated, real entries such as a new case study, a talk, or a shipped campaign you're allowed to name. It sits behind a bell in the header. |
| 9 | The lab wheel | Carter | **Selected growth work:** the six projects in `growthWork` in `site.ts`, each showing what you did, the reported result and its scope note. A wheel on desktop, a list on phones. They're growth projects, never "experiments" or "tests", because the resumes don't carry enough detail to call them independently measured. |
| 10 | Logo label per page | Carter | An "M" monogram plus the section name in mono, which steps (not fades) when the page changes. |
| 11 | Name set edge to edge | Unanim | "Musa Abdullah Walid" in the serif across the full width: at the bottom of the hero and again at the top of the footer. Human type at machine scale. |
| 12 | Live clock and city | Unanim | Melbourne time with seconds in the telemetry strip, reused on the contact page alongside your reply time. |
| 13 | Availability card | Unanim | Fixed at the top right with your line: *"Based in Melbourne. Open to conversations about marketing, growth and business development opportunities."* Under it: **Download CV (PDF)** as a direct download, plus a separate **Get in touch** link. No email gate and no scarcity claim. |
| 14 | Bottom pill navigation | Unanim | A thumb-reach pill at the bottom on phones. On desktop the same pill sits top centre. |
| 15 | Pixel resolve | Unanim | **The machine renders the human.** Every photo arrives as coarse pixels and snaps into focus in stepped blocks. In Machine mode, photos stay as the dithered machine reading. |
| 16 | Checkerboard work grid | Unanim | Half photo, half paper, with the outcome as the caption ("28% lower CPA · Evitech"). The lens over a tile shows its machine reading. |
| 17 | Case study as a sheet | Unanim | The case slides over the index with a counter and Close. The headline is the outcome sentence, followed by a table of Channels, Stack and How it was measured, then the two readings. |
| 18 | Giant index title with a count | Unanim | "WORK (3)" with filter chips by discipline (Paid, CRM, Events, Sales, AI), each showing its count. |
| 19 | Footer | Unanim | The giant name over your authentic portrait. An image trail of real event photos is added only once those photos exist. |
| 20 | Loader counter | Carter | Already planned, now connected: doors → conversations → contracts → $2M+, then the portrait resolves from pixels. |

---

## 3. What I'm leaving behind, and why

- **Carter's signatures:** the lanyard badge, the postage stamp, the animal nicknames, his `KEY::VALUE` label syntax and his copy. Reusing them would make yours a tribute rather than a brand. Your objects come from sales, stages and debate.
- **Carter's 3D carousel home page.** A tour of 17 projects suits a studio, but you have three deep case studies, and depth beats breadth. The index stays flat and confident, Unanim-style.
- **Carter's chromatic-aberration images and glassy tiles.** They clash with the master prompt's avoid list (glitch effects, glassmorphism) and with a head-of-marketing tone.
- **Unanim's all-black palette and sans wordmark.** Paper warmth and the serif are what make yours personal. Black appears only in Machine mode.
- **Unanim's tracking stack** (several ad pixels on the home page). It contradicts your privacy promise. Use one privacy-friendly analytics tool and no ad pixels.
- **Both sites' typefaces** (Oracle, PP Neue Montreal Mono, Saans). They need commercial licences. Equally good free ones are below.

---

## 4. The system

### Modes (the theme)

| | Human (default) | Machine (press M) |
|---|---|---|
| Background | Paper `#EFE9DE` | Ink `#121110` |
| Text | Ink `#15130F` | Paper `#EFE9DE` |
| Headlines | Instrument Serif | Geist Mono |
| Photos | Film treatment | Dithered reading, coordinates showing |
| Grid | Hidden | 1px hairlines visible |
| Signal `#FF4A1C` | The Seam, the lens edge, live data | The same |

- The flip takes four frames of about 60ms each, stepped rather than eased.
- The visitor's choice is remembered for the session.

### Type (all free under the OFL)

- **Instrument Serif:** your voice. Headlines, the giant name, the lines in the turn.
- **Geist** (new): interface and body copy. Both references run their interface on a neutral grotesque, and it reads more expensive than body text set in mono.
- **Geist Mono** (replaces JetBrains Mono so it pairs with Geist): every number, label and readout, with tabular figures.

### Motion

| | Human | Machine |
|---|---|---|
| Easing | Expo out, `cubic-bezier(.16, 1, .3, 1)` | `steps()` |
| Duration | 600 to 900ms | 60 to 120ms ticks |
| Examples | Text rising, paper settling, the turn | Readouts ticking, the theme flip, pixel resolve, the monogram label |

- **Page changes:** Astro view transitions. The telemetry strip, header and presence layer persist across pages, so the room never resets.
- **Scrolling:** Lenis smooth scroll, switched off under reduced motion.

---

## 5. The site, top to bottom

0. **Boot** (once per session, under 1.8s, skippable): a mono counter on ink runs doors → conversations → contracts → $2M+. Then the portrait resolves from pixels and the page settles onto paper.
1. **Hero:** the portrait with the lens and robot, the headline, and the Human/Machine switch. Your name runs edge to edge along the bottom, with the availability card at the top right and presence cursors drifting over the page.
2. **The turn:** the scroll-driven film. Already built.
3. **The pinstripes become the data** (master prompt 4.2).
4. **Work:** "WORK (3)" with filter chips, the checkerboard, and the case sheet with two readings. Inside the cases: the Evitech budget slider, the I Heart Uni map, and the deliberately quiet Lil Project.
5. **The Door:** the origin scroll scene.
6. **Selected growth work:** the wheel.
7. **Debate me:** the visitor writes a motion card, and Claude argues both sides before your real position is revealed.
8. **You, measured:** the visitor's own session report.
9. **The brief (contact):** the letter, the lead receipt and the honest Melbourne status line.
10. **Footer:** the giant name again over your portrait, links, the plain version and the results log.

On every page: the telemetry strip; a header with the monogram and section label, the pill navigation, ⌘K, the bell and the mode switch; the availability card; and the opt-in presence layer.

---

## 6. Honesty rules

- **Live numbers are really live.** That means the clock, the frame rate, LCP (measured in the visitor's browser) and the number of people in the room. If presence is off or the service is down, show `ROOM —`, never a made-up count.
- **You approve the words** for the availability line, your reply time and every results-log entry.
- **Lead labels come only from engagement on this visit,** computed in the visitor's browser. Other visitors see a tier and a cursor, nothing else: no source, location or identity.
- **Photos of events are real or absent.** Event photo slots (ticket stubs, any image trail) stay unpublished until original photos are supplied. Never use generated images presented as real events.
- **Results keep their scope.** Overlapping results are labelled as such, and team outcomes say so. The notes live in `growthWork` in `site.ts`.

---

## 7. Tech additions

- **Astro `ClientRouter`** (view transitions), with `transition:persist` on the telemetry strip, the header and the presence layer.
- **Presence** needs a hosted realtime service with a free tier, such as Supabase Realtime, Liveblocks or PartyKit, because Vercel functions can't hold WebSocket connections open.
  - Cursors are off by default. A visitor opts in from the telemetry strip or ⌘K, and the choice lasts for the session.
  - Throttle cursor updates to about 20 a second and show at most 12 cursors.
  - Phones never show cursors. Store no IDs.
- **⌘K menu:** one small hand-built island, inside the existing JS budget.
- **Pixel resolve:** a 2D canvas pass, no WebGL needed. A working version is in `prototypes/portrait-lens/`.

---

## 8. Decisions

**Settled (23 November 2026):**
1. **Availability:** "Based in Melbourne. Open to conversations about marketing, growth and business development opportunities." It promises no start date. The CV is a direct download with no email form, with a separate contact option.
2. **Live cursors:** off by default, with an opt-in toggle.
3. **Photos:** your authentic portrait in the footer, and real event photography for the ticket stubs. Photo slots stay unpublished until original images exist. No generated photos presented as real events.
4. **Growth work:** the six projects from your resumes, presented as selected growth work, not tests. They're in `growthWork` in `site.ts`, with their overlap and team-outcome notes.
5. **Reply time:** "I aim to respond within two business days." Confirmed. It drives the telemetry strip, the receipt's reply-by date and the contact status.

**Still open:**
1. **The CV PDF:** I don't have the file yet. It goes in `public/` once you send it.
2. **Event photos** (I Heart Uni in the five cities, The Lil Project, University of Melbourne ambassador events), once you find or supply originals.
