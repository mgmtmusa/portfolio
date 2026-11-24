// Helpers and cover copy for the work index and the case sheet (Tasks 6 and 7). No DOM, so Vitest covers them.
import { notes } from '../data/notes';

/**
 * The headline figure each case shows on /work/ and in its sheet: the home teaser figures from
 * docs/v3/story.md section 3, each with its footnote. `fact` lists the figures for data-fact.
 */
export const covers = {
  evitech: { figs: ['28%', '65%'], label: 'lower cost per acquisition, and more qualified leads', caption: 'Two results from the same initiative.', note: notes.evitechPair },
  'i-heart-uni': { figs: ['18'], label: 'sold-out events hosted as lead MC, across five cities', note: notes.events },
  'the-lil-project': { figs: ['768'], label: 'children reached to date', scope: 'Organisation total', note: notes.lil },
} as const satisfies Record<string, { figs: readonly string[]; label: string; caption?: string; scope?: string; note: string }>;
export type CoverSlug = keyof typeof covers;

/** The footnote for a scoped result: its scope note from src/data/notes.ts. */
export const scopeNotes: Record<string, string> = {
  'Company pipeline': notes.pipeline,
  'Company revenue': notes.revenue,
  'Organisation total': notes.lil,
};

export type CapabilityLike = { t: string; cases?: string[] };
export type CaseLike = { slug: string; when: string };

/** A stable id for a capability title: "Brand, events and teams" → "brand-events-and-teams". */
export function tagId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** The filter tags, one per capability that maps to at least one case, in capability order. */
export function workTags(capabilities: CapabilityLike[]): { id: string; label: string }[] {
  return capabilities.filter((c) => c.cases?.length).map((c) => ({ id: tagId(c.t), label: c.t }));
}

/** Each case's tag ids, from the capabilities that list it. */
export function tagsForCase(slug: string, capabilities: CapabilityLike[]): string[] {
  return capabilities.filter((c) => c.cases?.includes(slug)).map((c) => tagId(c.t));
}

/** "January 2023 to now" → "2023 to now"; "May 2023 to November 2025" → "2023 to 2025"; "2020" → "2020". */
export function yearChip(when: string): string {
  const parts = when.split(/\s+to\s+/i).map((p) => p.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? p.trim().toLowerCase());
  if (parts.length === 2 && parts[0] === parts[1]) return parts[0];
  return parts.join(' to ');
}

export type CaseNav = { index: number; total: number; counter: string; prev: string; next: string };

/** Position of a case and its neighbours. Wraps, so the first case's previous is the last. */
export function caseNav(slug: string, slugs: string[]): CaseNav {
  const i = slugs.indexOf(slug);
  if (i < 0) throw new Error(`Unknown case: ${slug}`);
  const n = slugs.length;
  return {
    index: i + 1,
    total: n,
    counter: `${i + 1} / ${n}`,
    prev: slugs[(i - 1 + n) % n],
    next: slugs[(i + 1) % n],
  };
}

/** The case slug in a /work/<slug>/ path, or null for anything else (including /work/ itself). */
export function slugFromPath(pathname: string, slugs: string[]): string | null {
  const m = pathname.match(/^\/work\/([a-z0-9-]+)\/?$/);
  return m && slugs.includes(m[1]) ? m[1] : null;
}

/** True for the work index, with or without its trailing slash or a hash. */
export function isWorkIndex(pathname: string): boolean {
  return /^\/work\/?$/.test(pathname);
}

/**
 * Which way the sheet slides when one case replaces another: 'forward' to the next case, 'back' to the
 * previous. Neither neighbour (only possible with more than three cases) falls back to list order.
 */
export function slideDirection(from: string, to: string, slugs: string[]): 'forward' | 'back' {
  const nav = caseNav(from, slugs);
  if (to === nav.next) return 'forward';
  if (to === nav.prev) return 'back';
  return slugs.indexOf(to) > slugs.indexOf(from) ? 'forward' : 'back';
}

/** Where Close goes when there is no /work/ entry to go back to. */
export function closeHref(slug: string): string {
  return `/work/#case-${slug}`;
}

/** The live count for the filter, e.g. "2 of 3 cases". */
export function countText(shown: number, total: number): string {
  return `${shown} of ${total} ${total === 1 ? 'case' : 'cases'}`;
}

export type ResultLike = { v: string; l: string; scope?: string };
export type GrowthLike = { case?: string; note?: string; results: { v: string }[] };

/**
 * A case's results in order, with consecutive results that share a growth-work note grouped, so the note
 * ("Two results from the same initiative.") sits once beside the figures it qualifies.
 */
export function resultGroups<R extends ResultLike>(slug: string, results: R[], growth: GrowthLike[]): { results: R[]; note?: string }[] {
  const noteFor = (r: R) => growth.find((g) => g.case === slug && g.note && g.results.some((x) => x.v === r.v))?.note;
  const out: { results: R[]; note?: string }[] = [];
  for (const r of results) {
    const note = noteFor(r);
    const last = out[out.length - 1];
    if (note && last?.note === note) last.results.push(r);
    else out.push({ results: [r], note });
  }
  return out;
}

/** Hands out footnote numbers: the same note keeps its number, every marker gets its own popover id. */
export function noteRegistry(prefix: string) {
  const numbers = new Map<string, number>();
  const list: { n: number; id: string; note: string }[] = [];
  let k = 0;
  return {
    mark(note: string) {
      k += 1;
      const id = `${prefix}-${k}`;
      let n = numbers.get(note);
      if (n === undefined) {
        n = numbers.size + 1;
        numbers.set(note, n);
        list.push({ n, id, note });
      }
      return { n, id, note };
    },
    list: () => list,
  };
}
