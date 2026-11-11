import type { GuideSection } from '../guide/spec';
import { sourceName } from '../lib/sources';
import type { ResearchLink } from '../research';
import type { StateConfig } from '../state';
import type { Candidate, Race } from '../types';
import { ELECTION_DAY } from './dates';

// Everything specific to Denver's Apr 6, 2027 municipal election that the
// shared guide asks for. The offices, how each is won and who may run are
// from the Denver Elections Division's 2027 Municipal Candidate Information
// Packet and the Denver Charter (8.2: elections and runoffs; 3.1: the
// council); checked November 8, 2026.

export const LINKS = {
  /** Colorado's voter portal: registration, your ballot's status, your sample ballot. */
  myInfo: 'https://www.govotecolorado.gov/',
  /** The Denver Elections Division: dates, drop boxes, Voter Service and Polling Centers. */
  elections: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Denver-Clerk-and-Recorder/Elections-Division',
  packet: 'https://www.denvergov.org/files/assets/public/v/1/clerk-and-recorder/documents/operations-division/compliance/2025/2027_denver_municipal_candidate_information_packet_11.21.pdf',
  searchlight: 'https://denver.maplight.com/',
  /** Text and email alerts as your ballot is mailed, received and counted. */
  ballotTrax: 'https://denver.ballottrax.net/voter/',
};

const INK = '#1A1600';
const WHITE = '#FFFFFF';
export const SECTIONS: readonly GuideSection[] = [
  { id: 'city', title: 'Citywide', color: 'var(--den-blue)', ink: WHITE, emoji: '🏙️' },
  { id: 'council', title: 'City Council', color: 'var(--den-gold)', ink: INK, emoji: '🏛️' },
];

const MAJORITY = 'Wins with more than half the votes; if no one gets there, the top two meet in a runoff on Jun 1, 2027.';
const TERM = '4-year term from July 2027.';
// Plain-English "what does this job actually do", factual and neutral.
const EXPLAINERS: [RegExp, string][] = [
  [/^Mayor$/, `Denver’s chief executive: runs the city’s departments (police, fire, parks, transportation, housing), proposes the budget each year, appoints department heads and can veto what the City Council passes. ${TERM} ${MAJORITY}`],
  [/^Auditor$/, `Denver’s independent watchdog: audits how city agencies, programs and contracts spend public money, and enforces the city’s minimum wage and prevailing wage laws. ${TERM} ${MAJORITY}`],
  [/^Clerk and Recorder$/, `Runs Denver’s elections, records property deeds and other public documents, issues marriage and civil union licenses, and keeps the City Council’s official record. ${TERM} ${MAJORITY}`],
  [/^City Council At-Large/, `One of two council members elected by the whole city, on Denver’s 13-member City Council: votes on city laws and the budget, and approves the mayor’s appointments and large city contracts. From 2027 the two at-large seats are separate races, Seat A and Seat B, and every voter votes in both. ${TERM} ${MAJORITY}`],
  [/^City Council, District/, `Your district’s member of Denver’s 13-member City Council: votes on city laws and the budget, approves the mayor’s appointments and large city contracts, and answers to the neighborhoods in the district. ${TERM} ${MAJORITY}`],
];
export const explainOffice = (office: string) => EXPLAINERS.find(([re]) => re.test(office))?.[1] ?? '';

const areaLabel = (r: Race) => (!r.area ? 'Citywide' : `District ${r.area.id}`);

const q = encodeURIComponent;
function researchLinks(c: Candidate, race: Race): ResearchLink[] {
  const links: ResearchLink[] = [];
  if (c.website) links.push({ label: `Campaign site: ${sourceName(c.website)}`, href: c.website, note: 'Their own words on the issues' });
  else links.push({ label: 'Search DuckDuckGo for their campaign', href: `https://duckduckgo.com/?q=${q(`${c.name} ${race.office} Denver 2027`)}`, note: 'No campaign site on record, so this opens a web search, not their site' });
  if (c.profile) links.push({ label: 'Their page on Denver SearchLight', href: c.profile, note: 'Their committee’s reports, every contribution and expense, and Fair Elections Fund money, on the City’s campaign finance site' });
  else links.push({ label: 'Denver SearchLight: candidate search', href: LINKS.searchlight, note: 'The City’s campaign finance site: search for their committee' });
  links.push({ label: 'Search Ballotpedia', href: `https://ballotpedia.org/wiki/index.php?search=${q(c.name)}`, note: 'Bio and past races' });
  return links;
}

export const DENVER_2027: StateConfig = {
  region: 'Denver',
  areaLabel,
  scopeLabel: () => 'Citywide question',
  explainOffice,
  researchLinks,
  moneySource: () => 'Denver SearchLight',
  noMoney: () => 'No contributions or spending reported to Denver SearchLight yet.',
  compareNote: 'Money comes from each committee’s reports to Denver SearchLight since Jan 1, 2024, Fair Elections Fund matching money included. Until petitions are certified, everyone here has registered a campaign but not yet qualified for the ballot. Tap “ⓘ Details” under a name for their links.',
  electionDate: ELECTION_DAY,
  listFinal: false,
  noCandidates: 'Denver SearchLight shows no registered campaign for this seat. Petitions are due Jan 21, 2027.',
};

/** The voter's districts, as chips: "District 9". */
export const DISTRICT_CHIPS: [string, string][] = [['council', 'Council District']];
