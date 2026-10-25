import mapsUrl from '../data/minnesota/districts.json?url';
import rawData from '../data/minnesota/ballot.json';
import { makeLookup } from '../guide/lookup';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { DISTRICT_CHIPS, LINKS, MINNESOTA, SECTIONS } from './config';
import { KEY_DATES } from './dates';
import { MinnesotaMap } from './Hero';
import { NextElectionNote } from './NextUp';
import { MINNESOTA_GUIDES, PlanToVote } from './PlanToVote';
import './minnesota.css';

const data = rawData as unknown as StateData;

// Where every piece comes from: what each source owns, how fresh it is, and a link to check it.
const sources = (d: StateData): SourceCard[] => {
  const s = d.sources;
  const pages = Object.entries(s.candidates.pages);
  return [
    { emoji: '🗳️', title: 'Who’s running', status: `Live · daily · read ${s.candidates.asOf}`,
      body: 'Every statewide, congressional, legislative, Supreme Court and Court of Appeals contest from Ballotpedia’s race pages (CC BY-SA), with incumbents and each candidate’s profile. The Secretary of State’s certified candidate filings are the official source; check them if a name looks off.',
      links: [...pages.slice(0, 3).map(([office, url]) => [office, url] as [string, string]), ['Official candidate filings', 'https://candidates.sos.mn.gov/']] },
    { emoji: '💵', title: 'Campaign money', status: 'Live · daily · federal races',
      body: 'Federal races: raised, spent and cash on hand from each campaign’s latest FEC report, attached only on a confident name, office and district match. State races aren’t in yet: the Campaign Finance Board publishes every committee’s reports.',
      links: [['FEC data', s.money.url], ['Minnesota Campaign Finance Board', LINKS.disclosure]] },
    { emoji: '📷', title: 'Photos, websites & social media', status: 'Live · daily',
      body: 'Each candidate’s Ballotpedia profile supplies their photo, campaign website and the accounts Ballotpedia lists as theirs. Official sources win where they overlap: Congress’s portraits, the Legislature’s member photos (via Open States), Wikidata and Wikimedia Commons. Anyone still without a photo gets the headshot their own campaign site labels as them. Every photo is credited on the card; candidates with none anywhere show their initials.',
      links: [['Ballotpedia', 'https://ballotpedia.org/'], ['Congress portraits', 'https://github.com/unitedstates/images'], ['Open States', 'https://openstates.org/mn/']] },
    { emoji: '📜', title: 'The amendment', status: 'Official ballot wording',
      body: 'The constitutional amendment in the ballot title and question the Legislature set, as listed by Ballotpedia, with a plain-English note.',
      links: [['Ballotpedia', s.proposals.ballotpedia], ['Secretary of State', s.proposals.official]] },
    { emoji: '🏛️', title: 'St. Paul bills', status: 'Live · from govbot',
      body: 'Minnesota bills on elections and schools with action in the last six months, plus the newest of the rest, from govbot’s open legislation data.',
      links: [['govbot', 'https://chihacknight.github.io/govbot/dashboard/legislation.html']] },
    { emoji: '🗺️', title: 'District maps', status: 'Live',
      body: 'Congressional districts (120th Congress), the Minnesota Senate and House maps and county lines from the Census Bureau.',
      links: [['Census TIGERweb', 'https://tigerweb.geo.census.gov/']] },
    { emoji: '📍', title: 'Address lookup', status: 'Live',
      body: 'Your address goes to Photon, komoot’s OpenStreetMap geocoder (or OpenStreetMap’s own if it’s down), which answers with coordinates. Districts are matched on your device.',
      links: [['Photon', 'https://photon.komoot.io/'], ['Nominatim', 'https://nominatim.org/']] },
    { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Oct 25, 2026',
      body: 'Registration, early voting, mail voting and Election Day rules from the Minnesota Secretary of State.',
      links: [['Voter Information Portal', LINKS.myInfo], ['Elections & voting', LINKS.dates]] },
    { emoji: '🔄', title: 'What changed', status: 'Daily',
      body: 'Every morning the guide re-reads its sources and notes candidates added or dropped and new money reports, so returning voters see what’s new.',
      links: [] },
    { emoji: '👤', title: 'Who’s in office now', status: 'Live · daily',
      body: 'Each seat’s current holder: Congress and the Legislature from Open States’ official roster (via govbot); statewide offices from the Wikipedia article on each 2026 race. Whether they’re running is read from the candidate lists, never guessed; when they aren’t, the article’s own line on why is quoted with a link. Candidates who already sit in St. Paul or Congress show the bills they sponsored this session, from govbot’s catalog.',
      links: [['Open States', 'https://openstates.org/mn/'], ['Wikipedia: 2026 Minnesota elections', 'https://en.wikipedia.org/wiki/2026_Minnesota_elections']] },
    { emoji: '🗣️', title: 'In their words & endorsements', status: 'Live · daily',
      body: 'Each candidate’s three key campaign messages are their own answer to Ballotpedia’s Candidate Connection survey, quoted word for word with the date, plus the “Issues” page on their own campaign site when it has one. Endorsements are the lists in the Wikipedia article on the race, by the article’s own categories, linked to the section. Nothing here is written or rated by us.',
      links: [['Ballotpedia Candidate Connection', 'https://ballotpedia.org/Ballotpedia:Candidate_Connection'], ['Wikipedia: 2026 Minnesota elections', 'https://en.wikipedia.org/wiki/2026_Minnesota_elections']] },
    { emoji: '⏳', title: 'Not here yet', status: 'Planned', planned: true,
      body: 'County and local offices, school boards, district court judges, local questions and state-level campaign money. Your sample ballot at the Voter Information Portal has the contests.',
      links: [['Your sample ballot', LINKS.myInfo]] },
  ];
};

export const MINNESOTA_GUIDE: GuideSpec = {
  slug: 'minnesota', code: 'MN', name: 'Minnesota', capital: 'St. Paul',
  data,
  Map: MinnesotaMap,
  cssClass: 'kyb-mn',
  config: MINNESOTA,
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'the Voter Information Portal', dates: LINKS.dates, datesSource: 'Minnesota Secretary of State', ballotpedia: 'https://ballotpedia.org/Minnesota_elections,_2026' },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: MINNESOTA_GUIDES,
  NextElectionNote,
  lookup: makeLookup({ mapsUrl, bbox: [-97.24, 43.5, -89.49, 49.39], abbr: 'MN', name: 'Minnesota' }),
  copy: {
    overline: 'Minnesota · 2026 midterms',
    heading: 'Know Your Minnesota Ballot',
    bullets: [
      'A new governor, plus secretary of state, state auditor and attorney general',
      'A U.S. Senate seat and your U.S. House seat',
      'Every seat in the Minnesota House and Senate',
      'Two Supreme Court justices and five Court of Appeals judges',
      'One constitutional amendment, on the permanent school fund',
    ],
    addressPlaceholder: 'e.g. 350 S 5th St, Minneapolis or 75 Rev Dr Martin Luther King Jr Blvd, St Paul',
    exampleAddress: '350 S 5th St, Minneapolis',
    districtKinds: 'U.S. House, state Senate and state House',
    measuresLabel: 'constitutional amendment',
    sectionNotes: {
      judicial: <>Judges are on the <strong>nonpartisan</strong> part of your ballot: no party labels. The sitting judge is marked “incumbent”, and most run unopposed; marking them is a vote, leaving it blank is fine too. District court judges for your area aren’t in here yet; your sample ballot has them.</>,
      measures: <>One statewide question. <strong>A blank vote counts as a no:</strong> an amendment passes only if a majority of everyone voting in the election marks yes. Your city or school district may add local questions; your sample ballot has those.</>,
    },
    countyScope: 'the statewide races, the judges and the amendment, plus every Congress and St. Paul district that reaches into the county',
    notCarried: 'County and local offices, school boards, district court judges and local questions',
    localContests: 'County commissioners, sheriff and attorney, soil and water supervisors, district court judges, city, township and school board seats, and local levy and charter questions.',
    clerkOf: (county) => `, from the ${county} County election office`,
    moneyFilings: 'FEC filings',
    legislature: 'Minnesota Legislature',
    howItWorks: {
      title: 'How a Minnesota ballot works',
      body: <>
        <p><strong>Top to bottom.</strong> Federal offices first (U.S. Senate, U.S. House), then the state offices, your state senator and representative, county and local offices, school board, the judges, and the constitutional amendment at the end.</p>
        <p><strong>No straight-party box.</strong> Minnesota has none; every race is marked on its own. Party labels print next to each name in the partisan races (Democratic-Farmer-Labor is Minnesota’s Democratic Party).</p>
        <p><strong>Judges.</strong> Listed without party; the sitting judge is marked “incumbent”. Most run unopposed, and there’s a write-in line.</p>
        <p><strong>The amendment counts blanks as no.</strong> It passes only with a majority of everyone voting in the election, so leaving it empty is the same as voting no.</p>
      </>,
    },
    notesLine: 'Minnesota voters may bring notes or a marked sample ballot into the voting booth.',
    sources,
  },
};
