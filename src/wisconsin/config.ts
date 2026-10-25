import type { GuideSection } from '../guide/spec';
import type { ResearchLink } from '../research';
import type { StateConfig } from '../state';
import type { Candidate, Race } from '../types';

// Everything Wisconsin-specific that the shared components ask for, plus the
// guide's links and section list. Facts are from the Wisconsin Elections
// Commission (elections.wi.gov, myvote.wi.gov), checked October 25, 2026.

// MyVote Wisconsin: registration, status, polling place, sample ballot,
// absentee requests and tracking, all from one address lookup.
export const LINKS = {
  myInfo: 'https://myvote.wi.gov/',
  register: 'https://elections.wi.gov/voters/register-vote',
  photoId: 'https://elections.wi.gov/voters/photo-id',
  absentee: 'https://elections.wi.gov/voters/absentee-voting',
  electionDay: 'https://elections.wi.gov/voters/voting-election-day',
  dates: 'https://elections.wi.gov/elections/upcoming-elections',
  // The state's campaign finance system: every state candidate's committee and its transactions.
  disclosure: 'https://campaignfinance.wi.gov/browse-data/registrants',
};

// Ballot order: federal, state, the Legislature, then the questions.
// Colours are the Wisconsin palette (wisconsin.css), the same in both
// themes; each carries the ink that reads on it. Party never gets a colour.
const WHITE = '#FFFFFF';
export const SECTIONS: readonly GuideSection[] = [
  { id: 'federal', title: 'Federal', color: 'var(--wi-navy)', ink: WHITE, emoji: '🏛️' },
  { id: 'state', title: 'Wisconsin statewide', color: 'var(--wi-cardinal)', ink: WHITE, emoji: '🧀' },
  { id: 'legislature', title: 'Madison', color: 'var(--wi-forest)', ink: WHITE, emoji: '⭐' },
  { id: 'measures', title: 'Questions', color: 'var(--wi-lake)', ink: WHITE, emoji: '🗳️' },
];

// Plain-English "what does this job actually do", factual and neutral.
const EXPLAINERS: [RegExp, string][] = [
  [/^Representative in Congress/, 'Your district’s seat in the U.S. House. Writes and votes on federal laws and the federal budget. 2-year term. Neither of Wisconsin’s U.S. Senate seats is on the ballot this year.'],
  [/^Governor and Lieutenant Governor/, 'Runs Wisconsin’s executive branch: proposes the two-year state budget, signs or vetoes bills (including partial vetoes of spending bills), appoints agency heads. Governor and lieutenant governor run as one ticket. 4-year term; Tony Evers is not on the ballot.'],
  [/^Attorney General/, 'Wisconsin’s top lawyer. Heads the Department of Justice, represents the state in court, runs the state crime labs and enforces consumer-protection and environmental laws. 4-year term.'],
  [/^Secretary of State/, 'Keeps the state seal and official records and sits on the Board of Commissioners of Public Lands. Wisconsin’s elections are run by the Elections Commission, not this office. 4-year term.'],
  [/^State Treasurer/, 'Sits on the Board of Commissioners of Public Lands, which manages the trust funds that pay for school libraries and lends to local governments. 4-year term.'],
  [/^State Senator/, 'Your seat in the Wisconsin Senate. Writes and votes on state laws and the two-year state budget in Madison. 4-year term. Only the 17 odd-numbered districts are on the ballot this year; if yours is, you pick 1.'],
  [/^Representative to the Assembly/, 'Your seat in the Wisconsin Assembly. Writes and votes on state laws and the state budget in Madison. 2-year term. Every Assembly seat is on the ballot this year; you pick 1 for yours.'],
];
const explainOffice = (office: string) => EXPLAINERS.find(([re]) => re.test(office))?.[1] ?? '';

const AREA_LABEL: Record<string, string> = { cd: 'Congressional District', sldu: 'State Senate District', sldl: 'Assembly District' };
const areaLabel = (r: Race) => (r.area ? `${AREA_LABEL[r.area.type] ?? r.area.type} ${r.area.id}` : 'Statewide');

const q = encodeURIComponent;
const lead = (name: string) => name.split(' & ')[0];

function researchLinks(c: Candidate, race: Race): ResearchLink[] {
  const who = lead(c.name);
  const links: ResearchLink[] = [];
  if (c.profile) links.push({ label: 'Ballotpedia profile', href: c.profile, note: 'Bio, experience, survey answers and campaign site' });
  if (c.website) links.push({ label: 'Their campaign site', href: c.website, note: 'Their own words on the issues' });
  else links.push({ label: 'Search the web for their campaign', href: `https://duckduckgo.com/?q=${q(`${who} ${race.office} Wisconsin 2026 campaign`)}`, note: 'They listed no site in their filing, so this opens a web search, not their site' });
  if (c.money?.source === 'FEC') links.push({ label: 'FEC filings', href: `https://www.fec.gov/data/candidate/${c.money.id}/`, note: 'Every donor and expense, officially' });
  else if (c.money?.source === 'WISC') links.push({ label: 'Wisconsin campaign finance filings', href: `https://campaignfinance.wi.gov/browse-data/registrant/${c.money.id.split('+')[0]}`, note: 'Their committee’s reports, donors and spending, officially' });
  else if (race.section !== 'federal') links.push({ label: 'Wisconsin campaign finance', href: LINKS.disclosure, note: 'The state’s campaign finance system: search for their committee' });
  // The League of Women Voters asks every candidate the same questions; answers are listed by address.
  links.push({ label: 'Vote411 candidate Q&A', href: 'https://www.vote411.org/ballot', note: 'League of Women Voters: their answers to the League’s questions, by your address' });
  return links;
}

export const WISCONSIN: StateConfig = {
  region: 'Wisconsin',
  areaLabel,
  scopeLabel: () => 'Statewide question',
  explainOffice,
  researchLinks,
  moneySource: (s) => (s === 'FEC' ? 'Federal Election Commission' : 'Wisconsin Ethics Commission'),
  noMoney: (r) => (r.section === 'federal'
    ? 'No FEC filings found. Federal candidates who raise or spend under $5,000 don’t have to file.'
    : 'No committee for this race in Wisconsin’s campaign finance system: a candidate who raises and spends under $2,000 in a year can claim an exemption and files no reports.'),
  compareNote: 'Money comes from FEC and Wisconsin Ethics Commission records; incumbency from the candidate lists. Tap “ⓘ Details” under a name for their profile and campaign site.',
};

/** A district's number as a chip: "Congress 2", "County Dane". */
export const DISTRICT_CHIPS: [string, string][] = [
  ['county', 'County'], ['cd', 'Congress'], ['sldu', 'State Senate'], ['sldl', 'Assembly'],
];
