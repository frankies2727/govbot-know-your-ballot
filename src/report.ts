// "Report a mistake": every race, candidate, judge and measure links to a
// GitHub issue pre-filled with where the reader was and what they were
// looking at, using the wrong-information template's fields, and to an
// email with the same text for readers without a GitHub account. Readers are
// the fact-checkers; one tap should be all it costs them.

export const REPO = 'https://github.com/frankies2727/govbot-know-your-ballot';
export const REPORT_EMAIL = 'chn.govbot@gmail.com';

/** The state the reader is in, from the address ("/illinois/ballot" → "Illinois"). */
function stateName(): string {
  const seg = location.pathname.split('/')[1] ?? '';
  return seg ? seg[0].toUpperCase() + seg.slice(1) : '';
}

export interface ReportAbout { /** The contest ("Governor", "Retain Jane Roe?"). */ what: string; /** The person, when there is one. */ name?: string; /** The card to link back to (`#race=<id>`). */ id?: string }

/** The GitHub issue and the email, each pre-filled with where the reader was. */
export function reportLinks({ what, name, id }: ReportAbout): { github: string; email: string } {
  const state = stateName();
  const page = `${location.origin}${location.pathname}${id ? `#race=${encodeURIComponent(id)}` : ''}`;
  const title = `Wrong info: ${[state, what, name].filter(Boolean).join(' · ')}`;
  const fields = [
    `Where: ${page}`,
    `Race: ${what}`,
    ...(name ? [`Name: ${name}`] : []),
    '',
    'What it shows:',
    '',
    '',
    'What is correct, with a link to an official or primary source (election authority, the candidate’s own site or filing, the court’s list, Ballotpedia, Wikipedia):',
    '',
    '',
  ];
  const body = fields.join('\n') + 'Thank you. Mistakes about real people are fixed first. Every piece shown comes from a source named next to it; if the source itself is wrong, say so and we’ll stop reading that field from it.';
  const q = new URLSearchParams({ template: 'wrong-information.md', labels: 'wrong-information,data', title, body: body.replace(/^(Where|Race|Name|What it shows|What is correct)/gm, '**$1**') });
  return {
    github: `${REPO}/issues/new?${q}`,
    email: `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
  };
}
