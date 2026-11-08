import { CalendarPlus } from 'lucide-react';
import { dayLabel, downloadReminder } from '../dates';
import { Out, Step, type Guide } from '../PlanToVote';
import { LINKS } from './config';
import { byId } from './dates';

// Voting in Denver's Apr 6, 2027 election, as Colorado runs every election:
// a ballot in the mail to every registered voter, back by mail, at a 24-hour
// drop box or at a Voter Service and Polling Center, where you can also
// register, get a replacement or vote in person through 7pm on Election Day.

type Method = 'mail' | 'dropbox' | 'person';
const METHODS: { id: Method; label: string; emoji: string }[] = [
  { id: 'mail', label: 'Mail it back', emoji: '✉️' },
  { id: 'dropbox', label: 'Drop box', emoji: '📥' },
  { id: 'person', label: 'In person', emoji: '🗳️' },
];

interface Props {
  plan: Record<string, boolean | string>;
  setPlan: (key: string, value: boolean | string) => void;
  county?: string;
  ballotDone: boolean;
}

export function PlanToVote({ plan, setPlan, ballotDone }: Props) {
  const method = (plan.method as Method) || null;
  const reminder = byId(method === 'mail' ? 'mail-back' : method === 'dropbox' ? 'ballots-mailed' : 'election');
  return (
    <ol className="space-y-4">
      <Step n={1} done={!!plan.registered} title="Make sure you’re registered, at your current address" onToggle={() => setPlan('registered', !plan.registered)}>
        <p>Your ballot goes to the address on your registration. Check it, or register, at <Out href={LINKS.myInfo}>GoVoteColorado.gov</Out>.</p>
        <p><strong className="text-[var(--gb-amber-hi)]">Not registered or moved?</strong> Register or update your address by <strong>Mon, Mar 29</strong> and your ballot comes in the mail. After that, register and vote in person at a Voter Service and Polling Center, through 7pm on Election Day.</p>
      </Step>

      <Step n={2} done={!!method} title="Pick how you’ll return your ballot">
        <p>Every registered Denver voter gets a ballot in the mail between <strong>Mon, Mar 15</strong> and <strong>Fri, Mar 19</strong>. Fill it in at home, then sign the envelope: an unsigned ballot can’t be counted.</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How you'll return your ballot">
          {METHODS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setPlan('method', m.id)}
              className={`min-h-[64px] rounded-xl border-2 px-2 py-2 font-bold text-sm leading-tight transition-colors ${method === m.id ? 'border-[var(--gb-primary)] bg-[var(--gb-primary)] text-[var(--gb-bg)]' : 'border-[var(--gb-border)] bg-[var(--kyb-chip)] text-[var(--gb-text)] hover:border-[var(--gb-text)]'}`}>
              <span className="block text-xl" aria-hidden="true">{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        {method === 'mail' && (
          <p>Put a stamp on it and mail it by <strong>Mon, Mar 29</strong>, as Colorado’s election officials advise. It has to <em>arrive</em> by 7pm on Apr 6; a postmark doesn’t count. Later than that, use a drop box. <Out href={LINKS.ballotTrax}>Track your ballot</Out></p>
        )}
        {method === 'dropbox' && (
          <p>No stamp needed. Denver’s 24-hour drop boxes take ballots from the day they’re mailed until <strong>7pm on Tue, Apr 6</strong>. The Elections Division lists every one. <Out href={LINKS.elections}>Find a drop box</Out> · <Out href={LINKS.ballotTrax}>Track your ballot</Out></p>
        )}
        {method === 'person' && (
          <p>Vote at any Voter Service and Polling Center in Denver, open in the days before the election and <strong>7am–7pm on Tue, Apr 6</strong>. Bring an ID: a Colorado driver’s license or ID card, a passport, or a recent bill, bank statement or paycheck with your name and address all count. In line by 7pm? You get to vote. <Out href={LINKS.elections}>Centers and hours</Out></p>
        )}
      </Step>

      <Step n={3} done={!!plan.reminder} title="Put it on your calendar">
        <button type="button" disabled={!method}
          onClick={() => { downloadReminder(reminder, LINKS.elections); setPlan('reminder', true); }}
          className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] bg-[var(--kyb-chip)] px-4 font-bold text-[var(--gb-text)] hover:bg-[var(--kyb-chip-hi)] disabled:cursor-not-allowed disabled:border-[var(--gb-border)]">
          <CalendarPlus className="w-5 h-5" aria-hidden="true" />
          Remind me {dayLabel(reminder.date).replace(/^\w+, /, '')}
        </button>
        {method === 'mail' && <p>The last day to mail it back to be safe.</p>}
        {method === 'dropbox' && <p>When ballots start going out: drop yours off as soon as it’s filled in.</p>}
        {!method && <p>Pick how you’ll vote first.</p>}
      </Step>

      <Step n={4} done={ballotDone} title="Fill in your ballot with your notes">
        <p>Finish <strong>My Ballot</strong> here, then keep it beside you as you mark your mail ballot at home, or bring it to a Voter Service and Polling Center.</p>
        <p>{ballotDone ? '✅ Your ballot is ready.' : 'Your ballot isn’t finished yet; it checks itself off when it is.'}</p>
      </Step>
    </ol>
  );
}

/** Nonpartisan guides that go where this one stops, for Denver voters. */
export const DENVER_GUIDES: Guide[] = [
  { name: 'Denver Elections Division', href: LINKS.elections, what: 'Dates, drop boxes, Voter Service and Polling Centers, and the official results.' },
  { name: 'GoVoteColorado', href: LINKS.myInfo, what: 'Your registration, your ballot’s status and your sample ballot.' },
  { name: 'Denver SearchLight', href: LINKS.searchlight, what: 'Every campaign’s reports: who gave, how much, and how it was spent, with Fair Elections Fund money.' },
  { name: 'Vote411 (League of Women Voters)', href: 'https://www.vote411.org/ballot', what: 'Every candidate asked the same questions; their answers, by your address.' },
];
