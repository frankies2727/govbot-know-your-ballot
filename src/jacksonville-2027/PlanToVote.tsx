import { CalendarPlus } from 'lucide-react';
import { dayLabel, downloadReminder } from '../dates';
import { Out, Step, type Guide } from '../PlanToVote';
import { LINKS } from './config';
import { byId } from './dates';

// Voting in Jacksonville's Mar 9, 2027 First Election, under Florida law and
// the Duval County Supervisor of Elections' rules: a photo ID with your
// signature at the polls, a fresh mail-ballot request for 2027, mail ballots
// back by 7pm on Election Day. Early voting days and sites aren't set yet.

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
  const reminder = byId(method === 'mail' ? 'mail-request' : 'election');
  return (
    <ol className="space-y-4">
      <Step n={1} done={!!plan.registered} title="Make sure you’re registered" onToggle={() => setPlan('registered', !plan.registered)}>
        <p>Check your registration with the <Out href={LINKS.myInfo}>Florida Division of Elections’ lookup</Out>.</p>
        <p><strong className="text-[var(--gb-amber-hi)]">Not registered or moved?</strong> Register or update your address by <strong>Mon, Feb 8</strong> at <Out href={LINKS.register}>RegisterToVoteFlorida.gov</Out>. (For the May 18 General Election: by Mon, Apr 19.) Florida has no registering at the polls.</p>
      </Step>

      <Step n={2} done={!!plan.id} title="Bring a photo ID with your signature" onToggle={() => setPlan('id', !plan.id)}>
        <p>Florida asks for a <strong>photo ID that shows your signature</strong> at the polls and at early voting: a Florida driver’s license or ID card, a passport, a military, student or retirement-center ID, and others. Without one you can still vote a provisional ballot. <Out href={LINKS.votingBasics}>Which IDs work</Out></p>
      </Step>

      <Step n={3} done={!!method} title="Pick how you’ll vote">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How you'll vote">
          {METHODS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setPlan('method', m.id)}
              className={`min-h-[64px] rounded-xl border-2 px-2 py-2 font-bold text-sm leading-tight transition-colors ${method === m.id ? 'border-[var(--gb-primary)] bg-[var(--gb-primary)] text-[var(--gb-bg)]' : 'border-[var(--gb-border)] bg-[var(--kyb-chip)] text-[var(--gb-text)] hover:border-[var(--gb-text)]'}`}>
              <span className="block text-xl" aria-hidden="true">{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        {method === 'early' && (
          <p>The Supervisor of Elections hasn’t set early voting’s days and sites for Mar 9 yet; any Duval voter can use any early voting site. We’ll add them here. <Out href={LINKS.dates}>2027 dates and deadlines</Out></p>
        )}
        {method === 'mail' && (
          <p><strong>Request your ballot by 5pm on Thu, Feb 25.</strong> A request made before the Nov 3, 2026 election ran out at the end of 2026, so ask again for 2027. It has to <em>reach</em> the Supervisor of Elections by <strong>7pm on Mar 9</strong>; a postmark doesn’t count. Sign the envelope as you signed your registration. <Out href={LINKS.votingBasics}>Voting by mail</Out></p>
        )}
        {method === 'day' && (
          <p><strong>Tue, Mar 9, 7am–7pm</strong> at your own precinct’s polling place, shown on your voter information card. In line by 7pm? You get to vote. Bring your photo ID. <Out href={LINKS.votingBasics}>Election Day voting</Out></p>
        )}
      </Step>

      <Step n={4} done={!!plan.reminder} title="Put it on your calendar">
        <button type="button" disabled={!method}
          onClick={() => { downloadReminder(reminder, LINKS.soe); setPlan('reminder', true); }}
          className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] bg-[var(--kyb-chip)] px-4 font-bold text-[var(--gb-text)] hover:bg-[var(--kyb-chip-hi)] disabled:cursor-not-allowed disabled:border-[var(--gb-border)]">
          <CalendarPlus className="w-5 h-5" aria-hidden="true" />
          Remind me {dayLabel(reminder.date).replace(/^\w+, /, '')}
        </button>
        {method === 'mail' && <p>That’s the last day to ask. Send the ballot back the day it arrives.</p>}
        {method === 'early' && <p>Election Day, for now: early voting’s dates come out later.</p>}
        {!method && <p>Pick how you’ll vote first.</p>}
      </Step>

      <Step n={5} done={ballotDone} title="Bring your notes">
        <p>Finish <strong>My Ballot</strong> and bring it along, or keep it beside you as you mark a mail ballot.</p>
        <p>{ballotDone ? '✅ Your ballot is ready.' : 'Your ballot isn’t finished yet; it checks itself off when it is.'}</p>
      </Step>
    </ol>
  );
}

/** Nonpartisan guides that go where this one stops, for Jacksonville voters. */
export const JACKSONVILLE_GUIDES: Guide[] = [
  { name: 'Duval County Supervisor of Elections', href: LINKS.soe, what: 'Your sample ballot and precinct, early voting sites, every qualified candidate and their campaign reports.' },
  { name: 'Jacksonville City Council', href: LINKS.council, what: 'Who represents each district and at-large group now, and how to reach them.' },
  { name: 'Vote411 (League of Women Voters)', href: 'https://www.vote411.org/ballot', what: 'Every candidate asked the same questions; their answers, by your address.' },
  { name: 'Ballotpedia sample ballot', href: 'https://ballotpedia.org/Sample_Ballot_Lookup', what: 'Bios and past races for each candidate on your ballot.' },
];
