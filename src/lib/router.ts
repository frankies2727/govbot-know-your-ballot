import { useEffect, useState } from 'react';
import { GUIDE_CYCLE } from '../hosts';

// A tiny path-based router (no dependency). Each state's guide has an address
// naming its election: /2026-11/illinois is its landing page,
// /2026-11/illinois/ballot the ballot (the same for Michigan, Minnesota and
// Wisconsin), and the root is the elections page. The old /illinois
// addresses still open the guide and are rewritten to the new ones (the
// server redirects them too, vercel.json). Inside the app a route is
// "projects/know-your-ballot-<state>[/ballot]", the name the guides have
// always used (saved picks and resume links carry it); only the address
// differs. Deep links and the browser's Back button work.

const BASE = '/';
const KYB = 'projects/know-your-ballot-';
const GUIDE = new RegExp(`^(?:${GUIDE_CYCLE}/)?((?:illinois|michigan|minnesota|wisconsin)(?:/.*)?)$`);
const toRoute = (path: string) => { const m = path.match(GUIDE); return m ? KYB + m[1] : path; };
const toPath = (route: string) => (route.startsWith(KYB) ? `${GUIDE_CYCLE}/${route.slice(KYB.length)}` : route);

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
