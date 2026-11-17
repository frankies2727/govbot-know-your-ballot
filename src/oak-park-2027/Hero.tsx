import { StateMap } from '../Hero';
import raw from '../data/oak-park-2027/outline.json';
import type { Outline } from '../types';

const COLORS = { fill: ['var(--op-green)', '#3E7A4C', 'var(--op-green)'] as [string, string, string], stroke: 'var(--op-gold)', pin: 'var(--op-brick)', pinStroke: '#FFFFFF' };

/** Oak Park's 32 voting precincts, in oak green, outlined in acorn gold. */
export function OakParkMap({ at, className }: { at?: { lat: number; lng: number } | null; className?: string }) {
  return <StateMap outline={raw as Outline} name="Oak Park’s 32 voting precincts" colors={COLORS} id="op" at={at} className={className} strokeWidth={1.5} />;
}
