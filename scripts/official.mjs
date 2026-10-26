// An official candidate list laid over the races Ballotpedia gave us: the
// state's own list decides who is on the ballot, Ballotpedia's spelling of a
// name is kept when it is the same person (every later step — profiles,
// photos, money, yesterday's data — keys on that spelling), someone the
// state lists and Ballotpedia doesn't is added, and someone Ballotpedia
// lists but the state doesn't is dropped. `byRace` maps a race id to
// [{ name, party }] as the state publishes them.
import { parts, sameName } from './money-names.mjs';

const first = (n) => parts(n)[0] ?? '';
const last = (n) => parts(n).at(-1) ?? '';
/** The same person written two ways ("Tim Walz" / "Timothy J. Walz"). */
const samePerson = (a, b) => sameName(a, first(b), last(b)) || sameName(b, first(a), last(a));

/**
 * Apply the list. A race the list doesn't cover is left alone; a race the
 * list covers with nobody is left alone too (a filing gap, not an empty
 * ballot). Returns what changed, for the log.
 */
export function mergeOfficial(races, byRace) {
  const log = [];
  let covered = 0, added = 0, dropped = 0;
  for (const race of races) {
    const official = byRace.get(race.id);
    if (!official?.length) continue;
    covered++;
    const kept = [];
    const used = new Set();
    for (const o of official) {
      const ours = race.candidates.find((c) => !used.has(c) && samePerson(c.name, o.name));
      if (ours) { used.add(ours); kept.push(ours); }
      else { kept.push({ name: o.name, party: o.party }); added++; log.push(`${race.office} | ${o.name} (${o.party}): on the state's list, not Ballotpedia's; added`); }
    }
    for (const c of race.candidates) if (!used.has(c)) { dropped++; log.push(`${race.office} | ${c.name}: on Ballotpedia's list, not the state's; dropped`); }
    race.candidates = kept.map((c, i) => ({ ...c, ballot: i + 1 }));
  }
  return { covered, added, dropped, log };
}
