// /llms.txt: the facts of this site in plain text for AI assistants, generated from src/data/site.ts.
import { site, cases, growthWork, career, approach, recognition, experience, capabilities } from '../data/site';

const scoped = (r: { v: string; l: string; scope?: string }) => `${r.v} ${r.l}${r.scope ? ` (${r.scope})` : ''}`;

export function GET() {
  const url = (p: string) => new URL(p, site.url).href;
  const body = [
    `# ${site.name}`,
    '',
    `> ${site.name} is a ${site.role} in ${site.city}. He came to marketing from sales, and judges marketing by what closes.`,
    '',
    '## Facts',
    `- Role: ${site.role}, ${site.city}`,
    `- Availability: ${site.availability}`,
    `- Work rights: ${site.workRights}`,
    `- Reply time: ${site.replyTime.text} Business days are Monday to Friday, Melbourne time.`,
    `- Contact: ${site.email} or ${site.linkedin}`,
    `- CV: ${url(site.cv)}`,
    '',
    '## Case studies',
    ...cases.map((c) => `- [${c.org}: ${c.title}](${url(`/work/${c.slug}/`)}): ${c.summary} Results: ${c.results.map(scoped).join('; ')}.`),
    '',
    '## Selected growth work',
    ...growthWork.map((g) => `- ${g.t} (${g.org}): ${g.did} ${g.results.map(scoped).join('; ')}.${g.note ? ` ${g.note}` : ''}`),
    '',
    '## Career at Evitech',
    ...career.map((r) => `- ${r.when}, ${r.t}: ${r.d}`),
    '',
    '## How he works',
    ...approach.map((a) => `- ${a.t}: ${a.d}`),
    '',
    '## Other experience',
    ...experience.filter((e) => !e.case).map((e) => `- ${e.when}, ${e.role}, ${e.org}${e.note ? `: ${e.note}` : ''}`),
    '',
    '## Capabilities',
    ...capabilities.map((c) => `- ${c.t}: ${c.items}`),
    '',
    '## Recognition',
    ...recognition.map((r) => `- ${r.t}, ${r.when}: ${r.d}`),
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
