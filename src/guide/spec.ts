import type { ComponentType, ReactNode } from 'react';
import type { KeyDate } from '../dates';
import type { GuideState } from '../hosts';
import type { Guide } from '../PlanToVote';
import type { StateConfig } from '../state';
import type { Districts } from '../types';
import type { Place } from './lookup';
import type { StateData } from './types';

/** One of the guide's ballot sections, in ballot order, with the colour it wears and the ink that reads on it. */
export interface GuideSection { id: string; title: string; color: string; ink: string; emoji: string }

/** Where a piece of the ballot comes from, on the Sources card. */
export interface SourceCard { emoji: string; title: string; status: string; planned?: boolean; body: string; links: [string, string][] }

/**
 * Everything that differs from state to state in a whole-state guide
 * (Michigan, Minnesota, Wisconsin): the data, the sections and colours, the
 * lookups, the links and the copy. StateGuide renders one of these.
 */
export interface GuideSpec {
  slug: GuideState;
  /** "MI". */
  code: string;
  name: string;
  /** Where the legislature sits: "Lansing". */
  capital: string;
  data: StateData;
  /** The state's outline, with an optional pin (Hero.tsx). */
  Map: ComponentType<{ at?: { lat: number; lng: number } | null; className?: string }>;
  /** The class carrying the state's palette (`--kyb-accent`, `--kyb-accent-ink`). */
  cssClass: string;
  config: StateConfig;
  sections: readonly GuideSection[];
  /** The chips under "Your districts": [district key, label]. */
  districtChips: [string, string][];
  links: {
    /** The official voter portal (registration, sample ballot, polling place), and how to name it. */
    myInfo: string; myInfoLabel: string;
    /** The official election calendar, and who publishes it. */
    dates: string; datesSource: string;
    /** Ballotpedia's page on the state's 2026 elections. */
    ballotpedia: string;
  };
  keyDates: KeyDate[];
  PlanToVote: ComponentType<{ plan: Record<string, boolean | string>; setPlan: (key: string, value: boolean | string) => void; county?: string; ballotDone: boolean }>;
  guides: Guide[];
  NextElectionNote: ComponentType;
  lookup: {
    geocode: (address: string) => Promise<Place | null>;
    prefetchDistricts: () => unknown;
    districtsAt: (lat: number, lng: number, data: StateData) => Promise<Districts>;
  };
  copy: {
    /** "Michigan · 2026 midterms". */
    overline: string;
    heading: string;
    /** What's on the ballot, one line each. */
    bullets: string[];
    addressPlaceholder: string;
    /** An example address, for the not-found message: "2 Woodward Ave, Detroit". */
    exampleAddress: string;
    /** "U.S. House, state Senate, state House and Court of Appeals": the by-district races an address adds. */
    districtKinds: string;
    /** "statewide proposals", "constitutional amendment": the ballot questions, as the ballot calls them. */
    measuresLabel: string;
    /** Under a section's heading: a note on judges, on the questions. */
    sectionNotes: Partial<Record<string, ReactNode>>;
    /** Browsing a county: what the list holds ("the statewide races and proposals, … that reaches into the county"). */
    countyScope: string;
    /** What the guide doesn't carry: "County and local offices, trial-court judges and local proposals". */
    notCarried: string;
    /** The local contests the official sample ballot has, under "Not in here yet". */
    localContests: string;
    /** Who runs the voter's election: ", from your Wayne County clerk". */
    clerkOf: (county: string) => string;
    /** The source of money changes in the feed: "FEC and Michigan Bureau of Elections filings". */
    moneyFilings: string;
    /** "Michigan Legislature", on each bill's feed item. */
    legislature: string;
    howItWorks: { title: string; body: ReactNode };
    /** Voters may bring notes into the booth (the printed ballot's last line). */
    notesLine: string;
    /** The Sources cards, from the data. */
    sources: (data: StateData) => SourceCard[];
  };
}
