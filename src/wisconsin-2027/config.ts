import type { GuideSection } from '../guide/spec';
import { sourceName } from '../lib/sources';
import type { ResearchLink } from '../research';
import type { StateConfig } from '../state';
import type { Candidate, Race } from '../types';
import { LINKS } from '../wisconsin/config';
import { ELECTION_DAY } from './dates';

// Wisconsin's spring 2027 election: the courts. Every spring race is
// nonpartisan. Terms and the courts' work from the Wisconsin Constitution
// (art. VII: justices serve 10 years, appeals and circuit judges 6, each term
// starting Aug 1) and the Wisconsin Court System; checked November 8, 2026.

export { LINKS };

const WHITE = '#FFFFFF';
export const SECTIONS: readonly GuideSection[] = [
  { id: 'state', title: 'Supreme Court', color: 'var(--wi-cardinal)', ink: WHITE, emoji: '⚖️' },
  { id: 'judicial', title: 'Your judges', color: 'var(--wi-navy)', ink: WHITE, emoji: '🏛️' },
];

const PRIMARY = 'If more than two people file, a Feb 16 primary narrows it to two.';
const EXPLAINERS: [RegExp, string][] = [
  [/^Justice of the Supreme Court/, `One of the seven justices on Wisconsin’s highest court, which has the final word on the state constitution and state law and oversees the state’s courts and lawyers. Justice Annette Ziegler’s seat. 10-year term from Aug 1, 2027. ${PRIMARY}`],
  [/^Judge of the Court of Appeals/, `One of 16 judges on the Court of Appeals, which hears appeals from the circuit courts in its district; for most cases its ruling is the last word. 6-year term from Aug 1, 2027. ${PRIMARY}`],
  [/^Circuit Court Judge/, `A judge on your county’s trial court, which hears criminal, civil, family, juvenile and probate cases. 6-year term from Aug 1, 2027. ${PRIMARY}`],
];
export const explainOffice = (office: string) => EXPLAINERS.find(([re]) => re.test(office))?.[1] ?? '';

const areaLabel = (r: Race) => (!r.area ? 'Statewide' : r.area.type === 'coa' ? `Appeals District ${r.area.id}` : `${r.area.id} County`);

const q = encodeURIComponent;
function researchLinks(c: Candidate, race: Race): ResearchLink[] {
  const links: ResearchLink[] = [];
  if (c.website) links.push({ label: `Campaign site: ${sourceName(c.website)}`, href: c.website, note: 'Their own words' });
  else links.push({ label: 'Search DuckDuckGo for their campaign', href: `https://duckduckgo.com/?q=${q(`${c.name} ${race.office} Wisconsin 2027`)}`, note: 'No campaign site on record, so this opens a web search, not their site' });
  links.push({ label: 'Search Ballotpedia', href: `https://ballotpedia.org/wiki/index.php?search=${q(c.name)}`, note: 'Bio and past races' });
  links.push({ label: 'Wisconsin campaign finance system search', href: LINKS.disclosure, note: 'The state’s campaign finance system: search for their committee' });
  return links;
}

export const WISCONSIN_2027: StateConfig = {
  region: 'Wisconsin',
  areaLabel,
  scopeLabel: () => 'Statewide question',
  explainOffice,
  researchLinks,
  moneySource: () => 'Wisconsin Ethics Commission',
  noMoney: () => 'No campaign money on file here yet.',
  compareNote: 'Every spring race is nonpartisan. Candidates are the ones who have announced until the Elections Commission’s list is out after the Jan 5 filing deadline.',
  electionDate: ELECTION_DAY,
  noCandidates: 'Candidates file by 5pm on Tue, Jan 5, 2027; the Elections Commission’s list fills in here.',
};

export const DISTRICT_CHIPS: [string, string][] = [['county', 'County'], ['coa', 'Appeals District']];
