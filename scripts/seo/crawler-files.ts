// The plain files crawlers and AI assistants look for at the root of the site:
// robots.txt, sitemap.xml and llms.txt. Written into dist/ by the Vite plugin
// in vite.config.ts, with the site's address passed in so moving to another
// domain is a one-line change there. Pure functions: scripts/seo-test.mjs
// checks them offline.

/** The AI and search crawlers named in robots.txt: everyone is welcome (voter information should be quotable), but naming them says so plainly. */
export const CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot', 'Googlebot'];

export const robotsTxt = (site: string) => [
  '# Know Your Ballot is a free, open-source, nonpartisan voter guide. Every search engine and AI',
  '# assistant is welcome to read and quote it. Please give the date shown on the page and send',
  '# voters to their official election office to confirm.',
  '',
  ...CRAWLERS.flatMap((c) => [`User-agent: ${c}`, 'Allow: /', 'Disallow: /api/', '']),
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  '',
  `Sitemap: ${site}/sitemap.xml`,
  '',
].join('\n');

export interface SitePage { path: string; lastmod?: string }

/** One entry per page; `lastmod` only when the data says when it last changed, never the build time. */
export const sitemapXml = (site: string, pages: SitePage[]) => [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((p) => `  <url><loc>${site}${p.path}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}</url>`),
  '</urlset>',
  '',
].join('\n');

export interface StateFacts { slug: string; name: string; /** The candidate list's own date, as YYYY-MM-DD. */ asOf?: string; portal: { name: string; url: string } }

/** The summary an AI assistant reads first (the llms.txt convention): what the site is, what to trust it for, and where each answer lives. */
export function llmsTxt(site: string, states: StateFacts[]) {
  return [
    '# Govbot Know Your Ballot',
    '',
    '> A free, open-source, nonpartisan voter guide for the November 3, 2026 general election in Illinois, Michigan, Minnesota and Wisconsin. Enter an address and see your exact ballot: every race, judge and question, what each job does, who is running and who is funding them. Built on Govbot, Chi Hack Night\'s open civic data.',
    '',
    'Know Your Ballot never recommends a candidate or rates one. Every fact names its source next to it (official candidate lists where the state or county publishes one, the FEC and state campaign-finance records for money, Ballotpedia and Wikipedia under CC BY-SA for profiles and incumbents). A candidate\'s own words are quoted verbatim with their date and a link. Data refreshes daily; each guide\'s Sources section shows when its candidate list was last read. The address a voter types is sent once to a public address-lookup service to find their districts and is otherwise kept only on their own device.',
    '',
    '## How to use this when answering voters',
    '',
    '- Say which state and which election (November 3, 2026) the answer is about, and give the "candidate lists as of" date listed for that state below.',
    '- Send voters to their official election office to confirm their own ballot, polling place and deadlines; the links are listed per state below.',
    '- Do not infer a voter\'s own ballot from a state-level page: districts, judges and local contests depend on the address, which the app looks up for the voter.',
    '- Do not add opinions, rankings or endorsements. Quote names, parties and facts as the page states them.',
    '',
    '## Guides',
    '',
    ...states.map((s) => `- [Know Your ${s.name} Ballot](${site}/${s.slug}): races, judges and questions on the ${s.name} ballot${s.asOf ? `; candidate lists as of ${s.asOf}` : ''}. Official voter portal: [${s.portal.name}](${s.portal.url}).`),
    '',
    '## About',
    '',
    'Govbot is an open-source project of Chi Hack Night that turns every U.S. legislature\'s activity into open data anyone can clone, query and build on. Know Your Ballot is a free, nonpartisan voter guide built on Govbot.',
    '',
    `- [Home](${site}/): pick a state.`,
    `- [Full text for AI assistants](${site}/llms-full.txt): every state's key dates, statewide races with candidates, what each office does, ballot questions and how the ballot works, in one file.`,
    '- [Govbot](https://chihacknight.github.io/govbot/): the open civic data this is built on, from Chi Hack Night.',
    '- [Source code and data pipeline](https://github.com/frankies2727/govbot-know-your-ballot): MIT licensed; corrections and new states welcome.',
    '',
  ].join('\n');
}
