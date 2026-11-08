import { CalendarPlus } from 'lucide-react';
import { dayLabel, downloadReminder } from '../dates';
import { Out, Step, type Guide } from '../PlanToVote';
import { LINKS } from '../wisconsin/config';
import { byId } from './dates';

// Voting in Wisconsin's spring 2027 election, with the Elections Commission's
// rules (the same as Nov 2026: photo ID, proof of residence to register).
// The Feb 16 primary is only where more than two people filed for an office.

type Method = 'early' | 'absentee' | 'day';
const METHODS: { id: Method; label: string; emoji: string }[] = [
  { id: 'early', label: 'Vote early in person', emoji: '🗓️' },
  { id: 'absentee', label: 'By mail', emoji: '✉️' },
  { id: 'day', label: 'Election Day', emoji: '🗳️' },
];

interface Props {
  plan: Record<string, boolean | string>;
  setPlan: (key: string, value: boolean | string) => void;
  county?: string;
  ballotDone: boolean;
}

export function PlanToVote({ plan, setPlan, county, ballotDone }: Props) {
  const method = (plan.method as Method) || null;
  const reminder = byId(method === 'early' ? 'early-opens' : method === 'absentee' ? 'absentee' : 'election');
  return (
    <ol className="space-y-4">
      <Step n={1} done={!!plan.registered} title="Make sure you’re registered" onToggle={() => setPlan('registered', !plan.registered)}>
        <p>Check your registration, see your sample ballot and find your polling place at <Out href={LINKS.myInfo}>MyVote.wi.gov</Out>{county ? <> (your election is run by your city, village or town clerk in {county} County)</> : null}.</p>
        <p><strong className="text-[var(--gb-amber-hi)]">Not registered or moved?</strong> For Apr 6, register online or by mail through <strong>Wed, Mar 17</strong>; after that at your municipal clerk’s office through <strong>Fri, Apr 2</strong>, or at your polling place on Election Day. (For a Feb 16 primary: Wed, Jan 27 and Fri, Feb 12.) You need proof of where you live: a Wisconsin license or ID with your current address, a bill, a bank statement, a lease, a paycheck or a government document (on a phone screen is fine). <Out href={LINKS.register}>How to register</Out></p>
      </Step>

      <Step n={2} done={!!plan.id} title="Bring a photo ID" onToggle={() => setPlan('id', !plan.id)}>
        <p><strong>Wisconsin requires a photo ID to vote</strong>, at the polls, at early voting and with a mail ballot (a copy, unless your clerk already has one on file). The address on it doesn’t need to be current. A free state ID is available from the DMV. <Out href={LINKS.photoId}>Which IDs work</Out></p>
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
          <p>Wisconsin calls it <strong>in-person absentee voting</strong>, at your municipal clerk’s office or a site the clerk sets up. For Apr 6 it can run from <strong>Tue, Mar 23 at the earliest through Sun, Apr 4 at the latest</strong>; each city, village and town sets its own hours. Bring your photo ID. <Out href={LINKS.absentee}>How absentee voting works</Out></p>
        )}
        {method === 'absentee' && (
          <p>Any Wisconsin voter can vote by mail, no reason needed. <strong>Request your ballot by 5pm on Thu, Apr 1</strong> at MyVote.wi.gov, with a copy of your photo ID unless one is on file. Your ballot needs a <strong>witness</strong>’s signature and address, and has to reach your clerk <strong>by 8pm on Apr 6</strong>. <Out href={LINKS.absentee}>Request a ballot</Out></p>
        )}
        {method === 'day' && (
          <p><strong>Tue, Apr 6, 7am–8pm</strong> at your polling place. <Out href={LINKS.myInfo}>Look it up</Out>. In line by 8pm? You get to vote. Bring your photo ID. <Out href={LINKS.electionDay}>Election Day voting</Out></p>
        )}
      </Step>

      <Step n={4} done={!!plan.reminder} title="Put it on your calendar">
        <button type="button" disabled={!method}
          onClick={() => { downloadReminder(reminder, LINKS.myInfo); setPlan('reminder', true); }}
          className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] bg-[var(--kyb-chip)] px-4 font-bold text-[var(--gb-text)] hover:bg-[var(--kyb-chip-hi)] disabled:cursor-not-allowed disabled:border-[var(--gb-border)]">
          <CalendarPlus className="w-5 h-5" aria-hidden="true" />
          Remind me {dayLabel(reminder.date).replace(/^\w+, /, '')}
        </button>
        {!method && <p>Pick how you’ll vote first.</p>}
      </Step>

      <Step n={5} done={ballotDone} title="Bring your notes">
        <p>Finish <strong>My Ballot</strong> and bring it along. Wisconsin lets you take notes or a marked-up sample ballot into the booth; just keep them to yourself.</p>
        <p>{ballotDone ? '✅ Your ballot is ready.' : 'Your ballot isn’t finished yet; it checks itself off when it is.'}</p>
      </Step>
    </ol>
  );
}

/** Nonpartisan guides that go where this one stops, for Wisconsin's spring election. */
export const SPRING_GUIDES: Guide[] = [
  { name: 'MyVote Wisconsin', href: LINKS.myInfo, what: 'Your registration, official sample ballot (with your local races), polling place and absentee tracking.' },
  { name: 'Vote411 (League of Women Voters)', href: 'https://www.vote411.org/ballot', what: 'Every candidate asked the same questions; their answers, by your address.' },
  { name: 'Ballotpedia sample ballot', href: 'https://ballotpedia.org/Sample_Ballot_Lookup', what: 'Bios and past races for each judge and candidate on your ballot.' },
];
