// Minnesota's district courts: the trial judges on the November ballot. The
// state's 87 counties sit in ten judicial districts (Minn. Stat. § 2.722), and
// each district's voters elect its judges, seat by seat, without party labels.
// The Secretary of State's candidate filings list every seat up this year as
// "Judge - 1st District Court 12"; the county decides which district's seats
// are on a voter's ballot.

export const SOURCE = 'https://www.revisor.mn.gov/statutes/cite/2.722';

/** Judicial district -> its counties, as § 2.722 subd. 1 lists them. */
export const JUDICIAL_DISTRICTS = {
  1: ['Goodhue', 'Dakota', 'Carver', 'Le Sueur', 'McLeod', 'Scott', 'Sibley'],
  2: ['Ramsey'],
  3: ['Wabasha', 'Winona', 'Houston', 'Rice', 'Olmsted', 'Dodge', 'Steele', 'Waseca', 'Freeborn', 'Mower', 'Fillmore'],
  4: ['Hennepin'],
  5: ['Blue Earth', 'Watonwan', 'Lyon', 'Redwood', 'Brown', 'Nicollet', 'Lincoln', 'Cottonwood', 'Murray', 'Nobles', 'Pipestone', 'Rock', 'Faribault', 'Martin', 'Jackson'],
  6: ['Carlton', 'St. Louis', 'Lake', 'Cook'],
  7: ['Benton', 'Douglas', 'Mille Lacs', 'Morrison', 'Otter Tail', 'Stearns', 'Todd', 'Clay', 'Becker', 'Wadena'],
  8: ['Chippewa', 'Kandiyohi', 'Lac qui Parle', 'Meeker', 'Renville', 'Swift', 'Yellow Medicine', 'Big Stone', 'Grant', 'Pope', 'Stevens', 'Traverse', 'Wilkin'],
  9: ['Norman', 'Polk', 'Marshall', 'Kittson', 'Red Lake', 'Roseau', 'Mahnomen', 'Pennington', 'Aitkin', 'Itasca', 'Crow Wing', 'Hubbard', 'Beltrami', 'Lake of the Woods', 'Clearwater', 'Cass', 'Koochiching'],
  10: ['Anoka', 'Isanti', 'Wright', 'Sherburne', 'Kanabec', 'Pine', 'Chisago', 'Washington'],
};

/** A county's judicial district ("Hennepin" -> "4"); throws for a county the statute doesn't name, so a typo can't leave a county without its judges. */
export function judicialDistrictOf(county) {
  const hit = Object.entries(JUDICIAL_DISTRICTS).find(([, list]) => list.includes(county));
  if (!hit) throw new Error(`${county}: not in any judicial district`);
  return hit[0];
}

const SEAT = /^Judge - (\d+)(st|nd|rd|th) District Court (\d+)$/;

/** The filing's district and seat, or null for any other office. */
export const districtSeat = (title) => { const m = title.replace(/\s+/g, ' ').trim().match(SEAT); return m && { district: m[1], ordinal: m[1] + m[2], seat: m[3] }; };

export const raceId = (district, seat) => `district-court-${district}-seat-${seat}`;

/**
 * One race per seat in the filings (rows as filings.mjs parses them), in
 * district then seat order, shaped for state.mjs's race builder.
 */
export function districtCourtRaces(rows) {
  const seats = new Map();
  for (const r of rows) {
    const s = districtSeat(r.title);
    if (!s) continue;
    const id = raceId(s.district, s.seat);
    if (!seats.has(id)) seats.set(id, { id, office: `Judge of the District Court, ${s.ordinal} Judicial District, Seat ${s.seat}`, section: 'judicial', area: { type: 'jd', id: s.district }, candidates: [], _k: [+s.district, +s.seat] });
    seats.get(id).candidates.push({ name: r.name, party: r.party });
  }
  return [...seats.values()].sort((a, b) => a._k[0] - b._k[0] || a._k[1] - b._k[1]).map(({ _k, ...race }) => race);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv.includes('--self-test')) {
  const all = Object.values(JUDICIAL_DISTRICTS).flat();
  if (all.length !== 87 || new Set(all).size !== 87) throw new Error(`${all.length} counties listed, ${new Set(all).size} distinct; Minnesota has 87`);
  if (judicialDistrictOf('Hennepin') !== '4' || judicialDistrictOf('Lac qui Parle') !== '8') throw new Error('judicialDistrictOf');
  const rows = [
    { name: 'Pat Smith', party: 'Nonpartisan', title: 'Judge - 10th District Court 38' },
    { name: 'Alex Judge', party: 'Nonpartisan', title: 'Judge - 4th District Court 10' },
    { name: 'Sam Other', party: 'Nonpartisan', title: 'Judge - 10th District Court 38' },
    { name: 'County Person', party: 'Nonpartisan', title: 'County Commissioner District 2' },
  ];
  const races = districtCourtRaces(rows);
  const got = races.map((r) => `${r.id}|${r.office}|${r.area.id}|${r.candidates.map((c) => c.name).join(',')}`).join(' ; ');
  const want = 'district-court-4-seat-10|Judge of the District Court, 4th Judicial District, Seat 10|4|Alex Judge ; district-court-10-seat-38|Judge of the District Court, 10th Judicial District, Seat 38|10|Pat Smith,Sam Other';
  if (got !== want) throw new Error(got);
  console.log('self-test ok');
}
