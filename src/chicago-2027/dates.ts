import type { KeyDate } from '../dates';

// Chicago's Feb 23, 2027 city election, from the Chicago Board of Election
// Commissioners' 2027 Election Information Pamphlet and Calendar (published
// June 9, 2026; linked in config.ts). Online registration isn't in the
// Board's calendar: Illinois closes it 16 days before an election (10 ILCS
// 5/1A-16.5), as it did on Oct 18 for Nov 3, 2026.

export const ELECTION_DAY = '2027-02-23';
export const RUNOFF_DAY = '2027-04-06';

export const KEY_DATES: KeyDate[] = [
  { id: 'mail-opens', date: '2026-11-25', title: 'Mail ballot applications open', detail: 'Apply on the Board’s website or by mail. Voters already on the permanent vote-by-mail list get theirs without applying.' },
  { id: 'certified', date: '2026-12-17', title: 'The Board certifies the ballot', detail: 'Who is on it, once objections are decided. The last day a candidate can withdraw.' },
  { id: 'early-opens', date: '2027-01-14', title: 'Early voting can begin', detail: 'The earliest day the law allows, at the Board’s offices and the sites it names. The Board publishes every site, day and hour by Jan 3.', remind: ['0900', '1000'] },
  { id: 'register', date: '2027-01-26', title: 'Last day to register or update your address the regular way', detail: 'At the Board, a library branch or a deputy registrar. Online registration runs through Sun, Feb 7.' },
  { id: 'grace', date: '2027-01-27', title: 'Register and vote at the same time', detail: 'From today through Election Day: register (or update your address) in person when you vote early or on Election Day. Bring two IDs, one with your current address.' },
  { id: 'register-online', date: '2027-02-07', title: 'Last day to register online', detail: 'At ova.elections.il.gov, with an Illinois driver’s license or state ID. After this, register in person when you vote.' },
  { id: 'mail-closes', date: '2027-02-18', title: 'Last day to apply for a mail ballot', detail: 'On the Board’s website or by mail. Apply earlier to be safe: it has to reach you and get back.', remind: ['0900', '0930'] },
  { id: 'last-early', date: '2027-02-22', title: 'Last day of early voting', remind: ['0900', '1000'] },
  { id: 'election', date: ELECTION_DAY, title: 'Election Day', detail: 'Polls open 6am–7pm. A mail ballot counts if it’s postmarked by today and arrives by Mar 9.', remind: ['0600', '0700'] },
  { id: 'runoff', date: RUNOFF_DAY, title: 'Runoffs, where needed', detail: 'For mayor, clerk, treasurer or any ward where no one got more than half the vote: the top two meet again. District councils have no runoff.' },
];

export const byId = (id: string) => KEY_DATES.find((d) => d.id === id)!;
