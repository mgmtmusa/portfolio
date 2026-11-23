import { describe, expect, it } from 'vitest';
import { briefModel, mailtoHref } from '../../src/lib/brief';

const now = new Date('2026-11-23T10:00:00+11:00');
const full = { who: 'Alex Chen, CMO, Acme', role: 'Head of growth', timeline: 'Decide by January', source: 'LinkedIn' };

describe('briefModel', () => {
  it('lists the filled fields in order with their labels', () => {
    const m = briefModel(full, now);
    expect(m.lines.map((l) => l.label)).toEqual(['Who you are', 'The role or project', 'Timeline', 'How you found me']);
    expect(m.complete).toBe(true);
    expect(m.errors).toEqual({});
    expect(m.replyBy).toBe('Aim to reply by Wednesday 25 November');
  });
  it('skips empty optional fields', () => {
    const m = briefModel({ who: 'Alex', role: 'Growth lead', timeline: '  ', source: '' }, now);
    expect(m.lines.map((l) => l.label)).toEqual(['Who you are', 'The role or project']);
  });
  it('uses the exact error copy for missing required fields', () => {
    const m = briefModel({ who: ' ', role: '' }, now);
    expect(m.complete).toBe(false);
    expect(m.errors.who).toBe('Add who you are so I know who’s writing.');
    expect(m.errors.role).toBe('Add the role or project. A line is enough.');
  });
  it('keeps a 2,000-character role whole', () => {
    const role = 'x'.repeat(2000);
    expect(briefModel({ who: 'A', role }, now).lines[1].text).toHaveLength(2000);
  });
});

describe('mailtoHref', () => {
  it('addresses the email and sets the subject from who you are', () => {
    const href = mailtoHref(briefModel(full, now), 'mgmtmusa@gmail.com');
    expect(href.startsWith('mailto:mgmtmusa@gmail.com?subject=')).toBe(true);
    expect(decodeURIComponent(href.split('subject=')[1].split('&')[0])).toBe('Brief from Alex Chen, CMO, Acme');
  });
  it('survives ampersands, hashes, line breaks and emoji in a round trip', () => {
    const tricky = { who: 'Sam & Co #1 🚀', role: 'Line one\nLine two & more?' };
    const href = mailtoHref(briefModel(tricky, now), 'mgmtmusa@gmail.com');
    const body = decodeURIComponent(href.split('body=')[1]);
    expect(body).toContain('Sam & Co #1 🚀');
    expect(body).toContain('Line one\r\nLine two & more?');
    expect(href).not.toMatch(/\s/);
    expect(href.split('&')).toHaveLength(2);
  });
  it('ends the body with the aim-to-reply-by line', () => {
    const body = decodeURIComponent(mailtoHref(briefModel(full, now), 'm@x.com').split('body=')[1]);
    expect(body.trim().endsWith('Aim to reply by Wednesday 25 November')).toBe(true);
  });
});
