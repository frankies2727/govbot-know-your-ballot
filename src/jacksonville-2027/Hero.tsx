import { StateMap } from '../Hero';
import raw from '../data/jacksonville-2027/outline.json';
import type { Outline } from '../types';

const COLORS = { fill: ['var(--jax-navy)', 'var(--jax-teal)', 'var(--jax-navy)'] as [string, string, string], stroke: 'var(--jax-gold)', pin: 'var(--jax-gold)', pinStroke: '#FFFFFF' };

/** Jacksonville's 14 council districts, all of Duval County, in river navy and teal, outlined in gold. */
export function JacksonvilleMap({ at, className }: { at?: { lat: number; lng: number } | null; className?: string }) {
  return <StateMap outline={raw as Outline} name="Jacksonville’s 14 council districts" colors={COLORS} id="jax" at={at} className={className} strokeWidth={2} />;
}
