// Know Your Ballot: Wisconsin. What scripts/state.mjs needs to build the
// Nov 3, 2026 ballot: Ballotpedia's pages and the office wording Wisconsin's
// ballot uses, and the three constitutional amendments. No U.S. Senate seat
// and no statewide judges are up this November; the odd-numbered Senate
// districts are.

import { MEASURES, MEASURES_SOURCE } from './measures.mjs';
import { addStateMoney, SUNSHINE } from './sunshine.mjs';

export const CONFIG = {
  code: 'WI', slug: 'wisconsin', name: 'Wisconsin', capital: 'Madison', fips: '55',
  statewide: [
    { page: 'Wisconsin_gubernatorial_election,_2026', box: 'Governor of Wisconsin', office: 'Governor and Lieutenant Governor', section: 'state' },
    { page: 'Wisconsin_Attorney_General_election,_2026', box: 'Attorney General of Wisconsin', office: 'Attorney General', section: 'state' },
    { page: 'Wisconsin_Secretary_of_State_election,_2026', box: 'Wisconsin Secretary of State', office: 'Secretary of State', section: 'state' },
    { page: 'Wisconsin_Treasurer_election,_2026', box: 'Wisconsin Treasurer', office: 'State Treasurer', section: 'state' },
  ],
  governorOffice: 'Governor and Lieutenant Governor',
  chambers: {
    cd: 'United_States_House_of_Representatives_elections_in_Wisconsin,_2026',
    sldu: 'Wisconsin_State_Senate_elections,_2026',
    sldl: 'Wisconsin_State_Assembly_elections,_2026',
  },
  officeFor: (type, d) => ({ cd: `Representative in Congress, District ${d}`, sldu: `State Senator, District ${d}`, sldl: `Representative to the Assembly, District ${d}` })[type],
  // Senators serve four years: the 17 odd-numbered districts are up in 2026, the even ones in 2028.
  raceCounts: { cd: 8, sldu: 17, sldl: 99 },
  layerCounts: { cd: 8, sldu: 33, sldl: 99, county: 72 },
  partyOrder: ['Democratic', 'Republican', 'Constitution', 'Libertarian', 'Green', 'American Solidarity', 'Independent', 'Nonpartisan'],
  chosenPhotos: new URL('./photos-chosen.json', import.meta.url),
  // State candidates' money from the Ethics Commission's campaign finance system.
  stateMoney: { name: 'Sunshine', url: SUNSHINE, add: (races) => addStateMoney(races) },
  measures: { list: MEASURES, source: MEASURES_SOURCE },
  news: ['Wisconsin election 2026', 'Wisconsin governor race Crowley Tiffany', 'Wisconsin constitutional amendment 2026 partial veto', 'Wisconsin attorney general race Kaul Toney', 'Wisconsin Assembly election 2026'],
  moneyNews: ['Wisconsin governor campaign fundraising', 'Wisconsin election campaign donations super PAC', 'Wisconsin campaign finance 2026', 'Wisconsin Democracy Campaign'],
  wiki: {
    PAGES: {
      overview: '2026_Wisconsin_elections',
      governor: '2026_Wisconsin_gubernatorial_election',
      ag: '2026_Wisconsin_Attorney_General_election',
      sos: '2026_Wisconsin_Secretary_of_State_election',
      treasurer: '2026_Wisconsin_State_Treasurer_election',
      house: '2026_United_States_House_of_Representatives_elections_in_Wisconsin',
      wisenate: '2026_Wisconsin_Senate_election',
      assembly: '2026_Wisconsin_State_Assembly_election',
    },
    STATEWIDE: [
      ['governor-and-lieutenant-governor', 'governor', 'Executive'],
      ['attorney-general', 'ag', 'Executive'],
      ['secretary-of-state', 'sos', 'Executive'],
      ['state-treasurer', 'treasurer', 'Executive'],
    ],
    BOARDS: {},
    chambers: { cd: 'house', sldu: 'wisenate', sldl: 'assembly' },
  },
};
