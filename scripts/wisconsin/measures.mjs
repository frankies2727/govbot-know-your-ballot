// Wisconsin's three statewide questions on the Nov 3, 2026 ballot:
// constitutional amendments the Legislature passed in two successive
// sessions (2024 AJR 112 / 2025 SJR 116; 2024 AJR 97 / 2025 SJR 113; 2024 AJR
// 109 / 2025 AJR 102). Each question is the official ballot wording from the
// joint resolution, as printed by Ballotpedia; `plain` is our note. Local
// referendums vary by place and aren't here.

export const MEASURES_SOURCE = {
  ballotpedia: 'https://ballotpedia.org/Wisconsin_2026_ballot_measures',
  official: 'https://elections.wi.gov/',
};

export const MEASURES = [
  {
    id: 'question-1',
    title: 'Question 1: Partial veto',
    question: 'Partial veto. Shall section 10 (1) (c) of article V of the constitution be amended to prohibit the governor, in exercising his or her partial veto authority, from creating or increasing or authorizing the creation or increase of any tax or fee?',
    scope: { type: 'state' },
    plain: 'Wisconsin’s governor can veto parts of a spending bill, including single words and numbers, which has been used to change what a bill does. A “yes” adds a limit: a partial veto could no longer create a tax or fee or make one bigger. A “no” leaves the partial-veto power as it is.',
  },
  {
    id: 'question-2',
    title: 'Question 2: Freedom to gather in places of worship during an emergency',
    question: 'Freedom to gather in places of worship during an emergency. Shall section 18 of article I of the constitution, which deals with religious liberty, be amended to prohibit the state or a political subdivision of the state from ordering the closure of, or forbidding gatherings in, places of worship in response to a state of emergency, including a public health emergency?',
    scope: { type: 'state' },
    plain: 'A “yes” means the state, counties and cities could not order places of worship closed or ban gatherings in them during a declared emergency, including a public health emergency. A “no” leaves emergency powers as they are.',
  },
  {
    id: 'question-3',
    title: 'Question 3: Governmental entity discrimination prohibited',
    question: 'Governmental entity discrimination prohibited. Shall section 27 of article I of the constitution be created to prohibit governmental entities in the state from discriminating against, or granting preferential treatment to, any individual or group on the basis of race, sex, color, ethnicity, or national origin in public employment, public education, public contracting, or public administration?',
    scope: { type: 'state' },
    plain: 'A “yes” writes into the constitution that state and local government, the UW System, technical colleges and school districts may not discriminate against, or give preference to, anyone based on race, sex, color, ethnicity or national origin in public jobs, education, contracts or administration; it keeps exceptions for federal program requirements and bona fide sex-based qualifications. A “no” leaves the constitution as it is.',
  },
];
