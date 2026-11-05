// Minnesota's results: the Secretary of State's results files, one per office
// (semicolon-separated: state;county;precinct;office code;office;district;
// candidate code;candidate;;;party;precincts reporting;precincts;votes;
// percent;total votes in the contest). They carry no official/unofficial mark;
// the page counts them unofficial until the State Canvassing Board certifies.

export const SOURCE = { name: 'Minnesota Secretary of State', url: 'https://electionresults.sos.state.mn.us/' };
export const BASE = 'https://electionresultsfiles.sos.mn.gov/20261103/';
export const FILES = ['ussenate', 'ushouse', 'governor', 'attorneygen', 'secofstate', 'auditor', 'stsenate', 'LegislativeByDistrict', 'judicial', 'judicialdst'];

/** A results file's contests: [{ office, district, reporting, precincts, total, rows: [{ name, party, votes, writeIn }] }]. */
export function parse(text) {
  const contests = new Map();
  for (const line of text.split(/\r?\n/)) {
    const f = line.split(';');
    if (f.length < 16 || f[0] !== 'MN') continue;
    const key = `${f[3]}|${f[4]}|${f[5]}`;
    if (!contests.has(key)) contests.set(key, { office: f[4], district: f[5], reporting: Number(f[11]), precincts: Number(f[12]), total: Number(f[15]), rows: [] });
    contests.get(key).rows.push({ name: f[7], party: f[10], votes: Number(f[13]), writeIn: f[10] === 'WI' || /^write-in/i.test(f[7]) });
  }
  return [...contests.values()];
}
