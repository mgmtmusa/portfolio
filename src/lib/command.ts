// ⌘K: the items and the search that ranks them.
import { site, cases } from '../data/site';

export type CommandGroup = 'Pages' | 'Cases' | 'Actions';
export type CommandItem = {
  id: string;
  group: CommandGroup;
  label: string;
  href?: string;
  action?: 'copy-email' | 'reduce-motion';
  keywords: string[];
};
const ORDER: CommandGroup[] = ['Pages', 'Cases', 'Actions'];

export function commandItems(): CommandItem[] {
  return [
    { id: 'home', group: 'Pages', label: 'Home', href: '/', keywords: ['start', 'index'] },
    { id: 'work', group: 'Pages', label: 'Work', href: '/work/', keywords: ['cases', 'results', 'projects'] },
    { id: 'about', group: 'Pages', label: 'About', href: '/about/', keywords: ['debating', 'recognition', 'mc'] },
    { id: 'contact', group: 'Pages', label: 'Contact', href: '/contact/', keywords: ['brief', 'email', 'hire', 'get in touch'] },
    { id: 'cv-page', group: 'Pages', label: 'CV page', href: '/cv/', keywords: ['resume', 'recruiter'] },
    ...cases.map((c): CommandItem => ({ id: `case-${c.slug}`, group: 'Cases', label: `${c.org}: ${c.title}`, href: `/work/${c.slug}/`, keywords: [c.org.toLowerCase(), c.slug] })),
    { id: 'download-cv', group: 'Actions', label: 'Download CV', href: site.cv, keywords: ['cv', 'resume', 'pdf'] },
    { id: 'copy-email', group: 'Actions', label: 'Copy email', action: 'copy-email', keywords: ['email', 'mail', 'address'] },
    { id: 'linkedin', group: 'Actions', label: 'LinkedIn', href: site.linkedin, keywords: ['profile', 'social'] },
    { id: 'reduce-motion', group: 'Actions', label: 'Reduce motion', action: 'reduce-motion', keywords: ['animation', 'accessibility', 'motion'] },
  ];
}

function score(item: CommandItem, q: string): number {
  const label = item.label.toLowerCase();
  if (item.keywords.includes(q)) return 4;
  if (label.startsWith(q)) return 3;
  if (label.split(/[\s:,]+/).some((w) => w.startsWith(q)) || item.keywords.some((k) => k.startsWith(q))) return 2;
  if (label.includes(q) || item.keywords.some((k) => k.includes(q))) return 1;
  return 0;
}

export function searchCommands(items: CommandItem[], query: string): CommandItem[] {
  const q = query.trim().toLowerCase();
  const byGroup = (a: CommandItem, b: CommandItem) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group);
  if (!q) return [...items].sort(byGroup);
  return items
    .map((item, i) => ({ item, i, s: score(item, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || ORDER.indexOf(a.item.group) - ORDER.indexOf(b.item.group) || a.i - b.i)
    .map((x) => x.item);
}
