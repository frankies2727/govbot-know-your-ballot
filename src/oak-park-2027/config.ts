import type { GuideSection } from '../guide/spec';
import { sourceName } from '../lib/sources';
import type { ResearchLink } from '../research';
import type { StateConfig } from '../state';
import type { Candidate, Race } from '../types';
import { ELECTION_DAY } from './dates';

// Everything specific to Oak Park's Apr 6, 2027 consolidated election that the
// shared guide asks for. The offices and seats are from each body's own pages
// and notices (the Village's elected officials page, District 97's and
// District 200's boards, the Library's and the Park District's, Triton
// College's 2027 notice of filing); the filing rules and terms from the
// Illinois State Board of Elections' 2027 Candidate's Guide; checked November
// 17, 2026.

export const LINKS = {
  /** The Cook County Clerk runs suburban Cook's elections: registration, sample ballot, polling place. */
  clerk: 'https://www.cookcountyclerkil.gov/elections',
  myInfo: 'https://www.cookcountyclerkil.gov/elections/your-voter-information',
  registerOnline: 'https://ova.elections.il.gov/',
  village: 'https://www.oak-park.us/your-government/elected-officials',
  villageClerk: 'https://www.oak-park.us/Government/Leadership/Office-of-Village-Clerk',
  d97: 'https://www.op97.org/boe',
  d200: 'https://www.oprfhs.org/about/board-of-education',
  library: 'https://www.oppl.org/about/board-of-trustees/',
  park: 'https://pdop.org/welcome/board-of-commissioners/',
  triton: 'https://www.triton.edu/about/administration/board-of-trustees.html',
  tritonNotice: 'https://www.triton.edu/images_documents/contentassets/board-of-trustees-documents/consolidated_election_2027_notice_of_filing1.pdf',
  calendar: 'https://cdn.ymaws.com/www.ilparks.org/resource/resmgr/legislative_material/election_calendar/2027electionandcampaignfinan.pdf',
  candidatesGuide: 'https://www.stclaircountyil.gov/webdocuments/departments/countyclerk/2027Resources/2027%20Candidates%20Guide%20(1).pdf',
  disclosure: 'https://www.elections.il.gov/CampaignDisclosure/CommitteeSearch.aspx',
  /** Ranked-choice voting: the 2024 question and what has happened since. */
  rcvQuestion: 'https://www.lwvoprf.org/oak-park-referendums.html',
  rcvNews: 'https://www.oakpark.com/2024/11/06/oak-park-ranked-choice-voting-approved/',
  rcvClerk: 'https://www.yahoo.com/news/articles/ranked-choice-voting-could-boost-110000035.html',
  wednesdayJournal: 'https://www.oakpark.com/',
};

const INK = '#1C1606';
const WHITE = '#FFFFFF';
export const SECTIONS: readonly GuideSection[] = [
  { id: 'city', title: 'Village Board', color: 'var(--op-green)', ink: WHITE, emoji: '🌳' },
  { id: 'school', title: 'School boards', color: 'var(--op-gold)', ink: INK, emoji: '🏫' },
  { id: 'council', title: 'Library and parks', color: 'var(--op-brick)', ink: WHITE, emoji: '📚' },
  { id: 'education', title: 'Triton College', color: 'var(--op-sky)', ink: INK, emoji: '🎓' },
];

/** How the three trustees are chosen: settled by the 2024 vote, unsettled by the county. */
export const RCV = 'Oak Park voters approved ranked-choice voting for the village president and trustees in Nov 2024, to start in 2027; the Cook County Clerk, who runs the election, has said Illinois law doesn’t allow it yet. Until that’s settled, the usual rule is the three with the most votes win.';
const NO_PRIMARY = 'Nonpartisan: no party is printed, and there is no primary.';
// Plain-English "what does this job actually do", factual and neutral.
const EXPLAINERS: [RegExp, string][] = [
  [/^Village Trustee/, `One of six trustees who, with the Village President, make up the Village Board: they set Oak Park’s policies, pass its ordinances, budget and property tax levy, and hire the Village Manager, who runs the village day to day. Elected by the whole village for 4 years; three of the six seats are up. ${RCV}`],
  [/^District 97 Board of Education, 4-year/, `Oak Park Elementary School District 97 runs the village’s public elementary and middle schools. Its seven board members, elected by the whole village, set policy, adopt the budget and the school property tax levy, and hire the superintendent. Four seats with 4-year terms are up; the four with the most votes win. ${NO_PRIMARY}`],
  [/^District 97 Board of Education, 2-year/, `The same District 97 board: this one seat is for the 2 years left on a term that runs to 2029, filled by appointment since June 2026. The candidate with the most votes wins. ${NO_PRIMARY}`],
  [/^District 200 Board of Education/, `Oak Park and River Forest High School District 200 runs OPRF High School. Its seven board members, elected by Oak Park and River Forest voters, adopt and enforce the district’s policies, budget and tax levy and hire the superintendent. Three seats with 4-year terms are up; the three with the most votes win. ${NO_PRIMARY}`],
  [/^Library Trustee/, `The Oak Park Public Library’s seven trustees oversee the Main Library and the Dole and Maze branches: they adopt its budget and tax levy, set its policies and hire its executive director. Three seats with 4-year terms are up; the three with the most votes win. ${NO_PRIMARY}`],
  [/^Park District Commissioner/, `The Park District of Oak Park runs the village’s parks, pools, ice arena and recreation programs. Its five commissioners set policy, adopt the budget and tax levy, and hire the executive director. Three seats with 4-year terms are up; the three with the most votes win. ${NO_PRIMARY}`],
  [/^Triton College Trustee/, `Triton College in River Grove is the community college for Oak Park and its neighbors in Community College District 504. Its seven elected trustees set tuition and the budget, levy its property tax and hire the president. Two seats with 6-year terms are up, elected by the whole district; the two with the most votes win. ${NO_PRIMARY}`],
];
export const explainOffice = (office: string) => EXPLAINERS.find(([re]) => re.test(office))?.[1] ?? '';

const q = encodeURIComponent;
const BOARD: Record<string, [string, string]> = {
  'village-trustee': ['Village of Oak Park: elected officials', LINKS.village],
  'd97-board': ['District 97 Board of Education', LINKS.d97],
  'd97-board-2-year': ['District 97 Board of Education', LINKS.d97],
  'd200-board': ['District 200 Board of Education', LINKS.d200],
  'library-trustee': ['Oak Park Public Library: Board of Trustees', LINKS.library],
  'park-commissioner': ['Park District of Oak Park: Board of Commissioners', LINKS.park],
  'triton-trustee': ['Triton College: Board of Trustees', LINKS.triton],
};
function researchLinks(c: Candidate, race: Race): ResearchLink[] {
  const links: ResearchLink[] = [];
  if (c.website) links.push({ label: `Campaign site: ${sourceName(c.website)}`, href: c.website, note: 'Their own words on the issues' });
  else links.push({ label: 'Search DuckDuckGo for their campaign', href: `https://duckduckgo.com/?q=${q(`${c.name} ${race.office.replace(/\s*\(.*\)$/, '')} Oak Park 2027`)}`, note: 'No campaign site on record, so this opens a web search, not their site' });
  if (c.profile) links.push({ label: `Wednesday Journal: their announcement`, href: c.profile, note: 'Oak Park’s local paper on their campaign' });
  links.push({ label: 'Their committee at the Illinois State Board of Elections', href: LINKS.disclosure, note: 'Search their name: every report, donor and expense' });
  const [board, href] = BOARD[race.id] ?? BOARD['village-trustee'];
  links.push({ label: board, href, note: 'Who serves on the board now, and what it does' });
  return links;
}

export const OAK_PARK_2027: StateConfig = {
  region: 'Oak Park',
  areaLabel: (r: Race) => (r.id === 'd200-board' ? 'Oak Park and River Forest' : r.id === 'triton-trustee' ? 'Community College District 504' : 'Village of Oak Park'),
  scopeLabel: () => 'Village question',
  explainOffice,
  researchLinks,
  moneySource: () => 'Illinois State Board of Elections',
  noMoney: () => 'No campaign committee reports on file with the Illinois State Board of Elections. A candidate who raises or spends under $5,000 doesn’t need a committee.',
  compareNote: 'Money comes from Illinois State Board of Elections reports since Jan 1, 2025. Who’s running comes from the State Board’s 2027 candidate filings, and from the Wednesday Journal for those who have announced but aren’t filed there yet; the official ballot is certified Jan 28, 2027.',
  electionDate: ELECTION_DAY,
  listFinal: false,
  noCandidates: 'No one is listed with the State Board for this seat yet, and none has been reported. Petitions were filed Nov 16–23, 2026; the official list follows once objections are settled.',
};

/** Every race is the same for every Oak Park voter; the precinct says where they vote. */
export const DISTRICT_CHIPS: [string, string][] = [['precinct', 'Oak Park Precinct']];
