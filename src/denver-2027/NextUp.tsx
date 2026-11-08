import { NextUp } from '../Calendar';
import { RUNOFF_DAY } from './dates';

/** After Apr 6: the Jun 1 runoffs, wherever no one won outright. */
export function NextElectionNote() {
  return (
    <NextUp date={RUNOFF_DAY} title="Then Jun 1, 2027, where needed." lead="If no one gets more than half the vote in a race on Apr 6, the top two meet again in a runoff on Jun 1. Ballots go out in the mail again; nothing to sign up for.">
      <p className="border-t-2 border-[var(--kyb-chip)] pt-3 text-[15px]">Runoff races show up here once the Apr 6 results are certified.</p>
    </NextUp>
  );
}
