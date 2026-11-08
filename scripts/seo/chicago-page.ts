// What a crawler or an AI assistant reads at /2027-02/chicago before any script
// runs: every race on Chicago's Feb 23, 2027 ballot with its candidates (in the
// Board's ballot order) and who holds the seat, the guide's common questions,
// and the page's structured data. Built from the same data and copy the app
// shows (src/data/chicago-2027/ballot.json, src/chicago-2027/), so the page
// text, the FAQ markup and the visible "Common questions" say the same words.
// No recommendations, ratings or adjectives.

import { readFileSync } from 'node:fs';
import { explainOffice } from '../../src/chicago-2027/config';
import { ELECTION_DAY } from '../../src/chicago-2027/dates';
import { chicagoFaq } from '../../src/chicago-2027/faq';
import type { StateData } from '../../src/guide/types';
import { guidePath } from '../../src/hosts';
import { isoDate, longDate } from '../../src/seo/format';
import { esc } from './page-body';

export function readChicago(): StateData {
  return JSON.parse(readFileSync('src/data/chicago-2027/ballot.json', 'utf8'));
}

/** The readable page: what's on the ballot, every race and who's running, the questions. */
export function chicagoBody(d: StateData, site: string, desc: string): string {
  const url = `${site}${guidePath('chicago-2027')}`;
  const section = (title: string, id: string) => {
    const races = d.races.filter((r) => r.section === id);
    return [
      `<h2>${esc(title)}</h2>`,
      `<p>${esc(explainOffice(races[0].office))}</p>`,
      ...races.map((r) => {
        const now = r.incumbents?.map((i) => `${i.name}${i.ballot ? ' (running again)' : ''}`).join(', ');
        return `<h3>${esc(r.office)}</h3><p>${r.candidates.length ? `Candidates: ${esc(r.candidates.map((c) => c.name).join('; '))}.` : 'No candidates filed.'}${now ? ` In office now: ${esc(now)}.` : ''}</p>`;
      }),
    ].join('\n');
  };
  return [
    '<main class="kyb-seo">',
    '<h1>Know Your Chicago Ballot: the Feb 23, 2027 city election</h1>',
    `<p>${esc(desc)}</p>`,
    `<p>Election Day: ${esc(longDate(ELECTION_DAY))}, polls open 6am to 7pm. Candidate list from the Chicago Board of Election Commissioners, as of ${esc(d.sources.candidates.asOf)}. Enter your address in <a href="${url}">the guide</a> to see just your ward and police district.</p>`,
    section('Citywide: Mayor, City Clerk and City Treasurer', 'city'),
    section('City Council: alderperson, by ward', 'council'),
    section('Police District Councils', 'police'),
    '<h2>Common questions</h2>',
    ...chicagoFaq(d).map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`),
    `<p><a href="${site}/">All elections</a></p>`,
    '</main>',
  ].join('\n');
}

/** Structured data: the page, the election, breadcrumbs and the questions. */
export function chicagoLd(d: StateData, site: string, desc: string) {
  const url = `${site}${guidePath('chicago-2027')}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': `${url}#page`, url, name: 'Know Your Chicago Ballot', description: desc, inLanguage: 'en', isPartOf: { '@id': `${site}/#website` }, dateModified: isoDate(d.sources.candidates.asOf),
        mainEntity: { '@type': 'FAQPage', mainEntity: chicagoFaq(d).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      },
      { '@type': 'Event', '@id': `${url}#election`, name: 'Chicago municipal general election 2027', startDate: ELECTION_DAY, endDate: ELECTION_DAY, eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'City', name: 'Chicago, Illinois' }, url },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Know Your Ballot', item: `${site}/` }, { '@type': 'ListItem', position: 2, name: 'Know Your Chicago Ballot', item: url }] },
    ],
  };
}
