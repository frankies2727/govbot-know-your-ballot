import type { GuideSection } from '../guide/spec';
import type { ResearchLink } from '../research';
import type { StateConfig } from '../state';
import type { Candidate, Race } from '../types';

// Everything Minnesota-specific that the shared components ask for, plus the
// guide's links and section list. Facts are from the Minnesota Secretary of
// State (sos.mn.gov/elections-voting), checked October 25, 2026.

// The Minnesota Voter Information Portal: registration status, polling
// place, sample ballot, absentee application and tracking.
export const LINKS = {
  myInfo: 'https://mnvotes.sos.mn.gov/',
  register: 'https://www.sos.mn.gov/elections-voting/register-to-vote/',
  absentee: 'https://www.sos.mn.gov/elections-voting/other-ways-to-vote/vote-early-by-mail/',
  early: 'https://www.sos.mn.gov/elections-voting/other-ways-to-vote/vote-early-in-person/',
  electionDay: 'https://www.sos.mn.gov/elections-voting/election-day-voting/',
  dates: 'https://www.sos.mn.gov/elections-voting/',
  // The Campaign Finance Board's public reports: every state candidate's committee.
  disclosure: 'https://cfb.mn.gov/',
};

// Ballot order: federal, state, the Legislature, judges, then the amendment.
// Colours are the State of Minnesota palette (minnesota.css), the same in
// both themes; each carries the ink that reads on it. Party never gets a
// colour.
const WHITE = '#FFFFFF';
const BLUE = 'var(--mn-blue)';
export const SECTIONS: readonly GuideSection[] = [
  { id: 'federal', title: 'Federal', color: 'var(--mn-blue)', ink: WHITE, emoji: '🏛️' },
  { id: 'state', title: 'Minnesota statewide', color: 'var(--mn-pine)', ink: WHITE, emoji: '🌲' },
  { id: 'legislature', title: 'St. Paul', color: 'var(--mn-purple)', ink: WHITE, emoji: '⭐' },
  { id: 'judicial', title: 'Judges', color: 'var(--mn-sky)', ink: BLUE, emoji: '⚖️' },
  { id: 'measures', title: 'Amendment', color: 'var(--mn-orange)', ink: WHITE, emoji: '🗳️' },
];

// Plain-English "what does this job actually do", factual and neutral.
const EXPLAINERS: [RegExp, string][] = [
  [/^U\.S\. Senator/, 'One of Minnesota’s two U.S. senators; only this seat, the one Tina Smith is leaving, is on the ballot this year, so you pick 1. Votes on federal laws, confirms federal judges and cabinet members, and approves treaties. 6-year term.'],
  [/^U\.S\. Representative/, 'Your district’s seat in the U.S. House. Writes and votes on federal laws and the federal budget. 2-year term.'],
  [/^Governor and Lieutenant Governor/, 'Runs Minnesota’s executive branch: proposes the two-year state budget, signs or vetoes bills, appoints agency heads and fills court vacancies. Governor and lieutenant governor run as one ticket. 4-year term; Tim Walz is not on the ballot.'],
  [/^Secretary of State/, 'Runs Minnesota’s elections and the statewide voter registration system, keeps business filings and the state’s official records. 4-year term.'],
  [/^State Auditor/, 'Watches how counties, cities, school districts and other local governments spend public money, audits their books and reports on them. 4-year term.'],
  [/^Attorney General/, 'Minnesota’s top lawyer. Represents the state in court and enforces consumer-protection, antitrust and civil-rights laws. 4-year term.'],
  [/^State Senator/, 'Your seat in the Minnesota Senate. Writes and votes on state laws and the two-year state budget in St. Paul. 4-year term. Every Senate district is on the ballot this year; you pick 1 for yours.'],
  [/^State Representative/, 'Your seat in the Minnesota House. Writes and votes on state laws and the state budget in St. Paul. 2-year term. Each Senate district is split into an A and a B House district; you pick 1 for yours.'],
  [/^Associate Justice of the Supreme Court/, 'Minnesota’s highest court: the final word on state law. Justices are elected statewide without party labels for 6-year terms; most first reach the court by the governor’s appointment, then stand for election. The sitting justice is marked “incumbent” on the ballot. You pick 1, or leave it blank.'],
  [/^Judge of the Court of Appeals/, 'Hears appeals from Minnesota’s district courts; for most cases it is the last stop. Its 19 judges are elected statewide without party labels for 6-year terms, and sitting judges usually run unopposed. You pick 1, or leave it blank.'],
];
const explainOffice = (office: string) => EXPLAINERS.find(([re]) => re.test(office))?.[1] ?? '';

const AREA_LABEL: Record<string, string> = { cd: 'Congressional District', sldu: 'State Senate District', sldl: 'State House District' };
const areaLabel = (r: Race) => (r.area ? `${AREA_LABEL[r.area.type] ?? r.area.type} ${r.area.id}` : 'Statewide');

const q = encodeURIComponent;
const lead = (name: string) => name.split(' & ')[0];

function researchLinks(c: Candidate, race: Race): ResearchLink[] {
  const who = lead(c.name);
  const links: ResearchLink[] = [];
  if (c.profile) links.push({ label: 'Ballotpedia profile', href: c.profile, note: 'Bio, experience, survey answers and campaign site' });
  if (c.website) links.push({ label: 'Their campaign site', href: c.website, note: 'Their own words on the issues' });
  else links.push({ label: 'Search the web for their campaign', href: `https://duckduckgo.com/?q=${q(`${who} ${race.office} Minnesota 2026 campaign`)}`, note: 'They listed no site in their filing, so this opens a web search, not their site' });
  if (c.money?.source === 'FEC') links.push({ label: 'FEC filings', href: `https://www.fec.gov/data/candidate/${c.money.id}/`, note: 'Every donor and expense, officially' });
  else if (race.section !== 'federal' && race.section !== 'judicial') links.push({ label: 'Minnesota campaign finance', href: LINKS.disclosure, note: 'The Campaign Finance Board’s reports: search for their committee' });
  // The League of Women Voters asks every candidate the same questions; answers are listed by address.
  links.push({ label: 'Vote411 candidate Q&A', href: 'https://www.vote411.org/ballot', note: 'League of Women Voters: their answers to the League’s questions, by your address' });
  return links;
}

export const MINNESOTA: StateConfig = {
  region: 'Minnesota',
  areaLabel,
  scopeLabel: () => 'Statewide amendment',
  explainOffice,
  researchLinks,
  moneySource: (s) => (s === 'FEC' ? 'Federal Election Commission' : 'Minnesota Campaign Finance Board'),
  noMoney: (r) => (r.section === 'federal'
    ? 'No FEC filings found. Federal candidates who raise or spend under $5,000 don’t have to file.'
    : 'State and local campaign money isn’t in this guide yet. The Minnesota Campaign Finance Board publishes every committee’s reports.'),
  compareNote: 'Money comes from FEC records (federal races only); incumbency from the candidate lists. Tap “ⓘ Details” under a name for their profile and campaign site.',
};

/** A district's number as a chip: "Congress 4", "County Hennepin". */
export const DISTRICT_CHIPS: [string, string][] = [
  ['county', 'County'], ['cd', 'Congress'], ['sldu', 'State Senate'], ['sldl', 'State House'],
];
