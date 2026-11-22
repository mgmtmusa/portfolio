// ─────────────────────────────────────────────────────────────
//  Single source of content. Every fact comes from
//  Musa_Abdullah_Walid_Master_Resume.pdf (supplied in the build thread).
//  Organisation-level outcomes are labelled as such.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Musa Abdullah Walid',
  role: 'Marketing & Growth Specialist',
  city: 'Melbourne',
  email: 'mgmtmusa@gmail.com',
  linkedin: 'https://www.linkedin.com/in/musa-abdullah-walid',
  url: 'https://portfolio-omega-gold-33.vercel.app',
  description:
    'Musa Abdullah Walid is a marketing and growth specialist in Melbourne. He came up through sales and now runs paid media, reporting and CRM: 28% lower cost per acquisition and 65% more qualified leads at Evitech.',
  /** Chosen by Musa. Deliberately promises no start date, which the resumes don't confirm. */
  availability: 'Based in Melbourne. Open to conversations about marketing, growth and business development opportunities.',
  /** Approved wording, November 2026. Use this exact sentence wherever work rights are mentioned. */
  workRights: 'Full work rights until January 2028 (subclass 485 visa), open to employer sponsorship.',
  /** Placeholder PDF until the final CV is ready. To swap: replace public/cv/Musa-Walid-CV.pdf, keeping the name. */
  cv: '/cv/Musa-Walid-CV.pdf',
  /** Confirmed by Musa on 23 November 2026. Business days are Monday to Friday, Melbourne time. */
  replyTime: { text: 'I aim to respond within two business days.', businessDays: 2, confirmed: true },
};

/**
 * Selected growth work, as documented in Musa's resumes. These are growth projects, not
 * independently measured experiments: the resumes don't carry enough detail to call them tests.
 * Keep each `note` wherever the item appears.
 */
export const growthWork: {
  t: string;
  org: string;
  did: string;
  results: Result[];
  note?: string;
  case?: string;
}[] = [
  {
    t: 'Paid acquisition',
    org: 'Evitech',
    did: 'Restructured the Google Ads and Meta campaign accounts, audiences and budget allocation.',
    results: [
      { v: '28%', l: 'lower cost per acquisition' },
      { v: '65%', l: 'more qualified leads' },
    ],
    note: 'Two results from the same initiative.',
    case: 'evitech',
  },
  {
    t: 'Lead qualification and CRM routing',
    org: 'Evitech',
    did: 'Revised the qualification criteria and lead routing while managing a 38-person offshore lead generation team.',
    results: [{ v: '80%', l: 'pipeline volume growth, quarter on quarter' }],
    case: 'evitech',
  },
  {
    t: 'Organic audience growth',
    org: 'I Heart Uni',
    did: 'Led organic content and community building.',
    results: [{ v: '400 → 13,200', l: 'social audience' }],
    case: 'i-heart-uni',
  },
  {
    t: 'Event marketing and brand development',
    org: 'I Heart Uni',
    did: 'Led brand positioning, content direction and event marketing, alongside hosting the events.',
    results: [
      { v: '70%', l: 'more revenue per event' },
      { v: '280 → 650', l: 'average attendance' },
      { v: '18', l: 'events sold out across five cities' },
    ],
    note: 'These outcomes overlap with the organic audience growth work.',
    case: 'i-heart-uni',
  },
  {
    t: 'Interstate expansion',
    org: 'Evitech',
    did: 'Helped establish the NSW operations hub: negotiated the warehouse lease, and recruited and placed 23 sales executives.',
    results: [{ v: '4 months', l: 'to launch the hub' }],
  },
  {
    t: 'B2B sales and commercial growth',
    org: 'Evitech',
    did: 'Personally closed B2B contracts, and contributed to the company’s revenue growth.',
    results: [
      { v: '$2M+', l: 'in B2B contracts personally closed' },
      { v: '2.6×', l: 'company revenue growth in under three years', scope: 'Team outcome' },
    ],
    note: 'The company growth figure reflects a broader team outcome.',
  },
];

export type Result = { v: string; l: string; scope?: string };

export type Case = {
  slug: string;
  org: string;
  card: { tone: 'green' | 'red' | 'cream'; v: string; l: string };
  title: string;
  summary: string;
  role: string;
  when: string;
  where: string;
  results: Result[];
  brief: string;
  question: string;
  responsibilities: string[];
  decisions: { t: string; d: string }[];
  execution?: string[];
  evidence: { text: string; href?: string; label?: string };
  tools?: string[];
};

export const cases: Case[] = [
  {
    slug: 'evitech',
    org: 'Evitech',
    card: { tone: 'green', v: '28%', l: 'lower cost per acquisition' },
    title: 'Paid media rebuilt around lead quality',
    summary:
      'I restructured Evitech’s Meta and Google Ads accounts, built the reporting that sales and management use, and tightened the path from lead to sales call.',
    role: 'Marketing & Growth Specialist',
    when: 'January 2023 to now',
    where: 'Evitech Pty Ltd, Melbourne and Sydney',
    results: [
      { v: '28%', l: 'lower cost per acquisition' },
      { v: '65%', l: 'more qualified leads' },
      { v: '80%', l: 'pipeline growth, quarter on quarter', scope: 'Company pipeline' },
      { v: '2.6×', l: 'revenue growth in under three years', scope: 'Company revenue' },
    ],
    brief:
      'Evitech sells energy-efficiency upgrades to homes and businesses in Victoria and New South Wales: solar, battery storage, HVAC and hot water. Paid media runs at roughly $15K to $30K a month across Meta and Google.',
    question:
      'At that spend, every dollar has to turn into leads the sales team can close, and leaders need to see which channels are earning their budget.',
    responsibilities: [
      'Paid media account structure, audiences and budget split across Meta and Google Ads',
      'Reporting in GA4, Looker Studio and HubSpot: leads by source, spend, cost per acquisition and pipeline movement',
      'CRM and lead lifecycle in HubSpot and GoHighLevel',
      'Content and messaging across ads, email, landing pages, social and the website',
      'Briefing and managing freelancers and outside suppliers',
    ],
    decisions: [
      {
        t: 'Restructure the account, not just the ads',
        d: 'I rebuilt the account architecture, audiences and budget split across Meta and Google.',
      },
      {
        t: 'Report on qualified leads and pipeline, not clicks',
        d: 'Dashboards track leads by source, spend, CPA and pipeline movement, and each report ends in a recommendation for sales and management.',
      },
      {
        t: 'Work the leads already paid for',
        d: 'CRM hygiene audits, aged-lead reactivation, and follow-up prioritised by pipeline value, lead age and stage.',
      },
      {
        t: 'Automate the routine, keep a human check',
        d: 'Claude, Zapier and GoHighLevel handle reporting, lead scoring and production work. A person reviews anything before it goes out.',
      },
    ],
    execution: [
      'A/B tests on creative and messaging',
      'SEO and social media optimisation for organic channels',
      'One consistent brand voice across ads, email, landing pages, social and the website',
      'Coaching team members on performance across sales, lead generation and operations',
    ],
    evidence: {
      text: 'Ad accounts and dashboards belong to Evitech, so they aren’t shown here. I’m happy to walk through the account structure and reporting in an interview.',
    },
    tools: ['Google Ads', 'Meta Ads Manager', 'GA4', 'Looker Studio', 'HubSpot', 'GoHighLevel', 'Zapier', 'Claude'],
  },
  {
    slug: 'i-heart-uni',
    org: 'I Heart Uni',
    card: { tone: 'red', v: '13.2K', l: 'audience, built from 400' },
    title: 'A student brand grown city by city',
    summary:
      'I set the brand’s positioning and content, ran the event marketing calendar across five cities, and hosted the events as lead MC.',
    role: 'Brand Manager & Lead MC',
    when: 'February 2021 to now',
    where: 'National student brand in Melbourne, Sydney, Adelaide, Brisbane and Canberra',
    results: [
      { v: '18', l: 'sold-out events hosted as lead MC' },
      { v: '70%', l: 'more revenue per event' },
      { v: '5', l: 'cities: Melbourne, Sydney, Adelaide, Brisbane, Canberra' },
    ],
    brief: 'I Heart Uni is a national student brand that runs events for university students in five Australian cities.',
    question: 'Grow an audience and fill rooms in five cities, mostly through organic content.',
    responsibilities: [
      'Brand positioning and content direction',
      'The event marketing calendar for every city',
      'Hosting events as lead MC',
    ],
    decisions: [
      {
        t: 'Community first',
        d: 'Most of the growth came from organic content and a community-first approach to building the audience.',
      },
      {
        t: 'One calendar for five cities',
        d: 'I set the event marketing calendar for every city, alongside the brand’s positioning and content direction.',
      },
      {
        t: 'Host the room',
        d: 'I hosted the events myself as lead MC, from Melbourne to Canberra.',
      },
    ],
    evidence: {
      text: 'Event photos and account analytics aren’t published here. The chart shows the start and current figures from my time running the brand.',
    },
  },
  {
    slug: 'the-lil-project',
    org: 'The Lil Project',
    card: { tone: 'cream', v: '768', l: 'children reached in Zambia (organisation total)' },
    title: 'Gigs that fund school buildings',
    summary:
      'I led event production and marketing for gigs with Melbourne artists that fund school construction in Zambia.',
    role: 'Event Coordinator',
    when: 'May 2023 to November 2025',
    where: 'The Lil Project, a social-impact music organisation in Melbourne',
    results: [{ v: '768', l: 'children reached to date', scope: 'Organisation total' }],
    brief:
      'The Lil Project partners with Melbourne artists to put on music events. Proceeds fund school construction in Zambia.',
    question: 'Each event has to sell tickets and bring in partners, because the night is how the school gets built.',
    responsibilities: [
      'Event production',
      'Marketing strategy for each event',
      'The partnership and sponsorship pipeline',
      'Campaign calendar across social, email and on-the-ground promotion',
    ],
    decisions: [
      {
        t: 'Run every event as a campaign',
        d: 'Each night had its own calendar across social, email and on-the-ground promotion.',
      },
      {
        t: 'Give every event a partner pipeline',
        d: 'I built the partnership and sponsorship pipeline that each event drew on.',
      },
    ],
    evidence: { text: 'The organisation’s work is public.', href: 'https://thelilproject.com', label: 'Visit thelilproject.com' },
  },
];

/** Evitech path, first role first. Each rung carries the metric earned in that role. */
export const career = [
  {
    when: 'April 2021',
    t: 'Field Sales Representative',
    d: 'Door-to-door sales of solar, battery and HVAC upgrades. Set the company’s highest day-one sales record.',
  },
  {
    when: 'July 2021',
    t: 'B2B Sales Executive & Team Leader',
    d: 'Promoted to team leader within six months. Closed high-ticket B2B contracts; more than $2M personally closed to date.',
  },
  {
    when: 'January 2022',
    t: 'Business Development & People Operations Manager',
    d: 'Opened the NSW hub and had it fully operational in four months. Recruited 23 sales executives and coached a team that grew to 35.',
  },
  {
    when: 'January 2023',
    t: 'Marketing & Growth Specialist',
    d: 'Took on paid media, reporting and CRM.',
    link: { href: '/work/evitech/', label: 'Read the Evitech case study' },
  },
];

export const approach = [
  {
    t: 'A lead is worth what it closes for',
    d: 'I spent almost two years in sales at Evitech before moving into marketing: door to door, then B2B, then building a sales team. So I judge campaigns on qualified leads and cost per acquisition, not clicks.',
  },
  {
    t: 'Reports should answer the sales team’s questions',
    d: 'My reporting shows leads by source, spend, cost per acquisition and pipeline movement, and ends with a recommendation sales and management can act on.',
  },
  {
    t: 'Speed to lead is part of marketing',
    d: 'Paying for a lead and then letting it sit wastes the spend. I run CRM hygiene, aged-lead reactivation and follow-up by stage, and automate the routine parts.',
  },
];

export const experience: { when: string; role: string; org: string; case?: string; note?: string }[] = [
  { when: '2021 to now', role: 'Field Sales Representative to Marketing & Growth Specialist', org: 'Evitech', case: 'evitech', note: 'Four roles, shown in the career path above.' },
  { when: '2021 to now', role: 'Brand Manager & Lead MC', org: 'I Heart Uni', case: 'i-heart-uni' },
  { when: '2023 to 2025', role: 'Event Coordinator', org: 'The Lil Project', case: 'the-lil-project' },
  { when: '2021 to 2023', role: 'Commerce Student Ambassador', org: 'University of Melbourne', note: 'MC for O-Week cohorts of 1,000 students; trained 12 new ambassadors.' },
  { when: '2020 to 2021', role: 'Finance Administrator, 3PL', org: 'Kerry Logistics', note: 'Reconciliation, invoicing and reporting.' },
  { when: '2020', role: 'Digital Marketing Intern', org: 'Fraser’s Medical (GAMSAT)', note: 'SEO, social media optimisation, Meta Ads and content strategy.' },
  { when: '2017 to 2018', role: 'Sales Associate', org: 'Roger David', note: 'Top three in store at 118% of target.' },
];

export const capabilities = [
  { t: 'Performance marketing', items: 'Meta and Google Ads, A/B and conversion testing, channel and budget allocation, SEO and social optimisation', cases: ['evitech'] },
  { t: 'Analytics and reporting', items: 'GA4 and Looker Studio, dashboards, KPIs and CPA, lead source analysis, recommendations to leaders', cases: ['evitech'] },
  { t: 'CRM and automation', items: 'HubSpot, GoHighLevel and Salesforce, lead lifecycle and CRM audits, Zapier, AI in reporting and production', cases: ['evitech'] },
  { t: 'Brand, events and teams', items: 'Content and brand direction, event hosting and MC, recruiting and coaching teams, cause-led fundraising', cases: ['i-heart-uni', 'the-lil-project'] },
];

export const tools = ['Google Ads', 'Meta Ads Manager', 'Meta Business Suite', 'Meta Pixel', 'GA4', 'Tag Manager', 'Search Console', 'Looker Studio', 'HubSpot', 'GoHighLevel', 'Salesforce', 'Zoho', 'Zapier', 'Canva', 'Adobe Express', 'ChatGPT', 'Claude', 'Excel'];

export const recognition = [
  { when: '2014', t: 'Asian Schools Debate Championship', d: 'Represented Bangladesh in Kuala Lumpur, 28 nations.' },
  { when: '2014', t: 'UNESCO ASPnet ESD Summit', d: 'One of four delegates selected nationally. Okayama, Japan, 60 nations.' },
  { when: '2015', t: 'SBI-NUJS Parliamentary Debate', d: 'Represented Bangladesh in Kolkata.' },
  { when: '2015', t: 'Rajuk Nationals Debate Championship', d: 'Convener for 60 schools. Raised $30K AUD.' },
];

export const caseBySlug = (slug: string) => cases.find((c) => c.slug === slug)!;
