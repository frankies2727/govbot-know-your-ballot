// Jacksonville's consolidated city election, 2027: the First Election on
// Tue, Mar 9 and the General Election on Tue, May 18 for any race no one wins
// outright. Written to src/data/jacksonville-2027/ for the guide at
// /2027-03/jacksonville. Every Duval County voter, the Beaches and Baldwin
// included, votes for the mayor, the sheriff, the property appraiser, the
// supervisor of elections, the tax collector and the five at-large council
// members, and for one of 14 district council members.
//   - Which seats are up, and the dates: the Duval County Supervisor of
//     Elections (its 2027 dates and its office information sheets).
//   - Who holds each council seat: the City Council's members page
//     (jacksonville.gov); the citywide and county officers from their own
//     offices' pages.
//   - The council districts: the City's map (JaxGIS, Council Districts).
//   - Who's running: candidates qualify from noon Jan 11 to noon Jan 15,
//     2027. Until then, the mayor's race lists who has filed or announced,
//     from the Wikipedia article on it (CC BY-SA, which cites the
//     Supervisor's list), each marked as not yet qualified. The Supervisor's
//     own site turns scripted readers away, so its qualified list is added
//     from a copy once qualifying closes.
// Usage: node scripts/jacksonville-2027.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { outlineOf, readLayer } from './city-maps.mjs';
import { recentBills } from './illinois/govbot.mjs';
import { sameName } from './wiki.mjs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('src/data/jacksonville-2027/', ROOT);
const UA = 'KnowYourBallot/1.0 (+https://github.com/frankies2727/govbot-know-your-ballot)';
const ELECTION = { name: 'City of Jacksonville First Election', date: '2027-03-09' };
const MAYOR_ARTICLE = 'https://en.wikipedia.org/wiki/2027_Jacksonville_mayoral_election';
const COUNCIL_PAGE = 'https://www.jacksonville.gov/city-council/city-council-members';
const DISTRICTS = 'https://services1.arcgis.com/NXfNVaFp7QMxnE3j/arcgis/rest/services/CouncilDistricts/FeatureServer/0';
const SOE_CANDIDATES = 'https://www.duvalelections.gov/254/Active-Candidates-Committees';
const DECLARED = 'Declared; qualifying Jan 11–15';
const today = new Date().toISOString().slice(0, 10);

// The officers elected citywide, and who holds each office, from the office's own page (checked Nov 8, 2026).
const OFFICERS = [
  { id: 'mayor', office: 'Mayor', section: 'city', holder: 'Donna Deegan', source: { name: 'City of Jacksonville: Office of the Mayor', url: 'https://www.jacksonville.gov/mayor' } },
  { id: 'sheriff', office: 'Sheriff', section: 'county', holder: 'T.K. Waters', source: { name: 'Jacksonville Sheriff’s Office', url: 'https://www.jaxsheriff.org/' } },
  { id: 'property-appraiser', office: 'Property Appraiser', section: 'county', holder: 'Joyce Morgan', source: { name: 'Duval County Property Appraiser', url: 'https://www.jacksonville.gov/departments/property-appraiser' } },
  { id: 'supervisor-of-elections', office: 'Supervisor of Elections', section: 'county', holder: 'Jerry Holland', source: { name: 'Duval County Supervisor of Elections', url: 'https://www.duvalelections.gov/' } },
  { id: 'tax-collector', office: 'Tax Collector', section: 'county', holder: 'Jim Overton', source: { name: 'Duval County Tax Collector', url: 'https://www.duvaltaxcollector.net/' } },
];

/** Every race on the ballot, in the Supervisor's order: the officers, the at-large groups, then the districts. */
export function allRaces() {
  const race = (r) => ({ ...r, voteFor: 1, writeIn: true, numbered: false, candidates: [] });
  return [
    ...OFFICERS.map(({ id, office, section }) => race({ id, office, section, area: null })),
    ...Array.from({ length: 5 }, (_, i) => race({ id: `at-large-${i + 1}`, office: `City Council At-Large, Group ${i + 1}`, section: 'council', area: null })),
    ...Array.from({ length: 14 }, (_, i) => race({ id: `council-district-${i + 1}`, office: `City Council, District ${i + 1}`, section: 'council', area: { type: 'council', id: String(i + 1) } })),
  ];
}

/** Wikitext to plain text: links to their label, templates and refs out. */
const plain = (s) => s.replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>/g, '').replace(/\{\{[^}]*\}\}/g, '')
  .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1').replace(/'''?/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// How the article labels a candidate -> the party as Florida's ballot prints it, and whether they run as a write-in.
const PARTY = { Republican: 'Republican', Democrat: 'Democratic', Democratic: 'Democratic', Independent: 'Independent', NPA: 'No Party Affiliation' };

/** The article's "Declared" candidates: [{ name, party, writeIn }]. */
export function declared(text) {
  const from = text.search(/^=+\s*Declared\s*=+\s*$/m);
  if (from < 0) return [];
  const rest = text.slice(from).split('\n').slice(1);
  const out = [];
  for (const line of rest) {
    if (/^=/.test(line)) break;
    if (!line.startsWith('*')) continue;
    const label = line.match(/''\(([^)]*)\)''/)?.[1] ?? '';
    const name = plain(line.slice(1).replace(/''\([^)]*\)''[\s\S]*$/, '')).split(',')[0].trim();
    if (!name) continue;
    const writeIn = /write-in/i.test(label);
    const party = PARTY[label.replace(/\s*write-in\s*/i, '').trim()] ?? '';
    out.push({ name, party, writeIn });
  }
  return out;
}

/** The council's members page: seat ("al2", "d07") -> the member's name, as the page first gives it. */
export function councilMembers(html) {
  const seats = new Map();
  for (const m of html.matchAll(/href="[^"]*\/city-council-members\/(al[1-5]|d\d\d)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const name = m[2].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/\s+/g, ' ').trim();
    if (name && !seats.has(m[1])) seats.set(m[1], name);
  }
  return seats;
}

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}
async function soft(name, f, fallback) {
  try { return await f(); } catch (e) { console.warn(`${name}: ${e.message}; keeping the last copy`); return fallback; }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let prev = null;
  try { prev = JSON.parse(readFileSync(new URL('ballot.json', OUT), 'utf8')); } catch { /* first build */ }
  const prevRace = (id) => prev?.races.find((r) => r.id === id);
  const races = allRaces();
  const byId = new Map(races.map((r) => [r.id, r]));

  // The mayor's race: who has filed or announced.
  const article = await soft('Wikipedia', () => get(`https://en.wikipedia.org/w/index.php?action=raw&title=2027_Jacksonville_mayoral_election`), null);
  const mayor = byId.get('mayor');
  if (article) {
    const list = declared(article);
    if (list.length < 2) throw new Error(`the mayoral article lists ${list.length} candidates`);
    mayor.candidates = list.map((c, i) => ({ ballot: i + 1, name: c.name, party: c.party, filing: c.writeIn ? 'Declared write-in' : DECLARED }));
    mayor.source = MAYOR_ARTICLE;
  } else if (prevRace('mayor')) mayor.candidates = prevRace('mayor').candidates;

  // Who holds each seat now.
  const holder = (race, name, source) => {
    const on = race.candidates.find((c) => sameName(c.name, name));
    if (on) on.incumbent = true;
    return { name, ...(on ? { ballot: on.ballot } : {}), source, asOf: today };
  };
  for (const o of OFFICERS) byId.get(o.id).incumbents = [holder(byId.get(o.id), o.holder, o.source)];
  const members = await soft('council members', async () => councilMembers(await get(COUNCIL_PAGE)), null);
  if (members && members.size !== 19) throw new Error(`the members page lists ${members.size} seats, not 19`);
  for (const r of races.filter((x) => x.section === 'council')) {
    const seat = r.area ? `d${r.area.id.padStart(2, '0')}` : `al${r.id.split('-').pop()}`;
    const name = members?.get(seat);
    if (name) r.incumbents = [holder(r, name, { name: 'Jacksonville City Council', url: `${COUNCIL_PAGE}/${seat}` })];
    else if (prevRace(r.id)?.incumbents) r.incumbents = prevRace(r.id).incumbents;
  }

  // The council districts.
  const layer = await soft('council districts', () => readLayer(DISTRICTS, (a) => a.DISTRICT_N), null);
  if (layer && layer.length !== 14) throw new Error(`the district map has ${layer.length} districts, not 14`);
  if (layer) {
    writeFileSync(new URL('districts.json', OUT), `${JSON.stringify({ layers: { council: layer } })}\n`);
    writeFileSync(new URL('outline.json', OUT), `${JSON.stringify(outlineOf(layer))}\n`);
  }

  // The FL legislature's bills on elections and schools, from govbot.
  const laws = await soft('govbot bills', () => recentBills('fl'), prev?.laws ?? []);
  console.log(`govbot: ${laws.length} bills`);

  const data = {
    election: ELECTION,
    sources: {
      candidates: { pages: { 'Wikipedia: 2027 Jacksonville mayoral election': MAYOR_ARTICLE, 'Duval County Supervisor of Elections': SOE_CANDIDATES }, asOf: article ? today : prev?.sources.candidates.asOf ?? today },
      money: { url: 'https://www.duvalelections.gov/309/Candidate-Resources', file: '' },
      proposals: {},
    },
    races,
    measures: [],
    laws,
  };
  writeFileSync(new URL('ballot.json', OUT), `${JSON.stringify(data)}\n`);
  console.log(`Wrote src/data/jacksonville-2027/: ${races.length} races, ${races.reduce((n, r) => n + r.candidates.length, 0)} declared candidates`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { console.error(e); process.exit(1); });
