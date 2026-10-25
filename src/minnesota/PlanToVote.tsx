import { CalendarPlus } from 'lucide-react';
import { dayLabel, downloadReminder } from '../dates';
import { Out, Step, type Guide } from '../PlanToVote';
import { LINKS } from './config';
import { byId } from './dates';

// Minnesota's rules, from the Secretary of State's register-to-vote,
// vote-early-in-person, vote-early-by-mail and Election Day pages, checked
// October 25, 2026.

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
  const reminder = byId(method === 'early' ? 'early-weekend' : method === 'absentee' ? 'absentee' : 'election');
  return (
    <ol className="space-y-4">
      <Step n={1} done={!!plan.registered} title="Make sure you’re registered" onToggle={() => setPlan('registered', !plan.registered)}>
        <p>Check your registration, see your sample ballot and find your polling place at the <Out href={LINKS.myInfo}>Minnesota Voter Information Portal</Out>{county ? <> (your election is run by {county} County’s election office)</> : null}.</p>
        <p><strong className="text-[var(--gb-amber-hi)]">Not registered or moved?</strong> Pre-registration closed <strong>Tue, Oct 13</strong>, but Minnesota lets you register when you vote: at your election office while voting early, or at your polling place on Election Day, with proof of where you live. <Out href={LINKS.register}>How to register</Out></p>
      </Step>

      <Step n={2} done={!!plan.id} title="Know what to bring" onToggle={() => setPlan('id', !plan.id)}>
        <p><strong>Already registered at your current address? You don’t need to show ID.</strong> You sign the roster and vote.</p>
        <p><strong>Registering when you vote</strong> needs proof of where you live: a Minnesota driver’s license, ID or learner’s permit with your current address; or a photo ID plus a document with your current name and address (a bill, bank statement, lease, or a student fee statement); or a registered voter from your precinct who vouches for you. <Out href={LINKS.register}>The full list</Out></p>
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
            <p><strong>Fri, Sep 18 through Mon, Nov 2</strong>, no reason needed, at your county election office (some cities and towns run their own). You vote an absentee ballot in person; in the last 18 days (from Fri, Oct 16) most places let you feed it into the tabulator yourself, like Election Day.</p>
            <p>Offices stay open until <strong>7pm on Tue, Oct 27</strong>, open <strong>9am–3pm on Sat, Oct 24, Sat, Oct 31 and Sun, Nov 1</strong>, and close at <strong>5pm on Mon, Nov 2</strong>. Find yours at the <Out href={LINKS.myInfo}>Voter Information Portal</Out>. <Out href={LINKS.early}>How early voting works</Out></p>
          </div>
        )}
        {method === 'absentee' && (
          <div className="space-y-2">
            <p>Any Minnesota voter can vote by mail, no reason needed. <strong>Apply online</strong> at the Voter Information Portal, or send the paper application to your county; there is no application deadline, but your ballot has to get to you and back, so apply early. <Out href={LINKS.absentee}>Apply</Out></p>
            <p>Your ballot needs a <strong>witness</strong>: a registered Minnesota voter or a notary signs the envelope with you. Return it by mail (allow a week) or drop it at your county election office, so it arrives <strong>by 8pm on Nov 3</strong>; it can’t be dropped at a polling place. Track it at the <Out href={LINKS.myInfo}>portal</Out>.</p>
          </div>
        )}
        {method === 'day' && (
          <div className="space-y-2">
            <p><strong>Tue, Nov 3, 7am–8pm</strong> at your assigned polling place (towns under 500 people may open at 10am). <Out href={LINKS.myInfo}>Look it up</Out></p>
            <p>In line by 8pm? You get to vote. No ID is needed if you’re registered at your address; bring proof of where you live if you need to register there. <Out href={LINKS.electionDay}>Election Day voting</Out></p>
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
        {method === 'absentee' && <p>That’s the last day to vote early in person instead; a mailed ballot should already be on its way back by then.</p>}
        {!method && <p>Pick how you’ll vote first.</p>}
      </Step>

      <Step n={5} done={ballotDone} title="Bring your notes">
        <p>Finish <strong>My Ballot</strong> and bring it along. Minnesota lets you take notes or a marked-up sample ballot into the booth; just keep them to yourself, and no photos of your marked ballot.</p>
        <p>{ballotDone ? '✅ Your ballot is ready.' : 'Your ballot isn’t finished yet; it checks itself off when it is.'}</p>
      </Step>
    </ol>
  );
}

/** Nonpartisan guides that go where this one stops, for Minnesota voters. */
export const MINNESOTA_GUIDES: Guide[] = [
  { name: 'Vote411 (League of Women Voters)', href: 'https://www.vote411.org/ballot', what: 'Every candidate asked the same questions; their answers, by your address.' },
  { name: 'Ballotpedia sample ballot', href: 'https://ballotpedia.org/Sample_Ballot_Lookup', what: 'Bios, past elections and candidate surveys for each race on your ballot.' },
  { name: 'Minnesota Voter Information Portal', href: LINKS.myInfo, what: 'Your registration, official sample ballot, polling place and absentee tracking, from the Secretary of State.' },
  { name: 'Minnesota Campaign Finance Board', href: LINKS.disclosure, what: 'Who gives to state campaigns, from the official reports.' },
  { name: 'Minnesota Judicial Branch: judicial elections', href: 'https://www.mncourts.gov/About-The-Courts/Judicial-Elections.aspx', what: 'How judges reach the ballot and who’s running.' },
];
