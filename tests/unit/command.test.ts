import { describe, expect, it } from 'vitest';
import { commandItems, searchCommands } from '../../src/lib/command';

const items = commandItems();

describe('command menu', () => {
  it('has pages, the three cases and the actions', () => {
    expect(items.filter((i) => i.group === 'Cases')).toHaveLength(3);
    expect(items.find((i) => i.label === 'Download CV')?.href).toBe('/cv/Musa-Walid-CV.pdf');
    expect(items.find((i) => i.label === 'Copy email')?.action).toBe('copy-email');
    expect(items.find((i) => i.label === 'Reduce motion')?.action).toBe('reduce-motion');
    expect(items.find((i) => i.label === 'LinkedIn')?.href).toBe('https://www.linkedin.com/in/musa-abdullah-walid');
  });
  it('returns everything in group order for an empty query', () => {
    const groups = searchCommands(items, '  ').map((i) => i.group);
    expect(groups).toEqual([...groups].sort((a, b) => ['Pages', 'Cases', 'Actions'].indexOf(a) - ['Pages', 'Cases', 'Actions'].indexOf(b)));
    expect(groups).toHaveLength(items.length);
  });
  it('"cv" puts Download CV first', () => expect(searchCommands(items, 'cv')[0].label).toBe('Download CV'));
  it('"evi" finds the Evitech case first', () => expect(searchCommands(items, 'evi')[0].href).toBe('/work/evitech/'));
  it('is case-insensitive and drops non-matches', () => {
    expect(searchCommands(items, 'LINKED')[0].label).toBe('LinkedIn');
    expect(searchCommands(items, 'zzzz')).toEqual([]);
  });
});
