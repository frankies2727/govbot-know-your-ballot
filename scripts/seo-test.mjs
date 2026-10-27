// Offline check of scripts/seo/crawler-files.ts and of the built dist/:
// node --experimental-strip-types scripts/seo-test.mjs   (after npm run build)
import { existsSync, readFileSync } from 'node:fs';
import { CRAWLERS, isoDate, llmsTxt, robotsTxt, sitemapXml } from './seo/crawler-files.ts';

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
  console.log('dist checks ok');
}
console.log('seo self-test ok');
