// Each sitting alderperson's City Council record this term, from the City
// Clerk's legislative system (eLMS), the same official records Chicago
// Councilmatic is built on: its public, documented API
// (api.chicityclerkelms.chicago.gov, CITY OF CHICAGO LEGISLATION API).
//   - Attendance: every City Council meeting held this term, and whether
//     they were marked present at its roll call.
//   - What they introduced as lead sponsor: changes to the Municipal Code,
//     resolutions, and the ward matters (permits, signs, alleys, parking)
//     that make up most of an alderperson's filings.
//   - How they voted on each year's city budget, the Annual Appropriation
//     Ordinance, as the Council's roll call recorded it.
// No vote or item is picked by hand: the budget is chosen by its title, the
// rest is counted whole.

const API = 'https://api.chicityclerkelms.chicago.gov';
const MATTER_PAGE = 'https://chicityclerkelms.chicago.gov/Matter/?matterId=';
export const TERM_START = '2023-05-15'; // the current Council was sworn in May 15, 2023
const UA = 'KnowYourBallot/1.0 (+https://github.com/frankies2727/govbot-know-your-ballot)';
const BUDGET = /^Annual Appropriation Ordinance Year (\d{4}), as amended$/;

async function get(path, params = {}) {
  const q = new URLSearchParams(params).toString();
  const url = `${API}${path}${q ? `?${q}` : ''}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      // Some answers come back as a JSON document inside a JSON string.
      return typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      if (attempt >= 3) throw new Error(`${path}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

/** Every page of a list query. */
async function all(path, params) {
  const out = [];
  for (let skip = 0; ; skip += 500) {
    const page = await get(path, { ...params, top: '500', skip: String(skip) });
    out.push(...page.data);
    if (out.length >= (page.meta?.count ?? 0) || !page.data.length) return out;
  }
}

/** A filing's status in plain words. */
export function statusOf(m) {
  if (/^(Passed|Passed as Substitute|Adopted|Signed)$/.test(m.subStatus ?? '')) return 'Passed';
  if (m.subStatus === 'Input to Substitute') return 'Folded into a substitute';
  if (/withdrawn/i.test(m.subStatus ?? '')) return 'Withdrawn';
  if (/^4-/.test(m.status ?? '')) return 'In committee';
  return (m.statusDescription ?? m.status ?? '').replace(/^\d+-/, '');
}

const PLAIN = { 'SIGNS/SIGNBOARDS': 'signs', ALLEY: 'alleys', 'COMMENDATIONS & DECLARATIONS': 'commendations', 'ZONING RECLASSIFICATIONS': 'zoning', 'TAX INCENTIVES': 'tax incentives', 'COMMITTEE/PUBLIC HEARINGS': 'hearings' };
const top = (m) => (m.matterCategory ?? '').split(' | ')[0];
const isLaw = (m) => top(m) === 'MUNICIPAL CODE AMENDMENTS';
const isResolution = (m) => m.type === 'Resolution';
// Honors aren't policy: a commendation or tribute counts, but isn't listed.
const isHonor = (m) => /^(COMMENDATIONS & DECLARATIONS|TRIBUTES)$/.test(top(m)) || /honorary/i.test(m.matterCategory ?? '');

/** A long title cut at a word, near 220 characters; the Clerk's page has it whole. */
const clip = (t) => (t.length <= 230 ? t : `${t.slice(0, 220).replace(/\s+\S*$/, '')}…`);

/** One member's filings as lead sponsor this term, counted and the newest policy items listed. */
export function summarize(matters) {
  const law = matters.filter(isLaw);
  const resolutions = matters.filter((m) => isResolution(m) && !isLaw(m));
  const rest = matters.filter((m) => !isLaw(m) && !isResolution(m));
  const counts = {};
  for (const m of rest) {
    const cat = top(m).replace(/^VARIOUS - /, ''); // "VARIOUS - PARKING" is parking for several addresses at once
    const k = PLAIN[cat] ?? cat.toLowerCase();
    if (k) counts[k] = (counts[k] ?? 0) + 1;
  }
  const newest = (a, b) => (b.introductionDate ?? '').localeCompare(a.introductionDate ?? '');
  return {
    total: matters.length,
    law: law.length,
    lawPassed: law.filter((m) => statusOf(m) === 'Passed').length,
    resolutions: resolutions.length,
    ward: rest.length,
    wardKinds: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([kind, n]) => ({ kind, n })),
    recent: [...law, ...resolutions.filter((m) => !isHonor(m))].sort(newest).slice(0, 5).map((m) => ({
      id: m.recordNumber, title: clip((m.title ?? '').trim()), date: (m.introductionDate ?? '').slice(0, 10), status: statusOf(m), url: MATTER_PAGE + m.matterId,
    })),
  };
}

/** personId -> { present, meetings } over the meetings whose roll call lists them. */
export function attendance(meetings) {
  const out = new Map();
  for (const m of meetings) {
    const roll = (m.attendance ?? []).flatMap((a) => a.votes ?? []);
    for (const v of roll) {
      const a = out.get(v.personId) ?? { present: 0, meetings: 0 };
      a.meetings++;
      if (/^present$/i.test(v.vote)) a.present++;
      out.set(v.personId, a);
    }
  }
  return out;
}

/** The roll call that passed (or failed) a budget: { year, url, tally, votes: personId -> vote }. */
export function budgetVote(matter) {
  const year = Number(matter.title.match(BUDGET)?.[1]);
  const roll = (matter.actions ?? []).find((a) => a.actionByName === 'City Council' && (a.votes ?? []).length > 20 && /pass|fail/i.test(a.actionName ?? ''));
  if (!year || !roll) return null;
  const yea = roll.votes.filter((v) => v.vote === 'Yea').length;
  const nay = roll.votes.filter((v) => v.vote === 'Nay').length;
  return { year, url: MATTER_PAGE + matter.matterId, tally: `${yea}–${nay}`, votes: new Map(roll.votes.map((v) => [v.personId, v.vote])) };
}

/**
 * Ward number -> that ward's sitting alderperson's record. `today` bounds the
 * meetings counted (the Clerk lists scheduled meetings ahead of time).
 */
export async function councilRecords(today, log = () => {}) {
  const members = (await get('/person', { filter: 'isActive eq true', top: '100' })).data.filter((p) => /^\d+$/.test(p.ward ?? ''));
  if (members.length < 45) throw new Error(`only ${members.length} sitting alderpersons`);

  // Attendance: every City Council meeting held this term.
  const listed = await all('/meeting', { filter: `body eq 'City Council' and date gt ${TERM_START}T00:00:00Z`, sort: 'date desc' });
  const held = listed.filter((m) => m.date.slice(0, 10) <= today);
  const details = [];
  for (let i = 0; i < held.length; i += 6) details.push(...await Promise.all(held.slice(i, i + 6).map((m) => get(`/meeting/${m.meetingId}`).catch(() => null))));
  const meetings = details.filter((m) => m?.attendance?.length);
  const present = attendance(meetings);
  log(`  ${meetings.length} of ${held.length} City Council meetings held this term have a roll call`);

  // The budgets passed this term: the mayor files each one, so search the mayor's filings by year.
  const mayor = (await get('/person', { filter: 'isActive eq true', top: '100' })).data.find((p) => /mayor/i.test(p.ward ?? ''));
  const budgets = [];
  for (let y = Number(TERM_START.slice(0, 4)); y <= Number(today.slice(0, 4)); y++) {
    const filed = mayor ? await all('/matter', { filter: `filingSponsorId eq '${mayor.personId}' and fileYear eq ${y}` }).catch(() => []) : [];
    for (const m of filed.filter((x) => BUDGET.test((x.title ?? '').trim()) && x.finalActionDate)) {
      const b = budgetVote(await get(`/matter/${m.matterId}`));
      if (b) budgets.push(b);
    }
  }
  budgets.sort((a, b) => a.year - b.year);
  log(`  budget roll calls: ${budgets.map((b) => `${b.year} (${b.tally})`).join(', ') || 'none found'}`);

  const out = new Map();
  for (let i = 0; i < members.length; i += 4) {
    await Promise.all(members.slice(i, i + 4).map(async (p) => {
      const matters = await all('/matter', { filter: `filingSponsorId eq '${p.personId}' and introductionDate gt ${TERM_START}T00:00:00Z`, sort: 'introductionDate desc' })
        .then((list) => list.filter((m) => (m.introductionDate ?? '').slice(0, 10) <= today)).catch(() => null);
      if (!matters) return;
      out.set(String(+p.ward), {
        name: p.displayName.trim(),
        since: TERM_START,
        attendance: present.get(p.personId) ?? { present: 0, meetings: 0 },
        introduced: summarize(matters),
        budgets: budgets.map((b) => ({ year: b.year, vote: b.votes.get(p.personId) ?? 'Not recorded', tally: b.tally, url: b.url })),
        source: { name: 'City Clerk of Chicago: eLMS', url: 'https://chicityclerkelms.chicago.gov/' },
        asOf: today,
      });
    }));
  }
  return out;
}

