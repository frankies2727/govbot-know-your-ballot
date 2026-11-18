import { createContext, useContext } from 'react';
import type { StateData } from './guide/types';
import type { CandidateBrief } from './types';

// The hand-read briefs (who a candidate or seat holder is, what they'd work on,
// their words) are most of a guide's text, so they ship in their own file,
// src/data/<guide>/briefs.json (scripts/briefs.mjs), keyed "<race id>|<name>".
// The guide loads it just after the page shows; the build's candidate pages
// read it directly.

export type Briefs = Record<string, CandidateBrief>;

export const briefKey = (raceId: string, name: string) => `${raceId}|${name}`;

export const BriefsContext = createContext<Briefs>({});

/** Someone's brief, once the guide's briefs file has loaded. */
export const useBrief = (raceId: string, name: string): CandidateBrief | undefined => useContext(BriefsContext)[briefKey(raceId, name)];

/** Put the briefs on the data, for the build's pages. A seat holder who is running has theirs on their candidate card. */
export function withBriefs(d: StateData, briefs: Briefs): StateData {
  for (const r of d.races) {
    for (const p of [...r.candidates, ...(r.incumbents ?? []).filter((i) => i.ballot === undefined)]) {
      const b = briefs[briefKey(r.id, p.name)];
      if (b) p.brief = b;
    }
  }
  return d;
}
