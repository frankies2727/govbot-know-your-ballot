// An official candidate list laid over the races Ballotpedia gave us: the
// state's own list decides who is on the ballot, Ballotpedia's spelling of a
// name is kept when it is the same person (every later step — profiles,
// photos, money, yesterday's data — keys on that spelling), someone the
// state lists and Ballotpedia doesn't is added, and someone Ballotpedia
// lists but the state doesn't is dropped (a renamed person keeps Ballotpedia's
// spelling as `aka`, so the audit still knows their profile page is theirs).
// `byRace` maps a race id to [{ name, party }] as the state publishes them.
import { parts, sameName } from './money-names.mjs';

const first = (n) => parts(n)[0] ?? '';
const last = (n) => parts(n).at(-1) ?? '';
/** The same person written two ways ("Tim Walz" / "Timothy J. Walz"); a one-word name ("Rocco") must match exactly. */
const samePerson = (a, b) => {
  if (parts(a).length < 2 || parts(b).length < 2) return last(a) === last(b) && (parts(a).length < 2 || parts(b).length < 2);
  return sameName(a, first(b), last(b)) || sameName(b, first(a), last(a));
};
/** A filing's name as the ballot prints it: the state's file prefixes a one-word name with "_ ". */
const clean = (n) => n.replace(/^[_\s]+/, '').trim();

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
    const pending = [];
    for (const o of official.map((x) => ({ ...x, name: clean(x.name) }))) {
      const ours = race.candidates.find((c) => !used.has(c) && samePerson(c.name, o.name));
      if (ours) { used.add(ours); kept.push(ours); } else pending.push(o);
    }
    for (const o of pending) {
      // The ballot name differs from Ballotpedia's beyond a nickname ("Liish" / "Alicia Kozlowski",
      // "LS Rusty Nelson" / "Rusty Nelson"): the one unmatched person of that surname and party on
      // each side is the same person. The ballot's name wins; their profile and incumbency carry over.
      const ours = race.candidates.filter((c) => !used.has(c) && last(c.name) === last(o.name) && c.party === o.party);
      const theirs = pending.filter((x) => last(x.name) === last(o.name) && x.party === o.party);
      if (ours.length === 1 && theirs.length === 1) {
        used.add(ours[0]); kept.push({ ...ours[0], name: o.name, aka: ours[0].name });
        log.push(`${race.office} | ${ours[0].name}: the state lists them as ${o.name}; renamed`);
      } else { kept.push({ name: o.name, party: o.party }); added++; log.push(`${race.office} | ${o.name} (${o.party}): on the state's list, not Ballotpedia's; added`); }
    }
    for (const c of race.candidates) if (!used.has(c)) { dropped++; log.push(`${race.office} | ${c.name}: on Ballotpedia's list, not the state's; dropped`); }
    // The guide's own order (its party order, then name) stays; someone new goes last.
    const at = (c) => { const i = race.candidates.indexOf(c); return i < 0 ? Infinity : i; };
    const was = new Map(kept.map((c) => [c, at(race.candidates.find((x) => x.name === c.name || x === c) ?? c)]));
    race.candidates = kept.sort((a, b) => (was.get(a) ?? Infinity) - (was.get(b) ?? Infinity)).map((c, i) => ({ ...c, ballot: i + 1 }));
  }
  return { covered, added, dropped, log };
}
