// The plain words behind "How a ballot works", the official voter portals and
// the two questions about the site itself. One copy: the app's How-it-works
// tab, the visible "Common questions" section, the text a crawler reads in the
// page and the FAQ structured data all come from here (see faq.ts).

export type StateSlug = 'illinois' | 'michigan' | 'minnesota' | 'wisconsin';

export const STATE_NAMES: Record<StateSlug, string> = { illinois: 'Illinois', michigan: 'Michigan', minnesota: 'Minnesota', wisconsin: 'Wisconsin' };
export const STATE_SLUGS = Object.keys(STATE_NAMES) as StateSlug[];

export interface HowItem { lead: string; text: string }

/** How each state's ballot is laid out, as the app's "How a … ballot works" panel says it. */
export const HOW: Record<StateSlug, HowItem[]> = {
  illinois: [
    { lead: 'Three parts.', text: 'Candidates by office, in the order the Board of Elections sets (federal first, then state, county, judges and school board); the judges up for retention; then the referenda.' },
    { lead: 'No straight-party box.', text: 'Illinois dropped it: every race is marked on its own.' },
    { lead: 'Ballot numbers.', text: 'On a Chicago ballot each candidate has a number; the print view lists them so you can find names fast in the booth. Suburban Cook ballots order candidates differently.' },
    { lead: '“Vote for not more than N.”', text: 'Some contests (the Water Reclamation District, some judicial vacancies) fill several seats at once; pick up to that many.' },
    { lead: 'Keep these judges?', text: 'Retention is a yes or no on each sitting judge, with no opponent; a judge stays with at least 60% yes.' },
    { lead: 'Referenda.', text: 'Yes or no on each question; which ones you see depends on your ward or precinct.' },
  ],
  michigan: [
    { lead: 'Three parts.', text: 'The partisan section (Congress, governor, Lansing, the school and university boards), the nonpartisan section (judges, plus local offices like city council in many places) and the proposals.' },
    { lead: 'The straight-party box.', text: 'At the top, one mark votes for every candidate of that party in the partisan section. You can still mark individual races, and those marks win for that race. It never touches the nonpartisan section or the proposals, so look at those either way.' },
    { lead: '“Vote for not more than 2.”', text: 'Boards and the Supreme Court elect two seats at once; pick up to two names.' },
    { lead: 'Judges with no opponent.', text: 'Court of Appeals judges usually run unopposed. Marking them is still a vote; leaving them blank is fine too.' },
  ],
  minnesota: [
    { lead: 'Top to bottom.', text: 'Federal offices first (U.S. Senate, U.S. House), then the state offices, your state senator and representative, county and local offices, school board, the judges, and the constitutional amendment at the end.' },
    { lead: 'No straight-party box.', text: 'Minnesota has none; every race is marked on its own. Party labels print next to each name in the partisan races (Democratic-Farmer-Labor is Minnesota’s Democratic Party).' },
    { lead: 'Judges.', text: 'Listed without party; the sitting judge is marked “incumbent”. Most run unopposed, and there’s a write-in line.' },
    { lead: 'The amendment counts blanks as no.', text: 'It passes only with a majority of everyone voting in the election, so leaving it empty is the same as voting no.' },
  ],
  wisconsin: [
    { lead: 'Top to bottom.', text: 'Federal offices first (your U.S. House seat), then the state offices, your state senator (odd-numbered districts only this year) and Assembly representative, county offices, and the referendum questions at the end.' },
    { lead: 'No straight-party box.', text: 'Wisconsin dropped it in 2011; every race is marked on its own. Party labels print next to each name.' },
    { lead: 'No judges this November.', text: 'Wisconsin elects its judges, without party labels, at the spring election in April; the next is Apr 6, 2027.' },
    { lead: 'The three questions.', text: 'Each amends the state constitution and passes with a majority of the votes cast on that question. A blank on a question just isn’t counted.' },
  ],
};

/** What a state's guide covers beyond the statewide races, where that is narrower than "the whole state". */
export const COVERAGE: Partial<Record<StateSlug, string>> = {
  illinois: 'This guide covers every contest on any Chicago or suburban Cook County ballot.',
};

/** Where a voter confirms their own ballot, registration and polling place. */
export const PORTAL: Record<StateSlug, { name: string; url: string }> = {
  illinois: { name: 'Illinois State Board of Elections voter lookup', url: 'https://ova.elections.il.gov/RegistrationLookup.aspx' },
  michigan: { name: 'Michigan.gov/vote', url: 'https://www.michigan.gov/vote' },
  minnesota: { name: 'Minnesota Voter Information Portal', url: 'https://mnvotes.sos.mn.gov/' },
  wisconsin: { name: 'MyVote Wisconsin', url: 'https://myvote.wi.gov/' },
};

/** The two questions about the site itself, asked on every page and the home page. */
export const SITE_QA: { q: string; a: string }[] = [
  { q: 'What is Know Your Ballot?', a: 'A free, open-source voter guide for the November 3, 2026 general election in Illinois, Michigan, Minnesota and Wisconsin. Enter an address and see your exact ballot: every race, judge and question, what each job does, who is running and who is funding them. It is built on Govbot, Chi Hack Night’s open civic data.' },
  { q: 'Is Know Your Ballot nonpartisan, and where do its facts come from?', a: 'It is nonpartisan: it never recommends or rates a candidate. Every fact names its source next to it: official candidate lists where the state or county publishes one, FEC and state campaign-finance records for money, and Ballotpedia and Wikipedia (CC BY-SA) for profiles and incumbents. A candidate’s own words are quoted verbatim with their date and a link.' },
];
