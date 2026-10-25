import type { Race } from './types';

/**
 * What's at stake in a race, from the seat's current holder(s) as the data
 * records them: an open seat in the source's own words, or the incumbent(s)
 * running to keep it. With no holder on record, a candidate the list marks
 * as the incumbent is running to keep the seat. Empty when nothing is known.
 */
export function stakes(race: Race): string {
  const inc = race.incumbents ?? [];
  const leaving = inc.filter((i) => i.ballot == null && i.note);
  if (leaving.length) {
    // The note names the person only sometimes ("Durbin announced…" vs "Lost the party's nomination…").
    const { name, note } = leaving[0];
    const surname = name.split(' & ')[0].trim().split(/\s+/).pop() ?? '';
    return `Open seat. ${surname && note!.includes(surname) ? note : `${name}: ${note}`}`;
  }
  const running = inc.filter((i) => i.ballot != null);
  if (running.length) return `${running.map((i) => i.name).join(' and ')} ${running.length > 1 ? 'are running to keep their seats.' : 'is running to keep the seat.'}`;
  // The holder isn't on this ballot and the source gave no reason.
  const gone = inc.filter((i) => i.ballot == null);
  if (gone.length) return `Open seat. ${gone.map((i) => i.name).join(' and ')} ${gone.length > 1 ? 'aren’t' : 'isn’t'} on the ballot for this seat.`;
  const marked = race.candidates.filter((c) => c.incumbent);
  if (marked.length) return `${marked.map((c) => c.name).join(' and ')} ${marked.length > 1 ? 'are running to keep their seats.' : 'is running to keep the seat.'}`;
  return '';
}
