import { StateMap } from '../Hero';
import raw from '../data/denver-2027/outline.json';
import type { Outline } from '../types';

const COLORS = { fill: ['var(--den-blue)', '#3A66C4', 'var(--den-blue)'] as [string, string, string], stroke: 'var(--den-gold)', pin: 'var(--den-red)', pinStroke: '#FFFFFF' };

/** Denver's 11 council districts in the flag's blue, outlined in its gold. */
export function DenverMap({ at, className }: { at?: { lat: number; lng: number } | null; className?: string }) {
  return <StateMap outline={raw as Outline} name="Denver’s 11 council districts" colors={COLORS} id="den" at={at} className={className} strokeWidth={2} />;
}
