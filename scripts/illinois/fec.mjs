// Campaign money for federal candidates, from the FEC's key-free bulk
// "all candidates" summary (weball26.txt, pipe-delimited, no header), and
// the outside spending for or against them: the "contributions from
// committees to candidates & independent expenditures" file (itpas2.txt),
// whose 24E rows are independent expenditures supporting a candidate and
// 24A rows ones opposing them, named by the committee master (cm.txt).
// https://www.fec.gov/campaign-finance-data/all-candidates-file-description/
// https://www.fec.gov/campaign-finance-data/contributions-committees-candidates-file-description/
// https://www.fec.gov/campaign-finance-data/committee-master-file-description/

import { namesAgree } from '../ballotpedia-profiles.mjs';

const COL = { id: 0, name: 1, ici: 2, receipts: 5, spent: 7, cash: 10, state: 18, district: 19, through: 27 };
const SUFFIX = /^(jr|sr|ii|iii|iv|mr|mrs|ms|dr)$/;

const words = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s-]/g, ' ').split(/[\s-]+/).filter((w) => w && !SUFFIX.test(w));

export function parseWeball(text) {
  return text.split('\n').filter(Boolean).map((line) => {
    const f = line.split('|');
    const [last, rest = ''] = f[COL.name].split(',');
    return {
      id: f[COL.id],
      office: f[COL.id][0], // H or S
      last: words(last),
      first: words(rest),
      ici: f[COL.ici],
      receipts: Number(f[COL.receipts]) || 0,
      spent: Number(f[COL.spent]) || 0,
      cash: Number(f[COL.cash]) || 0,
      state: f[COL.state],
      district: f[COL.district],
      through: f[COL.through],
    };
  });
}

// Match one ballot name to an FEC record in the same race. Returns null unless
// the match is unambiguous — showing no money beats showing someone else's.
export function matchCandidate(name, office, district, records, state = 'IL') {
  const pool = records.filter((r) => r.state === state && r.office === office && r.district === district);
  const w = words(name);
  if (!w.length) return null;
  const last = w[w.length - 1];
  let hits = pool.filter((r) => r.last.includes(last) || r.last.join('') === w.slice(-2).join(''));
  // The first name has to agree too, even with one surname match: a lone
  // "GARCIA" record in the district could be the other Garcia's.
  const first = w[0].slice(0, 3);
  hits = hits.filter((r) => !r.first.length || r.first.some((f) => f.startsWith(first) || first.startsWith(f.slice(0, 3))) || namesAgree(name, `${r.first.join(' ')} ${r.last.join(' ')}`));
  // The same person sometimes has several committees/IDs; they share a name,
  // so keep the one with the latest report.
  const people = new Set(hits.map((r) => `${r.last.join(' ')}|${r.first[0] ?? ''}`));
  if (!hits.length || people.size > 1) return null;
  const best = hits.sort((a, b) => toDate(b.through) - toDate(a.through) || b.receipts - a.receipts)[0];
  return {
    incumbent: best.ici === 'I',
    money: {
      source: 'FEC',
      id: best.id,
      raised: Math.round(best.receipts),
      spent: Math.round(best.spent),
      cash: Math.round(best.cash),
      through: best.through, // MM/DD/YYYY
    },
  };
}

const toDate = (mdy) => {
  const [m, d, y] = (mdy || '').split('/').map(Number);
  return y ? Date.UTC(y, m - 1, d) : 0;
};

// Attach `money` to every federal candidate the FEC file can vouch for.
// The Senate race is the one called "United States Senator"; House races are
// the ones with a congressional district.
export function addFederalMoney(races, records, state = 'IL') {
  let matched = 0;
  let total = 0;
  for (const race of races) {
    let office = null;
    let district = null;
    if (race.office === 'United States Senator') { office = 'S'; district = '00'; }
    else if (race.area?.type === 'cd') { office = 'H'; district = race.area.id.padStart(2, '0'); }
    if (!office) continue;
    for (const c of race.candidates) {
      total += 1;
      const hit = matchCandidate(c.name, office, district, records, state);
      if (hit) {
        c.money = hit.money;
        if (hit.incumbent) c.incumbent = true;
        matched += 1;
      }
    }
  }
  return { matched, total };
}

// ---- outside spending ---------------------------------------------------------

export const FEC_PAS2 = 'https://www.fec.gov/files/bulk-downloads/2026/pas226.zip';
export const FEC_COMMITTEES = 'https://www.fec.gov/files/bulk-downloads/2026/cm26.zip';
const PAS = { cmte: 0, type: 5, date: 13, amount: 14, cand: 16 };
const TOP = 6;

/** Committee id -> name, from cm.txt. */
export function parseCommittees(text) {
  const out = new Map();
  for (const line of text.split('\n')) { const f = line.split('|'); if (f[0] && f[1]) out.set(f[0], f[1].trim()); }
  return out;
}

/** The independent expenditures in itpas2.txt: [{ cmte, cand, support, amount, date: 'YYYY-MM-DD' }]. */
export function parsePas2(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const f = line.split('|');
    const type = f[PAS.type];
    if (type !== '24A' && type !== '24E') continue;
    const d = f[PAS.date] ?? '';
    out.push({ cmte: f[PAS.cmte], cand: f[PAS.cand], support: type === '24E', amount: Number(f[PAS.amount]) || 0, date: d.length === 8 ? `${d.slice(4)}-${d.slice(0, 2)}-${d.slice(2, 4)}` : '' });
  }
  return out;
}

/**
 * Attach `outside` to each federal candidate with an FEC id: what outside
 * groups (PACs, parties) spent for and against them this cycle, with the
 * biggest spenders. Groups may not coordinate with the campaign; the
 * figures are the FEC's processed filings, so they lag the 24/48-hour
 * reports by days.
 */
export function addOutsideSpending(races, rows, names) {
  const today = new Date().toISOString().slice(0, 10);
  const byCand = new Map();
  let through = '';
  for (const r of rows) {
    if (!r.cand || r.date > today) continue;
    if (r.date > through) through = r.date;
    let m = byCand.get(r.cand);
    if (!m) { m = new Map(); byCand.set(r.cand, m); }
    const g = m.get(r.cmte) ?? { name: names.get(r.cmte) ?? r.cmte, support: 0, oppose: 0 };
    g[r.support ? 'support' : 'oppose'] += r.amount;
    m.set(r.cmte, g);
  }
  const mdy = through ? `${through.slice(5, 7)}/${through.slice(8, 10)}/${through.slice(0, 4)}` : '';
  let matched = 0, total = 0;
  for (const race of races) for (const c of race.candidates) {
    if (c.money?.source !== 'FEC') continue;
    total++;
    delete c.outside;
    const groups = [...(byCand.get(c.money.id)?.values() ?? [])].map((g) => ({ name: g.name, support: Math.max(0, Math.round(g.support)), oppose: Math.max(0, Math.round(g.oppose)) })).filter((g) => g.support || g.oppose);
    if (!groups.length) continue;
    groups.sort((a, b) => b.support + b.oppose - a.support - a.oppose);
    c.outside = {
      support: groups.reduce((n, g) => n + g.support, 0),
      oppose: groups.reduce((n, g) => n + g.oppose, 0),
      groups: groups.slice(0, TOP),
      through: mdy,
      url: `https://www.fec.gov/data/independent-expenditures/?candidate_id=${c.money.id}&cycle=2026&data_type=processed`,
    };
    matched++;
  }
  return { matched, total, through: mdy };
}

/** Download and read the two files into `dir`; returns what addOutsideSpending needs. */
export async function fetchOutside(dir, download, unzip) {
  await download(FEC_PAS2, `${dir}/pas2.zip`);
  await download(FEC_COMMITTEES, `${dir}/cm.zip`);
  unzip(`${dir}/pas2.zip`, dir);
  unzip(`${dir}/cm.zip`, dir);
  const { readFileSync } = await import('node:fs');
  return { rows: parsePas2(readFileSync(`${dir}/itpas2.txt`, 'utf8')), names: parseCommittees(readFileSync(`${dir}/cm.txt`, 'latin1')) };
}

/** Yesterday's `outside` for anyone who has none today (the download failed), like money-forward. */
export function keepOutsideForward(races, prev) {
  const before = new Map((prev?.races ?? []).flatMap((r) => r.candidates.filter((c) => c.outside).map((c) => [`${r.id}|${c.name}`, c.outside])));
  let kept = 0;
  for (const r of races) for (const c of r.candidates) {
    const old = before.get(`${r.id}|${c.name}`);
    if (old && !c.outside) { c.outside = old; kept++; }
  }
  return kept;
}

// Standalone: `node scripts/illinois/fec.mjs <illinois|michigan|minnesota|wisconsin> [--write]` attaches outside spending to the committed data.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const { readFileSync, writeFileSync, mkdtempSync, createWriteStream } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { Readable } = await import('node:stream');
  const { pipeline } = await import('node:stream/promises');
  const state = process.argv[2];
  const file = new URL(`../../src/data/${state}/ballot.json`, import.meta.url);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const work = mkdtempSync(join(tmpdir(), 'fec-'));
  const download = async (url, out) => { const res = await fetch(url, { redirect: 'follow' }); if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`); await pipeline(Readable.fromWeb(res.body), createWriteStream(out)); };
  const { rows, names } = await fetchOutside(work, download, (zip, dir) => execFileSync('unzip', ['-o', '-q', zip, '-d', dir]));
  const r = addOutsideSpending(data.races, rows, names);
  console.log(`Outside spending: ${r.matched}/${r.total} federal candidates, through ${r.through}`);
  for (const race of data.races) for (const c of race.candidates) if (c.outside) console.log(`  ${race.id} | ${c.name}: $${c.outside.support} for, $${c.outside.oppose} against; ${c.outside.groups.slice(0, 3).map((g) => `${g.name} (${g.support ? '+' + g.support : ''}${g.oppose ? '-' + g.oppose : ''})`).join('; ')}`);
  if (process.argv.includes('--write')) writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}
