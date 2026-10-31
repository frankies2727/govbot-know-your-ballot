// The Chicago Board of Elections publishes a candidate-list PDF for each
// election it runs, all linked from one page and all named alike ("Candidate
// List_20261030-1.pdf"), so the file name says nothing about which election it
// is. The first line of the list does: "Candidate Filings in Ballot Order,
// November 3, 2026". These helpers read that, so each build takes the list for
// the election it is building (and the 2027 city list is never mistaken for
// the November ballot).

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** The election a candidate list is for, as YYYY-MM-DD; null if the text doesn't say. */
export function electionDate(text) {
  const m = text.match(/Candidate Filings in Ballot Order,\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/)
    ?? text.match(/candidate list for the\s+([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s+election/i);
  const month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  if (!m || month < 0) return null;
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** Every candidate-list PDF the candidates page links (the HTML spells the space in the file name literally). */
export function pdfLinks(html) {
  const link = /https:\/\/[^"'<>]+Candidate(?:%20| )List[^"'<>]+\.pdf/gi;
  return [...new Set([...html.matchAll(link)].map((m) => m[0].replace(/ /g, '%20')))];
}

/**
 * The list for `date` among `found` ([{ url, date }]). The Board reissues a
 * list under a new, date-stamped name, so the last name in order is the newest.
 * Throws, naming what was found, when there is none.
 */
export function listFor(found, date) {
  const hits = found.filter((f) => f.date === date).sort((a, b) => a.url.localeCompare(b.url));
  if (!hits.length) {
    const seen = found.map((f) => `${f.date ?? 'no election named'}: ${f.url}`).join('; ') || 'no candidate-list links';
    throw new Error(`No candidate list for ${date} among the Board's links (${seen})`);
  }
  return hits[hits.length - 1];
}
