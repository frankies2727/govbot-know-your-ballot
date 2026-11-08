import { GUIDE_ELECTION_DAY } from './hosts';
import { daysUntil } from './store';
import type { Race } from './types';

/**
 * What's at stake in a race, from the seat's current holder(s) as the data
 * records them: an open seat in the source's own words, or the incumbent(s)
 * running to keep it. With no holder on record, a candidate the list marks
 * as the incumbent is running to keep the seat. Empty when nothing is known.
 * Once the election is over (`held`) it says what was at stake: "ran to keep
 * the seat", "wasn't on the ballot".
 */
export function stakes(race: Race, electionDate = GUIDE_ELECTION_DAY): string {
  const held = daysUntil(electionDate) < 0;
  const keep = (n: number) => (held ? (n > 1 ? 'ran to keep their seats.' : 'ran to keep the seat.') : n > 1 ? 'are running to keep their seats.' : 'is running to keep the seat.');
  const inc = race.incumbents ?? [];
  const leaving = inc.filter((i) => i.ballot == null && i.note);
  if (leaving.length) {
    // The note names the person only sometimes ("Durbin announced…" vs "Lost the party's nomination…").
    const { name, note } = leaving[0];
    const surname = name.split(' & ')[0].trim().split(/\s+/).pop() ?? '';
    // A headline quoted as the reason has no full stop of its own.
    const said = note!.replace(/([^.!?”"’])$/, '$1.');
    return `Open seat. ${surname && said.includes(surname) ? said : `${name}: ${said}`}`;
  }
  const running = inc.filter((i) => i.ballot != null);
  // A council of several seats: who is running to stay, and who isn't on the ballot.
  const away = inc.filter((i) => i.ballot == null);
  const absent = away.length ? ` ${away.map((i) => i.name).join(' and ')} ${away.length > 1 ? (held ? 'weren’t' : 'aren’t') : held ? 'wasn’t' : 'isn’t'} on the ballot.` : '';
  if (running.length) return `${running.map((i) => i.name).join(' and ')} ${keep(running.length)}${absent}`;
  // The candidate list marks the incumbent (the roster may spell them differently: "Patty" / "Patricia").
  const marked = race.candidates.filter((c) => c.incumbent);
  if (marked.length) return `${marked.map((c) => c.name).join(' and ')} ${keep(marked.length)}`;
  // The holder isn't on this ballot and the source gave no reason.
  const gone = inc.filter((i) => i.ballot == null);
  if (gone.length) return `Open seat. ${gone.map((i) => i.name).join(' and ')} ${gone.length > 1 ? (held ? 'weren’t' : 'aren’t') : held ? 'wasn’t' : 'isn’t'} on the ballot for this seat.`;
  return '';
}
