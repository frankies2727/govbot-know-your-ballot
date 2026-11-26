// City services in each Chicago ward, from the City's own 311 Service Requests
// dataset (data.cityofchicago.org, v6vf-nfxy, its documented SODA API, no key):
// over the last 12 months, how many requests residents filed, how many are still
// open, how many of those have waited more than 90 days, and what people asked
// for most. Two kinds of record are left out because they aren't requests for
// service: "311 INFORMATION ONLY CALL" (a question answered on the phone) and
// "Aircraft Noise Complaint" (O'Hare noise, nearly all filed in one ward,
// which would swamp that ward's numbers).
//
// The numbers are about the ward, not a grade of its alderperson: city
// departments do the work; a ward office helps residents file and follow up.

export const SERVICES_PAGE = 'https://data.cityofchicago.org/Service-Requests/311-Service-Requests/v6vf-nfxy';
const API = 'https://data.cityofchicago.org/resource/v6vf-nfxy.json';
export const SKIP_TYPES = ['311 INFORMATION ONLY CALL', 'Aircraft Noise Complaint'];

const day = (d) => d.toISOString().slice(0, 10);
const minusDays = (iso, n) => day(new Date(Date.parse(`${iso}T00:00:00Z`) - n * 86_400_000));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)) : 0; };

/** The SoQL queries for the year up to `today` (YYYY-MM-DD). */
export function servicesQueries(today) {
  const since = minusDays(today, 365);
  const base = `created_date >= '${since}T00:00:00' AND ward IS NOT NULL AND sr_type NOT IN (${SKIP_TYPES.map((t) => `'${t}'`).join(', ')})`;
  const q = (select, where, extra = {}) => `${API}?${new URLSearchParams({ $select: select, $where: where, $group: select.includes('sr_type') ? 'ward, sr_type' : 'ward', $limit: '50000', ...extra })}`;
  return {
    since,
    filed: q('ward, count(*) AS n', base),
    open: q('ward, count(*) AS n', `${base} AND status = 'Open'`),
    old: q('ward, count(*) AS n', `${base} AND status = 'Open' AND created_date < '${minusDays(today, 90)}T00:00:00'`),
    types: q('ward, sr_type, count(*) AS n', base),
  };
}

/** Pure: the four answers -> { since, wards: { "32": { filed, open, old, top } }, median: { filed, open, old } }. */
export function servicesFrom({ filed, open, old, types }, since) {
  const count = (rows) => new Map(rows.filter((r) => /^\d+$/.test(r.ward ?? '')).map((r) => [String(+r.ward), +r.n]));
  const f = count(filed), o = count(open), a = count(old);
  const byWard = new Map();
  for (const r of types) {
    if (!/^\d+$/.test(r.ward ?? '') || !r.sr_type) continue;
    const w = String(+r.ward);
    if (!byWard.has(w)) byWard.set(w, []);
    byWard.get(w).push({ type: r.sr_type.replace(/\s*\(NO LONGER BEING ACCEPTED\)/i, ''), n: +r.n });
  }
  const wards = {};
  for (let n = 1; n <= 50; n++) {
    const w = String(n);
    if (!f.get(w)) continue;
    wards[w] = { filed: f.get(w), open: o.get(w) ?? 0, old: a.get(w) ?? 0, top: (byWard.get(w) ?? []).sort((x, y) => y.n - x.n).slice(0, 3) };
  }
  const all = Object.values(wards);
  if (all.length !== 50) throw new Error(`311 data covers ${all.length} of 50 wards`);
  return { since, wards, median: { filed: median(all.map((x) => x.filed)), open: median(all.map((x) => x.open)), old: median(all.map((x) => x.old)) } };
}

// Grouping a year of requests takes the portal a minute or two.
async function slowGet(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'govbot-know-your-ballot' }, signal: AbortSignal.timeout(240_000) });
  if (!res.ok) throw new Error(`311 data: HTTP ${res.status}`);
  return res.text();
}

/** Live: read the year's 311 numbers for every ward. Throws on any failure (the caller keeps yesterday's). */
export async function wardServices(today, get = slowGet) {
  const qs = servicesQueries(today);
  // One at a time, each tried twice: the portal answers 503 when several heavy queries run at once.
  const read = async (u) => { try { return JSON.parse(await get(u)); } catch { await new Promise((r) => setTimeout(r, 15_000)); return JSON.parse(await get(u)); } };
  const filed = await read(qs.filed), open = await read(qs.open), old = await read(qs.old), types = await read(qs.types);
  return servicesFrom({ filed, open, old, types }, qs.since);
}
