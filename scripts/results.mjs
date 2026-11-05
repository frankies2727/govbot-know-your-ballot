// Election results for a state's landing page (src/results.tsx): reads the
// state's official results files, matches each contest to our race by who's
// running, and writes src/data/<state>/results.json. Fail-soft: a file that
// can't be read keeps yesterday's results for its races, and a run that
// matches too little of the ballot (a reformatted file) changes nothing.
// Usage: node scripts/results.mjs minnesota

import { readFileSync, writeFileSync } from 'node:fs';
import { matchContests, toResult } from './results/match.mjs';

const ADAPTERS = { minnesota: () => import('./results/minnesota.mjs') };
const state = process.argv[2];
if (!ADAPTERS[state]) { console.error(`No results reader for "${state}" (have: ${Object.keys(ADAPTERS).join(', ')})`); process.exit(1); }
const UA = 'Mozilla/5.0 (KnowYourBallot; +https://github.com/frankies2727/govbot-know-your-ballot)';
const FILE = new URL(`../src/data/${state}/results.json`, import.meta.url);

const { SOURCE, BASE, FILES, parse } = await ADAPTERS[state]();
const races = JSON.parse(readFileSync(new URL(`../src/data/${state}/ballot.json`, import.meta.url), 'utf8')).races;
let old = { races: {} };
try { old = JSON.parse(readFileSync(FILE, 'utf8')); } catch { /* first run */ }

const contests = [];
let newest = null;
for (const name of FILES) {
  try {
    // One file at a time, with a pause: a gentle reader of a public server.
    const res = await fetch(`${BASE}${name}.txt`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    contests.push(...parse(await res.text()));
    const modified = res.headers.get('last-modified');
    if (modified && (!newest || new Date(modified) > newest)) newest = new Date(modified);
    await new Promise((r) => setTimeout(r, 1500));
  } catch (e) { console.warn(`${name}: not read (${e.message}); its races keep yesterday's results`); }
}

const { matched, unmatched } = matchContests(contests, races);
console.log(`${contests.length} contests read, ${matched.length} matched to our ${races.length} races`);
if (unmatched.length) console.log(`Not on our ballot or not matched: ${unmatched.slice(0, 12).join('; ')}${unmatched.length > 12 ? ` … (${unmatched.length})` : ''}`);
if (matched.length < races.length * 0.5) { console.warn('Too few matches to trust this read; results left as they were.'); process.exit(0); }

const next = {
  source: SOURCE,
  asOf: newest ? newest.toISOString() : old.asOf ?? null,
  official: false,
  races: { ...old.races, ...Object.fromEntries(matched.map(({ race, contest }) => [race.id, toResult(race, contest)])) },
};
if (JSON.stringify(next) === JSON.stringify(old)) console.log('No results changes.');
else { writeFileSync(FILE, `${JSON.stringify(next, null, 1)}\n`); console.log(`results.json updated (${Object.keys(next.races).length} races)`); }
