import { StateMap } from '../Hero';
import raw from '../data/minnesota/outline.json';
import type { Outline } from '../types';

const COLORS = { fill: ['var(--mn-blue)', 'var(--mn-teal)', 'var(--mn-green)'] as [string, string, string], stroke: 'var(--mn-gold)', pin: 'var(--mn-gold)', pinStroke: 'var(--mn-blue)' };

/** Minnesota in its blue, teal and green. */
export function MinnesotaMap({ at, className }: { at?: { lat: number; lng: number } | null; className?: string }) {
  return <StateMap outline={raw as Outline} name="Minnesota" colors={COLORS} id="mn" at={at} className={className} />;
}
