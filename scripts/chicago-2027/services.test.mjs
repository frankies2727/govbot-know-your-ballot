// Offline tests for the 311 ward numbers (scripts/chicago-2027/services.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { servicesFrom, servicesQueries, SKIP_TYPES } from './services.mjs';

const wards = Array.from({ length: 50 }, (_, i) => String(i + 1));
const rows = (f) => wards.map((w) => ({ ward: w, n: String(f(+w)) }));

test('queries cover the last 365 days and leave out non-service records', () => {
  const q = servicesQueries('2026-11-26');
  const where = (u) => new URLSearchParams(u.split('?')[1]).get('$where');
  assert.equal(q.since, '2025-11-26');
  for (const t of SKIP_TYPES) assert.ok(where(q.filed).includes(`'${t}'`));
  assert.ok(where(q.old).includes("status = 'Open' AND created_date < '2026-08-28T00:00:00'"));
});

test('per-ward counts, top three types and the median ward', () => {
  const types = [
    { ward: '32', sr_type: 'Pothole in Street Complaint', n: '20' },
    { ward: '32', sr_type: 'Graffiti Removal Request', n: '50' },
    { ward: '32', sr_type: 'Tree Trim Request (NO LONGER BEING ACCEPTED)', n: '30' },
    { ward: '32', sr_type: 'Street Light Out Complaint', n: '5' },
  ];
  const s = servicesFrom({ filed: [...rows((w) => w * 10), { n: '999' }], open: rows((w) => w), old: rows(() => 1), types }, '2025-11-26');
  assert.deepEqual(s.wards['32'], { filed: 320, open: 32, old: 1, top: [
    { type: 'Graffiti Removal Request', n: 50 }, { type: 'Tree Trim Request', n: 30 }, { type: 'Pothole in Street Complaint', n: 20 }] });
  assert.deepEqual(s.median, { filed: 255, open: 26, old: 1 }); // rows without a ward are ignored
});

test('a partial answer fails loudly so yesterday\'s numbers are kept', () => {
  assert.throws(() => servicesFrom({ filed: rows(() => 1).slice(0, 40), open: [], old: [], types: [] }, '2025-11-26'), /40 of 50 wards/);
});
