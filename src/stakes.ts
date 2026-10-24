import type { Race } from './types';

/**
 * What's at stake in a race, from the seat's current holder(s) as the data
 * records them: an open seat in the source's own words, or the incumbent(s)
 * running to keep it. Empty when the data names nobody.
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
  return '';
}
