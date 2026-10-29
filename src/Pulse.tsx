import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Heart } from 'lucide-react';

// The two floating bits on every page: how many people are using the guide
// right now (all four states together), and a heart anyone can tap, which
// everyone else sees as "Someone just hearted this page". The numbers come from
// /api/pulse and /api/heart (api/_pulse.ts). Anonymous by design: a tab makes up
// a random id and forgets it, nothing is stored on the device but "I hearted".
// Fail-soft: until the numbers load, or if the site has no store behind it, the
// floaters aren't drawn at all.

const EVERY_MS = 25_000;
const HEARTED_KEY = 'kyb-hearted';

/** The hearts that float up from a tap: how far each drifts sideways (px) and its start delay (s). */
const BURST: [number, number][] = [[-34, 0], [-14, 0.06], [4, 0.02], [22, 0.1], [40, 0.04]];

interface Pulse { here: number; total: number; hearts: number; heartAt: number }
const fmt = (n: number) => n.toLocaleString('en-US');
const read = (): boolean => { try { return localStorage.getItem(HEARTED_KEY) === '1'; } catch { return false; } };

/**
 * `compact`: on a state's pages only a heart shows; tapping it opens and closes the live count and the button that gives a heart.
 * Otherwise (the landing page) one heart does both at once: a tap hearts the page, with a burst of hearts, and opens or closes the live count.
 */
export function Pulse({ compact = false }: { compact?: boolean }) {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [mine, setMine] = useState(read);
  const [toast, setToast] = useState(false);
  // The landing page starts with the live count showing; a state's pages start with only the heart.
  const [open, setOpen] = useState(!compact);
  const [pop, setPop] = useState(0);
  const [burst, setBurst] = useState(0);
  const lastHeart = useRef<number | null>(null);   // when the newest heart seen so far happened
  const off = useRef(false);

  useEffect(() => {
    const id = crypto.randomUUID();
    let timer = 0, toastTimer = 0, gone = false;
    const tick = async () => {
      if (gone || off.current || document.hidden) return;
      try {
        const r = await fetch(`/api/pulse?id=${id}`, { cache: 'no-store', signal: AbortSignal.timeout(8_000) });
        if (r.status === 503 || r.status === 404) { off.current = true; return; }
        if (!r.ok) return;
        const p = (await r.json()) as Pulse;
        if (gone) return;
        // A heart from someone else since the last look: say so, once.
        if (lastHeart.current !== null && p.heartAt > lastHeart.current) {
          setToast(true); setPop((n) => n + 1);
          window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => setToast(false), 4_500);
        }
        lastHeart.current = Math.max(lastHeart.current ?? 0, p.heartAt);
        setPulse(p);
      } catch { /* offline or slow: keep the last numbers */ }
    };
    const start = () => { window.clearInterval(timer); void tick(); timer = window.setInterval(tick, EVERY_MS); };
    const visibility = () => { if (document.hidden) window.clearInterval(timer); else start(); };
    start();
    document.addEventListener('visibilitychange', visibility);
    return () => { gone = true; window.clearInterval(timer); window.clearTimeout(toastTimer); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const tap = async () => {
    if (mine || !pulse) return;
    setMine(true); setBurst((n) => n + 1); setPulse({ ...pulse, hearts: pulse.hearts + 1 });
    try { localStorage.setItem(HEARTED_KEY, '1'); } catch { /* private mode: the heart still counts */ }
    try {
      const r = await fetch('/api/heart', { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8_000) });
      if (r.ok) {
        const h = (await r.json()) as { hearts: number; heartAt: number };
        lastHeart.current = Math.max(lastHeart.current ?? 0, h.heartAt);   // our own heart isn't news to us
        setPulse((p) => (p ? { ...p, hearts: h.hearts } : p));
      }
    } catch { /* the heart stays filled; the count catches up on the next look */ }
  };

  if (!pulse) return null;
  const heartIcon = (on: boolean, size = 'h-5 w-5') => <Heart className={`${size} ${on ? 'kyb-heart-on fill-[var(--gb-red,#E5484D)] text-[var(--gb-red,#E5484D)]' : ''}`} aria-hidden="true" />;
  const used = `${fmt(pulse.total)} ${pulse.total === 1 ? 'person has' : 'people have'} used the Govbot guide to vote more informed`;
  const box = 'border-2 border-[var(--gb-text)] bg-[var(--gb-surface)] text-[var(--gb-text)] shadow-lg';
  const likeButton = (
    <button type="button" onClick={tap} aria-pressed={mine} disabled={mine}
      aria-label={mine ? `You hearted this page. ${fmt(pulse.hearts)} hearts` : `Heart this page. ${fmt(pulse.hearts)} hearts so far`}
      className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[13px] font-black hover:bg-[var(--kyb-chip)] disabled:cursor-default disabled:hover:bg-[var(--gb-surface)] ${box}`}>
      {heartIcon(mine)}{fmt(pulse.hearts)}{compact && <span className="font-bold">{mine ? 'Thanks!' : 'Give it a heart'}</span>}
    </button>
  );
  const counter = (
    <p id="kyb-pulse-msg" role="status" aria-label={`${used}. ${fmt(pulse.here)} here right now`} className={`${compact ? '' : 'kyb-heart-toast '}flex max-w-[19rem] items-center gap-2 rounded-2xl px-3 py-2 text-[13px] font-bold leading-snug sm:max-w-none ${box}`}>
      <span className="kyb-live-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--gb-primary)]" aria-hidden="true" />
      <span aria-hidden="true">
        <span className="font-black">{fmt(pulse.total)}</span> {pulse.total === 1 ? 'person has' : 'people have'} used the Govbot guide to vote more informed
        <span className="hidden md:inline"> · {fmt(pulse.here)} here now</span>
      </span>
    </p>
  );
  return (
    <div className="fixed right-4 bottom-[5.25rem] z-[44] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 print:hidden">
      {toast && (
        <p key={pop} role="status" aria-live="polite" className={`kyb-heart-toast rounded-xl px-3 py-2 text-sm font-bold ${box}`}>
          <Heart className="mr-1.5 inline h-4 w-4 fill-[var(--gb-red,#E5484D)] text-[var(--gb-red,#E5484D)]" aria-hidden="true" />Someone just hearted this page
        </p>
      )}
      {compact ? (
        <>
          {open && <div id="kyb-pulse-panel" className="flex flex-col items-end gap-2">{counter}{likeButton}</div>}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="kyb-pulse-panel"
            aria-label={`${open ? 'Hide' : 'Show'} the message and heart. ${used}`}
            className={`flex h-11 w-11 items-center justify-center rounded-full hover:bg-[var(--kyb-chip)] ${box}`}>
            {heartIcon(mine)}
          </button>
        </>
      ) : (
        <>
          {open && counter}
          <div className="relative">
            <button type="button" onClick={() => { void tap(); setOpen((o) => !o); }} aria-expanded={open} aria-controls="kyb-pulse-msg"
              aria-label={`${mine ? 'You hearted this page' : 'Heart this page'}. ${open ? 'Hide' : 'Show'} the message. ${fmt(pulse.hearts)} hearts`}
              className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[13px] font-black hover:bg-[var(--kyb-chip)] ${box}`}>
              {heartIcon(mine)}{fmt(pulse.hearts)}
            </button>
            {burst > 0 && (
              <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0">
                {BURST.map(([dx, dl]) => <Heart key={dx} className="kyb-heart-float h-4 w-4 fill-[var(--gb-red,#E5484D)] text-[var(--gb-red,#E5484D)]" style={{ '--dx': `${dx}px`, '--dl': `${dl}s` } as CSSProperties} />)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
