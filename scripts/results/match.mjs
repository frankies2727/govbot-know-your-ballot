// Matching an election office's results to our races: by who's running, not
// by office titles (each source spells those its own way). A person is their
// first and last name ("Sarah E. Hennesy" and "Sarah Hennesy" are one), a
// ticket the person at its head ("Amy Klobuchar & Ben Schierer", "Amy
// Klobuchar and Ben Schierer" and Illinois' "AMY KLOBUCHAR" are one). Where
// the first names differ (Ron and Ronald, George "Chip" and Chip, Julie
// Vossen-Henslin and Julie Henslin) the race is found by its last names alone
// (a hyphenated one by its last part), when exactly one race has those and
// there are at least two of them (one surname alone is too common). Pure
// functions, tested in match.test.mjs.

const SUFFIX = /^(jr|sr|ii|iii|iv|v)$/;

/** "Sarah E. Hennesy" → "sarah hennesy"; a ticket → the person at its head. With `last`, the last name only: "hennesy". */
export function personKey(name, last = false) {
  const head = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+(?:&|and)\s+/)[0];
  const words = head.replace(/["“”(][^"“”)]*["“”)]/g, ' ').replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(Boolean).filter((w) => !SUFFIX.test(w));
  // Last names alone compare their last part: "Vossen-Henslin" is "henslin".
  if (last || words.length < 2) return (words[words.length - 1] ?? '').split('-').pop();
  return `${words[0]} ${words[words.length - 1]}`;
}

/**
 * Each contest in `contests` ([{ rows: [{ name, votes, writeIn }], ... }])
 * paired with the race in `races` whose candidates are exactly its named
 * people. A contest that matches no race, or more than one, is left out
 * (and listed in `unmatched`).
 */
export function matchContests(contests, races) {
  const index = (last) => {
    const m = new Map();
    for (const r of races) {
      const key = r.candidates.map((c) => personKey(c.name, last)).sort().join('|');
      m.set(key, m.has(key) ? null : r); // two races with the same people: ambiguous
    }
    return m;
  };
  const [full, lastOnly] = [index(false), index(true)];
  const matched = [];
  const unmatched = [];
  for (const c of contests) {
    const named = c.rows.filter((x) => !x.writeIn);
    const key = (last) => named.map((x) => personKey(x.name, last)).sort().join('|');
    // Last names alone only with two or more people: one surname is too common to name a race.
    const race = full.get(key(false)) ?? (named.length > 1 ? lastOnly.get(key(true)) : undefined);
    if (race) matched.push({ race, contest: c }); else unmatched.push(c.office);
  }
  return { matched, unmatched };
}

/** The race's candidate for a results row: by first and last name, else by last name if only one has it. */
function candidateFor(race, name) {
  const exact = race.candidates.find((k) => personKey(k.name) === personKey(name));
  if (exact) return exact;
  const same = race.candidates.filter((k) => personKey(k.name, true) === personKey(name, true));
  return same.length === 1 ? same[0] : null;
}

/** A matched contest as the page stores it: votes by each candidate's ballot number. */
export function toResult(race, contest) {
  const votes = {};
  for (const x of contest.rows) {
    if (x.writeIn) continue;
    const c = candidateFor(race, x.name);
    if (!c) throw new Error(`${x.name} isn't a candidate in ${race.id}`);
    votes[c.ballot] = x.votes;
  }
  const writeIn = contest.rows.filter((x) => x.writeIn).reduce((s, x) => s + x.votes, 0);
  return { reporting: contest.reporting, precincts: contest.precincts, total: contest.total, votes, ...(writeIn ? { writeIn } : {}) };
}

const STOP = new Set(['the', 'of', 'for', 'a', 'an', 'and', 'to', 'in', 'on', 'at', 'by', 'shall', 'be', 'question', 'regarding', 'vote', 'former', 'site']);
/** Chicago's shortenings, written out. */
const LONG = { mhs: 'mental health services', govt: 'government' };
/** A question's title as its meaningful words (a ward/precinct tag like "W07 P14" left out). */
const words = (title) => new Set(title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\bw\d+\b|\bp\d+\b/g, ' ').replace(/[^a-z0-9+\s]/g, ' ')
  .split(/\s+/).flatMap((w) => (LONG[w] ?? w).split(' ')).filter((w) => w && !STOP.has(w)));
/** How alike two titles are: the words they share over all their words (0–1). */
function overlap(a, b) {
  const [x, y] = [words(a), words(b)];
  let n = 0;
  for (const w of x) if (y.has(w)) n++;
  return n / Math.max(1, new Set([...x, ...y]).size);
}
/** The ward and precinct a Chicago title is tagged with ("… W07 P14"), as our questions' id prefix: "precinct-7-14-" or "ward-26-". */
function place(title) {
  const m = title.match(/\bW(\d+)(?:\s+P(\d+))?\s*$/);
  if (!m) return null;
  return m[2] ? `precinct-${Number(m[1])}-${Number(m[2])}-` : `ward-${Number(m[1])}-`;
}

/**
 * Yes/no contests paired with our judge retentions (by the judge's name, which
 * is the contest's title) and ballot questions (by the words of their titles,
 * which each office shortens its own way: only a clear best match counts; a
 * question Chicago tags with a ward or precinct is matched among that place's).
 * Returns [{ id, countywide, result: { reporting, precincts, yes, no } }].
 */
export function matchQuestions(contests, retentions, measures) {
  const out = [];
  const taken = new Set();
  for (const c of contests) {
    const yes = c.rows.find((r) => /^yes$/i.test(r.name.trim()))?.votes ?? 0;
    const no = c.rows.find((r) => /^no$/i.test(r.name.trim()))?.votes ?? 0;
    const result = { reporting: c.reporting, precincts: c.precincts, yes, no };
    const judges = retentions.filter((r) => !r.withdrawn && personKey(r.judge) === personKey(c.office));
    if (judges.length === 1) { out.push({ id: judges[0].id, countywide: true, result }); continue; }
    // A question tagged with its ward or precinct is one of that place's; otherwise any of ours but those.
    const at = place(c.office);
    const pool = at ? measures.filter((m) => m.id.startsWith(at)) : measures.filter((m) => !/^(ward|precinct)-/.test(m.id));
    const scored = pool.map((m) => ({ m, score: overlap(c.office, m.title ?? '') })).sort((a, b) => b.score - a.score);
    const [best, second] = scored;
    // Only a clear best: a good share of words in common, well ahead of the next.
    if (best && best.score >= (at ? 0.3 : 0.5) && (!second || best.score - second.score >= 0.2) && !taken.has(best.m.id)) {
      taken.add(best.m.id);
      out.push({ id: best.m.id, countywide: best.m.id.startsWith('county-'), result });
    }
  }
  return out;
}

/** Several parts' counts of one contest (Chicago's and the suburbs'), added up. */
export function sumResults(list) {
  if (list.length === 1) return list[0];
  const sum = (k) => list.reduce((s, r) => s + (r[k] ?? 0), 0);
  if ('yes' in list[0]) return { reporting: sum('reporting'), precincts: sum('precincts'), yes: sum('yes'), no: sum('no') };
  const votes = {};
  for (const r of list) for (const [k, v] of Object.entries(r.votes)) votes[k] = (votes[k] ?? 0) + v;
  const writeIn = sum('writeIn');
  return { reporting: sum('reporting'), precincts: sum('precincts'), total: sum('total'), votes, ...(writeIn ? { writeIn } : {}) };
}
