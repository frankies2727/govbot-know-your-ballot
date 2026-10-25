// Minnesota's one statewide question on the Nov 3, 2026 ballot: a
// constitutional amendment referred by the Legislature (2025 Minn. Laws ch.
// 49, HF 1 / SF 2). The ballot title and question are the official wording
// set in the act, as printed by Ballotpedia; `plain` is our note. Local
// questions (school levies, city charters) vary by place and aren't here.

export const MEASURES_SOURCE = {
  ballotpedia: 'https://ballotpedia.org/Minnesota_2026_ballot_measures',
  official: 'https://www.sos.mn.gov/elections-voting/',
};

export const MEASURES = [
  {
    id: 'amendment-2026-school-fund',
    title: 'Constitutional amendment: Increasing funding to school districts',
    question: 'Increasing funding to school districts. Shall the Minnesota Constitution be amended to increase the funding going to all school districts from the permanent school fund, which is a fund that supports school districts without raising individual income or property taxes, effective July 1, 2027?',
    scope: { type: 'state' },
    plain: 'The permanent school fund is a trust from state-owned lands and minerals that pays out to every school district. Today the constitution lets it distribute only its interest and dividends and requires the principal to stay “perpetual and inviolate.” A “yes” rewrites those rules so the fund is managed for annual payouts while preserving its purchasing power over time, which supporters expect to raise the payout. A “no” keeps the current investment and payout rules. In Minnesota a blank vote on an amendment counts as a “no”: it passes only with a majority of everyone voting in the election.',
  },
];
