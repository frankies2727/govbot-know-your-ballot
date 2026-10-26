// The Wisconsin Elections Commission's "Candidates on Ballot by Election" list
// for the November 3, 2026 general election, the PDF the Commission publishes
// on elections.wi.gov (candidates page). Its site turns scripted readers away,
// so a copy lives in this folder and is replaced by hand when the Commission
// reissues it (the "Printed" date is on every page). Read with `pdftotext -layout`.
//   node scripts/wisconsin/official.mjs [file.pdf]   parse and summarise
//   node scripts/wisconsin/official.mjs --self-test
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

export const SOURCE = 'https://elections.wi.gov/candidates-and-committees/candidates';
const DIR = new URL('./official/', import.meta.url);

/** The race id an office heading belongs to, or null. */
export function raceIdFor(office) {
  const o = office.replace(/\s+/g, ' ').trim().toUpperCase();
  let m;
  if (o === 'GOVERNOR') return 'governor-and-lieutenant-governor';
  if (o === 'ATTORNEY GENERAL') return 'attorney-general';
  if (o === 'SECRETARY OF STATE') return 'secretary-of-state';
  if (o === 'STATE TREASURER') return 'state-treasurer';
  if ((m = o.match(/^REPRESENTATIVE IN CONGRESS DISTRICT (\d+)$/))) return `cd-${m[1]}`;
  if ((m = o.match(/^STATE SENATOR DISTRICT (\d+)$/))) return `sldu-${m[1]}`;
  if ((m = o.match(/^REPRESENTATIVE TO THE ASSEMBLY DISTRICT (\d+)$/))) return `sldl-${m[1]}`;
  return null;
}

/**
 * The list's rows from the PDF's text: [{ office, raceId, order, name, party, incumbent }].
 * An office starts "Office : NAME   Incumbent: WHO"; each candidate line is the
 * ballot order, an optional committee id, the name and the party, which can
 * wrap onto the next line ("Wisconsin" / "Green").
 */
export function parseCandidateList(text) {
  const rows = [];
  let office = null, incumbent = '';
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    let m;
    if ((m = line.match(/^Office :\s+(.*?)\s{2,}Incumbent:\s*(.*)$/))) { office = m[1].trim(); incumbent = m[2].trim(); continue; }
    if (/^\s*Total Number of /.test(line)) { office = null; continue; }
    if (!office) continue;
    if ((m = line.match(/^(\d+)\s+(?:(\d{6,9})\s+)?(\S.*?)\s{2,}(\S.*)$/))) {
      // A ticket is "Governor / Lieutenant Governor": the guide writes it "A & B".
      rows.push({ office, raceId: raceIdFor(office), order: Number(m[1]), committee: m[2] ?? '', name: m[3].trim().replace(/\s*\/\s*/, ' & '), party: m[4].trim(), incumbent });
    } else if ((m = line.match(/^\s{30,}(\S.*)$/)) && rows.length && rows.at(-1).office === office) {
      rows.at(-1).party += ` ${m[1].trim()}`; // the party's second line
    }
  }
  return rows;
}

/** Rows grouped by race id, for mergeOfficial. */
export function byRace(rows) {
  const map = new Map();
  for (const r of rows) if (r.raceId) (map.get(r.raceId) ?? map.set(r.raceId, []).get(r.raceId)).push({ name: r.name, party: r.party });
  return map;
}

/** The newest list in ./official (by name), through pdftotext. */
export function readPdf(file) {
  const pdf = file ?? new URL(readdirSync(DIR).filter((f) => f.endsWith('.pdf')).sort().at(-1), DIR).pathname;
  return execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 50_000_000 });
}

/** What the shared build calls. */
export async function read(file) {
  const rows = parseCandidateList(readPdf(file));
  if (rows.length < 100) throw new Error(`only ${rows.length} candidates read from the list`);
  return { source: SOURCE, byRace: byRace(rows), rows };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  if (process.argv.includes('--self-test')) {
    const sample = [
      'Office :       GOVERNOR                                                              Incumbent:         Tony Evers (Filed Notification of Noncandidacy',
      '1              0104212         Tom Tiffany / David Varnam                            Republican',
      '2              0105751         David Crowley / Sarah Godlewski                       Democratic',
      '               Total Number of GOVERNOR Candidates :2',
      'Office :       SECRETARY OF STATE                                                    Incumbent:         Sarah Godlewski',
      '3              0105008         Pete Karas                                            Wisconsin',
      '                                                                                     Green',
      '               Total Number of SECRETARY OF STATE Candidates :1',
      'Office :       REPRESENTATIVE IN CONGRESS DISTRICT 3                           Incumbent:         Derrick Van Orden',
      '3                              Alexander Valiensi Kent                         Independent',
      '1                              Derrick Van Orden                               Republican',
      'Office :       REPRESENTATIVE TO THE ASSEMBLY DISTRICT 26                    Incumbent:         Joe Sheehan',
      '1              01072934        John Belanger                                 Republican',
      '               Total Number of REPRESENTATIVE TO THE ASSEMBLY DISTRICT 26 Candidates :1',
    ].join('\n');
    const rows = parseCandidateList(sample);
    const got = rows.map((r) => `${r.raceId}:${r.order}:${r.name}:${r.party}`).join(' | ');
    const want = 'governor-and-lieutenant-governor:1:Tom Tiffany & David Varnam:Republican | governor-and-lieutenant-governor:2:David Crowley & Sarah Godlewski:Democratic | secretary-of-state:3:Pete Karas:Wisconsin Green | cd-3:3:Alexander Valiensi Kent:Independent | cd-3:1:Derrick Van Orden:Republican | sldl-26:1:John Belanger:Republican';
    if (got !== want) throw new Error(got);
    console.log('self-test ok');
  } else {
    const { rows, byRace: map } = await read(process.argv[2]);
    console.log(`${rows.length} candidates in ${map.size} races the guide carries; ${rows.filter((r) => !r.raceId).length} rows for other offices`);
  }
}
