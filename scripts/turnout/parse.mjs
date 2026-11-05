// Reading the turnout sources for the home page's panels (src/Turnout.tsx):
// the University of Florida Election Lab's turnout page and the CSV it loads,
// and the Minnesota Secretary of State's statewide statistics. Pure functions,
// so scripts/turnout/parse.test.mjs can check them against saved pages.

export const STATES = { illinois: 'Illinois', michigan: 'Michigan', minnesota: 'Minnesota', wisconsin: 'Wisconsin' };
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** The CSV the Lab's year page loads into its table ("Turnout_2026G_v0.2.csv"), and its version (0.2); null if the page doesn't name one. */
export function labCsv(html, year) {
  const m = html.match(new RegExp(`turnoutdata\\\\?/(Turnout_${year}G_v(\\d+(?:\\.\\d+)?)\\.csv)`));
  return m ? { file: m[1], version: Number(m[2]) } : null;
}

/** The page's "Last updated: Nov. 4 @ 9:50pm" as 2026-11-04; null if it isn't there. */
export function labUpdated(html, year) {
  const m = html.replace(/<[^>]*>/g, ' ').match(/Last updated:\s*([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})/);
  const month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  return month < 0 ? null : `${year}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** A CSV line's cells (quoted cells may hold commas). */
const cells = (line) => [...line.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)].slice(0, -1).map((m) => (m[2] ?? m[1]).trim());
const num = (s) => (s && /\d/.test(s) ? Number(s.replace(/[,%\s]/g, '')) : null);

/** Each of our states' row: { ballots, eligible, pct, estimate } (estimate: the Lab's rounded first estimate). Throws if a state or column is missing. */
export function labRows(csv) {
  const lines = csv.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const head = cells(lines[0]);
  const col = (name) => { const i = head.indexOf(name); if (i < 0) throw new Error(`The Lab's CSV has no ${name} column`); return i; };
  const [b, v, r] = [col('TOTAL_BALLOTS_COUNTED'), col('VEP'), col('VEP_TURNOUT_RATE')];
  const s = head.indexOf('SOURCE');
  const out = {};
  for (const [id, name] of Object.entries(STATES)) {
    const row = lines.map(cells).find((c) => c[0] === name);
    if (!row) throw new Error(`The Lab's CSV has no row for ${name}`);
    const ballots = num(row[b]), eligible = num(row[v]), pct = num(row[r]);
    if (ballots == null || eligible == null || pct == null) { out[id] = null; continue; } // not estimated yet
    out[id] = { ballots, eligible, pct, estimate: s >= 0 && /estimate/i.test(row[s] ?? '') };
  }
  return out;
}

/** Minnesota's statewide statistics page: { ballots, eligible, pct, registered, unofficial }; null if the figures aren't on it (a bot check, say). */
export function minnesota(html) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const get = (label) => num(text.match(new RegExp(`${label}:\\s*([\\d,.]+%?)`))?.[1]);
  const eligible = get('Eligible Population'), ballots = get('(?:Estimated )?Voters'), pct = get('(?:Estimated )?Turnout'), registered = get('Voters Registered at 7AM');
  if (!eligible || !ballots || !pct) return null;
  return { ballots, eligible, pct, registered, unofficial: /Unofficial Results/i.test(text) };
}

/**
 * The year's figures checked against the same state's last election of the
 * same kind (four years before): a count that more than halves or grows by
 * half is a bad read, not turnout. Throws, naming it, so the caller keeps
 * yesterday's figures.
 */
export function check(id, next, cycles, year) {
  const before = cycles.find((c) => c.year === year - 4);
  if (!(next.pct > 15 && next.pct < 95)) throw new Error(`${id}: turnout ${next.pct}% is out of range`);
  if (before && (next.ballots < before.ballots * 0.5 || next.ballots > before.ballots * 1.5)) throw new Error(`${id}: ${next.ballots} ballots against ${before.ballots} in ${year - 4}`);
  if (before && Math.abs(next.eligible - before.eligible) > before.eligible * 0.15) throw new Error(`${id}: ${next.eligible} eligible against ${before.eligible} in ${year - 4}`);
}
