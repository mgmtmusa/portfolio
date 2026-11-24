import { describe, expect, it } from 'vitest';
import { aimToReplyBy, formatReplyBy } from '../../src/lib/reply-by';

// Melbourne is UTC+11 in November (AEDT).
const mel = (iso: string) => new Date(`${iso}+11:00`);

describe('aimToReplyBy: two business days on, Monday to Friday, Melbourne time', () => {
  it('Monday morning gives Wednesday', () => expect(formatReplyBy(aimToReplyBy(mel('2026-11-23T10:00:00')))).toBe('Wednesday 25 November'));
  it('Thursday gives Monday', () => expect(formatReplyBy(aimToReplyBy(mel('2026-11-26T09:00:00')))).toBe('Monday 30 November'));
  it('late Friday in Melbourne gives Tuesday', () => expect(formatReplyBy(aimToReplyBy(mel('2026-11-27T23:30:00')))).toBe('Tuesday 1 December'));
  it('Saturday gives Tuesday', () => expect(formatReplyBy(aimToReplyBy(mel('2026-11-28T12:00:00')))).toBe('Tuesday 1 December'));
  it('Sunday gives Tuesday', () => expect(formatReplyBy(aimToReplyBy(mel('2026-11-29T20:00:00')))).toBe('Tuesday 1 December'));
  it('uses the Melbourne date, not the visitor’s: Friday 14:00 UTC is already Saturday in Melbourne', () =>
    expect(formatReplyBy(aimToReplyBy(new Date('2026-11-27T14:00:00Z')))).toBe('Tuesday 1 December'));
  it('a visitor in London on Monday morning still counts from Melbourne’s Monday evening', () =>
    expect(formatReplyBy(aimToReplyBy(new Date('2026-11-23T08:00:00Z')))).toBe('Wednesday 25 November'));
  it('crosses a year boundary', () => expect(formatReplyBy(aimToReplyBy(mel('2026-12-31T10:00:00')))).toBe('Monday 4 January'));
  it('honours a custom number of business days', () => expect(formatReplyBy(aimToReplyBy(mel('2026-11-23T10:00:00'), 5))).toBe('Monday 30 November'));
});

describe('daylight-saving edges in Melbourne', () => {
  it('Friday 3 April 2026 23:30 (AEDT ends that weekend) gives Tuesday 7 April', () =>
    expect(formatReplyBy(aimToReplyBy(new Date('2026-04-03T23:30:00+11:00')))).toBe('Tuesday 7 April'));
  it('Friday 2 October 2026 (AEDT starts that weekend) gives Tuesday 6 October', () =>
    expect(formatReplyBy(aimToReplyBy(new Date('2026-10-02T12:00:00+10:00')))).toBe('Tuesday 6 October'));
});
