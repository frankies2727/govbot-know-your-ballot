import { NextUp } from '../Calendar';
import { GENERAL_DAY } from './dates';

/** After Mar 9: the May 18 General Election, wherever no one won outright. */
export function NextElectionNote() {
  return (
    <NextUp date={GENERAL_DAY} title="Then May 18, 2027, where needed." lead="If no one gets more than half the vote in a race on Mar 9, the top two meet again in the General Election on May 18. Register by Apr 19 to vote in it.">
      <p className="border-t-2 border-[var(--kyb-chip)] pt-3 text-[15px]">The May 18 races show up here once the Mar 9 results are certified.</p>
    </NextUp>
  );
}
