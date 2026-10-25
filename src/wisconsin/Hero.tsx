import { StateMap } from '../Hero';
import raw from '../data/wisconsin/outline.json';
import type { Outline } from '../types';

const COLORS = { fill: ['var(--wi-navy)', 'var(--wi-lake)', 'var(--wi-forest)'] as [string, string, string], stroke: 'var(--wi-gold)', pin: 'var(--wi-gold)', pinStroke: 'var(--wi-navy)' };

/** Wisconsin in navy, lake blue and forest green. */
export function WisconsinMap({ at, className }: { at?: { lat: number; lng: number } | null; className?: string }) {
  return <StateMap outline={raw as Outline} name="Wisconsin" colors={COLORS} id="wi" at={at} className={className} />;
}
