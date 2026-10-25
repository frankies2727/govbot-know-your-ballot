// Know Your Ballot: Michigan. What scripts/state.mjs needs to build the
// Nov 3, 2026 ballot: Ballotpedia's pages and the office wording Michigan's
// ballot uses, the three university boards (Wikipedia), the Court of
// Appeals districts, MiTN's money exports and the certified proposals.

import { fetchPage, parseAppellate } from './ballotpedia.mjs';
import { addStateMoney, fetchExports, MITN_EXPORTS } from './mitn.mjs';
import { PROPOSALS, PROPOSALS_SOURCE } from './proposals.mjs';
import { boardCandidates } from './wikipedia.mjs';
import { ordinal } from '../wiki.mjs';

// Counties in each Court of Appeals election district (MCL 600.302).
const COA = {
  1: ['Branch', 'Hillsdale', 'Kalamazoo', 'Lenawee', 'Monroe', 'St. Joseph', 'Wayne'],
  2: ['Genesee', 'Macomb', 'Oakland'],
  3: ['Allegan', 'Barry', 'Berrien', 'Calhoun', 'Cass', 'Eaton', 'Ionia', 'Jackson', 'Kent', 'Mason', 'Montcalm', 'Muskegon', 'Newaygo', 'Oceana', 'Ottawa', 'Van Buren', 'Washtenaw'],
};
const coaOf = (county) => Object.entries(COA).find(([, list]) => list.includes(county))?.[0] ?? '4';

const APPEALS = 'Michigan_intermediate_appellate_court_elections,_2026';

export const CONFIG = {
  code: 'MI', slug: 'michigan', name: 'Michigan', capital: 'Lansing', fips: '26',
  // Ballotpedia pages, the "General election for …" box on each, and the office wording Michigan's ballot uses.
  statewide: [
    { page: 'Michigan_gubernatorial_election,_2026', box: 'Governor of Michigan', office: 'Governor and Lieutenant Governor', section: 'state' },
    { page: 'Michigan_Secretary_of_State_election,_2026', box: 'Michigan Secretary of State', office: 'Secretary of State', section: 'state' },
    { page: 'Michigan_Attorney_General_election,_2026', box: 'Attorney General of Michigan', office: 'Attorney General', section: 'state' },
    { page: 'United_States_Senate_election_in_Michigan,_2026', box: 'U.S. Senate Michigan', office: 'United States Senator', section: 'federal' },
    { page: 'Michigan_State_Board_of_Education_election,_2026', box: 'Michigan State Board of Education', office: 'Member of the State Board of Education', section: 'education' },
    { page: 'Michigan_Supreme_Court_elections,_2026', box: 'Michigan Supreme Court', office: 'Justice of the Supreme Court', section: 'judicial' },
  ],
  governorOffice: 'Governor and Lieutenant Governor',
  // Lieutenant governor running mates the candidate boxes and the Wikipedia
  // infobox leave out (en.wikipedia.org/wiki/2026_Michigan_gubernatorial_election,
  // checked Oct 15, 2026). Tickets can't change once the ballot is certified.
  runningMates: {
    'Jocelyn Benson': 'Winnie Brinks', 'John James': 'Jay DeBoyer', 'Anthony Hudson': 'Beau Parmenter',
    'Donna Brandenburg': 'Robert Donald Cowper II', 'Douglas Campbell': 'Bobbie Clay',
  },
  // University boards: Ballotpedia has no 2026 page for them, so Wikipedia's election articles.
  extraRaces: [
    ['2026_University_of_Michigan_Board_of_Regents_election', 'Regent of the University of Michigan'],
    ['2026_Michigan_State_University_Board_of_Trustees_election', 'Trustee of Michigan State University'],
    ['2026_Wayne_State_University_Board_of_Governors_election', 'Governor of Wayne State University'],
  ].map(([article, office]) => ({ id: office, office: `${office} (2 seats)`, section: 'education', seats: 2, read: () => boardCandidates(article) })),
  chambers: {
    cd: 'United_States_House_of_Representatives_elections_in_Michigan,_2026',
    sldu: 'Michigan_State_Senate_elections,_2026',
    sldl: 'Michigan_House_of_Representatives_elections,_2026',
  },
  officeFor: (type, d) => ({ cd: `Representative in Congress, ${ordinal(+d)} District`, sldu: `State Senator, ${ordinal(+d)} District`, sldl: `Representative in State Legislature, ${ordinal(+d)} District` })[type],
  // The Court of Appeals: one page, a row per district with its seats.
  appellate: async (race) => {
    const appeals = await fetchPage(APPEALS);
    return parseAppellate(appeals.html).map(({ district, seats, candidates }) => {
      const term = seats === 1 && candidates.length === 1 && /Lievense/.test(candidates[0].name) ? ', partial term' : '';
      return race({ id: `coa-${district}-${seats}`, office: `Judge of the Court of Appeals, ${ordinal(+district)} District${term} (${seats} seat${seats === 1 ? '' : 's'})`, section: 'judicial', area: { type: 'coa', id: district }, seats, candidates, source: appeals.url });
    });
  },
  raceCounts: { cd: 13, sldu: 38, sldl: 110 },
  layerCounts: { cd: 13, sldu: 38, sldl: 110, county: 83 },
  // Major parties first, as the ballot lists them, then the rest alphabetically.
  partyOrder: ['Democratic', 'Republican', 'Libertarian', 'U.S. Taxpayers', 'Green', 'Natural Law', 'Working Class', 'Independent', 'Nonpartisan'],
  chosenPhotos: new URL('./photos-chosen.json', import.meta.url),
  // State and local money from MiTN's nightly exports.
  stateMoney: { name: 'MiTN', url: MITN_EXPORTS, add: async (races, dir) => { await fetchExports(dir); return addStateMoney(races, dir); } },
  measures: { list: PROPOSALS, source: PROPOSALS_SOURCE },
  // The county -> Court of Appeals district table the app needs.
  extraData: (districts) => ({ coa: Object.fromEntries(districts.layers.county.map((c) => [c.id, coaOf(c.id)])) }),
  news: ['Michigan election 2026', 'Michigan governor race Benson James', 'Michigan Senate race El-Sayed Rogers', 'Michigan ballot proposal 2026', 'Michigan Supreme Court election 2026'],
  moneyNews: ['Michigan governor campaign fundraising', 'Michigan election campaign donations super PAC', 'Michigan Senate race campaign money', 'Michigan campaign finance'],
  // Which Wikipedia article and section covers each race (see incumbents.mjs).
  wiki: {
    PAGES: {
      overview: '2026_Michigan_elections',
      senate: '2026_United_States_Senate_election_in_Michigan',
      governor: '2026_Michigan_gubernatorial_election',
      ag: '2026_Michigan_Attorney_General_election',
      sos: '2026_Michigan_Secretary_of_State_election',
      house: '2026_United_States_House_of_Representatives_elections_in_Michigan',
      misenate: '2026_Michigan_Senate_election',
      mihouse: '2026_Michigan_House_of_Representatives_election',
      supreme: '2026_Michigan_Supreme_Court_election',
      sbe: '2026_Michigan_State_Board_of_Education_election',
      um: '2026_University_of_Michigan_Board_of_Regents_election',
      msu: '2026_Michigan_State_University_Board_of_Trustees_election',
      wsu: '2026_Wayne_State_University_Board_of_Governors_election',
    },
    // The statewide races: [race id, office article, overview section].
    STATEWIDE: [
      ['united-states-senator', 'senate', 'United States Senate'],
      ['governor-and-lieutenant-governor', 'governor', 'Governor and lieutenant governor'],
      ['secretary-of-state', 'sos', 'Secretary of state'],
      ['attorney-general', 'ag', 'Attorney general'],
    ],
    // Multi-seat statewide boards: the article lists "Name, incumbent justice/regent/…" under each party's nominees.
    BOARDS: {
      'justice-of-the-supreme-court': 'supreme', 'member-of-the-state-board-of-education': 'sbe',
      'regent-of-the-university-of-michigan': 'um', 'trustee-of-michigan-state-university': 'msu', 'governor-of-wayne-state-university': 'wsu',
    },
    chambers: { cd: 'house', sldu: 'misenate', sldl: 'mihouse' },
  },
};
