import type { Results } from '../results';
import type { ComponentType, ReactNode } from 'react';
import type { KeyDate } from '../dates';
import type { GuideId } from '../hosts';
import type { LawsState } from '../Laws';
import type { Guide } from '../PlanToVote';
import type { StateConfig } from '../state';
import type { Faq } from '../seo/faq';
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
  slug: GuideId;
  /** "MI". */
  code: string;
  name: string;
  /** Where the legislature sits: "Lansing". */
  capital: string;
  data: StateData;
  /** The election's results (src/data/<state>/results.json, scripts/results.mjs). */
  results: Results;
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
  /** Whose bills the "laws that shape your ballot" card shows (default: this guide's code, name and capital): a city guide's state legislature. */
  lawsFrom?: LawsState;
  /** Whether an address's districts are inside the guide's area (default: anywhere in the state). */
  inArea?: (d: Districts) => boolean;
  /** The guide's own common questions (default: the state guides' questions, src/seo/faq.ts). */
  faq?: (data: StateData) => Faq[];
  lookup: {
    geocode: (address: string) => Promise<Place | null>;
    prefetchDistricts: () => unknown;
    districtsAt: (lat: number, lng: number, data: StateData) => Promise<Districts>;
  };
  copy: {
    /** "Michigan · 2026 midterms". */
    overline: string;
    /** The races on every ballot: "statewide" (the default) or "citywide". */
    everyone?: string;
    /** The ballot view's header (default: "November 2026 Midterm", from the date). */
    electionName?: string;
    /** Where the address goes, under the address box (default: OpenStreetMap's search). */
    addressNote?: string;
    /** Under the address box when an address is outside the guide's area (default: the other state guides). */
    outside?: ReactNode;
    /** The printed sample ballot's note on what it carries (default: the statewide guides' contests). */
    sampleScope?: string;
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
    /** The local contests the official sample ballot has, under "Not in here yet" (empty: the guide has every contest). */
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
