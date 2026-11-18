// The hand-read part of a later guide's candidate cards: each candidate's
// (and each seat holder's) brief, campaign site and accounts, and photo.
//
// scripts/<guide>/briefs.json, keyed "<race id>|<name>": what their own pages
// and the press say, read by hand (neutral, every line with its source, quotes
// word for word, checked against the page). A seat holder's brief shows under
// "In office now" when nobody has filed for the seat, or they aren't running.
// scripts/<guide>/photos-chosen.json and holder-photos-chosen.json: photos
// picked from any source, always credited (./illinois/photos.mjs fetches them).
// Seat holders' photos sit in their own folder, since addPhotos sweeps its folder.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { addPhotos } from './illinois/photos.mjs';

const ROOT = new URL('../', import.meta.url);
const read = (url) => (existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : {});
const https = (u) => typeof u === 'string' && /^https:\/\//.test(u);

/**
 * Attach sites and accounts, and write the briefs of everyone on the ballot to
 * src/data/<guide>/briefs.json: the guide's own download, fetched after the page
 * shows (src/briefs.ts). Returns the briefs.json keys that match nobody (renamed or gone).
 */
export function applyBriefs(races, guide) {
  const briefs = read(new URL(`scripts/${guide}/briefs.json`, ROOT));
  const out = {};
  for (const r of races) {
    const people = [...r.candidates, ...(r.incumbents ?? []).filter((i) => i.ballot === undefined)];
    for (const p of people) {
      const key = `${r.id}|${p.name}`;
      const b = briefs[key];
      if (!b) continue;
      out[key] = { facts: b.facts ?? [], priorities: b.priorities ?? [], quotes: b.quotes ?? [], sources: b.sources ?? [], asOf: b.asOf };
      if (!r.candidates.includes(p)) continue; // a holder's card shows only the brief and photo
      if (https(b.website) && !p.website) p.website = b.website;
      const social = Object.fromEntries(Object.entries(b.social ?? {}).filter(([, u]) => https(u)));
      if (Object.keys(social).length) p.social = { ...social, ...p.social };
    }
  }
  writeFileSync(new URL(`src/data/${guide}/briefs.json`, ROOT), JSON.stringify(out));
  return Object.keys(briefs).filter((k) => !(k in out));
}

/** Seat holders' photos (those not on the candidate list), from holder-photos-chosen.json. */
export async function addHolderPhotos(races, guide, prev) {
  const holders = races.map((r) => ({ id: r.id, candidates: (r.incumbents ?? []).filter((i) => i.ballot === undefined) }));
  const prevHolders = prev && { races: prev.races.map((r) => ({ id: r.id, candidates: r.incumbents ?? [] })) };
  return addPhotos(holders, {
    dir: new URL(`public/kyb-photos/${guide}-office/`, ROOT).pathname,
    publicPath: `kyb-photos/${guide}-office`,
    prev: prevHolders,
    chosen: new URL(`scripts/${guide}/holder-photos-chosen.json`, ROOT),
  });
}

/** Candidates' photos from photos-chosen.json, for a guide with no other photo source. */
export function addCandidatePhotos(races, guide, prev) {
  return addPhotos(races, {
    dir: new URL(`public/kyb-photos/${guide}/`, ROOT).pathname,
    publicPath: `kyb-photos/${guide}`,
    prev,
    chosen: new URL(`scripts/${guide}/photos-chosen.json`, ROOT),
  });
}
