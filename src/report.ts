// "Report a mistake": a form on the site files the report as a GitHub issue
// through api/report.ts (so a reader needs no account), pre-filled with
// where they were; the GitHub issue form stays as the way in for people who
// prefer it. Readers are the fact-checkers; one tap should be all it costs.

export const REPO = 'https://github.com/frankies2727/govbot-know-your-ballot';

/** The state the reader is in, from the address ("/illinois/ballot" → "Illinois"). */
export function stateName(): string {
  const seg = location.pathname.split('/')[1] ?? '';
  return seg ? seg[0].toUpperCase() + seg.slice(1) : '';
}

export interface ReportAbout { /** The contest ("Governor", "Retain Jane Roe?"). */ what: string; /** The person, when there is one. */ name?: string; /** The card to link back to (`#race=<id>`). */ id?: string }

/** The address of the card the reader was looking at. */
export function pageUrl(id?: string): string {
  return `${location.origin}${location.pathname}${id ? `#race=${encodeURIComponent(id)}` : ''}`;
}

/** The GitHub new-issue form, pre-filled with where the reader was. */
export function githubIssueUrl({ what, name, id }: ReportAbout): string {
  const title = `Wrong info: ${[stateName(), what, name].filter(Boolean).join(' · ')}`;
  const body = [`**Where:** ${pageUrl(id)}`, `**Race:** ${what}`, ...(name ? [`**Name:** ${name}`] : []), '', '**What it shows:**', '', '', '**What is correct**, with a link to an official or primary source:', '', ''].join('\n');
  return `${REPO}/issues/new?${new URLSearchParams({ template: 'wrong-information.md', labels: 'wrong-information,data', title, body })}`;
}

export interface ReportFields extends ReportAbout { shows: string; correct: string; source: string; /** Honeypot: a real reader never fills it. */ website: string; /** When the form opened (ms), to spot a bot filling it in no time. */ opened: number }

/** File the report. Resolves to the issue's address, or throws with a reader-facing message. */
export async function sendReport(f: ReportFields): Promise<{ number: number; url: string }> {
  const r = await fetch('/api/report', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...f, state: stateName(), page: pageUrl(f.id) }),
  });
  const data = (await r.json().catch(() => ({}))) as { number?: number; url?: string; error?: string };
  if (!r.ok || !data.url) throw new Error(data.error || (r.status === 503 ? 'Reports aren’t set up on this copy of the site yet.' : 'The report couldn’t be sent.'));
  return { number: data.number!, url: data.url };
}
