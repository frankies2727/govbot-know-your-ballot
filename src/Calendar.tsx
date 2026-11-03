import { CalendarPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { CITY_2027, dayLabel, downloadReminder, forVoter, NEXT_ELECTION, NOV_3, type KeyDate } from './dates';
import { daysUntil, useNow } from './store';
import type { CityRace, Districts } from './types';

const when = (days: number) => (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`);

export function Group({ title, dates, now, info }: { title: string; dates: KeyDate[]; now: Date; info: string }) {
  // Past dates drop off, so the list is always "what's next".
  const ahead = dates.filter((d) => daysUntil(d.date, now) >= 0);
  if (!ahead.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-black text-[var(--gb-text)]">{title}</h3>
      <ul className="rounded-2xl border-2 border-[var(--gb-border)] bg-[var(--gb-surface)] divide-y divide-[var(--kyb-chip)]">
        {ahead.map((d) => {
          const days = daysUntil(d.date, now);
          return (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-20 shrink-0">
                <p className="font-black text-[var(--gb-text)] leading-tight">{dayLabel(d.date).replace(/^\w+, /, '')}</p>
                <p className={`text-sm font-bold ${days <= 1 ? 'text-[var(--gb-amber-hi)]' : 'text-[var(--gb-text)]'}`}>{when(days)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[var(--gb-text)] leading-snug">{d.title}</p>
                {d.detail && <p className="text-sm text-[var(--gb-text)]">{d.detail}</p>}
              </div>
              <button type="button" onClick={() => downloadReminder(d, info)} aria-label={`Add to calendar: ${d.title}, ${dayLabel(d.date)}`}
                className="shrink-0 w-11 h-11 rounded-xl border-2 border-[var(--gb-border)] flex items-center justify-center text-[var(--gb-text)] hover:border-[var(--gb-text)]">
                <CalendarPlus className="w-5 h-5" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** What's coming up, for this voter: Nov 3 first, then 2027. */
export function KeyDates({ chicago, info }: { chicago: boolean; info: string }) {
  const now = useNow();
  return (
    <section aria-labelledby="kyb-dates" className="space-y-4">
      <h2 id="kyb-dates" className="text-2xl font-black">Key dates</h2>
      <Group title="Nov 3, 2026 election" dates={forVoter(NOV_3, chicago)} now={now} info={info} />
      <Group title={chicago ? 'Coming up: Chicago’s 2027 city election' : 'Coming up: 2027 local elections'} dates={forVoter(CITY_2027, chicago)} now={now} info={info} />
    </section>
  );
}

const NEXT_UP = {
  chicago: 'Chicago elects its mayor, all 50 alderpersons and the police district councils.',
  suburbs: 'Local primaries where needed, then village, school and park boards on Apr 6.',
  either: 'Chicago elects its mayor, alderpersons and police district councils; suburban village, school and park boards follow on Apr 6.',
};

// Filing for Chicago's city races closes Oct 26 (dates.ts); the Board
// certifies the list after objections are heard.
const NO_CANDIDATES_YET = 'Candidates file by Oct 26. The official list shows up here once the Board certifies it.';

function cityTitle(r: CityRace) {
  if (r.group === 'council') return `Alderperson, Ward ${r.district}`;
  if (r.group === 'police_district_council') return `Police District ${r.district} Council (${r.seats} seats)`;
  return r.office;
}

/** This voter's 2027 city races: citywide, plus their ward and police district once we know them. */
const BOARD_CANDIDATES = 'https://chicagoelections.gov/getting-ballot/candidates';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "10/30/2026 3:54:49 PM" (the Board's own stamp) as "Oct 30, 3:54 PM"; anything else as written. */
function listTime(asOf: string): string {
  const m = asOf.match(/^(\d{1,2})\/(\d{1,2})\/\d{4}\s+(\d{1,2}:\d{2}):\d{2}\s*([AP]M)$/i);
  return m && MONTH_NAMES[Number(m[1]) - 1] ? `${MONTH_NAMES[Number(m[1]) - 1]} ${Number(m[2])}, ${m[3]} ${m[4].toUpperCase()}` : asOf;
}

function CityRaces({ city, districts, listAsOf }: { city: CityRace[]; districts: Districts | null; listAsOf?: string }) {
  const mine = city.filter((r) => r.group === 'citywide'
    || (r.group === 'council' && r.district === districts?.ward)
    || (r.group === 'police_district_council' && r.district === districts?.police));
  return (
    <div className="space-y-3 border-t-2 border-[var(--kyb-chip)] pt-3">
      {mine.every((r) => !r.candidates.length) && <p className="text-[15px] font-bold text-[var(--gb-text)]">{NO_CANDIDATES_YET}</p>}
      <ul className="space-y-3">
        {mine.map((r) => (
          <li key={r.id} className="text-[15px] leading-relaxed text-[var(--gb-text)]">
            <p className="font-black text-[var(--gb-text)]">{cityTitle(r)}</p>
            {r.incumbent && <p>Now: {r.incumbent}</p>}
            {r.why && <p>{r.why}</p>}
            {r.candidates.length > 0 && <p className="font-bold text-[var(--gb-text)]">Running: {r.candidates.join(', ')}</p>}
          </li>
        ))}
      </ul>
      {listAsOf && mine.some((r) => r.candidates.length > 0) && (
        <p className="text-sm text-[var(--gb-text)]">Names are from the <a className="font-bold underline" href={BOARD_CANDIDATES} target="_blank" rel="noreferrer noopener">Chicago Board of Elections’ candidate list</a> as of {listTime(listAsOf)}. It changes if a filing is challenged or withdrawn.</p>
      )}
      {!districts && <p className="text-[15px] text-[var(--gb-text)]">Plus a race for your ward’s alderperson and your police district council. Enter your address to see yours.</p>}
    </div>
  );
}

/**
 * A heads-up about the next election, counting down by the day. No address
 * yet: `chicago` unset. With `city`, Chicago voters (and anyone without an
 * address yet) see their 2027 races right there.
 */
export function NextElectionNote({ chicago, city, districts = null, listAsOf }: { chicago?: boolean; city?: CityRace[]; districts?: Districts | null; /** When the Board's 2027 list was last updated. */ listAsOf?: string }) {
  const showRaces = city && chicago !== false;
  return (
    <NextUp date={NEXT_ELECTION} title="Get ready for Feb 23, 2027 too!" lead={NEXT_UP[chicago === undefined ? 'either' : chicago ? 'chicago' : 'suburbs']}>
      {showRaces && <CityRaces city={city} districts={districts} listAsOf={listAsOf} />}
    </NextUp>
  );
}

/** The card itself: a heads-up counting down to `date`, with whatever details go under it. */
export function NextUp({ date, title, lead, children }: { date: string; title: string; lead: string; children?: ReactNode }) {
  const days = daysUntil(date, useNow());
  if (days < 0) return null;
  return (
    <aside id="kyb-next" aria-label="Next election" className="scroll-mt-[var(--kyb-bar,0px)] rounded-2xl border-[3px] border-[var(--kyb-gold)] bg-[var(--gb-surface)] px-4 py-4 space-y-3">
      <div className="flex items-center gap-4">
        <p className="min-w-0 flex-1 text-[15px] leading-relaxed text-[var(--gb-text)]">
          <strong className="text-[var(--gb-text)]">{title}</strong> {lead} We’ll be here with everything nice and tidy for you.
        </p>
        <p className="shrink-0 w-20 h-20 rounded-full border-[3px] border-[var(--kyb-gold)] flex flex-col items-center justify-center text-[var(--gb-text)]">
          <span className="text-2xl font-black leading-none">{days}</span>
          <span className="text-sm font-bold">day{days === 1 ? '' : 's'}</span>
        </p>
      </div>
      {children}
    </aside>
  );
}
