// Page metadata, share titles, JSON-LD, the sitemap and llms.txt, all from src/data/site.ts and docs/v3/story.md §6 and §8.
// The `.ts` extension on the import lets scripts/og.mjs run this file in Node.
import { site, cases, growthWork, career, approach, recognition, experience, capabilities } from '../data/site.ts';

export type PageMeta = { title: string; description: string; og: string; ogTitle?: string; ogDescription?: string; ogAlt: string };

const n = site.name;
const alt = (s: string) => `${n}, ${s}`;

/** Titles and descriptions, story.md §6. Share titles, §8. */
export const pages: Record<string, PageMeta> = {
  '/': {
    title: `${n}, ${site.role}`,
    description: site.description,
    og: '/og/home.png',
    ogTitle: `${n}, ${site.role} in ${site.city}`,
    ogDescription: 'He carried a sales target first, so he judges marketing by what closes.',
    ogAlt: alt(`${site.role}, ${site.city}`),
  },
  '/work/': {
    title: `Work and growth projects, ${n}`,
    description: `Three cases and six growth projects by ${n}: paid media at Evitech, a student brand in five cities and gigs that fund school buildings in Zambia.`,
    og: '/og/home.png',
    ogAlt: alt(`${site.role}, ${site.city}`),
  },
  '/work/evitech/': {
    title: 'Evitech: paid media rebuilt around lead quality',
    description: `${n} rebuilt Evitech’s paid media around lead quality: 28% lower CPA and 65% more qualified leads, two results from the same initiative.`,
    og: '/og/evitech.png',
    ogTitle: 'Evitech: 28% lower CPA and 65% more qualified leads, two results from the same initiative',
    ogAlt: `Evitech: 28% lower cost per acquisition and 65% more qualified leads, two results from the same initiative. Portrait of ${n}.`,
  },
  '/work/i-heart-uni/': {
    title: 'I Heart Uni: a student brand grown city by city',
    description: `${n} hosted 18 sold-out events as I Heart Uni’s lead MC across five cities. These outcomes overlap with the organic audience growth work.`,
    og: '/og/i-heart-uni.png',
    ogTitle: 'I Heart Uni: sold-out events hosted as lead MC, across five cities',
    ogAlt: `I Heart Uni: 18 sold-out events hosted as lead MC. These outcomes overlap with the organic audience growth work. Portrait of ${n}.`,
  },
  '/work/the-lil-project/': {
    title: 'The Lil Project: gigs that fund school buildings',
    description: `${n} led event production and marketing for The Lil Project, whose gigs fund school buildings in Zambia. 768 children reached (organisation total).`,
    og: '/og/the-lil-project.png',
    ogTitle: 'The Lil Project: 768 children reached in Zambia (organisation total)',
    ogAlt: 'The Lil Project: 768 children reached in Zambia (organisation total)',
  },
  '/about/': {
    title: `About ${n}`,
    description: `${n} moved from field sales into marketing. He has been an O-Week MC and represented Bangladesh at the 2014 Asian Schools Debate Championship.`,
    og: '/og/home.png',
    ogAlt: alt(`${site.role}, ${site.city}`),
  },
  '/contact/': {
    title: `Send a brief to ${n}`,
    description: `Send ${n} a short brief about a marketing, growth or business development role. The form opens your email app with the brief ready to send.`,
    og: '/og/home.png',
    ogAlt: alt(`${site.role}, ${site.city}`),
  },
  '/cv/': {
    title: `CV, ${n}, ${site.role}`,
    description: `The CV of ${n}, ${site.role} in ${site.city}: roles, results, tools and work rights, with the PDF as a direct download.`,
    og: '/og/home.png',
    ogAlt: alt(`${site.role}, ${site.city}`),
  },
  '/404/': {
    title: `Page not found, ${n}`,
    description: `There is no page at this address on ${n}’s site. This page links to his home page, his work, his CV and the brief form for getting in touch.`,
    og: '/og/home.png',
    ogAlt: alt(`${site.role}, ${site.city}`),
  },
};

export const PORTRAIT_JPG = '/og/musa-portrait.jpg';

/** The eight indexable URLs. `/for/*` and the 404 are never listed. */
export const SITEMAP_PATHS = ['/', '/work/', ...cases.map((c) => `/work/${c.slug}/`), '/about/', '/contact/', '/cv/'];

export type HeadProps = {
  title?: string;
  description?: string;
  path: string;
  og?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogAlt?: string;
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
  canonicalPath?: string;
};

export type Head = {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogAlt: string;
  jsonLd?: Record<string, unknown>;
};

/** The Person on the home page. Only the fields the plan lists. */
export function profilePage(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: origin,
    name: `${site.name}, ${site.role}`,
    mainEntity: {
      '@type': 'Person',
      name: site.name,
      url: origin,
      description: site.description,
      email: `mailto:${site.email}`,
      jobTitle: site.role,
      address: { '@type': 'PostalAddress', addressLocality: site.city },
      sameAs: [site.linkedin],
      knowsAbout: ['Performance marketing', 'Paid media', 'Google Ads', 'Meta Ads Manager', 'GA4', 'Looker Studio', 'HubSpot', 'CRM and automation', 'Event marketing'],
      worksFor: { '@type': 'Organization', name: 'Evitech' },
      image: new URL(PORTRAIT_JPG, origin).href,
    },
  };
}

/**
 * Known pages use their story.md §6 entry. Anything else (the 404, /for/<key>/) uses the props it passes.
 * `/for/*` is forced to noindex with canonical `/`. JSON-LD appears on the home page only.
 */
export function resolveHead(props: HeadProps, origin: string): Head {
  const known = pages[props.path];
  const isFor = props.path.startsWith('/for/');
  const title = known?.title ?? props.title ?? pages['/'].title;
  const description = known?.description ?? props.description ?? site.description;
  const ogTitle = props.ogTitle ?? known?.ogTitle ?? title;
  const ogDescription = props.ogDescription ?? known?.ogDescription ?? description;
  const og = props.og ?? known?.og ?? '/og/home.png';
  const noindex = props.noindex || isFor || props.path === '/404/';
  return {
    title,
    description,
    canonical: new URL(isFor ? '/' : props.canonicalPath ?? props.path, origin).href,
    robots: noindex ? 'noindex' : undefined,
    ogTitle,
    ogDescription,
    ogImage: new URL(og, origin).href,
    ogAlt: props.ogAlt ?? known?.ogAlt ?? pages['/'].ogAlt,
    jsonLd: props.jsonLd ?? (props.path === '/' ? profilePage(origin) : undefined),
  };
}

export function sitemapXml(origin: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_PATHS.map((p) => `  <url><loc>${new URL(p, origin).href}</loc></url>`).join('\n')}
</urlset>
`;
}

type Scoped = { v: string; l: string; scope?: string };
const scoped = (r: Scoped) => `${r.v} ${r.l}${r.scope ? ` (${r.scope})` : ''}`;

/** The scope notes site.ts attaches to a case's growth work, so each case line carries them beside its figures. */
const caseNotes = (slug: string) => growthWork.filter((g) => g.case === slug && g.note).map((g) => g.note!);

/** Evitech: the pair and its note travel together, so an assistant cannot attach the note to the company figures. */
const caseResults = (c: (typeof cases)[number]) => {
  if (c.slug !== 'evitech') return c.results.map(scoped).join('; ');
  const [a, b, ...rest] = c.results;
  const pair = `${a.v} ${a.l} and ${b.v} ${b.l} (two results from the same initiative)`;
  return [pair, ...rest.map(scoped)].join('; ');
};

export function llmsText(origin: string): string {
  const url = (p: string) => new URL(p, origin).href;
  return [
    `# ${site.name}`,
    '',
    `> ${site.name} is a ${site.role} in ${site.city}. He came to marketing from sales, and judges marketing by what closes.`,
    '',
    '## Facts',
    `- Role: ${site.role}, ${site.city}`,
    `- Availability: ${site.availability}`,
    `- Work rights: ${site.workRights}`,
    `- Reply time: ${site.replyTime.text} Business days are Monday to Friday, Melbourne time.`,
    `- Contact: ${site.email} or ${site.linkedin}`,
    `- Brief form: ${url('/contact/')}`,
    `- CV: ${url(site.cv)}`,
    '',
    '## Case studies',
    ...cases.map(
      (c) =>
        `- [${c.org}: ${c.title}](${url(`/work/${c.slug}/`)}): ${c.summary} Results: ${caseResults(c)}.${c.slug === 'evitech' ? '' : caseNotes(c.slug).map((x) => ` ${x}`).join('')}`,
    ),
    '',
    '## Selected growth work',
    ...growthWork.map((g) => `- ${g.t} (${g.org}): ${g.did} ${g.results.map(scoped).join('; ')}.${g.note ? ` ${g.note}` : ''}`),
    '',
    '## Career at Evitech',
    ...career.map((r) => `- ${r.when}, ${r.t}: ${r.d}`),
    '',
    '## How he works',
    ...approach.map((a) => `- ${a.t}: ${a.d}`),
    '',
    '## Other experience',
    ...experience.filter((e) => !e.case).map((e) => `- ${e.when}, ${e.role}, ${e.org}${e.note ? `: ${e.note}` : ''}`),
    '',
    '## Capabilities',
    ...capabilities.map((c) => `- ${c.t}: ${c.items}`),
    '',
    '## Recognition',
    ...recognition.map((r) => `- ${r.t}, ${r.when}: ${r.d}`),
    '',
  ].join('\n');
}

