// node --test: matching results to races, and reading Minnesota's results files (lines from the Nov. 5, 2026 files).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchContests, personKey, toResult } from './match.mjs';
import { parse } from './minnesota.mjs';

const MN = `MN;;;0331;Governor & Lt Governor;;0901;Steven Young and Jane Kirby;;;GP;4105;4105;51403;1.82;2830147
MN;;;0331;Governor & Lt Governor;;0402;Amy Klobuchar and Ben Schierer;;;DFL;4105;4105;1569695;55.46;2830147
MN;;;0331;Governor & Lt Governor;;0303;Lisa Demuth and Ryan Wilson;;;R;4105;4105;1206575;42.63;2830147
MN;;;0331;Governor & Lt Governor;;9901;WRITE-IN;;;WI;4105;4105;2474;0.09;2830147
MN;;;0188;State Representative District 16B;16B;0301;Dave Baker;;;R;20;20;12694;67.12;18911
MN;;;0188;State Representative District 16B;16B;0402;Julie Henslin;;;DFL;20;20;6207;32.82;18911
MN;;;0188;State Representative District 16B;16B;9901;WRITE-IN;;;WI;20;20;10;0.05;18911
MN;;;0300;Attorney General;;0402;Keith Ellison;;;DFL;4105;3990;1500000;52.00;2884615
MN;;;0300;Attorney General;;0301;Ronald J. Schutz;;;R;4105;3990;1384615;48.00;2884615`;

const races = [
  { id: 'governor', candidates: [{ ballot: 1, name: 'Amy Klobuchar & Ben Schierer' }, { ballot: 2, name: 'Lisa Demuth & Ryan Wilson' }, { ballot: 3, name: 'Steven Young & Jane Kirby' }] },
  { id: 'sldl-16b', candidates: [{ ballot: 1, name: 'Julie Vossen-Henslin' }, { ballot: 2, name: 'Dave Baker' }] },
  { id: 'attorney-general', candidates: [{ ballot: 1, name: 'Keith Ellison' }, { ballot: 2, name: 'Ron Schutz' }] },
];

test('a person is their first and last name; a ticket, the person at its head', () => {
  assert.equal(personKey('Sarah E. Hennesy'), personKey('Sarah Hennesy'));
  assert.equal(personKey('Amy Klobuchar & Ben Schierer'), personKey('Amy Klobuchar and Ben Schierer'));
  assert.equal(personKey('JB Pritzker & Christian Mitchell'), personKey('JB PRITZKER'));
  assert.equal(personKey('Steven Q. McKenzie'), personKey('STEVEN Q. McKENZIE'));
  assert.equal(personKey('Allan Kehr II'), 'allan kehr');
  assert.equal(personKey('George "Chip" Tangen', true), personKey('Chip Tangen', true));
  assert.equal(personKey('Julie Vossen-Henslin', true), 'henslin');
});

test("Minnesota's files: one contest per office and district, write-ins marked", () => {
  const contests = parse(MN);
  assert.equal(contests.length, 3);
  assert.deepEqual({ ...contests[0], rows: contests[0].rows.length }, { office: 'Governor & Lt Governor', district: '', reporting: 4105, precincts: 4105, total: 2830147, rows: 4 });
  assert.equal(contests[0].rows[3].writeIn, true);
});

test('contests find their races by who is running, nicknames and hyphenated names included', () => {
  const { matched, unmatched } = matchContests(parse(MN), races);
  assert.deepEqual(matched.map((m) => m.race.id), ['governor', 'sldl-16b', 'attorney-general']);
  assert.deepEqual(unmatched, []);
  assert.deepEqual(toResult(matched[0].race, matched[0].contest), { reporting: 4105, precincts: 4105, total: 2830147, votes: { 1: 1569695, 2: 1206575, 3: 51403 }, writeIn: 2474 });
  assert.deepEqual(toResult(matched[1].race, matched[1].contest).votes, { 1: 6207, 2: 12694 });
});

test('two races with the same people match neither', () => {
  const twins = [races[0], { ...races[0], id: 'governor-copy' }];
  assert.deepEqual(matchContests(parse(MN), twins).matched.map((m) => m.race.id), []);
});
