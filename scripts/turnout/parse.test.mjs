// node --test: the turnout readers against excerpts of the real pages (Nov. 4–5, 2026).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { check, labCsv, labRows, labUpdated, minnesota } from './parse.mjs';

const LAB_PAGE = `<p><strong>Last updated:</strong> Nov. 4 @ 9:50pm</p>
<script>document.addEventListener('DOMContentLoaded', () => { createCsvTable('csvtable-x', {"csvfile":"turnoutdata\\/Turnout_2026G_v0.2.csv","columns":["STATE"]}); });</script>`;
const LAB_CSV = `STATE,STATE_ABV,TOTAL_BALLOTS_COUNTED,SOURCE,VAP,NONCITIZEN_PCT,INELIGIBLE_PRISON,INELIGIBLE_PROBATION,INELIGIBLE_PAROLE,INELIGIBLE_FELONS_TOTAL,ELIGIBLE_OVERSEAS,VEP,VEP_TURNOUT_RATE,VAP_TURNOUT_RATE
Illinois,IL,4300000,Initial Estimate,"10,171,209",8.20%,"29,078",0,0,"29,078",,"9,308,092",46.20%,42.28%
Michigan,MI,4962000,Initial Estimate,"8,128,616",3.70%,"32,602",0,0,"32,602",,"7,795,255",63.65%,61.04%
Minnesota,MN,2870000,Initial Estimate,"4,601,709",4.10%,"8,383",0,0,"8,383",,"4,404,656",65.16%,62.37%
Wisconsin,WI,2760000,Initial Estimate,"4,791,126",3.10%,"21,985","23,580","22,240","67,805",,"4,574,796",60.33%,57.61%
`;
const MN_PAGE = `<h1>Unofficial Results</h1><span><span>Eligible Population:</span>&nbsp;4,404,656</span>
<span><span>Estimated Voters:</span>&nbsp;2,842,099</span><span><span>Estimated Turnout:</span>&nbsp;64.52%</span>
<span><span>Voters Registered at 7AM:</span>&nbsp; 3,927,901</span><table><th>Voters Registered at 7AM</th></table>`;

test('the Lab page names its CSV, its version and when it was updated', () => {
  assert.deepEqual(labCsv(LAB_PAGE, 2026), { file: 'Turnout_2026G_v0.2.csv', version: 0.2 });
  assert.equal(labCsv(LAB_PAGE, 2028), null);
  assert.equal(labUpdated(LAB_PAGE, 2026), '2026-11-04');
});

test("the Lab's rows for our four states", () => {
  const rows = labRows(LAB_CSV);
  assert.deepEqual(rows.illinois, { ballots: 4300000, eligible: 9308092, pct: 46.2, estimate: true });
  assert.deepEqual(rows.wisconsin, { ballots: 2760000, eligible: 4574796, pct: 60.33, estimate: true });
  // A state the Lab hasn't estimated yet is null; a missing state or column throws.
  assert.equal(labRows(LAB_CSV.replace('4300000,Initial Estimate', ',')).illinois, null);
  assert.throws(() => labRows(LAB_CSV.replace(/^Wisconsin.*$/m, '')), /no row for Wisconsin/);
  assert.throws(() => labRows(LAB_CSV.replace('VEP_TURNOUT_RATE', 'RATE')), /no VEP_TURNOUT_RATE column/);
});

test("Minnesota's statewide statistics", () => {
  assert.deepEqual(minnesota(MN_PAGE), { ballots: 2842099, eligible: 4404656, pct: 64.52, registered: 3927901, unofficial: true });
  assert.equal(minnesota('<p>Please complete the security check</p>'), null);
});

test('a figure far from four years before is a bad read', () => {
  const cycles = [{ year: 2022, ballots: 4144125, eligible: 9019092, pct: 45.95 }];
  assert.doesNotThrow(() => check('illinois', { ballots: 4300000, eligible: 9308092, pct: 46.2 }, cycles, 2026));
  assert.throws(() => check('illinois', { ballots: 430000, eligible: 9308092, pct: 4.6 }, cycles, 2026), /out of range/);
  assert.throws(() => check('illinois', { ballots: 1900000, eligible: 9308092, pct: 20.4 }, cycles, 2026), /ballots/);
});
