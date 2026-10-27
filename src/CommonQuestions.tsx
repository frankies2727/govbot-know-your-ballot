import { ChevronDown } from 'lucide-react';
import { HOW, type StateSlug } from './seo/copy';
import type { Faq } from './seo/faq';

/** The "How a … ballot works" paragraphs, from the one copy in src/seo/copy.ts (the same words a crawler reads in the page). */
export function HowItems({ slug }: { slug: StateSlug }) {
  return <>{HOW[slug].map((i) => <p key={i.lead}><strong>{i.lead}</strong> {i.text}</p>)}</>;
}

/** The questions voters ask, answered from the app's own sourced data and copy (src/seo/faq.ts); the page's FAQ structured data says exactly these words. */
export function CommonQuestions({ items }: { items: Faq[] }) {
  return (
    <section id="kyb-faq" aria-labelledby="kyb-faq-h" className="space-y-3">
      <h2 id="kyb-faq-h" className="text-2xl font-black">Common questions</h2>
      <ul className="space-y-2">
        {items.map((f) => (
          <li key={f.q}>
            <details className="group rounded-xl border-2 border-[var(--gb-border-strong)] bg-[var(--gb-surface)] px-4">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 py-2 font-bold">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-3 leading-relaxed">{f.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
