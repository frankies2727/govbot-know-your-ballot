// Illinois' results for the Chicago and suburban Cook ballots we carry.
//
// Unofficial, from election night until the canvass: the Chicago Board of
// Elections' summary export (a fixed-width text file covering every contest on
// a Chicago ballot) and the Cook County Clerk's election-night page (suburban
// Cook). A countywide race is the two added together, so it's only shown when
// both were read; a race on only one of them (a Chicago school board seat, a
// suburban board district) is that one's count. Statewide, congressional and
// legislative races reach past Cook County, so they wait for the official
// statewide totals from the State Board of Elections (illinois-state.mjs).
// Both sites answer GitHub's runners (where the daily refresh runs).

import * as state from './illinois-state.mjs';

const CHICAGO = { name: 'Chicago Board of Elections', url: 'https://chicagoelections.gov/' };
const COOK = { name: 'Cook County Clerk', url: 'https://electionnight.cookcountyclerkil.gov/' };
const CHICAGO_FILE = 'https://results.chicagoelections.gov/results/SummaryExport.txt';

/** Chicago's summary export: [{ office, rows, reporting, precincts, total }] (yes/no contests have Yes and No rows). */
export function chicago(text) {
  const contests = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (line[0] !== '2' || line.length < 260) continue;
    const id = line.slice(1, 6);
    const tail = line.slice(260).trim();
    if (!contests.has(id)) {
      contests.set(id, { office: line.slice(37, 107).trim(), reporting: Number(line.slice(12, 16)), precincts: Number(tail.slice(-6, -2)), rows: [] });
    }
    const name = line.slice(107, 157).trim();
    contests.get(id).rows.push({ name, party: line.slice(157, 207).trim(), votes: Number(line.slice(16, 23)), writeIn: /write-?in/i.test(name) });
  }
  return [...contests.values()].map((c) => ({ ...c, total: c.rows.reduce((s, r) => s + r.votes, 0) }));
}

/** The text of an HTML page, a line per element. */
const lines = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, '\n').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .split('\n').map((l) => l.trim()).filter(Boolean);

/** Cook's election-night page: its contests, and when it was last updated ("11/05/2026 01:58 PM" → ISO). */
export function cook(html) {
  const l = lines(html);
  const stamp = l.find((x) => /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} [AP]M$/.test(x));
  const out = [];
  for (let i = 0; i < l.length; i++) {
    const head = l[i].match(/^(.+?) - Vote For (\d+)$/);
    if (!head) continue;
    const reported = l.slice(i + 1, i + 4).map((x) => x.match(/^([\d,]+) of ([\d,]+) Precincts Reported$/)).find(Boolean);
    const at = l.indexOf('%', i);
    if (!reported || at < 0 || l[at - 1] !== 'Votes' || l[at - 2] !== 'Candidate Name') continue;
    const rows = [];
    let j = at + 1;
    while (j + 1 < l.length && /^[\d,]+$/.test(l[j + 1])) {
      const m = l[j].match(/^(.*?)\s*(?:\(([^)]*)\))?\s*$/);
      rows.push({ name: m[1], party: m[2] ?? '', votes: Number(l[j + 1].replace(/,/g, '')), writeIn: /write-?in/i.test(m[1]) });
      j += /%$/.test(l[j + 2] ?? '') ? 3 : 2;
    }
    const n = (s) => Number(s.replace(/,/g, ''));
    out.push({ office: head[1], reporting: n(reported[1]), precincts: n(reported[2]), rows, total: rows.reduce((s, r) => s + r.votes, 0) });
    i = j - 1;
  }
  let asOf = null;
  if (stamp) {
    const [, mo, d, y, h, mi, ap] = stamp.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) ([AP]M)$/);
    // Cook's clock is Chicago time (Central; standard time from early November).
    const hour = (Number(h) % 12) + (ap === 'PM' ? 12 : 0);
    asOf = new Date(`${y}-${mo}-${d}T${String(hour).padStart(2, '0')}:${mi}:00-06:00`).toISOString();
  }
  return { contests: out, asOf };
}

/** Which source may give a race its count: the State Board's for statewide and district races; Chicago and Cook's for the county's own. */
const LOCAL = new Set(['county', 'judicial', 'school']);
/** A race all of Cook County votes on: it needs both Chicago's and the suburbs' count. */
const countywide = (race) => race.area == null || race.area.type === 'mwrd';

export async function read(get, year) {
  const parts = [];
  // Official statewide totals, once the State Board has posted the general.
  try {
    const official = await state.read(get, year);
    if (official) parts.push({ key: 'state', source: official.source, contests: official.contests, official: true, races: (r) => !LOCAL.has(r.section) });
  } catch (e) { console.warn(`State Board not read: ${e.message}`); }
  // Unofficial: Chicago and suburban Cook, both or neither.
  try {
    const chi = await get(CHICAGO_FILE);
    const sub = await get(COOK.url);
    const parsed = cook(sub.text);
    const chiContests = chicago(chi.text);
    if (chiContests.length < 50 || parsed.contests.length < 50) throw new Error(`too few contests (Chicago ${chiContests.length}, suburbs ${parsed.contests.length})`);
    const asOf = [chi.modified, parsed.asOf].filter(Boolean).sort().pop() ?? null;
    parts.push({ key: 'chicago', source: CHICAGO, contests: chiContests, asOf, races: (r) => LOCAL.has(r.section) });
    parts.push({ key: 'suburbs', source: COOK, contests: parsed.contests, asOf, races: (r) => LOCAL.has(r.section) });
  } catch (e) { console.warn(`Chicago and Cook not read, keeping yesterday's local results: ${e.message}`); }
  if (!parts.length) return null;
  const gaps = parts.some((p) => p.official) ? undefined
    : 'Statewide, congressional and legislative races reach beyond Cook County: they show the Associated Press’s call and unofficial count until the Illinois State Board of Elections posts the official statewide totals after its canvass, and a race the AP hasn’t called shows then.';
  return { parts, together: ['chicago', 'suburbs'], needsAll: (item) => (item.race ? countywide(item.race) : item.countywide), gaps };
}
