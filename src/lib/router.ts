import { useEffect, useState } from 'react';

// A tiny path-based router (no dependency). Each state's guide has a short
// address: /illinois is its landing page, /illinois/ballot the ballot (the
// same for /michigan), and the root is the pick-your-state page. Inside the
// app a route is "projects/know-your-ballot-<state>[/ballot]", the name the
// guides have always used (saved picks and resume links carry it); only the
// address differs. Deep links and the browser's Back button work; vercel.json
// sends every path to the app.

const BASE = '/';
const KYB = 'projects/know-your-ballot-';
const toRoute = (path: string) => (/^(illinois|michigan)(\/|$)/.test(path) ? KYB + path : path);
const toPath = (route: string) => (route.startsWith(KYB) ? route.slice(KYB.length) : route);

export function currentRoute(): string {
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
