import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Face } from './Face';
import { useStateConfig } from './state';
import type { Candidate, Race } from './types';

// The races everyone in the state votes on, as cards on the landing page.
// The front says what the job does and what's at stake (an open seat, or
// the incumbent running, in the source's words) and shows the candidates'
// faces one at a time; a card flips over to show everyone running, a face
// opens that candidate's details, and the back links into the race on the
// ballot.

/** Motion is off for readers who asked their system for less of it. */
const STILL = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/** What's at stake, from the seat's current holder(s): an open seat in the source's words, or the incumbent running. */
function stakes(race: Race): string {
  const inc = race.incumbents ?? [];
  const leaving = inc.filter((i) => i.ballot == null && i.note);
  if (leaving.length) return `Open seat. ${leaving[0].note}`;
  const running = inc.filter((i) => i.ballot != null);
  if (running.length) return `${running.map((i) => i.name).join(' and ')} ${running.length > 1 ? 'are running to keep their seats.' : 'is running to keep the seat.'}`;
  return '';
}

/**
 * The candidates' faces, one at a time (every 2.8 s, paused while the card
 * is hovered or the tab is hidden), with the name and party of the one
 * showing. With reduced motion, every face in a row instead.
 */
function Faces({ race, paused }: { race: Race; paused: boolean }) {
  const cs = race.candidates;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (STILL || paused || cs.length < 2) return;
    const t = setInterval(() => { if (!document.hidden) setI((x) => (x + 1) % cs.length); }, 2800);
    return () => clearInterval(t);
  }, [paused, cs.length]);
  if (STILL || cs.length === 1) {
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex">{cs.slice(0, 5).map((c, k) => <Face key={c.ballot} c={c} className={`w-10 h-10 text-sm ring-2 ring-[var(--gb-surface)] ${k ? '-ml-2' : ''}`} />)}</span>
        <span className="text-sm leading-snug">{cs.slice(0, 4).map((c) => lead(c.name)).join(' · ')}{cs.length > 4 ? ` + ${cs.length - 4} more` : ''}</span>
      </span>
    );
  }
  const c = cs[i];
  return (
    <span className="flex items-center gap-3" aria-live="off">
      <span key={c.ballot} className="kyb-cslide flex items-center gap-3 min-w-0">
        <Face c={c} className="w-14 h-14 text-lg" />
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-tight">{lead(c.name)}</span>
          <span className="block text-xs">{c.nominatedBy ?? c.party}</span>
        </span>
      </span>
      <span className="ml-auto flex shrink-0 gap-1" aria-hidden="true">
        {cs.map((x, k) => <span key={x.ballot} className="h-1.5 w-1.5 rounded-full" style={{ background: k === i ? 'var(--gb-text)' : 'var(--gb-border)' }} />)}
      </span>
      <span className="sr-only">{cs.map((x) => lead(x.name)).join(', ')}</span>
    </span>
  );
}

function Card({ race, section, onOpen, onOpenRace }: { key?: string; race: Race; section: Section; onOpen: Props['onOpen']; onOpenRace: Props['onOpenRace'] }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const { explainOffice } = useStateConfig();
  const why = stakes(race);
  return (
    <li className="kyb-flip" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div className={`kyb-flip-inner ${open ? 'kyb-flipped' : ''}`}>
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open} inert={open}
          className={`kyb-face ${open ? 'kyb-off' : ''} min-h-[176px] text-left rounded-2xl border-[3px] bg-[var(--gb-surface)] p-4 flex flex-col gap-2.5 hover:bg-[var(--kyb-chip)]`} style={{ borderColor: section.color }}>
          <span className="inline-flex self-start items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: section.color, color: section.ink }}>{section.emoji} {section.title}</span>
          <span className="block text-lg font-black leading-tight">{title(race)}</span>
          <span className="block text-sm leading-snug">{explainOffice(race.office)}</span>
          {why && <span className="block text-sm leading-snug line-clamp-3"><span className="font-bold">Why it matters: </span>{why}</span>}
          <Faces race={race} paused={hover || open} />
          <span className="mt-auto flex items-center justify-between gap-2 text-xs font-bold">
            <span>{race.candidates.length} candidate{race.candidates.length === 1 ? '' : 's'}{race.voteFor > 1 ? ` · pick up to ${race.voteFor}` : ''}</span>
            <span className="inline-flex items-center gap-1" style={{ color: section.color }}>Meet them <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /></span>
          </span>
        </button>
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
