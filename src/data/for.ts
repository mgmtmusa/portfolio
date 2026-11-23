// Company links: /for/<key>/ tailors the intro line and the lead case for one target company.
// Musa supplies real entries. The example key is fake and never ships to production.

export type ForPage = { key: string; company: string; intro: string; leadCase: string; ogTitle: string; example?: boolean };

export const forConfig: ForPage[] = [
  {
    key: 'example-company',
    company: 'Example Company (placeholder)',
    intro: 'Placeholder intro for a company link. Musa replaces this with a real line before using it.',
    leadCase: 'evitech',
    ogTitle: 'Musa Abdullah Walid, for Example Company (placeholder)',
    example: true,
  },
];

/** Pages to build. Production (`VERCEL_ENV === 'production'`) drops example entries. */
export function forPages(env: string | undefined, config: ForPage[] = forConfig): ForPage[] {
  return env === 'production' ? config.filter((p) => !p.example) : config;
}
