// Election results for a state's landing page (src/results.tsx): reads the
// state's official results (scripts/results/<state>.mjs), matches each contest
// to our race, judge retention or ballot question, and writes
// src/data/<state>/results.json.
//
// A state's reader returns one or more parts, each a source's contests and
// which of our races it may count (Illinois: the State Board's official
// statewide totals for statewide and district races; Chicago's and suburban
// Cook's unofficial counts for the county's own races). A race counted in
// several parts of one area (Chicago + suburbs) is their sum; a countywide one
// needs all of them. Fail-soft: a source that can't be read keeps yesterday's
// results, and a read that matches too little of the ballot changes nothing.
// Usage: node scripts/results.mjs minnesota

import { readFileSync, writeFileSync } from 'node:fs';
import { combine } from './results/combine.mjs';

const YEAR = 2026;
const ADAPTERS = { minnesota: () => import('./results/minnesota.mjs'), illinois: () => import('./results/illinois.mjs') };
const state = process.argv[2];
if (!ADAPTERS[state]) { console.error(`No results reader for "${state}" (have: ${Object.keys(ADAPTERS).join(', ')})`); process.exit(1); }
const UA = 'Mozilla/5.0 (KnowYourBallot; +https://github.com/frankies2727/govbot-know-your-ballot)';
const FILE = new URL(`../src/data/${state}/results.json`, import.meta.url);

/** One gentle request: the body, and when the server says it last changed. */
async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  const modified = res.headers.get('last-modified');
  await new Promise((r) => setTimeout(r, 1500));
  return { text, modified: modified ? new Date(modified).toISOString() : null };
}

const ballot = JSON.parse(readFileSync(new URL(`../src/data/${state}/ballot.json`, import.meta.url), 'utf8'));
let old = { races: {} };
try { old = JSON.parse(readFileSync(FILE, 'utf8')); } catch { /* first run */ }

const adapter = await ADAPTERS[state]();
const read = await adapter.read(get, YEAR);
if (!read) { console.log('No results published yet; results.json left as it is.'); process.exit(0); }

const { races, questions } = combine(read, ballot);

const total = Object.keys(races).length + Object.keys(questions).length;
const before = Object.keys(old.races ?? {}).length + Object.keys(old.questions ?? {}).length;
if (total < before * 0.8) { console.warn(`Only ${total} results against ${before} yesterday; results left as they were.`); process.exit(0); }

const used = [...new Map(read.parts.map((p) => [p.source.name, p.source])).values()];
const asOf = read.parts.map((p) => p.asOf).filter(Boolean).sort().pop() ?? old.asOf ?? null;
const next = {
  sources: used,
  asOf,
  races: { ...old.races, ...races },
  ...(Object.keys(questions).length || old.questions ? { questions: { ...old.questions, ...questions } } : {}),
  ...(read.gaps ? { gaps: read.gaps } : {}),
};
if (JSON.stringify(next) === JSON.stringify(old)) console.log('No results changes.');
else { writeFileSync(FILE, `${JSON.stringify(next, null, 1)}\n`); console.log(`results.json updated: ${Object.keys(next.races).length} races, ${Object.keys(next.questions ?? {}).length} yes/no questions`); }
