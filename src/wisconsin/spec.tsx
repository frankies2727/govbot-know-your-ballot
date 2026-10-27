import mapsUrl from '../data/wisconsin/districts.json?url';
import { HowItems } from '../CommonQuestions';
import rawData from '../data/wisconsin/ballot.json';
import { makeLookup } from '../guide/lookup';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { DISTRICT_CHIPS, LINKS, SECTIONS, WISCONSIN } from './config';
import { KEY_DATES } from './dates';
import { WisconsinMap } from './Hero';
import { NextElectionNote } from './NextUp';
import { PlanToVote, WISCONSIN_GUIDES } from './PlanToVote';
import './wisconsin.css';

const data = rawData as unknown as StateData;

// Where every piece comes from: what each source owns, how fresh it is, and a link to check it.
const sources = (d: StateData): SourceCard[] => {
  const s = d.sources;
  const pages = Object.entries(s.candidates.pages);
  return [
    { emoji: '🗳️', title: 'Who’s running', status: `Live · daily · read ${s.candidates.asOf}`,
      body: 'Every statewide, congressional and legislative contest from Ballotpedia’s race pages (CC BY-SA), with incumbents and each candidate’s profile. The Elections Commission’s “Candidates on Ballot” list decides who is on each ballot, with each name as the ballot prints it; Ballotpedia fills in the rest.',
      links: [...pages.slice(0, 3).map(([office, url]) => [office, url] as [string, string]), ['Official candidate lists', 'https://elections.wi.gov/candidates-and-committees/candidates']] },
    { emoji: '💵', title: 'Campaign money', status: 'Live · daily',
      body: 'Federal races: raised, spent and cash on hand from each campaign’s latest FEC report, plus what outside groups (PACs, parties) spent for and against each candidate, from the FEC’s independent-expenditure filings. State races: each committee’s contributions and disbursements from the Ethics Commission’s campaign finance system, summed over 2025 and 2026 through its latest report (the system carries no cash-on-hand figure). Both attached only on a confident name, office and district match.',
      links: [['FEC data', s.money.url], ['Wisconsin campaign finance', s.stateMoney?.url ?? LINKS.disclosure]] },
    { emoji: '📷', title: 'Photos, websites & social media', status: 'Live · daily',
      body: 'Each candidate’s Ballotpedia profile supplies their photo, campaign website and the accounts Ballotpedia lists as theirs. Official sources win where they overlap: Congress’s portraits, the Legislature’s member photos (via Open States), Wikidata and Wikimedia Commons. Anyone still without a photo gets the headshot their own campaign site labels as them. Every photo is credited on the card; candidates with none anywhere show their initials.',
      links: [['Ballotpedia', 'https://ballotpedia.org/'], ['Congress portraits', 'https://github.com/unitedstates/images'], ['Open States', 'https://openstates.org/wi/']] },
    { emoji: '📜', title: 'The questions', status: 'Official ballot wording',
      body: 'The three constitutional amendments in the ballot wording the Legislature set in its joint resolutions, as listed by Ballotpedia, with a plain-English note on each.',
      links: [['Ballotpedia', s.proposals.ballotpedia], ['Elections Commission', s.proposals.official]] },
    { emoji: '🏛️', title: 'Madison bills', status: 'Live · from govbot',
      body: 'Wisconsin bills on elections and schools with action in the last six months, plus the newest of the rest, from govbot’s open legislation data.',
      links: [['govbot', 'https://chihacknight.github.io/govbot/dashboard/legislation.html']] },
    { emoji: '🗺️', title: 'District maps', status: 'Live',
      body: 'Congressional districts (120th Congress), the 2024 Wisconsin Senate and Assembly maps and county lines from the Census Bureau.',
      links: [['Census TIGERweb', 'https://tigerweb.geo.census.gov/']] },
    { emoji: '📍', title: 'Address lookup', status: 'Live',
      body: 'Your address goes to Photon, komoot’s OpenStreetMap geocoder (or OpenStreetMap’s own if it’s down), which answers with coordinates. Districts are matched on your device.',
      links: [['Photon', 'https://photon.komoot.io/'], ['Nominatim', 'https://nominatim.org/']] },
    { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Oct 25, 2026',
      body: 'Registration, photo ID, absentee and Election Day rules from the Wisconsin Elections Commission.',
      links: [['MyVote Wisconsin', LINKS.myInfo], ['Upcoming elections', LINKS.dates]] },
    { emoji: '🔄', title: 'What changed', status: 'Daily',
      body: 'Every morning the guide re-reads its sources and notes candidates added or dropped and new money reports, so returning voters see what’s new.',
      links: [] },
    { emoji: '👤', title: 'Who’s in office now', status: 'Live · daily',
      body: 'Each seat’s current holder: Congress and the Legislature from Open States’ official roster (via govbot); statewide offices from the Wikipedia article on each 2026 race. Whether they’re running is read from the candidate lists, never guessed; when they aren’t, the article’s own line on why is quoted with a link. Candidates who already sit in Madison or Congress show the bills they sponsored this session, from govbot’s catalog.',
      links: [['Open States', 'https://openstates.org/wi/'], ['Wikipedia: 2026 Wisconsin elections', 'https://en.wikipedia.org/wiki/2026_Wisconsin_elections']] },
    { emoji: '🗣️', title: 'In their words & endorsements', status: 'Live · daily',
      body: 'Each candidate’s three key campaign messages are their own answer to Ballotpedia’s Candidate Connection survey, quoted word for word with the date, plus the “Issues” page on their own campaign site when it has one. Endorsements are the lists in the Wikipedia article on the race, by the article’s own categories, linked to the section. Nothing here is written or rated by us.',
      links: [['Ballotpedia Candidate Connection', 'https://ballotpedia.org/Ballotpedia:Candidate_Connection'], ['Wikipedia: 2026 Wisconsin elections', 'https://en.wikipedia.org/wiki/2026_Wisconsin_elections']] },
    { emoji: '⏳', title: 'Not here yet', status: 'Planned', planned: true,
      body: 'County offices (sheriff, clerk of courts and the rest) and local referendums. Your sample ballot at MyVote.wi.gov has the contests.',
      links: [['Your sample ballot', LINKS.myInfo]] },
  ];
};

export const WISCONSIN_GUIDE: GuideSpec = {
  slug: 'wisconsin', code: 'WI', name: 'Wisconsin', capital: 'Madison',
  data,
  Map: WisconsinMap,
  cssClass: 'kyb-wi',
  config: WISCONSIN,
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'MyVote.wi.gov', dates: LINKS.dates, datesSource: 'Wisconsin Elections Commission', ballotpedia: 'https://ballotpedia.org/Wisconsin_elections,_2026' },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: WISCONSIN_GUIDES,
  NextElectionNote,
  lookup: makeLookup({ mapsUrl, bbox: [-92.89, 42.49, -86.25, 47.31], abbr: 'WI', name: 'Wisconsin' }),
  copy: {
    overline: 'Wisconsin · 2026 midterms',
    heading: 'Know Your Wisconsin Ballot',
    bullets: [
      'A new governor, plus attorney general, secretary of state and state treasurer',
      'Your U.S. House seat (no U.S. Senate race this year)',
      'Every Assembly seat and the odd-numbered state Senate districts',
      'Three constitutional amendments: the partial veto, places of worship in emergencies, and discrimination by government',
    ],
    addressPlaceholder: 'e.g. 200 E Wells St, Milwaukee or 2 E Main St, Madison',
    exampleAddress: '200 E Wells St, Milwaukee',
    districtKinds: 'U.S. House, state Senate and Assembly',
    measuresLabel: 'statewide questions',
    sectionNotes: {
      measures: <>Three statewide questions, each a yes or no on amending the state constitution. Your county, city or school district may add local referendums; your sample ballot has those.</>,
    },
    countyScope: 'the statewide races and questions, plus every Congress and Madison district that reaches into the county',
    notCarried: 'County offices and local referendums',
    localContests: 'County sheriff, clerk of courts and other county offices, and local referendums.',
    clerkOf: (county) => `, from your municipal clerk in ${county} County`,
    moneyFilings: 'FEC and Wisconsin Ethics Commission filings',
    legislature: 'Wisconsin Legislature',
    howItWorks: {
      title: 'How a Wisconsin ballot works',
      body: <HowItems slug="wisconsin" />,
    },
    notesLine: 'Wisconsin voters may bring notes or a marked sample ballot into the voting booth.',
    sources,
  },
};
