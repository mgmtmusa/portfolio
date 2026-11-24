# Studio review round 1: chief marketing officer

Reviewed cold from `docs/evidence/round-3/capture/` (every page, 1440 / 1024 / 390 / 375), the built `dist/` HTML (visible text, meta, OG, JSON-LD), `dist/llms.txt`, `dist/og/*.png`, the CV PDF and the preview at http://127.0.0.1:4322/. Facts checked against `src/data/site.ts` and `src/data/notes.ts`. No source files edited.

- **Verdict:** CHANGES REQUIRED. Conversion scores 3. Fixes 1 to 3 below bring it to 4 on the preview. The placeholder CV PDF blocks go-live, not this round.

## Cold read

**After 5 seconds, what does he do and for whom?**
Desktop: a Marketing & Growth Specialist in Melbourne who came up through sales and judges marketing by what closes. The proof column (28% / 65%, $2M+, 13,200) is on screen with the face and the name. Phone (390): the line, the face, the name and the two actions. The proof is on screen two, which the surface brief allows.

**After 90 seconds, which three things do you remember?**
1. 28% lower CPA and 65% more qualified leads on roughly $15K to $30K a month, two results from the same initiative.
2. $2M+ in B2B contracts he closed himself.
3. Door-to-door sales to marketing, in four roles at one company.
The 18 sold-out events come fourth. They only land if the visitor gets as far as the Work teasers. That's acceptable, because the I Heart Uni share card carries the 18 with its note.

**Is there one claim you don't believe?**
I believe every figure, because every one carries its scope. The one I'd probe in the first interview is the 65%. It has no period and no baseline (story.md, open question 1), and the Before/After bars on `/work/` look like a measured baseline when they are drawn from the percentages. Only Musa can fix the period. The caption in fix 5 makes the chart honest in the meantime.

**Would you take the meeting? What would make it an instant yes?**
Yes, for a performance or growth marketing lead. Two things would make it an instant yes. First, a real CV behind "Download CV (PDF)": today the PDF says "CV coming soon". Second, the period for the Evitech pair.

## Scorecard

| Area | Score | Why |
|---|---|---|
| Positioning | 5 | The line holds and is specific to him. "What closes" turns each proof figure into evidence. |
| Proof | 4 | Commercial outcomes come first and every figure is scoped. Two gaps: the I Heart Uni case sheet never shows its growth figure (fix 2), and in the ledger the overlap note only reaches the 18 (fix 6). |
| Story | 4 | Hero, path, rules, work, next step build the case in order. The repeated "Two results from the same initiative" is the price of honesty, so it stays. |
| Voice | 4 | One plain first-person voice. The builder labels "Question", "Responsibilities", "Execution" and "Evidence" read like a template (fix 5). |
| Conversion | **3** | Each case sheet ends on "happy to walk through it in an interview" with no link to the brief. The contact page never states work rights, and recruiters ask about work rights first. The CV PDF is a "coming soon" page. |
| "Imagine what he'd do for us" | 4 | The share cards, analytics events (case_open, contact_start, contact_send, cv_download, linkedin_click, email_copy), llms.txt and robots for AI crawlers are craft a CMO will notice. Two weaknesses: JSON-LD is thin and on home only, and llms.txt places one scope note ambiguously (fix 7). |

Banned words, em dashes, exclamation marks, rhetorical questions, phone numbers and addresses: none found in the visible text, meta or llms.txt of any built page.

## Fixes, ordered by impact

### 1. Case sheets end without a next step (conversion)
`src/components/CaseSheet.astro`, inside the last section after the evidence text and link. Add a text link to the brief, followed by the reply time verbatim:

```astro
<p class="sec-p"><a class="textlink" href="/contact/" data-track="contact_click" data-from="case" data-slug={c.slug}>Get in touch</a></p>
<p class="sec-p">{site.replyTime.text}</p>
```

Rendered: **Get in touch** / "I aim to respond within two business days." Keep it a text link, because the white pill belongs to the hero. Do not add a CV link here: case pages stay at 1 or 2 CV links (F14).

### 2. I Heart Uni sheet refers to a chart it doesn't show (proof)
On `/work/i-heart-uni/` the evidence reads "The chart shows the start and current figures from my time running the brand." The only chart sits on the inert `/work/` index under the sheet. As a result, the case titled "A student brand grown city by city" never shows 400 → 13,200.
Fix in `src/components/CaseSheet.astro`: in the Results section for `i-heart-uni`, render `<CaseChart slug="i-heart-uni" />` with the same `notes.audience` footnote and `data-fact` markup used on the `/work/` card. Copy stays as it is.
Fallback if the chart can't move: set `cases[1].evidence.text` in `site.ts` to `Event photos and account analytics aren’t published here.` This is worse, because the growth figure then disappears from its own case.

### 3. Contact page never states availability or work rights (conversion)
`src/pages/contact.astro`, directly under the intro "Tell me about the role or project, and your email app will open with the brief ready to send." Add two lines in `--text-2`, verbatim:

> Based in Melbourne. Open to conversations about marketing, growth and business development opportunities.
> Full work rights until January 2028 (subclass 485 visa), open to employer sponsorship.

On phones the strip shows only the clock, so a recruiter on `/contact/` currently never sees the visa line. It's the first thing they screen for.

### 4. I Heart Uni metadata (open question 1, ruling below)
`src/lib/meta.ts`, `'/work/i-heart-uni/'`:
- `description` (and so `og:description` and `twitter:description`):
  `${n} hosted 18 sold-out events as I Heart Uni’s lead MC across five cities. These outcomes overlap with the organic audience growth work.` (152 characters, note verbatim)
- `ogAlt`: `I Heart Uni: 18 sold-out events hosted as lead MC. These outcomes overlap with the organic audience growth work. Portrait of Musa Abdullah Walid.`
- `ogTitle`: leave it as built (`I Heart Uni: sold-out events hosted as lead MC, across five cities`). A title can't carry the note. The image already shows 18 with the note.

### 5. Builder labels (open question 3, ruling below)
`src/components/CaseSheet.astro`:
- line 99 `Question` → `What it had to do`
- line 104 `Responsibilities` → `What I owned`
- line 125 `Execution` → `Day to day`
- line 132 `Evidence` → `What I can show`

`src/components/CaseChart.astro`, Evitech chart: add this sentence to its figcaption, after the spend line: `Bars are drawn to scale from the two percentages.` It contains no new numbers, so the facts gate is unaffected.

### 6. Ledger notes must cover the whole row (proof)
`src/components/Ledger.astro`. In the "Event marketing and brand development" row, the overlap note is a footnote on the 18 only, so the 70% and 280 → 650 read as clean personal results. Render each row's `note` as a visible line under its results, the way `CaseSheet` already does with `.res-note`:
- Event marketing row: `These outcomes overlap with the organic audience growth work.`
- Paid acquisition row: `Two results from the same initiative.`
- B2B sales row: `The company growth figure reflects a broader team outcome.`
Keep the existing footnotes.

### 7. llms.txt: put the Evitech note beside the pair it qualifies
`src/lib/meta.ts`, `llmsText`. Today "Two results from the same initiative." trails after four results, so an assistant can attach it to 80% and 2.6×. The Evitech line should read:

`- [Evitech: Paid media rebuilt around lead quality](…/work/evitech/): I restructured Evitech’s Meta and Google Ads accounts, built the reporting that sales and management use, and tightened the path from lead to sales call. Results: 28% lower cost per acquisition and 65% more qualified leads (two results from the same initiative); 80% pipeline growth, quarter on quarter (Company pipeline); 2.6× revenue growth in under three years (Company revenue).`

In the Facts list, add after `- Contact:` the line `- Brief form: ${url('/contact/')}`.

### 8. JSON-LD (search and AI visibility)
`src/lib/meta.ts`, `profilePage`:
- Add to `Person`:
  - `"url": origin`
  - `"description": site.description`
  - `"email": "mailto:" + site.email`
  - `"knowsAbout": ["Performance marketing", "Paid media", "Google Ads", "Meta Ads Manager", "GA4", "Looker Studio", "HubSpot", "CRM and automation", "Event marketing"]` (every term appears in `site.ts`)
- Give `ProfilePage` a `url` and a `name` (`${n}, ${site.role}`).

Lower priority: a `CreativeWork` with `author` → Person on each case page.

### 9. Small copy corrections
- `src/lib/meta.ts` `'/work/the-lil-project/'` description: `whose gigs build schools in Zambia` → `whose gigs fund school buildings in Zambia`. The gigs fund the buildings; they don't build them.
- `src/lib/meta.ts` `'/work/evitech/'` `ogAlt`: `Evitech: 28% lower cost per acquisition and 65% more qualified leads, two results from the same initiative. Portrait of Musa Abdullah Walid.` The current alt says "two results" but names only one.

### Go-live blockers (Musa's assets, not this round)
- `public/cv/Musa-Walid-CV.pdf` is a one-page "CV coming soon". Don't go live while "Download CV (PDF)" opens it.
- The About note still shows "Draft for Musa’s approval".
- Period and baseline for 28%, 65% and 70% (story.md, open question 1).

## Rulings on the open questions

**1. I Heart Uni "18" in metadata: dropping it is partly rejected.** Restore the 18 in `description`, `og:description` and `og:image:alt`, carrying the note verbatim (exact copy in fix 4). The 152-character description fits a search snippet with the full note. `og:title` stays without the 18: a title can't carry the note, and the share image already shows the 18 with it. story.md §6 is amended to the fix 4 description.

**2. Ledger and case copy: approved, on the condition that fix 6 lands.**
- 2.6× stays out of the ledger, as `notes.closed` promises ("appears only in the Evitech case").
- The interstate expansion row (4 months) stays without a note. Its own text, "Helped establish…", already sets the scope, and a note would have to be invented.
- Channels and "Measured by" stay out: `site.ts` has no such data.
- Tools appear on Evitech only, because only Evitech has a tools list.
- `/work/` keeps H1 "Work", story.md §3's Work line as the intro, and ledger H2 "Growth projects".

**3. Builder-written labels:**
- Approved: Before / After (with the caption in fix 5), Results, Brief, Decisions, Role, Where, Previous case / Next case, "Filter cases by capability", "2 of 3 cases".
- Rewritten: Question → **What it had to do**, Responsibilities → **What I owned**, Execution → **Day to day**, Evidence → **What I can show**. Each new label fits all three cases' copy.

**6. `/for/example-company/` with 3 CV links: approved.** A `/for/<key>/` page is the home page tailored to one company: hero action row, next step and footer. It should match home. `tests/e2e/nav.spec.ts` already expects `[3, 3]`. Amend F14 in `docs/plans/v3.md` from "home 3 (…), others 1 or 2" to "home and `/for/<key>/` 3 (hero, next step, footer), others 1 or 2".
