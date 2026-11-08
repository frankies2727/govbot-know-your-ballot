import type { GuideSection } from '../guide/spec';
import { sourceName } from '../lib/sources';
import type { StateData } from '../guide/types';
import type { ResearchLink } from '../research';
import type { StateConfig } from '../state';
import type { Candidate, Race } from '../types';
import { ELECTION_DAY } from './dates';

// Everything specific to Chicago's Feb 23, 2027 city election that the shared
// guide asks for. The offices' facts are from the Chicago Board of Election
// Commissioners' 2027 Election Information Pamphlet (who is elected, how,
// terms, qualifications), the Community Commission for Public Safety and
// Accountability (the district councils) and the Illinois Municipal Code;
// checked November 8, 2026.

export const LINKS = {
  /** The Board's lookup: registration, polling place and official sample ballot. */
  myInfo: 'https://chicagoelections.gov/voting/your-voter-information',
  candidates: 'https://chicagoelections.gov/getting-ballot/candidates',
  /** The Board's 2027 Election Information Pamphlet and Calendar. */
  calendar: 'https://cboeprod.blob.core.usgovcloudapi.net/prod/2026-06/2027%20Election%20Calendar-ADOPTED.pdf',
  ccpsa: 'https://ccpsa.chicago.gov/2027dcelection/',
  disclosure: 'https://www.elections.il.gov/CampaignDisclosure/CampaignDisclosureSearch.aspx',
  chicagoPolitics: 'https://www.chicagopolitics.org/elections/2027',
};

// Ballot order: the citywide offices, the ward's alderperson, then the police district council.
const INK = '#0B1F2E';
const WHITE = '#FFFFFF';
export const SECTIONS: readonly GuideSection[] = [
  { id: 'city', title: 'Citywide', color: 'var(--chi-red)', ink: WHITE, emoji: '🏙️' },
  { id: 'council', title: 'City Council', color: 'var(--chi-blue)', ink: INK, emoji: '🏛️' },
  { id: 'police', title: 'Police District Council', color: 'var(--chi-navy)', ink: WHITE, emoji: '🛡️' },
];

const MAJORITY = 'Wins with more than half the votes; if no one gets there, the top two meet in a runoff on Apr 6, 2027.';
// Plain-English "what does this job actually do", factual and neutral.
const EXPLAINERS: [RegExp, string][] = [
  [/^Mayor$/, `Chicago’s chief executive: runs the city’s departments (police, fire, streets and sanitation, water, public health), proposes the budget each year and appoints department heads, who the City Council confirms. Presides over the City Council and votes only to break a tie. 4-year term from May 17, 2027. ${MAJORITY}`],
  [/^City Clerk$/, `Keeps the City Council’s official record (every ordinance, vote and meeting), and issues city vehicle stickers and the CityKey ID. 4-year term from May 17, 2027. ${MAJORITY}`],
  [/^City Treasurer$/, `The keeper of the city’s money: invests city funds and sits on the boards of the city’s four employee pension funds. 4-year term from May 17, 2027. ${MAJORITY}`],
  [/^Alderperson/, `Your ward’s member of the 50-member City Council: votes on city laws and the budget, confirms the mayor’s appointments, and runs a ward office for city services in the ward. 4-year term from May 17, 2027. ${MAJORITY}`],
  [/^Police District Council/, 'Three residents elected for your police district. They hold monthly public meetings on public safety, work with the district’s police leadership, build community-policing and restorative-justice programs, and help choose nominees for the citywide Community Commission for Public Safety and Accountability. A $500 monthly stipend; 4-year term from May 4, 2027. Pick up to 3: the three with the most votes win, with no runoff.'],
];
export const explainOffice = (office: string) => EXPLAINERS.find(([re]) => re.test(office))?.[1] ?? '';

const areaLabel = (r: Race) => (!r.area ? 'Citywide' : r.area.type === 'ward' ? `Ward ${r.area.id}` : `Police District ${r.area.id}`);

const q = encodeURIComponent;

/** Where to read more about a candidate, official sources first; `data` adds the ward office of a sitting alderperson. */
function researchLinks(data: StateData) {
  return (c: Candidate, race: Race): ResearchLink[] => {
    const links: ResearchLink[] = [];
    if (c.website) links.push({ label: `Campaign site: ${sourceName(c.website)}`, href: c.website, note: 'Their own words on the issues' });
    else links.push({ label: 'Search DuckDuckGo for their campaign', href: `https://duckduckgo.com/?q=${q(`${c.name.replace(/["“”][^"“”]*["“”]\s*/g, '')} ${race.office} Chicago 2027`)}`, note: 'No campaign site on record, so this opens a web search, not their site' });
    if (c.profile) links.push({ label: 'Their page on Chicago Politics', href: c.profile, note: 'Their nominating petition’s signature count and campaign money, from public records' });
    if (c.money) links.push({ label: 'Their committee at the Illinois State Board of Elections', href: `https://www.elections.il.gov/CampaignDisclosure/CommitteeDetail.aspx?ID=${c.money.id}`, note: 'Every report, donor and expense, on the Illinois State Board of Elections’ site' });
    else links.push({ label: 'Illinois State Board of Elections: committee search', href: LINKS.disclosure, note: 'The State Board of Elections’ records: search for their committee' });
    const ward = race.area?.type === 'ward' && c.incumbent ? data.wards?.[race.area.id] : undefined;
    if (ward?.site) links.push({ label: `Ward office site: ${sourceName(ward.site)}`, href: ward.site, note: `The ward’s official site${ward.phone ? `; ${ward.phone}` : ''}` });
    links.push({ label: 'Chicago Board of Elections candidate list', href: LINKS.candidates, note: 'The official list: every filing and its status' });
    return links;
  };
}

export function chicagoConfig(data: StateData): StateConfig {
  return {
    region: 'Chicago',
    areaLabel,
    scopeLabel: () => 'Citywide question',
    explainOffice,
    researchLinks: researchLinks(data),
    moneySource: () => 'Illinois State Board of Elections',
    noMoney: () => 'No campaign committee on file with the Illinois State Board of Elections for this election. A candidate who raises or spends under $5,000 in a year doesn’t need one.',
    compareNote: 'Money comes from Illinois State Board of Elections reports since Jan 1, 2025; who holds each seat from the City’s ward offices and the CCPSA. Tap “ⓘ Details” under a name for their links.',
    electionDate: ELECTION_DAY,
  };
}

/** The voter's districts, as chips: "Ward 31", "Police District 25". */
export const DISTRICT_CHIPS: [string, string][] = [['ward', 'Ward'], ['police', 'Police District']];
