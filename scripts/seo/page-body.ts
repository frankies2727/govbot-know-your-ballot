// What a crawler or an AI assistant reads in each page before any script runs,
// and the structured data in its <head>. Built from the same sourced data and
// copy the app shows (src/data/<state>/ballot.json, the offices' plain-English
// explainers, the key dates, src/seo/copy.ts and src/seo/faq.ts), so the text
// in the page, the FAQ markup and the visible "Common questions" section say
// the same words. The text sits inside <div id="root">; the app's first render
// replaces it, exactly as it replaces the loading screen.
//
// Candidates keep the data's own order. No recommendations, ratings or adjectives.

import { readFileSync } from 'node:fs';
import { NOV_3 } from '../../src/dates';
import { explainOffice as ilExplain } from '../../src/offices';
import { explainOffice as miExplain } from '../../src/michigan/config';
import { explainOffice as mnExplain } from '../../src/minnesota/config';
import { explainOffice as wiExplain } from '../../src/wisconsin/config';
import { KEY_DATES as MI_DATES } from '../../src/michigan/dates';
import { KEY_DATES as MN_DATES } from '../../src/minnesota/dates';
import { KEY_DATES as WI_DATES } from '../../src/wisconsin/dates';
import { HOW, PORTAL, STATE_NAMES, STATE_SLUGS, type StateSlug } from '../../src/seo/copy';
import { ELECTION_DAY, faqDates, faqFor, headlineRaces, homeFaq, statewideMeasures, type Faq } from '../../src/seo/faq';
import { aOrAn, isoDate, longDate, shortDate } from '../../src/seo/format';
import type { Measure, Race } from '../../src/types';

const EXPLAIN: Record<StateSlug, (office: string) => string> = { illinois: ilExplain, michigan: miExplain, minnesota: mnExplain, wisconsin: wiExplain };
const DATES = { illinois: NOV_3, michigan: MI_DATES, minnesota: MN_DATES, wisconsin: WI_DATES };

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** JSON for a <script type="application/ld+json">: "<" is escaped so no text can close the tag. */
export const jsonScript = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

export interface StatePage { slug: StateSlug; name: string; races: Race[]; measures: Measure[]; asOf?: string; faq: Faq[] }

/** One state's data and the questions made from it. */
export function readState(slug: StateSlug): StatePage {
  const d = JSON.parse(readFileSync(`src/data/${slug}/ballot.json`, 'utf8'));
  const asOf = isoDate(d.sources?.candidates?.asOf);
  const faq = faqFor({ slug, races: d.races, measures: d.measures, asOf, explainOffice: EXPLAIN[slug], keyDates: faqDates(DATES[slug]) });
  return { slug, name: STATE_NAMES[slug], races: d.races, measures: d.measures, asOf, faq };
}

const officeLabel = (office: string) => office.replace(/\s*\(\d+ seats?\)\s*$/i, '');
const candidate = (c: Race['candidates'][number]) => `${esc(c.name)}${c.party ? `, ${esc(c.party)}` : ''}${c.incumbent ? ' (incumbent)' : ''}`;

function raceHtml(r: Race, explain: (o: string) => string) {
  const job = explain(r.office);
  return `<h3>${esc(officeLabel(r.office))}</h3>${job ? `<p>${esc(job)}</p>` : ''}<ul>${r.candidates.map((c) => `<li>${candidate(c)}</li>`).join('')}</ul>`;
}

/** The readable page for a state. */
export function stateBody(f: StatePage, site: string, desc: string): string {
  const { slug, name } = f;
  const explain = EXPLAIN[slug];
  const heads = headlineRaces(f.races);
  const others = f.races.filter((r) => !r.area && !heads.includes(r) && r.section !== 'county' && !(slug === 'illinois' && r.section === 'judicial'));
  return [
    '<main class="kyb-seo">',
    `<h1>Know Your ${esc(name)} Ballot</h1>`,
    `<p>${esc(desc)}</p>`,
    `<p>${esc(name)} general election: ${longDate(ELECTION_DAY)}.${f.asOf ? ` Candidate lists as of ${f.asOf}.` : ''} Confirm your own ballot at <a href="${PORTAL[slug].url}">${esc(PORTAL[slug].name)}</a>.</p>`,
    '<h2>Key dates</h2><dl>',
    ...faqDates(DATES[slug]).map((d) => `<dt>${shortDate(d.date)}${d.only ? ` (${esc(d.only)})` : ''}</dt><dd>${esc(d.title)}.${d.detail ? ` ${esc(d.detail)}` : ''}</dd>`),
    '</dl>',
    `<h2>The statewide races in ${esc(name)}</h2>`,
    ...heads.map((r) => raceHtml(r, explain)),
    ...(others.length ? [`<h2>Other statewide contests</h2>`, ...others.map((r) => raceHtml(r, explain))] : []),
    ...(statewideMeasures(f.measures).length ? ['<h2>Statewide ballot questions</h2>', ...statewideMeasures(f.measures).map((m) => `<h3>${esc(m.title)}</h3><p>${esc(m.question)}</p>${m.plain ? `<p>${esc(m.plain)}</p>` : ''}`)] : []),
    `<h2>How ${aOrAn(name)} ${esc(name)} ballot works</h2>`,
    ...HOW[slug].map((i) => `<p><strong>${esc(i.lead)}</strong> ${esc(i.text)}</p>`),
    '<h2>Common questions</h2>',
    ...f.faq.map((x) => `<h3>${esc(x.q)}</h3><p>${esc(x.a)}</p>`),
    `<p>Enter your address in the guide to see your own ballot, including your district's races and judges. <a href="${site}/">All states</a> · ${STATE_SLUGS.filter((s) => s !== slug).map((s) => `<a href="${site}/${s}">${STATE_NAMES[s]}</a>`).join(' · ')}</p>`,
    '</main>',
  ].join('\n');
}

/** The readable home page. */
export function homeBody(states: StatePage[], site: string, desc: string): string {
  return [
    '<main class="kyb-seo">',
    '<h1>Govbot Know Your Ballot</h1>',
    `<p>${esc(desc)}</p>`,
    '<h2>Pick your state</h2><ul>',
    ...states.map((s) => `<li><a href="${site}/${s.slug}">Know Your ${esc(s.name)} Ballot</a>${s.asOf ? `, candidate lists as of ${s.asOf}` : ''}</li>`),
    '</ul>',
    '<h2>Common questions</h2>',
    ...homeFaq().map((x) => `<h3>${esc(x.q)}</h3><p>${esc(x.a)}</p>`),
    '</main>',
  ].join('\n');
}

/** Plain styling for the readable text, in the dark of the loading screen it sits in front of; gone with the first render. */
export const BODY_CSS = '<style>.kyb-seo{box-sizing:border-box;max-width:46rem;margin:0 auto;padding:2rem 1rem;background:#0a0a0a;color:#f3f3f3;font:16px/1.55 system-ui,sans-serif}.kyb-seo a{color:#8ab4ff}.kyb-seo h1{font-size:2rem;line-height:1.15}.kyb-seo h2{font-size:1.35rem;margin-top:2rem}.kyb-seo h3{font-size:1.05rem}body{margin:0;background:#0a0a0a}</style>';

/** Structured data: the site and organization on the home page; the page, the election, breadcrumbs and the questions on a state page. */
export function jsonLd(site: string, f: StatePage | null, desc: string, states: StatePage[]) {
  const website = { '@type': 'WebSite', '@id': `${site}/#website`, name: 'Govbot Know Your Ballot', url: `${site}/`, description: desc, inLanguage: 'en' };
  const org = {
    '@type': 'Organization', '@id': `${site}/#org`, name: 'Govbot Know Your Ballot', url: `${site}/`,
    sameAs: ['https://github.com/frankies2727/govbot-know-your-ballot', 'https://chihacknight.github.io/govbot/'],
  };
  if (!f) {
    return { '@context': 'https://schema.org', '@graph': [website, org, { '@type': 'WebPage', '@id': `${site}/`, url: `${site}/`, name: 'Govbot Know Your Ballot', description: desc, isPartOf: { '@id': `${site}/#website` }, mainEntity: { '@type': 'FAQPage', mainEntity: homeFaq().map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) } }, { '@type': 'ItemList', name: 'State guides', itemListElement: states.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: `Know Your ${s.name} Ballot`, url: `${site}/${s.slug}` })) }] };
  }
  const url = `${site}/${f.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      website, org,
      {
        '@type': 'WebPage', '@id': url, url, name: `Know Your ${f.name} Ballot`, description: desc, isPartOf: { '@id': `${site}/#website` }, inLanguage: 'en',
        ...(f.asOf ? { dateModified: f.asOf } : {}), about: { '@id': `${url}#election` },
        mainEntity: { '@type': 'FAQPage', mainEntity: f.faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) },
      },
      { '@type': 'Event', '@id': `${url}#election`, name: `${f.name} general election 2026`, startDate: ELECTION_DAY, endDate: ELECTION_DAY, eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'AdministrativeArea', name: f.name }, url },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Know Your Ballot', item: `${site}/` }, { '@type': 'ListItem', position: 2, name: `Know Your ${f.name} Ballot`, item: url }] },
    ],
  };
}

/** The long summary for AI assistants: everything the readable pages say, for all four states, in one Markdown file. */
export function llmsFull(site: string, states: StatePage[]): string {
  const out = ['# Govbot Know Your Ballot: full text', '', '> The same facts as each state\'s guide, in one file, for AI assistants. Candidate lists are as of the dates given; voters should confirm their own ballot with the official portal named for their state. Know Your Ballot never recommends or rates a candidate.', ''];
  for (const f of states) {
    out.push(`## ${f.name}`, '', `Guide: ${site}/${f.slug}`, `Election: ${longDate(ELECTION_DAY)}.${f.asOf ? ` Candidate lists as of ${f.asOf}.` : ''}`, `Official portal: ${PORTAL[f.slug].name}, ${PORTAL[f.slug].url}`, '', '### Key dates', '');
    out.push(...faqDates(DATES[f.slug]).map((d) => `- ${shortDate(d.date)}${d.only ? ` (${d.only})` : ''}: ${d.title}.${d.detail ? ` ${d.detail}` : ''}`), '', '### The statewide races', '');
    for (const r of headlineRaces(f.races)) {
      const job = EXPLAIN[f.slug](r.office);
      out.push(`#### ${officeLabel(r.office)}`, '', ...(job ? [job, ''] : []), ...r.candidates.map((c) => `- ${c.name}${c.party ? `, ${c.party}` : ''}${c.incumbent ? ' (incumbent)' : ''}`), '');
    }
    if (statewideMeasures(f.measures).length) out.push('### Statewide ballot questions', '', ...statewideMeasures(f.measures).flatMap((m) => [`#### ${m.title}`, '', m.question, ...(m.plain ? ['', m.plain] : []), '']));
    out.push(`### How ${aOrAn(f.name)} ${f.name} ballot works`, '', ...HOW[f.slug].map((i) => `- ${i.lead} ${i.text}`), '');
  }
  return out.join('\n');
}
