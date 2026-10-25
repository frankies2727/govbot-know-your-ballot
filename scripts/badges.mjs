// The README's badges, drawn here as SVG files (public/badges/*.svg) so each
// can carry a coloured outline, which shields.io images can't. The daily
// refresh workflows run this before their data commit, so the live values
// (workflow status, last refresh, issue counts) are a day old at most.
//   node scripts/badges.mjs            writes public/badges/*.svg
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/badges/', import.meta.url);
const REPO = 'frankies2727/govbot-know-your-ballot';
const API = `https://api.github.com/repos/${REPO}`;
const SITE = 'https://govbot-know-your-ballot.vercel.app';
// The outline colours, in this order, around the badges in README order.
const OUTLINES = ['#61BB46', '#FDB827', '#F5821F', '#E03A3E', '#963D97', '#009DDC'];
const GREEN = '#4c1', RED = '#e05d44', GREY = '#9f9f9f', BLUE = '#007ec6', PURPLE = '#7057ff', LEAF = '#0e8a16', GOVBOT = '#3DDC84';

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'KnowYourBallot/1.0', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
async function json(url) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}
const tryJson = (url) => json(url).catch((e) => { console.warn(e.message); return null; });

/** "passing" / "failing" / "no status" from a workflow's latest completed run. */
async function workflowStatus(file) {
  const r = await tryJson(`${API}/actions/workflows/${file}/runs?status=completed&per_page=1`);
  const c = r?.workflow_runs?.[0]?.conclusion;
  return c === 'success' ? ['passing', GREEN] : c ? ['failing', RED] : ['no status', GREY];
}
/** "today" / "yesterday" / "N days ago", like shields' last-commit badge. */
function ago(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}
async function openIssues(label) {
  const r = await tryJson(`${API}/issues?labels=${encodeURIComponent(label)}&state=open&per_page=100`);
  return r ? String(r.filter((i) => !i.pull_request).length) : '?';
}
async function siteUp() {
  try { const res = await fetch(SITE, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15_000) }); return res.ok; } catch { return false; }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// Verdana 11px averages ~6.3px a character; close enough for a badge.
const textWidth = (s) => Math.round([...s].reduce((w, ch) => w + (/[ilj.' ]/.test(ch) ? 3.5 : /[mwMW]/.test(ch) ? 9.5 : /[A-Z0-9]/.test(ch) ? 7.3 : 6.3), 0));
/** A flat shields-style badge with a 2px outline. */
function badge(label, value, color, outline) {
  const lw = textWidth(label) + 12, vw = textWidth(value) + 12, w = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(value)}">
<title>${esc(label)}: ${esc(value)}</title>
<clipPath id="r"><rect width="${w}" height="20" rx="4"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${lw / 2}" y="14">${esc(label)}</text><text x="${lw + vw / 2}" y="14">${esc(value)}</text>
</g>
<rect x="1" y="1" width="${w - 2}" height="18" rx="4" fill="none" stroke="${outline}" stroke-width="2"/>
</svg>
`;
}

const commit = await tryJson(`${API}/commits/main`);
const badges = [
  ['live-site', 'live site', ...((await siteUp()) ? ['online', GREEN] : ['down', RED])],
  ['illinois', 'Illinois data', ...(await workflowStatus('know-your-ballot-illinois.yml'))],
  ['michigan', 'Michigan data', ...(await workflowStatus('know-your-ballot-michigan.yml'))],
  ['minnesota', 'Minnesota data', ...(await workflowStatus('know-your-ballot-minnesota.yml'))],
  ['wisconsin', 'Wisconsin data', ...(await workflowStatus('know-your-ballot-wisconsin.yml'))],
  ['data-refreshed', 'data refreshed', commit ? ago(commit.commit.committer.date) : '?', BLUE],
  ['good-first-issues', 'good first issues', await openIssues('good first issue'), PURPLE],
  ['states-wanted', 'states wanted', await openIssues('new state'), LEAF],
  ['prs', 'PRs', 'welcome', GREEN],
  ['license', 'license', 'MIT', BLUE],
  ['built-on', 'built on', 'Govbot', GOVBOT],
];
mkdirSync(OUT, { recursive: true });
badges.forEach(([file, label, value, color], i) => {
  writeFileSync(new URL(`${file}.svg`, OUT), badge(label, value, color, OUTLINES[i % OUTLINES.length]));
  console.log(`${file}: ${label} · ${value}`);
});
