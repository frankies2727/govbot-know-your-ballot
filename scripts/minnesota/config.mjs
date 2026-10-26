// Know Your Ballot: Minnesota. What scripts/state.mjs needs to build the
// Nov 3, 2026 ballot: Ballotpedia's pages and the office wording Minnesota's
// ballot uses, the Supreme Court and Court of Appeals seats (statewide, no
// party), and the constitutional amendment.

import { addStateMoney, CFB_VIEWER } from './cfb.mjs';
import { read as readFilings } from './filings.mjs';
import { MEASURES, MEASURES_SOURCE } from './measures.mjs';

export const CONFIG = {
  code: 'MN', slug: 'minnesota', name: 'Minnesota', capital: 'St. Paul', fips: '27',
  statewide: [
    { page: 'United_States_Senate_election_in_Minnesota,_2026', box: 'U.S. Senate Minnesota', office: 'U.S. Senator', section: 'federal' },
    { page: 'Minnesota_gubernatorial_and_lieutenant_gubernatorial_election,_2026', box: 'Governor of Minnesota', office: 'Governor and Lieutenant Governor', section: 'state' },
    { page: 'Minnesota_Secretary_of_State_election,_2026', box: 'Minnesota Secretary of State', office: 'Secretary of State', section: 'state' },
    { page: 'Minnesota_Auditor_election,_2026', box: 'Minnesota State Auditor', office: 'State Auditor', section: 'state' },
    { page: 'Minnesota_Attorney_General_election,_2026', box: 'Attorney General of Minnesota', office: 'Attorney General', section: 'state' },
    // Judges run statewide without party; a seat with one name is still a contest (a write-in line too).
    ...[1, 4].map((seat) => ({ page: 'Minnesota_Supreme_Court_elections,_2026', box: `Minnesota Supreme Court Seat ${seat}`, office: `Associate Justice of the Supreme Court, Seat ${seat}`, section: 'judicial', min: 1 })),
    ...[1, 7, 13, 15, 18].map((seat) => ({ page: 'Minnesota_intermediate_appellate_court_elections,_2026', box: `Minnesota Court of Appeals District ${seat}`, office: `Judge of the Court of Appeals, Seat ${seat}`, section: 'judicial', min: 1 })),
  ],
  governorOffice: 'Governor and Lieutenant Governor',
  // The Green ticket's running mate, from the Wikipedia article's candidate list (its infobox carries only the two major tickets).
  runningMates: { 'Steven Young': 'Jane Kirby' },
  chambers: {
    cd: 'United_States_House_of_Representatives_elections_in_Minnesota,_2026',
    sldu: 'Minnesota_State_Senate_elections,_2026',
    sldl: 'Minnesota_House_of_Representatives_elections,_2026',
  },
  // House districts are lettered (1A, 1B): each Senate district holds two.
  officeFor: (type, d) => ({ cd: `U.S. Representative, District ${d}`, sldu: `State Senator, District ${d}`, sldl: `State Representative, District ${d}` })[type],
  raceCounts: { cd: 8, sldu: 67, sldl: 134 },
  layerCounts: { cd: 8, sldu: 67, sldl: 134, county: 87 },
  // Minnesota's Democrats are the Democratic-Farmer-Labor Party, as the ballot prints it.
  partyNames: { Democratic: 'Democratic-Farmer-Labor' },
  partyOrder: ['Democratic-Farmer-Labor', 'Republican', 'Green', 'Libertarian', 'Forward Independence', 'Legal Marijuana Now', 'Grassroots-Legalize Cannabis', 'Independent', 'Unaffiliated', 'Nonpartisan'],
  chosenPhotos: new URL('./photos-chosen.json', import.meta.url),
  // State candidates' money from the Campaign Finance Board's candidate viewer.
  stateMoney: { name: 'CFB', url: CFB_VIEWER, add: (races) => addStateMoney(races) },
  // The Secretary of State's candidate filings decide who is on the ballot (scripts/minnesota/filings.mjs).
  officialList: { name: 'Secretary of State filings', read: readFilings },
  measures: { list: MEASURES, source: MEASURES_SOURCE },
  news: ['Minnesota election 2026', 'Minnesota governor race Klobuchar Demuth', 'Minnesota Senate race Flanagan Tafoya', 'Minnesota constitutional amendment school fund 2026', 'Minnesota attorney general race Ellison Schutz'],
  moneyNews: ['Minnesota governor campaign fundraising', 'Minnesota election campaign donations super PAC', 'Minnesota Senate race campaign money', 'Minnesota Campaign Finance Board'],
  wiki: {
    PAGES: {
      overview: '2026_Minnesota_elections',
      senate: '2026_United_States_Senate_election_in_Minnesota',
      governor: '2026_Minnesota_gubernatorial_election',
      sos: '2026_Minnesota_Secretary_of_State_election',
      auditor: '2026_Minnesota_State_Auditor_election',
      ag: '2026_Minnesota_Attorney_General_election',
      house: '2026_United_States_House_of_Representatives_elections_in_Minnesota',
      mnsenate: '2026_Minnesota_Senate_election',
      mnhouse: '2026_Minnesota_House_of_Representatives_election',
    },
    STATEWIDE: [
      ['u-s-senator', 'senate', 'United States Senate'],
      ['governor-and-lieutenant-governor', 'governor', 'State executive elections'],
      ['secretary-of-state', 'sos', 'State executive elections'],
      ['state-auditor', 'auditor', 'State executive elections'],
      ['attorney-general', 'ag', 'State executive elections'],
    ],
    BOARDS: {},
    chambers: { cd: 'house', sldu: 'mnsenate', sldl: 'mnhouse' },
  },
};
