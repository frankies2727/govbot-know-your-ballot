export type GuideState = 'illinois' | 'michigan' | 'minnesota' | 'wisconsin';

/** Every state with a guide, for the links between them. */
export const GUIDES: { id: GuideState; name: string }[] = [
  { id: 'illinois', name: 'Illinois' }, { id: 'michigan', name: 'Michigan' }, { id: 'minnesota', name: 'Minnesota' }, { id: 'wisconsin', name: 'Wisconsin' },
];

/** The election the state guides cover; past it, they read as the record of that ballot ("ran", "was on"). */
export const GUIDE_ELECTION_DAY = '2026-11-03';
export const GUIDE_CYCLE = GUIDE_ELECTION_DAY.slice(0, 7);
export const GUIDE_STATES: GuideState[] = ['illinois', 'michigan', 'minnesota', 'wisconsin'];

/** Every guide: a state's Nov 2026 guide, or a later election's (Chicago's Feb 2027 city election). */
export type GuideId = GuideState | 'chicago-2027';

/**
 * Each guide's address names its election and its place: /2026-11/michigan
 * (its ballot at /2026-11/michigan/ballot), /2027-02/chicago. A new election
 * is one line here. The old /michigan addresses redirect (vercel.json, and
 * lib/router.ts in the browser).
 */
export const GUIDE_PATHS: Record<GuideId, string> = {
  illinois: `${GUIDE_CYCLE}/illinois`, michigan: `${GUIDE_CYCLE}/michigan`, minnesota: `${GUIDE_CYCLE}/minnesota`, wisconsin: `${GUIDE_CYCLE}/wisconsin`,
  'chicago-2027': '2027-02/chicago',
};

/** A guide's path: "/2026-11/michigan", or its ballot "/2026-11/michigan/ballot". */
export const guidePath = (id: GuideId, ballot = false) => `/${GUIDE_PATHS[id]}${ballot ? '/ballot' : ''}`;

/** The public address of a guide (its landing page), for share cards, resume links and the links between the guides. */
export function guideUrl(id: GuideId): string {
  return `${location.origin}${guidePath(id)}`;
}

/** govbot's legislation explorer: `#state=il&q=<name>` lists every bill carrying a name. */
export const GOVBOT_LEGISLATION = 'https://chihacknight.github.io/govbot/dashboard/legislation.html';
