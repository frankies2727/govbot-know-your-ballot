import type { StateData } from '../guide/types';
import type { Faq } from '../seo/faq';
import { longDate, shortDate } from '../seo/format';
import { daysUntil } from '../store';
import { explainOffice } from './config';
import { ELECTION_DAY, KEY_DATES, RUNOFF_DAY } from './dates';

// The questions voters ask about Denver's 2027 municipal election, answered
// from the guide's own data (Denver SearchLight's registered candidates) and
// the Elections Division's rules. The page's FAQ structured data says exactly
// these words.

const list = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function denverFaq(data: StateData): Faq[] {
  const past = daysUntil(ELECTION_DAY) < 0;
  const is = past ? 'was' : 'is';
  const names = (id: string) => data.races.find((r) => r.id === id)?.candidates.map((c) => c.name) ?? [];
  const asOf = data.sources.candidates.asOf;
  const registered = data.races.reduce((n, r) => n + r.candidates.length, 0);
  const mayor = names('mayor');
  return [
    { q: `When ${is} Denver’s 2027 municipal election?`, a: `${longDate(ELECTION_DAY)}. Every registered voter gets a ballot in the mail from Mar 15; it has to be back by 7pm on Election Day. Where no one gets more than half the vote, the top two meet in a runoff on ${longDate(RUNOFF_DAY)}.` },
    { q: `What ${is} on the ballot?`, a: 'Mayor, Auditor and Clerk and Recorder; City Council At-Large Seats A and B, which every voter votes in; and the City Council member for your district, one of 11. Every race is nonpartisan: no party is printed next to any name.' },
    { q: `Who ${past ? 'ran' : 'is running'} for mayor of Denver in 2027?`, a: mayor.length ? `${list(mayor)} have registered campaigns with Denver SearchLight (as of ${asOf}). Registering isn’t qualifying: candidates turn in petitions by Jan 21, 2027, and the Elections Division certifies who is on the ballot.` : 'No one has registered yet.' },
    { q: 'What does the mayor do?', a: explainOffice('Mayor') },
    { q: 'What does the Auditor do?', a: explainOffice('Auditor') },
    { q: 'What changed about the at-large council seats?', a: `${explainOffice('City Council At-Large, Seat A')} Before 2027, the two at-large members were elected in one race, the top two winning.` },
    { q: 'How do I find my council district?', a: 'Enter your address on this page: your district is matched on your device from the City’s council district map, and the guide shows just your races.' },
    { q: `What ${past ? 'were' : 'are'} the key dates?`, a: KEY_DATES.map((d) => `${shortDate(d.date)}: ${d.title}${d.detail ? `. ${d.detail}` : '.'}`).join(' ') },
    { q: 'Is Know Your Ballot nonpartisan, and where do its facts come from?', a: `It is nonpartisan: it never recommends or rates a candidate. The ${registered} candidates and their money come from Denver SearchLight, the City’s campaign finance system; who holds each seat from the City’s council district map and its own pages; the dates and rules from the Denver Elections Division. Every fact names its source next to it.` },
  ];
}
