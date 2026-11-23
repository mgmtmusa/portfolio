import { describe, expect, it } from 'vitest';
import { countByTag, filterByTag } from '../../src/lib/filters';

const items = [
  { id: 'a', tags: ['Performance marketing', 'Analytics and reporting'] },
  { id: 'b', tags: ['Brand, events and teams'] },
  { id: 'c', tags: ['Brand, events and teams', 'Performance marketing'] },
];

describe('filters', () => {
  it('counts all first, then each tag in first-seen order', () =>
    expect(countByTag(items)).toEqual([
      { tag: 'all', count: 3 },
      { tag: 'Performance marketing', count: 2 },
      { tag: 'Analytics and reporting', count: 1 },
      { tag: 'Brand, events and teams', count: 2 },
    ]));
  it('filters by tag and returns everything for all', () => {
    expect(filterByTag(items, 'Brand, events and teams').map((i) => i.id)).toEqual(['b', 'c']);
    expect(filterByTag(items, 'all')).toHaveLength(3);
    expect(filterByTag(items, 'Unknown')).toEqual([]);
  });
});
