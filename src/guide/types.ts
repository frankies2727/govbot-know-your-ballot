// Shape of the static data scripts/state.mjs builds for a state (Michigan,
// Minnesota, Wisconsin): src/data/<state>/ballot.json.
import type { Change, Law, Measure, NewsItem, Race } from '../types';

export interface StateData {
  election: { name: string; date: string };
  sources: {
    /** Each office's candidate page, and the day the list was last read. */
    candidates: { pages: Record<string, string>; asOf: string };
    money: { url: string; file: string };
    /** The state's own money exports, where the build reads them (Michigan's MiTN). */
    stateMoney?: { url: string };
    /** Where the ballot questions' wording was checked, by source name. */
    proposals: Record<string, string>;
  };
  races: Race[];
  measures: Measure[];
  /** Michigan: county name -> Court of Appeals election district. */
  coa?: Record<string, string>;
  /** The districts ("cd:6", "sldu:21") that reach into each county, for browsing a county without an address. */
  counties?: Record<string, string[]>;
  /** What the daily refresh found different, newest last. */
  changes?: Change[];
  /** Recent headlines about the election, newest first. */
  news?: NewsItem[];
  /** The legislature's bills on elections and schools, from govbot, newest action first. */
  laws?: Law[];
}
