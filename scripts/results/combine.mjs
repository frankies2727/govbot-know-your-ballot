// Putting a state's parts together (scripts/results.mjs): each part's contests
// matched to the races, retentions and questions it may count; an item counted
// in several parts of one area summed, a countywide one only when every part
// has it; an official count preferred over unofficial ones.

import { matchContests, matchQuestions, sumResults, toResult } from './match.mjs';

const yesNo = (c) => c.rows.length === 2 && c.rows.every((r) => /^(yes|no)$/i.test(r.name.trim()));

/** { races, questions }: each matched item's result, by id. */
export function combine(read, ballot, log = console) {
  // Each part's matches: race or question id → { result, part }.
  const found = new Map();
  const add = (id, item, part, result) => { if (!found.has(id)) found.set(id, { item, pieces: [] }); found.get(id).pieces.push({ part, result }); };
  for (const part of read.parts) {
    const races = ballot.races.filter(part.races);
    const { matched, unmatched } = matchContests(part.contests.filter((c) => !yesNo(c)), races);
    for (const { race, contest } of matched) add(race.id, { race }, part, toResult(race, contest));
    const questions = matchQuestions(part.contests.filter(yesNo), ballot.retentions ?? [], ballot.measures ?? []);
    for (const q of questions) add(q.id, { countywide: q.countywide }, part, q.result);
    log.log(`${part.source.name}: ${part.contests.length} contests, ${matched.length} races and ${questions.length} yes/no questions matched${unmatched.length ? `; ${unmatched.length} contests not on our ballot or not matched` : ''}`);
  }

  const races = {};
  const questions = {};
  for (const [id, { item, pieces }] of found) {
    const official = pieces.find((p) => p.part.official);
    let result;
    if (official) result = { ...official.result, official: true };
    else {
      // The parts that together make one area (Chicago + suburbs): a countywide item needs every one.
      const keys = new Set(pieces.map((p) => p.part.key));
      if (read.needsAll?.(item) && read.together && !read.together.every((k) => keys.has(k))) { log.warn(`${id}: not in every part of the county, left out`); continue; }
      result = sumResults(pieces.map((p) => p.result));
    }
    (item.race ? races : questions)[id] = result;
  }

  return { races, questions };
}
