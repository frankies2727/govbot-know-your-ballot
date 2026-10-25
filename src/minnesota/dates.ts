import type { KeyDate } from '../dates';

// Minnesota's Nov 3, 2026 dates, from the Secretary of State's voter pages
// (sos.mn.gov/elections-voting) and Minnesota election law: absentee voting
// opens 46 days out (Minn. Stat. 203B.081), pre-registration closes 21 days
// out (201.061), polls run 7am–8pm (204C.05), absentee ballots must reach
// the election office by 8pm on Election Day. Checked October 25, 2026.

export const ELECTION_DAY = '2026-11-03';

export const KEY_DATES: KeyDate[] = [
  { id: 'absentee-opens', date: '2026-09-18', title: 'Absentee voting opens', detail: 'Vote early in person at your county (or city) election office, or apply for a ballot by mail, from today through Mon, Nov 2.' },
  { id: 'register', date: '2026-10-13', title: 'Last day to pre-register', detail: 'Online, by mail or in person. After this you can still register when you vote, early or on Election Day, with proof of where you live.' },
  { id: 'early-tuesday', date: '2026-10-27', title: 'Early voting open until 7pm', detail: 'Election offices stay open late tonight for early voters.', remind: ['1700', '1800'] },
  { id: 'early-weekend', date: '2026-10-31', title: 'Weekend early voting', detail: 'Election offices are open 9am–3pm today and Sun, Nov 1.', remind: ['0900', '1000'] },
  { id: 'absentee', date: '2026-11-02', title: 'Last day to vote early in person', detail: 'Until 5pm at your election office. A mail ballot still has to arrive by 8pm tomorrow: drop it off instead of mailing it now.', remind: ['0900', '0930'] },
  { id: 'election', date: ELECTION_DAY, title: 'Election Day', detail: 'Polls open 7am–8pm (some small towns open at 10am). Absentee ballots must reach your election office by 8pm.', remind: ['0600', '0700'] },
];

export const byId = (id: string) => KEY_DATES.find((d) => d.id === id)!;
