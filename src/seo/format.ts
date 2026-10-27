// Small date helpers shared by the app and the build (scripts/seo/*), so the
// text a crawler reads and the text a voter reads are made by the same code.

/** "2026-10-26", or "9/11/2026 3:47:15 PM" (Illinois's own format), as YYYY-MM-DD; undefined when it isn't a date we can read. */
export function isoDate(s: unknown): string | undefined {
  if (typeof s !== 'string') return undefined;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return us ? `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}` : undefined;
}

/** "a" or "an" for the word that follows ("an Illinois ballot"). */
export const aOrAn = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

const short = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const long = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
/** "Sun, Oct 18" for a YYYY-MM-DD date, whatever the reader's time zone. */
export const shortDate = (iso: string) => short.format(new Date(`${iso}T00:00:00Z`));
/** "Tuesday, November 3, 2026". */
export const longDate = (iso: string) => long.format(new Date(`${iso}T00:00:00Z`));
