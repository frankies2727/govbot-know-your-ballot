import { lazy, Suspense } from 'react';
import { useRoute } from './lib/router';

// One screen per address: /illinois, /michigan, /minnesota and /wisconsin
// (and their /ballot pages) open that state's guide; everything else is the
// pick-your-state page. Each guide loads only when opened, so the home page
// stays light.
const KybHome = lazy(() => import('./KybHome').then((m) => ({ default: m.KybHome })));
const Illinois = lazy(() => import('./KnowYourBallot').then((m) => ({ default: m.KnowYourBallot })));
const Michigan = lazy(() => import('./michigan/KnowYourBallotMichigan').then((m) => ({ default: m.KnowYourBallotMichigan })));
const Minnesota = lazy(() => import('./minnesota/KnowYourBallotMinnesota').then((m) => ({ default: m.KnowYourBallotMinnesota })));
const Wisconsin = lazy(() => import('./wisconsin/KnowYourBallotWisconsin').then((m) => ({ default: m.KnowYourBallotWisconsin })));

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
  const guide = route.match(/^projects\/know-your-ballot-(illinois|michigan|minnesota|wisconsin)(\/|$)/)?.[1];
  const Screen = guide === 'illinois' ? Illinois : guide === 'michigan' ? Michigan : guide === 'minnesota' ? Minnesota : guide === 'wisconsin' ? Wisconsin : KybHome;
  return <Suspense fallback={<Loading />}><Screen /></Suspense>;
}
