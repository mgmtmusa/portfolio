// ─────────────────────────────────────────────────────────────
//  All page content lives here. Every fact and number comes from
//  Musa_Abdullah_Walid_Master_Resume.pdf.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Musa Abdullah Walid',
  first: 'Musa',
  role: 'Marketing & Growth',
  location: 'Melbourne, AU',
  timeZone: 'Australia/Melbourne',
  email: 'mgmtmusa@gmail.com',
  url: 'https://portfolio-omega-gold-33.vercel.app',
  description:
    'Musa Abdullah Walid — Marketing & Growth Specialist in Melbourne. Performance marketing, analytics, CRM and automation, built on a sales background: 28% lower CPA, 65% more qualified leads, $2M+ in B2B contracts closed.',
  year: new Date().getFullYear(),
  socials: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/musa-abdullah-walid' }],
};

export const impact = [
  { v: 28, pre: '', suf: '%', l: 'Lower cost per acquisition' },
  { v: 65, pre: '', suf: '%', l: 'More qualified leads' },
  { v: 80, pre: '', suf: '%', l: 'Pipeline growth, quarter on quarter' },
  { v: 2.6, pre: '', suf: '×', dec: 1, l: 'Revenue growth in under three years' },
  { v: 2, pre: '$', suf: 'M+', l: 'B2B contracts closed personally' },
  { v: 13.2, pre: '', suf: 'K', dec: 1, l: 'Audience built from 400' },
  { v: 35, pre: '', suf: '', l: 'Sales team coached, 23 recruited' },
  { v: 768, pre: '', suf: '', l: 'Children reached in Zambia' },
];

/** Evitech career ladder, bottom rung first. */
export const ladder = [
  { when: 'Apr 2021', t: 'Field Sales Representative', d: 'Set the company’s highest day-one sales record.' },
  { when: 'Jul 2021', t: 'B2B Sales Exec & Team Leader', d: 'Promoted within six months. $2M+ in B2B contracts closed personally.' },
  { when: 'Jan 2022', t: 'Business Dev & People Ops Manager', d: 'Launched the NSW hub in four months. Recruited 23, coached a team of 35.' },
  { when: 'Jan 2023', t: 'Marketing & Growth Specialist', d: 'Rebuilt paid media on $15–30K a month. CPA down 28%, qualified leads up 65%.' },
];

export const experience = [
  {
    when: 'Jan 2023 — Now',
    role: 'Marketing & Growth Specialist',
    org: 'Evitech Pty Ltd',
    note: 'Paid media on Meta and Google, GA4 and Looker Studio reporting, HubSpot and GoHighLevel CRM, AI and Zapier automation. Pipeline up 80% quarter on quarter.',
  },
  {
    when: 'Jan — Dec 2022',
    role: 'Business Development & People Ops Manager',
    org: 'Evitech Pty Ltd',
    note: 'Built the NSW hub from nothing in four months, negotiated the warehouse lease, recruited 23 sales executives and grew the team to 35.',
  },
  {
    when: 'Apr — Dec 2021',
    role: 'B2B Sales Exec, Team Leader & Field Sales Rep',
    org: 'Evitech Pty Ltd',
    note: 'High-ticket solar, battery, HVAC and hot water contracts. Highest day-one sales record in the company.',
  },
  {
    when: 'Feb 2021 — Now',
    role: 'Brand Manager & Lead MC',
    org: 'I Heart Uni',
    note: 'National student brand in five cities. 400 to 13,200 followers, 18 sold-out events, attendance up from 280 to 650, revenue per event up 70%.',
  },
  {
    when: 'May 2023 — Nov 2025',
    role: 'Event Coordinator',
    org: 'The Lil Project',
    href: 'https://thelilproject.com',
    note: 'Event production and marketing for a social-impact music organisation funding school construction in Zambia. 768 children reached.',
  },
  {
    when: 'Jan 2021 — Dec 2023',
    role: 'Commerce Student Ambassador',
    org: 'University of Melbourne',
    note: 'MC’d O-Week for cohorts of 1,000 students and trained 12 incoming ambassadors.',
  },
  {
    when: 'Dec 2020 — Mar 2021',
    role: 'Finance Administrator, 3PL',
    org: 'Kerry Logistics',
    note: 'Reconciliation, invoicing and reporting across third-party logistics accounts.',
  },
  {
    when: 'Jul — Dec 2020',
    role: 'Digital Marketing Intern',
    org: 'Fraser’s Medical (GAMSAT)',
    note: 'Six-month placement covering SEO, social media optimisation, Meta Ads and content strategy.',
  },
  {
    when: 'Oct 2017 — Dec 2018',
    role: 'Sales Associate',
    org: 'Roger David RDX',
    note: 'Top three in store at 118% of target across 14 months.',
  },
];

export const disciplines = [
  {
    n: '01',
    t: 'Performance marketing',
    lede: 'Spend that earns its keep.',
    skills: ['Meta Ads & Google Ads', 'A/B and conversion testing', 'Channel & budget allocation', 'SEO & social optimisation'],
  },
  {
    n: '02',
    t: 'Analytics & reporting',
    lede: 'Campaign data turned into decisions.',
    skills: ['GA4 & Looker Studio', 'Dashboards, KPIs & CPA', 'Lead source analysis', 'Recommendations to leaders'],
  },
  {
    n: '03',
    t: 'CRM & automation',
    lede: 'Faster speed to lead, fewer manual hours.',
    skills: ['HubSpot, GoHighLevel, Salesforce', 'Lead lifecycle & CRM audits', 'Zapier & workflow automation', 'AI in reporting & production'],
  },
  {
    n: '04',
    t: 'Brand, events & teams',
    lede: 'The human side of growth.',
    skills: ['Content & brand direction', 'Event hosting & MC', 'Recruiting & coaching teams', 'Cause-led fundraising'],
  },
];

export const tools = [
  'Google Ads', 'Meta Ads Manager', 'Meta Pixel', 'GA4', 'Tag Manager', 'Search Console', 'Looker Studio',
  'HubSpot', 'GoHighLevel', 'Salesforce', 'Zoho', 'Zapier', 'Canva', 'Adobe Express', 'ChatGPT', 'Claude', 'Excel',
];

export const recognition = [
  { when: '2014', t: 'Asian Schools Debate Championship', d: 'Represented Bangladesh · Kuala Lumpur · 28 nations' },
  { when: '2014', t: 'UNESCO ASPnet ESD Summit', d: '1 of 4 selected nationally · Okayama, Japan · 60 nations' },
  { when: '2015', t: 'SBI-NUJS Parliamentary Debate', d: 'Represented Bangladesh · Kolkata, India' },
  { when: '2015', t: 'Rajuk Nationals Debate Championship', d: 'Convener · 60 schools · $30K AUD raised' },
];

