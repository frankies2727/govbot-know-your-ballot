import { Check, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { GuideId } from './hosts';
import { CANDIDATE_ROUTE, candidatePath, nameSlug } from './lib/candidateLink';
import { navigate, useRoute } from './lib/router';
import type { Candidate, Race } from './types';

// A candidate's own address, in the app: the Share button that gives it out,
// and the guide opening that candidate's profile when the page is opened at it.

/** The guide on screen, from the route ("projects/know-your-ballot-chicago-2027/…"). */
const guideOf = (route: string) => route.match(/^projects\/know-your-ballot-([a-z0-9-]+)/)?.[1] as GuideId | undefined;

/**
 * Opens the profile the address names (/…/candidates/<race>/<name>), on first
 * load and on Back/Forward; an address naming no one goes back to the guide.
 * Returns what the profile calls when it closes: the address goes back to the
 * guide's own, so a reload doesn't reopen it.
 */
export function useCandidateRoute(guide: GuideId, races: Race[], open: (race: Race, c: Candidate) => void) {
  const route = useRoute();
  const latest = useRef(route);
  latest.current = route;
  useEffect(() => {
    const m = route.match(CANDIDATE_ROUTE);
    if (!m || m[1] !== guide) return;
    const race = races.find((r) => r.id === m[2]);
    const c = race?.candidates.find((x) => nameSlug(x.name) === m[3]);
    if (!race || !c) { navigate(`projects/know-your-ballot-${guide}`, { replace: true }); return; }
    open(race, c);
    // The tab's title matches the candidate's own page (the guide's comes back on close).
    const was = document.title;
    document.title = `${c.name}: candidate for ${race.office} · Know Your Ballot`;
    return () => { document.title = was; };
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps
  return () => { if (CANDIDATE_ROUTE.test(latest.current)) navigate(`projects/know-your-ballot-${guide}`, { replace: true }); };
}

/**
 * Share a candidate's own page: the phone's share sheet where there is one,
 * otherwise the link is copied.
 */
export function ShareCandidate({ race, c, className = '' }: { race: Race; c: Candidate; className?: string }) {
  const guide = guideOf(useRoute());
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(false), 1800); return () => clearTimeout(t); }, [copied]);
  if (!guide) return null;
  const url = `${location.origin}${candidatePath(guide, race.id, c.name)}`;
  const share = async () => {
    const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.share) {
      try { await navigator.share({ title: `${c.name} · ${race.office}`, text: `${c.name}, candidate for ${race.office}: money, record, their own words and sources.`, url }); } catch { /* closed */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); } catch { window.prompt('Copy this link:', url); }
  };
  return (
    <button type="button" onClick={share} aria-label={`Share ${c.name}’s page`}
      className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-2 border-[var(--gb-text)] px-3 font-bold text-[var(--gb-text)] hover:bg-[var(--kyb-chip)] ${className}`}>
      {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span>
    </button>
  );
}
