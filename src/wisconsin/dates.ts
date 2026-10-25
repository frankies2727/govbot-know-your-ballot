import type { KeyDate } from '../dates';

// Wisconsin's Nov 3, 2026 dates, from the Wisconsin Elections Commission's
// voter pages (elections.wi.gov, myvote.wi.gov) and Wisconsin election law:
// registration by mail or online closes 20 days out (Wis. Stat. 6.28), at
// the clerk's office the Friday before (6.29), at the polls on Election Day
// (6.55); in-person absentee voting may run from 14 days out to the Sunday
// before (6.86); mail absentee requests close 5pm the Thursday before, and
// ballots must reach the clerk by 8pm on Election Day (6.87). Checked
// October 25, 2026.

export const ELECTION_DAY = '2026-11-03';

export const KEY_DATES: KeyDate[] = [
  { id: 'register', date: '2026-10-14', title: 'Last day to register online or by mail', detail: 'After this, register in person at your municipal clerk’s office through Fri, Oct 30, or at your polling place on Election Day, with proof of where you live.' },
  { id: 'early-opens', date: '2026-10-20', title: 'In-person absentee voting can begin', detail: 'Each city, village and town sets its own days and hours, from today at the earliest through Sun, Nov 1 at the latest. Bring photo ID.', remind: ['0900', '1000'] },
  { id: 'absentee', date: '2026-10-29', title: 'Last day to request a mail ballot', detail: 'By 5pm, at MyVote.wi.gov or with your clerk. Request earlier to be safe: the ballot still has to reach you and get back by 8pm on Nov 3.', remind: ['0900', '0930'] },
  { id: 'register-clerk', date: '2026-10-30', title: 'Last day to register at your clerk’s office', detail: 'By 5pm or the close of business. After this, only at the polls on Election Day.' },
  { id: 'last-early', date: '2026-11-01', title: 'Last possible day of in-person absentee voting', detail: 'Many clerks end on Fri, Oct 30; check your municipality’s hours.', remind: ['0900', '1000'] },
  { id: 'election', date: ELECTION_DAY, title: 'Election Day', detail: 'Polls open 7am–8pm. Bring photo ID. Mail ballots must reach your clerk by 8pm.', remind: ['0600', '0700'] },
];

export const byId = (id: string) => KEY_DATES.find((d) => d.id === id)!;
