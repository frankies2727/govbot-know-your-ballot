// Illinois' official results: the State Board of Elections' vote totals
// (elections.il.gov), posted after the canvass. Its vote-totals page shows the
// newest election first; once that's the general, its tabs (federal and
// statewide, the state Senate, the state House, judicial) list each contest's
// statewide totals: a title, then candidate, party, votes and percent rows.

export const SOURCE = { name: 'Illinois State Board of Elections', url: 'https://www.elections.il.gov/ElectionOperations/ElectionVoteTotals.aspx' };
const BASE = 'https://www.elections.il.gov/ElectionOperations/';
const TABS = ['hypFederalStatewide', 'hypSenate', 'hypDistrictAll', 'hypJudicial'];

/** The page's lines of text. */
const lines = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, '\n').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').split('\n').map((l) => l.trim()).filter(Boolean);

/** The election the page is showing ("2026 GENERAL ELECTION"), and its tabs' links. */
export function page(html) {
  const election = html.match(/<option selected="selected" value="\d+">([^<]+)/)?.[1]?.trim() ?? null;
  const tabs = TABS.map((id) => html.match(new RegExp(`id="ContentPlaceHolder1_${id}"[^>]*href="([^"]+)"`))?.[1]?.replace(/&amp;/g, '&')).filter(Boolean);
  return { election, tabs };
}

/** Each contest on a tab: { office, rows: [{ name, party, votes }], total }. */
export function contests(html) {
  const l = lines(html);
  const out = [];
  for (let i = 0; i < l.length; i++) {
    // A title is followed (after an optional "Download Results") by the column heads.
    const at = l[i + 1] === 'Download Results' ? i + 2 : i + 1;
    if (l[at] !== 'Candidate' || l[at + 1] !== 'Party' || l[at + 2] !== 'Total Votes') continue;
    const rows = [];
    let j = at + 4; // past "Percent of …"
    while (j + 2 < l.length && /^[\d,]+$/.test(l[j + 2])) {
      rows.push({ name: l[j], party: l[j + 1], votes: Number(l[j + 2].replace(/,/g, '')), writeIn: false });
      j += /%$/.test(l[j + 3] ?? '') ? 4 : 3;
    }
    if (rows.length) out.push({ office: l[i], rows, total: rows.reduce((s, r) => s + r.votes, 0) });
    i = j - 1;
  }
  return out;
}

/** The general's contests, or null while the State Board hasn't posted it. */
export async function read(get, year) {
  const first = page((await get(`${BASE}ElectionVoteTotals.aspx`)).text);
  if (first.election !== `${year} GENERAL ELECTION`) return null;
  const all = [];
  for (const tab of first.tabs) all.push(...contests((await get(BASE + tab)).text));
  return { source: SOURCE, contests: all, official: true };
}
