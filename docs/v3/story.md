# Story v3: positioning and story

Set by the `chief-marketing-officer` in phase 2 (round 0). Every figure comes from `src/data/site.ts`. Shipped strings use the curly apostrophe (’) to match `site.ts`.

## 1. Positioning

1. **"I carried a sales target first, so I judge marketing by what closes."** ← chosen
2. "I run marketing like someone who still has to close the lead."
3. "I judge marketing the way the sales team does: by what closes."

**Why line 1.** It fits the whole idea into one sentence: where he learnt the job, and the test he applies to it. It holds on every reading: Roger David (2017 to 2018, 118% of target) came before every marketing role, and his Evitech sales roles came before his marketing role there. ("I learnt marketing on a sales target" would be contradicted by the 2020 internship.) "What closes" is the phrase a CMO repeats afterwards, and it turns the three proof figures into evidence: a cost, a qualified lead and a closed contract.

## 2. Hero copy

- **Masthead:** Musa Abdullah Walid
- **Role label** (mono): Marketing & Growth Specialist, Melbourne
- **H1:** I carried a sales target first, so I judge marketing by what closes.
- **Supporting sentence:** I run paid media, reporting and CRM at Evitech in Melbourne, a role I moved into from the company’s sales team.

| # | Figure | Label | Visible caption | Footnote (scope note) |
|---|---|---|---|---|
| 1 | **28%** and **65%**, a pair | lower cost per acquisition / more qualified leads | Two results from the same initiative at Evitech, on paid media of roughly $15K to $30K a month. | My work at Evitech: I restructured the Google Ads and Meta accounts, audiences and budget allocation. The ad accounts belong to Evitech, so they aren’t shown here. |
| 2 | **$2M+** | in B2B contracts personally closed | none | Contracts I closed myself at Evitech, total to date. The company’s revenue growth is a team outcome and appears only in the Evitech case. |
| 3 | **13,200** | social audience for I Heart Uni, grown from 400 | none | Start and current figures from my time running the brand, grown mostly through organic content and community building. |

Footnotes never repeat a figure, so each hero number appears once in the hero.

## 3. Home story order

On every page: the status strip (Melbourne time, `site.availability`, `site.replyTime`) and the dock (pages, ⌘K, Get in touch).

| Time | Section | Content | Intro (Musa’s voice) |
|---|---|---|---|
| 0 to 5 s | Hero | Name, role label, H1, supporting sentence, proof set | (the H1) |
| 5 to 30 s | The path | Four Evitech roles from `career`, each with its metric | I joined Evitech in field sales and held three roles there before moving into marketing. |
| 30 to 45 s | How I work | The three `approach` rules, compact | Each rule I work by comes back to the sales team. |
| 45 to 90 s | Work | Evitech, I Heart Uni, The Lil Project teasers, then "See all work" | Three cases, and each figure’s footnote says whose result it is. |
| 90 s | Next step | "Send me the brief." then `site.availability`, `site.workRights`, `site.replyTime` exactly. Get in touch, Download CV (PDF), LinkedIn | (the heading) |

**Work teasers on home:** Evitech 28% / 65% with "Two results from the same initiative."; I Heart Uni **18** "sold-out events hosted as lead MC, across five cities" (footnote: "These outcomes overlap with the organic audience growth work."); The Lil Project 768 "children reached to date" with an "Organisation total" label.

**The three things to remember:** the path (H1 at 0 to 5 s, path section at 5 to 30 s); the Evitech result with spend (hero proof 1, path rung 4, Evitech teaser); 18 sold-out events (I Heart Uni teaser, About note, I Heart Uni share title). Keep the approach section short so 18 lands in time.

**Figure count on home (limit two):** 28%/65% hero + Evitech teaser; $15K to $30K hero caption + rung 4; $2M+ hero + rung 2; 400/13,200 hero only; 18, 23, 768 once each; 80% and 2.6× never on home.

## 4. Copy edits to `site.ts`

1. `cases[0].decisions[0].t` → `Start with the account structure`
2. `cases[0].decisions[1].t` → `Report on qualified leads and pipeline`
3. `approach[0].d` → `I spent almost two years in sales at Evitech before moving into marketing: door to door, then B2B, then building a sales team. So I judge campaigns on qualified leads and cost per acquisition.`
4. `career[2].d` → `Helped establish the NSW hub and had it fully operational in four months. Recruited 23 sales executives and coached a team that grew to 35.`
5. `career[3].d` → `Took on paid media, reporting and CRM. Paid media runs at roughly $15K to $30K a month across Meta and Google.`
6. `site.description` → the home meta description below (the old one showed 28% and 65% without its qualifier).
7. `cases[1].card` → `{ v: '18', l: 'sold-out events hosted as lead MC' }`; never write 13.2K (one format per number).

## 5. Conversion path

- **Get in touch** (goes to the brief) · **Download CV (PDF)** · **LinkedIn** (accessible name "Musa Abdullah Walid on LinkedIn (opens in a new tab)") · dock CTA **Get in touch**.
- **Contact page:** H1 "The brief". Intro: "Tell me about the role or project, and your email app will open with the brief ready to send."

| Field | Label | Helper | Required |
|---|---|---|---|
| 1 | Who you are | Your name, role and company. | Yes |
| 2 | The role or project | A line or two is enough. A link to the job ad works too. | Yes |
| 3 | Timeline (optional) | When you’re hoping to decide or start. | No |
| 4 | How you found me (optional) | For example, LinkedIn or a referral. | No |

- Errors: "Add who you are so I know who’s writing." / "Add the role or project. A line is enough."
- Button: **Email the brief**. Under it: "Opens your email app with everything filled in. Nothing you type is stored on this site." Then `site.replyTime`.
- Mail subject: "Brief from [who you are]". Panel before typing: "Your brief appears here as you type." Last line: "Aim to reply by Thursday 27 November" (weekday, day, month; two business days on, Monday to Friday, Melbourne time).
- Alternatives: "Or email me directly at mgmtmusa@gmail.com" with Copy email (toast "Email address copied."), Download CV (PDF), LinkedIn.
- **404:** H1 "There’s no page at this address." Line "Here’s where to go instead." Links: Home · Work · The brief · Download CV (PDF).

## 6. Titles and meta descriptions

| Page | Title | Description |
|---|---|---|
| Home | Musa Abdullah Walid, Marketing & Growth Specialist | Musa Abdullah Walid is a Marketing & Growth Specialist in Melbourne. He came to marketing from sales, where he personally closed more than $2M in B2B contracts. |
| Work | Work and growth projects, Musa Abdullah Walid | Three cases and six growth projects by Musa Abdullah Walid: paid media at Evitech, a student brand in five cities and gigs that fund school buildings in Zambia. |
| Evitech | Evitech: paid media rebuilt around lead quality | Musa Abdullah Walid rebuilt Evitech’s paid media around lead quality: 28% lower CPA and 65% more qualified leads, two results from the same initiative. |
| I Heart Uni | I Heart Uni: a student brand grown city by city | Musa Abdullah Walid hosted 18 sold-out events as I Heart Uni’s lead MC across five cities. These outcomes overlap with the organic audience growth work. |
| The Lil Project | The Lil Project: gigs that fund school buildings | Musa Abdullah Walid led event production and marketing for The Lil Project, whose gigs fund school buildings in Zambia. 768 children reached (organisation total). |
| About | About Musa Abdullah Walid | Musa Abdullah Walid moved from field sales into marketing. He has been an O-Week MC and represented Bangladesh at the 2014 Asian Schools Debate Championship. |
| Contact | Send a brief to Musa Abdullah Walid | Send Musa Abdullah Walid a short brief about a marketing, growth or business development role. The form opens your email app with the brief ready to send. |
| /cv | CV, Musa Abdullah Walid, Marketing & Growth Specialist | The CV of Musa Abdullah Walid, Marketing & Growth Specialist in Melbourne: roles, results, tools and work rights, with the PDF as a direct download. |
| 404 | Page not found, Musa Abdullah Walid | There is no page at this address on Musa Abdullah Walid’s site. This page links to his home page, his work, his CV and the brief form for getting in touch. |

## 7. About

**Note (DRAFT for Musa’s approval):**

> I started at Evitech in April 2021, selling solar, battery and HVAC upgrades door to door. Within six months I was a team leader in B2B sales, and in 2022 I helped establish the NSW hub and recruited 23 sales executives for it.
>
> Since January 2023 I’ve run Evitech’s paid media, reporting and CRM. Because of those years in sales, I judge that work on qualified leads and cost per acquisition. I’ve also managed the I Heart Uni brand since 2021, and hosted 18 sold-out events as its lead MC across five cities.
>
> Musa Abdullah Walid

**Recognition:**
- Asian Schools Debate Championship, 2014. Represented Bangladesh in Kuala Lumpur, among 28 nations.
- UNESCO ASPnet ESD Summit, 2014. One of four delegates selected nationally, in Okayama, Japan, with 60 nations attending.
- SBI-NUJS Parliamentary Debate, 2015. Represented Bangladesh in Kolkata.
- Rajuk Nationals Debate Championship, 2015. Convener for 60 schools; raised $30K AUD.

**The stage:** MC for University of Melbourne O-Week cohorts of 1,000 students, as a Commerce Student Ambassador.
**Cause work:** Event Coordinator for The Lil Project, 2023 to 2025: gigs with Melbourne artists that fund school construction in Zambia. 768 children reached to date (Organisation total).

## 8. Share titles

- **Home:** Musa Abdullah Walid, Marketing & Growth Specialist in Melbourne. `og:description`: "He carried a sales target first, so he judges marketing by what closes."
- **Evitech:** Evitech: 28% lower CPA and 65% more qualified leads, two results from the same initiative. Image adds "Paid media of roughly $15K to $30K a month".
- **I Heart Uni:** I Heart Uni: 18 sold-out events hosted as lead MC, across five cities. Image footnote carries the overlap note.
- **The Lil Project:** The Lil Project: 768 children reached in Zambia (organisation total).

## Open questions for Musa (→ `ASSETS_NEEDED.md`)

1. Period and baseline for 28%, 65% and 70%.
2. Currency for $2M+ and $15K to $30K.
3. Approval of the About note.
4. Spelling out ASPnet and ESD in the UNESCO credit.
