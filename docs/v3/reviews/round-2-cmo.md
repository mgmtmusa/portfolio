# Studio review round 2: chief marketing officer

Reviewed cold from `docs/evidence/round-4/capture/` (every page, 1440 / 1024 / 390 / 375), a snapshot of the built `dist/` taken at 09:20 (visible text, meta, OG, JSON-LD, `llms.txt`, `robots.txt`, `sitemap.xml`, `og/*.png`) and the live preview at http://127.0.0.1:4322/ at 375 and desktop. Facts checked against `src/data/site.ts`. The facts gate (`node scripts/qa/facts.mjs --dir <snapshot>`) passes. No source files edited, no build and no Playwright run.

- **Verdict:** APPROVED. Every line scores 4 or above. One round 1 fix landed in a different place from the one specified (contact facts, fix 1 below). It should move before go-live, but it doesn't fail a line. The placeholder CV PDF still blocks go-live and is with Musa.

## Round 1 fixes and rulings: what landed

| # | Round 1 item | Status | Evidence |
|---|---|---|---|
| 1 | Case sheet ask and reply time | Landed exactly | All three sheets end on the text link **Get in touch** (`data-track="contact_click" data-from="case" data-slug=…`), then "I aim to respond within two business days." No extra CV link. |
| 2 | I Heart Uni chart in its own sheet | Landed exactly | Results section of `/work/i-heart-uni/` renders the Start 400 / Current 13,200 chart with the audience footnote. "The chart shows…" is now true. The note groups 18 and 70% (`data-fact="18|70%"`). |
| 3 | Contact availability and work rights | Landed in substance, not in position | Both sentences are verbatim and visible at 375, 390, 1024 and 1440. They render below the form and the **Email the brief** button, not under the intro. At 375 the work rights line sits at y 1688 of a 2382px page, under the button (y 1411). See fix 1. |
| 4 | I Heart Uni metadata, 18 restored with its note | Landed exactly | `description`, `og:description`, `twitter:description` and `og:image:alt` match round 1 word for word. `og:title` has no 18, as ruled. The share image shows 18 with the note. |
| 5 | Four label renames and the chart caption | Landed exactly | What it had to do, What I owned, Day to day, What I can show. Evitech caption ends "Bars are drawn to scale from the two percentages." |
| 6 | Visible ledger notes | Landed exactly | `.row-note` lines visible at 375 under Paid acquisition, Event marketing and B2B sales. Footnotes kept. |
| 7 | llms.txt | Landed exactly | Evitech pair carries "(two results from the same initiative)"; each company figure carries its scope; "Brief form:" line added. |
| 8 | JSON-LD | Landed | `Person` has url, description, email and the nine `knowsAbout` terms; `ProfilePage` has url and name. The optional `CreativeWork` on case pages isn't there (fix 4). |
| 9 | Small copy corrections | Landed exactly | The Lil Project description says "fund school buildings"; Evitech `ogAlt` names both results. |
| F14 | Amendment | Landed exactly | `docs/plans/v3.md` F14 reads "home and `/for/<key>/` 3 (hero, next step, footer), others 1 or 2". |
| story.md §6 | Amended to the fix 4 description | Not done | The I Heart Uni and The Lil Project rows still show the old copy. See fix 2. |

Hygiene across every built page, meta, alt text, JSON-LD and `llms.txt`: no em or en dashes, no exclamation marks, no question marks, no banned words ("social-impact" on The Lil Project is an adjective, not "impact" as a verb), no phone number, no address. `site.availability`, `site.workRights` and `site.replyTime.text` appear verbatim wherever they appear. The reply-by date is correct: today, Wednesday 25 November 2026, the panel reads "Aim to reply by Friday 27 November".

## Cold read

**After 5 seconds, what does he do and for whom?**
Desktop (1440): Marketing & Growth Specialist in Melbourne, who came up through sales and judges marketing by what closes. Face, line, two actions and the three proof figures (28% / 65%, $2M+, 13,200) are all on the first screen. Phone (375): the line, the face, the name and both actions on screen one; proof on screen two.

**After 90 seconds, which three things do you remember?**
1. 28% lower CPA and 65% more qualified leads on roughly $15K to $30K a month, two results from the same initiative.
2. More than $2M in B2B contracts he closed himself.
3. Door-to-door sales to marketing in four roles at one company.
The 18 sold-out events come close behind. They now hold up when I click through, because the I Heart Uni sheet finally shows the audience chart beside them.

**Is there one claim you don't believe?**
No. Every figure carries its scope, including in the ledger and the share cards. I'd still ask about the period and baseline behind the 65% in an interview. Only Musa can answer that, and the chart caption keeps the bars honest until he does.

**Would you take the meeting? What would make it an instant yes?**
Yes. A real CV behind "Download CV (PDF)" would make it an instant yes. Today the PDF is the 954-byte placeholder.

## Scorecard

| Area | Score | Why |
|---|---|---|
| Positioning | 5 | The line holds on every page and in every share card. "What closes" still turns each figure into evidence. |
| Proof | 5 | Commercial outcomes lead. Both round 1 gaps are closed: the I Heart Uni sheet shows its growth figure, and every ledger row now shows its note. The facts gate passes. |
| Story | 4 | The order still builds the case. Two small drags remain: the About note shows "Draft for Musa’s approval" (labelled, so allowed, but it reads unfinished), and "Two results from the same initiative" repeats, which is the price of honesty. |
| Voice | 5 | One plain first-person voice. The new labels read like a person explaining his work rather than a template. |
| Conversion | 4 | Every case sheet now ends on a next step with the reply time. Work rights appear on home, About, CV, contact and in `llms.txt`. On a phone, though, the contact page shows work rights only after the full form (fix 1). The CV PDF is the go-live blocker. |
| "Imagine what he'd do for us" | 5 | Scoped share cards, a richer Person schema, an `llms.txt` an assistant can't misquote, robots open to AI crawlers, and a `contact_click` event tagged with source and case slug. A CMO would notice this craft. |

## Remaining fixes, ordered by impact

### 1. Contact: move availability and work rights under the intro (conversion)
`src/pages/contact.astro`. Move the two `.ct-facts` paragraphs out of the default slot and into the `head` slot, directly after `.ct-intro`. Copy unchanged:

```astro
<Fragment slot="head">
  <h1 class="ct-h">The brief</h1>
  <p class="ct-intro">Tell me about the role or project, and your email app will open with the brief ready to send.</p>
  <p class="ct-facts">{site.availability}</p>
  <p class="ct-facts">{site.workRights}</p>
</Fragment>
```

Style: give the first fact `margin-top: 20px` (for example `.ct-intro + .ct-facts { margin-top: 20px; }`) and keep the 8px between the two. `Or email me directly…` and the three actions stay where they are. A recruiter on a phone screens for visa status before filling anything in. Today they have to scroll past the button to find it.

### 2. story.md §6 must match what ships (copy source of truth)
`docs/v3/story.md`, section 6 table:
- I Heart Uni description: `Musa Abdullah Walid hosted 18 sold-out events as I Heart Uni’s lead MC across five cities. These outcomes overlap with the organic audience growth work.`
- The Lil Project description: `Musa Abdullah Walid led event production and marketing for The Lil Project, whose gigs fund school buildings in Zambia. 768 children reached (organisation total).`

### 3. 404: drop the canonical on the noindex page (search hygiene, low)
`src/layouts/Base.astro` line 44 (and `og:url` on line 52): don't emit `<link rel="canonical">` when `noindex` is set. Today `404.html` sets `noindex` and also points its canonical at `/404/`, a URL that doesn't exist. `/for/*` keeps its canonical to `/`.

### 4. Optional, carried from round 1: case-page JSON-LD
`src/lib/meta.ts`: a `CreativeWork` on each `/work/<slug>/` with `name` (the case title), `url`, `description` (the page description, so the note travels with it) and `author` pointing to the home `Person` by `url`. Not required for approval.

### 5. Optional: one wording for recognition
About uses the story.md §7 wording ("among 28 nations", "with 60 nations attending"). `/cv/` and `llms.txt` use the raw `site.ts` strings ("28 nations", "60 nations"). Both are accurate. If Musa wants one version, update `recognition[].d` in `src/data/site.ts` to the story.md §7 wording and remove `creditWording` from `src/pages/about.astro`.

Ruled and closed, no change: in the ledger, the B2B row keeps "The company growth figure reflects a broader team outcome." even though 2.6× stays in the Evitech case. The note qualifies the row's own text ("contributed to the company’s revenue growth"), and `site.ts` says the note travels with the item.

## Go-live blockers (Musa, not this round)
- `public/cv/Musa-Walid-CV.pdf` is the 954-byte placeholder. Don't go live while "Download CV (PDF)" opens it. It's linked from every page.
- The About note still shows "Draft for Musa’s approval" (story.md open question 3).
- Period and baseline for 28%, 65% and 70% (story.md open question 1).
- `/for/example-company/` carries placeholder intro copy. It is `noindex`, but replace it, or don't share the link, before using it with a real company.
