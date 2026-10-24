// POST /api/report — files a reader's "wrong information" report as a GitHub
// issue, so nobody needs a GitHub account to correct the site. Runs as a
// Vercel function; the only secret is GITHUB_REPORT_TOKEN (a fine-grained
// token with Issues: read and write on this one repository), set in the
// Vercel project's environment variables, never in the repo or the browser.
//
// Against spam and abuse, without a database or a captcha service:
// - a honeypot field (`website`) a person never sees; filled → dropped
// - a form submitted under 5 seconds after opening → dropped
// - every field length-capped, the source must be an http(s) link, the page
//   must be one of ours
// - at most 3 reports per address and 40 per hour per server instance
// Dropped reports still get a 200, so a bot learns nothing.

const REPO = 'frankies2727/govbot-know-your-ballot';
const SITE = /^https:\/\/(govbot-know-your-ballot\.vercel\.app|[a-z0-9-]+\.vercel\.app|localhost(:\d+)?)\//i;
const PER_IP = 3, PER_INSTANCE = 40, WINDOW_MS = 60 * 60 * 1000, MIN_FILL_MS = 5_000;

interface Req { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined> }
interface Res { status(code: number): Res; json(body: unknown): void; setHeader(name: string, value: string): void }

const hits = new Map<string, number[]>();
function allowed(ip: string): boolean {
  const now = Date.now();
  for (const [k, v] of hits) { const live = v.filter((t) => now - t < WINDOW_MS); if (live.length) hits.set(k, live); else hits.delete(k); }
  const mine = hits.get(ip) ?? [], all = [...hits.values()].reduce((n, v) => n + v.length, 0);
  if (mine.length >= PER_IP || all >= PER_INSTANCE) return false;
  hits.set(ip, [...mine, now]);
  return true;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req: Req, res: Res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const token = process.env.GITHUB_REPORT_TOKEN;
  if (!token) return res.status(503).json({ error: 'Reports aren’t set up on this copy of the site yet.' });

  const b = (typeof req.body === 'string' ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  if (!b) return res.status(400).json({ error: 'Bad request' });
  const f = {
    state: str(b.state, 40), what: str(b.what, 200), name: str(b.name, 120), page: str(b.page, 400),
    shows: str(b.shows, 2000), correct: str(b.correct, 3000), source: str(b.source, 500), website: str(b.website, 200),
    opened: typeof b.opened === 'number' ? b.opened : 0,
  };
  const ip = (String(req.headers['x-forwarded-for'] ?? '').split(',')[0] || 'unknown').trim();
  const ok = f.website === '' && Date.now() - f.opened >= MIN_FILL_MS && allowed(ip);
  if (!f.what || !f.shows || !f.correct) return res.status(400).json({ error: 'Please say what it shows and what is correct.' });
  if (!/^https?:\/\/\S+$/i.test(f.source)) return res.status(400).json({ error: 'Please add a link to a source (an official or primary page).' });
  if (!SITE.test(f.page)) return res.status(400).json({ error: 'Bad request' });
  if (!ok) return res.status(200).json({ number: 0, url: 'https://github.com/' + REPO + '/issues' });

  const title = `Wrong info: ${[f.state, f.what, f.name].filter(Boolean).join(' · ')}`;
  const body = [
    `**Where:** ${f.page}`, `**Race:** ${f.what}`, ...(f.name ? [`**Name:** ${f.name}`] : []), '',
    '**What it shows:**', '', quote(f.shows), '',
    '**What is correct:**', '', quote(f.correct), '',
    `**Source:** ${f.source}`, '',
    '_Sent from the site’s "Report a mistake" form. Mistakes about real people are fixed first._',
  ].join('\n');
  const r = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'govbot-know-your-ballot' },
    body: JSON.stringify({ title, body, labels: ['wrong-information', 'data', 'from-site'] }),
  });
  if (!r.ok) return res.status(502).json({ error: 'The report couldn’t be filed right now.' });
  const issue = (await r.json()) as { number: number; html_url: string };
  return res.status(200).json({ number: issue.number, url: issue.html_url });
}

function safeJson(s: string): unknown { try { return JSON.parse(s); } catch { return null; } }
/** Reader text as a Markdown quote, so nothing in it can format the issue. */
function quote(s: string): string { return s.split('\n').map((l) => `> ${l}`).join('\n'); }
