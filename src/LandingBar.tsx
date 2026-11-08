import { ArrowLeft, ChevronDown, ListChecks, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from './lib/modal';
import { officeGroups, officeId, usePinnedBar, useWide, type SectionCard } from './Bits';
import { raceTitle, statewideId } from './Headliners';
import type { Race } from './types';

// The landing page is long: the address form, the statewide races, a card for
// every kind of district, the questions, the sources, what's beyond the
// ballot. This pins a bar to the top the way the ballot view does (the glass
// bar, the contents button) with the page's search beside it, so the table of
// contents and the search are always one tap away. The contents button names
// the section you're in, so it is both "where am I" and the way to anywhere
// else: it opens a drawer of the page's sections down to the races: each
// statewide race by name, each district card and the offices in it ("State
// Senator · 38"), with where you are marked. The button names the race or card
// you're on, not just the section. On phones the search folds behind an icon
// (as in the ballot view) so that name gets the room.

export interface LandingItem {
  /** The id of the element on the page the item scrolls to. */
  id: string;
  emoji: string;
  label: string;
  /** A shorter name for the bar on phones, where the full one wouldn't fit. */
  short?: string;
  /** What's under it: the statewide races, or the district cards (each with its offices). */
  sub?: LandingSub[];
}
export interface LandingSub {
  id: string; emoji: string; label: string; color: string;
  /** A shorter name for the bar on phones (a one-office card: just the office). */
  short?: string;
  /** How many races (a card's count). */
  n?: number;
  /** A card's offices when it has more than one, each jumping to its list inside the card. */
  offices?: { id: string; label: string; n: number }[];
}

/**
 * The landing's parts in page order: `statewide` are the statewide races (in
 * `sections`' colours), `more` the district cards, `questions` the
 * ballot-questions card some states show after the statewide races.
 */
export function landingItems(more: SectionCard[], statewide: Race[], sections: readonly { id: string; emoji: string; color: string }[], questions?: SectionCard, everyone = 'The statewide races'): LandingItem[] {
  // A card of one office is named for it ("Federal: U.S. Representative"); a card of several lists them under it.
  const card = (c: SectionCard): LandingSub => {
    const { groups } = officeGroups(c);
    const one = groups.length === 1 && groups[0].label !== c.title ? groups[0].label : null;
    return {
      id: `kyb-card-${c.id}`, emoji: c.emoji, label: one ? `${c.title}: ${one}` : c.title, short: one ?? undefined, color: c.color, n: c.n,
      offices: groups.length > 1 ? groups.map((g, i) => ({ id: officeId(c, i), label: g.label, n: g.items.length })) : undefined,
    };
  };
  const race = (r: Race): LandingSub => {
    const s = sections.find((x) => x.id === r.section) ?? sections[0];
    return { id: statewideId(r), emoji: s.emoji, label: raceTitle(r), color: s.color };
  };
  return [
    { id: 'kyb-find', emoji: '📍', label: 'Find my ballot' },
    { id: 'kyb-statewide', emoji: '🗳️', label: everyone, sub: [...statewide.map(race), ...(questions ? [card(questions)] : [])] },
    { id: 'kyb-else', emoji: '🧭', label: 'District and precinct races', short: 'District races', sub: more.map(card) },
    { id: 'kyb-faq', emoji: '❓', label: 'Common questions' },
    { id: 'kyb-sources', emoji: '📂', label: 'Sources' },
    { id: 'kyb-beyond', emoji: '🏛️', label: 'Beyond your ballot' },
    { id: 'kyb-next', emoji: '📅', label: 'The next election' },
  ];
}

/**
 * The id of the part whose top has scrolled up to just under the bar, the
 * lowest such. Cards side by side start level: of those the first (the left
 * one) counts, unless it's `prefer`, the one the contents just jumped to.
 */
function useCurrent(ids: string[], bar: RefObject<HTMLElement | null>, prefer: RefObject<string | null>) {
  const [current, setCurrent] = useState<string | null>(null);
  // Asks again where you are (a jump to the card beside you doesn't scroll the page).
  const recheck = useRef(() => {});
  const key = ids.join();
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = (bar.current?.getBoundingClientRect().bottom ?? 80) + 24;
      let at: string | null = null;
      let best = -Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        // A part folded away (in a closed section) has no box: it isn't where you are.
        if (!el || !el.getClientRects().length) continue;
        const top = el.getBoundingClientRect().top;
        if (top > line) continue;
        if (top > best + 1 || (top >= best - 1 && id === prefer.current)) { at = id; best = top; }
      }
      const next = at ?? ids.find((id) => document.getElementById(id)) ?? null;
      setCurrent((c) => (c === next ? c : next));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    recheck.current = on;
    update();
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return [current, () => recheck.current()] as const;
}

/** What the page's search needs from the bar: focus when it opens from the icon, and a way to close it. */
export interface SearchSlot { autoFocus: boolean; onClose?: () => void }

/** The pinned bar: the contents button (which names the section you're in) and the search (`search` draws it). */
export function LandingBar({ items, search, searchLabel = 'Search races, candidates, judges or questions' }: { items: LandingItem[]; search: (slot: SearchSlot) => ReactNode; /** What the search icon says to a screen reader, on phones. */ searchLabel?: string }) {
  const wide = useWide();
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const pinned = usePinnedBar();
  const bar = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const setBar = useCallback((el: HTMLDivElement | null) => { bar.current = el; pinned(el); }, [pinned]);
  // Where you are, down to the race or card: each part, then what's under it, in page order.
  const spots = items.flatMap((i) => [{ ...i, top: i }, ...(i.sub ?? []).map((s) => ({ ...s, top: i }))]);
  const jumped = useRef<string | null>(null);
  const [current, recheck] = useCurrent(spots.map((i) => i.id), bar, jumped);
  const here = spots.find((i) => i.id === current);

  const close = useCallback(() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }, []);
  const go = (id: string) => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
    // After the drawer has closed and given the page its scrolling back.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      // Inside a folded section (the home page's elections): unfold it first.
      const fold = el.closest('details');
      if (fold && !fold.open) fold.open = true;
      // The bar names what you jumped to (an office: its card), even beside a card that starts level with it.
      jumped.current = el.closest('[id^="kyb-card-"], [id^="kyb-sw-"]')?.id ?? id;
      // An office sits in its card's list, which scrolls on its own on desktop:
      // scroll the list to the office, then bring the card under the bar.
      // (Below 1024px the list is part of the page, so the office itself is the target.)
      const list = el.parentElement?.closest<HTMLElement>('.kyb-scroll-bar');
      let target: Element = el;
      if (list && getComputedStyle(list).overflowY !== 'visible') {
        list.scrollTop += el.getBoundingClientRect().top - list.getBoundingClientRect().top;
        target = list.closest('[id^="kyb-card-"]') ?? list;
      }
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      recheck();
    }));
  };

  return (
    <>
      {/* kyb-wide: the Illinois landing narrows its other children; the bar spans the page. */}
      <div ref={setBar} className="kyb-wide sticky top-[calc(var(--kyb-top)+6px)] z-30 -mx-2 sm:-mx-3 px-4 sm:px-6 py-2 lg:py-3 kyb-glass">
        <div className="flex items-center gap-3">
          {!wide && searching ? (
            <>
              <div className="min-w-0 flex-1">{search({ autoFocus: true, onClose: () => setSearching(false) })}</div>
              <button type="button" onClick={() => setSearching(false)} aria-label="Close search"
                className="shrink-0 w-11 h-11 rounded-xl border-2 border-[var(--gb-text)] flex items-center justify-center text-[var(--gb-text)] hover:bg-[var(--kyb-chip)]">
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              {/* One button: the contents icon, the section you're in, and a chevron saying it opens. */}
              <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
                className={`min-h-[52px] min-w-0 rounded-xl border-2 border-[var(--gb-text)] px-3 flex items-center gap-2.5 text-left text-[var(--gb-text)] hover:bg-[var(--kyb-chip)] ${wide ? 'max-w-[26rem]' : 'flex-1'}`}>
                <ListChecks className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="sr-only">Contents: </span>
                <span className="min-w-0 flex-1 truncate font-black leading-tight">{here ? `${here.emoji} ${wide ? here.label : here.short ?? here.label}` : 'Contents'}</span>
                <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
              {wide ? (
                <div className="min-w-0 flex-1 ml-auto max-w-2xl">{search({ autoFocus: false })}</div>
              ) : (
                <button type="button" onClick={() => setSearching(true)} aria-label={searchLabel}
                  className="shrink-0 w-11 h-11 rounded-xl border-2 border-[var(--gb-text)] flex items-center justify-center text-[var(--gb-text)] hover:bg-[var(--kyb-chip)]">
                  <Search className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {open && <Drawer items={items} current={here?.top.id ?? null} at={current} onGo={go} onClose={close} />}
    </>
  );
}

/** `current` is the part you're in (it's ringed); `at` the race or card in it you're on (it's marked). */
function Drawer({ items, current, at, onGo, onClose }: { items: LandingItem[]; current: string | null; at: string | null; onGo: (id: string) => void; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const drawer = useRef<HTMLDivElement | null>(null);
  useModal(drawer, true, onClose, closeButton);
  // A part that this state's page doesn't carry (or that isn't showing) isn't listed.
  const here = items.filter((i) => document.getElementById(i.id));
  // On the page's body, so no layout around the bar (a column's max width, its spacing) can reach the overlay.
  return createPortal(
    <div ref={drawer} className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Contents">
      <button type="button" aria-label="Close contents" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-y-0 left-0 w-[86vw] max-w-sm overflow-y-auto overscroll-contain border-r-2 border-[var(--gb-text)] bg-[var(--gb-surface)] text-[var(--gb-text)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 border-b border-[var(--gb-border)] bg-[var(--gb-surface)]">
          <p className="font-black">☰ Contents</p>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Close contents" className="w-10 h-10 rounded-full border-2 border-[var(--gb-text)] flex items-center justify-center"><X className="w-5 h-5" aria-hidden="true" /></button>
        </div>
        <nav aria-label="On this page" className="text-[15px]">
          <ol className="space-y-3 p-4">
            {here.map((it) => {
              const on = it.id === current;
              return (
                <li key={it.id} className={`rounded-xl border-[3px] ${on ? 'kyb-pulse' : ''}`} style={{ borderColor: on ? 'var(--gb-primary)' : 'var(--gb-border-strong)', ['--pulse' as string]: 'var(--gb-primary)' }}>
                  <button type="button" onClick={() => onGo(it.id)} aria-current={on ? 'location' : undefined}
                    className="w-full flex items-center gap-2 px-3 py-3 text-left font-bold hover:bg-[var(--kyb-chip)] rounded-[9px]">
                    <span aria-hidden="true">{it.emoji}</span>
                    <span className="flex-1 leading-snug">{it.label}</span>
                  </button>
                  {it.sub && it.sub.length > 0 && (
                    <ul className="pb-2">
                      {it.sub.filter((s) => document.getElementById(s.id)).map((s) => (
                        <li key={s.id}>
                          <button type="button" onClick={() => onGo(s.id)} aria-current={s.id === at ? 'location' : undefined}
                            className={`w-full flex items-center gap-2.5 py-2 pl-6 pr-3 text-left hover:bg-[var(--kyb-chip)] ${s.id === at ? 'bg-[var(--kyb-chip)] font-black' : ''}`}>
                            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border border-[var(--gb-text)]" style={{ background: s.color }} />
                            <span className="flex-1 leading-snug"><span aria-hidden="true">{s.emoji} </span>{s.label}</span>
                            {s.n != null && <span className="text-sm font-black">{s.n}</span>}
                          </button>
                          {s.offices && (
                            <ul className="mb-1 ml-[2.1rem] border-l-2 pl-2" style={{ borderColor: s.color }}>
                              {s.offices.filter((o) => document.getElementById(o.id)).map((o) => (
                                <li key={o.id}>
                                  <button type="button" onClick={() => onGo(o.id)} className="w-full flex items-center gap-2 py-1.5 pr-3 pl-1 text-left text-[14px] hover:bg-[var(--kyb-chip)]">
                                    <span className="flex-1 leading-snug">{o.label}</span>
                                    <span className="text-[13px] font-bold">{o.n}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>,
    document.body,
  );
}
