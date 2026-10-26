import { useEffect, useRef, useState } from 'react';
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

interface Pulse { here: number; today: number; hearts: number; heartAt: number }
const fmt = (n: number) => n.toLocaleString('en-US');
const read = (): boolean => { try { return localStorage.getItem(HEARTED_KEY) === '1'; } catch { return false; } };

export function Pulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [mine, setMine] = useState(read);
  const [toast, setToast] = useState(false);
  const [pop, setPop] = useState(0);
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

  const tap = async () => {
    if (mine || !pulse) return;
    setMine(true); setPulse({ ...pulse, hearts: pulse.hearts + 1 });
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
  return (
    <>
      {toast && (
        <p key={pop} role="status" aria-live="polite" className="kyb-heart-toast fixed right-4 bottom-[9.25rem] z-[44] max-w-[calc(100vw-2rem)] rounded-xl border-2 border-[var(--gb-text)] bg-[var(--gb-surface)] px-3 py-2 text-sm font-bold text-[var(--gb-text)] shadow-lg print:hidden">
          <Heart className="mr-1.5 inline h-4 w-4 fill-[var(--gb-red,#E5484D)] text-[var(--gb-red,#E5484D)]" aria-hidden="true" />Someone just hearted this page
        </p>
      )}
      <div className="fixed right-4 bottom-[5.25rem] z-[44] flex max-w-[calc(100vw-2rem)] items-center gap-2 print:hidden">
        <p role="status" aria-label={`${fmt(pulse.here)} ${pulse.here === 1 ? 'person is' : 'people are'} using the guide right now, ${fmt(pulse.today)} today`}
          className="flex min-h-[44px] items-center gap-2 rounded-full border-2 border-[var(--gb-text)] bg-[var(--gb-surface)] px-3 text-[13px] font-bold text-[var(--gb-text)] shadow-lg">
          <span className="kyb-live-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--gb-primary)]" aria-hidden="true" />
          <span aria-hidden="true">
            <span className="font-black">{fmt(pulse.here)}</span> <span className="sm:hidden">using it now</span>
            <span className="hidden sm:inline">{pulse.here === 1 ? 'person is' : 'people are'} using the guide right now</span>
            <span className="hidden md:inline"> · {fmt(pulse.today)} today</span>
          </span>
        </p>
        <button type="button" onClick={tap} aria-pressed={mine} disabled={mine}
          aria-label={mine ? `You hearted this page. ${fmt(pulse.hearts)} hearts` : `Heart this page. ${fmt(pulse.hearts)} hearts so far`}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-[var(--gb-text)] bg-[var(--gb-surface)] px-3 text-[13px] font-black text-[var(--gb-text)] shadow-lg hover:bg-[var(--kyb-chip)] disabled:cursor-default disabled:hover:bg-[var(--gb-surface)]">
          <Heart className={`h-5 w-5 ${mine ? 'kyb-heart-on fill-[var(--gb-red,#E5484D)] text-[var(--gb-red,#E5484D)]' : ''}`} aria-hidden="true" />
          {fmt(pulse.hearts)}
        </button>
      </div>
    </>
  );
}
