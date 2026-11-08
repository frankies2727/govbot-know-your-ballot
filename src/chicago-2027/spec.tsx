import cookMapsUrl from '../data/illinois/districts.json?url';
import rawData from '../data/chicago-2027/ballot.json';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { geocode, getMaps, lookIn, type Maps } from '../lookup';
import { Out } from '../PlanToVote';
import { chicagoConfig, DISTRICT_CHIPS, LINKS, SECTIONS } from './config';
import { KEY_DATES } from './dates';
import { chicagoFaq } from './faq';
import { ChicagoMap } from './Hero';
import { NextElectionNote } from './NextUp';
import { CHICAGO_GUIDES, PlanToVote } from './PlanToVote';
import './chicago.css';

const data = rawData as unknown as StateData;
/** Where a party comes from on a ballot that prints none. */
const PARTY_NOTE = 'No party is printed on this ballot. A party shown here is the one the candidate lists on their campaign filing with the Illinois State Board of Elections, or else Wikidata’s record; “No party on file” means neither has one.';
/** Wards with one candidate, for "How it works". */
const unopposed = data.races.filter((r) => r.section === 'council' && r.candidates.length === 1).length;

// Where every piece comes from: what each source owns, how fresh it is, and a link to check it.
const sources = (d: StateData): SourceCard[] => [
  { emoji: '🗳️', title: 'Who’s running', status: `Official · daily · list as of ${d.sources.candidates.asOf}`,
    body: 'Every race and every candidate from the Chicago Board of Election Commissioners’ list of candidate filings, in its ballot order, with each name as the Board writes it. A filing under objection stays on, marked, until the Board rules; a withdrawn or removed one comes off. The Board certifies the ballot on Dec 17, 2026.',
    links: [['Board candidate list', LINKS.candidates], ['2027 election calendar', LINKS.calendar]] },
  { emoji: '👤', title: 'Who’s in office now', status: 'Official · daily',
    body: 'Each ward’s alderperson, with the City Clerk’s official photo and the ward office, from the City’s ward offices data; each police district council’s members, and the area it serves in the Commission’s own words, from the Community Commission for Public Safety and Accountability. The mayor, clerk and treasurer from the City’s own pages. Whether they’re running is read from the Board’s list, never guessed.',
    links: [['Ward offices (Chicago Data Portal)', 'https://data.cityofchicago.org/d/htai-wnw4'], ['CCPSA district councils', 'https://ccpsa.chicago.gov/about-the-district-councils/']] },
  { emoji: '💵', title: 'Campaign money', status: 'Official · daily',
    body: 'Raised, spent and cash on hand since Jan 1, 2025, from the quarterly reports each candidate’s committee files with the Illinois State Board of Elections, attached only on a confident name, office and ward match. A candidate who raises or spends under $5,000 in a year needs no committee.',
    links: [['ISBE campaign disclosure', LINKS.disclosure], ['ISBE data files', d.sources.money.file]] },
  { emoji: '📝', title: 'Petitions, and more on each candidate', status: 'Linked',
    body: 'Chicago Politics counts the signatures on each candidate’s nominating petition from the Board’s copy, and tracks sitting alderpersons’ votes and money. Each candidate links to their page there (data CC BY 4.0, Chicago Politics).',
    links: [['Chicago Politics: 2027 election', LINKS.chicagoPolitics]] },
  { emoji: '🎗️', title: 'Party', status: 'Official where on file',
    body: `${PARTY_NOTE} Wikidata is used only for the national parties, and only for someone it places in Chicago or Illinois.`,
    links: [['ISBE candidate records', d.sources.money.file], ['Wikidata', 'https://www.wikidata.org/']] },
  { emoji: '📷', title: 'Photos, websites & social media', status: 'Live · daily',
    body: 'Sitting alderpersons’ photos are the City Clerk’s official portraits. For everyone else, Wikidata and the candidate’s own campaign site, matched on the whole name. Every photo is credited on the card; candidates with none show their initials.',
    links: [['Wikidata', 'https://www.wikidata.org/']] },
  { emoji: '🗺️', title: 'Ward and police district maps', status: 'Live',
    body: 'The City’s 2023 ward map and the Chicago Police Department’s district boundaries, from the Chicago Data Portal. Your address is matched to them on your device.',
    links: [['Chicago Data Portal', 'https://data.cityofchicago.org/']] },
  { emoji: '📍', title: 'Address lookup', status: 'Live',
    body: 'Your address goes to Cook County’s official address locator (or OpenStreetMap’s if it’s down), which answers with coordinates. Districts are matched on your device.',
    links: [['Cook County GIS', 'https://gis.cookcountyil.gov/']] },
  { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Nov 8, 2026',
    body: 'Every date, how each race is won, the terms and the qualifications, from the Board’s 2027 Election Information Pamphlet and Calendar; the district councils’ work from the CCPSA.',
    links: [['2027 calendar (PDF)', LINKS.calendar], ['CCPSA: 2027 election', LINKS.ccpsa]] },
  { emoji: '⏳', title: 'Not here yet', status: 'Planned', planned: true,
    body: 'Ballot questions: the City Council and residents can still put questions on this ballot (petitions by Nov 23, Council resolutions by Dec 7, 2026); any that are certified will be added. Early voting sites and hours come out by Jan 3, 2027.',
    links: [['Board of Elections', 'https://chicagoelections.gov/']] },
];

let maps: Maps | null = null;
/** The ward and police district maps (Illinois' Cook County maps), loaded on demand; a failed download is retried next time. */
const prefetchDistricts = () => (maps ??= getMaps(cookMapsUrl).catch((e) => { maps = null; throw e; }));

export const CHICAGO_2027_GUIDE: GuideSpec = {
  slug: 'chicago-2027', code: 'CHI', name: 'Chicago', capital: 'City Hall',
  data,
  results: { races: {} },
  Map: ChicagoMap,
  cssClass: 'kyb-chi',
  config: chicagoConfig(data),
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'the Chicago Board of Elections’ voter lookup', dates: LINKS.calendar, datesSource: 'Chicago Board of Election Commissioners', ballotpedia: LINKS.candidates },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: CHICAGO_GUIDES,
  NextElectionNote,
  lawsFrom: { code: 'IL', name: 'Illinois', capital: 'Springfield' },
  inArea: (d) => Boolean(d.ward),
  faq: chicagoFaq,
  lookup: {
    geocode,
    prefetchDistricts,
    districtsAt: (lat, lng) => lookIn(prefetchDistricts(), lat, lng),
  },
  copy: {
    overline: 'Chicago · February 23, 2027',
    heading: 'Know Your Chicago Ballot',
    everyone: 'citywide',
    electionName: 'Chicago’s February 2027 Election',
    addressNote: 'Cook County’s address search (OpenStreetMap’s if it’s down)',
    outside: <>That address is outside Chicago. This guide is for Chicago’s Feb 23, 2027 city election; suburban Cook County votes on Feb 23 only where a local primary is needed, and on Apr 6 for village, school and park boards.</>,
    sampleScope: 'every race and candidate for this address, in the Board’s ballot order. Ballot numbers are printed once the Board certifies the ballot; the official sample ballot is at',
    bullets: [
      'Mayor, City Clerk and City Treasurer',
      'Your ward’s alderperson, one of 50',
      'Three members of your police district’s District Council',
      'Nonpartisan: no party is printed next to any name, and runoffs on Apr 6 where no one wins a majority',
    ],
    addressPlaceholder: 'e.g. 121 N LaSalle St or 5800 N Lincoln Ave',
    exampleAddress: '121 N LaSalle St, Chicago',
    districtKinds: 'ward and police district',
    measuresLabel: 'citywide questions',
    sectionNotes: {
      city: <>{PARTY_NOTE}</>,
      council: <>{PARTY_NOTE}</>,
      police: <>Each police district elects three members. You may vote for up to 3; the three with the most votes win, with no runoff. <Out href={LINKS.ccpsa}>About the District Councils</Out>. {PARTY_NOTE}</>,
    },
    countyScope: 'every race',
    notCarried: '',
    localContests: '',
    clerkOf: () => '',
    moneyFilings: 'Illinois State Board of Elections filings',
    legislature: 'Illinois General Assembly',
    howItWorks: {
      title: 'How Chicago’s city ballot works',
      body: (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p><strong>Three parts, every race nonpartisan.</strong> The citywide offices (mayor, clerk, treasurer), your ward’s alderperson, and your police district’s council. No party appears next to any name.</p>
          <p><strong>Win with a majority, or meet in a runoff.</strong> For mayor, clerk, treasurer and alderperson a candidate needs more than half the votes. If no one gets there, the top two face each other again on Apr 6, 2027.</p>
          <p><strong>District councils: vote for up to three.</strong> Each of the 22 police districts elects three members. The three with the most votes win; there’s no runoff.</p>
          <p><strong>One name in a race?</strong> {unopposed} ward{unopposed === 1 ? ' has' : 's have'} a single candidate. Marking them is still a vote; leaving it blank is fine too.</p>
          <p><strong>Ballot order.</strong> Names are listed in the order the Board will print them, set by when each candidate filed (and a lottery among those who filed at the same moment). The order says nothing about the candidates.</p>
        </div>
      ),
    },
    notesLine: 'Illinois voters may bring notes or a marked sample ballot into the voting booth.',
    sources,
  },
};
