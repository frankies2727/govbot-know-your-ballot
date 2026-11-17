// Oak Park's consolidated election, Tuesday, Apr 6, 2027: every race on an
// Oak Park voter's ballot, written to src/data/oak-park-2027/ for the guide at
// /2027-04/oak-park. Nonpartisan, no primary (Oak Park's village candidates
// file as independents in November; the school, library, park and college
// boards have none). Each source is read fail-soft (one that can't be read
// keeps what the last build had):
//   - The offices and seats: each body's own notices and rosters (the
//     Village's elected officials page, District 97 and District 200's board
//     pages, the Library's and the Park District's, Triton College's 2027
//     notice of filing), checked Nov 17, 2026, and below as RACES.
//   - Who's running: the Illinois State Board of Elections' candidate files.
//     A candidate for these offices must file a statement of organization
//     there before raising or spending over $5,000, so the list is official
//     and read daily; it isn't the ballot (petitions were filed Nov 16-23,
//     2026, with the Village Clerk, the Park District, the Cook County Clerk
//     or Triton, and the ballot is certified Jan 28, 2027). Someone the
//     Wednesday Journal reports as running who isn't listed there yet is
//     listed as announced, with the article (ANNOUNCED below).
//   - Campaign money: the same ISBE files, each committee's reports since
//     Jan 1, 2025.
//   - The village's 32 precincts (the hero's map): Cook County GIS.
// Usage: node scripts/oak-park-2027.mjs  (ISBE_DIR=<dir> to use files already
// downloaded).

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { outlineOf, readLayer } from './city-maps.mjs';
import { recentBills } from './illinois/govbot.mjs';
import { addPhotos } from './illinois/photos.mjs';
import { addStateMoney, candidatesOnFile, ISBE_BASE, ISBE_FILES } from './illinois/isbe.mjs';
import { sameName } from './wiki.mjs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('src/data/oak-park-2027/', ROOT);
const PHOTOS = new URL('public/kyb-photos/oak-park-2027/', ROOT);
const HOLDER_PHOTOS = new URL('public/kyb-photos/oak-park-2027-office/', ROOT);
// Read by hand from each candidate's own pages and the local press (neutral, quotes word for word, every line sourced),
// keyed "<race id>|<name>"; photos picked the same way, from any source, always credited (./illinois/photos.mjs).
const BRIEFS = new URL('./oak-park-2027/briefs.json', import.meta.url);
const CHOSEN_PHOTOS = new URL('./oak-park-2027/photos-chosen.json', import.meta.url);
const HOLDER_CHOSEN = new URL('./oak-park-2027/holder-photos-chosen.json', import.meta.url);
const UA = 'KnowYourBallot/1.0 (+https://github.com/frankies2727/govbot-know-your-ballot)';
const ELECTION = { name: 'Consolidated Election', date: '2027-04-06' };
const GIS = 'https://gis.cookcountyil.gov/traditional/rest/services';
const PRECINCTS = `${GIS}/electionSrvcLite/MapServer/1`;
const DISCLOSURE = 'https://www.elections.il.gov/CampaignDisclosure/CommitteeSearch.aspx';
const ON_FILE = 'Listed with the State Board';
const ANNOUNCED_STATUS = 'Announced';
const today = new Date().toISOString().slice(0, 10);

const SRC = {
  village: { name: 'Village of Oak Park: elected officials', url: 'https://www.oak-park.us/your-government/elected-officials' },
  d97: { name: 'District 97: Meet the Board', url: 'https://www.op97.org/boe/meet-the-board' },
  d200: { name: 'OPRF High School District 200: Board of Education', url: 'https://www.oprfhs.org/about/board-of-education' },
  library: { name: 'Oak Park Public Library: Board of Trustees', url: 'https://www.oppl.org/about/board-of-trustees/' },
  park: { name: 'Park District of Oak Park: Board of Commissioners', url: 'https://pdop.org/welcome/board-of-commissioners/' },
  triton: { name: 'Triton College: Board of Trustees', url: 'https://www.triton.edu/about/administration/board-of-trustees.html' },
};

/**
 * Every contest on an Oak Park ballot, in ballot order, with the seats up and
 * who holds them now (the bodies' own rosters, checked Nov 17, 2026). The
 * whole village votes in every one (District 200 and Triton also cover other
 * towns). The library's three seats are the three whose terms its roster
 * shows ending in 2027; the Park District's are the three its notice
 * announces, whose holders were elected in 2023.
 */
export const RACES = [
  { id: 'village-trustee', office: 'Village Trustee (3 seats)', section: 'city', voteFor: 3, now: SRC.village, holders: ['Derek Eder', 'Brian D. Straw', 'Cory J. Wesley'] },
  { id: 'd97-board', office: 'District 97 Board of Education, 4-year term (4 seats)', section: 'school', voteFor: 4, now: SRC.d97, holders: ['Cheree Moore', 'Jung Kim', 'Gavin Kearney', 'Holly Spurlock'] },
  { id: 'd97-board-2-year', office: 'District 97 Board of Education, 2-year term (1 seat)', section: 'school', voteFor: 1, now: SRC.d97, holders: ['Vincent Gay'],
    note: 'Appointed June 2026 to fill Becky Pérez’s seat until the election' },
  { id: 'd200-board', office: 'District 200 Board of Education (3 seats)', section: 'school', voteFor: 3, now: SRC.d200, holders: ['Tim Brandhorst', 'Graham Brisben', 'Jonathan Livingston'] },
  { id: 'library-trustee', office: 'Library Trustee (3 seats)', section: 'council', voteFor: 3, now: SRC.library, holders: ['Virginia Bloom', 'Susanne Fairfax', 'Kristina Rogers'] },
  { id: 'park-commissioner', office: 'Park District Commissioner (3 seats)', section: 'council', voteFor: 3, now: SRC.park, holders: ['Chris Wollmuth', 'Jake Worley-Hood', 'Kassie Porreca'] },
  { id: 'triton-trustee', office: 'Triton College Trustee (2 seats)', section: 'education', voteFor: 2, now: SRC.triton, holders: ['Mark R. Stephens', 'Tracy Jennings'] },
];

/**
 * Running, as the Wednesday Journal reported, with no committee on ISBE's
 * files yet. Each is dropped once ISBE lists them (they then show as on file).
 */
export const ANNOUNCED = [
  { race: 'village-trustee', name: 'Brian Straw', source: 'https://www.oakpark.com/2026/09/10/brian-straw-reelection/' },
  { race: 'village-trustee', name: 'Jim Farrell', source: 'https://www.oakpark.com/2026/09/14/jim-farrell-campaign/' },
  { race: 'village-trustee', name: 'Joseph Beer', source: 'https://www.oakpark.com/2026/09/29/joseph-beer-election/' },
  { race: 'village-trustee', name: 'Cory Wesley', source: 'https://www.oakpark.com/2026/11/10/cory-wesley-campaign-announcement/' },
];

/** The news article each candidate on file announced in, when there is one. */
const ARTICLES = [
  ['Sarah Abboreno Corbin', 'https://www.oakpark.com/2026/08/18/village-board-election/'],
  ['Derek Eder', 'https://www.oakpark.com/2026/10/08/derek-eder-campaign/'],
  ['Kimberlee Smith', 'https://www.oakpark.com/2026/10/06/kimberlee-smith-campaign/'],
];

/**
 * ISBE's office on file -> our race, or null. Body and place must both match:
 * "Trustee · Village · River Forest" is River Forest's board, "Member ·
 * School · 200" is any of several District 200s, so the high school also
 * needs the candidate's town. District 97 has two contests (4-year and
 * 2-year) and the files don't say which a candidate is in, so those are left
 * for the official list (logged, not guessed).
 */
export function raceFor(p, town) {
  const office = p.office.toLowerCase(), type = p.districtType.toLowerCase(), district = p.district.toLowerCase();
  const local = /^(oak park|river forest)$/i.test(town.trim());
  if (type === 'village' && district === 'oak park' && office === 'trustee') return 'village-trustee';
  if (type === 'library' && /oak park/.test(district) && office === 'trustee') return 'library-trustee';
  if (type === 'park' && /oak park/.test(district)) return 'park-commissioner';
  if (type === 'comm college' && /triton|504/.test(district) && office === 'trustee') return 'triton-trustee';
  if (type === 'school' && /\b200\b/.test(district) && !/cusd/.test(district) && local) return 'd200-board';
  if (type === 'school' && /\b97\b/.test(district) && /^oak park$/i.test(town.trim())) return 'd97';
  return null;
}

/** "Abboreno Corbin" files as "Corbin": the article's fuller name wins when the two agree. */
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());

async function get(url, kind = 'json') {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return kind === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.json();
}
async function soft(name, f, fallback) {
  try { return await f(); } catch (e) { console.warn(`${name}: ${e.message}; keeping the last copy`); return fallback; }
}
async function isbeFiles() {
  if (process.env.ISBE_DIR) return process.env.ISBE_DIR;
  const dir = mkdtempSync(join(tmpdir(), 'isbe-'));
  for (const f of ISBE_FILES) writeFileSync(join(dir, `${f}.txt`), await get(`${ISBE_BASE}${f}.txt`, 'buffer'));
  return dir;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let prev = null;
  try { prev = JSON.parse(readFileSync(new URL('ballot.json', OUT), 'utf8')); } catch { /* first build */ }

  const races = RACES.map(({ id, office, section, voteFor }) => ({ id, office, section, area: null, voteFor, writeIn: false, numbered: false, candidates: [] }));
  const byId = new Map(races.map((r) => [r.id, r]));

  // Who's running: ISBE's files, Oak Park's bodies only.
  const dir = await soft('ISBE files', isbeFiles, null);
  const towns = new Map();
  const where = (r) => { const hit = raceFor({ office: r.Office, districtType: r.DistrictType, district: r.District }, r.City); if (hit) towns.set(r.ID, r.City); return Boolean(hit); };
  const filed = dir ? await soft('ISBE candidates', () => candidatesOnFile(dir, { years: ['2027'], types: ['CE'], where }), null) : null;
  if (filed) {
    for (const p of filed) {
      const id = raceFor(p, towns.get(p.id) ?? '');
      const name = titleCase(`${p.first} ${p.last}`.replace(/\s+/g, ' ').trim());
      if (id === 'd97') { console.log(`  District 97: ${name} is on file; which term they're running for comes from the official list`); continue; }
      const race = byId.get(id);
      if (race.candidates.some((c) => sameName(c.name, name))) continue;
      const article = ARTICLES.find(([n]) => sameName(n, name));
      race.candidates.push({ ballot: 0, name: article?.[0] ?? name, party: '', filing: ON_FILE, ...(article ? { profile: article[1] } : {}), ...(p.status === 'Inc' ? { incumbent: true } : {}) });
    }
    console.log(`ISBE: ${filed.length} Oak Park candidates on file for Apr 2027`);
  } else if (prev) {
    for (const r of races) r.candidates = (prev.races.find((x) => x.id === r.id)?.candidates ?? []).filter((c) => c.filing === ON_FILE);
  }
  // Announced in the news, not on file yet.
  for (const a of ANNOUNCED) {
    const race = byId.get(a.race);
    if (!race.candidates.some((c) => sameName(c.name, a.name))) race.candidates.push({ ballot: 0, name: a.name, party: '', filing: ANNOUNCED_STATUS, profile: a.source });
  }

  // Each candidate's brief (background, what they'd work on, their own words), campaign site and accounts.
  const briefs = JSON.parse(readFileSync(BRIEFS, 'utf8'));
  for (const r of races) for (const c of r.candidates) {
    const b = briefs[`${r.id}|${c.name}`];
    if (!b) continue;
    c.brief = { facts: b.facts ?? [], priorities: b.priorities ?? [], quotes: b.quotes ?? [], sources: b.sources ?? [], asOf: b.asOf };
    if (b.website) c.website = b.website;
    const social = Object.fromEntries(Object.entries(b.social ?? {}).filter(([, u]) => typeof u === 'string' && /^https:\/\//.test(u)));
    if (Object.keys(social).length) c.social = social;
  }
  const unused = Object.keys(briefs).filter((k) => !RACES.some((r) => [...r.holders, ...races.find((x) => x.id === r.id).candidates.map((c) => c.name)].some((n) => `${r.id}|${n}` === k)));
  if (unused.length) console.warn(`briefs.json: no candidate for ${unused.join('; ')}`);
  const photos = await addPhotos(races, { dir: PHOTOS.pathname, publicPath: 'kyb-photos/oak-park-2027', prev, chosen: CHOSEN_PHOTOS });
  for (const l of photos.log) console.log(l);

  // Who holds each seat now, and whether they're on this race's list.
  for (const def of RACES) {
    const race = byId.get(def.id);
    race.incumbents = def.holders.map((name) => {
      const on = race.candidates.find((c) => sameName(c.name, name));
      if (on) on.incumbent = true;
      return { name, ...(on ? { ballot: 0 } : {}), ...(def.note ? { note: def.note } : {}), source: def.now, asOf: '2026-11-17' };
    });
  }

  // Seat holders not on the candidate list (yet): their brief and photo too, so a race nobody has
  // filed for still says who holds it. Their photos sit in their own folder: addPhotos sweeps its folder.
  const holders = races.map((r) => ({ id: r.id, candidates: (r.incumbents ?? []).filter((i) => i.ballot === undefined) }));
  for (const r of holders) for (const i of r.candidates) {
    const b = briefs[`${r.id}|${i.name}`];
    if (b) i.brief = { facts: b.facts ?? [], priorities: b.priorities ?? [], quotes: b.quotes ?? [], sources: b.sources ?? [], asOf: b.asOf };
  }
  const prevHolders = prev && { races: prev.races.map((r) => ({ id: r.id, candidates: r.incumbents ?? [] })) };
  const held = await addPhotos(holders, { dir: HOLDER_PHOTOS.pathname, publicPath: 'kyb-photos/oak-park-2027-office', prev: prevHolders, chosen: HOLDER_CHOSEN });
  for (const l of held.log) console.log(`holders ${l}`);

  // Alphabetical by last name until the ballot order is set (Cook County draws it); then number them.
  const last = (n) => n.split(' ').filter((w) => !/^(II|III|IV|Jr\.?|Sr\.?)$/.test(w)).pop();
  for (const r of races) {
    r.candidates.sort((a, b) => last(a.name).localeCompare(last(b.name)) || a.name.localeCompare(b.name));
    r.candidates.forEach((c, i) => { c.ballot = i + 1; });
    for (const inc of r.incumbents ?? []) { const on = r.candidates.find((c) => sameName(c.name, inc.name)); if (on) inc.ballot = on.ballot; }
  }

  // Campaign money: each candidate's committee on file with ISBE.
  if (dir) {
    const m = await soft('ISBE money', () => addStateMoney(races, dir, { years: ['2027', '2025', '2023'], types: ['CE'], incumbency: false, where: (r) => Boolean(raceFor({ office: r.Office, districtType: r.DistrictType, district: r.District }, r.City)) }), null);
    if (m) console.log(`Money: ${m.matched} of ${m.total} candidates matched to a committee`);
  }
  if (!dir && prev) for (const r of races) for (const c of r.candidates) { const p = prev.races.find((x) => x.id === r.id)?.candidates.find((x) => x.name === c.name); if (p?.money) c.money = p.money; }

  // The hero's map: the village's 32 precincts. Every voter gets the same
  // ballot, so there is no address lookup to feed.
  const precincts = await soft('precincts', () => readLayer(PRECINCTS, (a) => a.Precinct_Number, "Township_Name='OAK PARK'"), null);
  if (precincts) {
    if (precincts.length < 25) throw new Error(`only ${precincts.length} Oak Park precincts`);
    writeFileSync(new URL('outline.json', OUT), `${JSON.stringify(outlineOf(precincts))}\n`);
    console.log(`Map: ${precincts.length} precincts`);
  }

  // Springfield's bills on elections and schools, from govbot.
  const laws = await soft('govbot bills', () => recentBills('il'), prev?.laws ?? []);

  const all = races.reduce((n, r) => n + r.candidates.length, 0);
  const data = {
    election: ELECTION,
    sources: {
      candidates: { pages: { 'Illinois State Board of Elections': DISCLOSURE }, asOf: filed ? today : prev?.sources.candidates.asOf ?? today },
      money: { url: DISCLOSURE, file: ISBE_BASE },
      proposals: {},
    },
    races,
    measures: [],
    laws,
  };
  writeFileSync(new URL('ballot.json', OUT), `${JSON.stringify(data)}\n`);
  console.log(`Wrote src/data/oak-park-2027/: ${races.length} races, ${all} candidates`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { console.error(e); process.exit(1); });
