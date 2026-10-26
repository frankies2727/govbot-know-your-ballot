// The Secretary of State's candidate filings for the November 3, 2026 state
// general election: the "Candidates in the General Election – Federal, State,
// and County Offices" text file on candidates.sos.mn.gov, semicolon-separated
// in the layout its Media/MediaFileFormat.txt describes (office id, candidate
// name, office id, office title, county id, party abbreviation, addresses,
// campaign phone/website/email, running-mate contacts). This is the state's
// own word on who is on the ballot. The site sits behind a bot check that can
// turn a script away; then `read` throws and the build keeps Ballotpedia's list.
//   node scripts/minnesota/filings.mjs             fetch and summarise
//   node scripts/minnesota/filings.mjs --self-test  parse a sample offline
import { mergeOfficial } from '../official.mjs';

export const SITE = 'https://candidates.sos.mn.gov/';
const UA = 'KnowYourBallot/1.0';
const FILE_BUTTON = 'ctl00$ContentPlaceHolder1$lbStateMediaFile';

// The abbreviations the file uses, to the party names the ballot prints.
const PARTIES = { DFL: 'Democratic-Farmer-Labor', R: 'Republican', GOP: 'Republican', GRN: 'Green', G: 'Green', LIB: 'Libertarian', L: 'Libertarian', IND: 'Independent', NP: 'Nonpartisan', FI: 'Forward Independence', LMN: 'Legal Marijuana Now', GLC: 'Grassroots-Legalize Cannabis', PM: 'People of Minnesota', UNI: 'United New Independence' };

/** The race id a filing's office title belongs to, or null for an office the guide doesn't carry (county, district court). */
export function raceIdFor(title) {
  const t = title.replace(/\s+/g, ' ').trim();
  let m;
  if (/^U\.?S\.? Senat/i.test(t)) return 'u-s-senator';
  if ((m = t.match(/^U\.?S\.? Representative.*?(\d+)/i))) return `cd-${m[1]}`;
  if (/^Governor/i.test(t)) return 'governor-and-lieutenant-governor';
  if (/^Secretary of State/i.test(t)) return 'secretary-of-state';
  if (/^State Auditor/i.test(t)) return 'state-auditor';
  if (/^Attorney General/i.test(t)) return 'attorney-general';
  if ((m = t.match(/^State Senator.*?(\d+)/i))) return `sldu-${m[1]}`;
  if ((m = t.match(/^State Representative.*?(\d+)([A-Z])/i))) return `sldl-${m[1]}${m[2].toLowerCase()}`;
  if ((m = t.match(/Supreme Court.*?(\d+)/i))) return `associate-justice-of-the-supreme-court-seat-${m[1]}`;
  if ((m = t.match(/Court of Appeals.*?(\d+)/i))) return `judge-of-the-court-of-appeals-seat-${m[1]}`;
  return null;
}

/** The file's rows: [{ name, party, title, raceId, website }]. */
export function parseFilings(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const f = line.split(';');
    if (f.length < 6 || !f[1]?.trim()) continue;
    const title = f[3].trim();
    // A ticket files as one name, "Jane Roe and John Doe": the guide writes it "Jane Roe & John Doe".
    const name = f[1].trim().replace(/\s+and\s+/i, ' & ');
    const abbr = f[5].trim();
    rows.push({ name, party: PARTIES[abbr] ?? abbr, title, raceId: raceIdFor(title), website: f[15]?.trim() || '' });
  }
  return rows;
}

/** Rows grouped by race id, for mergeOfficial. */
export function byRace(rows) {
  const map = new Map();
  for (const r of rows) if (r.raceId) (map.get(r.raceId) ?? map.set(r.raceId, []).get(r.raceId)).push({ name: r.name, party: r.party });
  return map;
}

const cookies = (res) => (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
const field = (html, name) => html.match(new RegExp(`name="${name.replace(/\$/g, '\\$')}"[^>]*value="([^"]*)"`))?.[1] ?? '';

/** The file's text, straight from the site (a form postback, like the page's own download link). */
export async function fetchFilings() {
  const home = await fetch(SITE, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
  const html = await home.text();
  const jar = cookies(home);
  if (!field(html, '__VIEWSTATE')) throw new Error('the filings site did not show its form (a bot check?)');
  const body = new URLSearchParams({ __EVENTTARGET: FILE_BUTTON, __EVENTARGUMENT: '', __VIEWSTATE: field(html, '__VIEWSTATE'), __VIEWSTATEGENERATOR: field(html, '__VIEWSTATEGENERATOR'), __EVENTVALIDATION: field(html, '__EVENTVALIDATION') });
  let res = await fetch(SITE, { method: 'POST', body, headers: { 'User-Agent': UA, Cookie: jar, Referer: SITE, 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  for (let hops = 0; hops < 3 && res.status >= 300 && res.status < 400; hops++) {
    const to = new URL(res.headers.get('location'), SITE);
    if (to.host !== new URL(SITE).host) throw new Error(`sent to ${to.host} (a bot check)`);
    res = await fetch(to, { headers: { 'User-Agent': UA, Cookie: [jar, cookies(res)].filter(Boolean).join('; '), Referer: SITE }, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (/<html/i.test(text) || text.split('\n').filter((l) => l.split(';').length >= 6).length < 50) throw new Error('not the candidate file (a bot check page?)');
  return text;
}

/** What the shared build calls: the official list by race id, with its source. */
export async function read() {
  const rows = parseFilings(await fetchFilings());
  return { source: SITE, byRace: byRace(rows), rows };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  if (process.argv.includes('--self-test')) {
    const sample = [
      '0101;Amy Klobuchar and Peggy Flanagan;0101;Governor & Lt. Governor;88;DFL;;;;;;;;;;;;;;',
      '0102;Lisa Demuth and Someone Else;0102;Governor & Lt. Governor;88;R;;;;;;;;;;;;;;',
      '0105;Timothy Walz;0105;U.S. Senator;88;DFL;;;;;;;;;;www.example.org;;;;',
      '0201;Ilhan Omar;0201;U.S. Representative District 5;88;DFL;;;;;;;;;;;;;;',
      '0301;Patricia Mueller;0301;State Representative District 23B;88;R;;;;;;;;;;;;;;',
      '0302;Jane Roe;0302;State Senator District 12;88;IND;;;;;;;;;;;;;;',
      '0401;Pat Smith;0401;Associate Justice - Supreme Court 4;88;NP;;;;;;;;;;;;;;',
      '0501;Alex Judge;0501;Judge - 4th District Court 10;88;NP;;;;;;;;;;;;;;',
      '0601;County Person;0601;County Commissioner District 2;27;NP;;;;;;;;;;;;;;',
    ].join('\r\n');
    const rows = parseFilings(sample);
    const ids = rows.map((r) => r.raceId);
    const want = ['governor-and-lieutenant-governor', 'governor-and-lieutenant-governor', 'u-s-senator', 'cd-5', 'sldl-23b', 'sldu-12', 'associate-justice-of-the-supreme-court-seat-4', null, null];
    if (JSON.stringify(ids) !== JSON.stringify(want)) throw new Error(`race ids: ${JSON.stringify(ids)}`);
    if (rows[0].name !== 'Amy Klobuchar & Peggy Flanagan' || rows[0].party !== 'Democratic-Farmer-Labor' || rows[5].party !== 'Independent') throw new Error('name/party');
    const races = [
      { id: 'sldl-23b', office: 'State Representative, District 23B', candidates: [{ ballot: 1, name: 'Christoph Dundas', party: 'Democratic-Farmer-Labor' }, { ballot: 2, name: 'Patty Mueller', party: 'Republican', incumbent: true }] },
      { id: 'sldu-12', office: 'State Senator, District 12', candidates: [{ ballot: 1, name: 'Someone Gone', party: 'Republican' }] },
      { id: 'cd-1', office: 'U.S. Representative, District 1', candidates: [{ ballot: 1, name: 'Untouched Person', party: 'Republican' }] },
    ];
    const r = mergeOfficial(races, byRace(rows));
    const names = races.map((x) => x.candidates.map((c) => `${c.ballot}:${c.name}${c.incumbent ? '*' : ''}`).join(',')).join(' | ');
    const wantNames = '1:Patty Mueller* | 1:Jane Roe | 1:Untouched Person';
    if (names !== wantNames || r.covered !== 2 || r.added !== 1 || r.dropped !== 2) throw new Error(`merge: ${names} ${JSON.stringify(r)}`);
    console.log('self-test ok');
  } else {
    const { rows, byRace: map } = await read();
    console.log(`${rows.length} filings; ${map.size} races the guide carries; ${rows.filter((r) => !r.raceId).length} rows for other offices`);
    const titles = new Map(); for (const r of rows) if (!r.raceId) titles.set(r.title.replace(/\d+/g, 'N'), (titles.get(r.title.replace(/\d+/g, 'N')) ?? 0) + 1);
    for (const [t, n] of [...titles].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  not carried: ${t} × ${n}`);
  }
}
