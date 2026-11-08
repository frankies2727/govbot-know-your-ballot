// Wisconsin's spring election, 2027: the primary on Tue, Feb 16 (only for an
// office where more than two people file) and the election on Tue, Apr 6.
// Written to src/data/wisconsin-2027/ballot.json for the guide at
// /2027-04/wisconsin. The statewide and judicial contests:
//   - the Wisconsin Supreme Court seat Justice Annette Ziegler is leaving;
//   - a seat in each of the four Court of Appeals districts;
//   - the circuit court seats up this spring, county by county.
// Candidates file nomination papers by 5pm on Tue, Jan 5, 2027. Until the
// Elections Commission's own list is out, which seats are up, who holds them
// and who has announced come from the Wikipedia articles on the 2027 Wisconsin
// elections (CC BY-SA, cited on the page); announced candidates are marked
// as such. Once the Commission publishes its "Candidates on Ballot" list, a
// copy goes in scripts/wisconsin-2027/official/ (its site turns scripted
// readers away, as for Nov 2026) and its names, in ballot order, replace them.
// Usage: node scripts/wisconsin-2027.mjs

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseCandidateList } from './wisconsin/official.mjs';
import { recentBills } from './illinois/govbot.mjs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('src/data/wisconsin-2027/', ROOT);
const OFFICIAL = new URL('./wisconsin-2027/official/', import.meta.url);
const UA = 'KnowYourBallot/1.0 (https://github.com/frankies2727/govbot-know-your-ballot)';
const WIKI = 'https://en.wikipedia.org/w/index.php?action=raw&title=';
const ARTICLE = 'https://en.wikipedia.org/wiki/2027_Wisconsin_elections';
const COURT_ARTICLE = 'https://en.wikipedia.org/wiki/2027_Wisconsin_Supreme_Court_election';
const ELECTION = { name: 'Wisconsin Spring Election', date: '2027-04-06' };
const today = new Date().toISOString().slice(0, 10);

// The Court of Appeals districts by county (Wis. Stat. 752.11).
const COA = {
  I: ['Milwaukee'],
  II: ['Calumet', 'Fond du Lac', 'Green Lake', 'Kenosha', 'Manitowoc', 'Ozaukee', 'Racine', 'Sheboygan', 'Walworth', 'Washington', 'Waukesha', 'Winnebago'],
  III: ['Ashland', 'Barron', 'Bayfield', 'Brown', 'Buffalo', 'Burnett', 'Chippewa', 'Door', 'Douglas', 'Dunn', 'Eau Claire', 'Florence', 'Forest', 'Iron', 'Kewaunee', 'Langlade', 'Lincoln', 'Marathon', 'Marinette', 'Menominee', 'Oconto', 'Oneida', 'Outagamie', 'Pepin', 'Pierce', 'Polk', 'Price', 'Rusk', 'Sawyer', 'Shawano', 'St. Croix', 'Taylor', 'Trempealeau', 'Vilas', 'Washburn'],
  IV: ['Adams', 'Clark', 'Columbia', 'Crawford', 'Dane', 'Dodge', 'Grant', 'Green', 'Iowa', 'Jackson', 'Jefferson', 'Juneau', 'La Crosse', 'Lafayette', 'Marquette', 'Monroe', 'Portage', 'Richland', 'Rock', 'Sauk', 'Vernon', 'Waupaca', 'Waushara', 'Wood'],
};
const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };
// Circuits that span two counties (Wis. Stat. 753.06): their judges are on both counties' ballots.
const SHARED = { 'Buffalo-Pepin': ['Buffalo', 'Pepin'], 'Florence-Forest': ['Florence', 'Forest'], 'Menominee-Shawano': ['Menominee', 'Shawano'] };

const slug = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** Wikitext to plain text: links to their label, templates and refs out. */
export const plain = (s) => s.replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>/g, '').replace(/\{\{nowrap\|([^}]*)\}\}/g, '$1').replace(/\{\{[^}]*\}\}/g, '')
  .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1').replace(/'''?/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

async function raw(title) {
  const res = await fetch(WIKI + encodeURIComponent(title), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${title}: HTTP ${res.status}`);
  return res.text();
}

/** The circuit court seats up, from the article's table: [{ circuit, branch, judge, since, note }]. */
export function circuitSeats(text) {
  const from = text.indexOf('====State Circuit Courts====');
  const table = text.slice(from, text.indexOf('|}', from));
  const rows = table.split(/\n\|-/).slice(2);
  const seats = [];
  let circuit = null, left = 0;
  for (const row of rows) {
    const cells = ('\n' + row.trim()).split(/\n\|/).map((c) => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    let i = 0;
    // A row opens with its circuit unless the one above spans it ("rowspan").
    if (left > 0 && !/^colspan|^rowspan/.test(cells[0]) && /^align="right"/.test(cells[0])) { left--; } else {
      const head = cells[i++];
      const span = head.match(/rowspan="(\d+)"/);
      circuit = plain(head.replace(/^.*\|\s*/, ''));
      left = span ? Number(span[1]) - 1 : 0;
      // A one-judge circuit has no branch number ("colspan").
      if (/colspan="2"/.test(head)) { seats.push({ circuit, branch: null, judge: plain(cells[i++] ?? ''), since: plain((cells[i++] ?? '').replace(/^.*\|\s*/, '')), note: plain(cells[i] ?? '') }); continue; }
    }
    const branch = plain((cells[i++] ?? '').replace(/^.*\|\s*/, ''));
    seats.push({ circuit, branch, judge: plain(cells[i++] ?? ''), since: plain((cells[i++] ?? '').replace(/^.*\|\s*/, '')), note: plain(cells[i] ?? '') });
  }
  return seats.filter((s) => s.circuit && s.judge);
}

/** Each Court of Appeals district's line in the article: { district, judge, note }. */
export function appealsSeats(text) {
  const from = text.indexOf('====State Court of Appeals====');
  const block = text.slice(from, text.indexOf('====State Circuit Courts====', from));
  return [...block.matchAll(/^\* In District (I{1,3}|IV),\s*(.+)$/gm)].map(([, district, line]) => {
    const said = plain(line).replace(/\.$/, '');
    const judge = plain(line.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/)?.[1] ?? said.split(',')[0]).replace(/\s*\(.*\)$/, '');
    return { district, judge: /^Todd Ziegler/.test(said) ? 'Todd Ziegler' : judge, note: `${said}.` };
  });
}

/** The Supreme Court article's declared candidates: [{ name, about }]. */
export function declared(text) {
  const from = text.indexOf('===Declared===');
  const block = text.slice(from, text.indexOf('===', from + 15));
  return [...block.matchAll(/^\*\s*\[\[([^\]|]+)(?:\|([^\]]*))?\]\],?(.*)$/gm)].map(([, title, label, rest]) => ({ name: (label || title).replace(/\s*\(.*\)$/, ''), about: plain(rest.replace(/\{\{Efn[\s\S]*?\}\}<\/ref>\}\}|\{\{Efn[\s\S]*?\}\}/gi, '')) }));
}

/** The race an office on the Commission's list is (spring headings, tolerant of its spelling). */
export function raceIdFor(office) {
  const o = office.replace(/\s+/g, ' ').trim().toUpperCase();
  let m;
  if (/SUPREME COURT/.test(o)) return 'supreme-court';
  if ((m = o.match(/COURT OF APPEALS.*DISTRICT\s+(IV|I{1,3}|[1-4])\b/))) return `court-of-appeals-${ROMAN[m[1]] ?? m[1]}`;
  // "CIRCUIT COURT JUDGE, DANE COUNTY, BRANCH 6" / "CIRCUIT COURT JUDGE BAYFIELD COUNTY": the county, and the branch when it has several.
  if ((m = o.match(/^CIRCUIT COURT(?: JUDGE)?,?\s+(.+?)(?: COUNTY)?(?:,?\s+BRANCH (\d+))?$/))) return `circuit-${slug(m[1])}${m[2] ? `-${m[2]}` : ''}`;
  return null;
}

/** The Commission's newest list in ./wisconsin-2027/official/, as rows by race id; null until there is one. */
function officialList() {
  if (!existsSync(OFFICIAL)) return null;
  const pdf = readdirSync(OFFICIAL).filter((f) => f.endsWith('.pdf')).sort().pop();
  if (!pdf) return null;
  const text = execFileSync('pdftotext', ['-layout', new URL(pdf, OFFICIAL).pathname, '-'], { encoding: 'utf8' });
  const rows = parseCandidateList(text).map((r) => ({ ...r, raceId: raceIdFor(r.office) }));
  const printed = text.match(/Printed:?\s*([\d/]+)/)?.[1] ?? today;
  const map = new Map();
  for (const r of rows) if (r.raceId) (map.get(r.raceId) ?? map.set(r.raceId, []).get(r.raceId)).push(r);
  return { map, printed, file: pdf, unmatched: [...new Set(rows.filter((r) => !r.raceId).map((r) => r.office))] };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let prev = null;
  try { prev = JSON.parse(readFileSync(new URL('ballot.json', OUT), 'utf8')); } catch { /* first build */ }
  const article = await raw('2027_Wisconsin_elections');
  const court = await raw('2027_Wisconsin_Supreme_Court_election');
  const ANNOUNCED = 'Announced; files by Jan 5';
  const source = { name: 'Wikipedia: 2027 Wisconsin elections', url: ARTICLE };

  const races = [];
  // The Supreme Court.
  const zieglerRef = court.match(/https:\/\/www\.wpr\.org\/news\/annette-ziegler[^\s|]*/)?.[0];
  races.push({
    id: 'supreme-court', office: 'Justice of the Supreme Court', section: 'state', area: null, voteFor: 1, writeIn: false, numbered: false,
    candidates: declared(court).map((c, i) => ({ ballot: i + 1, name: c.name, party: '', filing: ANNOUNCED })),
    incumbents: [{ name: 'Annette Ziegler', note: 'Conservative Wisconsin Supreme Court Justice Annette Ziegler to retire', source: { name: 'Wisconsin Public Radio', url: zieglerRef ?? COURT_ARTICLE }, asOf: today }],
  });
  // The Court of Appeals, a seat in each district.
  for (const s of appealsSeats(article)) {
    const n = ROMAN[s.district];
    // A judge the article says is running counts as announced.
    const running = /is running/.test(s.note);
    races.push({
      id: `court-of-appeals-${n}`, office: `Judge of the Court of Appeals, District ${s.district}`, section: 'judicial', area: { type: 'coa', id: s.district }, voteFor: 1, writeIn: false, numbered: false,
      candidates: running ? [{ ballot: 1, name: s.judge, party: '', filing: ANNOUNCED, incumbent: true }] : [],
      incumbents: [{ name: s.judge, ...(running ? { ballot: 1 } : { note: s.note }), source, asOf: today }],
    });
  }
  // The circuit courts, county by county.
  const seats = circuitSeats(article);
  for (const s of seats) {
    const counties = SHARED[s.circuit] ?? [s.circuit];
    for (const county of counties) {
      races.push({
        id: `circuit-${slug(s.circuit)}${s.branch ? `-${s.branch}` : ''}${counties.length > 1 ? `-${slug(county)}` : ''}`,
        office: `Circuit Court Judge, ${s.circuit} County${s.branch ? `, Branch ${s.branch}` : ''}`, section: 'judicial', area: { type: 'county', id: county }, voteFor: 1, writeIn: false, numbered: false,
        candidates: [], incumbents: [{ name: s.judge, source, asOf: today }],
      });
    }
  }
  if (races.filter((r) => r.id.startsWith('court-of-appeals')).length !== 4 || seats.length < 40) throw new Error(`the article looks wrong: ${seats.length} circuit seats`);

  // The Commission's list, once it's out: its names in ballot order replace the announced ones.
  const official = officialList();
  if (official) {
    for (const r of races) {
      const rows = official.map.get(r.id) ?? official.map.get(r.id.replace(/-[a-z-]+$/, ''));
      if (!rows) { r.candidates = []; continue; }
      r.candidates = rows.map((x) => ({ ballot: x.order, name: x.name, party: '' }));
      r.numbered = true;
      const on = r.incumbents?.[0] && r.candidates.find((c) => c.name.toLowerCase().includes(r.incumbents[0].name.split(' ').pop().toLowerCase()));
      if (on) { on.incumbent = true; r.incumbents[0] = { ...r.incumbents[0], ballot: on.ballot, note: undefined }; }
    }
    if (official.unmatched.length) console.warn(`Offices on the Commission's list we don't carry: ${official.unmatched.slice(0, 8).join('; ')}`);
  }

  const counties = {};
  for (const [d, list] of Object.entries(COA)) for (const c of list) counties[c] = [`county:${c}`, `coa:${d}`];
  // The WI legislature's bills on elections and schools, from govbot.
  let laws = prev?.laws ?? [];
  try { laws = await recentBills('wi'); console.log(`govbot: ${laws.length} bills`); } catch (e) { console.warn(`govbot: ${e.message}; keeping the last copy`); }

  const data = {
    election: ELECTION,
    sources: {
      candidates: { pages: official ? { 'Wisconsin Elections Commission': 'https://elections.wi.gov/candidates-and-committees/candidates' } : { 'Wikipedia: 2027 Wisconsin elections': ARTICLE, 'Wikipedia: 2027 Wisconsin Supreme Court election': COURT_ARTICLE }, asOf: official?.printed ?? today, official: Boolean(official) },
      money: { url: 'https://campaignfinance.wi.gov/', file: '' },
      proposals: {},
    },
    races,
    measures: [],
    laws,
    coa: Object.fromEntries(Object.entries(COA).flatMap(([d, list]) => list.map((c) => [c, d]))),
    counties,
  };
  writeFileSync(new URL('ballot.json', OUT), `${JSON.stringify(data)}\n`);
  console.log(`Wrote src/data/wisconsin-2027/ballot.json: ${races.length} races (${seats.length} circuit seats), ${races.reduce((n, r) => n + r.candidates.length, 0)} candidates${official ? ` from the Commission's list (${official.file})` : ', announced only'}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { console.error(e); process.exit(1); });
