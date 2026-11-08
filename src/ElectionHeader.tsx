// The election this guide is for, as a plain header: "November 2026 Midterm".
// It sits at the top of a state's ballot view, under the pinned bar, so anyone
// who finds the site later (it is becoming a record of that ballot) knows
// which election they are looking at.

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });

/** "2026-11-03" → "November 2026 Midterm" (a year with a president on the ballot is just an "Election"). */
export function electionName(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${MONTH.format(new Date(Date.UTC(y, m - 1, d)))} ${y} ${y % 4 === 2 ? 'Midterm' : 'Election'}`;
}

export function ElectionHeader({ date, name }: { date: string; /** A name of its own ("Chicago City Election · February 2027"), instead of one from the date. */ name?: string }) {
  return <h1 className="font-serif text-[1.7rem] font-medium leading-none tracking-tight sm:text-[2.1rem]">{name ?? electionName(date)}</h1>;
}
