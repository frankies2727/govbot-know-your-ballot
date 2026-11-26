import { ChevronDown, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { money, useOpen } from './store';
import type { Briefs } from './briefs';
import type { Change, Law, NewsItem, Race } from './types';
import type { KeyDate } from './dates';
import { longDate } from './seo/format';

// "News Feed": one feed of everything that moved lately, newest first, each
// item dated and sourced. Ballot changes the daily refresh noticed, news
// headlines, everything dated the candidates' briefs were read from (press,
// social posts, official releases, their own sites), each race's campaign money, bills (where the state
// has them) and the next key dates.

export type Kind = 'ballot' | 'news' | 'social' | 'official' | 'campaign' | 'money' | 'bill' | 'date';

export interface FeedItem {
  at: string; // ISO
  kind: Kind;
  title: string;
  detail?: string;
  /** Who said so, and where. */
  source: { name: string; url?: string };
  /** A contest on the ballot to jump to. */
  jump?: string;
}

const KINDS: { id: Kind | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'Everything', color: 'var(--gb-text)' },
  { id: 'news', label: 'News', color: 'var(--gb-blue-hi)' },
  { id: 'social', label: 'Social posts', color: 'var(--gb-purple-hi)' },
  { id: 'official', label: 'Official', color: 'var(--gb-text)' },
  { id: 'campaign', label: 'Campaign sites', color: 'var(--kyb-pink)' },
  { id: 'money', label: 'Finances', color: 'var(--kyb-orange)' },
  { id: 'ballot', label: 'Ballot changes', color: 'var(--gb-primary)' },
  { id: 'bill', label: 'Bills', color: 'var(--kyb-gold)' },
  { id: 'date', label: 'Key dates', color: 'var(--gb-amber-hi)' },
];
const KIND_LABEL: Record<Kind, string> = { ballot: 'Ballot', news: 'News', social: 'Social', official: 'Official', campaign: 'Campaign', money: 'Finances', bill: 'Bill', date: 'Key date' };

const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const when = (iso: string) => day.format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));

const safe = (u?: string) => (u && /^https:\/\//.test(u) ? u : undefined);

/** The bill's own card in govbot's catalog (its state's catalog opens underneath), else the legislature's page. */
export const billUrl = (b: Law) => (b.state && b.session
  ? `https://chihacknight.github.io/govbot/dashboard/legislation.html#bill=${[b.state, b.session, b.id].map(encodeURIComponent).join('~')}`
  : safe(b.url));

/** What a daily-refresh change says, and who it comes from. */
export function changeItems(changes: Change[], source: (c: Change) => { name: string; url?: string }): FeedItem[] {
  return changes.map((c) => {
    const title = c.kind === 'candidate-added' ? `${c.name} joined the ballot for ${c.what}`
      : c.kind === 'candidate-removed' ? `${c.name} is no longer on the ballot for ${c.what}`
      : c.kind === 'money' ? `${c.name} filed a new money report: ${money(c.raised ?? 0)} raised`
      : c.kind === 'contest-added' ? `New on the ballot: ${c.what}` : `No longer on the ballot: ${c.what}`;
    return { at: c.at, kind: c.kind === 'money' ? 'money' : 'ballot', title, detail: c.kind === 'money' ? c.what : undefined, source: source(c), jump: c.kind === 'contest-removed' ? undefined : c.id };
  });
}

export const newsItems = (news: NewsItem[]): FeedItem[] =>
  news.map((n) => ({ at: n.at, kind: n.topic === 'money' ? 'money' : 'news', title: n.title, source: { name: n.source, url: safe(n.url) } }));

export const billItems = (laws: Law[], billUrl: (b: Law) => string | undefined, legislature: string): FeedItem[] =>
  laws.filter((b) => b.latest_action).map((b) => ({
    at: b.latest_action!, kind: 'bill', title: `${b.id}: ${b.title}`, detail: b.latest_action_desc, source: { name: `${legislature}, via govbot`, url: billUrl(b) },
  }));

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const SOCIAL = /(^|\.)(bsky\.app|bsky\.social|bluesky|instagram\.com|facebook\.com|fb\.com|fb\.watch|x\.com|twitter\.com|threads\.net|threads\.com|tiktok\.com|youtube\.com|youtu\.be|linkedin\.com|reddit\.com|mastodon\.\w+|nextdoor\.com|medium\.com|substack\.com|patreon\.com|linktr\.ee)$/i;
const OFFICIAL_HOST = /\.(gov|us|mil|edu)$|(^|\.)gov\./i;
const OFFICIAL_NAME = /\boffice\b|clerk|auditor|city and county|\bcity of\b|\bvillage of\b|\bschool district\b|\bdistrict \d|\bcounty\b|governor|commission|\bboard of\b|\bcourt|\bstate of\b|department|council\b/i;
const CAMPAIGN_NAME = /campaign|friends of|(citizens|neighbors|people) for|committee to elect|\bfor \d+(st|nd|rd|th)?\b|\belect\b|\bfor (mayor|council|alder|ward|trustee|judge|justice|sheriff|clerk|treasurer|supreme|district|chicago|denver|jacksonville|oak park|wisconsin)/i;
const SAID: Record<'news' | 'social' | 'official' | 'campaign', string> = { news: 'Candidates in this story', social: 'Candidates in this post', official: 'Candidates in this release', campaign: 'Candidate' };

/** What kind of source a cited page is: a post, a government page, the candidate's own site, or the press (anything else, reference sites included). */
function sourceKind(url: string, publisher: string, own: string, surname: string): 'news' | 'social' | 'official' | 'campaign' {
  const h = host(url);
  if (SOCIAL.test(h)) return 'social';
  if ((own && h === own) || (surname.length > 3 && h.replace(/[^a-z]/g, '').includes(surname)) || CAMPAIGN_NAME.test(publisher)) return 'campaign';
  if (OFFICIAL_HOST.test(h) || OFFICIAL_NAME.test(publisher)) return 'official';
  return 'news';
}

/** Everything dated a candidate's or seat holder's brief was read from in the last year, once each, sorted into news, social posts, official releases and campaign sites, with who's in it. */
export function sourceItems(races: Race[], briefs: Briefs, today: string): FeedItem[] {
  const since = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`;
  const byUrl = new Map<string, FeedItem & { names: string[] }>();
  for (const r of races) {
    for (const p of [...r.candidates, ...(r.incumbents ?? []).filter((i) => i.ballot === undefined)]) {
      const own = 'website' in p && p.website ? host(p.website) : '';
      const surname = p.name.toLowerCase().replace(/,? (jr|sr|ii|iii|iv)\.?$/, '').split(' ').pop()!.replace(/[^a-z]/g, '');
      for (const s of briefs[`${r.id}|${p.name}`]?.sources ?? []) {
        const url = safe(s.url);
        if (!url || !s.date || s.date < since || s.date > today) continue;
        const item = byUrl.get(url) ?? { at: s.date, kind: sourceKind(url, s.publisher, own, surname), title: s.title, source: { name: s.publisher, url }, jump: r.id, names: [] };
        if (!item.names.includes(p.name)) item.names.push(p.name);
        byUrl.set(url, item);
      }
    }
  }
  return [...byUrl.values()].map(({ names, ...i }) => ({ ...i, detail: `${SAID[i.kind as keyof typeof SAID]}: ${names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(names.length === 2 ? ' and ' : ', ')}` }));
}

/** "09/30/2026" -> "2026-09-30". */
const isoOf = (mdy: string) => { const [m, d, y] = mdy.split('/'); return y && m && d ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''; };

/** Each race's campaign money from the latest reports: who has raised the most, dated by the newest report. */
export function moneyItems(races: Race[], source: { name: string; url?: string }): FeedItem[] {
  return races.flatMap((r) => {
    const filed = r.candidates.filter((c) => c.money).sort((a, b) => b.money!.raised - a.money!.raised);
    if (!filed.length) return [];
    const at = filed.map((c) => isoOf(c.money!.through)).filter(Boolean).sort().pop();
    if (!at) return [];
    const top = filed.slice(0, 3).map((c) => `${c.name} ${money(c.money!.raised)}`).join(', ');
    return [{
      at, kind: 'money' as const, jump: r.id, source,
      title: `${r.office.replace(/ \(\d+ seats?\)$/, '')}: ${filed.length} of ${r.candidates.length} candidate${r.candidates.length === 1 ? '' : 's'} ${filed.length === 1 ? 'has' : 'have'} filed money reports`,
      detail: `Raised the most: ${top}. Latest reports run through ${when(at)}.`,
    }];
  });
}

/** The next few dates, as items dated on the day itself. */
export const dateItems = (dates: KeyDate[], today: string, source: { name: string; url: string }): FeedItem[] =>
  dates.filter((d) => d.date >= today).slice(0, 3).map((d) => ({ at: d.date, kind: 'date', title: d.title, detail: d.detail, source }));

// Six at first, five more per tap; the list scrolls past about a screen's worth.
const SHOWN = 6;
const STEP = 5;

/**
 * `storageKey` remembers whether the feed is shown or hidden; it starts shown.
 * `asOf` (YYYY-MM-DD) is when the data behind it was last read; `start` the topic it opens on
 * (Everything instead while that topic is empty).
 * Every topic always has its tab (an empty one says so), except "Ballot changes", which only
 * guides whose daily refresh logs changes have.
 */
export function Feed({ items, storageKey, onJump, asOf, start = 'all' }: { items: FeedItem[]; storageKey: string; onJump: (id: string) => void; asOf?: string; start?: Kind | 'all' }) {
  const [open, toggle] = useOpen(storageKey, true);
  const [picked, setKind] = useState<Kind | 'all' | null>(null);
  const [limit, setLimit] = useState(SHOWN);
  const sorted = useMemo(() => [...items].sort((a, b) => b.at.localeCompare(a.at)), [items]);
  // Until a tab is tapped: the `start` topic, or Everything while it has nothing (the briefs load after the page).
  const kind = picked ?? (sorted.some((i) => i.kind === start) ? start : 'all');
  const shown = sorted.filter((i) => kind === 'all' || i.kind === kind);
  const list = shown.slice(0, limit);
  if (!items.length) return null;
  const color = (k: Kind) => KINDS.find((x) => x.id === k)!.color;
  return (
    <section id="kyb-news" aria-labelledby="kyb-feed" className="scroll-mt-[var(--kyb-bar,0px)] rounded-2xl border-[3px] border-[var(--gb-blue-hi)] bg-[var(--gb-surface)] p-4 sm:p-5 space-y-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="kyb-feed" className="text-2xl">
          <button type="button" onClick={toggle} aria-expanded={open} aria-controls="kyb-feed-body" className="inline-flex min-h-[44px] items-center gap-2 text-left">
            📰 News Feed
            <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            <span className="sr-only">{open ? '(hide)' : '(show)'}</span>
          </button>
        </h2>
        {asOf && <p className="rounded-full border-2 border-[var(--gb-blue-hi)] px-3 py-0.5 text-sm font-bold">Data as of {longDate(asOf).replace(/^\w+, /, '')}</p>}
        </div>
        {open && <p className="text-[15px] leading-relaxed">Everything that moved lately: news, social posts, official releases and campaign sites about the candidates, campaign finances (each race’s latest reports, and stories about who’s funding whom), changes to the ballot the daily refresh noticed, bills and the dates coming up. Each item says where it comes from.</p>}
      </div>
      {open && <div id="kyb-feed-body" className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kinds of activity">
        {KINDS.filter((k) => k.id !== 'ballot' || sorted.some((i) => i.kind === 'ballot')).map((k) => (
          <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} onClick={() => { setKind(k.id); setLimit(SHOWN); }}
            className="min-h-[40px] rounded-full border-2 px-4 text-sm font-bold" style={kind === k.id ? { background: k.color, borderColor: k.color, color: 'var(--gb-bg)' } : { borderColor: k.color }}>
            {k.label}
          </button>
        ))}
      </div>
      <ol className="kyb-scroll-bar max-h-[560px] overflow-y-auto divide-y divide-[var(--kyb-chip)] pr-1" style={{ ['--scroll' as string]: 'var(--gb-blue-hi)' }}>
        {list.map((i, n) => (
          <li key={`${i.kind}-${i.at}-${n}`} className="flex gap-3 py-3">
            <div className="w-24 shrink-0">
              <p className="font-black leading-tight whitespace-nowrap">{when(i.at)}</p>
              <span className="mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide" style={{ background: color(i.kind), color: 'var(--gb-bg)' }}>{KIND_LABEL[i.kind]}</span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              {i.jump
                ? <button type="button" onClick={() => onJump(i.jump!)} className="text-left font-bold leading-snug underline underline-offset-2 [overflow-wrap:anywhere]">{i.title}</button>
                : <p className="font-bold leading-snug [overflow-wrap:anywhere]">{i.title}</p>}
              {i.detail && <p className="text-sm leading-snug">{i.detail}</p>}
              <p className="text-sm">
                {i.source.url
                  ? <a href={i.source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-bold text-[var(--gb-link)] underline underline-offset-2">{i.source.name}<ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /></a>
                  : <span className="font-bold">{i.source.name}</span>}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {shown.length > SHOWN && (
        <div className="flex flex-wrap gap-2">
          {shown.length > limit && (
            <button type="button" onClick={() => setLimit(limit + STEP)} className="min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] px-4 font-bold">
              Show {Math.min(STEP, shown.length - limit)} more
            </button>
          )}
          {limit > SHOWN && <button type="button" onClick={() => setLimit(SHOWN)} className="min-h-[44px] rounded-xl border-2 border-[var(--gb-border)] px-4 font-bold">Show fewer</button>}
        </div>
      )}
      {!shown.length && <p className="text-[15px]">Nothing of this kind lately.</p>}
      </div>}
    </section>
  );
}
