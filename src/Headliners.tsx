import { ArrowRight, RotateCcw } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { FaceStrip } from './Bits';
import { Face } from './Face';
import { stakes } from './stakes';
import { useStateConfig } from './state';
import type { Candidate, Race } from './types';

// The races everyone in the state votes on, as cards on the landing page.
// The front says what the job does and what's at stake (an open seat, or
// the incumbent running, in the source's words) and shows everyone running
// as a row of faces that scrolls sideways on its own; a card flips over to
// show them large, a face opens that candidate's details, and the back
// links into the race on the ballot.

interface Section { id: string; title: string; emoji: string; color: string; ink: string }

interface Props {
  races: Race[];
  sections: readonly Section[];
  overline: string;
  heading: string;
  intro: string;
  onOpen: (race: Race, c: Candidate) => void;
  onOpenRace: (race: Race) => void;
  /** Extra cards after the races (a proposals card, say). */
  children?: ReactNode;
}

const title = (r: Race) => r.office.replace(/ \(\d+ seats\)$/, '');
const lead = (name: string) => name.split(' & ')[0];

function Card({ race, section, onOpen, onOpenRace }: { key?: string; race: Race; section: Section; onOpen: Props['onOpen']; onOpenRace: Props['onOpenRace'] }) {
  const [open, setOpen] = useState(false);
  const { explainOffice } = useStateConfig();
  const why = stakes(race);
  return (
    <li className="kyb-flip">
      <div className={`kyb-flip-inner ${open ? 'kyb-flipped' : ''}`}>
        <div className={`kyb-face ${open ? 'kyb-off' : ''} min-h-[176px] rounded-2xl border-[3px] bg-[var(--gb-surface)] p-4 flex flex-col gap-2.5`} style={{ borderColor: section.color }} inert={open}>
          <button type="button" onClick={() => setOpen(true)} aria-expanded={open} className="flex flex-col items-start gap-2.5 rounded-xl -m-1 p-1 text-left hover:bg-[var(--kyb-chip)]">
            <span className="inline-flex self-start items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: section.color, color: section.ink }}>{section.emoji} {section.title}</span>
            <span className="block text-lg font-black leading-tight">{title(race)}</span>
            <span className="block text-sm leading-snug">{explainOffice(race.office)}</span>
            {why && <span className="block text-sm leading-snug line-clamp-3"><span className="font-bold">Why it matters: </span>{why}</span>}
          </button>
          <FaceStrip people={race.candidates} names />
          <span className="mt-auto flex items-center justify-between gap-2 text-xs font-bold">
            <span>{race.candidates.length} candidate{race.candidates.length === 1 ? '' : 's'}{race.voteFor > 1 ? ` · pick up to ${race.voteFor}` : ''}</span>
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 min-h-[32px]" style={{ color: section.color }}>Meet all candidates <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /></button>
          </span>
        </div>
        <div className={`kyb-face kyb-back ${open ? '' : 'kyb-off'} rounded-2xl border-[3px] bg-[var(--gb-surface)] p-4 flex flex-col gap-3`} style={{ borderColor: section.color }} inert={!open}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-black leading-tight">{title(race)}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Flip back" className="shrink-0 w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center hover:bg-[var(--kyb-chip)]">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <ul className="grid grid-cols-3 gap-x-2 gap-y-3">
            {race.candidates.map((c) => (
              <li key={c.ballot}>
                <button type="button" onClick={() => onOpen(race, c)} className="group w-full flex flex-col items-center gap-1.5 text-center">
                  <Face c={c} className="w-16 h-16 text-xl ring-offset-2 ring-offset-[var(--gb-surface)] group-hover:ring-[3px] group-focus-visible:ring-[3px]" />
                  <span className="block text-[13px] font-bold leading-tight">{lead(c.name)}</span>
                  <span className="inline-flex rounded-full bg-[var(--kyb-chip)] px-2 py-0.5 text-[11px] font-bold leading-tight">{c.nominatedBy ?? c.party}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onOpenRace(race)} className="mt-auto inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl font-black" style={{ background: section.color, color: section.ink }}>
            See the full race <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

export function Headliners({ races, sections, overline, heading, intro, onOpen, onOpenRace, children }: Props) {
  if (!races.length) return null;
  return (
    <section aria-labelledby="kyb-headliners" className="space-y-4">
      <div className="space-y-1">
        <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--gb-primary)]">{overline}</p>
        <h2 id="kyb-headliners" className="text-3xl sm:text-4xl leading-[1.05]">{heading}</h2>
        <p className="text-[15px]">{intro}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
        {races.map((r) => <Card key={r.id} race={r} section={sections.find((s) => s.id === r.section) ?? sections[0]} onOpen={onOpen} onOpenRace={onOpenRace} />)}
        {children}
      </ul>
    </section>
  );
}
