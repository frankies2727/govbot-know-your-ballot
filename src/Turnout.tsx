import { useState } from 'react';
import data from './data/turnout.json';
import { compact as short } from './lib/format';

// Under each state's tile on the home page: how many voted in each November
// general election since 2014 and how that compares with the elections before.
// Turnout is the University of Florida Election Lab's (the U.S. Elections
// Project): ballots counted over the voting-eligible population, one method
// for every state and year, so states and cycles compare fairly. Registered
// voters, and the share of them who voted, are each state's own figures where
// the state publishes them (Minnesota and Wisconsin register voters on
// election day, so a share of the pre-election roll isn't comparable there).
// src/data/turnout.json names the file behind every number.

export type StateId = 'illinois' | 'michigan' | 'minnesota' | 'wisconsin';

interface Cycle {
  year: number;
  /** Ballots counted (Election Lab). */
  ballots: number;
  /** Voting-eligible population (Election Lab). */
  eligible: number;
  /** ballots / eligible, in percent, as the Election Lab gives it. */
  pct: number;
  /** The Election Lab's figures are still preliminary; `estimate` when the ballots are its rounded first estimate. */
  preliminary?: boolean;
  estimate?: boolean;
  /** The figures are the state's own unofficial count, not the Lab's (Minnesota 2026). */
  state?: boolean;
  /** The state's own count of registered voters for that election, and the share of them who voted. */
  registered?: number | null;
  regPct?: number | null;
}

interface StateTurnout {
  office: { name: string; url: string };
  /** Why there's no registered-voter share, when there isn't one. */
  regNote?: string;
  cycles: Cycle[];
}

const turnout = data as { lab: { name: string; url: string }; asOf: string; states: Record<StateId, StateTurnout> };

const midterm = (y: number) => y % 4 === 2;
/** The general election's date, "Nov. 3, 2026": the Tuesday after the first Monday of November. */
function electionDay(y: number) {
  const d = new Date(y, 10, 2);
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
  return `Nov. ${d.getDate()}, ${y}`;
}
const full = (n: number) => n.toLocaleString('en-US');

/** One decimal with its sign; rounded first, so a hair's difference reads ±0.0, not +0.0. */
const signed = (n: number) => { const r = Math.round(n * 10) / 10; return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r).toFixed(1)}`; };
/** Change from `b` to `a` in percent. */
const growth = (a: number, b: number) => ((a - b) / b) * 100;

export function Turnout({ state, name, ink }: { state: StateId; name: string; ink: string }) {
  const t = turnout.states[state];
  const cycles = [...t.cycles].sort((a, b) => a.year - b.year);
  const head = cycles[cycles.length - 1];
  const [picked, setPicked] = useState(head.year);
  const sel = cycles.find((c) => c.year === picked) ?? head;
  const before = (c: Cycle, years: number) => cycles.find((p) => p.year === c.year - years);
  // Four years back is the same kind of election (midterm with midterm), so the headline and the bar readout compare with it; the table also has two years back.
  const same = before(head, 4);
  const prev = before(sel, 4);
  const approx = (c: Cycle) => (c.estimate ? '≈' : '');

  return (
    <section aria-label={`${name}: voter turnout`} className="mb-4 min-w-0 rounded-[14px] border border-[var(--gb-border)] bg-[var(--gb-surface)] p-3 text-[13.5px] leading-snug sm:p-4" style={{ '--ink': ink } as React.CSSProperties}>
      <p className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[12px] font-bold uppercase tracking-wider">
        <span>{electionDay(head.year)} {midterm(head.year) ? 'midterm' : 'presidential'} turnout</span>
        {head.preliminary && <span className="rounded-full border border-[var(--gb-border-strong)] px-1.5 py-px text-[11px] normal-case tracking-normal">{head.estimate ? 'First estimate' : head.state ? 'Unofficial count' : 'Preliminary'}</span>}
      </p>
      <p className="mt-1 font-serif text-[2rem] font-medium leading-none sm:text-[2.4rem]">{head.pct.toFixed(1)}%</p>
      <p className="mt-1">of eligible voters voted</p>
      {same && (
        <p className="mt-1">
          <strong className="whitespace-nowrap">{signed(head.pct - same.pct)} pts</strong> vs. {same.year}
        </p>
      )}
      <dl className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
        <Stat k="Voted" v={`${approx(head)}${short(head.ballots)}`} title={full(head.ballots)} />
        <Stat k="Eligible" v={short(head.eligible)} title={full(head.eligible)} />
        {same && <Stat k={`Votes vs. ${same.year}`} v={`${signed(growth(head.ballots, same.ballots))}%`} />}
        {head.registered != null && <Stat k="Registered" v={short(head.registered)} title={full(head.registered)} />}
      </dl>

      <Bars cycles={cycles} picked={sel.year} onPick={setPicked} name={name} />
      <p className="min-h-[3.9em] text-[12.5px]" aria-live="polite">
        <strong>{sel.year}</strong> {midterm(sel.year) ? 'midterm' : 'presidential'}: {sel.pct.toFixed(1)}% · {approx(sel)}{full(sel.ballots)} voted
        {prev && <> · {signed(sel.pct - prev.pct)} pts, {signed(growth(sel.ballots, prev.ballots))}% votes vs. {prev.year}</>}
      </p>

      <details className="mt-1">
        <summary className="cursor-pointer py-1 font-bold">Every election since 2014</summary>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[420px] text-right text-[12.5px] tabular-nums">
            <thead>
              <tr className="border-b border-[var(--gb-border)] align-bottom">
                <th scope="col" className="py-1 text-left font-bold">Year</th>
                <th scope="col" className="font-bold">Turnout</th>
                <th scope="col" className="font-bold">Voted</th>
                <th scope="col" className="font-bold">vs. 2 yrs</th>
                <th scope="col" className="font-bold">vs. 4 yrs</th>
                <th scope="col" className="font-bold">Registered</th>
                <th scope="col" className="pl-1 font-bold">Of reg.</th>
              </tr>
            </thead>
            <tbody>
              {[...cycles].reverse().map((c) => {
                const p2 = before(c, 2);
                const p4 = before(c, 4);
                return (
                  <tr key={c.year} className="border-b border-[var(--gb-border)] last:border-0">
                    <th scope="row" className="py-1 text-left font-semibold">{c.year}{c.preliminary ? '*' : ''}</th>
                    <td>{c.pct.toFixed(1)}%</td>
                    <td title={full(c.ballots)}>{approx(c)}{short(c.ballots)}</td>
                    <td>{p2 ? `${signed(growth(c.ballots, p2.ballots))}%` : '—'}</td>
                    <td>{p4 ? `${signed(growth(c.ballots, p4.ballots))}%` : '—'}</td>
                    <td title={c.registered != null ? full(c.registered) : undefined}>{c.registered != null ? short(c.registered) : '—'}</td>
                    <td>{c.regPct != null ? `${c.regPct.toFixed(1)}%` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[12px]">
          Turnout is ballots counted over the voting-eligible population. “vs.” is the change in votes from the election 2 and 4 years before; a midterm is best compared with the one 4 years before.
          {cycles.some((c) => c.preliminary) && ' * Preliminary; ≈ is a first estimate, revised as counties finish.'}
          {t.regNote ? ` ${t.regNote}` : ''}
        </p>
      </details>
      <p className="mt-2 text-[12px]">
        Sources: <a className="underline decoration-1 underline-offset-2 hover:text-[var(--gb-link)]" href={turnout.lab.url} target="_blank" rel="noopener">{turnout.lab.name}</a>{head.preliminary && <> (as of {new Date(`${turnout.asOf}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</>}
        {cycles.some((c) => c.registered != null || c.state) && <>; state figures, <a className="underline decoration-1 underline-offset-2 hover:text-[var(--gb-link)]" href={t.office.url} target="_blank" rel="noopener">{t.office.name}</a></>}
      </p>
    </section>
  );
}

function Stat({ k, v, title }: { k: string; v: string; title?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 sm:block">
      <dt className="text-[12px]">{k}</dt>
      <dd className="font-bold tabular-nums" title={title}>{v}</dd>
    </div>
  );
}

/** One bar per election on a 0–100% scale: midterms filled, presidential years outlined (so the kind isn't colour alone). Tap, hover or focus one to read it. */
function Bars({ cycles, picked, onPick, name }: { cycles: Cycle[]; picked: number; onPick: (y: number) => void; name: string }) {
  return (
    <div className="mt-3">
      <div role="group" aria-label={`${name}: turnout of eligible voters, by election`} className="flex h-[84px] items-end border-b border-[var(--gb-border-strong)]">
        {cycles.map((c) => (
          <button key={c.year} type="button" onClick={() => onPick(c.year)} onMouseEnter={() => onPick(c.year)} onFocus={() => onPick(c.year)}
            aria-pressed={c.year === picked} aria-label={`${c.year}: ${c.pct.toFixed(1)}%`}
            className="flex h-full min-w-0 flex-1 items-end justify-center px-[2px]">
            <span className={`kyb-bar ${midterm(c.year) ? 'kyb-bar-mid' : 'kyb-bar-pres'} ${c.year === picked ? 'kyb-bar-on' : ''}`} style={{ height: `${c.pct}%` }} />
          </button>
        ))}
      </div>
      <div className="mt-1 flex text-center text-[10.5px] tabular-nums" aria-hidden="true">
        {cycles.map((c) => <span key={c.year} className={`min-w-0 flex-1 ${c.year === picked ? 'font-black' : ''}`}>’{String(c.year).slice(2)}</span>)}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 text-[11px]" aria-hidden="true">
        <span className="inline-flex items-center gap-1"><span className="kyb-bar-mid kyb-key" />midterm</span>
        <span className="inline-flex items-center gap-1"><span className="kyb-bar-pres kyb-key" />presidential</span>
      </p>
    </div>
  );
}
