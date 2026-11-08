import { StateMap } from '../Hero';
import raw from '../data/chicago-2027/outline.json';
import type { Outline } from '../types';

const COLORS = { fill: ['var(--chi-navy)', 'var(--chi-blue)', 'var(--chi-navy)'] as [string, string, string], stroke: 'var(--chi-red)', pin: 'var(--chi-red)', pinStroke: '#FFFFFF' };

/** Chicago's 50 wards in the flag's blues, outlined in its red. */
export function ChicagoMap({ at, className }: { at?: { lat: number; lng: number } | null; className?: string }) {
  return <StateMap outline={raw as Outline} name="Chicago’s 50 wards" colors={COLORS} id="chi" at={at} className={className} strokeWidth={2} />;
}
