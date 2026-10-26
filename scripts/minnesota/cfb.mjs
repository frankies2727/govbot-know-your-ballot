// Campaign money for Minnesota's state candidates, from the Campaign Finance
// and Public Disclosure Board's candidate viewer (cfb.mn.gov): each
// committee's financial summary per election year, as the Board shows it
// (total receipts, total expenditures, the ending cash balance and the date
// of the latest report). Summed over the cycle (2025 and 2026). The viewer's
// data calls are the ones its own page makes; they answer only with the
// page's cookies and the headers a browser sends.
//   https://cfb.mn.gov/reports-and-data/viewers/campaign-finance/candidates/
//
// A candidate who expects to raise and spend under $750 files an affidavit
// instead of reports ("(Affidavit Only)" in the Board's list): no figures,
// and the app says so.

import { dollars, mdy, parts, sameName } from '../money-names.mjs';

const SITE = 'https://cfb.mn.gov';
export const CFB_VIEWER = `${SITE}/reports-and-data/viewers/campaign-finance/candidates/`;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const YEARS = ['2025', '2026'];
const BUDGET_MS = 12 * 60_000;
const PAUSE_MS = 250;

// Our office names -> the office word in the Board's committee names ("Klobuchar, Amy Gov Committee").
const OFFICE = {
  'Governor and Lieutenant Governor': 'Gov',
  'Secretary of State': 'Sec of State',
  'State Auditor': 'State Aud',
  'Attorney General': 'Atty Gen',
  'State Senator': 'Senate',
  'State Representative': 'House',
  'Associate Justice of the Supreme Court': 'Sup Court',
  'Judge of the Court of Appeals': 'App Court',
  'Judge of the District Court': 'Dist Court',
};
const LABEL = /^(.+?) (Gov|Lt Gov|Senate|House|Atty Gen|Sec of State|State Aud|Sup Court|App Court|Dist Court)(?: (Committee)| \((Affidavit Only)\))? - (\d+)( \(Terminated\))?$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** A session: the viewer page's cookies, then the page's own data calls. */
export async function openSession(fetchFn = fetch) {
  const res = await fetchFn(CFB_VIEWER, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${CFB_VIEWER}: HTTP ${res.status}`);
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  const headers = { 'User-Agent': UA, Cookie: cookie, Referer: CFB_VIEWER, Origin: SITE, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json, text/javascript, */*; q=0.01', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
  const post = async (url, form) => {
    const r = await fetchFn(url, { method: 'POST', headers, body: new URLSearchParams(form).toString(), signal: AbortSignal.timeout(30_000) });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.json();
  };
  return {
    /** Every candidate committee the Board lists: [{ id, name: "Last, First", office, affidavit, terminated }]. */
    async list() {
      const d = await post(`${SITE}/reports/api/`, { action: 'searchbox', 'data[action]': 'candidate' });
      return parseList(d.data ?? []);
    },
    tab: (id, tabname) => post(`${CFB_VIEWER}api`, { id, year: '2026', 'year_data[ElectionSegmentEndDate]': '2026', 'year_data[ElectionSegmentStartDate]': '2025', tabname }),
  };
}

export function parseList(rows) {
  const out = [];
  for (const [, label] of rows) {
    const m = String(label).match(LABEL);
    if (!m) continue;
    out.push({ id: m[5], name: m[1], office: m[2], affidavit: !!m[4], terminated: !!m[6] });
  }
  return out;
}

/** The "Financial Summary" tab: per election year, receipts, expenditures, ending cash and the report date. */
export function parseFinancial(html) {
  const t = text(html);
  const years = [];
  for (const [, year, body] of t.matchAll(/(\d{4}) - Election year(.*?)(?=\d{4} - Election year|Data not available|$)/g)) {
    const grab = (label) => body.match(new RegExp(`${label}[^$]*\\$([\\d,.-]+)`))?.[1];
    const through = body.match(/Most recent report through (\d{1,2}\/\d{1,2}\/\d{4})/)?.[1];
    if (!through) continue;
    years.push({ year, receipts: dollars(grab('Total receipts') ?? '0'), spent: dollars(grab('Total expenditures') ?? '0'), cash: dollars(grab('Ending cash balance as of [^$]*') ?? '0'), through: mdy(through) });
  }
  return years;
}

/** The race's office word, seat or district, for a committee to match. */
export function raceKey(race) {
  const office = OFFICE[race.office.replace(/,.*$/, '').replace(/\s*\(.*$/, '')];
  if (!office) return null;
  const seat = race.area ? String(race.area.id) : race.office.match(/Seat (\d+)/)?.[1] ?? '';
  return { office, district: seat };
}

/**
 * Attach `money` ({ source: 'MNCFB', id, raised, spent, cash, through }) to
 * each state candidate with a committee in the Board's viewer. A candidate
 * on file as affidavit-only (under $750) is noted in the log, not matched.
 */
export async function addStateMoney(races, { fetchFn = fetch, pause = PAUSE_MS } = {}) {
  const session = await openSession(fetchFn);
  const all = (await session.list()).filter((c) => !c.terminated);
  const started = Date.now();
  const log = [];
  let matched = 0, total = 0, affidavits = 0, unreached = 0;
  for (const race of races) {
    const key = raceKey(race);
    if (!key) continue;
    for (const c of race.candidates) {
      total++;
      if (Date.now() - started > BUDGET_MS) { unreached++; continue; }
      // In a district or seat race the committee's own district is checked below, so a first initial will do ("JD" ~ "Jenaro").
      const byName = all.filter((k) => k.office === key.office && sameName(c.name, k.name.split(',')[1] ?? '', k.name.split(',')[0], { initialOk: !!key.district }));
      const committees = byName.filter((k) => !k.affidavit);
      if (!committees.length) {
        if (byName.length) affidavits++;
        else if (process.env.KYB_DEBUG) { const near = all.filter((k) => k.name.toLowerCase().startsWith(parts(c.name).at(-1) + ',')); log.push(`  ${c.name} (${key.office} ${key.district}): no committee; same surname: ${near.map((k) => `${k.name} ${k.office}${k.affidavit ? ' (affidavit)' : ''}`).join('; ') || 'none'}`); }
        continue;
      }
      // The committee's own record says which district or seat it's for.
      const hits = [];
      const seen = {};
      for (const k of committees) {
        try {
          const info = (await session.tab(k.id, 'information')).data?.[0];
          await sleep(pause);
          if (!info) { seen[k.id] = 'no record'; continue; }
          const district = String(info.District ?? '').trim();
          seen[k.id] = `${district || '-'} (${info.OfficeSought} ${info.ElectionYear})`;
          if (key.district && district && district !== key.district) continue;
          hits.push(k);
        } catch (e) { log.push(`${c.name}: ${e.message}`); }
      }
      if (hits.length !== 1) {
        if (hits.length > 1) log.push(`${c.name}: ${hits.length} committees for ${key.office} ${key.district}; none used`);
        else if (process.env.KYB_DEBUG) log.push(`  ${c.name} (${key.office} ${key.district}): committees ${committees.map((k) => `${k.name} #${k.id} district ${seen[k.id] ?? '?'}`).join('; ')} don't match the district`);
        continue;
      }
      try {
        const tab = (await session.tab(hits[0].id, 'financial')).tabcontent ?? '';
        const years = parseFinancial(tab).filter((y) => YEARS.includes(y.year));
        await sleep(pause);
        if (!years.length) { if (process.env.KYB_DEBUG) log.push(`  ${c.name}: #${hits[0].id} no 2025/2026 summary: ${text(tab).slice(0, 160)}`); continue; }
        const latest = years.sort((a, b) => a.year.localeCompare(b.year)).at(-1);
        c.money = { source: 'MNCFB', id: hits[0].id, raised: years.reduce((n, y) => n + y.receipts, 0), spent: years.reduce((n, y) => n + y.spent, 0), cash: latest.cash, through: latest.through };
        matched++;
      } catch (e) { log.push(`${c.name}: ${e.message}`); }
    }
  }
  if (affidavits) log.push(`${affidavits} candidates are on file as affidavit-only (under $750): no figures`);
  if (unreached) log.push(`${unreached} candidates not reached in the ${BUDGET_MS / 60_000}-minute budget`);
  return { matched, total, committees: all.length, log };
}

// Standalone: `node scripts/minnesota/cfb.mjs [--write]` against the committed data.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const file = new URL('../../src/data/minnesota/ballot.json', import.meta.url);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const r = await addStateMoney(data.races);
  console.log(`CFB: matched ${r.matched}/${r.total} candidates (${r.committees} committees listed)`);
  for (const l of r.log) console.log('  ' + l);
  if (process.argv.includes('--write')) writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}
