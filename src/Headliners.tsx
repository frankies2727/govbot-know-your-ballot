import { ArrowRight, Scale } from 'lucide-react';
import type { ReactNode } from 'react';
import { FaceStrip } from './Bits';
import { stakes } from './stakes';
import { useStateConfig } from './state';
import type { Candidate, Race } from './types';

// The races everyone in the state votes on, as cards on the landing page:
// what the job does, what's at stake (an open seat, or the incumbent
// running, in the source's words), everyone running as a row of faces (each
// one opens that candidate), a head-to-head compare, and the race on the
// ballot.

interface Section { id: string; title: string; emoji: string; color: string; ink: string }

interface Props {
  races: Race[];
  sections: readonly Section[];
  overline: string;
  heading: string;
  intro: string;
  onOpen: (race: Race, c: Candidate) => void;
  onOpenRace: (race: Race) => void;
  onCompare: (race: Race) => void;
  /** Extra cards after the races (a proposals card, say). */
  children?: ReactNode;
}

const title = (r: Race) => r.office.replace(/ \(\d+ seats\)$/, '');

function Card({ race, section, onOpen, onOpenRace, onCompare }: { key?: string; race: Race; section: Section; onOpen: Props['onOpen']; onOpenRace: Props['onOpenRace']; onCompare: Props['onCompare'] }) {
  const { explainOffice } = useStateConfig();
  const why = stakes(race);
  return (
    <li className="rounded-2xl border-[3px] bg-[var(--gb-surface)] p-4 flex flex-col gap-2.5" style={{ borderColor: section.color }}>
      <span className="inline-flex self-start items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold text-[var(--gb-text)]" style={{ borderColor: section.color, background: `color-mix(in srgb, ${section.color} 14%, transparent)` }}>{section.emoji} {section.title}</span>
      <h3 className="text-lg font-black leading-tight">{title(race)}</h3>
      <p className="text-sm leading-snug">{explainOffice(race.office)}</p>
      {why && <p className="text-sm leading-snug"><span className="font-bold">Why it matters: </span>{why}</p>}
      <FaceStrip people={race.candidates} names info color={section.color} onPick={(c) => onOpen(race, c as Candidate)} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
        <span>{race.candidates.length} candidate{race.candidates.length === 1 ? '' : 's'} · <span className="rounded-md bg-[var(--kyb-chip)] px-1.5 py-0.5">{race.voteFor > 1 ? `pick up to ${race.voteFor}` : 'pick 1'}</span></span>
        {race.candidates.length > 1 && (
          <button type="button" onClick={() => onCompare(race)} className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border-2 border-[var(--gb-text)] px-2.5 text-[13px] font-bold hover:bg-[var(--kyb-chip)]">
            <Scale className="w-3.5 h-3.5" aria-hidden="true" /> Compare
          </button>
        )}
      </div>
      <button type="button" onClick={() => onOpenRace(race)} className="mt-auto inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-[3px] bg-[var(--gb-text)] font-black text-[var(--gb-bg)] hover:opacity-90" style={{ borderColor: section.color }}>
        See the full race <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export function Headliners({ races, sections, overline, heading, intro, onOpen, onOpenRace, onCompare, children }: Props) {
  if (!races.length) return null;
  return (
    <section aria-labelledby="kyb-headliners" className="space-y-4">
      <div className="space-y-1">
        <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--gb-primary)]">{overline}</p>
        <h2 id="kyb-headliners" className="text-3xl sm:text-4xl leading-[1.05]">{heading}</h2>
        <p className="text-[15px]">{intro}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {races.map((r) => <Card key={r.id} race={r} section={sections.find((s) => s.id === r.section) ?? sections[0]} onOpen={onOpen} onOpenRace={onOpenRace} onCompare={onCompare} />)}
        {children}
      </ul>
    </section>
  );
}
