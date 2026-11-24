// /llms.txt: the facts of this site in plain text for AI assistants, generated from src/data/site.ts.
import { llmsText } from '../lib/meta';
import { site } from '../data/site';

export function GET() {
  return new Response(llmsText(site.url), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
