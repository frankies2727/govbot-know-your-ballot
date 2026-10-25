import { NextUp } from '../Calendar';

// Wisconsin's spring elections after Nov 3, 2026 (Wis. Stat. 5.02: the
// spring primary on the third Tuesday in February, the spring election on
// the first Tuesday in April), and what tends to be on them.
const APR_6 = '2027-04-06';

const DATES = [
  { date: 'Tue, Feb 16, 2027', what: 'Spring primary, where more than two people file for a spring office.' },
  { date: 'Tue, Apr 6, 2027', what: 'Spring election: a seat on the Wisconsin Supreme Court, Court of Appeals and circuit court judges, plus mayors, city councils, village and town boards and school boards.' },
];

/** A heads-up about spring 2027: nonpartisan, and a Supreme Court seat. */
export function NextElectionNote() {
  return (
    <NextUp date={APR_6} title="Get ready for April 6, 2027 too!" lead="Wisconsin votes again in the spring: a Supreme Court seat, judges, and the mayors, councils and school boards near you, all without party labels.">
      <div className="space-y-3 border-t-2 border-[var(--kyb-chip)] pt-3">
        <p className="text-[15px] font-bold">Your municipal clerk sets what’s on each date. Candidates show up here once they’re certified.</p>
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
