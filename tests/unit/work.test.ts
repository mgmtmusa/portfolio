import { describe, expect, it } from 'vitest';
import { caseNav, closeHref, countText, isWorkIndex, slideDirection, slugFromPath, tagId, tagsForCase, workTags, yearChip } from '../../src/lib/work';
import { capabilities, cases } from '../../src/data/site';
import { countByTag } from '../../src/lib/filters';

const slugs = cases.map((c) => c.slug);

describe('tags', () => {
  it('makes stable ids from capability titles', () => {
    expect(tagId('Brand, events and teams')).toBe('brand-events-and-teams');
    expect(tagId('CRM and automation')).toBe('crm-and-automation');
  });
  it('derives one tag per capability that maps to a case', () => {
    expect(workTags(capabilities).map((t) => t.label)).toEqual(capabilities.map((c) => c.t));
  });
  it('tags each case from the capability mapping', () => {
    expect(tagsForCase('evitech', capabilities)).toEqual(['performance-marketing', 'analytics-and-reporting', 'crm-and-automation']);
    expect(tagsForCase('i-heart-uni', capabilities)).toEqual(['brand-events-and-teams']);
    expect(tagsForCase('the-lil-project', capabilities)).toEqual(['brand-events-and-teams']);
  });
  it('counts cases per tag, all first', () => {
    const items = slugs.map((s) => ({ tags: tagsForCase(s, capabilities) }));
    expect(countByTag(items)).toEqual([
      { tag: 'all', count: 3 },
      { tag: 'performance-marketing', count: 1 },
      { tag: 'analytics-and-reporting', count: 1 },
      { tag: 'crm-and-automation', count: 1 },
      { tag: 'brand-events-and-teams', count: 2 },
    ]);
  });
});

describe('yearChip', () => {
  it('keeps years and "now" only', () => {
    expect(yearChip('January 2023 to now')).toBe('2023 to now');
    expect(yearChip('February 2021 to now')).toBe('2021 to now');
    expect(yearChip('May 2023 to November 2025')).toBe('2023 to 2025');
  });
  it('collapses a single year', () => {
    expect(yearChip('March 2020 to June 2020')).toBe('2020');
    expect(yearChip('2020')).toBe('2020');
  });
});

describe('caseNav', () => {
  it('counts from one and wraps both ways', () => {
    expect(caseNav('evitech', slugs)).toEqual({ index: 1, total: 3, counter: '1 of 3', prev: 'the-lil-project', next: 'i-heart-uni' });
    expect(caseNav('the-lil-project', slugs)).toMatchObject({ counter: '3 of 3', prev: 'i-heart-uni', next: 'evitech' });
  });
  it('throws on an unknown slug', () => {
    expect(() => caseNav('nope', slugs)).toThrow();
  });
});

describe('paths', () => {
  it('reads the slug from a case path', () => {
    expect(slugFromPath('/work/evitech/', slugs)).toBe('evitech');
    expect(slugFromPath('/work/i-heart-uni', slugs)).toBe('i-heart-uni');
    expect(slugFromPath('/work/', slugs)).toBeNull();
    expect(slugFromPath('/work/unknown/', slugs)).toBeNull();
    expect(slugFromPath('/about/', slugs)).toBeNull();
  });
  it('recognises the index', () => {
    expect(isWorkIndex('/work/')).toBe(true);
    expect(isWorkIndex('/work')).toBe(true);
    expect(isWorkIndex('/work/evitech/')).toBe(false);
  });
  it('closes to the case on the index', () => {
    expect(closeHref('evitech')).toBe('/work/#case-evitech');
  });
});

describe('slideDirection', () => {
  it('slides forward to the next case and back to the previous, across the wrap', () => {
    expect(slideDirection('evitech', 'i-heart-uni', slugs)).toBe('forward');
    expect(slideDirection('i-heart-uni', 'evitech', slugs)).toBe('back');
    expect(slideDirection('the-lil-project', 'evitech', slugs)).toBe('forward');
    expect(slideDirection('evitech', 'the-lil-project', slugs)).toBe('back');
  });
  it('falls back to list order for cases that are not neighbours', () => {
    const five = ['a', 'b', 'c', 'd', 'e'];
    expect(slideDirection('a', 'c', five)).toBe('forward');
    expect(slideDirection('d', 'b', five)).toBe('back');
  });
});

describe('countText', () => {
  it('says how many cases show', () => {
    expect(countText(2, 3)).toBe('2 of 3 cases');
    expect(countText(1, 1)).toBe('1 of 1 case');
  });
});

import { resultGroups, noteRegistry } from '../../src/lib/work';
import { growthWork } from '../../src/data/site';

describe('resultGroups', () => {
  it('groups results that share a growth-work note', () => {
    const ev = resultGroups('evitech', cases[0].results, growthWork);
    expect(ev.map((g) => g.results.map((r) => r.v))).toEqual([['28%', '65%'], ['80%'], ['2.6×']]);
    expect(ev[0].note).toBe('Two results from the same initiative.');
    expect(ev[1].note).toBeUndefined();
    const ihu = resultGroups('i-heart-uni', cases[1].results, growthWork);
    expect(ihu.map((g) => g.results.map((r) => r.v))).toEqual([['18', '70%'], ['5']]);
    expect(ihu[0].note).toBe('These outcomes overlap with the organic audience growth work.');
  });
});

describe('noteRegistry', () => {
  it('keeps one number per note and a unique id per marker', () => {
    const r = noteRegistry('fn-x');
    const a = r.mark('A'), b = r.mark('B'), a2 = r.mark('A');
    expect([a.n, b.n, a2.n]).toEqual([1, 2, 1]);
    expect(new Set([a.id, b.id, a2.id]).size).toBe(3);
    expect(r.list().map((x) => x.note)).toEqual(['A', 'B']);
  });
});
