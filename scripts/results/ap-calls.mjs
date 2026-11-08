// A one-time import of the Associated Press's race calls (and its unofficial
// vote counts) for the races a state hasn't certified yet, from the results
// file The New York Times publishes (it carries the AP's calls). Not run on a
// schedule: save the state's file by hand, then run
//   node scripts/results/ap-calls.mjs michigan path/to/results-michigan.json
// Each race keeps its count from the state's own sources where we have one;
// only races without a result get the AP's, marked `call` (who called it and
// when), and the official count replaces it when the state certifies
// (scripts/results.mjs). A race the AP hasn't called is left out.
//
// Contests are matched to our races by who's running (match.mjs). The AP
// lists some minor candidates our ballot data doesn't; such a race still
// matches when every one of our candidates and every winner is in the AP's
// list, and the others' votes are counted as `others`.

import { readFileSync, writeFileSync } from 'node:fs';
import { candidateFor, matchContests, matchQuestions } from './match.mjs';

const [state, file] = process.argv.slice(2);
if (!state || !file) { console.error('Usage: node scripts/results/ap-calls.mjs <state> <saved results json>'); process.exit(1); }
const PAGE = `https://www.nytimes.com/interactive/2026/11/03/us/elections/results-${state}.html`;
export const SOURCE = { name: 'Associated Press (race calls and unofficial counts, as published by The New York Times)', url: PAGE, calls: true };

const feed = JSON.parse(readFileSync(file, 'utf8'));
const ballot = JSON.parse(readFileSync(new URL(`../../src/data/${state}/ballot.json`, import.meta.url), 'utf8'));
const OUT = new URL(`../../src/data/${state}/results.json`, import.meta.url);
const results = JSON.parse(readFileSync(OUT, 'utf8'));

/** A called race as a contest the matcher reads: its statewide (or district-wide) count, and who won. */
function contest(race) {
  const unit = race.top_reporting_unit ?? race.reporting_units[0];
  const who = (id) => race.candidate_metadata[id];
  const name = (m) => [m.first_name, m.last_name].filter(Boolean).join(' ');
  const rows = unit.candidates.map((c) => {
    const m = who(c.nyt_id);
    const writeIn = /write/i.test(c.nyt_id) || /write/i.test(m?.last_name ?? '');
    // Also by first and middle name: "Kelly Tebay Zemke" is our "Kelly Tebay".
    const alts = writeIn || !m?.middle_name ? [] : [`${m.first_name} ${m.middle_name}`];
    return { name: writeIn ? 'Write-in' : name(m), alts, votes: c.votes.total, writeIn };
  });
  return {
    office: [race.office, race.seat].filter(Boolean).join(' '),
    rows,
    total: rows.reduce((s, r) => s + r.votes, 0),
    reporting: unit.precincts_reporting ?? undefined,
    precincts: unit.precincts_total ?? undefined,
    won: race.outcome.won.map((id) => (who(id) ? name(who(id)) : id)),
    at: [...(race.outcome.winner_accepted_at ?? [])].sort().pop() ?? null,
  };
}

const called = feed.races.filter((r) => r.outcome?.won?.length && r.outcome.called_by?.includes('ap'));
const contests = called.map(contest);
const yesNo = (c) => c.rows.length === 2 && c.rows.every((r) => /^(yes|no)$/i.test(r.name.trim()));

// Races without a result yet.
const open = ballot.races.filter((r) => !results.races[r.id]);
const { matched, unmatched } = matchContests(contests.filter((c) => !yesNo(c)), open);
const taken = new Set(matched.map((m) => m.race.id));

/** The contest's rows that are our race's candidates, by ballot number (null if one of ours isn't there, or a winner is missing). */
function place(race, c) {
  const at = (row) => [row.name, ...row.alts].map((n) => candidateFor(race, n)).find(Boolean);
  const by = new Map();
  for (const row of c.rows) { const k = !row.writeIn && at(row); if (k && !by.has(k.ballot)) by.set(k.ballot, row); }
  if (by.size !== race.candidates.length) return null;
  const won = c.won.map((w) => [...by].find(([, row]) => row.name === w)?.[0]);
  return won.includes(undefined) ? null : { by, won };
}

// A contest the strict match left out: the one open race all of whose candidates (and every winner) it lists.
const loose = [];
for (const c of contests.filter((x) => !yesNo(x) && unmatched.includes(x.office))) {
  const fits = open.filter((r) => !taken.has(r.id) && place(r, c));
  if (fits.length === 1) { loose.push({ race: fits[0], contest: c }); taken.add(fits[0].id); }
}

let races = 0;
for (const { race, contest: c } of [...matched, ...loose]) {
  const p = place(race, c);
  if (!p) { console.warn(`${race.id}: the AP's winner isn't one of our candidates; left out`); continue; }
  const votes = Object.fromEntries([...p.by].map(([b, row]) => [b, row.votes]));
  const writeIn = c.rows.filter((r) => r.writeIn).reduce((s, r) => s + r.votes, 0);
  const others = c.total - writeIn - Object.values(votes).reduce((s, v) => s + v, 0);
  results.races[race.id] = { reporting: c.reporting, precincts: c.precincts, total: c.total, votes, ...(writeIn ? { writeIn } : {}), ...(others ? { others } : {}), call: { by: 'AP', at: c.at, won: p.won } };
  races++;
}

// Ballot questions and retentions without a result yet: by their titles, else
// a statewide one by its number ("Proposal 2 - …" is our "Proposal 2026-2: …").
const have = new Set(Object.keys(results.questions ?? {}));
const numbered = (n) => (ballot.measures ?? []).filter((m) => !have.has(m.id) && new RegExp(`\\b(?:\\d{4}-)?${n}$`).test((m.title ?? '').split(':')[0]));
let qs = 0;
for (const c of contests.filter(yesNo)) {
  const [q] = matchQuestions([c], (ballot.retentions ?? []).filter((r) => !have.has(r.id)), (ballot.measures ?? []).filter((m) => !have.has(m.id)));
  const n = c.office.match(/^(?:Proposal|Question) (\d+) -/)?.[1];
  const byNumber = !q && n ? numbered(n) : [];
  const id = q?.id ?? (byNumber.length === 1 ? byNumber[0].id : null);
  if (!id) continue;
  have.add(id);
  const yes = c.rows.find((r) => /^yes$/i.test(r.name)).votes;
  const no = c.rows.find((r) => /^no$/i.test(r.name)).votes;
  (results.questions ??= {})[id] = { reporting: c.reporting, precincts: c.precincts, yes, no, call: { by: 'AP', at: c.at, passed: /^yes$/i.test(c.won[0]) } };
  qs++;
}

if (races || qs) {
  results.sources = [...(results.sources ?? []).filter((s) => !s.calls), SOURCE];
  const fed = feed.resultsMeta?.resultsUpdatedAt ?? null;
  if (fed && (!results.asOf || fed > results.asOf)) results.asOf = fed;
  delete results.pending;
}
writeFileSync(OUT, `${JSON.stringify(results, null, 1)}\n`);
console.log(`${state}: ${called.length} races the AP has called; ${races} races and ${qs} questions added; ${unmatched.length - loose.length} not matched to a race still open here (already counted, or not on our ballot)`);
