import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { llmsTxt, robotsTxt, sitemapXml, type SitePage, type StateFacts } from './scripts/seo/crawler-files';
import { BODY_CSS, homeBody, jsonLd, jsonScript, llmsFull, readState, stateBody } from './scripts/seo/page-body';
import { guideBody, guideLd, LATER_GUIDES, readGuide } from './scripts/seo/later-pages';
import { STATE_SLUGS } from './src/seo/copy';
import { GUIDE_CYCLE, guidePath, type GuideId } from './src/hosts';
import { held } from './src/seo/faq';
import { isoDate } from './src/seo/format';

// What a shared link shows (the title, description and picture social apps
// read from the HTML itself, before any script runs): one set per page, the
// root and each state's page. Each state's page is a copy of the app shell
// with its own tags, written to dist/2026-11/<state>/ (its address, src/hosts.ts),
// which vercel.json serves for that path. The pictures are
// public/kyb-og/*.png (drawn by scripts/og-images.mjs), each address carrying
// a hash of its picture, so a new picture is fetched fresh, not served from
// a social app's copy of the old one.
const SITE = 'https://govbot-know-your-ballot.vercel.app';
const ogImage = (img: string) => `${SITE}/kyb-og/${img}.png?v=${createHash('sha256').update(readFileSync(`public/kyb-og/${img}.png`)).digest('hex').slice(0, 8)}`;
// Past Election Day (when the site is built) a guide describes the ballot that was.
const HELD = held();
const guideDesc = (what: string, name: string) => HELD
  ? `${what} on the Nov 3, 2026 ${name} ballot, as voters saw it, and who won. Free, open source and non-partisan, built on Govbot.`
  : `${what} on your Nov 3, 2026 ${name} ballot, explained before you vote. Free, open source and non-partisan, built on Govbot.`;
const PAGES: Record<string, { title: string; desc: string; img: string }> = {
  '': { title: 'Govbot Know Your Ballot', desc: 'What’s on your ballot, election by election: every race, judge and question, who’s running, who’s funding them and who won. Illinois, Michigan, Minnesota, Wisconsin, Chicago, Jacksonville and Denver, built on Govbot.', img: 'home' },
  illinois: { title: 'Know Your Illinois Ballot', desc: guideDesc('Every race, judge and question', 'Illinois'), img: 'illinois' },
  michigan: { title: 'Know Your Michigan Ballot', desc: guideDesc('Every race, judge and proposal', 'Michigan'), img: 'michigan' },
  minnesota: { title: 'Know Your Minnesota Ballot', desc: guideDesc('Every race, judge and the amendment', 'Minnesota'), img: 'minnesota' },
  wisconsin: { title: 'Know Your Wisconsin Ballot', desc: guideDesc('Every race and question', 'Wisconsin'), img: 'wisconsin' },
  'wisconsin-2027': { title: 'Know Your Wisconsin Spring Ballot · Apr 6, 2027', desc: 'Wisconsin’s spring 2027 election: an open Supreme Court seat, the Court of Appeals and circuit courts, with a Feb 16 primary only where needed. Who holds each seat, who is running, and the dates. Free, open source and non-partisan, built on Govbot.', img: 'wisconsin-2027' },
  'jacksonville-2027': { title: 'Know Your Jacksonville Ballot · Mar 9, 2027', desc: 'Jacksonville’s Mar 9, 2027 city election: mayor, sheriff, property appraiser, supervisor of elections, tax collector and all 19 City Council seats, with May 18 runoffs where needed. Who holds each seat, who is running, and the dates. Free, open source and non-partisan, built on Govbot.', img: 'jacksonville-2027' },
  'denver-2027': { title: 'Know Your Denver Ballot · Apr 6, 2027', desc: 'Denver’s Apr 6, 2027 city election: mayor, auditor, clerk and recorder and all 13 City Council seats, with Jun 1 runoffs where needed. Who is running, the money behind them and who holds each seat now. Free, open source and non-partisan, built on Govbot.', img: 'denver-2027' },
  'chicago-2027': { title: 'Know Your Chicago Ballot · Feb 23, 2027', desc: 'Chicago’s Feb 23, 2027 city election: mayor, clerk, treasurer, all 50 alderpersons and the police district councils. Every candidate, who holds each seat now and the money behind them. Free, open source and non-partisan, built on Govbot.', img: 'chicago-2027' },
};
/** The guides: where voters confirm their own ballot, per state. */
const STATES = [
  { slug: 'illinois', name: 'Illinois', portal: { name: 'Illinois State Board of Elections voter lookup', url: 'https://ova.elections.il.gov/RegistrationLookup.aspx' } },
  { slug: 'michigan', name: 'Michigan', portal: { name: 'Michigan.gov/vote', url: 'https://www.michigan.gov/vote' } },
  { slug: 'minnesota', name: 'Minnesota', portal: { name: 'Minnesota Voter Information Portal', url: 'https://mnvotes.sos.mn.gov/' } },
  { slug: 'wisconsin', name: 'Wisconsin', portal: { name: 'MyVote Wisconsin', url: 'https://myvote.wi.gov/' } },
];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const metaFor = (page: string) => {
  const { title, desc, img } = PAGES[page];
  const url = page ? `${SITE}${guidePath(page as GuideId)}` : `${SITE}/`;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Govbot Know Your Ballot" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${ogImage(img)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${ogImage(img)}" />`,
  ].join('\n    ');
};
const TITLE = /<title>[^<]*<\/title>/;
function siteMeta() {
  let outDir = 'dist';
  return {
    name: 'kyb-site-meta',
    configResolved(c: { build: { outDir: string } }) { outDir = c.build.outDir; },
    transformIndexHtml: (html: string) => html.replace(TITLE, metaFor('')),
    closeBundle() {
      // robots.txt, sitemap.xml and llms.txt, for crawlers and AI assistants.
      const pagesData = STATE_SLUGS.map(readState);
      const states: StateFacts[] = STATES.map((s) => ({ ...s, path: guidePath(s.slug as GuideId), asOf: pagesData.find((p) => p.slug === s.slug)?.asOf }));
      // The later elections' guides (scripts/seo/later-pages.ts).
      const later = LATER_GUIDES.map((g) => { const d = readGuide(g.id); return { g, d, asOf: isoDate(d.sources.candidates.asOf) }; });
      const dates = [...states.map((s) => s.asOf), ...later.map((l) => l.asOf)].filter((d): d is string => !!d).sort();
      const pages: SitePage[] = [{ path: '/', lastmod: dates.at(-1) }, ...states.map((s) => ({ path: guidePath(s.slug as GuideId), lastmod: s.asOf })), ...later.map((l) => ({ path: guidePath(l.g.id), lastmod: l.asOf }))];
      writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt(SITE));
      writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml(SITE, pages));
      writeFileSync(path.join(outDir, 'llms.txt'), llmsTxt(SITE, [...states, ...later.map(({ g, asOf }) => ({ slug: g.id, name: g.short, path: guidePath(g.id), asOf, portal: g.portal, what: g.what }))]));
      writeFileSync(path.join(outDir, 'llms-full.txt'), llmsFull(SITE, pagesData));
      const shell = readFileSync(path.join(outDir, 'index.html'), 'utf8');
      // Each page: its own head tags, structured data, and the readable text inside the root (the app's first render replaces it).
      const readable = (html: string, body: string, ld: unknown) => html.replace('<div id="root"></div>', `<div id="root">${body}</div>`).replace('</head>', `${BODY_CSS}\n    ${jsonScript(ld)}\n  </head>`);
      for (const page of Object.keys(PAGES).filter((p) => p && !LATER_GUIDES.some((g) => g.id === p))) {
        const f = pagesData.find((p) => p.slug === page)!;
        mkdirSync(path.join(outDir, GUIDE_CYCLE, page), { recursive: true });
        const html = shell.replace(/<title>[\s\S]*?<meta name="twitter:image"[^>]*>/, metaFor(page));
        writeFileSync(path.join(outDir, GUIDE_CYCLE, page, 'index.html'), readable(html, stateBody(f, SITE, PAGES[page].desc), jsonLd(SITE, f, PAGES[page].desc, pagesData)));
      }
      // Each later election's guide, at its own address.
      for (const { g, d } of later) {
        const dir = path.join(outDir, guidePath(g.id).slice(1));
        mkdirSync(dir, { recursive: true });
        const html = shell.replace(/<title>[\s\S]*?<meta name="twitter:image"[^>]*>/, metaFor(g.id));
        writeFileSync(path.join(dir, 'index.html'), readable(html, guideBody(g, d, SITE, PAGES[g.id].desc), guideLd(g, d, SITE, PAGES[g.id].desc)));
      }
      writeFileSync(path.join(outDir, 'index.html'), readable(shell, homeBody(pagesData, SITE, PAGES[''].desc), jsonLd(SITE, null, PAGES[''].desc, pagesData)));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteMeta()],
});
