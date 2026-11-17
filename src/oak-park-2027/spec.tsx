import rawData from '../data/oak-park-2027/ballot.json';
import type { GuideSpec, SourceCard } from '../guide/spec';
import type { StateData } from '../guide/types';
import { Out } from '../PlanToVote';
import { DISTRICT_CHIPS, LINKS, OAK_PARK_2027, SECTIONS } from './config';
import { KEY_DATES } from './dates';
import { oakParkFaq } from './faq';
import { OakParkMap } from './Hero';
import { NextElectionNote } from './NextUp';
import { OAK_PARK_GUIDES, PlanToVote } from './PlanToVote';
import './oak-park.css';

const data = rawData as unknown as StateData;
const NONPARTISAN = 'Nonpartisan: no party is printed next to any name, and there is no primary.';

const sources = (d: StateData): SourceCard[] => [
  { emoji: '🗳️', title: 'Who’s running', status: `Official · daily · as of ${d.sources.candidates.asOf}`,
    body: 'Candidates listed with the Illinois State Board of Elections for one of these offices in 2027, plus those the Wednesday Journal has reported as running who aren’t listed there yet (marked “Announced”). Petitions are filed Nov 16–23, 2026 with each body; the official ballot, in its drawn order, is certified Jan 28, 2027. Until then names are listed alphabetically. District 97 candidates aren’t placed until the certified list says which term they filed for.',
    links: [['Illinois State Board of Elections', LINKS.disclosure], ['Wednesday Journal', LINKS.wednesdayJournal]] },
  { emoji: '💵', title: 'Campaign money', status: 'Official · daily',
    body: 'Raised and spent by each candidate’s committee in its reports to the Illinois State Board of Elections since Jan 1, 2025. A candidate who raises or spends under $5,000 doesn’t need a committee, so no money shown doesn’t mean none raised.',
    links: [['Illinois State Board of Elections', LINKS.disclosure]] },
  { emoji: '👤', title: 'Who’s in office now', status: 'Official · checked Nov 17, 2026',
    body: 'From each body’s own page: the Village Board, District 97, District 200, the Library, the Park District and Triton College.',
    links: [['Village of Oak Park', LINKS.village], ['District 97', LINKS.d97], ['District 200', LINKS.d200], ['Library', LINKS.library], ['Park District', LINKS.park], ['Triton College', LINKS.triton]] },
  { emoji: '🗺️', title: 'Precinct map', status: 'Live',
    body: 'Oak Park’s 32 voting precincts, from Cook County’s GIS. Every precinct votes on the same races; your precinct only sets your polling place, which the Cook County Clerk’s lookup shows.',
    links: [['Cook County GIS', 'https://gis.cookcountyil.gov/']] },
  { emoji: '🗓️', title: 'Dates & rules', status: 'Checked Nov 17, 2026',
    body: 'Dates from the Illinois State Board of Elections’ 2027 Election & Campaign Finance Calendar; filing rules and terms from its 2027 Candidate’s Guide; the seats up from each body’s notices.',
    links: [['2027 election calendar (PDF)', LINKS.calendar], ['2027 Candidate’s Guide (PDF)', LINKS.candidatesGuide], ['Triton’s notice of filing (PDF)', LINKS.tritonNotice]] },
  { emoji: '⏳', title: 'Not here yet', status: 'Planned', planned: true,
    body: 'Ballot questions: boards can put questions on this ballot until Jan 19, 2027, and voters by petition until Jan 4; any certified will be added. The certified candidate list and ballot order follow on Jan 28.',
    links: [['Cook County Clerk: elections', LINKS.clerk]] },
];

export const OAK_PARK_2027_GUIDE: GuideSpec = {
  slug: 'oak-park-2027', code: 'OP', name: 'Oak Park', capital: 'Village Hall',
  data,
  results: { races: {} },
  Map: OakParkMap,
  cssClass: 'kyb-op',
  config: OAK_PARK_2027,
  sections: SECTIONS,
  districtChips: DISTRICT_CHIPS,
  links: { myInfo: LINKS.myInfo, myInfoLabel: 'the Cook County Clerk', dates: LINKS.calendar, datesSource: 'Illinois State Board of Elections', ballotpedia: LINKS.disclosure },
  keyDates: KEY_DATES,
  PlanToVote,
  guides: OAK_PARK_GUIDES,
  NextElectionNote,
  lawsFrom: { code: 'IL', name: 'Illinois', capital: 'Springfield' },
  faq: oakParkFaq,
  copy: {
    overline: 'Oak Park · April 6, 2027',
    heading: 'Know Your Oak Park Ballot',
    everyone: 'village-wide',
    electionName: 'Oak Park’s April 2027 Election',
    sampleScope: 'every race and known candidate for Oak Park. The certified ballot, in its drawn order, is on your sample ballot at',
    bullets: [
      'Three Village Trustees, with ranked-choice voting still unsettled',
      'District 97 and District 200 (OPRF High School) school boards',
      'Library Trustees and Park District Commissioners',
      'Two Triton College trustees; every race nonpartisan, no primary',
    ],
    sameBallot: 'Every Oak Park voter gets the same ballot: the village, both school districts, the library, the parks and Triton College. No address needed.',
    districtKinds: 'village',
    measuresLabel: 'village questions',
    sectionNotes: {
      city: <>{NONPARTISAN} Ranked-choice voting: voters approved it in 2024 (<Out href={LINKS.rcvNews}>Wednesday Journal</Out>), but the Cook County Clerk says state law doesn’t allow it yet (<Out href={LINKS.rcvClerk}>the Clerk’s office, as reported</Out>).</>,
      school: <>{NONPARTISAN} District 200 is shared with River Forest; its voters elect the same board.</>,
      council: <>{NONPARTISAN}</>,
      education: <>{NONPARTISAN} Elected by all of Community College District 504, from Oak Park to Melrose Park and beyond.</>,
    },
    countyScope: 'every race',
    notCarried: '',
    localContests: '',
    clerkOf: () => '',
    moneyFilings: 'Illinois State Board of Elections reports',
    legislature: 'Illinois General Assembly',
    howItWorks: {
      title: 'How Oak Park’s ballot works',
      body: (
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p><strong>One ballot for the whole village.</strong> Every Oak Park voter gets the same races: the village, both school districts, the library, the parks and Triton College. Nonpartisan, with no primary.</p>
          <p><strong>Vote for up to the number of seats.</strong> Three trustees are up, so you can vote for up to three; the most votes win.</p>
          <p><strong>Ranked choice, unsettled.</strong> Oak Park voters approved ranked-choice voting for village trustees in 2024. The Cook County Clerk, who runs the election, has said Illinois law doesn’t allow it yet, so whether the April ballot uses it isn’t decided. <Out href={LINKS.rcvQuestion}>League of Women Voters of Oak Park and River Forest</Out></p>
          <p><strong>Who’s listed.</strong> Until the ballot is certified on Jan 28, candidates listed with the State Board, or reported as running, are shown alphabetically. <Out href={LINKS.villageClerk}>Village Clerk</Out></p>
        </div>
      ),
    },
    notesLine: 'Bring your notes into the booth: Illinois allows it.',
    sources,
  },
};
