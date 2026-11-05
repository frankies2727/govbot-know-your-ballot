import { Check } from 'lucide-react';
import { createContext, useContext } from 'react';
import type { Race } from './types';

// Election results on a state's landing page: each race's votes, who won (or
// is ahead), by how much, how much of the count is in, and whether the seat
// changed hands. Read daily from the state's official results files
// (scripts/results.mjs → src/data/<state>/results.json). Until a state's
// results can be read, `pending` says when they will be and links the
// official pages that have the unofficial count now.
//
// Calling a race: while the count is unofficial, the one ahead "won" only
// with every precinct in and a lead of more than CLOSE points; otherwise
// they're "ahead". Unopposed candidates win once the count is in. A race is
// simply won once the state certifies (`official`).

export interface RaceResult {
  reporting: number;
  precincts: number;
  /** Every vote cast in the contest, write-ins included. */
  total: number;
  /** Votes by candidate ballot number. */
  votes: Record<string, number>;
  writeIn?: number;
}
export interface Results {
  source?: { name: string; url: string };
  /** When the source last changed its files. */
  asOf?: string | null;
  official?: boolean;
  races: Record<string, RaceResult>;
  /** No results yet: when they'll come and where to see the count meanwhile (a sentence the links end). */
  pending?: { note: string; links: [string, string][] };
}

/** A lead of this many points or fewer, with every precinct in, isn't called until the state certifies. */
const CLOSE = 0.5;

const ResultsContext = createContext<Results | null>(null);
export const ResultsProvider = ResultsContext.Provider;
export const useResults = () => useContext(ResultsContext);

const pct = (n: number, of: number) => (of ? (n / of) * 100 : 0);
const family = (party?: string) => (!party ? null : /democrat|dfl/i.test(party) ? 'D' : /republican/i.test(party) ? 'R' : null);

/** Who won or leads a race, by how much, and what changed. */
export function outcome(race: Race, r: RaceResult, official = false) {
  const rows = race.candidates.map((c) => ({ c, votes: r.votes[c.ballot] ?? 0 })).sort((a, b) => b.votes - a.votes);
  const seats = Math.max(1, race.voteFor);
  const done = r.reporting >= r.precincts;
  const unopposed = race.candidates.length <= seats;
  const lead = rows.length > seats ? pct(rows[seats - 1].votes - rows[seats].votes, r.total) : null;
  const call: 'won' | 'close' | 'ahead' = official || (done && (unopposed || (lead ?? 0) > CLOSE)) ? 'won' : done ? 'close' : 'ahead';
  const winners = rows.slice(0, seats);
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

/** A race's results: a bar per candidate, the call and the margin. `compact`: one line, for a district's row. */
export function RaceResults({ race, color, compact = false }: { race: Race; color: string; compact?: boolean }) {
  const results = useResults();
  const r = results?.races[race.id];
  if (!r) return null;
  const o = outcome(race, r, results?.official);
  const top = o.winners[0];
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
      <p className="mb-2 flex flex-wrap items-center justify-between gap-x-2 text-[11px] font-black uppercase tracking-wider">
        <span>{results?.official ? 'Results · certified' : 'Results · unofficial'}</span>
        <span className="rounded-full px-2 py-0.5 normal-case tracking-normal" style={{ background: `color-mix(in srgb, ${color} 22%, transparent)` }}>
          {o.call === 'won' ? `✓ ${verb}` : o.call === 'close' ? 'Too close to call' : 'Counting'}
        </span>
      </p>
      <ul className="space-y-1.5">
        {o.rows.map(({ c, votes }) => {
          const share = pct(votes, r.total);
          const won = o.call === 'won' && o.winners.some((w) => w.c === c);
          return (
            <li key={c.ballot}>
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {won && <Check className="mr-1 inline h-3.5 w-3.5 align-[-2px]" strokeWidth={3} aria-label="won" />}
                  <span className={won ? 'font-black' : 'font-semibold'}>{c.name}</span> <span className="text-[12px]">{c.party}</span>
                </span>
                <span className="shrink-0 tabular-nums font-bold">{share.toFixed(1)}%</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--kyb-chip)]" aria-hidden="true">
                  <span className="block h-full rounded-full" style={{ width: `${share}%`, background: color, opacity: won || o.call !== 'won' ? 1 : 0.45 }} />
                </span>
                <span className="w-[5.5rem] shrink-0 text-right text-[12px] tabular-nums">{votes.toLocaleString('en-US')}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[12px] leading-snug">
        {top && o.lead != null && <>{o.call === 'won' ? 'Won' : 'Leads'} by <strong>{o.lead.toFixed(1)} pts</strong> · </>}
        {o.done ? `All ${r.precincts.toLocaleString('en-US')} precincts counted` : `${r.reporting.toLocaleString('en-US')} of ${r.precincts.toLocaleString('en-US')} precincts counted`}
        {r.writeIn ? ` · ${r.writeIn.toLocaleString('en-US')} write-in votes` : ''}
        {o.change && <> · <strong>{o.change}</strong></>}
        {o.call === 'close' && ` · within ${CLOSE} pts, so not called until certified`}
      </p>
    </div>
  );
}

/** Where the results come from, as of when, and what "unofficial" means; or, before there are any, when they'll come. */
export function ResultsNote() {
  const results = useResults();
  if (!results) return null;
  const link = 'underline decoration-1 underline-offset-2 hover:text-[var(--gb-link)]';
  if (results.pending && !Object.keys(results.races).length) {
    return (
      <p className="rounded-xl border border-[var(--gb-border)] bg-[var(--gb-surface)] px-4 py-3 text-[14px] leading-relaxed">
        <strong>📊 Results:</strong> {results.pending.note}{' '}
        {results.pending.links.map(([label, url], i) => (
          <span key={url}>{i > 0 && (i === results.pending!.links.length - 1 ? ' and ' : ', ')}<a className={link} href={url} target="_blank" rel="noopener">{label}</a></span>
        ))}.
      </p>
    );
  }
  const when = results.asOf ? new Date(results.asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;
  return (
    <p className="rounded-xl border border-[var(--gb-border)] bg-[var(--gb-surface)] px-4 py-3 text-[14px] leading-relaxed">
      <strong>📊 Results{results.official ? '' : ', unofficial'}:</strong> every race below shows its count from the{' '}
      {results.source ? <a className={link} href={results.source.url} target="_blank" rel="noopener">{results.source.name}</a> : 'state'}
      {when ? `, updated ${when}` : ''}.{' '}
      {results.official ? 'The state has certified them.' : `Counts can still change until the state certifies them; a race is called only with every precinct in and a lead of more than ${CLOSE} points.`}
    </p>
  );
}
