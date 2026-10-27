import { FileDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PdfSummary, PdfTheme } from '../ballotPdf';

const root = () => document.documentElement;

/** The theme the site is showing now (GovbotChrome keeps `data-theme` on the page). */
function readSiteTheme(): PdfTheme {
  const t = root().getAttribute('data-theme');
  return t === 'light' || t === 'dark' ? t : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function useSiteTheme(): PdfTheme {
  const [theme, setTheme] = useState(readSiteTheme);
  useEffect(() => {
    const watch = new MutationObserver(() => setTheme(readSiteTheme()));
    watch.observe(root(), { attributes: true, attributeFilter: ['data-theme'] });
    return () => watch.disconnect();
  }, []);
  return theme;
}

/** Run `fn` with the page switched to `theme` for an instant, so section colours are read as that theme draws them. Nothing paints in between. */
function inTheme<T>(theme: PdfTheme, fn: () => T): T {
  const was = root().getAttribute('data-theme');
  root().setAttribute('data-theme', theme);
  try { return fn(); } finally { if (was === null) root().removeAttribute('data-theme'); else root().setAttribute('data-theme', was); }
}

const THEMES: { id: PdfTheme; label: string; hint: string }[] = [
  { id: 'light', label: '☀️ Light', hint: 'white pages, best for printing' },
  { id: 'dark', label: '🌙 Dark', hint: 'dark pages, easy on the eyes on a screen' },
];

/**
 * "Download my ballot as a PDF", for the Save & share tab of every state's
 * guide. The PDF builder loads only when the button is pressed; `summary`
 * reads the guide's picks at that moment. `accent` is the guide's colour.
 * The PDF comes in light or dark, starting with whichever the site is in.
 */
export function PdfCard({ summary, accent, disabled }: { summary: () => PdfSummary; accent: string; disabled?: boolean }) {
  const site = useSiteTheme();
  const [chosen, setChosen] = useState<PdfTheme | null>(null);
  const theme = chosen ?? site;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const make = async () => {
    setBusy(true);
    setMsg('');
    try {
      const { downloadBallotPdf } = await import('../ballotPdf');
      const name = downloadBallotPdf(inTheme(theme, summary), theme);
      setMsg(`Saved ${name}. It was made on your device; nothing was uploaded.`);
    } catch {
      setMsg('Couldn’t make the PDF on this device. “Print My Ballot” in Plan to vote works too.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-2xl border-2 bg-[var(--gb-surface)] p-5 space-y-3" style={{ borderColor: accent }} aria-labelledby="kyb-pdf">
      <h2 id="kyb-pdf" className="text-2xl font-black leading-tight">📄 Download my ballot (PDF)</h2>
      <p className="text-[15px] leading-relaxed">A summary for your phone, an email or the printer: where you stand section by section, your districts and your plan to vote, then every contest on your ballot with your pick, or what’s still open.</p>
      <div role="radiogroup" aria-label="PDF theme" className="grid grid-cols-2 gap-2 sm:max-w-md">
        {THEMES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} onClick={() => setChosen(t.id)}
            className={`min-h-[48px] rounded-xl border-2 px-3 py-2 text-left font-bold leading-tight transition-colors ${theme === t.id ? 'border-[var(--gb-text)] bg-[var(--gb-text)] text-[var(--gb-bg)]' : 'border-[var(--gb-border-strong)] bg-[var(--kyb-chip)] hover:border-[var(--gb-text)]'}`}>
            {t.label}
            <span className="block text-xs font-medium">{t.hint}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={make} disabled={busy || disabled} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[var(--gb-text)] px-4 font-black hover:bg-[var(--kyb-chip)] disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FileDown className="h-5 w-5" aria-hidden="true" />}
        {busy ? 'Making your PDF…' : `Download ${theme} PDF`}
      </button>
      {disabled && <p className="text-sm">Enter your address or pick a county first, so there’s a ballot to download.</p>}
      {msg && <p role="status" className="font-bold">{msg}</p>}
      <p className="text-sm">🔒 It lists your picks, so keep the file to yourself. It leaves out your street address.</p>
    </section>
  );
}
