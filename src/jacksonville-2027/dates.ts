import type { KeyDate } from '../dates';

// Jacksonville's 2027 consolidated city elections, from the Duval County
// Supervisor of Elections' 2027 Important Dates and Deadlines and its office
// information sheets: the First Election on Tue, Mar 9 (moved from Mar 23 by
// City ordinance 2025-765), the General Election on Tue, May 18, qualifying
// from noon Jan 11 to noon Jan 15. Registration closes 29 days before each
// election (Fla. Stat. 97.055), vote-by-mail requests at 5pm 12 days before
// (101.62), and mail ballots must arrive by 7pm on Election Day (101.67).

export const ELECTION_DAY = '2027-03-09';
export const GENERAL_DAY = '2027-05-18';

export const KEY_DATES: KeyDate[] = [
  { id: 'qualifying', date: '2027-01-15', title: 'Candidate qualifying closes at noon', detail: 'Qualifying runs from noon Mon, Jan 11. Then the Supervisor of Elections’ list shows who is on the ballot.' },
  { id: 'register', date: '2027-02-08', title: 'Last day to register to vote', detail: 'Or to update your address, at RegisterToVoteFlorida.gov or the Supervisor of Elections’ office. Party doesn’t limit who you can vote for in this election.' },
  { id: 'mail-request', date: '2027-02-25', title: 'Last day to request a mail ballot', detail: 'By 5pm. A request made before the Nov 3, 2026 election ran out at the end of 2026: ask again for 2027.', remind: ['0900', '0930'] },
  { id: 'election', date: ELECTION_DAY, title: 'First Election', detail: 'Polls open 7am–7pm. Bring a photo ID with your signature. Mail ballots must reach the Supervisor of Elections by 7pm.', remind: ['0700', '0800'] },
  { id: 'register-general', date: '2027-04-19', title: 'Last day to register for the May 18 General Election' },
  { id: 'mail-request-general', date: '2027-05-06', title: 'Last day to request a mail ballot for May 18', detail: 'By 5pm.' },
  { id: 'general', date: GENERAL_DAY, title: 'General Election, where needed', detail: 'The top two meet again in any race where no one got more than half the vote on Mar 9. Polls open 7am–7pm.' },
];

export const byId = (id: string) => KEY_DATES.find((d) => d.id === id)!;
