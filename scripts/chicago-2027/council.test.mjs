// node --test: how an alderperson's City Council record is counted (scripts/chicago-2027/council.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attendance, budgetVote, statusOf, summarize } from './council.mjs';

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
