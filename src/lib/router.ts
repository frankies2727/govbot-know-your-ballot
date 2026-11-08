import { useEffect, useState } from 'react';
import { GUIDE_PATHS, GUIDE_STATES } from '../hosts';

// A tiny path-based router (no dependency). Each guide has an address naming
// its election and place (src/hosts.ts): /2026-11/illinois is a landing page,
// /2026-11/illinois/ballot its ballot, /2027-02/chicago Chicago's 2027 city
// election; the root is the elections page. The old /illinois addresses still
// open the guide and are rewritten to the new ones (the server redirects them
// too, vercel.json). Inside the app a route is
// "projects/know-your-ballot-<guide id>[/ballot]", the name the guides have
// always used (saved picks and resume links carry it); only the address
// differs. Deep links and the browser's Back button work.

const BASE = '/';
const KYB = 'projects/know-your-ballot-';
// Longest first, so no guide's address or id is read as the start of another's.
const GUIDES = (Object.entries(GUIDE_PATHS) as [string, string][]).sort((a, b) => b[1].length - a[1].length || b[0].length - a[0].length);
const STATES = new RegExp(`^(${GUIDE_STATES.join('|')})(/.*)?$`);
/** An address -> the app's route ("2027-02/chicago/ballot" -> "projects/know-your-ballot-chicago-2027/ballot"); a state's old address too. */
const toRoute = (path: string) => {
  for (const [id, at] of GUIDES) if (path === at || path.startsWith(`${at}/`)) return KYB + id + path.slice(at.length);
  const old = path.match(STATES);
  return old ? KYB + old[1] + (old[2] ?? '') : path;
};
/** A route -> its address. */
const toPath = (route: string) => {
  if (!route.startsWith(KYB)) return route;
  const rest = route.slice(KYB.length);
  const hit = GUIDES.find(([id]) => rest === id || rest.startsWith(`${id}/`));
  return hit ? hit[1] + rest.slice(hit[0].length) : route;
};

/** A guide opened at its old address (/michigan) moves to its new one (/2026-11/michigan), keeping the query and the #. */
function canonical() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const route = toRoute(path);
  if (!route.startsWith(KYB) || path === toPath(route)) return;
  window.history.replaceState(window.history.state, '', BASE + toPath(route) + window.location.search + window.location.hash);
}

export function currentRoute(): string {
  canonical();
  return toRoute(window.location.pathname.replace(/^\/+|\/+$/g, ''));
}

// `replace` swaps the current history entry instead of adding one, for
// canonicalising a legacy URL, so Back doesn't bounce into a redirect.
export function navigate(route: string, opts?: { replace?: boolean }): void {
  const clean = toPath(route.replace(/^\/+|\/+$/g, ''));
  const url = clean ? BASE + clean : BASE;
  if (url !== window.location.pathname) {
    if (opts?.replace) window.history.replaceState({}, '', url);
    else window.history.pushState({}, '', url);
    // pushState/replaceState don't emit popstate; nudge listeners so the app re-renders.
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

/** The address of a route, for a plain link (a new tab, a share). */
export function routeHref(route: string): string {
  const clean = toPath(route.replace(/^\/+|\/+$/g, ''));
  return clean ? BASE + clean : BASE;
}

export function useRoute(): string {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const onPop = () => setRoute(currentRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return route;
}
