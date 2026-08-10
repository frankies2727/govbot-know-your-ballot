import { useEffect, useState } from 'react';

// A tiny path-based router (no dependency) so each screen has its own URL under
// the site's base — e.g. /Games/, /Games/projects, /Games/projects/ai-art,
// /Games/play/crossword. Deep links and the browser back/forward button work;
// a public/404.html fallback restores the path on a hard load (GitHub Pages
// serves static files and would otherwise 404 on a non-root path).
//
// Routes are the path *after* the Vite base ("/Games/"), with no surrounding
// slashes: "" (home), "projects", "projects/<id>", "play/<gameId>".

const BASE = import.meta.env.BASE_URL; // e.g. "/Games/" (always ends in "/")

export function currentRoute(): string {
  let p = window.location.pathname;
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  else {
    const bare = BASE.replace(/\/$/, '');
    if (bare && p.startsWith(bare)) p = p.slice(bare.length);
  }
  return p.replace(/^\/+|\/+$/g, '');
}

export function navigate(route: string): void {
  const clean = route.replace(/^\/+|\/+$/g, '');
  const url = clean ? BASE + clean : BASE;
  if (url !== window.location.pathname) {
    window.history.pushState({}, '', url);
    // pushState doesn't emit popstate; nudge listeners so the app re-renders.
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
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
