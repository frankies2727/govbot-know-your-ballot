/** A count in a few characters: 1,003 → "1.00k", 2,842,099 → "2.84M", 1.2 billion → "1.20B"; under 1,000 it is written out. */
export function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  for (const [size, unit] of [[1e3, 'k'], [1e6, 'M'], [1e9, 'B'], [1e12, 'T']] as const) {
    const v = (n / size).toFixed(2);
    // 999,999 rounds to "1000.00k": say "1.00M" instead.
    if (Math.abs(Number(v)) < 1000 || unit === 'T') return `${v}${unit}`;
  }
  return String(n);
}
