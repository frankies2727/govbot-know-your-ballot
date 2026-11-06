// The election this guide is for, as a plain header: "Nov. 2026 Midterm". It
// sits at the top of a state's landing page and of its ballot view, so anyone
// who finds the site later (it is becoming a record of that ballot) knows
// which election they are looking at.

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

/** "2026-11-03" → "Nov. 2026 Midterm" (a year with a president on the ballot is just an "Election"). */
export function electionName(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const month = MONTH.format(new Date(Date.UTC(y, m - 1, d)));
  return `${month}${month === 'May' ? '' : '.'} ${y} ${y % 4 === 2 ? 'Midterm' : 'Election'}`;
}

export function ElectionHeader({ date }: { date: string }) {
  return <p className="font-serif text-[1.7rem] font-medium leading-none tracking-tight sm:text-[2.1rem]">{electionName(date)}</p>;
}
