import mapsUrl from '../data/denver-2027/districts.json?url';
import rawData from '../data/denver-2027/ballot.json';
import { makeLookup } from '../guide/lookup';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { Out } from '../PlanToVote';
import { DENVER_2027, DISTRICT_CHIPS, LINKS, SECTIONS } from './config';
import { KEY_DATES } from './dates';
import { denverFaq } from './faq';
import { DenverMap } from './Hero';
import { NextElectionNote } from './NextUp';
import { DENVER_GUIDES, PlanToVote } from './PlanToVote';
import './denver.css';

const data = rawData as unknown as StateData;
const NONPARTISAN = 'Denver’s city races are nonpartisan: no party is printed next to any name.';

const sources = (d: StateData): SourceCard[] => [
  { emoji: '🗳️', title: 'Who’s running', status: `Official · daily · registered as of ${d.sources.candidates.asOf}`,
    body: 'Everyone who has registered a campaign for the 2027 election with Denver SearchLight, the City’s campaign finance system, with the name as they registered it. Registering isn’t qualifying: petitions are due Jan 21, 2027, and the Elections Division then certifies who is on the ballot and draws the order of names by lot. Until then names are listed alphabetically. Someone registered for two offices is listed for the later one.',
    links: [['Denver SearchLight', LINKS.searchlight], ['2027 candidate packet (PDF)', LINKS.packet]] },
  { emoji: '💵', title: 'Campaign money', status: 'Official · daily',
    body: 'Raised and spent since Jan 1, 2024 by each candidate’s committee, as Denver SearchLight totals it. Raised includes Fair Elections Fund matching money, the City’s public match for small donations, which is shown on its own too.',
    links: [['Denver SearchLight', LINKS.searchlight]] },
  { emoji: '👤', title: 'Who’s in office now', status: 'Official · daily',
    body: 'Each district’s council member and the two at-large members from the City’s council district map; the mayor, auditor and clerk and recorder from their offices’ pages. Whether they’re running is read from SearchLight, never guessed.',
    links: [['Council districts (Denver Open Data)', 'https://opendata-geospatialdenver.hub.arcgis.com/datasets/geospatialdenver::council-districts']] },
  { emoji: '🗺️', title: 'Council district map', status: 'Live',
    body: 'The City’s 11 council districts, from Denver Open Data. Your address is matched to them on your device.',
    links: [['Denver Open Data', 'https://opendata-geospatialdenver.hub.arcgis.com/']] },
  { emoji: '📍', title: 'Address lookup', status: 'Live',
    body: 'Your address goes to OpenStreetMap’s search (Photon, or Nominatim if it’s down), limited to the Denver area, which answers with coordinates. The district is matched on your device.',
    links: [['OpenStreetMap', 'https://www.openstreetmap.org/']] },
  { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Nov 8, 2026',
    body: 'The offices, petitions, runoff and ballot order from the Elections Division’s 2027 Municipal Candidate Information Packet and the Denver Charter; mailing, registration and return deadlines from Colorado election law.',
    links: [['2027 candidate packet (PDF)', LINKS.packet], ['Denver Elections Division', LINKS.elections]] },
  { emoji: '⏳', title: 'Not here yet', status: 'Planned', planned: true,
    body: 'Ballot questions: the City Council and petitioners can still refer measures to this ballot; any that are certified will be added. The certified candidate list and ballot order come in February.',
    links: [['Denver Elections Division', LINKS.elections]] },
];

export const DENVER_2027_GUIDE: GuideSpec = {
  slug: 'denver-2027', code: 'DEN', name: 'Denver', capital: 'the City and County Building',
  data,
  results: { races: {} },
  Map: DenverMap,
  cssClass: 'kyb-den',
  config: DENVER_2027,
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'GoVoteColorado.gov', dates: LINKS.elections, datesSource: 'Denver Elections Division', ballotpedia: LINKS.searchlight },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: DENVER_GUIDES,
  NextElectionNote,
  lawsFrom: { code: 'CO', name: 'Colorado', capital: 'the State Capitol in Denver' },
  inArea: (d) => Boolean(d.council),
  faq: denverFaq,
  lookup: makeLookup({ mapsUrl, bbox: [-105.11, 39.61, -104.6, 39.92], abbr: 'CO', name: 'Colorado', place: 'Denver, Colorado' }),
  copy: {
    overline: 'Denver · April 6, 2027',
    heading: 'Know Your Denver Ballot',
    everyone: 'citywide',
    electionName: 'Denver’s April 2027 Election',
    addressNote: 'OpenStreetMap’s address search',
    outside: <>That address is outside Denver. This guide is for the City and County of Denver’s Apr 6, 2027 election; suburbs like Aurora, Lakewood and Englewood hold their city elections in November.</>,
    sampleScope: 'every race and registered candidate for this address. The certified ballot, in the order drawn by lot, is on your sample ballot at',
    bullets: [
      'Mayor, Auditor and Clerk and Recorder',
      'City Council At-Large Seats A and B, now separate races',
      'Your district’s City Council member, one of 11',
      'Nonpartisan, all by mail, with runoffs on Jun 1 where no one wins a majority',
    ],
    addressPlaceholder: 'e.g. 1437 Bannock St or 3001 E Colfax Ave',
    exampleAddress: '1437 Bannock St, Denver',
    districtKinds: 'council district',
    measuresLabel: 'citywide questions',
    sectionNotes: {
      city: <>{NONPARTISAN}</>,
      council: <>{NONPARTISAN} Every voter votes for both at-large seats and for their own district’s member.</>,
    },
    countyScope: 'every race',
    notCarried: '',
    localContests: '',
    clerkOf: () => '',
    moneyFilings: 'Denver SearchLight reports',
    legislature: 'Colorado General Assembly',
    howItWorks: {
      title: 'How Denver’s city ballot works',
      body: (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p><strong>Nonpartisan, and all by mail.</strong> Every registered voter gets a ballot in the mail; no party appears next to any name. Return it by mail, at a drop box, or vote in person at a Voter Service and Polling Center.</p>
          <p><strong>Win with a majority, or meet in a runoff.</strong> Every race needs more than half the votes. If no one gets there, the top two face each other again on Jun 1, 2027.</p>
          <p><strong>Two at-large seats, two races.</strong> New in 2027: Seat A and Seat B are separate contests, and you vote in both, plus your own district’s race.</p>
          <p><strong>Who’s listed.</strong> Until petitions are certified in February, everyone who has registered a campaign is shown, alphabetically. The official ballot order is drawn by lot. <Out href={LINKS.elections}>Denver Elections Division</Out></p>
        </div>
      ),
    },
    notesLine: 'Fill in your mail ballot with your notes beside you.',
    sources,
  },
};
