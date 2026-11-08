// District maps for the city guides (Chicago, Denver, Jacksonville): reading a
// city's official boundary layer from its ArcGIS server into the lookup's
// format, and drawing the hero's outline from it.

const UA = 'KnowYourBallot/1.0 (+https://github.com/frankies2727/govbot-know-your-ballot)';

/**
 * Every polygon in an ArcGIS feature layer, as the lookup reads them
 * (src/lookup.ts): [{ id, rings: [[lng, lat, lng, lat, …], …] }], in
 * longitude/latitude to 5 decimals (about a metre), simplified to ~10 m.
 * `id` names the feature from its attributes; a feature it returns no id for
 * is left out.
 */
export async function readLayer(url, id) {
  const q = new URLSearchParams({ where: '1=1', outFields: '*', outSR: '4326', geometryPrecision: '5', maxAllowableOffset: '0.0001', f: 'json' });
  const res = await fetch(`${url}/query?${q}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`${url}: ${body.error.message}`);
  const out = [];
  for (const f of body.features) {
    const key = id(f.attributes);
    if (key == null || !f.geometry?.rings) continue;
    const rings = f.geometry.rings.map((r) => r.flat());
    const same = out.find((x) => x.id === key); // one district drawn as several features
    if (same) same.rings.push(...rings); else out.push({ id: String(key), rings });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}

/**
 * The hero's map: a city's districts (the lookup's own map), in the
 * projection the state outlines use, 600 px wide. Points closer than ~2 px to
 * the last kept one are dropped, which keeps the file small and the lines
 * clean.
 */
export function outlineOf(layer) {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const w of layer) for (const r of w.rings) for (let i = 0; i < r.length; i += 2) {
    x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]);
  }
  const kx = 600 / (x1 - x0);
  const ky = kx / Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
  const path = layer.flatMap((w) => w.rings).map((r) => {
    const out = [];
    for (let i = 0; i < r.length; i += 2) {
      const p = [Math.round((r[i] - x0) * kx), Math.round((y1 - r[i + 1]) * ky)];
      const last = out[out.length - 1];
      if (!last || Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) >= 2) out.push(p);
    }
    return out.length > 2 ? `M${out.map((p) => p.join(' ')).join('L')}Z` : '';
  }).join('');
  return { width: 600, height: Math.round((y1 - y0) * ky), path, bbox: [+x0.toFixed(4), +y0.toFixed(4), +x1.toFixed(4), +y1.toFixed(4)], kx: +kx.toFixed(3), ky: +ky.toFixed(3) };
}
