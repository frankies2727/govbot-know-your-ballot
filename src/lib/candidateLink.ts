import { guidePath, type GuideId } from '../hosts';

// Every candidate in every guide has an address of their own:
// /2027-02/chicago/candidates/mayor/john-kelly — the guide's address, the
// race's id and the candidate's name, folded to plain letters. The build
// writes a readable page there for search engines and AI assistants
// (scripts/seo/candidate-pages.ts); in the app the same address opens the
// guide with that candidate's profile (CandidateLink.tsx). Shared by both, so
// a link the Share button makes is always a page that exists.

/** "José Ramírez Jr." -> "jose-ramirez-jr". */
export const nameSlug = (name: string) =>
  name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** A candidate's address on the site: "/2027-02/chicago/candidates/mayor/john-kelly". */
export const candidatePath = (guide: GuideId, raceId: string, name: string) => `${guidePath(guide)}/candidates/${raceId}/${nameSlug(name)}`;

/** The app's route for a candidate's address: guide id, race id, name slug. */
export const CANDIDATE_ROUTE = /^projects\/know-your-ballot-([a-z0-9-]+)\/candidates\/([a-z0-9-]+)\/([a-z0-9-]+)$/;
