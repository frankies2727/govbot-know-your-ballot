import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { PdfSummary } from '../ballotPdf';

/**
 * "Download my ballot as a PDF", for the Save & share tab of every state's
 * guide. The PDF builder loads only when the button is pressed; `summary`
 * reads the guide's picks at that moment. `accent` is the guide's colour.
 */
export function PdfCard({ summary, accent, disabled }: { summary: () => PdfSummary; accent: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const make = async () => {
    setBusy(true);
    setMsg('');
    try {
      const { downloadBallotPdf } = await import('../ballotPdf');
      const name = downloadBallotPdf(summary());
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
      <button type="button" onClick={make} disabled={busy || disabled} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[var(--gb-text)] px-4 font-black hover:bg-[var(--kyb-chip)] disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FileDown className="h-5 w-5" aria-hidden="true" />}
        {busy ? 'Making your PDF…' : 'Download PDF'}
      </button>
      {disabled && <p className="text-sm">Enter your address or pick a county first, so there’s a ballot to download.</p>}
      {msg && <p role="status" className="font-bold">{msg}</p>}
      <p className="text-sm">🔒 It lists your picks, so keep the file to yourself. It leaves out your street address.</p>
    </section>
  );
}
