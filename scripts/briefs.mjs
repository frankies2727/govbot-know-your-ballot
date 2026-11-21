// The hand-read part of a later guide's candidate cards: each candidate's
// (and each seat holder's) brief, campaign site and accounts, and photo.
//
// scripts/<guide>/sites.json, keyed the same way: campaign sites and accounts
// found and checked by hand for candidates with none on record.
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
  const sites = read(new URL(`scripts/${guide}/sites.json`, ROOT));
  // { "<race id>|<name>": [{ endorser, kind, source, date? }] }: this race's endorsements, each checked against its page.
  const endorsed = read(new URL(`scripts/${guide}/endorsements.json`, ROOT));
  // { "<race id>|<name>": [{ backer, kind, wording, source, date? }] }: support short of an endorsement, in the source's words.
  const backed = read(new URL(`scripts/${guide}/support.json`, ROOT));
  const out = {};
  /** A campaign site and accounts found by hand: kept only as https, and never over one the official record gives. */
  const addSite = (p, s) => {
    if (https(s?.website) && !p.website) p.website = s.website;
    const social = Object.fromEntries(Object.entries(s?.social ?? {}).filter(([, u]) => https(u)));
    if (Object.keys(social).length) p.social = { ...social, ...p.social };
  };
  for (const r of races) {
    const people = [...r.candidates, ...(r.incumbents ?? []).filter((i) => i.ballot === undefined)];
    for (const p of people) {
      const key = `${r.id}|${p.name}`;
      if (r.candidates.includes(p)) addSite(p, sites[key]);
      const b = briefs[key];
      const e = r.candidates.includes(p) ? (endorsed[key] ?? []).filter((x) => x.endorser && https(x.source)) : [];
      const s = r.candidates.includes(p) ? (backed[key] ?? []).filter((x) => x.backer && x.wording && https(x.source)) : [];
      if (!b && !e.length && !s.length) continue;
      out[key] = b ? { facts: dated(b.facts, b), priorities: dated(b.priorities, b), quotes: b.quotes ?? [], sources: b.sources ?? [], asOf: b.asOf } : { facts: [], priorities: [], quotes: [], sources: [], asOf: '' };
      if (e.length) out[key].endorsements = e;
      if (s.length) out[key].support = s;
      if (!b) continue;
      if (!r.candidates.includes(p)) continue; // a holder's card shows only the brief and photo
      addSite(p, b);
    }
  }
  writeFileSync(new URL(`src/data/${guide}/briefs.json`, ROOT), JSON.stringify(out));
  return Object.keys(briefs).filter((k) => !(k in out));
}

/**
 * A line whose page is more than a year older than the brief carries that page's
 * year, so a 2023 platform shows as one ("(2023)") instead of reading as this race's.
 */
function dated(items = [], b) {
  const when = new Map((b.sources ?? []).map((s) => [s.url, s.date]));
  const cutoff = b.asOf ? `${Number(b.asOf.slice(0, 4)) - 1}${b.asOf.slice(4)}` : '';
  return items.map((x) => {
    const d = when.get(x.source);
    const year = d && cutoff && d < cutoff ? d.slice(0, 4) : '';
    return year && !x.text.includes(year) ? { ...x, year: Number(year) } : x; // "since 2023" already says it
  });
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
