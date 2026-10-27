import { Pdf, type RGB } from './pdf';
import { today } from './store';

// "Download my ballot": the voter's picks as a PDF, with an overview first
// (how far along they are, section by section, their districts and their plan
// to vote), then every contest on their ballot with their pick or what's
// still open. Built here, on the device, from what the guide already holds;
// nothing is sent anywhere. It leaves out the street address, as resume links
// do. Loaded only when the button is pressed.

export type PickState = 'picked' | 'skipped' | 'open';
export interface PdfRow { what: string; pick: string; state: PickState }
export interface PdfSection { title: string; /** A CSS colour: "#rrggbb" or "rgb(…)"; anything else is drawn grey. */ color: string; rows: PdfRow[] }
export interface PdfSummary {
  /** "Illinois". */
  state: string;
  /** The area the ballot covers: "Chicago", "Cook County", "Kent County" or the state. */
  region: string;
  /** "Ward 5", "Congress 7": the voter's districts, when they gave an address. */
  districts: string[];
  /** YYYY-MM-DD. */
  electionDate: string;
  daysLeft: number;
  /** The guide's address, printed in the footer. */
  url: string;
  sections: PdfSection[];
  plan: Record<string, boolean | string>;
  /** The election's key dates (YYYY-MM-DD); those already past are left out. */
  dates: { date: string; title: string }[];
  /** The state's line about notes in the booth. */
  notes: string;
  /** Where the official sample ballot is. */
  official: { label: string; url: string };
}

const INK: RGB = [0.06, 0.07, 0.1];
const GREY: RGB = [0.4, 0.42, 0.46];
const RULE: RGB = [0.82, 0.84, 0.87];
const TRACK: RGB = [0.92, 0.93, 0.94];
const M = 50;
const CW = 612 - 2 * M;
const BOTTOM = 792 - 62;

/** "#rrggbb", "#rgb" or "rgb(r, g, b)" as 0–1 channels; anything else grey. */
export function parseColor(css: string): RGB {
  const hex = css.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
  }
  const fn = css.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  return fn ? [Number(fn[1]) / 255, Number(fn[2]) / 255, Number(fn[3]) / 255] : [0.45, 0.45, 0.45];
}

const METHODS: Record<string, string> = { early: 'Vote early', mail: 'Vote by mail', absentee: 'Vote by mail (absentee)', day: 'Vote on Election Day' };
const longDate = (iso: string) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

const shortDate = (iso: string) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

/** The PDF for a voter's picks. */
export function buildBallotPdf(s: PdfSummary): Blob {
  const pdf = new Pdf(`My Ballot - ${s.state} - ${s.electionDate}`);
  const rows = s.sections.flatMap((x) => x.rows);
  const total = rows.length;
  const picked = rows.filter((r) => r.state === 'picked').length;
  const skipped = rows.filter((r) => r.state === 'skipped').length;
  const open = total - picked - skipped;
  const decided = picked + skipped;
  let y = 0;
  const ensure = (h: number) => { if (y + h > BOTTOM) { pdf.newPage(); y = M; } };

  // A band across the top, one stretch per section in the section's colour.
  const colors = s.sections.map((x) => parseColor(x.color));
  colors.forEach((c, i) => pdf.rect((612 / colors.length) * i, 0, 612 / colors.length + 1, 9, c));
  y = 44;
  pdf.text('Know Your Ballot · Built on Govbot', M, y, 9, { color: GREY });
  pdf.text(`Saved ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 612 - M, y, 9, { color: GREY, align: 'right' });
  y += 38;
  pdf.text('My Ballot', M, y, 30, { bold: true, color: INK });
  y += 22;
  pdf.text(`${s.region === s.state ? s.state : `${s.region}, ${s.state}`} · General Election · ${longDate(s.electionDate)}`, M, y, 12, { color: GREY });
  if (s.districts.length) {
    y += 8;
    for (const line of pdf.wrap(`Your districts: ${s.districts.join(' · ')}`, 10, CW)) { y += 14; pdf.text(line, M, y, 10, { color: GREY }); }
  }

  // Overview: how far along, and the three kinds of contest.
  y += 22;
  const top = y;
  pdf.rect(M, top, CW, 118, [0.96, 0.965, 0.97]);
  pdf.text(`${decided} of ${total}`, M + 18, top + 50, 36, { bold: true, color: INK });
  pdf.text(total === 1 ? 'contest decided' : 'contests decided', M + 18, top + 70, 11, { color: GREY });
  const legend: [string, number, PickState][] = [['Picked', picked, 'picked'], ['Skipped on purpose', skipped, 'skipped'], ['Still open', open, 'open']];
  legend.forEach(([label, n, st], i) => {
    const ly = top + 34 + i * 20;
    mark(pdf, M + 262, ly - 3.5, st);
    pdf.text(`${n}`, M + 280, ly, 12, { bold: true, color: INK });
    pdf.text(label, M + 306, ly, 12, { color: INK });
  });
  if (s.daysLeft > 0) pdf.text(`${s.daysLeft} ${s.daysLeft === 1 ? 'day' : 'days'} until Election Day`, M + CW - 18, top + 22, 11, { bold: true, color: INK, align: 'right' });
  else if (s.daysLeft === 0) pdf.text('Election Day is today', M + CW - 18, top + 22, 11, { bold: true, color: INK, align: 'right' });
  pdf.rect(M + 18, top + 90, CW - 36, 8, TRACK);
  if (total) pdf.rect(M + 18, top + 90, ((CW - 36) * decided) / total, 8, [0.12, 0.56, 0.37]);
  y = top + 118 + 28;

  // By section.
  pdf.text('By section', M, y, 14, { bold: true, color: INK });
  y += 10;
  s.sections.forEach((sec, i) => {
    ensure(40);
    const d = sec.rows.filter((r) => r.state !== 'open').length;
    y += 22;
    pdf.text(sec.title, M, y, 11, { color: INK });
    pdf.text(`${d} of ${sec.rows.length}`, M + CW, y, 11, { bold: true, color: INK, align: 'right' });
    pdf.rect(M, y + 6, CW, 6, TRACK);
    if (sec.rows.length) pdf.rect(M, y + 6, (CW * d) / sec.rows.length, 6, colors[i]);
    y += 12;
  });

  // The plan to vote.
  y += 30;
  ensure(120);
  pdf.text('Your plan to vote', M, y, 14, { bold: true, color: INK });
  const method = typeof s.plan.method === 'string' ? s.plan.method : '';
  const steps: [string, boolean][] = [['Checked my registration', !!s.plan.registered], ['Know what ID to bring', !!s.plan.id], ['Put it on my calendar', !!s.plan.reminder]];
  y += 24;
  pdf.text('How I’ll vote:', M, y, 11, { color: GREY });
  pdf.text(METHODS[method] ?? 'Not chosen yet', M + 86, y, 11, { bold: true, color: INK });
  for (const [label, on] of steps) {
    y += 20;
    mark(pdf, M + 4, y - 3.5, on ? 'picked' : 'open');
    pdf.text(label, M + 22, y, 11, { color: INK });
  }

  // Key dates still ahead.
  const ahead = s.dates.filter((d) => d.date >= today()).sort((x, z) => x.date.localeCompare(z.date));
  if (ahead.length) {
    y += 34;
    ensure(60);
    pdf.text('Key dates', M, y, 14, { bold: true, color: INK });
    for (const d of ahead) {
      const lines = pdf.wrap(d.title, 11, CW - 96);
      ensure(lines.length * 15 + 8);
      y += 21;
      pdf.text(shortDate(d.date), M, y, 11, { bold: true, color: INK });
      lines.forEach((l, k) => pdf.text(l, M + 96, y + k * 15, 11, { color: INK }));
      y += (lines.length - 1) * 15;
    }
  }

  // The picks, section by section.
  pdf.newPage();
  y = M;
  pdf.text('My picks', M, y + 14, 22, { bold: true, color: INK });
  y += 40;
  s.sections.forEach((sec, i) => {
    ensure(70);
    const d = sec.rows.filter((r) => r.state !== 'open').length;
    pdf.rect(M, y - 10, 10, 10, colors[i]);
    pdf.text(sec.title, M + 18, y, 13, { bold: true, color: INK });
    pdf.text(`${d} of ${sec.rows.length} decided`, M + CW, y, 10, { color: GREY, align: 'right' });
    pdf.line(M, y + 6, M + CW, y + 6, colors[i], 1.5);
    y += 6;
    for (const r of sec.rows) {
      const what = pdf.wrap(r.what, 10, 286);
      const text = r.state === 'open' ? 'Not decided yet' : r.state === 'skipped' ? 'Skipped' : r.pick;
      const pick = pdf.wrap(text, 10, CW - 330, r.state === 'picked');
      const h = Math.max(what.length, pick.length) * 13 + 9;
      ensure(h);
      mark(pdf, M + 7, y + 13 - 3.5, r.state);
      what.forEach((l, k) => pdf.text(l, M + 22, y + 15 + k * 13, 10, { color: INK }));
      pick.forEach((l, k) => pdf.text(l, M + 330, y + 15 + k * 13, 10, r.state === 'picked' ? { bold: true, color: INK } : { color: GREY }));
      y += h;
      pdf.line(M, y, M + CW, y, RULE, 0.5);
    }
    y += 26;
  });

  // Before voting.
  ensure(110);
  pdf.text('Before you vote', M, y, 14, { bold: true, color: INK });
  y += 6;
  const note = `${s.notes} This list is unofficial, from Know Your Ballot: the official sample ballot is the one to trust for the order and wording of what you’ll mark.`;
  for (const l of pdf.wrap(note, 10, CW)) { y += 15; pdf.text(l, M, y, 10, { color: INK }); }
  y += 20;
  const official = `${s.official.label}: ${s.official.url.replace(/^https?:\/\//, '')}`;
  pdf.text(official, M, y, 10, { bold: true, color: [0.09, 0.28, 0.79] });
  pdf.link(M, y - 10, pdf.width(official, 10, true), 14, s.official.url);
  y += 22;
  for (const l of pdf.wrap('This file lists your picks. Keep it to yourself, or share it only with people you trust. It leaves out your street address.', 9, CW)) { y += 12; pdf.text(l, M, y, 9, { color: GREY }); }

  // Footers, now the page count is known.
  const n = pdf.pageCount;
  const site = s.url.replace(/^https?:\/\//, '');
  for (let i = 0; i < n; i++) {
    pdf.goTo(i);
    pdf.line(M, 792 - 44, M + CW, 792 - 44, RULE, 0.5);
    pdf.text(`Know Your Ballot · ${site}`, M, 792 - 30, 8, { color: GREY });
    pdf.link(M, 792 - 40, pdf.width(`Know Your Ballot · ${site}`, 8), 12, s.url);
    pdf.text(`Page ${i + 1} of ${n}`, M + CW, 792 - 30, 8, { color: GREY, align: 'right' });
  }
  return pdf.finish();
}

/** The ballot's own mark: a filled oval for a pick, a dashed-through one for a skip, an empty one for open. */
function mark(pdf: Pdf, x: number, y: number, state: PickState) {
  const cx = x + 5, cy = y + 3.5;
  if (state === 'picked') pdf.oval(cx, cy, 5, 3.5, { fill: INK, stroke: INK, width: 1 });
  else {
    pdf.oval(cx, cy, 5, 3.5, { stroke: INK, width: 1 });
    if (state === 'skipped') pdf.line(cx - 3, cy, cx + 3, cy, INK, 1);
  }
}

/** Build the PDF and hand it to the browser as a download; resolves to the file's name. */
export function downloadBallotPdf(s: PdfSummary): string {
  const blob = buildBallotPdf(s);
  const name = `my-ballot-${s.state.toLowerCase().replace(/[^a-z]+/g, '-')}-${s.electionDate}.pdf`;
  const href = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
  return name;
}
