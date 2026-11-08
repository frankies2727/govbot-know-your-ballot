import { NextUp } from '../Calendar';
import { RUNOFF_DAY } from './dates';

/** After Feb 23: the Apr 6 runoffs, wherever no one won outright. */
export function NextElectionNote() {
  return (
    <NextUp date={RUNOFF_DAY} title="Then Apr 6, 2027, where needed." lead="If no one gets more than half the vote for mayor, clerk, treasurer or a ward’s alderperson on Feb 23, the top two meet again in a runoff on Apr 6. Police district councils have no runoff: the top three win.">
      <p className="border-t-2 border-[var(--kyb-chip)] pt-3 text-[15px]">Runoff races show up here once the Board certifies the Feb 23 results.</p>
    </NextUp>
  );
}
