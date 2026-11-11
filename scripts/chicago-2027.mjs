// Chicago's city election, Tuesday, Feb 23, 2027: every race on the ballot,
// written to src/data/chicago-2027/ballot.json for the guide at /2027-02/chicago.
// From official sources, each read fail-soft (a source that can't be read
// keeps what the last build had):
//   - Who's running: the Chicago Board of Election Commissioners' candidate
//     list (a PDF, "Candidate Filings in Ballot Order"), names in ballot order
//     with each filing's status. The newest list's address comes from the
//     Illinois build, which finds it on the Board's page every morning
//     (src/data/illinois/ballot.json, govbot.cityList), or from CITY_PDF.
//   - Who holds each seat now: the City's ward offices (Chicago Data Portal,
//     with the City Clerk's official photo of each alderperson), the
//     Community Commission for Public Safety and Accountability's page for
//     each police district council (its members, and the neighborhoods and
//     wards it serves), and the City's own pages for the mayor, clerk and
//     treasurer.
//   - Campaign money: the Illinois State Board of Elections' bulk files
//     (scripts/illinois/isbe.mjs).
//   - Websites, accounts and photos for the rest: Wikidata and each
//     candidate's own site (scripts/illinois/social.mjs).
//   - A link to each candidate's page on Chicago Politics (chicagopolitics.org),
//     which counts petition signatures; only pages its sitemap lists.
// Usage: node scripts/chicago-2027.mjs

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { namesAgree } from './ballotpedia-profiles.mjs';
import { nameCase, parseCityList, stillFiled } from './illinois/city.mjs';
import { addStateMoney, ISBE_BASE, ISBE_FILES } from './illinois/isbe.mjs';
import { addPhotos } from './illinois/photos.mjs';
import { addSocial } from './illinois/social.mjs';
import { personKey } from './results/match.mjs';
import { outlineOf } from './city-maps.mjs';
import { councilRecords } from './chicago-2027/council.mjs';
import { recentBills } from './illinois/govbot.mjs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('src/data/chicago-2027/', ROOT);
const PHOTOS = new URL('public/kyb-photos/chicago-2027/', ROOT);
const UA = 'KnowYourBallot/1.0 (+https://github.com/frankies2727/govbot-know-your-ballot)';
const ELECTION = { name: 'Chicago Municipal General Election', date: '2027-02-23' };
const BOARD_CANDIDATES = 'https://chicagoelections.gov/getting-ballot/candidates';
const WARD_OFFICES = 'https://data.cityofchicago.org/resource/htai-wnw4.json';
const WARD_OFFICES_PAGE = 'https://data.cityofchicago.org/d/htai-wnw4';
const CCPSA = 'https://ccpsa.chicago.gov/district-council/';
const CHICAGO_POLITICS = 'https://www.chicagopolitics.org/';
const today = new Date().toISOString().slice(0, 10);

// The citywide offices' holders, from the City's own pages (checked Nov 8, 2026).
const CITYWIDE_NOW = {
  mayor: { name: 'Brandon Johnson', source: { name: 'City of Chicago: Office of the Mayor', url: 'https://www.chicago.gov/city/en/depts/mayor.html' } },
  'city-clerk': { name: 'Anna M. Valencia', source: { name: 'Office of the City Clerk', url: 'https://www.chicityclerk.com/' } },
  'city-treasurer': { name: 'Melissa Conyears-Ervin', source: { name: 'Office of the City Treasurer', url: 'https://www.chicago.gov/city/en/depts/treas.html' } },
};

// Why a sitting alderperson isn't on the ballot: the headline of the news
// report of their announcement, word for word, with its link (checked Nov 8,
// 2026). Shown only while they're absent from the Board's list.
const NOT_RUNNING = {
  13: { note: 'Alderman Marty Quinn to retire from Chicago City Council after 15 years', source: { name: 'ABC7 Chicago', url: 'https://abc7chicago.com/post/alderman-marty-quinn-southwest-side-13th-ward-retire-chicago-city-council-15-years/19471426/' } },
  19: { note: 'Chicago Ald. Matt O\'Shea won\'t seek re-election after four terms', source: { name: 'FOX 32 Chicago', url: 'https://www.fox32chicago.com/news/chicago-ald-matt-oshea-wont-seek-re-election-after-four-terms' } },
  22: { note: 'Ald. Mike Rodriguez not running for re-election', source: { name: 'FOX 32 Chicago', url: 'https://www.fox32chicago.com/video/fmc-87ikmitazt3y5l1v' } },
};

/** 1 -> "1st", 22 -> "22nd", 11 -> "11th". */
export const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
const slug = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function get(url, type = 'text') {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return type === 'json' ? res.json() : type === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.text();
}
/** Runs `f`, logging and returning `fallback` when its source can't be read. */
async function soft(name, f, fallback) {
  try { return await f(); } catch (e) { console.warn(`${name}: ${e.message}; keeping the last copy`); return fallback; }
}
const textOf = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '\n')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#8217;|&rsquo;/g, '’')
  .split('\n').map((l) => l.trim()).filter(Boolean);

// ---- the races --------------------------------------------------------------------

/** The Board's list's race ids (scripts/illinois/city.mjs) -> ours, with the race. */
function raceFor(boardId) {
  if (boardId === 'chicago-mayor') return { id: 'mayor', office: 'Mayor', section: 'city', area: null, voteFor: 1 };
  if (boardId === 'chicago-city-clerk') return { id: 'city-clerk', office: 'City Clerk', section: 'city', area: null, voteFor: 1 };
  if (boardId === 'chicago-city-treasurer') return { id: 'city-treasurer', office: 'City Treasurer', section: 'city', area: null, voteFor: 1 };
  let m;
  if ((m = boardId.match(/^chicago-alderperson-ward-(\d+)$/))) {
    const n = +m[1];
    return { id: `alderperson-ward-${n}`, office: `Alderperson, ${ordinal(n)} Ward`, section: 'council', area: { type: 'ward', id: String(n) }, voteFor: 1 };
  }
  if ((m = boardId.match(/^chicago-police-district-council-(\d+)$/))) {
    const n = +m[1];
    return { id: `police-district-council-${n}`, office: `Police District Council, ${ordinal(n)} District`, section: 'police', area: { type: 'police', id: String(n) }, voteFor: 3 };
  }
  return null;
}

/** The Board's newest list: its PDF's address and text. */
async function boardList(work) {
  const url = process.env.CITY_PDF ?? JSON.parse(readFileSync(new URL('src/data/illinois/ballot.json', ROOT), 'utf8')).govbot?.cityList?.url;
  if (!url) throw new Error('no Feb 2027 candidate list: set CITY_PDF or run the Illinois build first');
  const file = join(work, 'city.pdf');
  writeFileSync(file, /^https?:/.test(url) ? await get(url, 'buffer') : readFileSync(url));
  execFileSync('pdftotext', ['-layout', file, join(work, 'city.txt')]);
  return { url, text: readFileSync(join(work, 'city.txt'), 'utf8') };
}

/**
 * The races and who has filed, in the Board's ballot order. A filing counts
 * as plain "Candidate"; one under objection ("Objection Filed", "Challenged") stays on, with its status shown,
 * until the Board rules; anything else (withdrawn, removed) is left off.
 */
function racesFrom(list) {
  const read = parseCityList(list.text);
  const races = [];
  const left = {};
  for (const [boardId, filings] of read.offices) {
    const r = raceFor(boardId);
    if (!r) continue;
    const candidates = [];
    for (const f of filings) {
      const kept = stillFiled(f.status);
      if (!kept) { left[f.status] = (left[f.status] ?? 0) + 1; continue; }
      if (candidates.some((c) => c.name === f.name)) continue;
      candidates.push({ ballot: f.no ?? candidates.length + 1, name: f.name, party: '', ...(f.status !== 'Candidate' ? { filing: f.status } : {}) });
    }
    // The Board prints ballot numbers once it certifies the ballot (Dec 17,
    // 2026); until every filing in a race has one, the list's order is the
    // ballot order and the numbers here only identify picks.
    const numbered = candidates.length > 0 && filings.filter((f) => stillFiled(f.status)).every((f) => f.no);
    races.push({ ...r, candidates, writeIn: false, numbered, source: list.url });
  }
  const wards = races.filter((r) => r.section === 'council').length;
  const police = races.filter((r) => r.section === 'police').length;
  if (!races.some((r) => r.id === 'mayor') || wards !== 50 || police < 22) throw new Error(`the list looks wrong: ${wards} wards, ${police} police districts`);
  const order = { city: 0, council: 1, police: 2 };
  races.sort((a, b) => order[a.section] - order[b.section] || (a.area ? +a.area.id : 0) - (b.area ? +b.area.id : 0));
  return { races, asOf: read.asOf, left, unknown: read.unknown };
}

// ---- who holds each seat now ---------------------------------------------------

/** "La Spata, Daniel" / "Cardona, Jr., Felix" -> "Daniel La Spata" / "Felix Cardona Jr.". */
export function personName(listed) {
  const parts = listed.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return listed.trim();
  const first = parts.pop();
  return `${first} ${parts.join(' ')}`;
}

/** One person under two spellings: "Deondre' Rutues (Dr. Dre')" and "Deondre Rutues", "Andre Vasquez" and "Andre Vasquez Jr.". */
const samePerson = (a, b) => namesAgree(a, b) || personKey(a) === personKey(b);

/** Each seat's holder, marked as on this ballot (their ballot number) or not. */
const incumbent = (race, name, source) => {
  const on = race.candidates.find((c) => samePerson(c.name, name));
  if (on) on.incumbent = true;
  return { name, ...(on ? { ballot: on.ballot } : {}), source, asOf: today };
};

async function wardOffices() {
  const rows = await get(`${WARD_OFFICES}?$limit=60`, 'json');
  if (rows.length < 50) throw new Error(`only ${rows.length} ward offices`);
  return new Map(rows.map((r) => [String(+r.ward), { name: personName(r.alderman), photo: r.photo_link?.url, site: r.website?.url, phone: r.ward_phone, email: r.email, address: [r.address, r.city, r.zipcode].filter(Boolean).join(', ') }]));
}

/** A police district council's page: its members, and the area it serves in the Commission's words. */
async function districtCouncil(n) {
  const url = `${CCPSA}${ordinal(n)}-district-council/`;
  const lines = textOf(await get(url));
  const from = lines.indexOf('Members');
  const to = lines.indexOf('Who we serve');
  if (from < 0 || to < from) throw new Error(`${url}: no member list`);
  // Each member: a name, a role (sometimes), and "See More".
  const block = lines.slice(from + 1, to);
  const members = [];
  for (let i = 0; i < block.length; i++) {
    if (block[i] === 'See More') continue;
    // An empty seat is listed as "Vacant".
    if ((i === 0 || block[i - 1] === 'See More') && !/^vacant$/i.test(block[i])) members.push(block[i]);
  }
  const about = [];
  for (const l of lines.slice(to + 1)) { if (/^(Bylaws|Vision and Goals|Yearly Calendar)$/.test(l)) break; about.push(l); }
  return { url, members, about: about.join(' ') };
}

// ---- money, links, photos ---------------------------------------------------------

async function isbeFiles(work) {
  if (process.env.ISBE_DIR) return process.env.ISBE_DIR; // files already downloaded (a local run)
  const dir = join(work, 'isbe');
  mkdirSync(dir, { recursive: true });
  for (const f of ISBE_FILES) writeFileSync(join(dir, `${f}.txt`), await get(`${ISBE_BASE}${f}.txt`, 'buffer'));
  return dir;
}

/** Each candidate's page on Chicago Politics, from its sitemap: slug -> address. */
async function chicagoPolitics() {
  const xml = await get(`${CHICAGO_POLITICS}sitemap.xml`);
  const pages = new Map();
  for (const [, url] of xml.matchAll(/<loc>(https:\/\/www\.chicagopolitics\.org\/candidate\/([^<]+))<\/loc>/g)) pages.set(url.split('/').pop(), url);
  if (pages.size < 100) throw new Error(`only ${pages.size} candidate pages in the sitemap`);
  return pages;
}

/**
 * A candidate's page among Chicago Politics' addresses. Its addresses drop a
 * nickname in quotes or brackets, an "aka" and often a middle initial
 * ("Willie L. Wilson" is willie-wilson), and add the race when two people
 * share a name ("kiisha-smith-24", "kiisha-smith-district-10").
 */
export function politicsPage(pages, name, race) {
  // A quoted nickname stands alone ("Jim", 'Baldie'); an apostrophe inside a name (Deondre', O'Shea) isn't a quote.
  const base = name.replace(/["“”][^"“”]*["“”]|(?<=^|\s)['‘][^'’]*['’](?=\s|$)|\([^)]*\)|\s+aka\s.*$/gi, ' ').replace(/\s+/g, ' ').trim();
  const noInitials = base.split(' ').filter((w) => !/^[A-Za-z]\.?$/.test(w)).join(' ');
  const where = race.area ? [race.area.type === 'ward' ? race.area.id : `district-${race.area.id}`] : [];
  for (const s of [...new Set([slug(name), slug(base), slug(noInitials)])]) {
    for (const k of [s, ...where.map((w) => `${s}-${w}`)]) if (pages.has(k)) return pages.get(k);
  }
  return null;
}

// ---- the build -----------------------------------------------------------------------

async function main() {
  mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), 'chicago-2027-'));
  let prev = null;
  try { prev = JSON.parse(readFileSync(new URL('ballot.json', OUT), 'utf8')); } catch { /* first build */ }

  const list = await boardList(work);
  const { races, asOf, left, unknown } = racesFrom(list);
  const filed = races.reduce((n, r) => n + r.candidates.length, 0);
  console.log(`Board list (as of ${asOf}): ${races.length} races, ${filed} candidates`);
  for (const [status, n] of Object.entries(left)) console.log(`  ${n} filing${n === 1 ? '' : 's'} "${status}" left off`);
  if (unknown.length) console.warn(`  headings that match no race: ${unknown.join('; ')}`);
  const byId = new Map(races.map((r) => [r.id, r]));
  const prevById = new Map((prev?.races ?? []).map((r) => [r.id, r]));

  // Who holds each seat now.
  for (const [id, now] of Object.entries(CITYWIDE_NOW)) byId.get(id).incumbents = [incumbent(byId.get(id), now.name, now.source)];
  const wards = await soft('ward offices', wardOffices, null);
  for (const r of races.filter((x) => x.section === 'council')) {
    const o = wards?.get(r.area.id);
    if (!o) { if (prevById.get(r.id)?.incumbents) r.incumbents = prevById.get(r.id).incumbents; continue; }
    const now = incumbent(r, o.name, { name: 'City of Chicago: ward offices', url: WARD_OFFICES_PAGE });
    const why = NOT_RUNNING[r.area.id];
    r.incumbents = [now.ballot == null && why ? { ...now, note: why.note, source: why.source } : now];
    r.office_ = o; // used below for the official photo
  }
  // Each sitting alderperson's City Council record this term (the City Clerk's eLMS), on the seat's holder.
  const records = await soft('City Clerk eLMS', () => councilRecords(today, console.log), null);
  let withRecord = 0;
  for (const r of races.filter((x) => x.section === 'council')) {
    const holder = r.incumbents?.[0];
    const rec = records?.get(r.area.id) ?? prevById.get(r.id)?.incumbents?.[0]?.council;
    if (!holder || !rec) continue;
    // The Clerk and the ward offices data must name the same person ("La Spata, Daniel" / "Daniel La Spata").
    if (!samePerson(personName(rec.name), holder.name)) { console.warn(`  ward ${r.area.id}: eLMS lists ${rec.name}, the ward offices ${holder.name}; no record attached`); continue; }
    holder.council = { ...rec, name: undefined };
    withRecord++;
  }
  console.log(`Council records: ${withRecord} of 50 wards`);

  let councils = 0;
  for (const r of races.filter((x) => x.section === 'police')) {
    const dc = await soft(`district council ${r.area.id}`, () => districtCouncil(+r.area.id), null);
    if (!dc?.members.length) { const p = prevById.get(r.id); if (p?.incumbents) r.incumbents = p.incumbents; if (p?.about) r.about = p.about; continue; }
    r.incumbents = dc.members.map((m) => incumbent(r, m, { name: `CCPSA: ${ordinal(+r.area.id)} District Council`, url: dc.url }));
    if (dc.about) r.about = { text: dc.about, source: { name: 'Community Commission for Public Safety and Accountability', url: dc.url } };
    councils++;
  }
  console.log(`Seats now: ${wards ? wards.size : 'kept'} wards, ${councils} of 22 district councils read`);

  // Campaign websites and accounts checked by hand (scripts/chicago-2027/links-chosen.json:
  // { "<race id>|<name>": { website?, social?: { x, facebook, ... }, source } }), each
  // only from the candidate's own site or an official page. The step below then
  // reads each website for more.
  const CHOSEN = JSON.parse(readFileSync(new URL('./chicago-2027/links-chosen.json', import.meta.url), 'utf8'));
  for (const r of races) for (const c of r.candidates) {
    const pick = CHOSEN[`${r.id}|${c.name}`];
    if (!pick) continue;
    if (pick.website && /^https:\/\//.test(pick.website)) c.website = pick.website;
    const social = Object.fromEntries(Object.entries(pick.social ?? {}).filter(([, u]) => /^https:\/\//.test(u)));
    if (Object.keys(social).length) c.social = { ...social, ...c.social };
  }

  // Websites, accounts and (unofficial) photos; then the City Clerk's official photo for each sitting alderperson.
  const social = await soft('social', () => addSocial(races, work, (url) => get(url), prev), null);
  if (social) { console.log(`Social: ${social.withSocial} of ${social.total} candidates`); for (const l of social.log) console.log(`  ${l}`); }
  for (const r of races.filter((x) => x.office_)) {
    const now = r.candidates.find((c) => c.incumbent);
    if (now && r.office_.photo) now.photoFrom = { url: r.office_.photo, credit: 'Office of the City Clerk, City of Chicago', link: WARD_OFFICES_PAGE };
    delete r.office_;
  }
  const photos = await addPhotos(races, { dir: PHOTOS.pathname, publicPath: 'kyb-photos/chicago-2027', prev, chosen: new URL('./chicago-2027/photos-chosen.json', import.meta.url) });
  for (const l of photos.log) console.log(l);

  // Campaign money: committees on file for the Feb 2027 election.
  const isbe = await soft('ISBE', () => isbeFiles(work), null);
  if (isbe) {
    // Filed for 2027, or (a sitting alderperson's committee) for the same seat in 2023; who's in office comes from the City, not these files.
    const m = await addStateMoney(races, isbe, { years: ['2027', '2023'], types: ['CP', 'CE'], incumbency: false, party: true });
    console.log(`Money: ${m.matched} of ${m.total} candidates matched to a committee`);
  } else {
    // Couldn't read the files today: keep yesterday's figures.
    for (const r of races) for (const c of r.candidates) { const p = prevById.get(r.id)?.candidates.find((x) => x.name === c.name); if (p?.money) c.money = p.money; }
  }

  // No party is printed on this ballot: a candidate with none on file (the State Board's records or Wikidata) says so, rather than looking unfinished.
  for (const r of races) for (const c of r.candidates) if (!c.party) c.party = 'No party on file';

  // Each candidate's Chicago Politics page, where the sitemap lists one.
  const pages = await soft('chicagopolitics.org', chicagoPolitics, null);
  let linked = 0;
  for (const r of races) for (const c of r.candidates) {
    const url = pages ? politicsPage(pages, c.name, r) : prevById.get(r.id)?.candidates.find((x) => x.name === c.name)?.profile;
    if (url) { c.profile = url; linked++; }
  }
  console.log(`Chicago Politics: ${linked} of ${filed} candidates linked`);

  // The IL legislature's bills on elections and schools, from govbot.
  const laws = await soft('govbot bills', () => recentBills('il'), prev?.laws ?? []);
  console.log(`govbot: ${laws.length} bills`);

  const data = {
    election: ELECTION,
    sources: {
      candidates: { pages: { 'Chicago Board of Election Commissioners': BOARD_CANDIDATES }, asOf: asOf ?? prev?.sources?.candidates?.asOf ?? today, list: list.url },
      money: { url: 'https://www.elections.il.gov/CampaignDisclosure/CampaignDisclosureSearch.aspx', file: ISBE_BASE },
      proposals: {},
    },
    races,
    measures: [],
    laws,
    wards: wards ? Object.fromEntries([...wards].map(([n, o]) => [n, { site: o.site, phone: o.phone, email: o.email, address: o.address }])) : prev?.wards,
  };
  writeFileSync(new URL('ballot.json', OUT), `${JSON.stringify(data)}\n`);
  const { layers } = JSON.parse(readFileSync(new URL('src/data/illinois/districts.json', ROOT), 'utf8'));
  writeFileSync(new URL('outline.json', OUT), `${JSON.stringify(outlineOf(layers.ward))}\n`);
  console.log(`Wrote src/data/chicago-2027/ballot.json: ${races.length} races, ${filed} candidates`);
}

// Run as a script, not when a test imports its helpers.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { console.error(e); process.exit(1); });
