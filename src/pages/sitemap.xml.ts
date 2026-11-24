import { sitemapXml } from '../lib/meta';
import { site } from '../data/site';

export function GET() {
  return new Response(sitemapXml(site.url), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
