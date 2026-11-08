import type { StateData } from '../guide/types';
import type { Faq } from '../seo/faq';
import { longDate, shortDate } from '../seo/format';
import { daysUntil } from '../store';
import { explainOffice } from './config';
import { ELECTION_DAY, KEY_DATES } from './dates';

// The questions voters ask about Chicago's 2027 city election, answered from
// the guide's own data (the Board's candidate list) and the Board's rules.
// The page's FAQ structured data says exactly these words.

const list = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function chicagoFaq(data: StateData): Faq[] {
  const past = daysUntil(ELECTION_DAY) < 0;
  const is = past ? 'was' : 'is';
  const race = (id: string) => data.races.find((r) => r.id === id);
  const names = (id: string) => race(id)?.candidates.map((c) => c.name) ?? [];
  const asOf = data.sources.candidates.asOf;
  const wards = data.races.filter((r) => r.section === 'council');
  const contested = wards.filter((r) => r.candidates.length > 1).length;
  const filed = data.races.reduce((n, r) => n + r.candidates.length, 0);
  const out: Faq[] = [
    { q: `When ${is} Chicago’s 2027 city election?`, a: `${longDate(ELECTION_DAY)}. Polls are open 6am to 7pm. Where no one gets more than half the vote for mayor, clerk, treasurer or alderperson, the top two meet in a runoff on ${longDate('2027-04-06')}.` },
    { q: `What ${is} on the ballot?`, a: `Mayor, City Clerk and City Treasurer for every voter; the alderperson for your ward (one of 50); and three members of your police district’s District Council (one of 22). Every race is nonpartisan: no party is printed next to any name. ${filed} candidates filed by the Oct 26, 2026 deadline.` },
    { q: `Who ${past ? 'ran' : 'is running'} for mayor of Chicago in 2027?`, a: `${list(names('mayor'))}, in the Board of Election Commissioners’ ballot order (its list as of ${asOf}). A name comes off only if the Board sustains an objection to it, or the candidate withdraws by Dec 17, 2026, when the Board certifies the ballot.` },
    { q: `Who ${past ? 'ran' : 'is running'} for City Clerk and City Treasurer?`, a: `City Clerk: ${list(names('city-clerk'))}. City Treasurer: ${list(names('city-treasurer'))}. (The Board’s list as of ${asOf}.)` },
    { q: 'What does the mayor do?', a: explainOffice('Mayor') },
    { q: 'What does an alderperson do?', a: `${explainOffice('Alderperson')} ${contested} of the 50 ward races have more than one candidate.` },
    { q: 'What is a police District Council?', a: explainOffice('Police District Council') },
    { q: 'How do I find my ward and police district?', a: 'Enter your address on this page: your ward and police district are matched on your device from the City’s maps, and the guide shows just your races. The Board of Election Commissioners’ Your Voter Information lookup shows your official sample ballot.' },
    { q: `What ${past ? 'were' : 'are'} the key dates?`, a: KEY_DATES.map((d) => `${shortDate(d.date)}: ${d.title}${d.detail ? `. ${d.detail}` : '.'}`).join(' ') },
    { q: 'Is Know Your Ballot nonpartisan, and where do its facts come from?', a: 'It is nonpartisan: it never recommends or rates a candidate. Who is running comes from the Chicago Board of Election Commissioners’ official list; who holds each seat from the City’s ward offices data and the Community Commission for Public Safety and Accountability; campaign money from the Illinois State Board of Elections. Every fact names its source next to it.' },
  ];
  return out;
}
