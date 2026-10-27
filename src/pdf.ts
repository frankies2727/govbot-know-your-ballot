// A small PDF writer, so "download as a PDF" needs no library and nothing
// leaves the device: text, rules, rectangles, ovals and links on Letter pages,
// in the two standard Helvetica fonts every PDF reader carries (so no font is
// embedded). Text is stored as WinAnsi (Windows-1252) bytes; a character it
// can't show falls back to its plain letter, else "?". Coordinates are in
// points from the page's TOP-left corner.

export type RGB = [number, number, number];

const CP1252: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e,
  '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

// Letters WinAnsi lacks that have no accent to strip.
const LATIN: Record<string, string> = { 'Ł': 'L', 'ł': 'l', 'Đ': 'D', 'đ': 'd', 'ı': 'i', 'Ħ': 'H', 'ħ': 'h' };

/** Text as a string of single bytes (each char code 0–255) in WinAnsi. */
export function toBytes(s: string): string {
  let out = '';
  for (const ch of s.normalize('NFC')) {
    const cp = ch.codePointAt(0)!;
    if (cp === 9 || cp === 10 || cp === 13 || cp === 160) out += ' ';
    else if ((cp >= 32 && cp < 127) || (cp >= 161 && cp <= 255)) out += ch;
    else if (CP1252[ch]) out += String.fromCharCode(CP1252[ch]);
    else {
      const base = LATIN[ch] ?? ch.normalize('NFD')[0];
      out += base.charCodeAt(0) >= 32 && base.charCodeAt(0) < 127 ? base : /\p{L}/u.test(ch) ? '?' : '';   // a letter we can't show is a "?"; an emoji or symbol is left out
    }
  }
  return out;
}

// Advance widths (1/1000 em) of the printable ASCII characters 32–126, from the standard Helvetica metrics.
const HELV = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333,
  556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975,
  722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333,
  556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
// The WinAnsi punctuation we use most; anything else outside ASCII is measured as an average letter.
const WIDE: Record<number, [number, number]> = { 0x92: [222, 278], 0x91: [222, 278], 0x93: [333, 500], 0x94: [333, 500], 0x96: [556, 556], 0x97: [1000, 1000], 0x95: [350, 350], 0x85: [1000, 1000], 0xb7: [278, 278] };

export interface TextStyle { bold?: boolean; color?: RGB; align?: 'left' | 'right' | 'center' }

const num = (n: number) => (Math.round(n * 100) / 100).toString();
const esc = (s: string) => s.replace(/[\\()]/g, '\\$&');
const rgb = (c: RGB, op: 'rg' | 'RG') => `${c.map(num).join(' ')} ${op}\n`;

export class Pdf {
  readonly W = 612;
  readonly H = 792;
  private pages: string[] = [''];
  private links: { page: number; x: number; y: number; w: number; h: number; url: string }[] = [];
  private cur = 0;

  constructor(private title: string) {}

  get pageCount() { return this.pages.length; }
  get page() { return this.cur; }
  newPage() { this.pages.push(''); this.cur = this.pages.length - 1; }
  /** Go back to a finished page (to add footers once the page count is known). */
  goTo(i: number) { this.cur = i; }

  private op(s: string) { this.pages[this.cur] += s; }

  width(text: string, size: number, bold = false): number {
    let w = 0;
    for (const ch of toBytes(text)) {
      const c = ch.charCodeAt(0);
      w += c >= 32 && c < 127 ? (bold ? BOLD : HELV)[c - 32] : WIDE[c]?.[bold ? 1 : 0] ?? 556;
    }
    return (w * size) / 1000;
  }

  /** Break text into lines no wider than maxW; a word too long for a line is cut. */
  wrap(text: string, size: number, maxW: number, bold = false): string[] {
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (this.width(w, size, bold) > maxW) {
        let n = w.length;
        while (n > 1 && this.width(w.slice(0, n), size, bold) > maxW) n--;
        if (line) { lines.push(line); line = ''; }
        lines.push(w.slice(0, n));
        w = w.slice(n);
      }
      const next = line ? `${line} ${w}` : w;
      if (this.width(next, size, bold) <= maxW) line = next;
      else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  /** One line of text with its baseline at y. */
  text(s: string, x: number, y: number, size: number, { bold = false, color = [0, 0, 0], align = 'left' }: TextStyle = {}) {
    const w = align === 'left' ? 0 : this.width(s, size, bold);
    const px = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    this.op(`BT\n${rgb(color, 'rg')}/${bold ? 'F2' : 'F1'} ${num(size)} Tf\n${num(px)} ${num(this.H - y)} Td\n(${esc(toBytes(s))}) Tj\nET\n`);
  }

  rect(x: number, y: number, w: number, h: number, color: RGB) {
    this.op(`${rgb(color, 'rg')}${num(x)} ${num(this.H - y - h)} ${num(w)} ${num(h)} re f\n`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: RGB, width = 0.75) {
    this.op(`${rgb(color, 'RG')}${num(width)} w\n${num(x1)} ${num(this.H - y1)} m ${num(x2)} ${num(this.H - y2)} l S\n`);
  }

  /** An oval centred at (cx, cy), filled and/or outlined: the ballot's own mark. */
  oval(cx: number, cy: number, rx: number, ry: number, { fill, stroke, width = 1 }: { fill?: RGB; stroke?: RGB; width?: number }) {
    const k = 0.5523, y = this.H - cy;
    const d = `${num(cx + rx)} ${num(y)} m ${num(cx + rx)} ${num(y + ry * k)} ${num(cx + rx * k)} ${num(y + ry)} ${num(cx)} ${num(y + ry)} c `
      + `${num(cx - rx * k)} ${num(y + ry)} ${num(cx - rx)} ${num(y + ry * k)} ${num(cx - rx)} ${num(y)} c `
      + `${num(cx - rx)} ${num(y - ry * k)} ${num(cx - rx * k)} ${num(y - ry)} ${num(cx)} ${num(y - ry)} c `
      + `${num(cx + rx * k)} ${num(y - ry)} ${num(cx + rx)} ${num(y - ry * k)} ${num(cx + rx)} ${num(y)} c h `;
    this.op(`${fill ? rgb(fill, 'rg') : ''}${stroke ? rgb(stroke, 'RG') : ''}${num(width)} w\n${d}${fill && stroke ? 'B' : fill ? 'f' : 'S'}\n`);
  }

  /** A clickable area on the current page; only web addresses are linked. */
  link(x: number, y: number, w: number, h: number, url: string) {
    if (/^https?:\/\/[\x21-\x7e]+$/.test(url) && !/[()\\]/.test(url)) this.links.push({ page: this.cur, x, y, w, h, url });
  }

  /** The finished file. */
  finish(): Blob {
    const objs: string[] = [];
    const add = (body: string) => { objs.push(body); return objs.length; };
    // Object numbers: 1 catalog, 2 page tree, 3 and 4 fonts, 5 info; then each page, its content and its links.
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    add(`<< /Title (${esc(toBytes(this.title))}) /Producer (Know Your Ballot) >>`);
    const kids: number[] = [];
    this.pages.forEach((content, i) => {
      const pageId = objs.length + 1, contentId = pageId + 1;
      const annots = this.links.filter((l) => l.page === i);
      const annotIds = annots.map((_, k) => contentId + 1 + k);
      kids.push(pageId);
      add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R${annotIds.length ? ` /Annots [${annotIds.map((n) => `${n} 0 R`).join(' ')}]` : ''} >>`);
      add(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
      for (const l of annots) {
        add(`<< /Type /Annot /Subtype /Link /Rect [${num(l.x)} ${num(this.H - l.y - l.h)} ${num(l.x + l.w)} ${num(this.H - l.y)}] /Border [0 0 0] /A << /S /URI /URI (${esc(l.url)}) >> >>`);
      }
    });
    objs[1] = `<< /Type /Pages /Kids [${kids.map((n) => `${n} 0 R`).join(' ')}] /Count ${kids.length} >>`;

    let out = '%PDF-1.4\n';
    const offsets: number[] = [];
    objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: 'application/pdf' });
  }
}
