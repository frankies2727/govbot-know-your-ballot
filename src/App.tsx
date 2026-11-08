import { lazy, Suspense } from 'react';
import { useRoute } from './lib/router';
import { Pulse } from './Pulse';

// One screen per address: each guide's (/2026-11/michigan, /2027-02/chicago
// and their /ballot pages, src/hosts.ts) opens it; everything else is the
// home page. Each guide loads only when opened, so the home page
// stays light.
const KybHome = lazy(() => import('./KybHome').then((m) => ({ default: m.KybHome })));
const Illinois = lazy(() => import('./KnowYourBallot').then((m) => ({ default: m.KnowYourBallot })));
const Michigan = lazy(() => import('./michigan/KnowYourBallotMichigan').then((m) => ({ default: m.KnowYourBallotMichigan })));
const Minnesota = lazy(() => import('./minnesota/KnowYourBallotMinnesota').then((m) => ({ default: m.KnowYourBallotMinnesota })));
const Wisconsin = lazy(() => import('./wisconsin/KnowYourBallotWisconsin').then((m) => ({ default: m.KnowYourBallotWisconsin })));
const Chicago2027 = lazy(() => import('./chicago-2027/KnowYourBallotChicago2027').then((m) => ({ default: m.KnowYourBallotChicago2027 })));
const Jacksonville2027 = lazy(() => import('./jacksonville-2027/KnowYourBallotJacksonville2027').then((m) => ({ default: m.KnowYourBallotJacksonville2027 })));
const Denver2027 = lazy(() => import('./denver-2027/KnowYourBallotDenver2027').then((m) => ({ default: m.KnowYourBallotDenver2027 })));
const Wisconsin2027 = lazy(() => import('./wisconsin-2027/KnowYourBallotWisconsin2027').then((m) => ({ default: m.KnowYourBallotWisconsin2027 })));

function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-white/10 border-t-[#3DDC84] rounded-full animate-spin" />
      <p className="text-gray-100 font-mono text-sm uppercase tracking-widest">Loading…</p>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const guide = route.match(/^projects\/know-your-ballot-(illinois|michigan|minnesota|wisconsin|chicago-2027|jacksonville-2027|denver-2027|wisconsin-2027)(\/|$)/)?.[1];
  const Screen = guide === 'illinois' ? Illinois : guide === 'michigan' ? Michigan : guide === 'minnesota' ? Minnesota : guide === 'wisconsin' ? Wisconsin : guide === 'chicago-2027' ? Chicago2027 : guide === 'jacksonville-2027' ? Jacksonville2027 : guide === 'denver-2027' ? Denver2027 : guide === 'wisconsin-2027' ? Wisconsin2027 : KybHome;
  return <><Suspense fallback={<Loading />}><Screen /></Suspense><Pulse compact={!!guide} /></>;
}
