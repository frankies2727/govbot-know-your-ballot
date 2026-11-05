// Refreshes the election year's turnout in src/data/turnout.json (the home
// page's panels, src/Turnout.tsx) while the count is being canvassed: the
// University of Florida Election Lab's figures for every state (its year page
// names the CSV it loads, which is versioned as the Lab revises it), and
// Minnesota's own count from the Secretary of State, which the page prefers.
// Earlier elections are left as they are. Fail-soft: a source that can't be
// read, or a figure that looks wrong, keeps yesterday's numbers for it.
// Run daily by .github/workflows/know-your-ballot-illinois.yml.

import { readFileSync, writeFileSync } from 'node:fs';
import { check, labCsv, labRows, labUpdated, minnesota } from './turnout/parse.mjs';

const YEAR = 2026;
const FILE = new URL('../src/data/turnout.json', import.meta.url);
const LAB = `https://election.lab.ufl.edu/${YEAR}-general-election-turnout/`;
const LAB_CSV = 'https://election.lab.ufl.edu/data-downloads/turnoutdata/';
const MN = 'https://electionresults.sos.state.mn.us/Results/CountyStatisticsStatewide/Index?ersElectionId=201';
const UA = 'Mozilla/5.0 (KnowYourBallot; +https://github.com/frankies2727/govbot-know-your-ballot)';

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

const doc = JSON.parse(readFileSync(FILE, 'utf8'));
const cycle = (id) => doc.states[id].cycles.find((c) => c.year === YEAR);
let changed = false;
/** Put `next` in place of the state's entry for the year, if it differs. */
function put(id, next) {
  const cycles = doc.states[id].cycles;
  const i = cycles.findIndex((c) => c.year === YEAR);
  if (JSON.stringify(cycles[i]) === JSON.stringify(next)) return;
  cycles[i] = next;
  changed = true;
}

try {
  const page = await get(LAB);
  const csv = labCsv(page, YEAR);
  if (!csv) throw new Error(`the ${YEAR} page names no CSV`);
  const rows = labRows(await get(LAB_CSV + csv.file));
  for (const [id, row] of Object.entries(rows)) {
    const c = cycle(id);
    if (!row || c.state) continue; // not estimated yet, or the state's own count is shown
    try {
      check(id, row, doc.states[id].cycles, YEAR);
      put(id, { year: YEAR, ballots: row.ballots, eligible: row.eligible, pct: row.pct, ...(csv.version < 1 ? { preliminary: true } : {}), ...(row.estimate ? { estimate: true } : {}) });
    } catch (e) { console.warn(`Kept yesterday's figures: ${e.message}`); }
  }
  const updated = labUpdated(page, YEAR);
  if (updated && updated !== doc.asOf) { doc.asOf = updated; changed = true; }
  console.log(`Election Lab: ${csv.file}${updated ? `, updated ${updated}` : ''}`);
} catch (e) {
  console.warn(`Election Lab not read, keeping yesterday's figures: ${e.message}`);
}

try {
  const mn = minnesota(await get(MN));
  if (!mn) throw new Error('no statewide figures on the page (a bot check?)');
  const c = cycle('minnesota');
  check('minnesota', mn, doc.states.minnesota.cycles, YEAR);
  put('minnesota', { year: YEAR, ballots: mn.ballots, eligible: mn.eligible, pct: mn.pct, ...(mn.unofficial ? { preliminary: true } : {}), registered: mn.registered ?? c.registered ?? null, regPct: null, state: true });
  console.log(`Minnesota: ${mn.ballots.toLocaleString('en-US')} voters, ${mn.pct}%${mn.unofficial ? ' (unofficial)' : ''}`);
} catch (e) {
  console.warn(`Minnesota not read, keeping yesterday's figures: ${e.message}`);
}

if (changed) { writeFileSync(FILE, `${JSON.stringify(doc, null, 1)}\n`); console.log('turnout.json updated'); } else console.log('No turnout changes.');
