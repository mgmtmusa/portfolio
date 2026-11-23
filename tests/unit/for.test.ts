import { describe, expect, it } from 'vitest';
import { forPages, type ForPage } from '../../src/data/for';

const config: ForPage[] = [
  { key: 'acme', company: 'Acme', intro: 'x', leadCase: 'evitech', ogTitle: 'y' },
  { key: 'example', company: 'Example (fake)', intro: 'x', leadCase: 'evitech', ogTitle: 'y', example: true },
];

describe('/for/<key>/ pages', () => {
  it('drops example keys in production', () => expect(forPages('production', config).map((p) => p.key)).toEqual(['acme']));
  it('keeps them in previews and locally', () => {
    expect(forPages('preview', config)).toHaveLength(2);
    expect(forPages(undefined, config)).toHaveLength(2);
  });
  it('ships exactly one example key by default, and it is marked fake', () => {
    const all = forPages(undefined);
    expect(all).toHaveLength(1);
    expect(all[0].example).toBe(true);
    expect(forPages('production')).toEqual([]);
  });
});
