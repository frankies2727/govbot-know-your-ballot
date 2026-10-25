import { CalendarPlus } from 'lucide-react';
import { dayLabel, downloadReminder } from '../dates';
import { Out, Step, type Guide } from '../PlanToVote';
import { LINKS } from './config';
import { byId } from './dates';

// Wisconsin's rules, from the Wisconsin Elections Commission's register-to-
// vote, photo ID, absentee voting and Election Day pages, checked October
// 25, 2026.

type Method = 'early' | 'absentee' | 'day';
const METHODS: { id: Method; label: string; emoji: string }[] = [
  { id: 'early', label: 'Vote early in person', emoji: '🗓️' },
  { id: 'absentee', label: 'By mail', emoji: '✉️' },
  { id: 'day', label: 'Election Day', emoji: '🇺🇸' },
];

interface Props {
  plan: Record<string, boolean | string>;
  setPlan: (key: string, value: boolean | string) => void;
  /** The voter's county, once known. */
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
        <p><strong className="text-[var(--gb-amber-hi)]">Not registered or moved?</strong> Register online or by mail through <strong>Wed, Oct 14</strong>. After that, go to your municipal clerk’s office through <strong>Fri, Oct 30</strong>, or register at your polling place on Election Day. Either way you need proof of where you live: a Wisconsin license or ID with your current address, a bill, a bank statement, a lease, a paycheck or a government document (on a phone screen is fine). <Out href={LINKS.register}>How to register</Out></p>
      </Step>

      <Step n={2} done={!!plan.id} title="Bring a photo ID" onToggle={() => setPlan('id', !plan.id)}>
        <p><strong>Wisconsin requires a photo ID to vote</strong>, at the polls, at early voting and with a mail ballot (a copy, unless your clerk already has one on file). The address on it doesn’t need to be current.</p>
        <p><strong>IDs that work:</strong> a Wisconsin driver’s license or state ID (unexpired, or expired since the last general election); a U.S. passport; a military or veterans ID; a tribal ID; a certificate of naturalization issued in the last two years; or a student ID that carries a signature, an issue date and an expiry within two years, with proof of current enrollment. A free state ID is available from the DMV. <Out href={LINKS.photoId}>The full list</Out></p>
        <p>No ID with you on Election Day? You can vote a provisional ballot and show your ID to your clerk by 4pm on Fri, Nov 6 for it to count.</p>
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
          <div className="space-y-2">
            <p>Wisconsin calls it <strong>in-person absentee voting</strong>: you vote at your municipal clerk’s office (or a site the clerk sets up) and the ballot goes in a sealed envelope. No reason needed; bring your photo ID.</p>
            <p>Each city, village and town sets its own days and hours, from <strong>Tue, Oct 20 at the earliest through Sun, Nov 1 at the latest</strong>; many end on Fri, Oct 30. Find your clerk’s hours at <Out href={LINKS.myInfo}>MyVote.wi.gov</Out>. <Out href={LINKS.absentee}>How absentee voting works</Out></p>
          </div>
        )}
        {method === 'absentee' && (
          <div className="space-y-2">
            <p>Any Wisconsin voter can vote by mail, no reason needed. <strong>Request your ballot by 5pm on Thu, Oct 29</strong> at MyVote.wi.gov or from your clerk, with a copy of your photo ID unless one is on file. <Out href={LINKS.absentee}>Request a ballot</Out></p>
            <p>Your ballot needs a <strong>witness</strong>: an adult U.S. citizen signs the envelope and writes their address. Return it by mail (allow a week), to your clerk’s office, or to a drop box where your municipality has one, so it arrives <strong>by 8pm on Nov 3</strong>. Track it at <Out href={LINKS.myInfo}>MyVote.wi.gov</Out>.</p>
          </div>
        )}
        {method === 'day' && (
          <div className="space-y-2">
            <p><strong>Tue, Nov 3, 7am–8pm</strong> at your assigned polling place. <Out href={LINKS.myInfo}>Look it up</Out></p>
            <p>In line by 8pm? You get to vote. Bring your photo ID, and proof of where you live if you still need to register. <Out href={LINKS.electionDay}>Election Day voting</Out></p>
          </div>
        )}
      </Step>

      <Step n={4} done={!!plan.reminder} title="Put it on your calendar">
        <button type="button" disabled={!method}
          onClick={() => { downloadReminder(reminder, LINKS.myInfo); setPlan('reminder', true); }}
          className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] bg-[var(--kyb-chip)] px-4 font-bold text-[var(--gb-text)] hover:bg-[var(--kyb-chip-hi)] disabled:cursor-not-allowed disabled:border-[var(--gb-border)]">
          <CalendarPlus className="w-5 h-5" aria-hidden="true" />
          Remind me {dayLabel(reminder.date).replace(/^\w+, /, '')}
        </button>
        {method === 'absentee' && <p>That’s the request deadline. Send the ballot back the day it arrives.</p>}
        {method === 'early' && <p>That’s the first day a clerk may open; check your own clerk’s hours.</p>}
        {!method && <p>Pick how you’ll vote first.</p>}
      </Step>

      <Step n={5} done={ballotDone} title="Bring your notes">
        <p>Finish <strong>My Ballot</strong> and bring it along. Wisconsin lets you take notes or a marked-up sample ballot into the booth; just keep them to yourself.</p>
        <p>{ballotDone ? '✅ Your ballot is ready.' : 'Your ballot isn’t finished yet; it checks itself off when it is.'}</p>
      </Step>
    </ol>
  );
}

/** Nonpartisan guides that go where this one stops, for Wisconsin voters. */
export const WISCONSIN_GUIDES: Guide[] = [
  { name: 'Vote411 (League of Women Voters)', href: 'https://www.vote411.org/ballot', what: 'Every candidate asked the same questions; their answers, by your address.' },
  { name: 'Ballotpedia sample ballot', href: 'https://ballotpedia.org/Sample_Ballot_Lookup', what: 'Bios, past elections and candidate surveys for each race on your ballot.' },
  { name: 'MyVote Wisconsin', href: LINKS.myInfo, what: 'Your registration, official sample ballot, polling place, clerk and absentee tracking, from the Elections Commission.' },
  { name: 'Wisconsin Democracy Campaign', href: 'https://www.wisdc.org/', what: 'Nonpartisan tracking of who funds state campaigns.' },
  { name: 'Bring It to the Ballot', href: 'https://bringit.wi.gov/', what: 'The state’s guide to which photo IDs work and how to get a free one.' },
];
