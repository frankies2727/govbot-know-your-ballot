// District maps for a state, pre-baked so the browser turns a lat/lng into
// "your districts" without any further request. All from the Census Bureau's
// TIGERweb (official, key-free): the 120th Congress districts, the 2026
// state Senate and House maps, and the counties (which decide which clerk
// runs a voter's election, and in Michigan the Court of Appeals district).
//
// Output per layer: [{ id, rings: [[lng, lat, lng, lat, ...], ...] }]. A point
// is inside a feature when it falls inside an odd number of its rings.

import { getJson, normalizeId, pack, ringsOf, simplify } from '../geo.mjs';

const TIGER = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb';
const query = (fips, service, layer, fields) =>
  `${TIGER}/${service}/MapServer/${layer}/query?where=STATE%3D%27${fips}%27&outFields=${fields}&returnGeometry=true&outSR=4326&f=geojson`;

// ~10 m: far below a geocoder's own error; Michigan's four layers come to ~1.3 MB.
const TOLERANCE = 0.0001;

const layersOf = (fips) => ({
  cd: { url: query(fips, 'Legislative', 0, 'CD120'), id: (p) => p.CD120 },
  sldu: { url: query(fips, 'Legislative', 1, 'SLDU'), id: (p) => p.SLDU },
  sldl: { url: query(fips, 'Legislative', 2, 'SLDL'), id: (p) => p.SLDL },
  county: { url: query(fips, 'State_County', 1, 'BASENAME'), id: (p) => p.BASENAME },
});

/** `fips` is the state's Census code; `counts` how many of each (cd, sldu, sldl, county) it has, so a partial answer is refused. */
export async function buildDistricts(fips, counts) {
  const layers = {};
  for (const [type, { url, id }] of Object.entries(layersOf(fips))) {
    const count = counts[type];
    const fc = await getJson(url);
    if (fc.exceededTransferLimit) throw new Error(`${type}: TIGERweb returned a partial layer`);
    layers[type] = fc.features
      .map((f) => ({ id: normalizeId(id(f.properties)), rings: pack(ringsOf(f.geometry), TOLERANCE) }))
      .filter((f) => f.rings.length && !/^Z+$/.test(f.id)); // TIGER's "not defined" filler
    if (new Set(layers[type].map((f) => f.id)).size !== count) throw new Error(`${type}: expected ${count} districts, got ${layers[type].length}`);
    console.log(`  ${type}: ${layers[type].length}`);
  }
  return { layers };
}

/**
 * A state's outline as an SVG path (for the hero), drawn on a 1000-wide
 * canvas with the aspect ratio of the state's bounding box. From the Census
 * Bureau's generalized (cartographic) state boundary, which is clipped to
 * the shoreline: the plain TIGER boundary runs out into the Great Lakes, so
 * Michigan came out as one blob and Illinois with a square lake corner.
 * Islands smaller than a few points are left off. Coarse on purpose: it's
 * a picture, not a map. `fips` is the state's Census code (Michigan 26,
 * Illinois 17).
 */
const GENERALIZED_STATES = 'https://tigerweb.geo.census.gov/arcgis/rest/services/Generalized_ACS2023/State_County/MapServer/7/query';
export async function buildOutline(fips = '26') {
  const res = await getJson(`${GENERALIZED_STATES}?where=GEOID%3D%27${fips}%27&outFields=GEOID&returnGeometry=true&outSR=4326&f=json`);
  const raw = res.features?.[0]?.geometry?.rings;
  if (!raw?.length) throw new Error(`no generalized boundary for state ${fips}`);
  const rings = raw.map((r) => simplify(r, 0.01)).filter((r) => r.length >= 12);
  const xs = rings.flat().map(([x]) => x);
  const ys = rings.flat().map(([, y]) => y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const kx = 1000 / (x1 - x0);
  // A degree of latitude is longer on the ground than a degree of longitude (by 1/cos of the latitude).
  const ky = kx / Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
  const height = Math.round((y1 - y0) * ky);
  const path = rings.map((r) => `M${r.map(([x, y]) => `${((x - x0) * kx).toFixed(0)} ${((y1 - y) * ky).toFixed(0)}`).join('L')}Z`).join('');
  // The bounding box and scales, so the app can place a point on the outline.
  return { width: 1000, height, path, bbox: [+x0.toFixed(4), +y0.toFixed(4), +x1.toFixed(4), +y1.toFixed(4)], kx: +kx.toFixed(3), ky: +ky.toFixed(3) };
}
