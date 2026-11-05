// Matching an election office's results to our races: by who's running, not
// by office titles (each source spells those its own way). A person is their
// first and last name ("Sarah E. Hennesy" and "Sarah Hennesy" are one), a
// ticket each of its people ("Amy Klobuchar & Ben Schierer" / "Amy Klobuchar
// and Ben Schierer"). Where the first names differ (Ron and Ronald, George
// "Chip" and Chip, Julie Vossen-Henslin and Julie Henslin) the race is found
// by its last names alone (a hyphenated one by its last part), when exactly
// one race has those. Pure functions, tested in match.test.mjs.

const SUFFIX = /^(jr|sr|ii|iii|iv|v)$/;

/** "Sarah E. Hennesy" → "sarah hennesy"; a ticket → each person, joined. With `last`, last names only: "hennesy". */
export function personKey(name, last = false) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/\s+(?:&|and)\s+/)
    .map((one) => {
      const words = one.replace(/["“”(][^"“”)]*["“”)]/g, ' ').replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(Boolean).filter((w) => !SUFFIX.test(w));
      // Last names alone compare their last part: "Vossen-Henslin" is "henslin".
      if (last || words.length < 2) return (words[words.length - 1] ?? '').split('-').pop();
      return `${words[0]} ${words[words.length - 1]}`;
    })
    .join(' & ');
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
    const race = full.get(key(false)) ?? lastOnly.get(key(true));
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
