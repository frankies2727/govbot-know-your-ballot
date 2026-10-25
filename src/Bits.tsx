import { ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Flag, Github, Info, ListChecks, Loader2, MapPin, Scale, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Face } from './Face';
import type { Candidate, Race } from './types';
import { navigate, useRoute } from './lib/router';
import { useOpen } from './store';
import { githubIssueUrl, sendReport, type ReportAbout } from './report';

// Small pieces every state's guide shows: the progress ring in the pinned
// bar, and the confetti when a ballot is finished.

/** A modal sheet: Escape or the backdrop closes it, focus returns to where it was. */
/** `wide` lets a side-by-side sheet (Compare) use most of the screen instead of a reading column. */
export function Dialog({ title, onClose, wide = false, children }: { title: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? 'sm:max-w-[min(96vw,1500px)]' : 'sm:max-w-2xl'} max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-2 border-[var(--gb-border)] bg-[var(--gb-surface-2)] p-6 outline-none`}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="text-2xl font-black leading-tight text-[var(--gb-text)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 w-11 h-11 rounded-full bg-[var(--kyb-chip)] flex items-center justify-center text-[var(--gb-text)] hover:bg-[var(--kyb-chip-hi)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * "Report a mistake": a form in a dialog that files the report as a GitHub
 * issue through the site's own /api/report (no account needed), pre-filled
 * with where the reader was; a link to GitHub's own form for those who
 * prefer it. Hidden in print.
 */
export function ReportLink({ what, name, id, inline = false, className = '' }: ReportAbout & { /** Inside a sentence: no 44px tap height. */ inline?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <span className={`inline-block print:hidden ${className}`}>
      <button type="button" onClick={() => setOpen(true)}
        className={`${inline ? '' : 'min-h-[44px]'} inline-flex items-center gap-1.5 text-sm font-bold text-[var(--gb-text)] underline underline-offset-2 hover:text-[var(--gb-link)]`}>
        <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />Report a mistake
      </button>
      {open && <ReportDialog what={what} name={name} id={id} onClose={close} />}
    </span>
  );
}

function ReportDialog({ what, name, id, onClose }: ReportAbout & { onClose: () => void }) {
  const [opened] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ number: number; url: string } | null>(null);
  const field = 'w-full rounded-xl border-2 border-[var(--gb-border)] bg-[var(--gb-surface)] px-3 py-2.5 text-[15px] text-[var(--gb-text)] focus:border-[var(--gb-blue-hi)] focus:outline-none';
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try {
      setDone(await sendReport({ what, name, id, shows: String(d.get('shows') ?? ''), correct: String(d.get('correct') ?? ''), source: String(d.get('source') ?? ''), website: String(d.get('website') ?? ''), opened }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The report couldn’t be sent.');
    } finally { setBusy(false); }
  };
  return (
    <Dialog title="Report a mistake" onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <p className="text-[17px] font-bold">Thank you. {done.number ? <>It’s filed as <a href={done.url} target="_blank" rel="noreferrer noopener" className="text-[var(--gb-link)] underline">report #{done.number} ↗</a>.</> : 'It’s been received.'}</p>
          <p className="text-[15px]">Mistakes about real people are fixed first. Every piece shown comes from a source named next to it; if the source itself is wrong, that field stops being read from it.</p>
          <button type="button" onClick={onClose} className="min-h-[48px] rounded-xl bg-[var(--gb-primary)] px-5 font-black text-[var(--gb-on-primary)]">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-[15px] leading-relaxed"><strong>{[what, name].filter(Boolean).join(' · ')}</strong>. Say what the page shows and what is right, with a link to where you saw it. No account needed; the report goes straight onto the project’s public to-do list.</p>
          <label className="block space-y-1">
            <span className="font-bold">What it shows</span>
            <textarea name="shows" required maxLength={2000} rows={2} className={field} placeholder="e.g. It says she’s the incumbent" />
          </label>
          <label className="block space-y-1">
            <span className="font-bold">What is correct</span>
            <textarea name="correct" required maxLength={3000} rows={3} className={field} placeholder="e.g. She lost the March primary; the incumbent is…" />
          </label>
          <label className="block space-y-1">
            <span className="font-bold">A link to a source</span>
            <input name="source" type="url" required maxLength={500} inputMode="url" className={field} placeholder="https://… (the election authority, the candidate’s own site, the court, Ballotpedia, Wikipedia)" />
            <span className="block text-xs">An official or primary page. That’s how every fact on the site is checked.</span>
          </label>
          {/* Honeypot: hidden from people, filled in by bots; the server drops any report that carries it. */}
          <label className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
          {error && <p role="alert" className="rounded-xl bg-[var(--gb-red)] px-4 py-3 font-bold text-white">{error} You can also <a href={githubIssueUrl({ what, name, id })} target="_blank" rel="noreferrer noopener" className="underline">report it on GitHub ↗</a>.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 min-h-[48px] rounded-xl bg-[var(--gb-primary)] px-5 font-black text-[var(--gb-on-primary)] disabled:cursor-wait">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Flag className="w-4 h-4" aria-hidden="true" />}{busy ? 'Sending…' : 'Send report'}
            </button>
            <a href={githubIssueUrl({ what, name, id })} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 min-h-[48px] text-sm font-bold underline underline-offset-2">
              <Github className="w-4 h-4" aria-hidden="true" />Or report on GitHub ↗
            </a>
          </div>
        </form>
      )}
    </Dialog>
  );
}

/**
 * The saved picks on this device, with the two things a returning voter
 * wants: back to the ballot, or a clean slate (two taps, so one slip of the
 * thumb can't wipe someone's picks).
 */
export function SavedPicks({ place, saved, onContinue, onStartFresh }: { /** The saved address's label, when there is one. */ place?: string; saved: number; onContinue: () => void; onStartFresh: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!place && saved === 0) return null;
  const picks = `${saved} pick${saved === 1 ? '' : 's'}`;
  return (
    <div className="rounded-2xl border-[3px] border-[var(--gb-primary)] bg-[var(--gb-surface)] p-4 space-y-3">
      {place && <p className="font-bold">📍 {place}</p>}
      {saved > 0 && (
        <p className="text-[15px] leading-relaxed">
          <strong>{picks} saved</strong> on this device.{place ? ' Pick up where you left off, or start fresh to clear them (if someone else is using this phone, say).' : ' Enter your address to see them on your ballot, or start fresh to clear them.'}
          {place ? ' Moved? Enter the new address above: picks for races on both ballots carry over.' : ''}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {place && (
          <button type="button" onClick={onContinue} className="min-h-[44px] rounded-xl bg-[var(--gb-primary)] px-4 font-black text-[var(--gb-on-primary)]">Back to my ballot →</button>
        )}
        {saved > 0 && (
          <button type="button" onClick={() => { if (confirming) { onStartFresh(); setConfirming(false); } else setConfirming(true); }} onBlur={() => setConfirming(false)}
            className={`min-h-[44px] rounded-xl border-2 px-4 font-bold ${confirming ? 'border-[var(--gb-red)] bg-[var(--gb-red)] text-white' : 'border-[var(--gb-text)] text-[var(--gb-text)] hover:bg-[var(--kyb-chip)]'}`}>
            {confirming ? `Tap again to clear ${picks} and your plan` : 'Start fresh'}
          </button>
        )}
      </div>
    </div>
  );
}

export function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(pct * 100)}% of your ballot decided`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--kyb-chip-hi)' }} strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--gb-primary)' }} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-500" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" style={{ fill: 'var(--gb-text)' }} fontSize={size * 0.26} fontWeight="900">{Math.round(pct * 100)}%</text>
    </svg>
  );
}

/**
 * The pinned bar's height as --kyb-bar (the contents column, jumped-to races
 * and the race boxes sit below it), and `kyb-ballot` on the page while the bar
 * is up: on phones govbot's header then scrolls away and the bar is the whole
 * sticky top (ballot.css).
 */
export function usePinnedBar() {
  const observer = useRef<ResizeObserver | null>(null);
  return useCallback((bar: HTMLDivElement | null) => {
    observer.current?.disconnect();
    const root = document.documentElement;
    root.classList.toggle('kyb-ballot', !!bar);
    if (!bar) { root.style.removeProperty('--kyb-bar'); return; }
    // Setting a variable on the page root makes the browser recheck every
    // element's style, so only when the height really changed (resizing the
    // window or zooming changes the width far more often).
    let last = '';
    observer.current = new ResizeObserver(([entry]) => {
      const h = `${Math.round(entry.borderBoxSize?.[0]?.blockSize ?? bar.offsetHeight)}px`;
      if (h !== last) root.style.setProperty('--kyb-bar', (last = h));
    });
    observer.current.observe(bar);
  }, []);
}

interface ProgressProps { done: number; total: number; allDone: boolean; place?: string; region: string; onChangeAddress: () => void }

/** The count line and the address under it: "258 contests to browse · Browsing every race in … · Add address". */
export function ProgressLine({ done, total, allDone, place, region, onChangeAddress }: ProgressProps) {
  return (
    <div className="min-w-0 flex-1">
      <p className="font-black text-lg leading-tight">{!place ? `${total} contests to browse` : allDone ? 'Ballot ready 🎉' : `${done} of ${total} decided`}</p>
      <button type="button" onClick={onChangeAddress} className="flex max-w-full flex-wrap items-center gap-x-1.5 text-left text-sm leading-snug text-[var(--gb-text)]">
        <span>{place ? `📍 ${place}` : `Browsing every race in ${region}`}</span>
        <span className="shrink-0 font-bold text-[var(--gb-text)] underline underline-offset-2">{place ? 'Change' : 'Add address'}</span>
      </button>
    </div>
  );
}

/**
 * The head of the pinned bar. Wide screens: the ring and the count line. Phones,
 * where every pinned pixel is one the ballot loses: one short row of the
 * contents button, the ring and its fraction, nothing else; the
 * count line goes under the bar (ProgressLine) and scrolls with the page.
 */
export function ProgressHead({ wide, onContents, ...p }: ProgressProps & { wide: boolean; onContents: () => void }) {
  const pct = p.total ? p.done / p.total : 0;
  if (wide) return <div className="flex items-center gap-4"><Ring pct={pct} /><ProgressLine {...p} /></div>;
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onContents} aria-label="Contents"
        className="shrink-0 w-11 h-11 rounded-xl border-2 border-[var(--gb-text)] flex items-center justify-center text-[var(--gb-text)] hover:bg-[var(--kyb-chip)]">
        <ListChecks className="w-5 h-5" aria-hidden="true" />
      </button>
      <Ring pct={pct} size={52} />
      <p className="font-black text-xl leading-none tabular-nums" aria-label={`${p.done} of ${p.total} decided`}>{p.done}<span className="text-base font-bold"> / {p.total}</span></p>
    </div>
  );
}

export function Confetti({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const colors = ['#5EBD3E', '#FFB900', '#F78200', '#E23838', '#973999', '#009CDF'];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden motion-reduce:hidden">
      <style>{'@keyframes kyb-fall{to{transform:translateY(110vh) rotate(720deg)}}'}</style>
      {Array.from({ length: 80 }, (_, i) => (
        <span key={i} className="absolute top-[-20px] w-2.5 h-4 rounded-sm" style={{
          left: `${(i * 37) % 100}%`, background: colors[i % 6],
          animation: `kyb-fall ${2 + (i % 5) * 0.3}s ${(i % 10) * 0.08}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

/** Pinned under the progress bar while there's no address: picks are off until there is one. */
export function BrowsingNotice({ region, onAddAddress, counties }: { region: string; onAddAddress: () => void; /** Browse one county's races without an address; `all` labels the whole-state choice (value ''). */ counties?: { list: string[]; value: string; onChange: (county: string) => void; all?: string } }) {
  // The native dropdown draws its own list, so each option gets explicit colours: in dark mode the
  // page's light text was landing on the system's white list.
  const option = { color: '#111', background: '#fff' };
  return (
    <div role="status" data-browsing-notice className="mt-3 flex flex-col items-start lg:flex-row lg:flex-wrap lg:items-center gap-x-3 gap-y-2 rounded-xl border-2 border-[var(--gb-amber-hi)] bg-[var(--kyb-chip)] px-3 py-2 text-sm lg:text-[15px] leading-snug">
      <p className="min-w-0 flex-1">You’re seeing <strong>every</strong> race on any ballot in {region}. Picks are off until it’s <em>your</em> ballot.</p>
      <div className="flex flex-wrap items-center gap-2">
        {counties && (
          <label className="inline-flex items-center gap-1.5 min-h-[40px] rounded-lg border-2 border-[var(--gb-text)] bg-[var(--gb-surface)] pl-2.5 pr-1 font-bold text-[var(--gb-text)]">
            <span className="sr-only">County to browse</span>
            <span aria-hidden="true">Browse:</span>
            <select value={counties.value} onChange={(e) => counties.onChange(e.target.value)} className="min-h-[36px] max-w-[11rem] bg-transparent font-bold text-[var(--gb-text)] outline-none">
              {counties.all && <option value="" style={option}>{counties.all}</option>}
              {counties.list.map((c) => <option key={c} value={c} style={option}>{c} County</option>)}
            </select>
          </label>
        )}
        <button type="button" onClick={onAddAddress} className="inline-flex items-center gap-1.5 min-h-[40px] rounded-lg bg-[var(--gb-text)] px-3 font-bold text-[var(--gb-bg)]">
          <MapPin className="w-4 h-4" aria-hidden="true" /> Enter your address
        </button>
      </div>
    </div>
  );
}

/** Phones: the same warning as a small yield-sign badge that stays on screen
 *  while the page scrolls (the full notice scrolls away with the tools).
 *  Tapping it opens the full sentence and the address button. */
export function BrowsingBadge({ region, onAddAddress }: { region: string; onAddAddress: () => void }) {
  const [open, setOpen] = useState(false);
  // Hidden while the full notice is on screen; it takes over once that scrolls away.
  const [noticeShown, setNoticeShown] = useState(true);
  useEffect(() => {
    const notice = document.querySelector('[data-browsing-notice]');
    if (!notice || typeof IntersectionObserver === 'undefined') { setNoticeShown(false); return; }
    const io = new IntersectionObserver(([e]) => setNoticeShown(e.isIntersecting));
    io.observe(notice);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);
  if (noticeShown && !open) return null;
  return (
    <div className="fixed bottom-5 left-4 z-[45] print:hidden">
      {open ? (
        <div role="status" className="relative max-w-[calc(100vw-2rem)] w-80 rounded-xl border-2 border-[var(--gb-amber-hi)] bg-[var(--gb-surface)] p-3 pr-11 text-sm leading-snug text-[var(--gb-text)] shadow-2xl">
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-[var(--gb-text)] flex items-center justify-center"><X className="w-4 h-4" aria-hidden="true" /></button>
          <p>Candidate picks are off: you’re seeing <strong>every</strong> race on any ballot in {region}, not just yours. Enter your address to pick.</p>
          <button type="button" onClick={() => { setOpen(false); onAddAddress(); }} className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] rounded-lg bg-[var(--gb-text)] px-3 font-bold text-[var(--gb-bg)]">
            <MapPin className="w-4 h-4" aria-hidden="true" /> Enter your address
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label={`Candidate picks are off: you’re seeing every race in ${region}, not just yours. Enter your address to pick`}
          className="inline-flex items-center gap-1.5 min-h-[40px] rounded-full border-2 border-[var(--gb-amber-hi)] bg-[var(--gb-surface)] pl-2.5 pr-3 text-[13px] font-bold text-[var(--gb-text)] shadow-lg">
          <TriangleAlert className="w-5 h-5 text-[var(--gb-amber-hi)]" aria-hidden="true" /> Candidate picks off
        </button>
      )}
    </div>
  );
}

/** True on wide screens (Tailwind's lg, 1024px), where the ballot view has room for a sticky toolbar. */
export function useWide() {
  const [wide, setWide] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = matchMedia('(min-width: 1024px)');
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

/** While the browser finds the voter and their districts are looked up: a spinning ring over the page. */
export function Locating({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-black/55 backdrop-blur-[2px]">
      <div className="kyb-rainbow w-20 h-20 rounded-full animate-spin" aria-hidden="true" />
      <p className="rounded-full bg-[var(--gb-surface)] px-4 py-2 font-black text-[var(--gb-text)]">Finding where you are…</p>
    </div>
  );
}

/** The browser tab's title and icon while a guide is open; the lab's own come back on exit. */
export function useDocumentMeta(title: string) {
  useEffect(() => {
    const was = document.title;
    document.title = title;
    return () => { document.title = was; };
  }, [title]);
}

/**
 * Which page of the guide is open: the landing (`projects/<id>`) or the ballot
 * (`projects/<id>/ballot`), which has its own URL so it can be linked and the
 * Back button returns to the landing. The landing never forwards a returning voter to
 * their ballot on its own (a link to the guide should land on the guide); it
 * offers them a "Back to my ballot" card instead.
 */
export function useBallotView(projectId: string): [boolean, (on: boolean) => void] {
  const route = useRoute();
  const path = `projects/${projectId}/ballot`;
  const show = useCallback((on: boolean) => navigate(on ? path : `projects/${projectId}`), [path, projectId]);
  return [route === path, show];
}

export interface SectionItem {
  id: string; title: string; /** Its district, court or scope. */ sub: string; race?: Race;
  /** What the office does, and what's at stake (an open seat, the incumbent running). */
  about?: string; why?: string;
  /** A ballot question: its official wording, and what yes or no does. */
  question?: string; plain?: string;
}
export interface SectionCard { id: string; title: string; emoji: string; color: string; ink: string; n: number; hint: string; items: SectionItem[] }

/** A race's office without its district: "State Senator, 27th District" → "State Senator". */
const officeOf = (title: string) => title.replace(/,.*$/, '').replace(/\s*\(.*$/, '').trim();
/** A district as a number: "Congressional District 1" → "#1", "School Subdistrict 1A" → "#1A"; anything without a number stays as is. */
const districtNo = (sub: string) => { const m = sub.match(/(\d+[A-Za-z]?)\s*$/); return m ? `#${m[1]}` : sub; };

/**
 * One section as an open panel: its people as a face row, then its contests
 * grouped by office, each office's explainer once in a header that stays put
 * while the list scrolls, and each district folded to a line (tap the arrow
 * for why it matters and who's running; a face opens the candidate). Questions
 * show their wording. The list scrolls inside the card so a 148-race section
 * stays one card tall.
 */
export function SectionPanel({ card, onOpen, onOpenRace, onCompare, onJump }: { key?: string; card: SectionCard; onOpen: (race: Race, c: Candidate) => void; onOpenRace: (race: Race) => void; onCompare: (race: Race) => void; onJump: (sectionId: string, id: string) => void }) {
  const list = useRef<HTMLUListElement>(null);
  const faces: StripPerson[] = card.items.flatMap((it) => (it.race?.candidates ?? []).map((c) => ({ ...c, note: districtNo(it.sub), key: it.id })));
  // A pick in the row opens that candidate's district below and scrolls to it.
  const jump = (p: StripPerson) => {
    const el = list.current?.querySelector<HTMLDetailsElement>(`details[data-race="${CSS.escape(p.key ?? '')}"]`);
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ block: 'start', behavior: STILL ? 'auto' : 'smooth' });
    el.classList.remove('kyb-flash'); void el.offsetWidth; el.classList.add('kyb-flash');
  };
  // Races sharing an explainer share a group, in the order they first appear.
  const groups: { key: string; label: string; about: string; items: SectionItem[] }[] = [];
  const rest: SectionItem[] = [];
  // The seat-count sentence ("3 seats in your district…") is each district's own; the header carries the office's explainer without it.
  const shared = (about: string) => about.replace(/ (?:One seat|\d+ seats) in your district [^.]*\./, '');
  for (const it of card.items) {
    if (!it.race) { rest.push(it); continue; }
    const about = shared(it.about ?? '');
    const key = about || officeOf(it.title);
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(it); else groups.push({ key, label: officeOf(it.title), about, items: [it] });
  }
  const candidates = (it: SectionItem) => (
    <ul className="space-y-1">
      {it.race!.candidates.map((c) => (
        <li key={c.ballot}>
          <button type="button" onClick={() => onOpen(it.race!, c)} aria-label={`${c.name}: more about them`} className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--kyb-chip)]">
            <Face c={c} className="w-9 h-9 text-xs" />
            <span className="min-w-0 flex-1 text-sm font-bold leading-tight">{c.name}</span>
            <span className="shrink-0 rounded-full bg-[var(--kyb-chip)] px-2 py-0.5 text-[11px] font-bold">{c.nominatedBy ?? c.party}</span>
            <Info className="w-5 h-5 shrink-0 text-[var(--gb-link)]" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <li className="rounded-2xl border-[3px] bg-[var(--gb-surface)] p-4 flex flex-col gap-3" style={{ borderColor: card.color }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-black leading-tight">{card.title}</span>
          <span className="block text-sm">{card.hint}{groups.length ? ' · tap a face or a district to see who’s running' : ''}</span>
        </span>
        <span className="shrink-0 rounded-full border-2 px-2.5 py-1 text-sm font-black text-[var(--gb-text)]" style={{ borderColor: card.color, background: `color-mix(in srgb, ${card.color} 14%, transparent)` }}>{card.n}</span>
      </div>
      {faces.length > 0 && <FaceStrip people={faces} names max={400} size="w-9 h-9 text-xs" color={card.color} onPick={jump} />}
      <ul ref={list} className="kyb-scroll-bar max-h-[480px] overflow-y-auto rounded-xl border border-[var(--gb-border)]" style={{ ['--scroll' as string]: card.color }}>
        {groups.map((g) => (
          <li key={g.key}>
            <div className="sticky top-0 z-10 border-b border-[var(--gb-border)] bg-[var(--gb-surface)] px-3 py-2">
              <p className="text-[15px] font-black leading-snug">{g.label} <span className="font-bold">· {g.items.length}</span></p>
              {g.about && <p className="text-[13px] leading-snug">{g.about}</p>}
            </div>
            <ul className="divide-y divide-[var(--kyb-chip)]">
              {g.items.map((it) => (
                <li key={it.id}>
                  <details className="group scroll-mt-[72px]" data-race={it.id}>
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 hover:bg-[var(--kyb-chip)]">
                      <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold leading-snug">{it.title}</span>
                        <span className="block text-xs">{it.sub} · {it.race!.candidates.length} candidate{it.race!.candidates.length === 1 ? '' : 's'} · {it.race!.voteFor > 1 ? `pick up to ${it.race!.voteFor}` : 'pick 1'}</span>
                      </span>
                    </summary>
                    <div className="px-3 pb-3 space-y-2">
                      {it.why && <p className="text-[13px] leading-snug"><span className="font-bold">Why it matters: </span>{it.why}</p>}
                      {candidates(it)}
                      <div className="flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => onOpenRace(it.race!)} className="text-sm font-bold underline underline-offset-2">Open this race on the ballot →</button>
                        {it.race!.candidates.length > 1 && (
                          <button type="button" onClick={() => onCompare(it.race!)} className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border-2 border-[var(--gb-text)] px-2.5 text-[13px] font-bold hover:bg-[var(--kyb-chip)]">
                            <Scale className="w-3.5 h-3.5" aria-hidden="true" /> Compare
                          </button>
                        )}
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {rest.map((it) => it.question ? (
          <li key={it.id} className="border-t border-[var(--kyb-chip)] px-3 py-3 space-y-2 text-sm leading-relaxed first:border-t-0">
            <div>
              <p className="text-[15px] font-bold leading-snug">{it.title}</p>
              <p className="text-xs">{it.sub} · yes or no</p>
            </div>
            {it.plain && <p>{it.plain}</p>}
            <p className="rounded-lg bg-[var(--kyb-chip)] p-2.5"><span className="block text-[11px] font-black uppercase tracking-wide">Official ballot text</span>“{it.question}”</p>
            <button type="button" onClick={() => onJump(card.id, it.id)} className="font-bold underline underline-offset-2">Decide on the ballot →</button>
          </li>
        ) : (
          <li key={it.id} className="border-t border-[var(--kyb-chip)] first:border-t-0">
            <button type="button" onClick={() => onJump(card.id, it.id)} className="w-full px-3 py-2.5 text-left hover:bg-[var(--kyb-chip)]">
              <span className="block text-[15px] font-bold leading-snug">{it.title}</span>
              <span className="block text-xs">{it.sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * The rest of the ballot by section, as open panels in the contents list's
 * colours: every contest, what it is, why it matters and who's running, on
 * the page already; a candidate opens their details.
 */
export function SectionCards({ cards, heading, intro, onOpen, onOpenRace, onCompare, onJump }: { cards: SectionCard[]; heading: string; intro: string; onOpen: (race: Race, c: Candidate) => void; onOpenRace: (race: Race) => void; onCompare: (race: Race) => void; onJump: (sectionId: string, id: string) => void }) {
  if (!cards.length) return null;
  return (
    <section aria-labelledby="kyb-more" className="space-y-4">
      <div className="space-y-1">
        <h2 id="kyb-more" className="text-2xl sm:text-3xl leading-[1.05]">{heading}</h2>
        <p className="text-[15px]">{intro}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 items-start">
        {cards.map((c) => <SectionPanel key={c.id} card={c} onOpen={onOpen} onOpenRace={onOpenRace} onCompare={onCompare} onJump={onJump} />)}
      </ul>
    </section>
  );
}

/** Motion is off for readers who asked their system for less of it. */
const STILL = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Everyone in a race (or a whole section) as a row of faces the reader can
 * scroll sideways (swipe, trackpad, the ‹ › buttons, a scrollbar in the
 * card's colour that is always drawn) and that also drifts along on its own
 * when it doesn't fit, to the end and back. The drift pauses while hovered
 * and for a few seconds after the reader scrolls it themselves, runs only
 * while on screen, and is off under reduced motion. With `names`, each face
 * carries the name and party; without, just faces, capped at `max` with a
 * "+N" at the end.
 */
export interface StripPerson extends Pick<Candidate, 'name' | 'photo' | 'party' | 'nominatedBy'> { /** A line under the party: their district. */ note?: string; /** What a pick means to the caller (a race id, say). */ key?: string }

export function FaceStrip({ people, names = false, max = 40, size = 'w-11 h-11 text-sm', info = false, color, onPick }: { people: StripPerson[]; names?: boolean; max?: number; size?: string; /** An ⓘ badge on each face: there's more behind it. */ info?: boolean; /** The scrollbar's colour (the card's accent). */ color?: string; /** A tap on a person (not a scroll or a drag). */ onPick?: (p: StripPerson) => void }) {
  const down = useRef<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLUListElement>(null);
  const hold = useRef(0);            // drift paused until this time (ms)
  const pos = useRef(0);             // the drift's own position: scrollLeft only holds whole pixels
  const dir = useRef(1);             // the drift's direction: to the end, then back
  const [loop, setLoop] = useState(false);
  const [on, setOn] = useState(false);
  const shown = people.slice(0, max);
  const more = people.length - shown.length;
  const gap = names ? 14 : 6;
  // Loop only when the row overflows; measure one copy to know where to wrap.
  useLayoutEffect(() => {
    const b = box.current, f = first.current;
    if (!b || !f) return;
    const fit = () => setLoop(f.scrollWidth > b.clientWidth + 1);
    fit();
    const ro = new ResizeObserver(fit); ro.observe(b);
    return () => ro.disconnect();
  }, [people.length, names, gap]);
  useEffect(() => {
    const b = box.current;
    if (!b || !('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '80px' });
    io.observe(b);
    return () => io.disconnect();
  }, []);
  // The drift: a few pixels a frame, wrapping at one copy so the loop never jumps.
  useEffect(() => {
    const b = box.current;
    if (!b || !loop || !on || STILL) return;
    let raf = 0, last = 0, hover = false;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0; last = ts;
      if (hover || Date.now() < hold.current || document.hidden) return;
      // The reader scrolled it: carry on from where they left it.
      if (Math.abs(b.scrollLeft - Math.round(pos.current)) > 1) pos.current = b.scrollLeft;
      const end = b.scrollWidth - b.clientWidth;
      pos.current += dir.current * 28 * dt;
      // At either end, rest a moment, then head back the other way.
      if (pos.current >= end) { pos.current = end; dir.current = -1; hold.current = Date.now() + 1500; }
      if (pos.current <= 0) { pos.current = 0; dir.current = 1; hold.current = Date.now() + 1500; }
      b.scrollLeft = Math.round(pos.current);
    };
    const over = () => { hover = true; }, out = () => { hover = false; };
    const touched = () => { hold.current = Date.now() + 4000; };
    b.addEventListener('pointerenter', over); b.addEventListener('pointerleave', out);
    b.addEventListener('pointerdown', touched); b.addEventListener('wheel', touched, { passive: true }); b.addEventListener('touchstart', touched, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); b.removeEventListener('pointerenter', over); b.removeEventListener('pointerleave', out); b.removeEventListener('pointerdown', touched); b.removeEventListener('wheel', touched); b.removeEventListener('touchstart', touched); };
  }, [loop, on]);
  const nudge = (dir: 1 | -1) => {
    const b = box.current; if (!b) return;
    hold.current = Date.now() + 4000;
    b.scrollBy({ left: dir * Math.max(160, b.clientWidth * 0.6), behavior: STILL ? 'auto' : 'smooth' });
  };
  // A tap on a person, but not the end of a drag or a scroll.
  const pick = (p: StripPerson) => (e: { clientX: number; clientY: number }) => {
    const d = down.current; down.current = null;
    if (onPick && (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8)) onPick(p);
  };
  const person = (c: StripPerson) => (<>
    <span className="relative inline-block">
      <Face c={c} className={`${size} ${names ? '' : 'ring-2 ring-[var(--gb-surface)]'}`} />
      {info && <Info className="absolute -right-0.5 -bottom-0.5 w-4 h-4 rounded-full bg-[var(--gb-surface)] text-[var(--gb-link)]" aria-hidden="true" />}
    </span>
    {names && <>
      <span className="mt-1 block w-full text-[12.5px] font-bold leading-tight line-clamp-2 text-[var(--gb-text)]">{c.name.split(' & ')[0]}</span>
      <span className="block w-full line-clamp-2 break-words text-[11px] leading-tight text-[var(--gb-text)]">{c.nominatedBy ?? c.party}</span>
      {c.note && <span className="block w-full truncate text-[11px] font-bold leading-tight text-[var(--gb-text)]">{c.note}</span>}
    </>}
  </>);
  const cell = names ? 'w-full flex flex-col items-center text-center' : 'flex';
  const row = (ref?: typeof first) => (
    <ul ref={ref} className="flex shrink-0" style={{ gap }}>
      {shown.map((c, i) => (
        <li key={`${c.name}-${i}`} className={names ? 'w-[88px] flex' : ''}>
          {onPick
            ? <button type="button" onClick={pick(c)} aria-label={names ? undefined : `${c.name}: more about them`} className={`${cell} rounded-lg ${names ? 'px-0.5 py-1' : ''} hover:bg-[var(--kyb-chip)]`}>{person(c)}</button>
            : <span className={cell}>{person(c)}</span>}
        </li>
      ))}
      {more > 0 && <li className={`flex items-center ${names ? 'w-[88px] justify-center' : ''}`}><span className="rounded-full bg-[var(--kyb-chip)] px-2 py-0.5 text-[11px] font-bold">+{more}</span></li>}
    </ul>
  );
  return (
    <div className="kyb-strip-wrap relative">
      <div ref={box} className={`kyb-strip ${loop ? 'is-loop' : ''} w-full`} style={color ? { ['--scroll' as string]: color } : undefined} aria-label={`${people.length} candidate${people.length === 1 ? '' : 's'}`} tabIndex={loop ? 0 : undefined}
        onPointerDown={onPick ? (e) => { down.current = { x: e.clientX, y: e.clientY }; } : undefined}>
        <div className="kyb-strip-in flex" style={{ gap }}>
          {row(first)}
        </div>
      </div>
      {loop && <>
        <button type="button" onClick={() => nudge(-1)} aria-label="Scroll left" className="kyb-strip-btn left-0"><ChevronLeft className="w-4 h-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => nudge(1)} aria-label="Scroll right" className="kyb-strip-btn right-0"><ChevronRight className="w-4 h-4" aria-hidden="true" /></button>
      </>}
    </div>
  );
}

/**
 * "Back to top": a glass button in the corner once the page has scrolled a
 * screen or so (the pinned bar's glass). Hidden in print.
 */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: STILL ? 'auto' : 'smooth' })} aria-label="Back to top" title="Back to top"
      className={`kyb-glass kyb-totop fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-[var(--gb-text)] print:hidden ${show ? 'is-on' : ''}`}>
      <ArrowUp className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

/** A fold-away explainer of the ballot's layout, remembered open or closed on this device. */
export function HowBallotWorks({ storageKey, title, defaultOpen = false, children }: { storageKey: string; title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, toggle] = useOpen(storageKey, defaultOpen);
  return (
    <section aria-labelledby="kyb-how" className="rounded-2xl border-[3px] border-[var(--kyb-gold)] bg-[var(--gb-surface)] p-4 sm:p-5 space-y-3">
      <h2 id="kyb-how" className="text-xl">
        <button type="button" onClick={toggle} aria-expanded={open} aria-controls="kyb-how-body" className="inline-flex min-h-[44px] items-center gap-2 text-left">
          🧾 {title}
          <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          <span className="sr-only">{open ? '(hide)' : '(show)'}</span>
        </button>
      </h2>
      {open && <div id="kyb-how-body" className="space-y-2 text-[15px] leading-relaxed">{children}</div>}
    </section>
  );
}

