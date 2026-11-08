// Denver's municipal election, Tuesday, Apr 6, 2027 (and the runoff on Tue,
// Jun 1 wherever no one gets more than half the vote): every race on the
// ballot, written to src/data/denver-2027/ for the guide at /2027-04/denver.
// From official sources, each read fail-soft (a source that can't be read
// keeps what the last build had):
//   - Who's running: SearchLight, the City's campaign finance system
//     (denver.maplight.com), which lists everyone who has registered a
//     candidate committee for the 2027 election. Registering isn't making the
//     ballot: petitions are due Jan 21, 2027, and the Elections Division then
//     certifies who qualified and draws the ballot order by lot in early
//     February. Until then the names are marked as registered, alphabetical.
//   - Campaign money: SearchLight's totals for each candidate's committee
//     since Jan 1, 2024 (the 2027 cycle), with Fair Elections Fund matching
//     money counted in what's raised and shown on its own.
//   - The council districts, and who holds each seat: the City's council
//     district map (Denver Open Data), which carries each member's name.
//   - The mayor, auditor and clerk and recorder: the City's own pages.
// Usage: node scripts/denver-2027.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { outlineOf, readLayer } from './city-maps.mjs';
import { sameName } from './wiki.mjs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('src/data/denver-2027/', ROOT);
const UA = 'KnowYourBallot/1.0 (+https://github.com/frankies2727/govbot-know-your-ballot)';
const ELECTION = { name: 'Denver Municipal General Election', date: '2027-04-06' };
const API = 'https://denver.maplight.com/api/';
const SEARCHLIGHT = 'https://denver.maplight.com/';
const CYCLE = 33; // SearchLight's "2027 Municipal General Election"
const DISTRICTS = 'https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/arcgis/rest/services/ODC_ADMN_COUNCILDIST_A/FeatureServer/3';
const DISTRICTS_PAGE = 'https://opendata-geospatialdenver.hub.arcgis.com/datasets/geospatialdenver::council-districts';
const REGISTERED = 'Registered; petitions due Jan 21';
const today = new Date().toISOString().slice(0, 10);

// The citywide offices' holders, from the City's own pages (checked Nov 8, 2026).
const CITYWIDE_NOW = {
  mayor: { name: 'Mike Johnston', source: { name: 'City and County of Denver: Mayor’s Office', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Mayors-Office' } },
  auditor: { name: 'Timothy M. O’Brien', source: { name: 'Denver Auditor’s Office', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Auditors-Office' } },
  'clerk-and-recorder': { name: 'Paul D. López', source: { name: 'Denver Clerk and Recorder', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Denver-Clerk-and-Recorder' } },
};

/** SearchLight's office -> our race. */
export function raceFor(office, district) {
  if (office === 'Mayor') return { id: 'mayor', office: 'Mayor', section: 'city', area: null };
  if (office === 'Auditor') return { id: 'auditor', office: 'Auditor', section: 'city', area: null };
  if (office === 'Clerk and Recorder') return { id: 'clerk-and-recorder', office: 'Clerk and Recorder', section: 'city', area: null };
  const seat = office.match(/^City Council At-Large Seat ([AB])$/);
  if (seat) return { id: `at-large-${seat[1].toLowerCase()}`, office: `City Council At-Large, Seat ${seat[1]}`, section: 'council', area: null };
  if (office === 'City Council' && /^\d+$/.test(String(district)) && +district >= 1 && +district <= 11) {
    return { id: `council-district-${+district}`, office: `City Council, District ${+district}`, section: 'council', area: { type: 'council', id: String(+district) } };
  }
  return null;
}

/** Every race on the ballot, in ballot order, empty until someone registers. */
export function allRaces() {
  return [
    raceFor('Mayor'), raceFor('Auditor'), raceFor('Clerk and Recorder'),
    raceFor('City Council At-Large Seat A'), raceFor('City Council At-Large Seat B'),
    ...Array.from({ length: 11 }, (_, i) => raceFor('City Council', i + 1)),
  ].map((r) => ({ ...r, voteFor: 1, writeIn: false, numbered: false, candidates: [] }));
}

/**
 * A name as the candidate registered it, tidied: spaces collapsed, a name
 * typed twice ("Jacob Luria Jacob Luria") once, and a word typed all in
 * lower case capitalised ("Quincy shannon").
 */
export function cleanName(name) {
  let n = name.replace(/\s+/g, ' ').trim();
  const w = n.split(' ');
  if (w.length % 2 === 0 && w.slice(0, w.length / 2).join(' ') === w.slice(w.length / 2).join(' ')) n = w.slice(0, w.length / 2).join(' ');
  return n.replace(/(?<=^|\s)([a-z])([a-z'’-]+)(?=\s|$)/g, (_, a, b) => a.toUpperCase() + b);
}

/**
 * The registered candidates by race. Someone registered for two offices this
 * cycle (a council member who moved to the mayor's race) is counted only for
 * the one they registered for last: the higher committee number.
 */
export function candidatesFrom(rows) {
  const latest = new Map();
  const moved = [];
  for (const r of rows) {
    const name = cleanName(r.fullName ?? '');
    if (!name || !raceFor(r.officeSought, r.district)) continue;
    const had = latest.get(name);
    if (had) moved.push(`${name}: ${had.officeSought}${had.district ? ` ${had.district}` : ''} / ${r.officeSought}${r.district ? ` ${r.district}` : ''}`);
    if (!had || r.committeeId > had.committeeId) latest.set(name, { ...r, name });
  }
  return { rows: [...latest.values()], moved };
}

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}
async function soft(name, f, fallback) {
  try { return await f(); } catch (e) { console.warn(`${name}: ${e.message}; keeping the last copy`); return fallback; }
}
const mmddyyyy = (iso) => `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}`;

/** A committee's totals this cycle, as the candidate's SearchLight page shows them. */
async function totals(filerId) {
  const q = `filerId=${filerId}&electionCycleId=${CYCLE}`;
  const [raised, spent, matched] = await Promise.all([
    get(`Committee/getContributionsTotalByCommittee?${q}`),
    get(`Committee/getExpendituresTotalByCommittee?${q}`),
    get(`Committee/GetFEFContributionTotalByCommittee?${q}`),
  ]);
  const round = (x) => Math.round(Number(x?.total) || 0);
  return { raised: round(raised), spent: round(spent), publicFunds: round(matched) };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let prev = null;
  try { prev = JSON.parse(readFileSync(new URL('ballot.json', OUT), 'utf8')); } catch { /* first build */ }
  const prevCandidate = (raceId, name) => prev?.races.find((r) => r.id === raceId)?.candidates.find((c) => c.name === name);

  const races = allRaces();
  const byId = new Map(races.map((r) => [r.id, r]));

  // Who's registered.
  const list = await soft('SearchLight candidates', () => get(`contact/GetCandidatesByElectionCycle?electionCycleId=${CYCLE}`), null);
  if (list && list.length < 10) throw new Error(`SearchLight lists only ${list.length} candidates`);
  if (list) {
    const { rows, moved } = candidatesFrom(list);
    for (const m of moved) console.log(`  registered for two offices, counted for the later one: ${m}`);
    for (const r of rows) {
      const race = byId.get(raceFor(r.officeSought, r.district).id);
      // Only the name, race and committee: SearchLight's list also carries home addresses, which never leave this script.
      race.candidates.push({ ballot: 0, name: r.name, party: '', filing: REGISTERED, profile: `${SEARCHLIGHT}public/candidate-details/${r.filerId}/${CYCLE}`, filerId: r.filerId });
    }
  } else if (prev) {
    for (const r of races) r.candidates = prev.races.find((x) => x.id === r.id)?.candidates ?? [];
  }
  // Alphabetical by last name until the lot drawing sets the ballot order.
  const last = (n) => n.split(' ').filter((w) => !/^(II|III|IV|Jr\.?|Sr\.?)$/.test(w)).pop();
  for (const r of races) {
    r.candidates.sort((a, b) => last(a.name).localeCompare(last(b.name)) || a.name.localeCompare(b.name));
    r.candidates.forEach((c, i) => { c.ballot = i + 1; });
  }

  // Campaign money, a few committees at a time.
  const all = races.flatMap((r) => r.candidates.map((c) => ({ r, c })));
  let withMoney = 0;
  for (let i = 0; i < all.length; i += 6) {
    await Promise.all(all.slice(i, i + 6).map(async ({ r, c }) => {
      if (c.filerId) {
        const t = await soft(`money for ${c.name}`, () => totals(c.filerId), null);
        if (t) {
          if (t.raised || t.spent) c.money = { source: 'DSL', id: String(c.filerId), raised: t.raised, spent: t.spent, ...(t.publicFunds ? { publicFunds: t.publicFunds } : {}), since: 'Jan 2024', through: mmddyyyy(today) };
        } else if (prevCandidate(r.id, c.name)?.money) c.money = prevCandidate(r.id, c.name).money;
      }
      delete c.filerId;
      if (c.money) withMoney++;
    }));
  }
  console.log(`Money: ${withMoney} of ${all.length} candidates have reported some`);

  // The council districts, and who holds each seat now.
  const layer = await soft('council districts', () => readLayer(DISTRICTS, (a) => a.DIST_NUM), null);
  const members = await soft('council members', async () => {
    const q = new URLSearchParams({ where: '1=1', outFields: 'DIST_NUM,DIST_REP,NOTES', returnGeometry: 'false', f: 'json' });
    const res = await fetch(`${DISTRICTS}/query?${q}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60_000) });
    return (await res.json()).features.map((f) => f.attributes);
  }, null);
  if (layer && layer.length !== 11) throw new Error(`the district map has ${layer.length} districts, not 11`);
  if (layer) {
    writeFileSync(new URL('districts.json', OUT), `${JSON.stringify({ layers: { council: layer } })}\n`);
    writeFileSync(new URL('outline.json', OUT), `${JSON.stringify(outlineOf(layer))}\n`);
  }

  const officeOf = new Map(races.flatMap((r) => r.candidates.map((c) => [c.name, r])));
  /** A holder of the seat: on this race's list, registered for another office (said so), or neither. */
  const holder = (race, name, source) => {
    const on = race.candidates.find((c) => sameName(c.name, name));
    if (on) { on.incumbent = true; return { name, ballot: on.ballot, source, asOf: today }; }
    const elsewhere = [...officeOf].find(([n]) => sameName(n, name))?.[1];
    return { name, ...(elsewhere ? { note: `Registered as a candidate for ${elsewhere.office} instead`, source: { name: 'Denver SearchLight', url: SEARCHLIGHT } } : { source }), asOf: today };
  };
  for (const [id, now] of Object.entries(CITYWIDE_NOW)) byId.get(id).incumbents = [holder(byId.get(id), now.name, now.source)];
  if (members) {
    const map = { name: 'City and County of Denver: council districts', url: DISTRICTS_PAGE };
    const atLarge = members.filter((m) => m.NOTES === 'At-Large').map((m) => m.DIST_REP.trim());
    // Until 2027 both at-large members were elected together, so each holds no one seat: both are shown for each.
    for (const id of ['at-large-a', 'at-large-b']) byId.get(id).incumbents = atLarge.map((n) => holder(byId.get(id), n, map));
    for (const m of members.filter((x) => x.DIST_NUM)) {
      const r = byId.get(`council-district-${m.DIST_NUM}`);
      r.incumbents = [holder(r, m.DIST_REP.trim(), map)];
    }
  } else if (prev) for (const r of races) { const p = prev.races.find((x) => x.id === r.id); if (p?.incumbents) r.incumbents = p.incumbents; }

  const data = {
    election: ELECTION,
    sources: {
      candidates: { pages: { 'Denver SearchLight': SEARCHLIGHT }, asOf: list ? today : prev?.sources.candidates.asOf ?? today },
      money: { url: SEARCHLIGHT, file: '' },
      proposals: {},
    },
    races,
    measures: [],
  };
  writeFileSync(new URL('ballot.json', OUT), `${JSON.stringify(data)}\n`);
  console.log(`Wrote src/data/denver-2027/: ${races.length} races, ${all.length} registered candidates`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { console.error(e); process.exit(1); });
