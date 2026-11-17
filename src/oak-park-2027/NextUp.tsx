import { NextUp } from '../Calendar';

/** After Apr 6: Oak Park's next scheduled election, the Mar 2028 primary. */
export function NextElectionNote() {
  return (
    <NextUp date="2028-03-21" title="Next: the March 2028 primary." lead="Oak Park’s next local races (Village President, Village Clerk and the other three trustees) are on the April 2029 ballot. The next election is Illinois’ March 2028 primary, then the November 2028 general.">
      <p className="border-t-2 border-[var(--kyb-chip)] pt-3 text-[15px]">The Apr 6 results show here once the Cook County Clerk certifies them.</p>
    </NextUp>
  );
}
