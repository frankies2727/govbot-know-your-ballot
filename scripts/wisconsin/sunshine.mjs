// Campaign money for Wisconsin's state candidates, from the Ethics
// Commission's campaign finance system (campaignfinance.wi.gov, "Sunshine"):
// the public JSON calls its own pages make. For each candidate's committee,
// its year-by-year contributions and disbursements, summed over the cycle
// (2025 and 2026), and the end date of its latest report. The system shows
// no cash-on-hand figure, so state candidates show raised and spent only.
//   https://campaignfinance.wi.gov/browse-data/registrants
//
// A committee is matched to a candidate only when its registrant page names
// the same office (and district) and its name carries the candidate's
// surname (and, when it carries a first name, the same one). A committee
// named by first name alone ("Cory for Senate") counts only when the page's
// party agrees too.

import { dollars, mdy, parts, sameFirst } from '../money-names.mjs';

const SITE = 'https://campaignfinance.wi.gov';
const API = `${SITE}/api/trpc/`;
export const SUNSHINE = `${SITE}/browse-data/registrants`;
export const committeePage = (id) => `${SITE}/browse-data/registrant/${id}`;
const UA = 'KnowYourBallot/1.0 (https://github.com/frankies2727/govbot-know-your-ballot)';
const YEARS = [2025, 2026];
const BUDGET_MS = 12 * 60_000;
const PAUSE_MS = 200;
const CANDIDATE_TYPES = new Set(['State Candidate']);

// Our office names -> the office on the committee's registration.
const OFFICE = {
  'Governor and Lieutenant Governor': 'Governor',
  'Attorney General': 'Attorney General',
  'Secretary of State': 'Secretary of State',
  'State Treasurer': 'State Treasurer',
  'State Senator': 'State Senate',
  'Representative to the Assembly': 'State Assembly',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(fetchFn, proc, json) {
  const url = `${API}${proc}?input=${encodeURIComponent(JSON.stringify({ json }))}`;
  const res = await fetchFn(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${proc}: HTTP ${res.status}`);
  const d = await res.json();
  if (d.error) throw new Error(`${proc}: ${d.error.json?.message ?? 'error'}`);
  return d.result.data.json;
}

/** Committees whose name carries `query`: [{ id, name, type }]. */
export async function searchCommittees(fetchFn, query) {
  const url = `${API}entity.searchEntities?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: { searchQuery: query, limit: 100, entityTypeOf: ['COMMITTEE'], alwaysRespectPiiRedaction: true } } }))}`;
  const res = await fetchFn(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`searchEntities: HTTP ${res.status}`);
  const list = (await res.json())[0]?.result?.data?.json ?? [];
  return list.map((e) => ({ id: e.id, name: e.name, type: e.committee?.committeeType?.name ?? '' }));
}

/** The committee's registration as its page shows it: { office, district, party }. */
export function parseRegistrant(html) {
  const field = (label) => {
    // Server-rendered: <p class="…">Office</p><p class="…">Governor</p>; else the page's data payload.
    const m = html.match(new RegExp(`>${label}</p><p class="[^"]+">([^<]*)</p>`)) ?? html.match(new RegExp(`\\\\"children\\\\":\\\\"${label}\\\\"\\}\\],\\[\\\\"\\$\\\\",\\\\"\\$L\\w+\\\\",null,\\{[^}]*?\\\\"children\\\\":\\\\"([^\\\\"]*)\\\\"`));
    return m ? m[1].trim() : '';
  };
  const district = field('District');
  // District numbers are zero-padded on the page ("District No. 01").
  return { office: field('Office'), district: district.match(/District No\. (\d+)/)?.[1]?.replace(/^0+(?=\d)/, '') ?? '', party: field('Party') };
}

/** The page's party and ours name the same party ("Democratic" ~ "Democratic Party"); unknown on either side passes. */
export function sameParty(theirs, ours) {
  const key = (p) => (/democrat/i.test(p) ? 'D' : /republican/i.test(p) ? 'R' : /libertarian/i.test(p) ? 'L' : /green/i.test(p) ? 'G' : /constitution/i.test(p) ? 'C' : /independent|no party|non.?partisan|unaffiliated/i.test(p) ? 'I' : '');
  const a = key(theirs ?? ''), b = key(ours ?? '');
  return !a || !b || a === b;
}

const fetchPage = async (fetchFn, url) => {
  const res = await fetchFn(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
};

// Words a committee name is made of besides the candidate's own ("Taxpayers for Marklein", "Friends of Robyn Vining").
const STOP = new Set(['friends', 'of', 'for', 'committee', 'comm', 'elect', 're', 'reelect', 'the', 'citizens', 'taxpayers', 'neighbors', 'people', 'team', 'vote', 'to', 'with', 'campaign', 'fund', 'wisconsin', 'wi', 'a', 'and', 'senate', 'assembly', 'assem', 'assm', 'state', 'rep', 'representative', 'governor', 'treasurer', 'attorney', 'general', 'district', 'dist', 'madison', 'better', 'tomorrow', 'our', 'future', 'justice', 'judge', 'in', 'on', 'us', 'all', 'go', 'goes', 'run', 'win', 'now', '2026', '2025', '2024']);
/**
 * Does the committee's name fit the person: the surname as a word, with any
 * name-shaped words before it agreeing with the first name ("T E Pronschinske":
 * initials count when one is the first name's); or, with no surname, the first
 * name opening the committee's name ("Cory for Senate", "Friends of Cory").
 */
export function nameFits(committee, candidate) {
  const p = parts(candidate);
  const first = p[0], last = p.at(-1);
  const words = parts(committee);
  if (!last) return false;
  if (words.includes(last)) {
    const before = words.slice(0, words.indexOf(last)).filter((w) => !STOP.has(w) && !/^\d/.test(w));
    const full = before.filter((w) => w.length > 1), initials = before.filter((w) => w.length === 1);
    if (full.length) return full.some((w) => sameFirst(w, first));
    return !initials.length || initials.includes(first[0]);
  }
  const named = words.filter((w) => !STOP.has(w) && !/^\d/.test(w));
  return named.length === 1 && sameFirst(named[0], first);
}
/** The committee's name carries the surname. */
export const namesSurname = (committee, candidate) => parts(committee).includes(parts(candidate).at(-1));
/** The committee's name carries the candidate's first name too ("Joel Kitchens for Assembly"). */
export const namesFirst = (committee, candidate) => parts(committee).some((w) => sameFirst(w, parts(candidate)[0]));

/**
 * Attach `money` ({ source: 'WISC', id, raised, spent, through }) to each
 * state candidate whose committee the system lists.
 */
export async function addStateMoney(races, { fetchFn = fetch, pause = PAUSE_MS } = {}) {
  const started = Date.now();
  const log = [];
  let matched = 0, total = 0, unreached = 0, committees = 0;
  for (const race of races) {
    const office = OFFICE[race.office.replace(/,.*$/, '')];
    if (!office) continue;
    const district = race.area ? String(race.area.id) : '';
    for (const c of race.candidates) {
      total++;
      if (Date.now() - started > BUDGET_MS) { unreached++; continue; }
      try {
        const [first, surname] = [parts(c.name)[0], parts(c.name).at(-1)];
        let found = (await searchCommittees(fetchFn, surname)).filter((k) => CANDIDATE_TYPES.has(k.type) && nameFits(k.name, c.name));
        await sleep(pause);
        // No committee carries the surname: one named by the first name alone must then also match the party.
        if (!found.length && first.length >= 3) {
          found = (await searchCommittees(fetchFn, first)).filter((k) => CANDIDATE_TYPES.has(k.type) && nameFits(k.name, c.name)).slice(0, 8);
          await sleep(pause);
        }
        const hits = [];
        for (const k of found) {
          const reg = parseRegistrant(await fetchPage(fetchFn, committeePage(k.id)));
          await sleep(pause);
          if (reg.office !== office || (district && reg.district !== district)) continue;
          if (!sameParty(reg.party, c.party)) { if (namesSurname(k.name, c.name)) log.push(`${c.name}: ${k.name} is registered ${reg.party}; not used`); continue; }
          hits.push(k);
        }
        // Two people with one surname in one race: only committees naming our first name count then.
        if (hits.length > 1 && hits.some((k) => namesFirst(k.name, c.name)) && !hits.every((k) => namesFirst(k.name, c.name))) hits.splice(0, hits.length, ...hits.filter((k) => namesFirst(k.name, c.name)));
        if (!hits.length) { if (process.env.KYB_DEBUG) log.push(`  ${c.name} (${office} ${district}): ${found.length ? 'candidates found but none for this office/district: ' + found.map((k) => k.name).join('; ') : 'no committee with the surname'}`); continue; }
        committees += hits.length;
        let raised = 0, spent = 0, through = '';
        for (const k of hits) {
          const [gave, spend, reports] = await Promise.all([
            call(fetchFn, 'publicFrontendApi.getCommitteeYearOverYearDonations', { committeeEntityId: k.id }),
            call(fetchFn, 'publicFrontendApi.getCommitteeYearOverYearSpends', { committeeEntityId: k.id }),
            call(fetchFn, 'publicFrontendApi.getCommitteeLatestReports', { committeeEntityId: k.id }),
          ]);
          await sleep(pause);
          raised += gave.filter((y) => YEARS.includes(y.year)).reduce((n, y) => n + dollars(y.amount), 0);
          spent += spend.filter((y) => YEARS.includes(y.year)).reduce((n, y) => n + dollars(y.amount), 0);
          // The latest period a submitted report covers (a report's period can end after today; those aren't filed yet).
          const today = new Date().toISOString();
          const end = reports.filter((r) => r.submitted).map((r) => r.reportTemplate?.transactionsEndDate ?? '').filter((d) => d && d <= today).sort().at(-1) ?? '';
          if (end > through) through = end;
        }
        // No report submitted for this cycle yet: nothing to show (the figures would be empty or stale).
        if (through < '2025-01-01') { if (process.env.KYB_DEBUG) log.push(`  ${c.name}: ${hits.map((k) => k.name).join(', ')} has no 2025–2026 report yet`); continue; }
        c.money = { source: 'WISC', id: hits.map((k) => String(k.id)).join('+'), raised, spent, through: mdy(through) };
        if (hits.length > 1) log.push(`${c.name}: ${hits.length} committees summed (${hits.map((k) => k.name).join(', ')})`);
        matched++;
      } catch (e) { log.push(`${c.name}: ${e.message}`); }
    }
  }
  if (unreached) log.push(`${unreached} candidates not reached in the ${BUDGET_MS / 60_000}-minute budget`);
  return { matched, total, committees, log };
}

// Standalone: `node scripts/wisconsin/sunshine.mjs [--write]` against the committed data.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const file = new URL('../../src/data/wisconsin/ballot.json', import.meta.url);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const r = await addStateMoney(data.races);
  console.log(`Sunshine: matched ${r.matched}/${r.total} candidates (${r.committees} committees)`);
  for (const l of r.log) console.log('  ' + l);
  if (process.argv.includes('--write')) writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}
