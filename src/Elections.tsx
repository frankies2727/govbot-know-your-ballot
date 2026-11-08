import { useEffect, useMemo, useRef, useState } from 'react';
import { guidePath } from './hosts';
import { navigate } from './lib/router';
import { daysUntil, today } from './store';
import { dayOfMonth, defaultYear, ELECTIONS, monthName, STATE_INK, STATE_NAME, STATES, TYPE_NAME, TYPES, weekday, when, YEARS, type Election, type ElectionType, type StateId } from './electionIndex';
import { latestTurnout } from './Turnout';
import './elections.css';

// The root page's index of elections: pick a cycle (a year, or all of them),
// narrow by state and kind, and read them month by month. Above the list, the
// year rail draws the chosen year as four lanes, one per state, with each
// election a dot on its date (solid once held, open while it's coming), so the
// shape of the year is visible at once. The state names on the lanes are the
// state filter. Filters live in the address (?year=2027&state=illinois), so a
// view can be shared and the Back button returns to it.

type Show = 'all' | 'upcoming' | 'past';
interface Filters { year: number | 'all'; states: StateId[]; types: ElectionType[]; show: Show }

const SHOWS: [Show, string][] = [['all', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past']];

function fromAddress(): Filters {
  const q = new URLSearchParams(location.search);
  const list = <T extends string>(key: string, valid: readonly T[]) => (q.get(key)?.split(',') ?? []).filter((v): v is T => (valid as readonly string[]).includes(v));
  const y = q.get('year');
  const year = y === 'all' ? 'all' : YEARS.includes(Number(y)) ? Number(y) : defaultYear();
  const show = q.get('show');
  return { year, states: list('state', STATES), types: list('type', TYPES), show: show === 'upcoming' || show === 'past' ? show : 'all' };
}

/** Writes the filters into the address, leaving out what is already the page's default. */
function toAddress(f: Filters) {
  const q = new URLSearchParams();
  if (f.year !== defaultYear()) q.set('year', String(f.year));
  if (f.states.length) q.set('state', f.states.join(','));
  if (f.types.length) q.set('type', f.types.join(','));
  if (f.show !== 'all') q.set('show', f.show);
  const qs = q.toString();
  history.replaceState(history.state, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Opens a state's guide, then its part (the "next election" notes) once it has drawn. */
function openGuide(state: StateId, anchor?: string) {
  navigate(`projects/know-your-ballot-${state}`);
  if (!anchor) return;
  let tries = 0;
  const timer = setInterval(() => {
    const el = document.getElementById(anchor);
    if (el) { clearInterval(timer); el.scrollIntoView({ block: 'start' }); } else if (++tries > 30) clearInterval(timer);
  }, 100);
}

export function Elections() {
  const [f, setF] = useState(fromAddress);
  useEffect(() => toAddress(f), [f]);
  const update = (patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch }));
  const now = today();

  const inYear = (e: Election) => f.year === 'all' || e.date.startsWith(String(f.year));
  const matches = (e: Election) => (!f.states.length || f.states.includes(e.state)) && (!f.types.length || f.types.includes(e.type))
    && (f.show === 'all' || (f.show === 'upcoming') === (daysUntil(e.date) >= 0));
  const ofYear = useMemo(() => ELECTIONS.filter(inYear), [f.year]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = ofYear.filter(matches);
  const filtered = f.states.length > 0 || f.types.length > 0 || f.show !== 'all';

  // Rows by month ("February 2027"), soonest first.
  const months = useMemo(() => {
    const out: { key: string; label: string; items: Election[] }[] = [];
    for (const e of shown) {
      const key = e.date.slice(0, 7);
      let g = out.find((m) => m.key === key);
      if (!g) { g = { key, label: `${monthName(e.date)} ${e.date.slice(0, 4)}`, items: [] }; out.push(g); }
      g.items.push(e);
    }
    return out;
  }, [shown]);

  // A tap on a dot brings its row into view and marks it.
  const list = useRef<HTMLDivElement>(null);
  // An address ending #el-<id> (the home page's search, or a shared link) opens that election's year, with nothing filtered out, and goes to its row.
  useEffect(() => {
    const follow = () => {
      const e = ELECTIONS.find((x) => `#el-${x.id}` === location.hash);
      if (!e) return;
      setF((cur) => ({ year: cur.year === 'all' ? 'all' : Number(e.date.slice(0, 4)), states: [], types: [], show: 'all' }));
      requestAnimationFrame(() => requestAnimationFrame(() => reveal(e.id)));
    };
    follow();
    addEventListener('hashchange', follow);
    return () => removeEventListener('hashchange', follow);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const reveal = (id: string) => {
    const row = list.current?.querySelector<HTMLElement>(`#el-${id}`);
    if (!row) return;
    row.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    row.focus({ preventScroll: true });
    row.classList.remove('kyb-flash'); void row.offsetWidth; row.classList.add('kyb-flash');
  };

  return (
    <section id="elections" aria-labelledby="elections-h" className="mt-16 scroll-mt-[var(--kyb-bar,0px)] space-y-6 sm:mt-24">
      <div className="space-y-2">
        <h2 id="elections-h" className="font-serif text-3xl font-medium leading-tight sm:text-4xl">Elections</h2>
        <p className="max-w-[60ch] text-[17px]">Every election we cover or are getting ready for, by year. Past ballots stay here as the record of what voters saw.</p>
      </div>

      <div role="group" aria-label="Election cycle" className="el-years">
        {YEARS.map((y) => <button key={y} type="button" className="el-year el-btn" aria-pressed={f.year === y} onClick={() => update({ year: y })}>{y}</button>)}
        <button type="button" className="el-year el-btn el-year-all" aria-pressed={f.year === 'all'} onClick={() => update({ year: 'all' })}>All years</button>
      </div>

      {f.year !== 'all' && <Rail year={f.year} elections={ofYear} matches={matches} states={f.states} onState={(s) => update({ states: toggle(f.states, s) })} onDot={reveal} now={now} />}
      {f.year === 'all' && (
        <div role="group" aria-label="States" className="flex flex-wrap gap-2">
          {STATES.map((s) => (
            <button key={s} type="button" className="el-chip el-btn" aria-pressed={f.states.includes(s)} onClick={() => update({ states: toggle(f.states, s) })} style={{ '--ink': STATE_INK[s] } as React.CSSProperties}>
              <i aria-hidden="true" />{STATE_NAME[s]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div role="group" aria-label="Kind of election" className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold">Kind</span>
          {TYPES.map((t) => <button key={t} type="button" className="el-chip el-btn" aria-pressed={f.types.includes(t)} onClick={() => update({ types: toggle(f.types, t) })}>{TYPE_NAME[t]}</button>)}
        </div>
        <div role="group" aria-label="Upcoming or past" className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold">Show</span>
          {SHOWS.map(([v, label]) => <button key={v} type="button" className="el-chip el-btn" aria-pressed={f.show === v} onClick={() => update({ show: v })}>{label}</button>)}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]" aria-live="polite">
        <span><strong>{shown.length}</strong> election{shown.length === 1 ? '' : 's'} {f.year === 'all' ? 'across every year' : `in ${f.year}`}</span>
        {filtered && <button type="button" className="el-btn font-bold underline underline-offset-4" onClick={() => update({ states: [], types: [], show: 'all' })}>Clear filters</button>}
      </p>

      <div ref={list}>
        {months.map((m) => (
          <div key={m.key}>
            <h3 className="el-month">{m.label}</h3>
            <ol className="el-list">{m.items.map((e) => <Row key={e.id} e={e} />)}</ol>
          </div>
        ))}
        {!shown.length && (
          <div className="rounded-2xl border border-[var(--gb-border)] bg-[var(--gb-surface)] p-5 text-[16px]">
            <p className="font-bold">No elections match these filters.</p>
            <p className="mt-1">Try another year, or clear the filters to see everything in {f.year === 'all' ? 'every year' : f.year}.</p>
            <button type="button" className="el-btn el-act-link mt-3" onClick={() => update({ states: [], types: [], show: 'all' })}>Clear filters</button>
          </div>
        )}
      </div>
    </section>
  );
}

const MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const utc = (y: number, m: number, d: number) => Date.UTC(y, m, d);
/** Where a date falls in its year, 0 to 100. */
const place = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return ((utc(y, m - 1, d) - utc(y, 0, 1)) / (utc(y + 1, 0, 1) - utc(y, 0, 1))) * 100;
};

/** The year as four lanes: a lane per state, a dot per election, a line for today. */
function Rail({ year, elections, matches, states, onState, onDot, now }: { year: number; elections: Election[]; matches: (e: Election) => boolean; states: StateId[]; onState: (s: StateId) => void; onDot: (id: string) => void; now: string }) {
  const months = MS.map((label, i) => ({ label, start: place(`${year}-${String(i + 1).padStart(2, '0')}-01`), end: i === 11 ? 100 : place(`${year}-${String(i + 2).padStart(2, '0')}-01`) }));
  const todayAt = now.startsWith(String(year)) ? place(now) : null;
  const track = (children?: React.ReactNode) => (
    <div className="el-track">
      {months.map((m) => <i key={m.label} className="el-tick" style={{ left: `${m.start}%` }} aria-hidden="true" />)}
      {todayAt != null && <i className="el-today" style={{ left: `${todayAt}%` }} aria-hidden="true" />}
      {children}
    </div>
  );
  return (
    <div className="el-rail" role="group" aria-label={`${year} elections by state and date`}>
      <div />
      <div className="el-months" aria-hidden="true">
        {months.map((m) => <span key={m.label} style={{ left: `${(m.start + m.end) / 2}%` }}><b>{m.label}</b><u>{m.label[0]}</u></span>)}
      </div>
      {STATES.map((s) => {
        const mine = elections.filter((e) => e.state === s);
        const dim = states.length > 0 && !states.includes(s);
        return (
          <div key={s} className="el-lane" data-dim={dim || undefined} style={{ '--ink': STATE_INK[s] } as React.CSSProperties}>
            <button type="button" className="el-lane-name el-btn" aria-pressed={states.includes(s)} onClick={() => onState(s)}><i aria-hidden="true" />{STATE_NAME[s]}</button>
            {track(mine.map((e) => {
              const on = matches(e);
              const label = `${STATE_NAME[s]}, ${e.title}, ${weekday(e.date)} ${monthName(e.date)} ${dayOfMonth(e.date)}`;
              return (
                <button key={e.id} type="button" className="el-dot el-btn" style={{ left: `${place(e.date)}%` }} data-off={!on || undefined} data-held={daysUntil(e.date) < 0 || undefined}
                  disabled={!on} aria-label={label} title={label} onClick={() => onDot(e.id)}><i aria-hidden="true" /></button>
              );
            }))}
          </div>
        );
      })}
      <div />
      <p className="el-legend">
        <span><i className="el-key el-key-held" aria-hidden="true" /> held</span>
        <span><i className="el-key" aria-hidden="true" /> coming</span>
        {todayAt != null && <span><i className="el-key-line" aria-hidden="true" /> today</span>}
      </p>
    </div>
  );
}

function Row({ e }: { e: Election }) {
  const held = daysUntil(e.date) < 0;
  const turnout = e.type === 'general' && held ? latestTurnout(e.state) : null;
  return (
    <li id={`el-${e.id}`} tabIndex={-1} className="el-row" style={{ '--ink': STATE_INK[e.state] } as React.CSSProperties}>
      <div className="el-leaf" aria-hidden="true"><b>{dayOfMonth(e.date)}</b><span>{weekday(e.date)}</span></div>
      <div className="min-w-0">
        <h4 className="el-title">{e.title}</h4>
        <p className="el-meta">
          <span className="el-state"><i aria-hidden="true" />{STATE_NAME[e.state]}</span>
          <span className="el-type">{TYPE_NAME[e.type]}</span>
          <span><span className="sr-only">Date: </span>{when(e.date)}</span>
        </p>
        <p className="el-what">{e.what}</p>
        {turnout && <p className="el-stat"><strong>{turnout.pct.toFixed(1)}%</strong> of eligible voters voted{turnout.preliminary ? ', unofficial so far' : ''}.</p>}
      </div>
      {e.guide && (
        <div className="el-act">
          <a className="el-act-link el-btn" href={`${guidePath(e.state)}${e.guide.anchor ? `#${e.guide.anchor}` : ''}`}
            onClick={(ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return; ev.preventDefault(); openGuide(e.state, e.guide!.anchor); }}>
            {e.guide.label}<span className="sr-only"> for {STATE_NAME[e.state]}, {e.title}</span>
          </a>
        </div>
      )}
    </li>
  );
}
