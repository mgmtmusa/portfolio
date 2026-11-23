# Product

<!-- impeccable:product-schema 1 -->

> Source: every field below is taken from `docs/MASTER-PROMPT-v3.md` (Musa's reviewed brief) and `src/data/site.ts`. The brief instructs the run not to stop and interview Musa, so nothing here was asked live; nothing was invented either. Open items are marked **Undecided**.

## Platform

web

## Users

- **Primary:** a senior marketing leader (a CMO or head of growth at a large company) or a hiring manager, arriving from a LinkedIn message, a CV link or a referral. They have about 90 seconds and are deciding whether to take a meeting with Musa.
- **Secondary:** recruiters who need the facts fast (role, location, work rights, CV) on a phone.

## Product Purpose

A personal portfolio for Musa Abdullah Walid, Marketing & Growth Specialist in Melbourne. It exists to get him meetings for marketing, growth and business development roles. Success: a CMO finishes the visit thinking "If he does this for himself, imagine what he'd do for us", remembers three specific things, and takes one of three actions: email, download the CV, or open LinkedIn.

## Positioning

A marketer who learnt the job carrying a sales target, so he judges marketing by what closes. The path from door-to-door sales (April 2021) to Marketing & Growth Specialist (January 2023) is his and can't be copied. The stage (18 sold-out events as lead MC) and his use of AI support the line; they aren't the line.

## Operating Context

- Visitors read on desktop at work and on phones between meetings, often opened from LinkedIn's in-app browser.
- Hosted on Vercel (Astro 5, static). `main` is the live site at `https://portfolio-omega-gold-33.vercel.app`.
- There is no backend. Contact is by email (`mailto:`) and LinkedIn.

## Capabilities and Constraints

- Every fact comes from `src/data/site.ts`. Scope notes ("Company pipeline", "Company revenue", "Team outcome", "Organisation total", and the overlap notes in `growthWork`) travel with their numbers.
- Settled wording: `site.availability`, `site.workRights`, `site.replyTime` (two business days, Monday to Friday, Melbourne time), `site.cv` (direct download, placeholder file).
- No phone number or street address anywhere.
- Growth work is presented as growth projects or selected results, never as experiments or tests.
- "Helped establish" the NSW hub, everywhere. Debating credits keep "Schools" and the year.
- **Undecided:** languages and the Trinity College club presidency are not in `site.ts` yet, so they are left out. Live cursors, a mail-sending server route and `/for/<key>/` companies need accounts or input from Musa.

## Brand Commitments

- Name used the same way everywhere: Musa Abdullah Walid.
- Voice: plain, confident, specific numbers, short sentences, Australian English, first person in page copy.
- Banned: em dashes; the words listed in the brief section 5; "not X, but Y" contrasts; exclamation marks; rhetorical questions.
- Retired for good: the human-versus-machine idea, the Seam, the lens, the robot, and "I sell like a human. I measure like a machine."
- References that set the craft bar (family, never copied): carterogunsola.com and unanim.studio.

## Evidence on Hand

- `src/assets/portrait/musa-portrait.jpg`: one 1254×1254 studio portrait (real).
- Results, roles and dates in `src/data/site.ts`.
- Placeholder CV at `public/cv/Musa-Walid-CV.pdf`.
- **Absent, never to be fabricated:** event photos, handwriting, voice clips, the final CV, the turn film, client logos, testimonials, ad-account screenshots (the accounts belong to his employers).

## Product Principles

1. Every number is footnoted with its scope. Honesty is part of the look.
2. Proof first: commercial outcomes Musa can claim personally lead.
3. The next step is one action away from anywhere.
4. The site itself is the work sample: it has to show the marketing judgment it claims.

## Accessibility & Inclusion

WCAG 2.2 AA. Full keyboard path, visible focus, a complete reduced-motion version, solid fallbacks for reduced transparency and high contrast, and all content in plain HTML that renders without JavaScript.
