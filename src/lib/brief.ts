// The contact brief: the live preview's model and the mailto it composes. No field ever leaves the page
// except inside the visitor's own email.
import { aimToReplyBy, formatReplyBy } from './reply-by';

export type BriefFields = { who: string; role: string; timeline?: string; source?: string };
export type BriefLine = { label: string; text: string };
export type BriefModel = {
  lines: BriefLine[];
  replyBy: string;
  complete: boolean;
  errors: Partial<Record<'who' | 'role', string>>;
};

export const BRIEF_LABELS = { who: 'Who you are', role: 'The role or project', timeline: 'Timeline', source: 'How you found me' } as const;
export const BRIEF_ERRORS = { who: 'Add who you are so I know who’s writing.', role: 'Add the role or project. A line is enough.' } as const;

export function briefModel(f: BriefFields, now: Date): BriefModel {
  const lines: BriefLine[] = [];
  const errors: BriefModel['errors'] = {};
  for (const key of ['who', 'role', 'timeline', 'source'] as const) {
    const text = (f[key] ?? '').trim();
    if (text) lines.push({ label: BRIEF_LABELS[key], text });
    else if (key === 'who' || key === 'role') errors[key] = BRIEF_ERRORS[key];
  }
  return { lines, replyBy: `Aim to reply by ${formatReplyBy(aimToReplyBy(now))}`, complete: Object.keys(errors).length === 0, errors };
}

const crlf = (s: string) => s.replace(/\r?\n/g, '\r\n');

export function mailtoHref(m: BriefModel, email: string): string {
  const who = m.lines.find((l) => l.label === BRIEF_LABELS.who)?.text ?? '';
  const subject = who ? `Brief from ${who}` : 'Brief';
  const body = [...m.lines.map((l) => `${l.label}:\r\n${crlf(l.text)}`), m.replyBy].join('\r\n\r\n');
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
