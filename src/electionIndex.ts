import type { GuideId } from './hosts';
import { daysUntil } from './store';

// The elections the root page lists, by state and date: the guides that are
// live, the ones we know are coming, and the cycles beyond. A new election is
// one entry here; the page, its year rail and its filters follow.
//
// Where the dates come from (each already checked when its state's guide was
// written): Nov 3, 2026 and the 2027 Illinois dates in src/dates.ts; Michigan's
// 2027 dates (MCL 168.641), Minnesota's and Wisconsin's in each state's
// NextUp.tsx; the November 2028 general is the first Tuesday after the first
// Monday of the month (federal law), a date no state moves.
//
// When a past election's results are certified, nothing changes here: the
// guide itself says so (src/results.tsx).

export type StateId = 'illinois' | 'michigan' | 'minnesota' | 'wisconsin';
export type ElectionType = 'general' | 'primary' | 'local';

export const STATE_NAME: Record<StateId, string> = { illinois: 'Illinois', michigan: 'Michigan', minnesota: 'Minnesota', wisconsin: 'Wisconsin' };
/** Each state's colour (govbot's tokens), which is its tile, its lane and its dots. */
export const STATE_INK: Record<StateId, string> = { illinois: 'var(--gb-amber-hi)', michigan: 'var(--gb-primary-hi)', minnesota: 'var(--mn-teal)', wisconsin: 'var(--wi-cardinal)' };
export const STATES: StateId[] = ['illinois', 'michigan', 'minnesota', 'wisconsin'];
export const TYPE_NAME: Record<ElectionType, string> = { general: 'General', primary: 'Primary', local: 'Local' };
export const TYPES: ElectionType[] = ['general', 'primary', 'local'];

export interface Election {
  /** Stable, for the page's anchors. */
  id: string;
  state: StateId;
  /** YYYY-MM-DD. */
  date: string;
  title: string;
  type: ElectionType;
  /** What is on the ballot, in a sentence. */
  what: string;
  /** Where a guide for it already is: its button, the guide (default: the state's 2026 guide) and the part of its page to open. Absent while it's only planned. */
  guide?: { label: string; anchor?: string; id?: GuideId };
}

/** The midterm general the state guides are built for. */
export const NOV_3 = '2026-11-03';
const NOV_7_2028 = '2028-11-07';
const GUIDE_2026 = { label: 'Open the 2026 ballot guide' };
const SO_FAR = { label: 'Check preliminary ballot', anchor: 'kyb-next' };

const LIST: Election[] = [
  { id: 'il-2026-general', state: 'illinois', date: NOV_3, title: 'Midterm general election', type: 'general', guide: GUIDE_2026,
    what: 'Chicago and suburban Cook County, from U.S. Senate to the judges.' },
  { id: 'mi-2026-general', state: 'michigan', date: NOV_3, title: 'Midterm general election', type: 'general', guide: GUIDE_2026,
    what: 'Governor to school board, the courts and both proposals.' },
  { id: 'mn-2026-general', state: 'minnesota', date: NOV_3, title: 'Midterm general election', type: 'general', guide: GUIDE_2026,
    what: 'Governor to state representative, the courts and the amendment.' },
  { id: 'wi-2026-general', state: 'wisconsin', date: NOV_3, title: 'Midterm general election', type: 'general', guide: GUIDE_2026,
    what: 'Governor to Assembly seat and all three constitutional questions.' },

  { id: 'wi-2027-spring-primary', state: 'wisconsin', date: '2027-02-16', title: 'Spring primary', type: 'primary', guide: { label: 'Open the spring ballot guide', id: 'wisconsin-2027' },
    what: 'Takes place only where more than two people file for a spring office.' },
  { id: 'il-2027-city', state: 'illinois', date: '2027-02-23', title: 'Chicago city election', type: 'local', guide: { label: 'Open the Chicago ballot guide', id: 'chicago-2027' },
    what: 'Mayor, city clerk, treasurer, all 50 alderpersons and the police district councils. In suburban Cook, primaries only where needed.' },
  { id: 'il-2027-runoff', state: 'illinois', date: '2027-04-06', title: 'Runoffs and suburban local elections', type: 'local', guide: SO_FAR,
    what: 'Chicago runoffs where no one got more than half the vote, and suburban village and city councils and school, park and library boards.' },
  { id: 'wi-2027-spring', state: 'wisconsin', date: '2027-04-06', title: 'Spring election', type: 'local', guide: { label: 'Open the spring ballot guide', id: 'wisconsin-2027' },
    what: 'A seat on the Wisconsin Supreme Court, Court of Appeals and circuit court judges, plus mayors, city councils, village and town boards and school boards.' },
  { id: 'mi-2027-may', state: 'michigan', date: '2027-05-04', title: 'School and local questions', type: 'local', guide: SO_FAR,
    what: 'Millages and bonds, where a school district or community calls one.' },
  { id: 'mi-2027-primary', state: 'michigan', date: '2027-08-03', title: 'City primaries', type: 'primary', guide: SO_FAR,
    what: 'Primaries for the cities that elect their council or mayor in odd years.' },
  { id: 'mn-2027-primary', state: 'minnesota', date: '2027-08-10', title: 'City primaries', type: 'primary', guide: SO_FAR,
    what: 'Primaries for the cities that elect their council or mayor in odd years, where more than two people file.' },
  { id: 'mi-2027-nov', state: 'michigan', date: '2027-11-02', title: 'City elections', type: 'local', guide: SO_FAR,
    what: 'Councils and mayors in the cities that elect in odd years, and whatever local questions are called for November.' },
  { id: 'mn-2027-nov', state: 'minnesota', date: '2027-11-02', title: 'City and school elections', type: 'local', guide: SO_FAR,
    what: 'City elections in those cities, school board seats and school levy questions where a district calls them.' },

  ...STATES.map((state): Election => ({ id: `${state.slice(0, 2)}-2028-general`, state, date: NOV_7_2028, title: 'Presidential general election', type: 'general',
    what: 'The president and the rest of the ballot. We open each guide as candidates file.' })),
];

/** Every election, soonest first (states in a fixed order on a shared date). */
export const ELECTIONS: Election[] = [...LIST].sort((a, b) => a.date.localeCompare(b.date) || STATES.indexOf(a.state) - STATES.indexOf(b.state));

export const YEARS = [...new Set(ELECTIONS.map((e) => Number(e.date.slice(0, 4))))].sort();

/** An election's date in words: "Tue, Feb 23". */
const SHORT = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });
const at = (iso: string) => new Date(`${iso}T12:00:00Z`);
export const weekday = (iso: string) => SHORT.format(at(iso));
export const monthName = (iso: string) => MONTH.format(at(iso));
export const dayOfMonth = (iso: string) => Number(iso.slice(8, 10));

/** How far an election is, in a phrase: "In 100 days", "Tomorrow", "Today", "3 days ago"... */
export function when(iso: string, now?: Date) {
  const d = daysUntil(iso, now);
  if (d > 1) return `In ${d} days`;
  if (d === 1) return 'Tomorrow';
  if (d === 0) return 'Today';
  return d === -1 ? 'Yesterday' : d > -60 ? `${-d} days ago` : `Held ${monthName(iso)} ${dayOfMonth(iso)}, ${iso.slice(0, 4)}`;
}

/**
 * The year the page opens on: the one with an election held in the last 45
 * days (its results and turnout are the news), otherwise the one with the
 * next election to come, otherwise the latest we have.
 */
export function defaultYear(now?: Date): number {
  const recent = ELECTIONS.filter((e) => { const d = daysUntil(e.date, now); return d <= 0 && d >= -45; });
  if (recent.length) return Number(recent[recent.length - 1].date.slice(0, 4));
  const next = ELECTIONS.find((e) => daysUntil(e.date, now) > 0);
  return next ? Number(next.date.slice(0, 4)) : YEARS[YEARS.length - 1];
}
