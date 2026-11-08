// A link's source by name, for link text that credits where it goes:
// "Chicago Politics", "Ballotpedia", else the site's own address.

const KNOWN: [RegExp, string][] = [
  [/(^|\.)chicagopolitics\.org$/, 'Chicago Politics'],
  [/(^|\.)ballotpedia\.org$/, 'Ballotpedia'],
  [/(^|\.)injusticewatch\.org$/, 'Injustice Watch'],
  [/(^|\.)wikipedia\.org$/, 'Wikipedia'],
  [/(^|\.)vote411\.org$/, 'Vote411'],
  [/(^|\.)fec\.gov$/, 'the FEC'],
  [/(^|\.)elections\.il\.gov$/, 'the Illinois State Board of Elections'],
];

/** "https://www.chicagopolitics.org/candidate/…" -> "Chicago Politics"; an unknown site -> its address ("johnkellyforchi.com"). */
export function sourceName(url: string): string {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return 'the source'; }
  return KNOWN.find(([re]) => re.test(host))?.[1] ?? host;
}
