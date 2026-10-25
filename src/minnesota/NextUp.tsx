import { NextUp } from '../Calendar';

// Minnesota's regular election dates after Nov 3, 2026 (Minn. Stat. 205.07:
// cities that elect in odd years vote on the first Tuesday after the first
// Monday in November; school districts may hold their elections then too).
const NOV_2 = '2027-11-02';

const DATES = [
  { date: 'Tue, Aug 10, 2027', what: 'Primaries for the cities that elect their council or mayor in odd years, where more than two people file.' },
  { date: 'Tue, Nov 2, 2027', what: 'City elections in those cities, school board seats and school levy questions where a district calls them.' },
];

/** A heads-up about 2027: no statewide election, but local ones for many. */
export function NextElectionNote() {
  return (
    <NextUp date={NOV_2} title="Get ready for 2027 too!" lead="No statewide election next year, but many Minnesota cities and school districts vote in November 2027: councils, mayors, school boards and levy questions.">
      <div className="space-y-3 border-t-2 border-[var(--kyb-chip)] pt-3">
        <p className="text-[15px] font-bold">Your city or county sets what’s on each date. Candidates and questions show up here once they’re certified.</p>
        <ul className="space-y-3">
          {DATES.map((d) => (
            <li key={d.date} className="text-[15px] leading-relaxed">
              <p className="font-black">{d.date}</p>
              <p>{d.what}</p>
            </li>
          ))}
        </ul>
      </div>
    </NextUp>
  );
}
