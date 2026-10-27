// Offline check of scripts/seo/crawler-files.ts and of the built dist/, after npm run build:
// npx esbuild scripts/seo-test.mjs --bundle --platform=node --format=esm --outfile=/tmp/seo-test.mjs && node /tmp/seo-test.mjs
import { existsSync, readFileSync } from 'node:fs';
import { CRAWLERS, llmsTxt, robotsTxt, sitemapXml } from './seo/crawler-files.ts';
import { isoDate } from '../src/seo/format.ts';

const eq = (g, w, m) => { if (JSON.stringify(g) !== JSON.stringify(w)) throw new Error(`${m}: ${JSON.stringify(g)} !== ${JSON.stringify(w)}`); };
const ok = (c, m) => { if (!c) throw new Error(m); };

eq([isoDate('2026-10-26'), isoDate('9/11/2026 3:47:15 PM'), isoDate('1/2/2027'), isoDate('soon'), isoDate(undefined)], ['2026-10-26', '2026-09-11', '2027-01-02', undefined, undefined], 'isoDate');
const site = 'https://example.test';
const robots = robotsTxt(site);
ok(robots.includes(`Sitemap: ${site}/sitemap.xml`) && robots.includes('User-agent: GPTBot') && robots.includes('User-agent: ClaudeBot') && robots.includes('Disallow: /api/'), 'robots names crawlers, hides /api/, links the sitemap');
ok(!/Disallow: \/\s*$/m.test(robots), 'robots never blocks the whole site');
ok(CRAWLERS.every((c) => robots.includes(`User-agent: ${c}`)), 'every named crawler is listed');
const xml = sitemapXml(site, [{ path: '/', lastmod: '2026-10-26' }, { path: '/minnesota' }]);
ok(xml.includes(`<loc>${site}/</loc><lastmod>2026-10-26</lastmod>`) && xml.includes(`<loc>${site}/minnesota</loc></url>`), 'sitemap: lastmod only when known');
const llms = llmsTxt(site, [{ slug: 'minnesota', name: 'Minnesota', asOf: '2026-10-26', portal: { name: 'Portal', url: 'https://p.test/' } }]);
ok(llms.startsWith('# Govbot Know Your Ballot\n\n> ') && llms.includes(`[Know Your Minnesota Ballot](${site}/minnesota)`) && llms.includes('as of 2026-10-26'), 'llms.txt shape');

// The built site, when there is one.
if (existsSync('dist/index.html')) {
  const dist = (f) => readFileSync(`dist/${f}`, 'utf8');
  const site = 'https://govbot-know-your-ballot.vercel.app';
  ok(dist('robots.txt').includes(`Sitemap: ${site}/sitemap.xml`), 'dist/robots.txt');
  const locs = [...dist('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  eq(locs, [`${site}/`, ...['illinois', 'michigan', 'minnesota', 'wisconsin'].map((s) => `${site}/${s}`)], 'dist/sitemap.xml pages');
  for (const l of locs) { const page = l === `${site}/` ? 'index.html' : `${l.slice(site.length + 1)}/index.html`; ok(existsSync(`dist/${page}`) && dist(page).includes(`<link rel="canonical" href="${l}" />`), `canonical of ${l} equals itself`); }
  ok(/lastmod>\d{4}-\d{2}-\d{2}</.test(dist('sitemap.xml')), 'sitemap has real dates');
  ok(dist('llms.txt').includes('Wisconsin') && !dist('llms.txt').includes('undefined'), 'dist/llms.txt');
  // Each page's readable text and structured data.
  const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  for (const page of ['index.html', 'illinois/index.html', 'michigan/index.html', 'minnesota/index.html', 'wisconsin/index.html']) {
    const html = dist(page);
    const root = html.slice(html.indexOf('<div id="root">'), html.indexOf('</main>') + 7);
    ok(root.includes('<main class="kyb-seo">') && /<h1>[^<]+<\/h1>/.test(root), `${page}: readable text and an h1 inside the root`);
    ok(html.length < 70_000 && !html.includes('undefined') && !root.includes('[object'), `${page}: size and no undefined`);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    ok(blocks.length === 1 && blocks[0]['@context'] === 'https://schema.org', `${page}: one parseable JSON-LD block`);
    const text = decode(root.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
    const faq = blocks[0]['@graph'].flatMap((n) => (n.mainEntity?.['@type'] === 'FAQPage' ? n.mainEntity.mainEntity : []));
    ok(faq.length >= 2, `${page}: FAQ markup present`);
    for (const f of faq) ok(text.includes(f.name.replace(/\s+/g, ' ')) && text.includes(f.acceptedAnswer.text.replace(/\s+/g, ' ')), `${page}: FAQ "${f.name}" appears verbatim in the page text`);
    if (page !== 'index.html') {
      const types = blocks[0]['@graph'].map((n) => n['@type']);
      ok(['WebPage', 'Event', 'BreadcrumbList'].every((t) => types.includes(t)), `${page}: page, election and breadcrumb markup`);
    }
  }
  const full = dist('llms-full.txt');
  ok(['Illinois', 'Michigan', 'Minnesota', 'Wisconsin'].every((s) => full.includes(`## ${s}`)) && !full.includes('undefined') && dist('llms.txt').includes('llms-full.txt'), 'llms-full.txt covers every state and is linked');
  console.log('dist checks ok');
}
console.log('seo self-test ok');
