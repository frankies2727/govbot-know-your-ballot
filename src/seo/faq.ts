// The questions voters ask, answered from the data and copy already in the app.
// One function builds them for three readers: the visible "Common questions"
// section, the text in the page a crawler reads, and the FAQ structured data.
// Every answer is made from sourced data (the candidate lists, the offices'
// plain-English explainers, the key dates, the ballot copy), never written
// fresh, so the three can't disagree. Candidates keep the data's own order.

import type { KeyDate } from '../dates';
import type { Measure, Race } from '../types';
import { COVERAGE, HOW, PORTAL, SITE_QA, STATE_NAMES, type StateSlug } from './copy';
import { aOrAn, longDate, shortDate } from './format';

export interface Faq { q: string; a: string }

export interface FaqDate { date: string; title: string; detail?: string; only?: string }

export interface FaqContext {
  slug: StateSlug;
  races: Race[];
  measures: Measure[];
  /** The candidate list's own date, YYYY-MM-DD, when it can be read. */
  asOf?: string;
  /** The state's plain-English "what does this job do" lookup ('' when it has none). */
  explainOffice: (office: string) => string;
  keyDates: FaqDate[];
}

export const ELECTION_DAY = '2026-11-03';

/** Key dates as the questions say them; Illinois's Chicago-only and suburban-only dates name their voters. */
export const faqDates = (dates: KeyDate[]): FaqDate[] => dates.map((d) => ({ date: d.date, title: d.title, detail: d.detail, only: d.only === 'chicago' ? 'Chicago voters' : d.only === 'suburbs' ? 'suburban Cook voters' : undefined }));

/** Federal and state offices every voter in the state votes on (not district, county or local seats). */
/** The ballot questions every voter in the state sees; local ones (a county, city, ward or precinct) depend on the address. */
export const statewideMeasures = (measures: Measure[]) => measures.filter((m) => m.scope.type === 'state');

export const headlineRaces = (races: Race[]) => races.filter((r) => !r.area && (r.section === 'federal' || r.section === 'state'));

const officeLabel = (office: string) => office.replace(/\s*\(\d+ seats?\)\s*$/i, '').replace(/,\s*(Seat|District)\s.*$/i, '');
const who = (r: Race) => r.candidates.map((c) => `${c.name}${c.party ? ` (${c.party}${c.incumbent ? ', incumbent' : ''})` : c.incumbent ? ' (incumbent)' : ''}`).join('; ');
const list = (items: string[]) => (items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);
const sentence = (s: string) => (/[.!?”"]$/.test(s) ? s : `${s}.`);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const DISTRICT_LABELS: [string, string, string][] = [
  ['cd', 'U.S. House district', 'U.S. House districts'], ['sldu', 'state Senate district', 'state Senate districts'], ['sldl', 'state House district', 'state House districts'],
  ['jd', 'judicial district (district court)', 'judicial districts (district court)'], ['coa', 'Court of Appeals district', 'Court of Appeals districts'],
];

export function faqFor(ctx: FaqContext): Faq[] {
  const { slug, races, measures, asOf, explainOffice, keyDates } = ctx;
  const name = STATE_NAMES[slug];
  const out: Faq[] = [];
  const election = keyDates.find((d) => d.title === 'Election Day');

  out.push({ q: `When is the ${name} general election in 2026?`, a: `${longDate(ELECTION_DAY)}.${election?.detail ? ` ${sentence(election.detail)}` : ''}` });
  out.push({
    q: `What are the key dates and deadlines for voting in ${name} on November 3, 2026?`,
    a: keyDates.map((d) => `${shortDate(d.date)}: ${d.title}${d.only ? ` (${d.only})` : ''}${d.detail ? `. ${sentence(d.detail)}` : '.'}`).join(' '),
  });

  // What is on the ballot, built from the data's own counts.
  const heads = headlineRaces(races);
  // Illinois's non-district "judicial" races are Cook County vacancies, not statewide seats.
  const judges = slug === 'illinois' ? 0 : races.filter((r) => !r.area && r.section === 'judicial').length;
  const boards = races.filter((r) => !r.area && !['federal', 'state', 'judicial', 'county'].includes(r.section));
  const names = (rs: Race[]) => [...new Set(rs.map((r) => officeLabel(r.office)))];
  const districts = DISTRICT_LABELS.map(([type, one, many]) => [new Set(races.filter((r) => r.area?.type === type).map((r) => r.area!.id)).size, one, many] as const).filter(([n]) => n > 0).map(([n, one, many]) => plural(n, one, many));
  const parts = [`Every ${name} voter votes on ${list(names(heads))}`];
  if (boards.length) parts.push(`${list(names(boards))}`);
  if (judges) parts.push(plural(judges, 'statewide judicial seat', 'statewide judicial seats'));
  const own = districts.length ? ` Depending on your address you also vote in your own district's contests (${list(districts)} in the state).` : '';
  const state = statewideMeasures(measures);
  const local = measures.length - state.length;
  const measuresLine = `${state.length ? ` There ${state.length === 1 ? 'is' : 'are'} also ${plural(state.length, 'statewide ballot question', 'statewide ballot questions')}: ${list(state.map((m) => m.title))}.` : ''}${local ? ` This guide also covers ${plural(local, 'local ballot question', 'local ballot questions')}, which appear only on some ballots, depending on the voter's county, city, ward or precinct.` : ''}`;
  out.push({ q: `What is on the ${name} ballot on November 3, 2026?`, a: `${parts.join(', plus ')}.${own}${measuresLine}${COVERAGE[slug] ? ` ${COVERAGE[slug]}` : ''}` });

  // One pair per headline office: who is running, and what the job does.
  for (const r of heads) {
    const office = officeLabel(r.office);
    out.push({ q: `Who is running for ${office} in ${name} in 2026?`, a: `${who(r)}.${asOf ? ` Candidate list as of ${asOf}.` : ''} Confirm your own ballot at ${PORTAL[slug].name}.` });
    const job = explainOffice(r.office);
    if (job) out.push({ q: `What does the ${office} do in ${name}?`, a: sentence(job) });
  }

  out.push({ q: `How does ${aOrAn(name)} ${name} ballot work?`, a: HOW[slug].map((i) => `${i.lead} ${i.text}`).join(' ') });
  out.push({ q: `How do I find my own ballot and polling place in ${name}?`, a: `Your exact ballot depends on your address. Enter it on this page to see yours, then confirm your registration, polling place and ballot at ${PORTAL[slug].name} (${PORTAL[slug].url}).` });
  return [...out, ...SITE_QA];
}

/** The home page's questions: only the ones about the site. */
export const homeFaq = (): Faq[] => SITE_QA;
