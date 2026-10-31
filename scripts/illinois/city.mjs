// The Board's candidate list for Chicago's Feb 23, 2027 city election (run
// through `pdftotext -layout`): the mayor, clerk and treasurer, a ward at a time
// for alderperson, and each police district's council. Govbot already gives
// the page those races with their offices and incumbents; this fills in who has
// filed. Only names go on the page, so a filing's status decides whether it counts.

const ORDINAL = /(\d+)(?:st|nd|rd|th)/;
const pad = (n, width) => String(n).padStart(width, '0');

/** The race id (govbot's, and ours) for an office heading on the list, or null. */
export function raceId(heading) {
  let m;
  if (/^Mayor$/i.test(heading)) return 'chicago-mayor';
  if (/^(City )?Clerk$/i.test(heading)) return 'chicago-city-clerk';
  if (/^(City )?Treasurer$/i.test(heading)) return 'chicago-city-treasurer';
  if ((m = heading.match(new RegExp(`^Alderperson, ${ORDINAL.source} Ward$`, 'i')))) return `chicago-alderperson-ward-${pad(m[1], 2)}`;
  if ((m = heading.match(new RegExp(`^Council Member, Chicago Police Department ${ORDINAL.source} District$`, 'i')))) return `chicago-police-district-council-${pad(m[1], 3)}`;
  return null;
}

/** "JOHN KELLY" -> "John Kelly"; a name that already has lower case is left as the Board wrote it. */
export function nameCase(name) {
  if (/[a-z]/.test(name)) return name;
  return name.toLowerCase()
    .replace(/(^|[\s"'(\-.])([a-z])/g, (_, before, c) => before + c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c) => `Mc${c.toUpperCase()}`)
    .replace(/\b(Ii|Iii|Iv)\b/g, (s) => s.toUpperCase());
}

/**
 * The filings on the list: { asOf, offices }, `offices` a Map of race id to
 * [{ name, status }] in the Board's order, and `unknown` the headings that
 * match no race we have.
 */
export function parseCityList(text) {
  const lines = text.split('\n');
  const asOf = text.match(/Status as of\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i)?.[1] ?? null;
  const offices = new Map();
  const unknown = [];
  let current = null; // the race id of the office being read; null while inside one we don't know
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /Page \d+ of \d+\s*$/.test(line)) continue;
    // An office heading is the line just above its "Vote for …" line.
    const next = lines.slice(i + 1).find((l) => l.trim());
    if (next && /^\s*Vote for\b/i.test(next) && !/^\s*Vote for\b/i.test(line)) {
      const heading = line.trim();
      current = raceId(heading);
      if (current) { if (!offices.has(current)) offices.set(current, []); } else unknown.push(heading);
      continue;
    }
    if (!current || /^\s*Vote for\b/i.test(line)) continue;
    // A filing: the name, then (after a gap) its status.
    const m = line.match(/^\s+(?:\(\d+\)\s+)?(\S.*?)\s{2,}(\S.*?)\s*$/);
    if (m) offices.get(current).push({ name: nameCase(m[1].replace(/\s+/g, ' ')), status: m[2] });
  }
  return { asOf, offices, unknown };
}

/**
 * Put each race's filed candidates onto `races` (govbot's city races, which
 * keep their offices and incumbents). Only filings whose status is plain
 * "Candidate" count. Throws if the list looks like a bad read (a reformatted
 * PDF), so a caller keeps yesterday's names instead.
 */
export function addCityCandidates(races, list) {
  const filed = [...list.offices.values()].flat();
  const mayors = list.offices.get('chicago-mayor') ?? [];
  const wards = [...list.offices.keys()].filter((id) => id.startsWith('chicago-alderperson-')).length;
  const districts = [...list.offices.keys()].filter((id) => id.startsWith('chicago-police-district-council-')).length;
  if (mayors.length < 1 || wards < 40 || districts < 15 || filed.length < 150) {
    throw new Error(`The 2027 list looks wrong: ${mayors.length} for mayor, ${wards} wards, ${districts} police districts, ${filed.length} filings`);
  }
  let named = 0;
  const skipped = {};
  for (const r of races) {
    const names = [];
    for (const f of list.offices.get(r.id) ?? []) {
      if (f.status === 'Candidate') { if (!names.includes(f.name)) names.push(f.name); } else skipped[f.status] = (skipped[f.status] ?? 0) + 1;
    }
    r.candidates = names;
    named += names.length;
  }
  return { named, races: races.filter((r) => r.candidates.length).length, skipped, unknown: list.unknown };
}
