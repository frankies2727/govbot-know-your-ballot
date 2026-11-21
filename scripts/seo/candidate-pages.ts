// A page for every candidate in every guide, written at their own address
// (/2027-02/chicago/candidates/mayor/john-kelly, src/lib/candidateLink.ts):
// what a search engine or an AI assistant reads there before any script runs,
// and its structured data. Everything is the guide's own sourced data
// (src/data/<guide>/ballot.json), each fact with its source beside it: who
// they are and what they're running for, the money from official filings,
// outside spending, their own words verbatim, endorsements, their record in
// office, ratings and links, then everyone else in the race. In the browser
// the app replaces the text and opens the same candidate's profile.
//
// No recommendations, ratings of our own or adjectives.

import { candidatePath } from '../../src/lib/candidateLink';
import { guidePath, type GuideId } from '../../src/hosts';
import { longDate } from '../../src/seo/format';
import type { Candidate, Race } from '../../src/types';
import { esc } from './page-body';

export interface CandidateGuide {
  id: GuideId;
  /** "Know Your Chicago Ballot". */
  guideName: string;
  /** "Chicago's city election", "the Illinois general election". */
  election: string;
  /** YYYY-MM-DD. */
  day: string;
  /** The candidate list's date, YYYY-MM-DD. */
  asOf?: string;
  races: Race[];
  explain: (office: string) => string;
  portal: { name: string; url: string };
}

export interface CandidatePage { path: string; title: string; desc: string; body: string; ld: unknown; lastmod?: string }

const MONEY_SOURCE: Record<string, string> = {
  FEC: 'Federal Election Commission', ISBE: 'Illinois State Board of Elections', MiTN: 'Michigan Bureau of Elections (MiTN)',
  MNCFB: 'Minnesota Campaign Finance Board', WISC: 'Wisconsin Ethics Commission', DSL: 'Denver SearchLight',
};
const SOCIAL: Record<string, string> = { x: 'X (Twitter)', facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok', bluesky: 'Bluesky', threads: 'Threads', linkedin: 'LinkedIn' };
/** A real party, not the lists' "no party" placeholders. */
const partyOf = (c: Candidate) => (c.party && !/^(no party|nonpartisan|unaffiliated|$)/i.test(c.party) ? c.party : '');
const dollars = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const isIncumbent = (race: Race, c: Candidate) => Boolean(c.incumbent || race.incumbents?.some((i) => i.ballot === c.ballot));
const office = (r: Race) => r.office.replace(/\s*\(\d+ seats?\)\s*$/i, '');
/** "chicagopolitics.org" from a link. */
const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'another site'; } };
const a = (href: string, text: string) => `<a href="${esc(href)}" rel="noopener">${esc(text)}</a>`;

/** Every candidate page in one guide. */
export function candidatePages(g: CandidateGuide, site: string): CandidatePage[] {
  const guideUrl = `${site}${guidePath(g.id)}`;
  const when = longDate(g.day);
  return g.races.flatMap((race) => race.candidates.map((c): CandidatePage => {
    const path = candidatePath(g.id, race.id, c.name);
    const url = `${site}${path}`;
    const party = partyOf(c);
    const inc = isIncumbent(race, c);
    const title = `${c.name}: candidate for ${office(race)} · ${g.guideName}`;
    const desc = `${c.name}${party ? ` (${party})` : ''}${inc ? ', the incumbent,' : ''} is a candidate for ${office(race)} in ${g.election} on ${when}. Their campaign money, own words, endorsements and record, with sources. Free and nonpartisan.`;
    const others = race.candidates.filter((x) => x !== c);
    const council = race.incumbents?.find((x) => x.ballot === c.ballot && x.council)?.council;
    const job = g.explain(race.office);
    const links: [string, string][] = [
      ...(c.website ? [[c.website, 'Campaign website'] as [string, string]] : []),
      ...(c.issuesUrl ? [[c.issuesUrl, 'Issues page on their campaign website'] as [string, string]] : []),
      ...(c.ballotpedia ? [[c.ballotpedia, 'Ballotpedia profile'] as [string, string]] : []),
      ...(c.profile && c.profile !== c.ballotpedia ? [[c.profile, `Profile on ${host(c.profile)}`] as [string, string]] : []),
      ...Object.entries(c.social ?? {}).map(([k, v]) => [v as string, SOCIAL[k] ?? k] as [string, string]),
    ];
    const body = [
      '<main class="kyb-seo">',
      `<nav><a href="${site}/">Know Your Ballot</a> › <a href="${guideUrl}">${esc(g.guideName)}</a> › ${esc(office(race))}</nav>`,
      `<h1>${esc(c.name)}</h1>`,
      `<p>${esc(c.name)} is a candidate for <strong>${esc(office(race))}</strong> in ${esc(g.election)} on ${esc(when)}.${party ? ` Party: ${esc(party)}.` : c.partyOnFile ? ` No party is printed on this ballot; ${esc(c.partyOnFile.source.name)} lists them as ${esc(c.partyOnFile.party)}.` : ''}${inc ? ' They hold this seat now.' : ''}${race.numbered ? ` Ballot position: ${c.position ?? c.ballot}.` : ''}${c.filing ? ` Filing status on the official list: ${esc(c.filing)}.` : ''}${c.nominatedBy ? ` Nominated by the ${esc(c.nominatedBy)} party.` : ''}${g.asOf ? ` Candidate list as of ${esc(g.asOf)}.` : ''}</p>`,
      ...(job ? [`<h2>What the job does</h2><p>${esc(job)}</p>`] : []),
      ...(c.brief?.endorsements?.length ? [`<h2>Endorsed by</h2><ul>${c.brief.endorsements.map((e) => `<li>${a(e.source, e.endorser)} (${esc(e.kind)}${e.date ? `, ${esc(e.date)}` : ''})</li>`).join('')}</ul>`] : []),
      ...(c.brief?.support?.length ? [`<h2>Support, not a formal endorsement</h2><ul>${c.brief.support.map((x) => `<li>${a(x.source, x.backer)} (${esc(x.kind)}${x.date ? `, ${esc(x.date)}` : ''}): “${esc(x.wording)}”</li>`).join('')}</ul>`] : []),
      ...(c.brief?.facts.length ? [`<h2>About them</h2><ul>${c.brief.facts.map((f) => `<li>${esc(f.text)}${f.year ? ` (${f.year})` : ''} (${a(f.source, 'source')})</li>`).join('')}</ul>`] : []),
      ...(c.brief?.priorities.length ? [`<h2>What they'd work on</h2><ul>${c.brief.priorities.map((f) => `<li>${esc(f.text)}${f.year ? ` (${f.year})` : ''} (${a(f.source, 'source')})</li>`).join('')}</ul>`] : []),
      ...(c.brief?.quotes.length ? [`<h2>In their own words</h2>${c.brief.quotes.map((q) => `<blockquote>${esc(q.text)}</blockquote><p>Source: ${a(q.source, q.source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}${q.date ? `, ${esc(q.date)}` : ''}.</p>`).join('')}`] : []),
      ...(c.brief?.sources.length ? [`<h2>Sources read</h2><ul>${c.brief.sources.map((x) => `<li>${a(x.url, x.title)}, ${esc(x.publisher)}${x.date ? `, ${esc(x.date)}` : ''}</li>`).join('')}</ul><p>Read and summarized by Know Your Ballot on ${esc(c.brief.asOf)}; quotes are verbatim.</p>`] : []),
      '<h2>Campaign money</h2>',
      c.money
        ? `<p>Raised ${dollars(c.money.raised)}, spent ${dollars(c.money.spent)}${c.money.cash === undefined ? '' : `, ${dollars(c.money.cash)} cash on hand`}, from ${esc(MONEY_SOURCE[c.money.source] ?? c.money.source)} reports ${esc(c.money.since ?? 'Jan 2025')} through ${esc(c.money.through)}.${c.money.publicFunds ? ` Raised includes ${dollars(c.money.publicFunds)} in Fair Elections Fund matching money.` : ''}${c.money.recent ? ` Plus ${dollars(c.money.recent)} in large contributions reported since, through ${esc(c.money.recentThrough ?? '')}.` : ''}${c.money.source === 'FEC' ? ` ${a(`https://www.fec.gov/data/candidate/${c.money.id}/`, 'FEC filings')}.` : ''}</p>`
        : '<p>No campaign finance reports were found for them.</p>',
      ...(c.donors?.top.length ? [`<h3>Who gave</h3><p>${c.donors.givers.toLocaleString('en-US')} donors gave ${dollars(c.donors.total)} in itemized gifts since ${esc(c.donors.since)}, as reported to the ${a(c.donors.source.url, c.donors.source.name)}. The largest:</p><ol>${c.donors.top.map((g) => `<li>${esc(g.name)}${g.kind === 'organization' ? ' (organization)' : g.occupation || g.employer ? ` (${esc([g.occupation, g.employer].filter(Boolean).join(', '))})` : ''}: ${dollars(g.amount)}</li>`).join('')}</ol>`] : []),
      ...(c.outside ? [`<h2>Outside spending</h2><p>Independent groups reported ${dollars(c.outside.support)} supporting and ${dollars(c.outside.oppose)} opposing them, through ${esc(c.outside.through)} (${a(c.outside.url, 'FEC independent expenditures')}).</p><ul>${c.outside.groups.slice(0, 8).map((x) => `<li>${esc(x.name)}: ${x.support ? `${dollars(x.support)} supporting` : ''}${x.support && x.oppose ? ', ' : ''}${x.oppose ? `${dollars(x.oppose)} opposing` : ''}</li>`).join('')}</ul>`] : []),
      ...(c.stances ? [`<h2>In their own words</h2><p>Their answer to Ballotpedia's candidate survey, "3 key messages of your campaign", verbatim${c.stances.asOf ? ` (as of ${esc(c.stances.asOf)})` : ''}:</p>${c.stances.messages.map((m) => `<blockquote>${esc(m)}</blockquote>`).join('')}<p>Source: ${a(c.stances.url, 'Ballotpedia candidate survey')}.</p>`] : []),
      ...(c.endorsements ? [`<h2>Endorsements</h2><p>${c.endorsements.total.toLocaleString('en-US')} listed by ${a(c.endorsements.source.url, c.endorsements.source.name)} as of ${esc(c.endorsements.asOf)}.</p>${c.endorsements.groups.map((x) => `<h3>${esc(x.category)}</h3><ul>${x.names.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`).join('')}`] : []),
      ...(c.record ? [`<h2>Record in office</h2><p>Sponsored or co-sponsored ${c.record.sponsored.toLocaleString('en-US')} bills this session as ${esc(c.record.seat)}'s member (${esc(c.record.source)}, as of ${esc(c.record.asOf)}). The newest:</p><ul>${c.record.bills.map((b) => `<li>${esc(b.id)}: ${b.url ? a(b.url, b.title) : esc(b.title)}${b.latest_action ? `. Latest action: ${esc(b.latest_action)}` : ''}</li>`).join('')}</ul>`] : []),
      ...(council ? [`<h2>City Council record this term</h2><p>Present at ${council.attendance.present} of ${council.attendance.meetings} City Council meetings with a roll call since ${esc(longDate(council.since))}. Introduced ${council.introduced.total.toLocaleString('en-US')} items as lead sponsor: ${council.introduced.law} changes to the Municipal Code (${council.introduced.lawPassed} passed), ${council.introduced.resolutions} resolutions and ${council.introduced.ward} ward matters.</p>${council.budgets.length ? `<ul>${council.budgets.map((b) => `<li>${b.year} city budget: voted ${esc(b.vote)} (passed ${esc(b.tally)}, ${a(b.url, 'roll call')})</li>`).join('')}</ul>` : ''}${council.introduced.recent.length ? `<h3>Newest Municipal Code changes and resolutions</h3><ul>${council.introduced.recent.map((m) => `<li>${a(m.url, m.id)} (${esc(m.date)}, ${esc(m.status)}): ${esc(m.title)}</li>`).join('')}</ul>` : ''}<p>Source: ${a(council.source.url, council.source.name)}, as of ${esc(council.asOf)}.</p>`] : []),
      ...(c.bar ? [`<h2>Bar association ratings</h2><ul>${Object.entries(c.bar).map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`).join('')}</ul>${c.barSource ? `<p>Source: ${a(c.barSource, 'Alliance of Bar Associations for Judicial Screening')}.</p>` : ''}`] : []),
      ...(links.length ? [`<h2>Links</h2><ul>${links.map(([h, t]) => `<li>${a(h, t)}</li>`).join('')}</ul>`] : []),
      ...(others.length ? [`<h2>Also running for ${esc(office(race))}</h2><ul>${others.map((x) => `<li><a href="${site}${candidatePath(g.id, race.id, x.name)}">${esc(x.name)}</a>${partyOf(x) ? `, ${esc(partyOf(x))}` : ''}</li>`).join('')}</ul>`] : []),
      ...(c.photo ? [`<p>Photo: ${c.photo.link ? a(c.photo.link, c.photo.credit) : esc(c.photo.credit)}.</p>`] : []),
      `<p>Know Your Ballot never recommends or rates a candidate. Confirm your own ballot with ${a(g.portal.url, g.portal.name)}. <a href="${guideUrl}">See everything on the ballot</a>.</p>`,
      '</main>',
    ].join('\n');
    const sameAs = links.map(([h]) => h).filter((h) => /^https?:/.test(h));
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ProfilePage', '@id': `${url}#page`, url, name: title, description: desc, inLanguage: 'en',
          isPartOf: { '@id': `${site}/#website` }, ...(g.asOf ? { dateModified: g.asOf } : {}), mainEntity: { '@id': `${url}#person` },
        },
        {
          '@type': 'Person', '@id': `${url}#person`, name: c.name, url, description: `Candidate for ${office(race)} in ${g.election}, ${when}.`,
          ...(c.photo ? { image: `${site}/${c.photo.file.replace(/^\/+/, '')}` } : {}),
          ...(party ? { affiliation: { '@type': 'Organization', name: `${party} Party`.replace(/ Party Party$/, ' Party') } } : {}),
          ...(sameAs.length ? { sameAs } : {}),
        },
        {
          '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Know Your Ballot', item: `${site}/` },
            { '@type': 'ListItem', position: 2, name: g.guideName, item: guideUrl },
            { '@type': 'ListItem', position: 3, name: c.name, item: url },
          ],
        },
      ],
    };
    return { path, title, desc, body, ld, lastmod: g.asOf };
  }));
}
