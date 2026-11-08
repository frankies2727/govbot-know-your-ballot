import type { GuideSection } from '../guide/spec';
import { sourceName } from '../lib/sources';
import type { ResearchLink } from '../research';
import type { StateConfig } from '../state';
import type { Candidate, Race } from '../types';
import { ELECTION_DAY } from './dates';

// Everything specific to Jacksonville's 2027 consolidated city election that
// the shared guide asks for. Which offices are up, the dates and how each race
// is won are from the Duval County Supervisor of Elections' 2027 dates and
// office information sheets; the offices' work from the City's and each
// office's own pages; checked November 8, 2026.

const SOE = 'https://www.duvalelections.gov';
export const LINKS = {
  /** Florida's registration lookup. */
  myInfo: 'https://registration.elections.myflorida.com/CheckVoterStatus',
  register: 'https://registertovoteflorida.gov/',
  soe: `${SOE}/`,
  dates: `${SOE}/361/2027-Important-Dates-and-Deadlines`,
  votingBasics: `${SOE}/210/Voting-Basics`,
  candidates: `${SOE}/254/Active-Candidates-Committees`,
  candidateResources: `${SOE}/309/Candidate-Resources`,
  mayorSheet: `${SOE}/DocumentCenter/View/647/Mayor-PDF`,
  council: 'https://www.jacksonville.gov/city-council/city-council-members',
  mayorArticle: 'https://en.wikipedia.org/wiki/2027_Jacksonville_mayoral_election',
};

const INK = '#1C1400';
const WHITE = '#FFFFFF';
export const SECTIONS: readonly GuideSection[] = [
  { id: 'city', title: 'Mayor', color: 'var(--jax-navy)', ink: WHITE, emoji: '🏙️' },
  { id: 'county', title: 'Countywide officers', color: 'var(--jax-teal)', ink: WHITE, emoji: '🏛️' },
  { id: 'council', title: 'City Council', color: 'var(--jax-gold)', ink: INK, emoji: '🗳️' },
];

const WIN = 'Every candidate, of every party, is on one ballot for every voter. More than half the votes on Mar 9 wins; otherwise the top two meet again on May 18, 2027.';
const TERM = '4-year term from Jul 1, 2027.';
// Plain-English "what does this job actually do", factual and neutral.
const EXPLAINERS: [RegExp, string][] = [
  [/^Mayor$/, `The chief executive of Jacksonville’s consolidated city and county government: runs the city’s departments (fire and rescue, public works, parks, libraries), proposes the budget each year, appoints department heads and board members, who the City Council confirms, and can veto what the Council passes. ${TERM} ${WIN}`],
  [/^Sheriff$/, `Heads the Jacksonville Sheriff’s Office: the police for Jacksonville (Atlantic Beach, Neptune Beach and Jacksonville Beach have their own) and the county jail. ${TERM} ${WIN}`],
  [/^Property Appraiser$/, `Sets the value of every property in Duval County each year, the values property taxes are figured from, and decides homestead and other exemptions. Doesn’t set tax rates. ${TERM} ${WIN}`],
  [/^Supervisor of Elections$/, `Runs Duval County’s elections: registers voters, runs early voting, mail voting and Election Day, counts and certifies the results, and takes candidates’ qualifying papers and campaign reports. ${TERM} ${WIN}`],
  [/^Tax Collector$/, `Collects property taxes and issues driver’s licenses, vehicle tags and titles, and hunting and fishing licenses. ${TERM} ${WIN}`],
  [/^City Council At-Large/, `One of five members of the 19-member City Council elected by the whole county; each must live in their group’s part of the county. The Council passes city laws and the budget, sets the property tax rate and confirms the mayor’s appointments. ${TERM} ${WIN}`],
  [/^City Council, District/, `Your district’s member of the 19-member City Council, which passes city laws and the budget, sets the property tax rate and confirms the mayor’s appointments. ${TERM} ${WIN}`],
];
export const explainOffice = (office: string) => EXPLAINERS.find(([re]) => re.test(office))?.[1] ?? '';

const areaLabel = (r: Race) => (!r.area ? 'Countywide' : `District ${r.area.id}`);

const q = encodeURIComponent;
function researchLinks(c: Candidate, race: Race): ResearchLink[] {
  const links: ResearchLink[] = [];
  if (c.website) links.push({ label: `Campaign site: ${sourceName(c.website)}`, href: c.website, note: 'Their own words on the issues' });
  else links.push({ label: 'Search DuckDuckGo for their campaign', href: `https://duckduckgo.com/?q=${q(`${c.name} ${race.office} Jacksonville 2027`)}`, note: 'No campaign site on record, so this opens a web search, not their site' });
  links.push({ label: 'Duval County Supervisor of Elections: candidates', href: LINKS.candidates, note: 'The official list of everyone who has filed, with their campaign reports' });
  links.push({ label: 'Search Ballotpedia', href: `https://ballotpedia.org/wiki/index.php?search=${q(c.name)}`, note: 'Bio and past races' });
  return links;
}

export const JACKSONVILLE_2027: StateConfig = {
  region: 'Jacksonville',
  areaLabel,
  scopeLabel: () => 'Countywide question',
  explainOffice,
  researchLinks,
  moneySource: () => 'Duval County Supervisor of Elections',
  noMoney: () => 'Campaign reports are filed with the Duval County Supervisor of Elections; follow the link in “ⓘ Details”.',
  compareNote: 'Party is printed on this ballot. Until qualifying closes at noon on Jan 15, 2027, the mayor’s race lists who has declared, from the Wikipedia article on it; the Supervisor of Elections’ qualified list then replaces it.',
  electionDate: ELECTION_DAY,
  noCandidates: 'Candidates qualify from noon Jan 11 to noon Jan 15, 2027; the Supervisor of Elections’ list fills in here then.',
};

/** The voter's districts, as chips: "Council District 7". */
export const DISTRICT_CHIPS: [string, string][] = [['council', 'Council District']];
