import { Check } from 'lucide-react';
import { createContext, useContext } from 'react';
import { GUIDE_ELECTION_DAY } from './hosts';
import { useStateConfig } from './state';
import { daysUntil } from './store';
import type { Race } from './types';

// Election results on a state's landing page: each race's votes, who won (or
// is ahead), by how much, how much of the count is in, and whether the seat
// changed hands; each judge retention and ballot question's yes and no. Read
// daily from the state's official results (scripts/results.mjs →
// src/data/<state>/results.json). Until a state's results can be read,
// `pending` says when they will be and links the official pages that have the
// count now; `gaps` says which races are still to come.
//
// Calling a race: while the count is unofficial, the one ahead "won" only
// with every precinct in and a lead of more than CLOSE points; otherwise
// they're "ahead". Unopposed candidates win once the count is in. An official
// (canvassed) count is simply won. Where a state hasn't certified, a race can
// carry the Associated Press's call instead (scripts/results/ap-calls.mjs):
// its winners stand as called, labelled so, until the official count replaces
// them. A race with no more candidates than seats, and no count, was won
// unopposed once Election Day is past.

export interface RaceResult {
  /** Precincts in, and in all; absent from a canvassed total. */
  reporting?: number;
  precincts?: number;
  /** Every vote cast in the contest, write-ins included. */
  total: number;
  /** Votes by candidate ballot number. */
  votes: Record<string, number>;
  writeIn?: number;
  /** Votes for candidates the source lists and our ballot data doesn't. */
  others?: number;
  /** The canvassed, certified count. */
  official?: boolean;
  /** Called by a news organization before the state certified: who called it, when, and the winners' ballot numbers. */
  call?: { by: string; at: string | null; won: number[] };
}
export interface QuestionResult { reporting?: number; precincts?: number; yes: number; no: number; official?: boolean; call?: { by: string; at: string | null; passed: boolean } }
type Link = { name: string; url: string; /** A news organization's race calls, kept until the official count replaces them. */ calls?: boolean };
export interface Results {
  sources?: Link[];
  /** When the sources last changed. */
  asOf?: string | null;
  races: Record<string, RaceResult>;
  /** Judge retentions and ballot questions, by id. */
  questions?: Record<string, QuestionResult>;
  /** No results yet: when they'll come and where to see the count meanwhile (a sentence the links end). */
  pending?: { note: string; links: [string, string][] };
  /** Results for some races, not yet others: which, and when. */
  gaps?: string;
  /** Who certifies the official count, and when (the state's spec sets it): "Michigan’s Board of State Canvassers", "around Nov 23". */
  certify?: { who: string; when: string };
}

/** A lead of this many points or fewer, with every precinct in, isn't called until the state certifies. */
const CLOSE = 0.5;
/** An Illinois judge needs three-fifths yes to stay on the bench (Ill. Const. art. VI, § 12(d)). */
const RETAIN = 60;

const ResultsContext = createContext<Results | null>(null);
export const ResultsProvider = ResultsContext.Provider;
export const useResults = () => useContext(ResultsContext);

const pct = (n: number, of: number) => (of ? (n / of) * 100 : 0);
const num = (n: number) => n.toLocaleString('en-US');
/** "Called by the AP Nov 4" (Central time, the states' own). */
/** When the official count comes, after an AP call: "Official count expected around Nov 23." */
const comes = (certify?: Results['certify']) => (certify ? `Official count expected ${certify.when}.` : 'The official count comes when the state certifies.');
const calledBy = (c: { by: string; at: string | null }) => `Called by the ${c.by}${c.at ? ` ${new Date(c.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' })}` : ''}`;
const family = (party?: string) => (!party ? null : /democrat|dfl/i.test(party) ? 'D' : /republican/i.test(party) ? 'R' : null);
/** Whether every precinct is in: always for a canvassed count. */
const counted = (r: { reporting?: number; precincts?: number; official?: boolean }) => r.official || (r.reporting != null && r.precincts != null && r.reporting >= r.precincts);
/** How much of the count is in, in words. */
const howMuch = (r: { reporting?: number; precincts?: number; official?: boolean }) =>
  r.official ? 'Official canvassed count' : r.precincts == null ? '' : counted(r) ? `All ${num(r.precincts)} precincts counted` : `${num(r.reporting ?? 0)} of ${num(r.precincts)} precincts counted`;

/** Who won or leads a race, by how much, and what changed. */
export function outcome(race: Race, r: RaceResult) {
  const rows = race.candidates.map((c) => ({ c, votes: r.votes[c.ballot] ?? 0 })).sort((a, b) => b.votes - a.votes);
  const seats = Math.max(1, race.voteFor);
  const done = counted(r);
  const unopposed = race.candidates.length <= seats;
  const lead = rows.length > seats ? pct(rows[seats - 1].votes - rows[seats].votes, r.total) : null;
  const call: 'won' | 'close' | 'ahead' = r.official || r.call || (done && (unopposed || (lead ?? 0) > CLOSE)) ? 'won' : done ? 'close' : 'ahead';
  const winners = r.call && !r.official ? rows.filter((x) => r.call!.won.includes(x.c.ballot)) : rows.slice(0, seats);
  // What happened to the seat (one-seat races): the incumbent's fate, or a party change.
  let change: string | null = null;
  if (seats === 1 && call === 'won') {
    const ran = race.incumbents?.find((i) => i.ballot != null);
    const was = race.incumbents?.[0];
    if (ran) change = ran.ballot === winners[0].c.ballot ? 'Incumbent re-elected' : 'Incumbent defeated';
    else if (was?.party && family(was.party) && family(winners[0].c.party)) {
      change = family(was.party) === family(winners[0].c.party) ? `${winners[0].c.party} holds the seat` : `Flips from ${was.party} to ${winners[0].c.party}`;
    }
  }
  return { rows, winners, call, lead, done, unopposed, change };
}

/** The small "Results · unofficial" heading with the call on the right. */
function Head({ official, call, color }: { official?: boolean; call: string; color: string }) {
  return (
    <p className="mb-2 flex flex-wrap items-center justify-between gap-x-2 text-[11px] font-black uppercase tracking-wider">
      <span>{official ? 'Results · official' : 'Results · unofficial'}</span>
      <span className="rounded-full px-2 py-0.5 normal-case tracking-normal" style={{ background: `color-mix(in srgb, ${color} 22%, transparent)` }}>{call}</span>
    </p>
  );
}

/** One line of the count: a name (✓ when it won), its share, a bar and its votes. */
function Bar({ label, sub, votes, share, won, dim, color }: { label: string; sub?: string; votes: number; share: number; won: boolean; dim: boolean; color: string }) {
  return (
    <li>
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate">
          {won && <Check className="mr-1 inline h-3.5 w-3.5 align-[-2px]" strokeWidth={3} aria-label="won" />}
          <span className={won ? 'font-black' : 'font-semibold'}>{label}</span>{sub && <> <span className="text-[12px]">{sub}</span></>}
        </span>
        <span className="shrink-0 tabular-nums font-bold">{share.toFixed(1)}%</span>
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--kyb-chip)]" aria-hidden="true">
          <span className="block h-full rounded-full" style={{ width: `${share}%`, background: color, opacity: dim ? 0.45 : 1 }} />
        </span>
        <span className="w-[5.5rem] shrink-0 text-right text-[12px] tabular-nums">{num(votes)}</span>
      </div>
    </li>
  );
}

/** A race's results: a bar per candidate, the call and the margin. `compact`: one line, for a district's row. */
export function RaceResults({ race, color, compact = false }: { race: Race; color: string; compact?: boolean }) {
  const results = useResults();
  const { electionDate } = useStateConfig();
  const r = results?.races[race.id];
  if (!r) {
    // No count, but no contest either: everyone running won their seat.
    // Only once this guide's own Election Day is past (Chicago's is Feb 23, 2027, not Nov 3).
    if (!results || daysUntil(electionDate ?? GUIDE_ELECTION_DAY) >= 0 || !race.candidates.length || race.candidates.length > Math.max(1, race.voteFor)) return null;
    const names = race.candidates.map((c) => c.name).join(', ');
    return compact
      ? <span className="block text-xs font-bold">✓ {names} · elected unopposed</span>
      : <p className="rounded-xl border border-[var(--gb-border)] p-3 text-[13px]"><strong>✓ Elected unopposed:</strong> {names}. No one ran against them, so there’s no count to show.</p>;
  }
  const o = outcome(race, r);
  const verb = o.call === 'won' ? (o.unopposed ? 'Unopposed' : 'Won') : 'Ahead';
  if (compact) {
    return (
      <span className="block text-xs font-bold">
        {o.call === 'won' ? '✓ ' : ''}{o.winners.map((w) => w.c.name).join(', ')} · {verb.toLowerCase()}{o.lead != null ? ` by ${o.lead.toFixed(1)} pts` : ''}{o.call === 'close' ? ', too close to call' : ''}
      </span>
    );
  }
  return (
    <div className="rounded-xl border border-[var(--gb-border)] p-3 text-[13px]">
      <Head official={r.official} color={color} call={o.call === 'won' ? `✓ ${verb}` : o.call === 'close' ? 'Too close to call' : 'Counting'} />
      {r.call && !r.official && <p className="-mt-1 mb-2 text-[12px] font-bold">{calledBy(r.call)}. {comes(results?.certify)}</p>}
      <ul className="space-y-1.5">
        {o.rows.map(({ c, votes }) => {
          const won = o.call === 'won' && o.winners.some((w) => w.c === c);
          return <Bar key={c.ballot} label={c.name} sub={c.party} votes={votes} share={pct(votes, r.total)} won={won} dim={o.call === 'won' && !won} color={color} />;
        })}
      </ul>
      <p className="mt-2 text-[12px] leading-snug">
        {o.lead != null && <>{o.call === 'won' ? 'Won' : 'Leads'} by <strong>{o.lead.toFixed(1)} pts</strong> · </>}
        {howMuch(r)}
        {r.writeIn ? ` · ${num(r.writeIn)} write-in votes` : ''}
        {r.others ? ` · ${num(r.others)} votes for candidates not listed here` : ''}
        {o.change && <> · <strong>{o.change}</strong></>}
        {o.call === 'close' && ` · within ${CLOSE} pts, so not called until certified`}
      </p>
    </div>
  );
}

/**
 * A judge retention's or ballot question's yes and no. A judge stays on the
 * bench with RETAIN% yes; a question passes on a majority (an advisory one
 * only says what voters think). Called like a race: once the count is in.
 */
export function QuestionResults({ id, color, retention = false }: { id: string; color: string; retention?: boolean }) {
  const results = useResults();
  const r = results?.questions?.[id];
  if (!r) return null;
  const all = r.yes + r.no;
  const yes = pct(r.yes, all);
  const called = !r.official ? r.call : undefined;
  const done = counted(r) || !!called;
  const passes = called ? called.passed : retention ? yes >= RETAIN : r.yes > r.no;
  const call = retention
    ? (!done ? (passes ? 'Counting · on track to stay' : `Counting · short of ${RETAIN}% so far`) : passes ? '✓ Retained' : 'Not retained')
    : (!done ? (passes ? 'Counting · yes leads' : 'Counting · no leads') : passes ? '✓ Passes' : 'Fails');
  return (
    <div className="rounded-xl border border-[var(--gb-border)] p-3 text-[13px]">
      <Head official={r.official} color={color} call={call} />
      {called && <p className="-mt-1 mb-2 text-[12px] font-bold">{calledBy(called)}. {comes(results?.certify)}</p>}
      <ul className="space-y-1.5">
        <Bar label="Yes" votes={r.yes} share={yes} won={done && passes} dim={done && !passes} color={color} />
        <Bar label="No" votes={r.no} share={100 - yes} won={done && !passes} dim={done && passes} color={color} />
      </ul>
      <p className="mt-2 text-[12px] leading-snug">
        {retention ? `Needs ${RETAIN}% yes to stay on the bench` : 'Passes with more yes than no'}
        {retention && done ? ` · ${passes ? 'cleared it by' : 'short by'} ${Math.abs(yes - RETAIN).toFixed(1)} pts` : ''}
        {howMuch(r) && ` · ${howMuch(r)}`}
      </p>
    </div>
  );
}

const LINK = 'underline decoration-1 underline-offset-2 hover:text-[var(--gb-link)]';
const links = (list: [string, string][]) => list.map(([label, url], i) => (
  <span key={url}>{i > 0 && (i === list.length - 1 ? ' and ' : ', ')}<a className={LINK} href={url} target="_blank" rel="noopener">{label}</a></span>
));

/** Where the results come from, as of when, and what "unofficial" means; or, before there are any, when they'll come. */
export function ResultsNote() {
  const results = useResults();
  if (!results) return null;
  const box = 'rounded-xl border border-[var(--gb-border)] bg-[var(--gb-surface)] px-4 py-3 text-[14px] leading-relaxed';
  const items = [...Object.values(results.races), ...Object.values(results.questions ?? {})];
  if (!items.length) {
    return results.pending ? <p className={box}><strong>📊 Results:</strong> {results.pending.note} {links(results.pending.links)}.</p> : null;
  }
  const official = items.every((r) => r.official);
  const when = results.asOf ? new Date(results.asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : null;
  return (
    <p className={box}>
      <strong>📊 Results{official ? '' : ', unofficial'}:</strong> races below show their count from {links((results.sources ?? []).map((s) => [`the ${s.name}`, s.url]))}
      {when ? `, updated ${when}` : ''}.{' '}
      {official ? 'The counts are official.' : items.some((r) => r.call)
        ? `Counts can still change until they’re certified. A race marked “Called by the AP” is the Associated Press’s call, a projection from its count; the state’s official count replaces it once certified. Any other race is called only with every precinct in and a lead of more than ${CLOSE} points.`
        : `Counts can still change until they’re certified; a race is called only with every precinct in and a lead of more than ${CLOSE} points.`}
      {!official && results.certify && <> {results.certify.who[0].toUpperCase() + results.certify.who.slice(1)} certifies the official count {results.certify.when}.</>}
      {results.gaps && <> {results.gaps}</>}
    </p>
  );
}
