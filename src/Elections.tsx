import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { guidePath, type GuideId } from './hosts';
import { navigate } from './lib/router';
import { daysUntil, today } from './store';
import { dayOfMonth, ELECTIONS, guideOf, hasStateGuide, monthName, STATE_INK, STATE_NAME, STATES, TYPE_NAME, TYPES, weekday, when, YEARS, type Election, type ElectionType, type StateId } from './electionIndex';
import { latestTurnout } from './Turnout';
import './elections.css';

// The root page's index of elections, as one timeline: every year we cover
// side by side, a lane per state, each election a dot on its date (solid once
// held, open while it's coming), scrolled sideways and opened at today. A tap
// on a dot shows that election in the card below (what's on the ballot, and
// its guide); it opens on the next election. The state names on the lanes and
// the "Kind" chips dim the dots that don't match. Filters live in the address
// (?state=illinois&type=local), so a view can be shared; #el-<id> (the home
// page's search, a shared link) picks that election.

interface Filters { states: StateId[]; types: ElectionType[] }

function fromAddress(): Filters {
  const q = new URLSearchParams(location.search);
  const list = <T extends string>(key: string, valid: readonly T[]) => (q.get(key)?.split(',') ?? []).filter((v): v is T => (valid as readonly string[]).includes(v));
  return { states: list('state', STATES), types: list('type', TYPES) };
}

/** Writes the filters into the address, leaving out what is already the page's default. */
function toAddress(f: Filters) {
  const q = new URLSearchParams();
  if (f.states.length) q.set('state', f.states.join(','));
  if (f.types.length) q.set('type', f.types.join(','));
  const qs = q.toString();
  history.replaceState(history.state, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Opens a guide, then its part (the "next election" notes) once it has drawn. */
function openGuide(id: GuideId, anchor?: string) {
  navigate(`projects/know-your-ballot-${id}`);
  if (!anchor) return;
  let tries = 0;
  const timer = setInterval(() => {
    const el = document.getElementById(anchor);
    if (el) { clearInterval(timer); el.scrollIntoView({ block: 'start' }); } else if (++tries > 30) clearInterval(timer);
  }, 100);
}

/** The election a hash names (#el-<id>), if any. */
const fromHash = () => ELECTIONS.find((x) => `#el-${x.id}` === location.hash);
/** The next election to come, else the latest held. */
const nextElection = () => ELECTIONS.find((e) => daysUntil(e.date) >= 0) ?? ELECTIONS[ELECTIONS.length - 1];

export function Elections() {
  const [f, setF] = useState(fromAddress);
  useEffect(() => toAddress(f), [f]);
  const update = (patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch }));
  const [picked, setPicked] = useState<Election>(() => fromHash() ?? nextElection());
  const card = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  const matches = (e: Election) => (!f.states.length || f.states.includes(e.state)) && (!f.types.length || f.types.includes(e.type));
  const shown = ELECTIONS.filter(matches).length;
  const filtered = f.states.length > 0 || f.types.length > 0;

  // A dot (or a link naming an election) picks it: its card shows, and the rail scrolls it into view.
  const pick = (e: Election, focusCard = false) => {
    setPicked(e);
    requestAnimationFrame(() => {
      rail.current?.querySelector<HTMLElement>(`[data-el="${e.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (!focusCard || !card.current) return;
      card.current.scrollIntoView({ block: 'center' });
      card.current.focus({ preventScroll: true });
      card.current.classList.remove('kyb-flash'); void card.current.offsetWidth; card.current.classList.add('kyb-flash');
    });
  };
  // An address ending #el-<id> picks that election, with nothing filtered out.
  useEffect(() => {
    const follow = () => {
      const e = fromHash();
      if (!e) return;
      setF({ states: [], types: [] });
      pick(e, true);
    };
    follow();
    addEventListener('hashchange', follow);
    return () => removeEventListener('hashchange', follow);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section id="elections" aria-labelledby="elections-h" className="mt-16 scroll-mt-[var(--kyb-bar,0px)] space-y-6 sm:mt-24">
      <div className="space-y-2">
        <h2 id="elections-h" className="font-serif text-3xl font-medium leading-tight sm:text-4xl">Elections</h2>
        <p className="max-w-[60ch] text-[17px]">Every election we cover or are getting ready for, on one timeline. Tap a dot to see what’s on that ballot. Past ballots stay here as the record of what voters saw.</p>
      </div>

      <Rail scroller={rail} matches={matches} states={f.states} onState={(s) => update({ states: toggle(f.states, s) })} picked={picked.id} onDot={(e) => pick(e)} now={today()} />

      <div ref={card} tabIndex={-1} className="el-card" aria-live="polite" style={{ '--ink': STATE_INK[picked.state] } as React.CSSProperties}>
        <Card e={picked} />
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div role="group" aria-label="Kind of election" className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold">Kind</span>
          {TYPES.map((t) => <button key={t} type="button" className="el-chip el-btn" aria-pressed={f.types.includes(t)} onClick={() => update({ types: toggle(f.types, t) })}>{TYPE_NAME[t]}</button>)}
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]" aria-live="polite">
          <span><strong>{shown}</strong> election{shown === 1 ? '' : 's'}{filtered ? ' match' : ''}, {YEARS[0]}–{YEARS[YEARS.length - 1]}</span>
          {filtered && <button type="button" className="el-btn font-bold underline underline-offset-4" onClick={() => update({ states: [], types: [] })}>Clear filters</button>}
        </p>
      </div>
    </section>
  );
}

const MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FIRST = YEARS[0];
const LAST = YEARS[YEARS.length - 1];
const SPAN = YEARS.length * 12; // months on the timeline
/** Where a date falls on the timeline, in months from its start (a fraction within the month). */
const place = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return (y - FIRST) * 12 + (m - 1) + (d - 1) / days;
};
const pct = (months: number) => `${(months / SPAN) * 100}%`;

/** Every year as lanes, a lane per state, a dot per election, a line for today; it scrolls sideways and opens at today. */
function Rail({ scroller, matches, states, onState, picked, onDot, now }: { scroller: React.RefObject<HTMLDivElement | null>; matches: (e: Election) => boolean; states: StateId[]; onState: (s: StateId) => void; picked: string; onDot: (e: Election) => void; now: string }) {
  const year = Number(now.slice(0, 4));
  const todayAt = year >= FIRST && year <= LAST ? place(now) : null;
  const byState = useMemo(() => new Map(STATES.map((s) => [s, ELECTIONS.filter((e) => e.state === s)])), []);
  // Open with today a third of the way in, so what's just past and what's coming both show.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || todayAt == null) return;
    const track = el.querySelector<HTMLElement>('.el-axis');
    if (track) el.scrollLeft = Math.max(0, track.getBoundingClientRect().left - el.getBoundingClientRect().left + (todayAt / SPAN) * track.offsetWidth - el.clientWidth / 3);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ticks = Array.from({ length: SPAN }, (_, i) => i);
  const track = (children?: React.ReactNode) => (
    <div className="el-track">
      {ticks.map((i) => <i key={i} className={`el-tick${i % 12 === 0 ? ' el-tick-year' : ''}`} style={{ left: pct(i) }} aria-hidden="true" />)}
      {todayAt != null && <i className="el-today" style={{ left: pct(todayAt) }} aria-hidden="true" />}
      {children}
    </div>
  );
  return (
    <div className="space-y-2">
      <div ref={scroller} className="el-scroll" tabIndex={0} role="group" aria-label={`Elections ${FIRST}–${LAST}, by state and date; scrolls sideways`}>
        <div className="el-rail" style={{ '--span': SPAN } as React.CSSProperties}>
          <div className="el-head">
            <div className="el-corner" />
            <div className="el-axis" aria-hidden="true">
              <div className="el-years">{YEARS.map((y) => <span key={y}><b>{y}</b></span>)}</div>
              <div className="el-months">{ticks.map((i) => <span key={i} style={{ left: pct(i + 0.5) }}><b>{MS[i % 12]}</b><u>{MS[i % 12][0]}</u></span>)}</div>
            </div>
          </div>
          {STATES.map((s) => {
            const dim = states.length > 0 && !states.includes(s);
            return (
              <div key={s} className="el-lane" data-dim={dim || undefined} style={{ '--ink': STATE_INK[s] } as React.CSSProperties}>
                <button type="button" className="el-lane-name el-btn" aria-pressed={states.includes(s)} onClick={() => onState(s)}><i aria-hidden="true" />{STATE_NAME[s]}</button>
                {track(byState.get(s)!.map((e) => {
                  const on = matches(e);
                  const label = `${STATE_NAME[s]}, ${e.title}, ${weekday(e.date)} ${monthName(e.date)} ${dayOfMonth(e.date)}, ${e.date.slice(0, 4)}`;
                  return (
                    <button key={e.id} type="button" data-el={e.id} className="el-dot el-btn" style={{ left: pct(place(e.date)) }} data-off={!on || undefined} data-held={daysUntil(e.date) < 0 || undefined}
                      aria-pressed={picked === e.id} disabled={!on} aria-label={label} title={label} onClick={() => onDot(e)}><i aria-hidden="true" /></button>
                  );
                }))}
              </div>
            );
          })}
        </div>
      </div>
      <p className="el-legend">
        <span><i className="el-key el-key-held" aria-hidden="true" /> held</span>
        <span><i className="el-key" aria-hidden="true" /> coming</span>
        {todayAt != null && <span><i className="el-key-line" aria-hidden="true" /> today</span>}
        <span>· Scroll sideways for every year</span>
      </p>
    </div>
  );
}

/** The picked election: when, what's on the ballot, and its guide. */
function Card({ e }: { e: Election }) {
  const held = daysUntil(e.date) < 0;
  const turnout = e.type === 'general' && held && hasStateGuide(e.state) ? latestTurnout(e.state) : null;
  return (
    <div id={`el-${e.id}`} className="el-row">
      <div className="el-leaf" aria-hidden="true"><b>{dayOfMonth(e.date)}</b><span>{MS[Number(e.date.slice(5, 7)) - 1]} {e.date.slice(0, 4)}</span></div>
      <div className="min-w-0">
        <h3 className="el-title">{e.title}</h3>
        <p className="el-meta">
          <span className="el-state"><i aria-hidden="true" />{STATE_NAME[e.state]}</span>
          <span className="el-type">{TYPE_NAME[e.type]}</span>
          <span>{weekday(e.date)}, {monthName(e.date)} {dayOfMonth(e.date)}, {e.date.slice(0, 4)} · {when(e.date)}</span>
        </p>
        <p className="el-what">{e.what}</p>
        {turnout && <p className="el-stat"><strong>{turnout.pct.toFixed(1)}%</strong> of eligible voters voted{turnout.preliminary ? ', unofficial so far' : ''}.</p>}
      </div>
      {e.guide && (
        <div className="el-act">
          <a className="el-act-link el-btn" href={`${guidePath(guideOf(e))}${e.guide.anchor ? `#${e.guide.anchor}` : ''}`}
            onClick={(ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return; ev.preventDefault(); openGuide(guideOf(e), e.guide!.anchor); }}>
            {e.guide.label}<span className="sr-only"> for {STATE_NAME[e.state]}, {e.title}</span>
          </a>
        </div>
      )}
    </div>
  );
}
