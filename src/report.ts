// "Report a mistake": every race, candidate, judge and measure links to a
// GitHub issue pre-filled with where the reader was and what they were
// looking at, using the wrong-information template's fields. Readers are the
// fact-checkers; one tap should be all it costs them.

export const REPO = 'https://github.com/frankies2727/govbot-know-your-ballot';

/** The state the reader is in, from the address ("/illinois/ballot" → "Illinois"). */
function stateName(): string {
  const seg = location.pathname.split('/')[1] ?? '';
  return seg ? seg[0].toUpperCase() + seg.slice(1) : '';
}

/**
 * The address of a new wrong-information issue about one thing on the page.
 * `what` is the contest ("Governor", "Retain Jane Roe?"), `name` the person
 * when there is one, `id` the card to link back to (`#race=<id>`).
 */
export function reportUrl({ what, name, id }: { what: string; name?: string; id?: string }): string {
  const state = stateName();
  const page = `${location.origin}${location.pathname}${id ? `#race=${encodeURIComponent(id)}` : ''}`;
  const title = `Wrong info: ${[state, what, name].filter(Boolean).join(' · ')}`;
  const body = [
    `**Where:** ${page}`,
    `**Race:** ${what}`,
    ...(name ? [`**Name:** ${name}`] : []),
    '',
    '**What it shows:**',
    '',
    '',
    '**What is correct**, with a link to an official or primary source (election authority, the candidate’s own site or filing, the court’s list, Ballotpedia, Wikipedia):',
    '',
    '',
    'Thank you. Mistakes about real people are fixed first. Every piece shown comes from a source named next to it; if the source itself is wrong, say so and we’ll stop reading that field from it.',
  ].join('\n');
  const q = new URLSearchParams({ template: 'wrong-information.md', labels: 'wrong-information,data', title, body });
  return `${REPO}/issues/new?${q}`;
}
