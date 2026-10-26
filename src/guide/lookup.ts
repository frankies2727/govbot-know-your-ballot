import { getMaps, lookIn, type Maps } from '../lookup';
import type { AreaType, Districts, Race } from '../types';
import type { StateData } from './types';

// Address -> coordinates -> districts, for a whole-state guide. Photon
// (komoot's OpenStreetMap geocoder) is key-free, allows browser requests and
// answers fast; Nominatim stands in when it's down. Both are limited to the
// state's box so "Main St" lands in state.
const PHOTON = 'https://photon.komoot.io/api/';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 10_000;

export interface Place { lat: number; lng: number; label: string }

export interface LookupSpec {
  /** The pre-baked district maps (districts.json). */
  mapsUrl: string;
  /** West, south, east, north. */
  bbox: [number, number, number, number];
  /** "MI" and "Michigan": how the geocoders name the state. */
  abbr: string;
  name: string;
  /** Anything the state adds to the matched districts (Michigan's Court of Appeals district and Minnesota's judicial district, from the county). */
  decorate?: (d: Districts, data: StateData) => void;
}

export function makeLookup(spec: LookupSpec) {
  const inState = new RegExp(`\\b(${spec.abbr}|${spec.name})\\b|\\d{5}`, 'i');
  // Anything not naming a town or ZIP is pinned to the state.
  const withState = (address: string) => (inState.test(address) ? address : `${address}, ${spec.name}`);

  async function photon(address: string): Promise<Place | null> {
    const url = `${PHOTON}?q=${encodeURIComponent(withState(address))}&limit=1&lang=en&bbox=${spec.bbox.join(',')}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Photon: ${res.status}`);
    const { features } = (await res.json()) as { features: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[] };
    const hit = features[0];
    if (!hit || hit.properties.state !== spec.abbr && hit.properties.state !== spec.name) return null;
    const p = hit.properties;
    const street = [p.housenumber, p.street ?? p.name].filter(Boolean).join(' ');
    return { lat: hit.geometry.coordinates[1], lng: hit.geometry.coordinates[0], label: [street, p.city ?? p.county].filter(Boolean).join(', ') || 'Your address' };
  }

  async function openStreetMap(address: string): Promise<Place | null> {
    const [w, s, e, n] = spec.bbox;
    const url = `${NOMINATIM}?format=jsonv2&limit=1&countrycodes=us&viewbox=${w},${n},${e},${s}&bounded=1&q=${encodeURIComponent(withState(address))}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Nominatim: ${res.status}`);
    const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name.split(',').slice(0, 2).join(',') } : null;
  }

  async function geocode(address: string): Promise<Place | null> {
    try {
      return await photon(address);
    } catch {
      return openStreetMap(address); // Photon down: the slower fallback
    }
  }

  // Coordinates -> districts, against the pre-baked maps (Congress, the
  // legislature, county), loaded on demand so people who only browse never
  // download them. A failed download (flaky connection) is forgotten so the
  // next lookup retries.
  let maps: Maps | null = null;
  const prefetchDistricts = () => (maps ??= getMaps(spec.mapsUrl).catch((e) => { maps = null; throw e; }));

  /** The voter's districts; empty outside the state. */
  async function districtsAt(lat: number, lng: number, data: StateData): Promise<Districts> {
    const d = await lookIn(prefetchDistricts(), lat, lng);
    spec.decorate?.(d, data);
    return d;
  }

  return { geocode, prefetchDistricts, districtsAt };
}

/** Every address in the state is in a state House district. */
export const inState = (d: Districts) => Boolean(d.sldl);

// Districts -> the contests on this voter's ballot. Ballot questions are statewide.
const raceApplies = (race: Race, d: Districts | null) => !race.area || !d || d[race.area.type] === race.area.id;

export function ballotFor(data: StateData, d: Districts | null) {
  return { races: data.races.filter((r) => raceApplies(r, d)), retentions: [], measures: data.measures };
}

/**
 * Browsing a county with no address: the statewide races and questions, the
 * county's own appellate district where the state has them, and every
 * congressional and legislative district that reaches into the county (an
 * address would pick one of each).
 */
export function ballotForCounty(data: StateData, county: string) {
  const here = new Set(data.counties?.[county] ?? []);
  // The districts a whole county sits in, where the state has them.
  const ofCounty: Partial<Record<AreaType, string | undefined>> = { coa: data.coa?.[county], jd: data.jd?.[county] };
  return {
    races: data.races.filter((r) => (!r.area ? true : r.area.type in ofCounty ? r.area.id === ofCounty[r.area.type] : here.has(`${r.area.type}:${r.area.id}`))),
    retentions: [],
    measures: data.measures,
  };
}

export function ballotIdsFor(data: StateData, d: Districts | null): Set<string> {
  const b = ballotFor(data, d);
  return new Set([...b.races, ...b.measures].map((x) => x.id));
}
