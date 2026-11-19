import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Heart, X } from 'lucide-react';
import { LINES } from './heartLines';
import { compact as count } from './lib/format';

// The two floating bits on every page: how many people have used the guide
// (every state together, and how many are here now), which can be closed, and
// a heart anyone can tap as often as they like: each tap sends up a burst of
// hearts and a line picked at random (src/heartLines.ts), encouraging or a
// joke, which floats up and fades once there's been time to read it. Nothing about the
// heart is counted or sent anywhere. The numbers come from /api/pulse
// (api/_pulse.ts); anonymous by design: a tab makes up a random id and forgets
// it. Fail-soft: until the numbers load, or if the site has no store behind
// it, the message isn't drawn; the heart always is.

const EVERY_MS = 25_000;
const CLOSED_KEY = 'kyb-pulse-closed';
const HEARTS_PER_TAP = 9;

interface Pulse { here: number; total: number }
type Burst = { id: number; hearts: { dx: number; dl: number; du: number; size: number; rise: number }[] };
// On screen the counts are short (1.00k, via count); the labels read to screen readers keep the whole number (fmt).
const fmt = (n: number) => n.toLocaleString('en-US');
const closedBefore = (): boolean => { try { return sessionStorage.getItem(CLOSED_KEY) === '1'; } catch { return false; } };
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
/** Long enough to read the line at an easy pace: 4 to 9 seconds. */
const readMs = (text: string) => Math.min(9_000, Math.max(4_000, 2_200 + text.length * 60));

export function Pulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [closed, setClosed] = useState(closedBefore);
  const [line, setLine] = useState<{ id: number; text: string; ms: number } | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const taps = useRef(0);
  const sayTimer = useRef(0);
  const off = useRef(false);

  useEffect(() => {
    if (closed) return; // closed for this visit: no need for the numbers
    const id = crypto.randomUUID();
    let timer = 0, gone = false;
    const tick = async () => {
      if (gone || off.current || document.hidden) return;
      try {
        const r = await fetch(`/api/pulse?id=${id}`, { cache: 'no-store', signal: AbortSignal.timeout(8_000) });
        if (r.status === 503 || r.status === 404) { off.current = true; return; }
        if (!r.ok) return;
        const p = (await r.json()) as Pulse;
        if (!gone) setPulse({ here: Number(p.here) || 0, total: Number(p.total) || 0 });
      } catch { /* offline or slow: keep the last numbers */ }
    };
    const start = () => { window.clearInterval(timer); void tick(); timer = window.setInterval(tick, EVERY_MS); };
    const visibility = () => { if (document.hidden) window.clearInterval(timer); else start(); };
    start();
    document.addEventListener('visibilitychange', visibility);
    return () => { gone = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [closed]);

  useEffect(() => () => window.clearTimeout(sayTimer.current), []);

  const close = () => {
    setClosed(true);
    try { sessionStorage.setItem(CLOSED_KEY, '1'); } catch { /* private mode: closed for this page only */ }
  };

  const tap = () => {
    const n = ++taps.current;
    // A line at random, never the same one twice in a row.
    let text = LINES[Math.floor(Math.random() * LINES.length)];
    if (text === line?.text) text = LINES[(LINES.indexOf(text) + 1) % LINES.length];
    const ms = readMs(text);
    setLine({ id: n, text, ms });
    window.clearTimeout(sayTimer.current);
    sayTimer.current = window.setTimeout(() => setLine(null), ms);
    // They drift mostly left: the heart sits in the right-hand corner.
    const hearts = Array.from({ length: HEARTS_PER_TAP }, () => ({ dx: rand(-80, 18), dl: rand(0, 0.18), du: rand(0.9, 1.5), size: rand(12, 22), rise: rand(80, 150) }));
    setBursts((b) => [...b.slice(-3), { id: n, hearts }]);
    window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== n)), 1_800);
  };

  const box = 'border-2 border-[var(--gb-text)] bg-[var(--gb-surface)] text-[var(--gb-text)] shadow-lg';
  const used = pulse ? `${fmt(pulse.total)} ${pulse.total === 1 ? 'person has' : 'people have'} used the Govbot guide to vote more informed` : '';
  const red = 'fill-[var(--gb-red,#E5484D)] text-[var(--gb-red,#E5484D)]';
  return (
    <div className="fixed right-4 bottom-[5.25rem] z-[44] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 print:hidden">
      {pulse && !closed && (
        <div className={`kyb-heart-toast relative max-w-[19rem] rounded-2xl py-2 pl-3 pr-10 text-[13px] font-bold leading-snug sm:max-w-none ${box}`}>
          <p role="status" aria-label={`${used}. ${fmt(pulse.here)} here right now`} className="flex items-center gap-2">
            <span className="kyb-live-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--gb-primary)]" aria-hidden="true" />
            <span aria-hidden="true">
              <span className="font-black">{count(pulse.total)}</span> {pulse.total === 1 ? 'person has' : 'people have'} used the Govbot guide to vote more informed · {count(pulse.here)} here now
            </span>
          </p>
          <button type="button" onClick={close} aria-label="Close this message"
            className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--kyb-chip)]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {line && (
        <p key={line.id} role="status" aria-live="polite" style={{ '--read': `${line.ms}ms` } as CSSProperties}
          className={`kyb-line-float max-w-[17rem] rounded-xl px-3 py-2 text-sm font-bold leading-snug ${box}`}>
          <Heart className={`mr-1.5 inline h-4 w-4 align-[-2px] ${red}`} aria-hidden="true" />{line.text}
        </p>
      )}
      <div className="relative">
        <button type="button" onClick={tap} aria-label="Send a heart"
          className={`flex h-11 w-11 items-center justify-center rounded-full hover:bg-[var(--kyb-chip)] active:scale-95 ${box}`}>
          <Heart key={taps.current} className={`h-5 w-5 ${taps.current ? `kyb-heart-on ${red}` : ''}`} aria-hidden="true" />
        </button>
        {bursts.map((b) => (
          <span key={b.id} aria-hidden="true" className="pointer-events-none absolute inset-0">
            {b.hearts.map((h, i) => (
              <Heart key={i} className={`kyb-heart-float ${red}`}
                style={{ width: h.size, height: h.size, '--dx': `${h.dx}px`, '--dl': `${h.dl}s`, '--du': `${h.du}s`, '--rise': `-${h.rise}px` } as CSSProperties} />
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
