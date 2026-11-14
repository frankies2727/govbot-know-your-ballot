import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { guidePath, type GuideId } from './hosts';
import { navigate } from './lib/router';
import { daysUntil, today } from './store';
import { dayOfMonth, ELECTIONS, guideOf, monthName, STATE_INK, STATE_NAME, STATES, TYPE_NAME, TYPES, weekday, YEARS, type Election, type ElectionType, type StateId } from './electionIndex';
import './elections.css';

// The root page's index of elections, as one timeline: every year we cover
// side by side, a lane per state, each election a dot on its date (solid once
// held, open while it's coming), scrolled sideways and opened at today, with a
// "Today" button back once it's out of view. A dot with a guide opens it
// (the guide has the races, maps and candidates); one still being planned
// just names itself. The state names on the lanes and the "Kind" chips dim
// the dots that don't match. Filters live in the address
// (?state=illinois&type=local), so a view can be shared; #el-<id> (the home
// page's search, a shared link) scrolls to that election's dot.

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

const smooth = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

export function Elections() {
  const [f, setF] = useState(fromAddress);
  useEffect(() => toAddress(f), [f]);
  const update = (patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch }));
  const rail = useRef<HTMLDivElement>(null);

  const matches = (e: Election) => (!f.states.length || f.states.includes(e.state)) && (!f.types.length || f.types.includes(e.type));
  const shown = ELECTIONS.filter(matches).length;
  const filtered = f.states.length > 0 || f.types.length > 0;

  // An address ending #el-<id> clears the filters and brings that election's dot into view, focused.
  useEffect(() => {
    const follow = () => {
      const e = ELECTIONS.find((x) => `#el-${x.id}` === location.hash);
      if (!e) return;
      setF({ states: [], types: [] });
      requestAnimationFrame(() => {
        const dot = rail.current?.querySelector<HTMLElement>(`[data-el="${e.id}"]`);
        if (!dot) return;
        rail.current!.scrollIntoView({ block: 'center' });
        dot.scrollIntoView({ block: 'nearest', inline: 'center', behavior: smooth() });
        dot.focus({ preventScroll: true });
        dot.classList.remove('kyb-flash'); void dot.offsetWidth; dot.classList.add('kyb-flash');
      });
    };
    follow();
    addEventListener('hashchange', follow);
    return () => removeEventListener('hashchange', follow);
  }, []);

  return (
    <section id="elections" aria-labelledby="elections-h" className="mt-16 scroll-mt-[var(--kyb-bar,0px)] space-y-6 sm:mt-24">
      <div className="space-y-2">
        <h2 id="elections-h" className="font-serif text-3xl font-medium leading-tight sm:text-4xl">Elections</h2>
        <p className="max-w-[60ch] text-[17px]">Every election we cover or are getting ready for, on one timeline. Tap a dot to open its ballot guide. Past ballots stay here as the record of what voters saw.</p>
      </div>

      <Rail scroller={rail} matches={matches} states={f.states} onState={(s) => update({ states: toggle(f.states, s) })} now={today()} />

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div role="group" aria-label="Kind of election" className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold">Kind</span>
          {TYPES.map((t) => <button key={t} type="button" className="el-chip el-btn" aria-pressed={f.types.includes(t)} onClick={() => update({ types: toggle(f.types, t) })}>{TYPE_NAME[t]}</button>)}
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]" aria-live="polite">
          <span><strong>{shown}</strong> election{shown === 1 ? '' : 's'}{filtered ? ' match' : ''}, {FIRST}–{LAST}</span>
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

/** Every year as lanes, a lane per state, a dot per election, one line for today; it scrolls sideways and opens at today. */
function Rail({ scroller, matches, states, onState, now }: { scroller: React.RefObject<HTMLDivElement | null>; matches: (e: Election) => boolean; states: StateId[]; onState: (s: StateId) => void; now: string }) {
  const year = Number(now.slice(0, 4));
  const todayAt = year >= FIRST && year <= LAST ? place(now) : null;
  const byState = useMemo(() => new Map(STATES.map((s) => [s, ELECTIONS.filter((e) => e.state === s)])), []);
  const line = useRef<HTMLElement>(null);
  const [away, setAway] = useState(false);

  /** Where the today line is, from the timeline's visible left edge, and how wide the pinned names are. */
  const measure = () => {
    const el = scroller.current, mark = line.current;
    if (!el || !mark) return null;
    return { el, x: mark.getBoundingClientRect().left - el.getBoundingClientRect().left, label: el.querySelector<HTMLElement>('.el-corner')?.offsetWidth ?? 0 };
  };
  /** Scrolls so today sits a third of the way into the timeline's visible part. */
  const toToday = (behavior: ScrollBehavior = 'auto') => {
    const m = measure();
    if (m) m.el.scrollTo({ left: Math.max(0, m.el.scrollLeft + m.x - m.label - (m.el.clientWidth - m.label) / 3), behavior });
  };
  useLayoutEffect(() => toToday(), []); // eslint-disable-line react-hooks/exhaustive-deps
  // "Today" shows once the today line has left the visible part of the timeline.
  const onScroll = () => {
    const m = measure();
    if (m) setAway(m.x < m.label || m.x > m.el.clientWidth);
  };

  const ticks = Array.from({ length: SPAN }, (_, i) => i);
  return (
    <div className="space-y-2">
      <div ref={scroller} className="el-scroll" tabIndex={0} role="group" onScroll={onScroll} aria-label={`Elections ${FIRST}–${LAST}, by state and date; scrolls sideways`}>
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
                <div className="el-track">
                  {ticks.map((i) => <i key={i} className={`el-tick${i % 12 === 0 ? ' el-tick-year' : ''}`} style={{ left: pct(i) }} aria-hidden="true" />)}
                  {byState.get(s)!.map((e) => <Dot key={e.id} e={e} on={matches(e)} />)}
                </div>
              </div>
            );
          })}
          {/* One unbroken line for today, down every lane. */}
          {todayAt != null && <i ref={line} className="el-today" style={{ left: `calc(var(--label) + ${todayAt} * var(--mw))` }} aria-hidden="true" />}
        </div>
      </div>
      <div className="el-legend">
        <span><i className="el-key el-key-held" aria-hidden="true" /> held</span>
        <span><i className="el-key" aria-hidden="true" /> coming</span>
        {todayAt != null && <span><i className="el-key-line" aria-hidden="true" /> today</span>}
        <span>· Scroll sideways for every year</span>
        {todayAt != null && away && <button type="button" className="el-chip el-btn" onClick={() => toToday(smooth())}>Today</button>}
      </div>
    </div>
  );
}

/** An election on its lane: a link to its guide, or (still being planned, or filtered out) just its name. */
function Dot({ e, on }: { e: Election; on: boolean }) {
  const label = `${STATE_NAME[e.state]}, ${e.title}, ${weekday(e.date)} ${monthName(e.date)} ${dayOfMonth(e.date)}, ${e.date.slice(0, 4)}`;
  const common = { 'data-el': e.id, className: 'el-dot el-btn', style: { left: pct(place(e.date)) }, 'data-off': !on || undefined, 'data-held': daysUntil(e.date) < 0 || undefined, title: `${label}. ${e.what}` };
  if (!e.guide || !on) return <span {...common} role="img" aria-label={`${label}${e.guide ? '' : ', guide not open yet'}`} tabIndex={on ? 0 : undefined}><i aria-hidden="true" /></span>;
  const { anchor, label: open } = e.guide;
  return (
    <a {...common} href={`${guidePath(guideOf(e))}${anchor ? `#${anchor}` : ''}`} aria-label={`${label}: ${open}`}
      onClick={(ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return; ev.preventDefault(); openGuide(guideOf(e), anchor); }}>
      <i aria-hidden="true" />
    </a>
  );
}
