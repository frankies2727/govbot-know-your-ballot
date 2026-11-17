import type { KeyDate } from '../dates';

// Oak Park's Apr 6, 2027 consolidated election, from the Illinois State Board
// of Elections' 2027 Election & Campaign Finance Calendar (issued June 29,
// 2026) and its 2027 Candidate's Guide (July 7, 2026). Suburban Cook County's
// election is run by the Cook County Clerk, who sets early voting sites and
// hours; mail ballots postmarked by Election Day count if they arrive within
// 14 days (10 ILCS 5/19-8).

export const ELECTION_DAY = '2027-04-06';

export const KEY_DATES: KeyDate[] = [
  { id: 'filing', date: '2026-11-16', title: 'Candidates file their petitions', detail: 'Through Mon, Nov 23: village and library candidates with the Village Clerk, park commissioners with the Park District, school board candidates with the Cook County Clerk, Triton trustees with the college.' },
  { id: 'objections', date: '2026-12-02', title: 'Last day to object to a candidate’s petitions', detail: 'Objections are heard by each body’s electoral board; anyone removed is off the ballot.' },
  { id: 'mail-opens', date: '2027-01-06', title: 'Mail ballot applications open', detail: 'Apply with the Cook County Clerk. Voters on the permanent vote-by-mail list get theirs without applying.' },
  { id: 'certified', date: '2027-01-28', title: 'The ballot is certified', detail: 'Who is on it, and any ballot questions, certified to the Cook County Clerk.' },
  { id: 'early-opens', date: '2027-02-25', title: 'Early voting can begin, and mail ballots go out', detail: 'The earliest day the law allows. The Cook County Clerk sets the suburban early voting sites, days and hours.', remind: ['0900', '1000'] },
  { id: 'register', date: '2027-03-09', title: 'Last day to register or update your address the regular way', detail: 'After this, register in person when you vote early or on Election Day (grace period registration), or online through Mar 21.' },
  { id: 'register-online', date: '2027-03-21', title: 'Last day to register online', detail: 'At ova.elections.il.gov, with an Illinois driver’s license or state ID.' },
  { id: 'mail-closes', date: '2027-04-01', title: 'Last day for a mailed mail-ballot application to arrive', detail: 'Apply earlier to be safe: the ballot has to reach you and get back. In person, you can apply through Apr 5.', remind: ['0900', '0930'] },
  { id: 'last-early', date: '2027-04-05', title: 'Last day of early voting', remind: ['0900', '1000'] },
  { id: 'election', date: ELECTION_DAY, title: 'Election Day', detail: 'Polls open 6am–7pm. A mail ballot counts if it’s postmarked by today and arrives by Apr 20.', remind: ['0600', '0700'] },
];

export const byId = (id: string) => KEY_DATES.find((d) => d.id === id)!;
