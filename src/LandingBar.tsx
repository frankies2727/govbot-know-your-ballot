import { ListChecks, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { usePinnedBar, type SectionCard } from './Bits';

// The landing page is long: the address form, the statewide races, a card for
// every kind of district, the questions, the sources, what's beyond the
// ballot. This pins a bar to the top the way the ballot view does (the glass
// bar, the contents button) with the page's search beside it, so the table of
// contents and the search are always one tap away. The contents are a drawer of
// the page's sections, the district cards listed under "Everything else"; the
// section you're in is marked, and named in the bar on wide screens.

export interface LandingItem {
  /** The id of the element on the page the item scrolls to. */
  id: string;
  emoji: string;
  label: string;
  /** Sections under it, shown as a short list (the cards under "Everything else"). */
  sub?: { id: string; emoji: string; label: string; color: string; n?: number }[];
}

/** The landing's parts in page order; `more` are the district cards, `questions` the ballot-questions card some states show among the statewide races. */
export function landingItems(more: SectionCard[], questions?: SectionCard): LandingItem[] {
  const card = (c: SectionCard) => ({ id: `kyb-card-${c.id}`, emoji: c.emoji, label: c.title, color: c.color, n: c.n });
  return [
    { id: 'kyb-find', emoji: '📍', label: 'Find my ballot' },
    { id: 'kyb-statewide', emoji: '🗳️', label: 'The statewide races', sub: questions ? [card(questions)] : undefined },
    { id: 'kyb-else', emoji: '🧭', label: 'Everything else on your ballot', sub: more.map(card) },
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

/** The pinned bar: the contents button, where you are (wide screens) and the search (`children`). */
export function LandingBar({ items, children }: { items: LandingItem[]; children: ReactNode }) {
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
          <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Contents" aria-haspopup="dialog" aria-expanded={open}
            className="shrink-0 w-11 h-11 rounded-xl border-2 border-[var(--gb-text)] flex items-center justify-center text-[var(--gb-text)] hover:bg-[var(--kyb-chip)]">
            <ListChecks className="w-5 h-5" aria-hidden="true" />
          </button>
          {here && <p aria-hidden="true" className="hidden lg:block shrink-0 max-w-[16rem] truncate font-black">{here.emoji} {here.label}</p>}
          <div className="min-w-0 flex-1 lg:ml-auto lg:max-w-2xl">{children}</div>
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
