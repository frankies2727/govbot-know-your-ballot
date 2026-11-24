// node --test: how an alderperson's City Council record is counted (scripts/chicago-2027/council.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attendance, budgetVote, dividedFor, dividedRoll, emptyCache, statusOf, summarize } from './council.mjs';

test('a filing’s status in plain words', () => {
  assert.equal(statusOf({ status: '90-Final', subStatus: 'Passed as Substitute' }), 'Passed');
  assert.equal(statusOf({ status: '90-Final', subStatus: 'Adopted' }), 'Passed');
  assert.equal(statusOf({ status: '90-Final', subStatus: 'Input to Substitute' }), 'Folded into a substitute');
  assert.equal(statusOf({ status: '4-In Committee', subStatus: 'Referred' }), 'In committee');
  assert.equal(statusOf({ status: '90-Final', subStatus: '99-Withdrawn' }), 'Withdrawn');
});

test('filings sort into city law, resolutions and ward matters; honors are counted but not listed', () => {
  const m = (type, matterCategory, subStatus = 'Passed', introductionDate = '2026-01-01') => ({ matterId: Math.random().toString(), recordNumber: matterCategory, type, matterCategory, status: '90-Final', subStatus, introductionDate, title: matterCategory });
  const s = summarize([
    m('Ordinance', 'MUNICIPAL CODE AMENDMENTS | 4-60-022 Liquor Dealers'),
    m('Ordinance', 'MUNICIPAL CODE AMENDMENTS', 'Referred'),
    m('Resolution', 'COMMITTEE/PUBLIC HEARINGS', 'Adopted', '2026-02-01'),
    m('Resolution', 'COMMENDATIONS & DECLARATIONS'),
    m('Order', 'SIGNS/SIGNBOARDS'), m('Order', 'SIGNS/SIGNBOARDS'), m('Order', 'VARIOUS - PARKING'), m('Order', 'PARKING'),
  ]);
  assert.deepEqual([s.total, s.law, s.lawPassed, s.resolutions, s.ward], [8, 2, 1, 2, 4]);
  assert.deepEqual(s.wardKinds, [{ kind: 'signs', n: 2 }, { kind: 'parking', n: 2 }]);
  assert.equal(s.recent.length, 3); // two code changes and the hearing; the commendation isn't listed
  assert.equal(s.recent[0].id, 'COMMITTEE/PUBLIC HEARINGS'); // newest first
});

test('attendance counts only meetings whose roll call lists the member', () => {
  const a = attendance([
    { attendance: [{ name: 'Global Attendance', votes: [{ personId: 'A', vote: 'Present' }, { personId: 'B', vote: 'Absent' }] }] },
    { attendance: [{ name: 'Call To Order', votes: [{ personId: 'A', vote: 'Absent' }] }] },
  ]);
  assert.deepEqual(a.get('A'), { present: 1, meetings: 2 });
  assert.deepEqual(a.get('B'), { present: 0, meetings: 1 });
});

test('a budget vote is the Council’s passing roll call on the budget, by its title', () => {
  const votes = Array.from({ length: 50 }, (_, i) => ({ personId: `p${i}`, vote: i < 27 ? 'Yea' : 'Nay' }));
  const b = budgetVote({ matterId: 'X', title: 'Annual Appropriation Ordinance Year 2025, as amended', actions: [
    { actionByName: 'Committee on Budget and Government Operations', actionName: 'Recommended to Pass', votes: [] },
    { actionByName: 'City Council', actionName: 'Passed', votes },
  ] });
  assert.equal(b.year, 2025); assert.equal(b.tally, '27–23'); assert.equal(b.votes.get('p30'), 'Nay');
  assert.equal(budgetVote({ matterId: 'Y', title: 'Annual Appropriation Ordinance Year 2024 amendment within Fund No. 925', actions: [] }), null);
});

test('only a roll call with a Nay counts as divided', () => {
  const c = emptyCache();
  assert.equal(dividedRoll(c, [{ personId: 'A', vote: 'Yea' }, { personId: 'B', vote: 'Not Voting' }]), null);
  const d = dividedRoll(c, [{ personId: 'A', vote: 'Yea' }, { personId: 'B', vote: 'Nay' }, { personId: 'C', vote: 'Not Voting' }]);
  assert.deepEqual(d, { y: [0], n: [1], o: [2] });
  assert.deepEqual(c.people, ['A', 'B', 'C']);
});

test('divided votes: with the majority, Nays, and the newest first', () => {
  const c = emptyCache();
  const add = (key, date, yea, nay) => { c.divided[key] = { d: date, id: key, t: `Item ${key}`, r: yea.length > nay.length ? 'Passed' : 'Failed to Pass', ...dividedRoll(c, [...yea.map((p) => ({ personId: p, vote: 'Yea' })), ...nay.map((p) => ({ personId: p, vote: 'Nay' }))]) }; };
  add('m1|X', '2026-01-10', ['A', 'B', 'C'], ['D']);
  add('m2|Y', '2026-03-10', ['A'], ['B', 'C', 'D']);
  const a = dividedFor(c, 'A');
  assert.deepEqual([a.total, a.withMajority, a.nays], [2, 1, 0]);
  assert.equal(a.recent[0].date, '2026-03-10');
  assert.equal(a.recent[0].tally, '1–3');
  assert.ok(a.recent[0].url.endsWith('Y'));
  assert.deepEqual([dividedFor(c, 'D').nays, dividedFor(c, 'Z').total], [2, 0]);
});

