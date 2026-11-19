// Ballot numbers for a later guide's races, and picks that don't move.
//
// A voter's pick is saved as the candidate's `ballot` id, so that id must stay
// the same person from build to build: it is carried over by name from the
// last build (a newcomer gets the next unused id). The official ballot
// position, once there is one, is `position`, and the race is `numbered`. It
// comes from either:
//   - the race's own source, when it already prints ballot numbers (Chicago's
//     Board list once certified, Wisconsin's Commission list): those scripts
//     set `numbered` and put the number in `ballot`;
//   - or scripts/<guide>/ballot-order.json, { "<race id>": ["<name>", ...] }
//     in the certified ballot's order, for a guide whose source has no order
//     (filled in from the election authority's certified list when it's out).
// A race is numbered only when every candidate on it has a position.

import { existsSync, readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function settleBallots(races, prev, guide) {
  const file = new URL(`scripts/${guide}/ballot-order.json`, ROOT);
  const order = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  for (const r of races) {
    // 1. The official position, if known.
    let positions = null;
    if (r.numbered) positions = r.candidates.map((c) => c.ballot);
    else if (Array.isArray(order[r.id]) && r.candidates.length) {
      const at = r.candidates.map((c) => order[r.id].findIndex((n) => same(n, c.name)) + 1);
      if (at.every((n) => n > 0)) positions = at;
    }
    // 2. Each person keeps the pick id they had (by name); a newcomer gets the next free one.
    const before = prev?.races?.find((x) => x.id === r.id)?.candidates ?? [];
    const was = new Map(r.candidates.map((c) => [c.ballot, c]));
    const taken = new Set();
    let next = Math.max(0, ...before.map((c) => c.ballot)) + 1;
    const ids = r.candidates.map((c) => {
      const old = before.find((b) => same(b.name, c.name))?.ballot;
      const id = old != null && !taken.has(old) ? old : next++;
      taken.add(id);
      return id;
    });
    const remap = new Map(r.candidates.map((c, i) => [c.ballot, ids[i]]));
    r.candidates.forEach((c, i) => {
      c.ballot = ids[i];
      if (positions) c.position = positions[i]; else delete c.position;
    });
    if (positions) {
      r.numbered = true;
      r.candidates.sort((a, b) => a.position - b.position);
    }
    // 3. A seat holder who's running points at their (new) pick id.
    for (const i of r.incumbents ?? []) if (i.ballot != null && was.has(i.ballot)) i.ballot = remap.get(i.ballot);
  }
}
