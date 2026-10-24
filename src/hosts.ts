export type GuideState = 'illinois' | 'michigan';

/** The public address of a state's guide (its landing page), for share cards, resume links and the link between the guides. */
export function guideUrl(state: GuideState): string {
  return `${location.origin}/${state}`;
}

/** govbot's legislation explorer: `#state=il&q=<name>` lists every bill carrying a name. */
export const GOVBOT_LEGISLATION = 'https://chihacknight.github.io/govbot/dashboard/legislation.html';
