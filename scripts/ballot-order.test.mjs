// node --test scripts/ballot-order.test.mjs — stable pick ids and official ballot numbers (scripts/ballot-order.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { settleBallots } from './ballot-order.mjs';

const race = (names, extra = {}) => ({ id: 'r', candidates: names.map((name, i) => ({ ballot: i + 1, name })), numbered: false, ...extra });
const prevOf = (cands) => ({ races: [{ id: 'r', candidates: cands }] });

test('a pick stays on the same person when someone ahead drops out', () => {
  const r = race(['Bea', 'Cy']); // Al withdrew: list order shifts up
  settleBallots([r], prevOf([{ ballot: 1, name: 'Al' }, { ballot: 2, name: 'Bea' }, { ballot: 3, name: 'Cy' }]), 'no-such-guide');
  assert.deepEqual(r.candidates.map((c) => [c.name, c.ballot]), [['Bea', 2], ['Cy', 3]]);
  assert.equal(r.numbered, false);
});

test('a newcomer gets the next unused id', () => {
  const r = race(['Al', 'Dee']);
  settleBallots([r], prevOf([{ ballot: 1, name: 'Al' }, { ballot: 2, name: 'Bea' }]), 'no-such-guide');
  assert.deepEqual(r.candidates.map((c) => c.ballot), [1, 3]);
});

test('a source that prints numbers sets positions, keeps ids, and re-points the running seat holder', () => {
  const r = race(['Cy', 'Al'], { numbered: true, incumbents: [{ name: 'Al', ballot: 2 }, { name: 'Old', note: 'retiring' }] }); // certified: Cy is #1, Al #2
  settleBallots([r], prevOf([{ ballot: 1, name: 'Al' }, { ballot: 2, name: 'Cy' }]), 'no-such-guide');
  assert.deepEqual(r.candidates.map((c) => [c.name, c.ballot, c.position]), [['Cy', 2, 1], ['Al', 1, 2]]);
  assert.equal(r.incumbents[0].ballot, 1);
  assert.equal(r.incumbents[1].ballot, undefined);
});

test('an order file numbers a race only when every candidate is on it', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, cpSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'bo-'));
  mkdirSync(join(dir, 'scripts', 'g'), { recursive: true });
  cpSync(new URL('./ballot-order.mjs', import.meta.url), join(dir, 'scripts', 'ballot-order.mjs'));
  writeFileSync(join(dir, 'scripts', 'g', 'ballot-order.json'), JSON.stringify({ r: ['Bea', 'al'], s: ['Zed'] }));
  const { settleBallots: settle } = await import(join(dir, 'scripts', 'ballot-order.mjs'));
  const r = race(['Al', 'Bea']);
  const s = { ...race(['Zed', 'Yan']), id: 's' };
  settle([r, s], null, 'g');
  assert.equal(r.numbered, true);
  assert.deepEqual(r.candidates.map((c) => [c.name, c.position]), [['Bea', 1], ['Al', 2]]);
  assert.equal(s.numbered, false); // Yan isn't on the list yet
  assert.equal(s.candidates[0].position, undefined);
});
