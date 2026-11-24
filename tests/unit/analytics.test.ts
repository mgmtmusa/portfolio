import { describe, expect, it } from 'vitest';
import { safeProps } from '../../src/lib/analytics';

describe('analytics properties', () => {
  it('keeps only slug, from and key', () =>
    expect(safeProps({ slug: 'evitech', from: 'home', key: 'acme', who: 'Alex', role: 'CMO', email: 'a@b.c' })).toEqual({ slug: 'evitech', from: 'home', key: 'acme' }));
  it('caps values at 64 characters and drops empties', () => {
    expect(safeProps({ from: 'x'.repeat(200) }).from).toHaveLength(64);
    expect(safeProps({ slug: '' })).toEqual({});
  });
});
