import type { KeyDate } from '../dates';

// Wisconsin's spring 2027 dates: the primary on Tue, Feb 16 (third Tuesday in
// February, Wis. Stat. 5.02(22)) and the election on Tue, Apr 6 (first Tuesday
// in April, 5.02(21)), with the same rules as Nov 2026 (src/wisconsin/dates.ts):
// registration by mail or online closes 20 days out (6.28), at the clerk's
// office the Friday before (6.29), at the polls on Election Day (6.55);
// in-person absentee voting may run from 14 days out to the Sunday before
// (6.86); mail absentee requests close 5pm the Thursday before, and ballots must
// reach the clerk by 8pm on Election Day (6.87). Nomination papers are due 5pm
// on the first Tuesday in January (8.10(2)(a)), Jan 5, 2027.

export const PRIMARY_DAY = '2027-02-16';
export const ELECTION_DAY = '2027-04-06';

export const KEY_DATES: KeyDate[] = [
  { id: 'filing', date: '2027-01-05', title: 'Candidates file by 5pm', detail: 'Nomination papers are due. Then it’s known who is running, and whether any race needs a Feb 16 primary.' },
  { id: 'primary-register', date: '2027-01-27', title: 'Primary: last day to register online or by mail', detail: 'Only where a primary is held. After this, register at your clerk’s office through Fri, Feb 12, or at the polls.' },
  { id: 'primary-early', date: '2027-02-02', title: 'Primary: in-person absentee voting can begin', detail: 'Only where a primary is held. Each municipality sets its own days and hours, through Sun, Feb 14 at the latest.' },
  { id: 'primary-absentee', date: '2027-02-11', title: 'Primary: last day to request a mail ballot', detail: 'By 5pm, at MyVote.wi.gov or with your clerk.' },
  { id: 'primary', date: PRIMARY_DAY, title: 'Spring primary, only where needed', detail: 'Held only for an office where more than two people filed; it narrows each to two. Polls open 7am–8pm. Bring photo ID.', remind: ['0600', '0700'] },
  { id: 'register', date: '2027-03-17', title: 'Last day to register online or by mail', detail: 'After this, register in person at your municipal clerk’s office through Fri, Apr 2, or at your polling place on Election Day, with proof of where you live.' },
  { id: 'early-opens', date: '2027-03-23', title: 'In-person absentee voting can begin', detail: 'Each city, village and town sets its own days and hours, from today at the earliest through Sun, Apr 4 at the latest. Bring photo ID.', remind: ['0900', '1000'] },
  { id: 'absentee', date: '2027-04-01', title: 'Last day to request a mail ballot', detail: 'By 5pm, at MyVote.wi.gov or with your clerk. Request earlier to be safe: the ballot has to reach you and get back by 8pm on Apr 6.', remind: ['0900', '0930'] },
  { id: 'election', date: ELECTION_DAY, title: 'Election Day', detail: 'Polls open 7am–8pm. Bring photo ID. Mail ballots must reach your clerk by 8pm.', remind: ['0600', '0700'] },
];

export const byId = (id: string) => KEY_DATES.find((d) => d.id === id)!;
