export type GuideState = 'illinois' | 'michigan' | 'minnesota' | 'wisconsin';

/** Every state with a guide, for the links between them. */
export const GUIDES: { id: GuideState; name: string }[] = [
  { id: 'illinois', name: 'Illinois' }, { id: 'michigan', name: 'Michigan' }, { id: 'minnesota', name: 'Minnesota' }, { id: 'wisconsin', name: 'Wisconsin' },
];

/**
 * The election each guide is for, as the first part of its address: a
 * guide lives at /2026-11/michigan (its ballot at /2026-11/michigan/ballot),
 * so a later election's guide gets an address of its own. The old /michigan
 * addresses redirect here (vercel.json, and lib/router.ts in the browser).
 */
/** The election the guides cover; past it, they read as the record of that ballot ("ran", "was on"). */
export const GUIDE_ELECTION_DAY = '2026-11-03';
export const GUIDE_CYCLE = GUIDE_ELECTION_DAY.slice(0, 7);
export const GUIDE_STATES: GuideState[] = ['illinois', 'michigan', 'minnesota', 'wisconsin'];

/** A guide's path: "/2026-11/michigan", or its ballot "/2026-11/michigan/ballot". */
export const guidePath = (state: GuideState, ballot = false) => `/${GUIDE_CYCLE}/${state}${ballot ? '/ballot' : ''}`;

/** The public address of a state's guide (its landing page), for share cards, resume links and the link between the guides. */
export function guideUrl(state: GuideState): string {
  return `${location.origin}${guidePath(state)}`;
}

/** govbot's legislation explorer: `#state=il&q=<name>` lists every bill carrying a name. */
export const GOVBOT_LEGISLATION = 'https://chihacknight.github.io/govbot/dashboard/legislation.html';
