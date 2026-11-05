// node --test: Illinois' readers (Chicago's summary export, Cook's election-night page) and the
// matching rules they lean on, against excerpts of the real Nov. 5, 2026 files.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chicago, cook } from './illinois.mjs';
import { matchContests, matchQuestions, sumResults } from './match.mjs';

const CHICAGO = `2000010000101253008124215367080664621Senator, U.S.                                                         Don Tracy                                         Republican                                        REPFEDERAL                                           000020129101\n2000010000201253056370315367080664621Senator, U.S.                                                         Juliana Stratton                                  Democratic                                        DEMFEDERAL                                           000020129101\n2000010000301253000947515367080664621Senator, U.S.                                                         Whitfield Harrington Jr                           American Center Party                             AMCFEDERAL                                           000020129101\n2001330020601253040828215367080660131Lewis Nixon                                                           Yes                                                                                                    JUDICIAL CIRCUIT                                  000130129101\n2001330020701253012150915367080660131Lewis Nixon                                                           No                                                                                                     JUDICIAL CIRCUIT                                  000130129101\n2002180037600001000047000018630000597500+ employee corporate tax for social services W24 P05               Yes                                                                                                    SPECIAL REFERENDA 1                               000190000101`;

const COOK = `<h3>November 03, 2026 Gubernatorial General Election</h3><span>11/05/2026 01:58 PM</span>
<h5>Senator, U.S. - Vote For 1</h5><div>100%</div><div>1,430 of 1,430 Precincts Reported</div><div>Registered Voters:  1,750,625</div>
<td>Candidate Name</td><td>Votes</td><td>%</td>
<td>Don Tracy (Republican)</td><td>191,346</td><td>26.04%</td><td>Juliana Stratton (Democratic)</td><td>532,556</td><td>72.47%</td>
<td>Whitfield Harrington Jr (American Center Party)</td><td>10,913</td><td>1.49%</td>
<h5>Lewis Nixon - Vote For 1</h5><div>100%</div><div>1,430 of 1,430 Precincts Reported</div>
<td>Candidate Name</td><td>Votes</td><td>%</td><td>Yes </td><td>446,491</td><td>74.35%</td><td>No </td><td>154,071</td><td>25.65%</td>
<h5>Commissioner, Water Reclamation Dist - Vote For 3</h5><div>1,366 of 1,366 Precincts Reported</div>
<td>Candidate Name</td><td>Votes</td><td>%</td><td>Eira Lizeth Corral Sep&#250;lveda (Democratic)</td><td>419,651</td><td>23.66%</td>`;

test("Chicago's export: contests, precincts reporting, votes", () => {
  const c = chicago(CHICAGO);
  assert.equal(c.length, 3);
  assert.deepEqual({ office: c[0].office, reporting: c[0].reporting, precincts: c[0].precincts, votes: c[0].rows.map((r) => r.votes) },
    { office: 'Senator, U.S.', reporting: 1253, precincts: 1291, votes: [81242, 563703, 9475] });
  assert.deepEqual(c[1].rows.map((r) => [r.name, r.votes]), [['Yes', 408282], ['No', 121509]]);
  assert.equal(c[2].office, '500+ employee corporate tax for social services W24 P05');
});

test("Cook's page: contests, precincts, the update time, accented names", () => {
  const { contests, asOf } = cook(COOK);
  assert.equal(asOf, '2026-11-05T19:58:00.000Z');
  assert.deepEqual(contests.map((c) => c.office), ['Senator, U.S.', 'Lewis Nixon', 'Commissioner, Water Reclamation Dist']);
  assert.deepEqual(contests[0].rows.map((r) => [r.name, r.party, r.votes]), [['Don Tracy', 'Republican', 191346], ['Juliana Stratton', 'Democratic', 532556], ['Whitfield Harrington Jr', 'American Center Party', 10913]]);
  assert.equal(contests[2].rows[0].name, 'Eira Lizeth Corral Sepúlveda');
});

test('one unopposed candidate is matched by full name only, never by a shared surname', () => {
  const races = [{ id: 'judge-ross', candidates: [{ ballot: 1, name: 'Mary Smith' }] }];
  const contest = { office: 'State Representative, 15th District', rows: [{ name: 'John Smith', votes: 9, writeIn: false }] };
  assert.deepEqual(matchContests([contest], races).matched, []);
});

test('questions: a judge by name, a precinct question among its precinct', () => {
  const yesNo = chicago(CHICAGO).slice(1);
  const retentions = [{ id: 'retain-lewis-nixon', judge: 'Lewis Nixon' }];
  const measures = [
    { id: 'precinct-24-5-500-employee-corporate-tax', title: '500+ employee Corporate Tax for Youth Jobs and Social Services' },
    { id: 'precinct-24-6-500-employee-corporate-tax', title: '500+ employee Corporate Tax for Youth Jobs and Social Services' },
  ];
  assert.deepEqual(matchQuestions(yesNo, retentions, measures).map((q) => q.id), ['retain-lewis-nixon', 'precinct-24-5-500-employee-corporate-tax']);
});

test("a countywide count is Chicago's and the suburbs' added", () => {
  assert.deepEqual(sumResults([{ reporting: 1253, precincts: 1291, yes: 408282, no: 121509 }, { reporting: 1430, precincts: 1430, yes: 446491, no: 154071 }]),
    { reporting: 2683, precincts: 2721, yes: 854773, no: 275580 });
});
