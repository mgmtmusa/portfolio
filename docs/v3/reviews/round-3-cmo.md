# Studio review round 3: chief marketing officer (confirmation)

Reviewed cold from `docs/evidence/round-5/capture/` (full-page, home, contact and case sheets at 1440 and 375) and a fresh snapshot of the live preview at http://127.0.0.1:4322/ (all ten pages, `llms.txt`, `robots.txt`, `sitemap.xml`, the CV PDF headers). `dist/` currently holds a server build with no static HTML, so the preview was the source for built text. Facts checked against `src/data/site.ts`. The facts gate (`node scripts/qa/facts.mjs --dir <snapshot>`) passes. Diffs read: `257b6c6`, `2e164eb`, `c6982c0`. No source files edited, no build, no Playwright run, no git writes.

- **Verdict:** APPROVED. All four round 2 fixes I required or offered landed exactly. The round 2 hero and design work changed no copy, no fact, no scope note and no step in the conversion path. Every line scores 4 or above. Go-live still waits on Musa (listed separately below).

## Round 2 fixes: what landed

| # | Round 2 item | Status | Evidence |
|---|---|---|---|
| 1 | Contact: availability and work rights under the intro | Landed exactly | `contact.astro` moves both `.ct-facts` lines into the `head` slot after `.ct-intro`, with `.ct-intro + .ct-facts { margin-top: 20px; }`. Built text order: The brief, intro, availability, work rights, then the form. In `contact-375.jpg` the work rights line sits above the first field, on screen one. Both sentences are verbatim from `site.ts`. |
| 2 | story.md §6 matches what ships | Landed exactly | The I Heart Uni and The Lil Project rows now read word for word as round 2 fix 2. Every page's built `<meta name="description">` matches its §6 row. |
| 3 | No canonical on the 404 | Landed exactly | The built 404 emits `<meta name="robots" content="noindex">` and no `rel="canonical"` or `og:url`. `/for/example-company/` keeps its canonical to `/` with `noindex`, as ruled. |
| 4 (opt.) | Case-page `CreativeWork` JSON-LD | Not done | Still optional. Only the home page carries JSON-LD (`Person`, `ProfilePage`; the address is locality only). Not required for approval. |
| 5 (opt.) | One recognition wording | Landed exactly | `recognition[].d` in `site.ts` now holds the story.md §7 wording and `creditWording` is gone from `about.astro`. About, `/cv/` and `llms.txt` all read "among 28 nations", "with 60 nations attending", "Convener for 60 schools; raised $30K AUD." |

## Round 2 hero and design changes: copy, facts and path unchanged

- `2e164eb` touches `Hero.astro`, `CaseTeasers.astro`, `Path.astro`, `bend.ts`, `hero.ts`. The only text-adjacent edit wraps "door-to-door" in `<span class="nobr">` in the Path heading. The heading still reads "From door-to-door sales to marketing, in four roles". Everything else is light pools, slab fill, z-order and the Path key light (`aria-hidden`, no text).
- `c6982c0` edits `DESIGN.md` only.
- Built home copy is identical to round 2: the line "I carried a sales target first, so I judge marketing by what closes.", the two actions (Get in touch, Download CV (PDF)), the proof figures 28% / 65% / $2M+ / 13,200, each with its note, and "Two results from the same initiative at Evitech, on paid media of roughly $15K to $30K a month."
- Scope notes all intact: "Organisation total" on 768, the team outcome note on $2M+, the overlap note on 18 sold-out events, "Two results from the same initiative" on every Evitech pairing.
- Conversion path intact: `contact_click` on home (2), the Evitech sheet (2), contact and the 404. The 404 offers Home, Work, The brief and Download CV (PDF). `site.availability`, `site.workRights` and `site.replyTime.text` are verbatim wherever they appear. The reply panel reads "Aim to reply by Friday 27 November", which is correct for Wednesday 25 November 2026.
- Hygiene across every page, meta, `llms.txt`: no em or en dashes, no banned words, no exclamation or question marks, no phone number, no street address.

## Cold read

**After 5 seconds, what does he do and for whom?**
A Marketing & Growth Specialist in Melbourne who came up through sales and judges marketing by what closes. At 1440 the face, the line, both actions and all four proof figures are on the first screen. At 375 the line, face, name and both actions come first, with proof right below.

**After 90 seconds, which three things do you remember?**
1. 28% lower CPA and 65% more qualified leads on roughly $15K to $30K a month, two results from the same initiative.
2. More than $2M in B2B contracts he closed himself.
3. Door-to-door sales to marketing in four roles at one company.

**Is there one claim you don't believe?**
No. Every figure keeps its scope. The open question is unchanged: the period and baseline behind the 65%. The copy doesn't overclaim while that's missing.

**Would you take the meeting? What would make it an instant yes?**
Yes. A real CV behind "Download CV (PDF)" would make it an instant yes. It is still the 954-byte placeholder (the preview serves `Content-Length: 954`).

## Scorecard

| Area | Score | Why |
|---|---|---|
| Positioning | 5 | Unchanged and holding on every page and share card. |
| Proof | 5 | Commercial outcomes lead, every number scoped, and the facts gate passes on the live build. |
| Story | 4 | The order still builds the case. The only drag is the visible "Draft for Musa’s approval" label on About, which is Musa's call. |
| Voice | 5 | One plain first-person voice. The recognition lines now read the same everywhere. |
| Conversion | 5 | Up from 4. A recruiter on a phone now sees availability and work rights before the first field. The next step is one action away on every page, the 404 included. The CV PDF is a go-live blocker, not a design fault. |
| "Imagine what he'd do for us" | 5 | Scoped share cards, a clean 404 with no stray canonical, `llms.txt` aligned with the page copy, and source-tagged `contact_click` events. |

## Fixes

None required this round.

Optional, carried over: a `CreativeWork` JSON-LD block on each `/work/<slug>/` (`src/lib/meta.ts`) with `name` (the case title), `url`, `description` (the page description, so the scope note travels with it) and `author` pointing to the home `Person` by `url`.

A note for the finish reviewer, not copy: in `contact-375.jpg` the fixed "Menu" pill is stitched over "The role or project" label. It looks like an artefact of the full-page capture, not a layout bug. Worth one check at 375 in a real viewport.

## Go-live blockers for Musa

What Musa must supply or decide, in the words to put to him:

1. **CV PDF (blocks go-live).** "Send your final CV as a PDF. It replaces `public/cv/Musa-Walid-CV.pdf` under the same filename. Today that file is a 954-byte placeholder, and every page links to it as Download CV (PDF). Its roles, dates and figures must match the /cv page."
2. **About note (blocks go-live).** "Read the About note and reply 'Approved as written', or send your changes. Once you approve it, the 'Draft for Musa’s approval' label comes off."
3. **Period and baseline for 28%, 65% and 70% (decision).** "Over what period, and against what baseline, did Evitech see 28% lower CPA and 65% more qualified leads, and I Heart Uni the 70%? For example: 'January to June 2023, against July to December 2022.' Or reply 'Keep unpublished' and the copy stays as it is now." The site is honest either way, so this doesn't block launch, but it's the first question a CMO will ask in the interview.
4. **`/for/` company pages (blocks sharing any /for link).** "For each company you plan to send a personal link to, give me the company name, the URL key (for example `acme`) and one line on why you'd fit them. Until then, `/for/example-company/` shows placeholder copy ('Placeholder intro for a company link…'). It is `noindex`, but either replace it or don't share it."
5. **Currency (decision).** "Are $2M+ and $15K to $30K in Australian dollars? Reply 'AUD' or name the currency." (story.md open question 2.)
6. **Production domain (decision before launch).** "Which domain will the site live on? Canonicals, share URLs, the sitemap and `llms.txt` currently point to `portfolio-omega-gold-33.vercel.app`. Name the final domain, or reply 'Keep the Vercel address'."
7. **UNESCO credit (optional).** "Should the UNESCO credit spell out ASPnet and ESD (Associated Schools Network; Education for Sustainable Development), or stay abbreviated?" (story.md open question 4.)
