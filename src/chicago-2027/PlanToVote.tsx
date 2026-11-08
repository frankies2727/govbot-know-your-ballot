import { CalendarPlus } from 'lucide-react';
import { dayLabel, downloadReminder } from '../dates';
import { LINKS as BOARD, Out, Step, type Guide } from '../PlanToVote';
import { LINKS } from './config';
import { byId } from './dates';

// Voting in Chicago's Feb 23, 2027 election, from the Chicago Board of
// Election Commissioners' 2027 calendar and its voting pages (the same rules
// as Nov 2026: no ID needed once registered; two IDs, one with your address,
// to register when you vote). Early voting sites and hours aren't set yet:
// the Board publishes them by Jan 3, 2027.

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
        <p>Check your registration, polling place and official sample ballot at the Board’s <Out href={BOARD.myInfo}>Your Voter Information</Out> lookup.</p>
        <p><strong className="text-[var(--gb-amber-hi)]">Not registered or moved?</strong> Register online through <strong>Sun, Feb 7</strong> at <Out href={BOARD.registerOnline}>ova.elections.il.gov</Out>, or at the Board or a library branch through <strong>Tue, Jan 26</strong>. After that, register in person when you vote early or on Election Day: bring two IDs, one showing your current address (<Out href={BOARD.id}>which IDs count</Out>).</p>
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
          <div className="space-y-2">
            <p>Early voting can start as soon as <strong>Thu, Jan 14</strong> and runs through <strong>Mon, Feb 22</strong>. The Board names every site, day and hour by Jan 3; we’ll add them here. Any Chicago voter can use any early voting site. <Out href={BOARD.early}>Early voting</Out></p>
          </div>
        )}
        {method === 'mail' && (
          <div className="space-y-2">
            <p><strong>Apply from Wed, Nov 25 through Thu, Feb 18</strong> with the Board’s <Out href={BOARD.mail}>online application</Out>; voters on the permanent vote-by-mail list get theirs without applying. Your ballot comes with a postage-paid return envelope.</p>
            <p>Return it by mail or at a <Out href={BOARD.dropBoxes}>drop box</Out>. Postmarked by Feb 23, it counts if it arrives by Mar 9.</p>
          </div>
        )}
        {method === 'day' && (
          <div className="space-y-2">
            <p><strong>Tue, Feb 23, 6am–7pm</strong> at your polling place. <Out href={BOARD.myInfo}>Find it</Out>: the Board’s lookup shows it with your registration and official sample ballot. In line by 7pm? You get to vote. <Out href={BOARD.electionDay}>Election Day info</Out></p>
          </div>
        )}
      </Step>

      <Step n={3} done={!!plan.reminder} title="Put it on your calendar">
        <button type="button" disabled={!method}
          onClick={() => { downloadReminder(reminder, BOARD.myInfo); setPlan('reminder', true); }}
          className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] bg-[var(--kyb-chip)] px-4 font-bold text-[var(--gb-text)] hover:bg-[var(--kyb-chip-hi)] disabled:cursor-not-allowed disabled:border-[var(--gb-border)]">
          <CalendarPlus className="w-5 h-5" aria-hidden="true" />
          Remind me {dayLabel(reminder.date).replace(/^\w+, /, '')}
        </button>
        {method === 'mail' && <p>That’s the last day to apply. Send the ballot back the day it arrives.</p>}
        {method === 'early' && <p>That’s the earliest early voting can open; check the Board’s sites and hours once they’re out.</p>}
        {!method && <p>Pick how you’ll vote first.</p>}
      </Step>

      <Step n={4} done={ballotDone} title="Bring your notes">
        <p>Finish <strong>My Ballot</strong> and bring it along. Illinois lets you take notes or a marked-up sample ballot into the booth; just keep them to yourself.</p>
        <p>{ballotDone ? '✅ Your ballot is ready.' : 'Your ballot isn’t finished yet; it checks itself off when it is.'}</p>
      </Step>
    </ol>
  );
}

/** Nonpartisan guides that go where this one stops, for Chicago voters. */
export const CHICAGO_GUIDES: Guide[] = [
  { name: 'Chicago Board of Election Commissioners', href: BOARD.myInfo, what: 'Your registration, polling place and official sample ballot.' },
  { name: 'Chicago Politics', href: LINKS.chicagoPolitics, what: 'Every candidate’s petition signatures and campaign money, and how sitting alderpersons have voted.' },
  { name: 'CCPSA: District Council election', href: LINKS.ccpsa, what: 'What the police district councils do, from the Community Commission for Public Safety and Accountability.' },
  { name: 'Vote411 (League of Women Voters)', href: 'https://www.vote411.org/ballot', what: 'Every candidate asked the same questions; their answers, by your address.' },
];
