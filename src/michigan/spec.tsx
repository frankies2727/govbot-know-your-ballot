import mapsUrl from '../data/michigan/districts.json?url';
import { HowItems } from '../CommonQuestions';
import rawData from '../data/michigan/ballot.json';
import { makeLookup } from '../guide/lookup';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { DISTRICT_CHIPS, LINKS, MICHIGAN, SECTIONS } from './config';
import { KEY_DATES } from './dates';
import { MichiganMap } from './Hero';
import { NextElectionNote } from './NextUp';
import { MICHIGAN_GUIDES, PlanToVote } from './PlanToVote';
import './michigan.css';

const data = rawData as unknown as StateData;

// Where every piece comes from: what each source owns, how fresh it is, and a link to check it.
const sources = (d: StateData): SourceCard[] => {
  const s = d.sources;
  const pages = Object.entries(s.candidates.pages);
  return [
    { emoji: '🗳️', title: 'Who’s running', status: `Live · daily · read ${s.candidates.asOf}`,
      body: 'Every statewide, congressional, legislative and Court of Appeals contest from Ballotpedia’s race pages (the university boards from Wikipedia), with incumbents and each candidate’s profile. Both are CC BY-SA. The Secretary of State’s certified listing is the official source; its site refuses automated readers, so check it if a name looks off.',
      links: [...pages.slice(0, 3).map(([office, url]) => [office, url] as [string, string]), ['Official listings by county', LINKS.countyResults]] },
    { emoji: '💵', title: 'Campaign money', status: 'Live · daily',
      body: 'Federal races: raised, spent and cash on hand from each campaign’s latest FEC report, plus what outside groups (PACs, parties) spent for and against each candidate, from the FEC’s independent-expenditure filings. State and local races: every contribution and expenditure in the Michigan Transparency Network’s nightly exports, summed since Jan 2025 for the candidate’s committee (the exports carry no cash-on-hand figure). Both attached only on a confident name, office and district match.',
      links: [['FEC data', s.money.url], ['MiTN exports', s.stateMoney?.url ?? LINKS.disclosure], ['Michigan disclosure search', LINKS.disclosure]] },
    { emoji: '📷', title: 'Photos, websites & social media', status: 'Live · daily',
      body: 'Each candidate’s Ballotpedia profile supplies their photo, campaign website and the accounts Ballotpedia lists as theirs. Official sources win where they overlap: Congress’s portraits, the Legislature’s member photos (via Open States), Wikidata and Wikimedia Commons. Anyone still without a photo gets the headshot their own campaign site labels as them. Every photo is credited on the card; candidates with none anywhere show their initials.',
      links: [['Ballotpedia', 'https://ballotpedia.org/'], ['Congress portraits', 'https://github.com/unitedstates/images'], ['Open States', 'https://openstates.org/mi/']] },
    { emoji: '📜', title: 'Proposals', status: 'Official ballot wording',
      body: 'The two statewide proposals as certified by the Board of State Canvassers, from the League of Women Voters of Michigan’s handout, with a plain-English note on each.',
      links: [['LWV Michigan', s.proposals.lwv], ['Ballotpedia', s.proposals.ballotpedia]] },
    { emoji: '🏛️', title: 'Lansing bills', status: 'Live · from govbot',
      body: 'Michigan bills on elections and schools with action in the last six months, plus the newest of the rest, from govbot’s open legislation data.',
      links: [['govbot', 'https://chihacknight.github.io/govbot/dashboard/legislation.html']] },
    { emoji: '🗺️', title: 'District maps', status: 'Live',
      body: 'Congressional districts (120th Congress), the 2026 Michigan Senate and House maps and county lines from the Census Bureau. Your county sets your Court of Appeals district (MCL 600.302).',
      links: [['Census TIGERweb', 'https://tigerweb.geo.census.gov/']] },
    { emoji: '📍', title: 'Address lookup', status: 'Live',
      body: 'Your address goes to Photon, komoot’s OpenStreetMap geocoder (or OpenStreetMap’s own if it’s down), which answers with coordinates. Districts are matched on your device.',
      links: [['Photon', 'https://photon.komoot.io/'], ['Nominatim', 'https://nominatim.org/']] },
    { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Oct 15, 2026',
      body: 'Registration, early voting, absentee and Election Day rules from the Michigan Department of State.',
      links: [['Michigan.gov/Vote', LINKS.myInfo], ['Election dates', LINKS.dates]] },
    { emoji: '🔄', title: 'What changed', status: 'Daily',
      body: 'Every morning the guide re-reads its sources and notes candidates added or dropped and new money reports, so returning voters see what’s new.',
      links: [] },
    { emoji: '👤', title: 'Who’s in office now', status: 'Live · daily',
      body: 'Each seat’s current holder: Congress and the Legislature from Open States’ official roster (via govbot); statewide offices, the Supreme Court and the boards from the Wikipedia article on each 2026 race. Whether they’re running is read from the candidate lists, never guessed; when they aren’t, the article’s own line on why (term-limited, retiring, lost renomination) is quoted with a link. Candidates who already sit in Lansing or Congress show the bills they sponsored this session, from govbot’s catalog.',
      links: [['Open States', 'https://openstates.org/mi/'], ['Wikipedia: 2026 Michigan elections', 'https://en.wikipedia.org/wiki/2026_Michigan_elections']] },
    { emoji: '🗣️', title: 'In their words & endorsements', status: 'Live · daily',
      body: 'Each candidate’s three key campaign messages are their own answer to Ballotpedia’s Candidate Connection survey, quoted word for word with the date, plus the “Issues” page on their own campaign site when it has one. Endorsements are the lists in the Wikipedia article on the race, by the article’s own categories, linked to the section. Nothing here is written or rated by us.',
      links: [['Ballotpedia Candidate Connection', 'https://ballotpedia.org/Ballotpedia:Candidate_Connection'], ['Wikipedia: 2026 Michigan elections', 'https://en.wikipedia.org/wiki/2026_Michigan_elections']] },
    { emoji: '⏳', title: 'Not here yet', status: 'Planned', planned: true,
      body: 'County and local offices, trial-court judges, local proposals and state-level campaign money. Your sample ballot at Michigan.gov/Vote has the contests.',
      links: [['Your sample ballot', LINKS.myInfo]] },
  ];
};

export const MICHIGAN_GUIDE: GuideSpec = {
  slug: 'michigan', code: 'MI', name: 'Michigan', capital: 'Lansing',
  data,
  Map: MichiganMap,
  cssClass: 'kyb-mi',
  config: MICHIGAN,
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'Michigan.gov/Vote', dates: LINKS.dates, datesSource: 'Michigan Department of State', ballotpedia: 'https://ballotpedia.org/Michigan_elections,_2026' },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: MICHIGAN_GUIDES,
  NextElectionNote,
  // Michigan: the county decides the Court of Appeals district.
  lookup: makeLookup({ mapsUrl, bbox: [-90.42, 41.69, -82.12, 48.31], abbr: 'MI', name: 'Michigan', decorate: (d, dat) => { if (d.county && dat.coa?.[d.county]) d.coa = dat.coa[d.county]; } }),
  copy: {
    overline: 'Michigan · 2026 midterms',
    heading: 'Know Your Michigan Ballot',
    bullets: [
      'A new governor, plus secretary of state and attorney general',
      'A U.S. Senate seat and your U.S. House seat',
      'Every seat in the Michigan House and Senate',
      'The State Board of Education and the university boards',
      'Two Supreme Court justices and your Court of Appeals judges',
      'Two statewide proposals',
    ],
    addressPlaceholder: 'e.g. 2 Woodward Ave, Detroit or 100 N Capitol Ave, Lansing',
    exampleAddress: '2 Woodward Ave, Detroit',
    districtKinds: 'U.S. House, state Senate, state House and Court of Appeals',
    measuresLabel: 'statewide proposals',
    sectionNotes: {
      judicial: <>These are on the <strong>nonpartisan</strong> part of your ballot: no party labels, and the straight-party box doesn’t cover them. Circuit, district and probate judges for your county aren’t in here yet; your sample ballot has them.</>,
      measures: <>Two statewide proposals. Your city, township or school district may add local ones (millages, charter changes); your sample ballot has those.</>,
    },
    countyScope: 'the statewide races and proposals, its Court of Appeals district, plus every Congress and Lansing district that reaches into the county',
    notCarried: 'County and local offices, trial-court judges and local proposals',
    localContests: 'County commissioners and officials, circuit, district and probate judges, city, township and school board seats, and local millages and proposals.',
    clerkOf: (county) => `, from your ${county} County clerk`,
    moneyFilings: 'FEC and Michigan Bureau of Elections filings',
    legislature: 'Michigan Legislature',
    howItWorks: {
      title: 'How a Michigan ballot works',
      body: <HowItems slug="michigan" />,
    },
    notesLine: 'Michigan voters may bring notes or a marked sample ballot into the voting booth.',
    sources,
  },
};
