import mapsUrl from '../data/jacksonville-2027/districts.json?url';
import rawData from '../data/jacksonville-2027/ballot.json';
import { makeLookup } from '../guide/lookup';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { Out } from '../PlanToVote';
import { DISTRICT_CHIPS, JACKSONVILLE_2027, LINKS, SECTIONS } from './config';
import { KEY_DATES } from './dates';
import { jacksonvilleFaq } from './faq';
import { JacksonvilleMap } from './Hero';
import { NextElectionNote } from './NextUp';
import { JACKSONVILLE_GUIDES, PlanToVote } from './PlanToVote';
import './jacksonville.css';

const data = rawData as unknown as StateData;
const PARTY = 'The party is printed next to each name, but every voter votes in every race, whatever their own party.';

const sources = (d: StateData): SourceCard[] => [
  { emoji: '🗳️', title: 'Who’s running', status: `Declared only · read ${d.sources.candidates.asOf}`,
    body: 'Candidates qualify from noon Jan 11 to noon Jan 15, 2027, and the Duval County Supervisor of Elections’ list then replaces everything here. Until then, the mayor’s race lists who has declared, with the party given, from the Wikipedia article on it (CC BY-SA), which cites the Supervisor’s list and news reports; each is marked as not yet qualified. The Supervisor’s own site turns automated readers away, so the other races fill in once its qualified list is out.',
    links: [['Wikipedia: 2027 Jacksonville mayoral election', LINKS.mayorArticle], ['Supervisor of Elections: active candidates', LINKS.candidates]] },
  { emoji: '👤', title: 'Who’s in office now', status: 'Official · daily',
    body: 'Each council seat’s member from the City Council’s members page; the mayor, sheriff, property appraiser, supervisor of elections and tax collector from their offices’ pages.',
    links: [['Jacksonville City Council', LINKS.council]] },
  { emoji: '💵', title: 'Campaign money', status: 'Linked',
    body: 'Candidates file their campaign reports with the Duval County Supervisor of Elections; each candidate links to its search. Money totals come here once they can be read.',
    links: [['Supervisor of Elections: candidate resources', LINKS.candidateResources]] },
  { emoji: '🗺️', title: 'Council district map', status: 'Live',
    body: 'The City’s 14 council districts (JaxGIS, the City of Jacksonville’s map office), covering all of Duval County. Your address is matched to them on your device.',
    links: [['JaxGIS: Council Districts', 'https://services1.arcgis.com/NXfNVaFp7QMxnE3j/arcgis/rest/services/CouncilDistricts/FeatureServer']] },
  { emoji: '📍', title: 'Address lookup', status: 'Live',
    body: 'Your address goes to OpenStreetMap’s search (Photon, or Nominatim if it’s down), limited to the Jacksonville area, which answers with coordinates. The district is matched on your device.',
    links: [['OpenStreetMap', 'https://www.openstreetmap.org/']] },
  { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Nov 8, 2026',
    body: 'The election dates, qualifying and the offices on the ballot from the Supervisor of Elections’ 2027 dates and office information sheets; registration, mail-ballot and ID rules from Florida election law.',
    links: [['2027 dates and deadlines', LINKS.dates], ['Mayor’s office information (PDF)', LINKS.mayorSheet]] },
  { emoji: '⏳', title: 'Not here yet', status: 'Planned', planned: true,
    body: 'The qualified candidates for every race (after Jan 15), early voting days and sites, and any ballot questions the City Council places on the ballot.',
    links: [['Supervisor of Elections', LINKS.soe]] },
];

export const JACKSONVILLE_2027_GUIDE: GuideSpec = {
  slug: 'jacksonville-2027', code: 'JAX', name: 'Jacksonville', capital: 'City Hall',
  data,
  results: { races: {} },
  Map: JacksonvilleMap,
  cssClass: 'kyb-jax',
  config: JACKSONVILLE_2027,
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'the Florida Division of Elections’ lookup', dates: LINKS.dates, datesSource: 'Duval County Supervisor of Elections', ballotpedia: LINKS.mayorArticle },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: JACKSONVILLE_GUIDES,
  NextElectionNote,
  inArea: (d) => Boolean(d.council),
  faq: jacksonvilleFaq,
  lookup: makeLookup({ mapsUrl, bbox: [-82.05, 30.1, -81.38, 30.59], abbr: 'FL', name: 'Florida', place: 'Jacksonville, Florida' }),
  copy: {
    overline: 'Jacksonville · March 9, 2027',
    heading: 'Know Your Jacksonville Ballot',
    everyone: 'countywide',
    electionName: 'Jacksonville’s March 2027 Election',
    addressNote: 'OpenStreetMap’s address search',
    outside: <>That address is outside Duval County. This guide is for Jacksonville’s Mar 9, 2027 city election, which every Duval County voter votes in.</>,
    sampleScope: 'every race on this address’s ballot. The qualified candidates come after Jan 15, 2027, and your official sample ballot from the Duval County Supervisor of Elections; check your registration at',
    bullets: [
      'Mayor',
      'Sheriff, Property Appraiser, Supervisor of Elections and Tax Collector',
      'All five at-large City Council seats, and your district’s member, one of 14',
      'One ballot for every voter, any party; a May 18 runoff where no one wins a majority',
    ],
    addressPlaceholder: 'e.g. 117 W Duval St or 1 Ocean Blvd, Atlantic Beach',
    exampleAddress: '117 W Duval St, Jacksonville',
    districtKinds: 'council district',
    measuresLabel: 'countywide questions',
    sectionNotes: {
      city: <>{PARTY}</>,
      county: <>Duval County’s constitutional officers, elected with the city’s offices. {PARTY}</>,
      council: <>Every voter votes for all five at-large seats and for their own district’s member. {PARTY}</>,
    },
    countyScope: 'every race',
    notCarried: '',
    localContests: '',
    clerkOf: () => '',
    moneyFilings: 'Duval County Supervisor of Elections reports',
    legislature: 'Jacksonville City Council',
    howItWorks: {
      title: 'How Jacksonville’s city ballot works',
      body: (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p><strong>One election for everyone.</strong> Every candidate, of every party, is on the same ballot for every Duval County voter, the Beaches and Baldwin included. The party is printed next to each name; yours doesn’t limit your choices.</p>
          <p><strong>A majority wins, or a runoff on May 18.</strong> More than half the votes on Mar 9 wins the seat. If no one gets there, the top two meet again in the General Election on May 18, 2027.</p>
          <p><strong>Five at-large seats, plus your district.</strong> You vote for all five at-large council groups and for your district’s member.</p>
          <p><strong>Who’s listed.</strong> Until qualifying closes on Jan 15, only the mayor’s race lists who has declared. <Out href={LINKS.candidates}>The Supervisor of Elections’ candidate list</Out></p>
        </div>
      ),
    },
    notesLine: 'Bring your notes, or keep them beside you as you mark a mail ballot.',
    sources,
  },
};
