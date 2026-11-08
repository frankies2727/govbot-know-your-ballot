import type { StateData } from '../guide/types';
import type { Faq } from '../seo/faq';
import { longDate, shortDate } from '../seo/format';
import { daysUntil } from '../store';
import { explainOffice } from './config';
import { ELECTION_DAY, GENERAL_DAY, KEY_DATES } from './dates';

// The questions voters ask about Jacksonville's 2027 city election, answered
// from the guide's own data and the Supervisor of Elections' rules. The page's
// FAQ structured data says exactly these words.

const list = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function jacksonvilleFaq(data: StateData): Faq[] {
  const past = daysUntil(ELECTION_DAY) < 0;
  const is = past ? 'was' : 'is';
  const mayor = data.races.find((r) => r.id === 'mayor')?.candidates ?? [];
  const named = mayor.map((c) => (c.party ? `${c.name} (${c.party})` : c.name));
  return [
    { q: `When ${is} Jacksonville’s 2027 election?`, a: `The First Election is ${longDate(ELECTION_DAY)}, polls open 7am to 7pm. In any race where no one gets more than half the vote, the top two meet again in the General Election on ${longDate(GENERAL_DAY)}.` },
    { q: `What ${is} on the ballot?`, a: 'Mayor; Sheriff, Property Appraiser, Supervisor of Elections and Tax Collector; the five at-large City Council seats; and the council member for your district, one of 14. Every Duval County voter votes in it, the Beaches and Baldwin included.' },
    { q: 'Do I have to be in a party to vote in it?', a: 'No. Jacksonville holds one election for everyone: every candidate, of every party, is on the same ballot for every voter, with the party printed next to each name. More than half the votes wins outright; otherwise the top two meet on May 18.' },
    { q: `Who ${past ? 'ran' : 'is running'} for mayor of Jacksonville in 2027?`, a: mayor.length ? `${list(named)} have declared, as the Wikipedia article on the race lists them (read ${data.sources.candidates.asOf}). Candidates qualify from noon Jan 11 to noon Jan 15, 2027; the Supervisor of Elections’ list is the official one.` : 'Candidates qualify from noon Jan 11 to noon Jan 15, 2027.' },
    { q: 'What does the mayor do?', a: explainOffice('Mayor') },
    { q: 'What do the Property Appraiser and Tax Collector do?', a: `${explainOffice('Property Appraiser')} The Tax Collector: ${explainOffice('Tax Collector')}` },
    { q: 'How do I find my council district?', a: 'Enter your address on this page: your district is matched on your device from the City’s council district map, and the guide shows just your races.' },
    { q: `What ${past ? 'were' : 'are'} the key dates?`, a: KEY_DATES.map((d) => `${shortDate(d.date)}: ${d.title}${d.detail ? `. ${d.detail}` : '.'}`).join(' ') },
    { q: 'Is Know Your Ballot nonpartisan, and where do its facts come from?', a: 'It is nonpartisan: it never recommends or rates a candidate. The dates and the offices come from the Duval County Supervisor of Elections; who holds each seat from the City Council’s and each office’s own pages; the council districts from the City’s map. Until qualifying closes, the mayor’s race lists who has declared, from Wikipedia (CC BY-SA). Every fact names its source next to it.' },
  ];
}
