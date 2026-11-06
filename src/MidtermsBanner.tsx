import { useId } from 'react';
import { daysUntil } from './store';

// The top of a state's ballot view: a sign for the November 2026 midterms,
// shaped like the placards outside a polling place (a heavy frame, a band of
// stars in the state's colour, the name of the election set large, the year
// on a plate). What it
// says follows the calendar: the days to go, polls open today, then polls
// closed with the count going on, and a way to the results on the landing page.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11-03" → "Tuesday, November 3, 2026" (the date itself, whatever the reader's time zone). */
function longDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[day.getUTCDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

export function MidtermsBanner({ date, onResults }: { date: string; onResults: () => void }) {
  const stars = useId();
  const left = daysUntil(date);
  const year = date.slice(0, 4);
  return (
    <section aria-labelledby={`${stars}-h`} className="kyb-sign">
      <svg className="kyb-sign-stars" aria-hidden="true" focusable="false">
        <defs>
          <pattern id={`${stars}-p`} width="34" height="22" patternUnits="userSpaceOnUse">
            <path d="M17 4.5l1.9 4.4 4.8.4-3.6 3.1 1.1 4.7L17 14.6l-4.2 2.5 1.1-4.7-3.6-3.1 4.8-.4z" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${stars}-p)`} />
      </svg>
      <div className="kyb-sign-body">
        <h2 id={`${stars}-h`} className="kyb-sign-title">
          Midterms <span className="kyb-sign-year">{year}</span>
        </h2>
        <div className="kyb-sign-side">
          <p className="kyb-sign-date">{longDate(date)}</p>
          <p className="kyb-sign-status">
            {left > 1 ? `${left} days until election day.`
              : left === 1 ? 'Election day is tomorrow.'
                : left === 0 ? 'Polls are open today.'
                  : 'Polls have closed. Ballots are still being counted until every county finishes and the state certifies the result.'}
          </p>
          {left < 0 && <button type="button" onClick={onResults} className="kyb-sign-button">See the results</button>}
        </div>
      </div>
    </section>
  );
}
