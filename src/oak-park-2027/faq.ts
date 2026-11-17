import type { StateData } from '../guide/types';
import type { Faq } from '../seo/faq';
import { longDate, shortDate } from '../seo/format';
import { daysUntil } from '../store';
import { explainOffice, RCV } from './config';
import { ELECTION_DAY, KEY_DATES } from './dates';

// The questions voters ask about Oak Park's 2027 election, answered from the
// guide's own data (campaign committees on file with the State Board of
// Elections, and the bodies' own rosters) and the State Board's calendar.
// The page's FAQ structured data says exactly these words.

const list = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function oakParkFaq(data: StateData): Faq[] {
  const past = daysUntil(ELECTION_DAY) < 0;
  const is = past ? 'was' : 'is';
  const asOf = data.sources.candidates.asOf;
  const trustees = data.races.find((r) => r.id === 'village-trustee')?.candidates ?? [];
  const onFile = trustees.filter((c) => c.filing !== 'Announced').map((c) => c.name);
  const announced = trustees.filter((c) => c.filing === 'Announced').map((c) => c.name);
  return [
    { q: `When ${is} Oak Park’s next election?`, a: `${longDate(ELECTION_DAY)}, Illinois’ consolidated election. Polls are open 6am to 7pm; early voting can start Feb 25 and mail ballots go out from then. There is no February primary for any Oak Park race.` },
    { q: `What ${is} on the Oak Park ballot?`, a: 'Three Village Trustees; five District 97 school board members (four 4-year seats and one 2-year seat); three District 200 (OPRF High School) board members; three Library Trustees; three Park District Commissioners; and two Triton College trustees. The Village President and Village Clerk are not up until 2029. Every race is nonpartisan.' },
    { q: `Who ${past ? 'ran' : 'is running'} for Oak Park village trustee in 2027?`, a: trustees.length ? `${onFile.length ? `${list(onFile)} ${onFile.length === 1 ? 'is' : 'are'} listed as 2027 candidates with the Illinois State Board of Elections (as of ${asOf}).` : ''}${announced.length ? ` ${list(announced)} ${announced.length === 1 ? 'has announced, as the Wednesday Journal reported, but isn’t' : 'have announced, as the Wednesday Journal reported, but aren’t'} listed with the State Board as 2027 candidates yet.` : ''} The official ballot is certified Jan 28, 2027.`.trim() : 'No one is listed with the State Board or has been reported as running yet.' },
    { q: 'Will Oak Park use ranked-choice voting in 2027?', a: RCV },
    { q: 'What does the Village Board do?', a: explainOffice('Village Trustee') },
    { q: 'What do the school boards do?', a: `${explainOffice('District 97 Board of Education, 4-year')} ${explainOffice('District 200 Board of Education')}` },
    { q: 'Who runs Oak Park’s election, and where do I vote?', a: 'The Cook County Clerk, which runs elections for suburban Cook County: registration, polling places, early voting, mail ballots and the count. Its voter lookup shows your polling place and official sample ballot.' },
    { q: `What ${past ? 'were' : 'are'} the key dates?`, a: KEY_DATES.map((d) => `${shortDate(d.date)}: ${d.title}${d.detail ? `. ${d.detail}` : '.'}`).join(' ') },
    { q: 'Is Know Your Ballot nonpartisan, and where do its facts come from?', a: 'It is nonpartisan: it never recommends or rates a candidate. Who’s running and their money come from the Illinois State Board of Elections’ campaign finance files, with candidates who have only announced taken from the Wednesday Journal and marked as such; who holds each seat from each board’s own page; the dates from the State Board’s 2027 calendar. Every fact names its source next to it.' },
  ];
}
