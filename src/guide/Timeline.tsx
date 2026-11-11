import { Check } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { KeyDate } from '../dates';
import { dayLabel } from '../dates';
import { daysUntil, useNow } from '../store';

// The road to Election Day on a guide's landing page: every key date as a
// step, the ones behind checked off and the next one marked (and scrolled
// into view on a phone). The same dates as the Plan tab's list, from the
// guide's dates.ts.

export function ElectionTimeline({ dates, source }: { dates: KeyDate[]; source: { name: string; url: string } }) {
  const now = useNow();
  const row = useRef<HTMLOListElement>(null);
  const next = dates.findIndex((d) => daysUntil(d.date, now) >= 0);
  // Bring the next step into the strip's view, without moving the page.
  useEffect(() => {
    const ol = row.current;
    const li = next >= 0 ? (ol?.children[next] as HTMLElement | undefined) : undefined;
    if (ol && li) ol.scrollLeft = Math.max(0, li.offsetLeft - ol.offsetLeft - 16);
  }, [next]);
  if (!dates.length) return null;
  return (
    <section aria-labelledby="kyb-timeline" className="space-y-3">
      <h2 id="kyb-timeline" className="text-2xl font-black">The road to Election Day</h2>
      <ol ref={row} className="kyb-tl" aria-label="Key dates, in order" tabIndex={0}>
        {dates.map((d, i) => {
          const state = next < 0 || i < next ? 'done' : i === next ? 'next' : 'ahead';
          return (
            <li key={d.id} className={`kyb-tl-step is-${state}`} aria-current={state === 'next' ? 'step' : undefined}>
              <span className="kyb-tl-dot" aria-hidden="true">{state === 'done' && <Check className="w-3.5 h-3.5" strokeWidth={3.5} />}</span>
              <p className="mt-2 text-sm font-black">{dayLabel(d.date)}{state === 'next' && <span className="sr-only"> (next)</span>}</p>
              <p className="font-bold leading-snug">{d.title}</p>
              {state === 'next' && d.detail && <p className="mt-1 text-sm leading-snug">{d.detail}</p>}
            </li>
          );
        })}
      </ol>
      <p className="text-sm">From the <a className="font-bold underline text-[var(--gb-link)]" href={source.url} target="_blank" rel="noreferrer noopener">{source.name} ↗</a>. Add any of them to your calendar in Plan to vote.</p>
    </section>
  );
}
