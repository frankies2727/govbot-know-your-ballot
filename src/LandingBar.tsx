import { ArrowLeft, ChevronDown, ListChecks, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { usePinnedBar, useWide, type SectionCard } from './Bits';

// The landing page is long: the address form, the statewide races, a card for
// every kind of district, the questions, the sources, what's beyond the
// ballot. This pins a bar to the top the way the ballot view does (the glass
// bar, the contents button) with the page's search beside it, so the table of
// contents and the search are always one tap away. The contents button names
// the section you're in, so it is both "where am I" and the way to anywhere
// else: it opens a drawer of the page's sections, the district cards listed
// under "Everything else", with yours marked. On phones the search folds behind
// an icon (as in the ballot view) so the section's name gets the room.

export interface LandingItem {
  /** The id of the element on the page the item scrolls to. */
  id: string;
  emoji: string;
  label: string;
  /** A shorter name for the bar on phones, where the full one wouldn't fit. */
  short?: string;
  /** Sections under it, shown as a short list (the cards under "Everything else"). */
  sub?: { id: string; emoji: string; label: string; color: string; n?: number }[];
}

/** The landing's parts in page order; `more` are the district cards, `questions` the ballot-questions card some states show among the statewide races. */
export function landingItems(more: SectionCard[], questions?: SectionCard): LandingItem[] {
  const card = (c: SectionCard) => ({ id: `kyb-card-${c.id}`, emoji: c.emoji, label: c.title, color: c.color, n: c.n });
  return [
    { id: 'kyb-find', emoji: '📍', label: 'Find my ballot' },
    { id: 'kyb-statewide', emoji: '🗳️', label: 'The statewide races', sub: questions ? [card(questions)] : undefined },
    { id: 'kyb-else', emoji: '🧭', label: 'Everything else on your ballot', short: 'Everything else', sub: more.map(card) },
    { id: 'kyb-faq', emoji: '❓', label: 'Common questions' },
    { id: 'kyb-sources', emoji: '📂', label: 'Sources' },
    { id: 'kyb-beyond', emoji: '🏛️', label: 'Beyond your ballot' },
    { id: 'kyb-next', emoji: '📅', label: 'The next election' },
  ];
}

/** The id of the last part whose top has scrolled up to just under the bar. */
function useCurrent(ids: string[], bar: RefObject<HTMLElement | null>): string | null {
  const [current, setCurrent] = useState<string | null>(null);
  const key = ids.join();
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = (bar.current?.getBoundingClientRect().bottom ?? 80) + 24;
      let at: string | null = null;
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) at = id; }
      const next = at ?? ids.find((id) => document.getElementById(id)) ?? null;
      setCurrent((c) => (c === next ? c : next));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return current;
}

/** What the page's search needs from the bar: focus when it opens from the icon, and a way to close it. */
export interface SearchSlot { autoFocus: boolean; onClose?: () => void }

/** The pinned bar: the contents button (which names the section you're in) and the search (`search` draws it). */
export function LandingBar({ items, search }: { items: LandingItem[]; search: (slot: SearchSlot) => ReactNode }) {
  const wide = useWide();
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const pinned = usePinnedBar();
  const bar = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const setBar = useCallback((el: HTMLDivElement | null) => { bar.current = el; pinned(el); }, [pinned]);
  const current = useCurrent(items.map((i) => i.id), bar);
  const here = items.find((i) => i.id === current);

  const close = useCallback(() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }, []);
  const go = (id: string) => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
    // After the drawer has closed and given the page its scrolling back.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
                className={`min-h-[52px] min-w-0 rounded-xl border-2 border-[var(--gb-text)] px-3 flex items-center gap-2.5 text-left text-[var(--gb-text)] hover:bg-[var(--kyb-chip)] ${wide ? 'max-w-[22rem]' : 'flex-1'}`}>
                <ListChecks className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="sr-only">Contents: </span>
                <span className="min-w-0 flex-1 truncate font-black leading-tight">{here ? `${here.emoji} ${wide ? here.label : here.short ?? here.label}` : 'Contents'}</span>
                <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
              {wide ? (
                <div className="min-w-0 flex-1 ml-auto max-w-2xl">{search({ autoFocus: false })}</div>
              ) : (
                <button type="button" onClick={() => setSearching(true)} aria-label="Search races, candidates, judges or questions"
                  className="shrink-0 w-11 h-11 rounded-xl border-2 border-[var(--gb-text)] flex items-center justify-center text-[var(--gb-text)] hover:bg-[var(--kyb-chip)]">
                  <Search className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {open && <Drawer items={items} current={current} onGo={go} onClose={close} />}
    </>
  );
}

function Drawer({ items, current, onGo, onClose }: { items: LandingItem[]; current: string | null; onGo: (id: string) => void; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);
  // A part that this state's page doesn't carry (or that isn't showing) isn't listed.
  const here = items.filter((i) => document.getElementById(i.id));
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Contents">
      <button type="button" aria-label="Close contents" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-y-0 left-0 w-[86vw] max-w-sm overflow-y-auto border-r-2 border-[var(--gb-text)] bg-[var(--gb-surface)] text-[var(--gb-text)] shadow-2xl">
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
                          <button type="button" onClick={() => onGo(s.id)} className="w-full flex items-center gap-2.5 py-2 pl-6 pr-3 text-left hover:bg-[var(--kyb-chip)]">
                            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border border-[var(--gb-text)]" style={{ background: s.color }} />
                            <span className="flex-1 leading-snug"><span aria-hidden="true">{s.emoji} </span>{s.label}</span>
                            {s.n != null && <span className="text-sm font-black">{s.n}</span>}
                          </button>
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
    </div>
  );
}
