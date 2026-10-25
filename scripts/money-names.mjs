// Matching a candidate on our ballot to a campaign committee's candidate in a
// state's disclosure records: last names equal, first names agree ("Dan" ~
// "Daniel", "Jim" ~ "James"). Shared by the Michigan, Minnesota and Wisconsin
// money readers; never a surname alone.

export const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
/** Name words, without a nickname in quotes, a suffix or the running mate ("A & B"). */
export const parts = (n) => fold(n.split(' & ')[0].replace(/["“”][^"“”]*["“”]/g, ' ').replace(/,?\s+(jr|sr|ii|iii|iv)\.?$/i, '')).split(/[^a-z]+/).filter(Boolean);
// Short forms ballots, Ballotpedia and disclosure records disagree on ("Dan Swanson" is "Daniel Swanson" there).
const SHORT = { abdul: 'abdul', abe: 'abraham', al: 'albert', alex: 'alexander', andy: 'andrew', angie: 'angelica', ben: 'benjamin', bernie: 'bernadette', beth: 'elizabeth', betty: 'elizabeth', bill: 'william', billy: 'william', bob: 'robert', bobby: 'robert', charlie: 'charles', chris: 'christopher', chuck: 'charles', dan: 'daniel', danny: 'daniel', dave: 'david', deb: 'deborah', debbie: 'deborah', dick: 'richard', don: 'donald', doug: 'douglas', drew: 'andrew', ed: 'edward', eddie: 'edward', frank: 'francis', fred: 'frederick', gabby: 'gabrielle', greg: 'gregory', jack: 'john', jaz: 'jasper', jeff: 'jeffrey', jen: 'jennifer', jenny: 'jennifer', jerry: 'gerald', jess: 'jessica', jim: 'james', jimmy: 'james', joe: 'joseph', joey: 'joseph', johnny: 'john', jon: 'jonathan', josh: 'joshua', kate: 'katherine', kathy: 'katherine', katie: 'katherine', ken: 'kenneth', larry: 'lawrence', liz: 'elizabeth', lou: 'louis', lucy: 'lucille', maggie: 'margaret', manny: 'manuel', marty: 'martin', matt: 'matthew', max: 'maxwell', meg: 'margaret', mike: 'michael', nate: 'nathan', nick: 'nicholas', pat: 'patrick', patti: 'patricia', patty: 'patricia', peggy: 'margaret', pete: 'peter', ray: 'raymond', rick: 'richard', rob: 'robert', ron: 'ronald', russ: 'russell', sam: 'samuel', stephen: 'steven', steve: 'steven', sue: 'susan', ted: 'edward', terry: 'terrence', tim: 'timothy', timmy: 'timothy', tom: 'thomas', tommy: 'thomas', tony: 'anthony', vicki: 'victoria', vicky: 'victoria', vince: 'vincent', will: 'william', zach: 'zachary', zack: 'zachary' };
/** First names agree: equal, the same short form, or one starts the other. */
export const sameFirst = (a, b) => a === b || (SHORT[a] ?? a) === (SHORT[b] ?? b) || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)));
const TITLES = new Set(['dr', 'mr', 'mrs', 'ms', 'rev', 'hon', 'sen', 'rep']);
/** The given names a record carries: 'George "Chip"' -> [george, chip]; 'Lowell (Rusty)' -> [lowell, rusty]; 'D Scott' -> [d, scott]. */
export const givenNames = (s) => {
  const nick = [...String(s).matchAll(/["“”(]\s*([A-Za-z.'-]+)\s*["“”)]/g)].map((m) => fold(m[1]).replace(/[^a-z]/g, ''));
  const words = fold(String(s).replace(/["“”(][^"“”)]*["“”)]/g, ' ')).split(/[^a-z]+/).filter((w) => w && !TITLES.has(w));
  return [...new Set([...words, ...nick])].filter(Boolean);
};
/**
 * Same person: last names equal, and one of their given names agrees with
 * ours ("Dan" ~ "Daniel", a nickname in quotes or parentheses counts). With
 * `initialOk`, a bare initial agreeing is enough: for a caller that then
 * checks the office and district, which rules out a namesake.
 */
export function sameName(ours, theirsFirst, theirsLast, { initialOk = false } = {}) {
  const a = parts(ours);
  const last = fold(theirsLast).replace(/[^a-z]/g, '');
  if (a.length < 2 || !last || a.at(-1) !== last && !a.slice(1).join('').endsWith(last)) return false;
  const mine = [a[0], ...givenNames(ours.match(/["“”(][^"“”)]*["“”)]/)?.[0] ?? '')];
  const theirs = givenNames(theirsFirst);
  if (!theirs.length) return false;
  if (theirs.some((t) => mine.some((m) => sameFirst(m, t)))) return true;
  return initialOk && theirs.some((t) => t[0] === a[0][0]);
}
export const dollars = (s) => Math.round(Number(String(s).replace(/[^0-9.-]/g, '')) || 0);
/** "M/D/YYYY" or "YYYY-MM-DD" -> "MM/DD/YYYY", the form the app shows. */
export const mdy = (s) => {
  let m = String(s).match(/^(\d{4})-(\d\d)-(\d\d)/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}` : '';
};
