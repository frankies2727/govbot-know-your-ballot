import type { KeyDate } from '../dates';

// Denver's Apr 6, 2027 municipal election, from the Denver Elections
// Division's 2027 Municipal Candidate Information Packet (petitions, the
// ballot-order drawing, the Jun 1 runoff; Denver Charter 8.2) and Colorado's
// all-mail election law: ballots are mailed 22 to 18 days before Election Day
// (C.R.S. 1-7.5-107), registering by the 8th day before still brings one in the
// mail, and a voter can register and vote in person through Election Day
// (1-2-201, 1-2-217.7). Ballots must be received, not postmarked, by 7pm.

export const ELECTION_DAY = '2027-04-06';
export const RUNOFF_DAY = '2027-06-01';

export const KEY_DATES: KeyDate[] = [
  { id: 'petitions-open', date: '2026-12-16', title: 'Candidates start collecting signatures', detail: 'Petitions need 300 signatures from Denver voters for a citywide office or an at-large seat, 100 from the district for a district seat.' },
  { id: 'petitions-due', date: '2027-01-21', title: 'Candidate petitions are due', detail: 'The Elections Division then checks the signatures and certifies who is on the ballot; the order of names is drawn by lot in early February.' },
  { id: 'ballots-mailed', date: '2027-03-15', title: 'Ballots start going out in the mail', detail: 'To every registered Denver voter, from today through Fri, Mar 19 at the latest. Drop boxes open too.', remind: ['0900', '1000'] },
  { id: 'register', date: '2027-03-29', title: 'Last day to register and still get a ballot in the mail', detail: 'At GoVoteColorado.gov. After this, register and vote in person at a Voter Service and Polling Center through 7pm on Election Day.' },
  { id: 'mail-back', date: '2027-03-29', title: 'Mailing your ballot back? Send it by today', detail: 'Colorado’s election officials advise mailing it at least 8 days before Election Day: it has to arrive by 7pm on Apr 6, and a postmark doesn’t count. After today, use a 24-hour drop box or a Voter Service and Polling Center.', remind: ['0900', '0930'] },
  { id: 'election', date: ELECTION_DAY, title: 'Election Day', detail: 'Voter Service and Polling Centers open 7am–7pm. Ballots must reach a drop box or center by 7pm.', remind: ['0700', '0800'] },
  { id: 'runoff', date: RUNOFF_DAY, title: 'Runoffs, where needed', detail: 'In any race where no one got more than half the vote, the top two meet again, by mail ballot.' },
];

export const byId = (id: string) => KEY_DATES.find((d) => d.id === id)!;
