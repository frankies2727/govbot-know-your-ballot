// What a crawler or an AI assistant reads at a later election's guide
// (/2027-02/chicago, /2027-04/wisconsin) before any script runs: every race on
// the ballot with its candidates and who holds the seat, the guide's common
// questions, and the page's structured data. Built from the same data and copy
// the app shows (src/data/<guide>/ballot.json, src/<guide>/), so the page text,
// the FAQ markup and the visible "Common questions" say the same words. No
// recommendations, ratings or adjectives.

import { readFileSync } from 'node:fs';
import { explainOffice as chicagoExplain } from '../../src/chicago-2027/config';
import { ELECTION_DAY as CHICAGO_DAY } from '../../src/chicago-2027/dates';
import { chicagoFaq } from '../../src/chicago-2027/faq';
import type { StateData } from '../../src/guide/types';
import { guidePath, type GuideId } from '../../src/hosts';
import type { Faq } from '../../src/seo/faq';
import { isoDate, longDate } from '../../src/seo/format';
import { explainOffice as springExplain } from '../../src/wisconsin-2027/config';
import { ELECTION_DAY as SPRING_DAY } from '../../src/wisconsin-2027/dates';
import { springFaq } from '../../src/wisconsin-2027/faq';
import { esc } from './page-body';

interface GuidePage {
  id: GuideId;
  /** The page's h1 and its name in the breadcrumbs. */
  heading: string; name: string;
  day: string; hours: string;
  /** The election, for its Event markup, and where. */
  event: string; place: { type: string; name: string };
  /** Who the candidate list is from. */
  listFrom: string;
  /** What the address narrows the page to. */
  narrows: string;
  sections: [title: string, section: string][];
  explain: (office: string) => string;
  faq: (d: StateData) => Faq[];
}

export const LATER_GUIDES: GuidePage[] = [
  {
    id: 'chicago-2027', heading: 'Know Your Chicago Ballot: the Feb 23, 2027 city election', name: 'Know Your Chicago Ballot',
    day: CHICAGO_DAY, hours: '6am to 7pm', event: 'Chicago municipal general election 2027', place: { type: 'City', name: 'Chicago, Illinois' },
    listFrom: 'the Chicago Board of Election Commissioners', narrows: 'your ward and police district',
    sections: [['Citywide: Mayor, City Clerk and City Treasurer', 'city'], ['City Council: alderperson, by ward', 'council'], ['Police District Councils', 'police']],
    explain: chicagoExplain, faq: chicagoFaq,
  },
  {
    id: 'wisconsin-2027', heading: 'Know Your Wisconsin Spring Ballot: Apr 6, 2027', name: 'Know Your Wisconsin Spring Ballot',
    day: SPRING_DAY, hours: '7am to 8pm', event: 'Wisconsin spring election 2027', place: { type: 'AdministrativeArea', name: 'Wisconsin' },
    listFrom: 'the Wikipedia articles on the 2027 Wisconsin elections until the Elections Commission’s list is out', narrows: 'your county and Court of Appeals district',
    sections: [['The Wisconsin Supreme Court', 'state'], ['Court of Appeals and circuit courts', 'judicial']],
    explain: springExplain, faq: springFaq,
  },
];

export const readGuide = (id: GuideId): StateData => JSON.parse(readFileSync(`src/data/${id}/ballot.json`, 'utf8'));

/** The readable page: what's on the ballot, every race and who's running, the questions. */
export function guideBody(g: GuidePage, d: StateData, site: string, desc: string): string {
  const url = `${site}${guidePath(g.id)}`;
  const section = ([title, id]: [string, string]) => {
    const races = d.races.filter((r) => r.section === id);
    if (!races.length) return '';
    return [
      `<h2>${esc(title)}</h2>`,
      ...[...new Set(races.map((r) => g.explain(r.office)))].filter(Boolean).map((t) => `<p>${esc(t)}</p>`),
      ...races.map((r) => {
        const now = r.incumbents?.map((i) => `${i.name}${i.ballot ? ' (running again)' : ''}`).join(', ');
        return `<h3>${esc(r.office)}</h3><p>${r.candidates.length ? `Candidates: ${esc(r.candidates.map((c) => c.name).join('; '))}.` : 'No candidates have filed yet.'}${now ? ` In office now: ${esc(now)}.` : ''}</p>`;
      }),
    ].join('\n');
  };
  return [
    '<main class="kyb-seo">',
    `<h1>${esc(g.heading)}</h1>`,
    `<p>${esc(desc)}</p>`,
    `<p>Election Day: ${esc(longDate(g.day))}, polls open ${g.hours}. Candidates from ${esc(g.listFrom)}, as of ${esc(d.sources.candidates.asOf)}. Enter your address in <a href="${url}">the guide</a> to see just ${esc(g.narrows)}.</p>`,
    ...g.sections.map(section),
    '<h2>Common questions</h2>',
    ...g.faq(d).map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`),
    `<p><a href="${site}/">All elections</a></p>`,
    '</main>',
  ].join('\n');
}

/** Structured data: the page (with its questions), the election and breadcrumbs. */
export function guideLd(g: GuidePage, d: StateData, site: string, desc: string) {
  const url = `${site}${guidePath(g.id)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': `${url}#page`, url, name: g.name, description: desc, inLanguage: 'en', isPartOf: { '@id': `${site}/#website` }, dateModified: isoDate(d.sources.candidates.asOf),
        mainEntity: { '@type': 'FAQPage', mainEntity: g.faq(d).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      },
      { '@type': 'Event', '@id': `${url}#election`, name: g.event, startDate: g.day, endDate: g.day, eventStatus: 'https://schema.org/EventScheduled', location: { '@type': g.place.type, name: g.place.name }, url },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Know Your Ballot', item: `${site}/` }, { '@type': 'ListItem', position: 2, name: g.name, item: url }] },
    ],
  };
}
