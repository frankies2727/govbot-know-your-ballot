import { CalendarPlus } from 'lucide-react';
import { dayLabel, downloadReminder } from '../dates';
import { Out, Step, type Guide } from '../PlanToVote';
import { LINKS } from './config';
import { byId } from './dates';

// Voting in Oak Park's Apr 6, 2027 election, which the Cook County Clerk runs
// for suburban Cook, from the State Board of Elections' 2027 calendar: early
// voting from Feb 25 (the Clerk sets sites and hours), mail ballots by
// application, polls 6am–7pm, and registration in person through Election
// Day with two IDs, one showing your address.

type Method = 'early' | 'mail' | 'day';
const METHODS: { id: Method; label: string; emoji: string }[] = [
  { id: 'early', label: 'Vote early in person', emoji: '🗓️' },
  { id: 'mail', label: 'By mail', emoji: '✉️' },
  { id: 'day', label: 'Election Day', emoji: '🗳️' },
];

interface Props {
  plan: Record<string, boolean | string>;
  setPlan: (key: string, value: boolean | string) => void;
  county?: string;
  ballotDone: boolean;
}

export function PlanToVote({ plan, setPlan, ballotDone }: Props) {
  const method = (plan.method as Method) || null;
  const reminder = byId(method === 'early' ? 'early-opens' : method === 'mail' ? 'mail-closes' : 'election');
  return (
    <ol className="space-y-4">
      <Step n={1} done={!!plan.registered} title="Make sure you’re registered" onToggle={() => setPlan('registered', !plan.registered)}>
        <p>Check your registration, polling place and official sample ballot with the <Out href={LINKS.myInfo}>Cook County Clerk</Out>, who runs Oak Park’s elections.</p>
        <p><strong className="text-[var(--gb-amber-hi)]">Not registered or moved?</strong> Register the regular way through <strong>Tue, Mar 9</strong>, or online at <Out href={LINKS.registerOnline}>ova.elections.il.gov</Out> through <strong>Sun, Mar 21</strong>. After that, register in person when you vote early or on Election Day: bring two IDs, one showing your current address.</p>
      </Step>

      <Step n={2} done={!!method} title="Pick how you’ll vote">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How you'll vote">
          {METHODS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setPlan('method', m.id)}
              className={`min-h-[64px] rounded-xl border-2 px-2 py-2 font-bold text-sm leading-tight transition-colors ${method === m.id ? 'border-[var(--gb-primary)] bg-[var(--gb-primary)] text-[var(--gb-bg)]' : 'border-[var(--gb-border)] bg-[var(--kyb-chip)] text-[var(--gb-text)] hover:border-[var(--gb-text)]'}`}>
              <span className="block text-xl" aria-hidden="true">{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        {method === 'early' && (
          <p>Early voting can start <strong>Thu, Feb 25</strong> and runs through <strong>Mon, Apr 5</strong>. The Cook County Clerk sets the suburban sites, days and hours; any suburban Cook voter can use any of its early voting sites. <Out href={LINKS.clerk}>Cook County Clerk: elections</Out></p>
        )}
        {method === 'mail' && (
          <div className="space-y-2">
            <p><strong>Apply from Wed, Jan 6</strong> with the <Out href={LINKS.clerk}>Cook County Clerk</Out>; a mailed application has to arrive by <strong>Thu, Apr 1</strong>. Voters on the permanent vote-by-mail list get theirs without applying.</p>
            <p>Send it back by mail or in a drop box. Postmarked by Apr 6, it counts if it arrives by Apr 20.</p>
          </div>
        )}
        {method === 'day' && (
          <p><strong>Tue, Apr 6, 6am–7pm</strong> at your polling place; the <Out href={LINKS.myInfo}>Clerk’s lookup</Out> shows it with your sample ballot. In line by 7pm? You get to vote.</p>
        )}
      </Step>

      <Step n={3} done={!!plan.reminder} title="Put it on your calendar">
        <button type="button" disabled={!method}
          onClick={() => { downloadReminder(reminder, LINKS.clerk); setPlan('reminder', true); }}
          className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] bg-[var(--kyb-chip)] px-4 font-bold text-[var(--gb-text)] hover:bg-[var(--kyb-chip-hi)] disabled:cursor-not-allowed disabled:border-[var(--gb-border)]">
          <CalendarPlus className="w-5 h-5" aria-hidden="true" />
          Remind me {dayLabel(reminder.date).replace(/^\w+, /, '')}
        </button>
        {method === 'mail' && <p>That’s the last day a mailed application can arrive. Send the ballot back the day it comes.</p>}
        {method === 'early' && <p>That’s the earliest early voting can open; check the Clerk’s sites and hours.</p>}
        {!method && <p>Pick how you’ll vote first.</p>}
      </Step>

      <Step n={4} done={ballotDone} title="Bring your notes">
        <p>Finish <strong>My Ballot</strong> and bring it along. Illinois lets you take notes or a marked-up sample ballot into the booth; just keep them to yourself.</p>
        <p>{ballotDone ? '✅ Your ballot is ready.' : 'Your ballot isn’t finished yet; it checks itself off when it is.'}</p>
      </Step>
    </ol>
  );
}

/** Nonpartisan guides that go where this one stops, for Oak Park voters. */
export const OAK_PARK_GUIDES: Guide[] = [
  { name: 'Cook County Clerk: elections', href: LINKS.clerk, what: 'Your registration, polling place, official sample ballot, early voting and the results.' },
  { name: 'Village Clerk of Oak Park', href: LINKS.villageClerk, what: 'Who filed for village and library offices, and the village’s election notices.' },
  { name: 'Wednesday Journal', href: LINKS.wednesdayJournal, what: 'Oak Park’s local paper: candidate announcements, forums and interviews.' },
  { name: 'Vote411 (League of Women Voters)', href: 'https://www.vote411.org/ballot', what: 'Every candidate asked the same questions; their answers, by your address.' },
];
