import type { StateData } from '../guide/types';
import type { Faq } from '../seo/faq';
import { longDate, shortDate } from '../seo/format';
import { daysUntil } from '../store';
import { explainOffice } from './config';
import { ELECTION_DAY, KEY_DATES, PRIMARY_DAY } from './dates';

// The questions voters ask about Wisconsin's spring 2027 election, answered
// from the guide's own data and Wisconsin election law. The page's FAQ
// structured data says exactly these words.

const list = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function springFaq(data: StateData): Faq[] {
  const past = daysUntil(ELECTION_DAY) < 0;
  const court = data.races.find((r) => r.id === 'supreme-court');
  const official = (data.sources as { official?: boolean }).official;
  const circuits = data.races.filter((r) => r.id.startsWith('circuit-')).length;
  const names = court?.candidates.map((c) => c.name) ?? [];
  return [
    { q: `When ${past ? 'was' : 'is'} Wisconsin’s 2027 spring election?`, a: `${longDate(ELECTION_DAY)}, polls open 7am to 8pm. A primary on ${longDate(PRIMARY_DAY)} is held only for an office where more than two people filed, to narrow it to two.` },
    { q: `What ${past ? 'was' : 'is'} on the statewide ballot?`, a: `An open seat on the Wisconsin Supreme Court (Justice Annette Ziegler is retiring), a seat on the Court of Appeals in each of its four districts, and ${circuits} circuit court seats across the state, by county. Every spring race is nonpartisan. Your city, village, town and school races are on your sample ballot at MyVote.wi.gov.` },
    { q: `Who ${past ? 'ran' : 'is running'} for the Wisconsin Supreme Court in 2027?`, a: names.length ? `${list(names)}${official ? ', on the Elections Commission’s list' : ' have announced; candidates file by 5pm on Jan 5, 2027, and the Elections Commission’s list is the official one'}.` : 'Candidates file by 5pm on Jan 5, 2027.' },
    { q: 'What does a Wisconsin Supreme Court justice do?', a: explainOffice('Justice of the Supreme Court') },
    { q: 'What does a circuit court judge do?', a: explainOffice('Circuit Court Judge') },
    { q: `What ${past ? 'were' : 'are'} the key dates?`, a: KEY_DATES.map((d) => `${shortDate(d.date)}: ${d.title}${d.detail ? `. ${d.detail}` : '.'}`).join(' ') },
    { q: 'Do I need a photo ID to vote?', a: 'Yes. Wisconsin requires a photo ID at the polls, at early voting and with a mail ballot; the address on it doesn’t need to be current, and a free state ID is available from the DMV.' },
    { q: 'Is Know Your Ballot nonpartisan, and where do its facts come from?', a: 'It is nonpartisan: it never recommends or rates a candidate. Until the Elections Commission’s candidate list is out after the Jan 5 filing deadline, the seats and who has announced come from the Wikipedia articles on the 2027 Wisconsin elections (CC BY-SA), cited on the page; then the Commission’s list replaces them. Dates follow Wisconsin election law.' },
  ];
}
