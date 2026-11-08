import mapsUrl from '../data/wisconsin/districts.json?url';
import rawData from '../data/wisconsin-2027/ballot.json';
import { makeLookup } from '../guide/lookup';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { Out } from '../PlanToVote';
import { WisconsinMap } from '../wisconsin/Hero';
import '../wisconsin/wisconsin.css';
import { DISTRICT_CHIPS, LINKS, SECTIONS, WISCONSIN_2027 } from './config';
import { KEY_DATES } from './dates';
import { springFaq } from './faq';
import { NextElectionNote } from './NextUp';
import { PlanToVote, SPRING_GUIDES } from './PlanToVote';

const data = rawData as unknown as StateData;
const official = (data.sources as { official?: boolean }).official;
const ARTICLE = 'https://en.wikipedia.org/wiki/2027_Wisconsin_elections';

const sources = (d: StateData): SourceCard[] => [
  { emoji: '🗳️', title: 'Who’s running', status: official ? `Official · list printed ${d.sources.candidates.asOf}` : `Announced only · read ${d.sources.candidates.asOf}`,
    body: official
      ? 'Every race and candidate from the Wisconsin Elections Commission’s “Candidates on Ballot” list, in ballot order.'
      : 'Candidates file nomination papers by 5pm on Tue, Jan 5, 2027; the Elections Commission’s list then replaces everything here. Until then, which seats are up, who holds them and who has announced come from the Wikipedia articles on the 2027 Wisconsin elections (CC BY-SA), and an announced candidate is marked as one.',
    links: [['Wikipedia: 2027 Wisconsin elections', ARTICLE], ['Wikipedia: 2027 Supreme Court election', 'https://en.wikipedia.org/wiki/2027_Wisconsin_Supreme_Court_election'], ['Elections Commission candidates', 'https://elections.wi.gov/candidates-and-committees/candidates']] },
  { emoji: '🗺️', title: 'Your county and appeals district', status: 'Live',
    body: 'Your address is matched on your device to your county (the Census Bureau’s county lines), which sets your circuit court and your Court of Appeals district (Wis. Stat. 752.11).',
    links: [['Census TIGERweb', 'https://tigerweb.geo.census.gov/']] },
  { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Nov 8, 2026',
    body: 'The primary and election dates and the registration, absentee and photo ID rules from Wisconsin election law (Wis. Stat. 5.02, 6.28, 6.29, 6.86, 6.87, 8.10) and the Elections Commission’s voter pages.',
    links: [['MyVote Wisconsin', LINKS.myInfo], ['Upcoming elections', LINKS.dates]] },
  { emoji: '⏳', title: 'Not here', status: 'By design', planned: true,
    body: 'City, village, town, county and school races (mayors, councils, school boards, Milwaukee and Waukesha county executives) differ by address; your sample ballot at MyVote.wi.gov has them.',
    links: [['Your sample ballot', LINKS.myInfo]] },
];

export const WISCONSIN_2027_GUIDE: GuideSpec = {
  slug: 'wisconsin-2027', code: 'WI27', name: 'Wisconsin', capital: 'Madison',
  data,
  results: { races: {} },
  Map: WisconsinMap,
  cssClass: 'kyb-wi',
  config: WISCONSIN_2027,
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'MyVote.wi.gov', dates: LINKS.dates, datesSource: 'Wisconsin Elections Commission', ballotpedia: ARTICLE },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: SPRING_GUIDES,
  NextElectionNote,
  lawsFrom: { code: 'WI', name: 'Wisconsin', capital: 'Madison' },
  faq: springFaq,
  // The county decides the Court of Appeals district (Wis. Stat. 752.11).
  lookup: makeLookup({ mapsUrl, bbox: [-92.89, 42.49, -86.25, 47.31], abbr: 'WI', name: 'Wisconsin', decorate: (d, data) => { if (d.county) d.coa = data.coa?.[d.county]; } }),
  copy: {
    overline: 'Wisconsin · Spring 2027',
    heading: 'Know Your Wisconsin Spring Ballot',
    electionName: 'Wisconsin’s Spring 2027 Election',
    bullets: [
      'An open seat on the Wisconsin Supreme Court',
      'A Court of Appeals seat in your district',
      'Your county’s circuit court seats, where one is up',
      'Nonpartisan: a Feb 16 primary only where more than two people file, then Apr 6',
    ],
    addressPlaceholder: 'e.g. 200 E Wells St, Milwaukee or 2 E Main St, Madison',
    exampleAddress: '200 E Wells St, Milwaukee',
    districtKinds: 'Court of Appeals and circuit court',
    measuresLabel: 'statewide questions',
    sectionNotes: {
      judicial: <>Every spring race is nonpartisan. Your city, village, town and school races are on your sample ballot at <Out href={LINKS.myInfo}>MyVote.wi.gov</Out>.</>,
    },
    countyScope: 'the Supreme Court, the county’s Court of Appeals district and its circuit court seats',
    notCarried: 'City, village, town, county and school races',
    localContests: 'Mayors, councils, village and town boards, school boards and county races.',
    clerkOf: (county) => `, from your municipal clerk in ${county} County`,
    moneyFilings: 'Wisconsin campaign finance filings',
    legislature: 'Wisconsin Legislature',
    sampleScope: 'the Supreme Court, Court of Appeals and circuit court contests on this ballot. Local races and your official ballot order are on the sample ballot at',
    howItWorks: {
      title: 'How Wisconsin’s spring ballot works',
      body: (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p><strong>Nonpartisan, top to bottom.</strong> No party appears next to any judge or local candidate.</p>
          <p><strong>A primary only where needed.</strong> If more than two people file for an office, a Feb 16 primary narrows it to two; otherwise the race goes straight to Apr 6.</p>
          <p><strong>One seat, one vote.</strong> Each court seat is its own contest: pick one candidate for each.</p>
          <p><strong>One name in a race?</strong> Judges often run unopposed. Marking them is still a vote; leaving it blank is fine too.</p>
        </div>
      ),
    },
    notesLine: 'Wisconsin voters may bring notes or a marked sample ballot into the voting booth.',
    sources,
  },
};
