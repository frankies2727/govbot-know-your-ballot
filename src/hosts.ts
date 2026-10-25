export type GuideState = 'illinois' | 'michigan' | 'minnesota' | 'wisconsin';

/** Every state with a guide, for the links between them. */
export const GUIDES: { id: GuideState; name: string }[] = [
  { id: 'illinois', name: 'Illinois' }, { id: 'michigan', name: 'Michigan' }, { id: 'minnesota', name: 'Minnesota' }, { id: 'wisconsin', name: 'Wisconsin' },
];

/** The public address of a state's guide (its landing page), for share cards, resume links and the link between the guides. */
export function guideUrl(state: GuideState): string {
  return `${location.origin}/${state}`;
}

/** govbot's legislation explorer: `#state=il&q=<name>` lists every bill carrying a name. */
export const GOVBOT_LEGISLATION = 'https://chihacknight.github.io/govbot/dashboard/legislation.html';
