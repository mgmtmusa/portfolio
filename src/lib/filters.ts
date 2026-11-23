// Work index filter chips: counts per tag (all first) and filtering.

export function countByTag<T extends { tags: string[] }>(items: T[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const i of items) for (const t of i.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [{ tag: 'all', count: items.length }, ...[...counts].map(([tag, count]) => ({ tag, count }))];
}

export function filterByTag<T extends { tags: string[] }>(items: T[], tag: string): T[] {
  return tag === 'all' ? items : items.filter((i) => i.tags.includes(tag));
}
