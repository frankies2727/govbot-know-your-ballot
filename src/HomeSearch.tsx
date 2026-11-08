import { Search as SearchIcon } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { navigate } from './lib/router';
import { ELECTIONS, STATE_INK, STATE_NAME, STATES, TYPE_NAME, when, type StateId } from './electionIndex';
import type { SearchSlot } from './LandingBar';

// The home page's search, in its pinned bar: the state guides and every
// election in the index, by state, name, kind, date or what's on the ballot.
// A guide opens; an election scrolls to its row in the index (Elections.tsx
// follows the #el-<id> address, switching to its year).

interface Hit { id: string; title: string; detail: string; ink: string; text: string; go: () => void }

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const HITS: Hit[] = [
  ...STATES.map((s: StateId): Hit => ({
    id: `guide-${s}`, title: `${STATE_NAME[s]} ballot guide`, detail: 'November 2026 midterm: every race, judge and question', ink: STATE_INK[s],
    text: fold(`${STATE_NAME[s]} guide ballot 2026 midterm november`),
    go: () => navigate(`projects/know-your-ballot-${s}`),
  })),
  ...ELECTIONS.map((e): Hit => ({
    id: e.id, title: `${STATE_NAME[e.state]}: ${e.title}`, detail: `${when(e.date)} · ${e.what}`, ink: STATE_INK[e.state],
    text: fold(`${STATE_NAME[e.state]} ${e.title} ${TYPE_NAME[e.type]} ${when(e.date)} ${e.date} ${e.what}`),
    // The same election again: the address doesn't change, so say so.
    go: () => { if (location.hash === `#el-${e.id}`) dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = `el-${e.id}`; },
  })),
];

export function HomeSearch({ autoFocus, onClose }: SearchSlot) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const list = useId();
  const hits = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    return words.length ? HITS.filter((h) => words.every((w) => h.text.includes(w))).slice(0, 8) : [];
  }, [q]);
  const go = (h: Hit) => { setQ(''); onClose?.(); h.go(); };

  return (
    <div className="relative">
      <label htmlFor="kyb-home-search" className="sr-only">Search elections and state guides</label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--gb-text)]" aria-hidden="true" />
        <input
          id="kyb-home-search" name="search" type="text" role="combobox" autoFocus={autoFocus} inputMode="search" enterKeyHint="search" autoComplete="off"
          aria-expanded={!!q} aria-controls={list} aria-autocomplete="list" aria-activedescendant={hits[active] ? `${list}-${hits[active].id}` : undefined}
          value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (hits.length) setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length); }
            if (e.key === 'Enter' && hits[active]) go(hits[active]);
            if (e.key === 'Escape') { if (q) setQ(''); else onClose?.(); }
          }}
          placeholder="Search elections, states, dates…"
          className="min-h-[52px] w-full rounded-2xl border-2 border-[var(--gb-border)] bg-[var(--gb-surface)] pl-12 pr-4 font-bold text-[var(--gb-text)] focus:border-[var(--gb-blue-hi)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gb-text)]"
        />
      </div>
      {q && (
        // Floats over the page, so the pinned bar keeps its height while you type.
        <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[50vh] overflow-y-auto rounded-2xl border-2 border-[var(--gb-border)] bg-[var(--gb-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
          <ul id={list} role="listbox" aria-label="Search results">
            {hits.map((h, i) => (
              <li key={h.id} id={`${list}-${h.id}`} role="option" aria-selected={i === active} onClick={() => go(h)} onMouseEnter={() => setActive(i)}
                className={`cursor-pointer border-b border-[var(--kyb-chip)] px-4 py-3 last:border-0 ${i === active ? 'bg-[var(--kyb-chip)]' : ''}`}>
                <span className="flex items-center gap-2 font-bold text-[var(--gb-text)]"><i aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: h.ink }} />{h.title}</span>
                <span className="block truncate text-sm text-[var(--gb-text)]">{h.detail}</span>
              </li>
            ))}
          </ul>
          {!hits.length && <p className="px-4 py-3 text-[15px]" role="status">No election or guide matches “{q}”.</p>}
        </div>
      )}
    </div>
  );
}
