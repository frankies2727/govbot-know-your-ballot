import { useState } from 'react';
import { ChevronDown, Pause, Play } from 'lucide-react';
import { guidePath } from './hosts';
import { navigate } from './lib/router';
import { useDocumentMeta } from './Bits';
import ilOutline from './data/illinois/outline.json';
import { BallotBox } from './BallotBox';
import { GoVote } from './GoVote';
import { GovbotChrome } from './GovbotChrome';
import { HomeSearch } from './HomeSearch';
import { LandingBar, type LandingItem } from './LandingBar';
import { StateMap } from './Hero';
import { Elections } from './Elections';
import { ELECTIONS, NOV_3, STATE_INK, type StateId } from './electionIndex';
import { Turnout } from './Turnout';
import { MichiganMap } from './michigan/Hero';
import { MinnesotaMap } from './minnesota/Hero';
import { WisconsinMap } from './wisconsin/Hero';
import type { Outline } from './types';
import './ballot.css';
import './michigan/michigan.css';
import './minnesota/minnesota.css';
import './wisconsin/wisconsin.css';
import './home.css';

/** What a state's guide covers: its latest election's description. */
const covers = (id: StateId) => ELECTIONS.find((e) => e.state === id && e.date === NOV_3)!.what;

const IL_MAP = { fill: ['var(--gb-blue-hi)', 'var(--gb-primary)', 'var(--gb-blue)'] as [string, string, string], stroke: 'var(--kyb-gold)', pin: 'var(--kyb-gold)', pinStroke: 'var(--gb-bg)' };

const REPO = 'https://github.com/frankies2727/govbot-know-your-ballot';
/** States with a tracking issue (research, then build) and no guide yet. */
const COMING = [{ name: 'Ohio', issue: 8 }, { name: 'Pennsylvania', issue: 9 }, { name: 'Georgia', issue: 11 }];

const STATES = [
  { id: 'illinois' as const, name: 'Illinois', ink: STATE_INK.illinois, covers: covers('illinois'), map: <StateMap outline={ilOutline as Outline} name="Illinois" colors={IL_MAP} id="il-home" /> },
  { id: 'michigan' as const, name: 'Michigan', ink: STATE_INK.michigan, covers: covers('michigan'), map: <MichiganMap /> },
  { id: 'minnesota' as const, name: 'Minnesota', ink: STATE_INK.minnesota, covers: covers('minnesota'), map: <MinnesotaMap /> },
  { id: 'wisconsin' as const, name: 'Wisconsin', ink: STATE_INK.wisconsin, covers: covers('wisconsin'), map: <WisconsinMap /> },
];

/** The page's parts for the pinned bar's contents, in page order. */
const PARTS: LandingItem[] = [
  { id: 'kyb-intro', emoji: '🗳️', label: 'Know Your Ballot' },
  { id: 'elections', emoji: '📅', label: 'Elections' },
  { id: 'pick', emoji: '🗺️', label: 'November 2026 Midterms', short: 'Nov 2026 Midterms', sub: STATES.map((s) => ({ id: `kyb-home-${s.id}`, emoji: '📍', label: s.name, color: s.ink })) },
  { id: 'kyb-open', emoji: '🤝', label: 'Built by and for everyone', short: 'Get involved' },
];
/** Clear of the pinned bar where the contents jumps (the page's scroll padding already clears govbot's header). */
const UNDER_BAR = 'scroll-mt-[var(--kyb-bar,0px)]';

/** A plain click opens the page in the app; a modified one (new tab, window) is left to the browser. */
const openIn = (route: string) => (e: React.MouseEvent) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); navigate(route); };

const LINK = 'underline decoration-2 underline-offset-4 font-semibold text-[var(--gb-text)] hover:text-[var(--gb-link)]';

/** The root of the Know Your Ballot site: the elections we cover, by year, and a way into each state's guide at /illinois, /michigan, /minnesota or /wisconsin. */
export function KybHome() {
  useDocumentMeta('Know Your Ballot');
  const [paused, setPaused] = useState(false);
  return (
    <GovbotChrome>
      <div className="kyb min-h-[100dvh] bg-[var(--gb-bg)] text-[var(--gb-text)]">
        <div className="mx-auto max-w-[1920px] px-4 pb-28 pt-3 sm:px-[clamp(1.5rem,4vw,4rem)] sm:pt-4">
          <LandingBar items={PARTS} searchLabel="Search elections and state guides" search={(slot) => <HomeSearch {...slot} />} />
          <section id="kyb-intro" className={`mt-8 grid sm:mt-10 ${UNDER_BAR} items-center gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:gap-12`}>
            <div className="max-w-[52ch] space-y-6 text-[17px] leading-relaxed">
              <h1 className="font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight text-balance sm:text-[3.4rem] lg:text-[3.9rem]">Know what&rsquo;s on your entire ballot before you vote.</h1>
              <p className="text-pretty text-xl leading-snug">Here we show what each race is, who&rsquo;s running, who&rsquo;s funding them, what every question means, and more. Find the election you&rsquo;re voting in, or look back at a past one.</p>
              <p>
                <a href="#elections" className="inline-flex min-h-[48px] items-center rounded-full bg-[var(--gb-primary)] px-6 text-[16px] font-bold text-[var(--gb-on-primary)] no-underline hover:bg-[var(--gb-primary-hi)] focus-visible:outline-[var(--gb-text)]">Browse the elections</a>
              </p>
              <p className="text-[15px]">Free, non-partisan and open source. Nothing about you is kept: no names, no cookies, no tracking.</p>
            </div>
            <div className="relative mx-auto w-full max-w-[640px]">
              <BallotBox className={paused ? 'kyb-box-paused' : ''} />
              <GoVote className={`pointer-events-none absolute bottom-[2%] left-0 w-[42%] lg:-left-[5%] lg:w-[47%] ${paused ? 'kyb-box-paused' : ''}`} />
              <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}
                className="absolute bottom-0 right-0 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--gb-border-strong)] bg-[var(--gb-surface)] px-3 text-[13px] font-bold hover:bg-[var(--kyb-chip)]">
                {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                {paused ? 'Play animation' : 'Pause animation'}
              </button>
            </div>
          </section>

          <Elections />

          {/* One section per election the guides cover, each folding away (the newest open), so the page holds every year's states without growing endlessly. */}
          <section id="pick" aria-label="State guides by election" className={`mt-16 space-y-6 sm:mt-24 ${UNDER_BAR}`}>
            <details open className="kyb-cycle">
              <summary className="kyb-cycle-head">
                <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">November 2026 Midterms</h2>
                <ChevronDown className="kyb-cycle-chev h-7 w-7 shrink-0" aria-hidden="true" />
              </summary>
              <p className="mt-2 max-w-[60ch] text-[17px]">Each state&rsquo;s guide, and how many voted in 2026 and in every general election since 2014.</p>
              {/* Each card is three rows of one subgrid (the map and name, the full-ballot link, the turnout), so cards in a row match in height and their parts line up. */}
              <ul className="mt-6 grid grid-cols-2 gap-x-4 lg:grid-cols-4" aria-label="States with a guide">
                {STATES.map((s) => (
                  <li key={s.id} id={`kyb-home-${s.id}`} className={`kyb-card row-span-3 grid grid-rows-subgrid ${UNDER_BAR}`} style={{ '--ink': s.ink } as React.CSSProperties}>
                    <a href={guidePath(s.id)} onClick={openIn(`projects/know-your-ballot-${s.id}`)} className="kyb-tile h-full">
                      <span className="flex h-[140px] items-end justify-center sm:h-[160px]">{s.map}</span>
                      <span className="kyb-tile-name block font-serif text-[1.6rem] font-medium leading-tight sm:text-[1.9rem]">{s.name}</span>
                      <span className="block text-[15px] leading-snug">{s.covers}</span>
                    </a>
                    <p className="kyb-card-act">
                      <a href={guidePath(s.id, true)} onClick={openIn(`projects/know-your-ballot-${s.id}/ballot`)}>See full ballot<span className="sr-only"> for {s.name}</span> <span aria-hidden="true">→</span></a>
                    </p>
                    <Turnout state={s.id} name={s.name} ink={s.ink} />
                  </li>
                ))}
              </ul>
            </details>
            <p className="max-w-[60ch] text-[15px]">
              {COMING.map((c, i) => (
                <span key={c.name}>
                  <a className={LINK} href={`${REPO}/issues/${c.issue}`} target="_blank" rel="noopener">{c.name}</a>
                  {i < COMING.length - 2 ? ', ' : i === COMING.length - 2 ? ' and ' : ''}
                </span>
              ))}
              {' '}are being researched now. Each link is the work in progress, and how to join it.
            </p>
          </section>

          <section id="kyb-open" aria-labelledby="open-h" className={`mt-16 ${UNDER_BAR} grid gap-6 border-t border-[var(--gb-border)] pt-10 sm:mt-24 lg:grid-cols-2 lg:gap-12`}>
            <h2 id="open-h" className="font-serif text-3xl font-medium leading-tight sm:text-4xl">Built by and for everyone</h2>
            <div className="max-w-[56ch] space-y-5 text-[17px] leading-relaxed">
              <p>Everything shown comes from an official or documented public source, named next to it. Nothing is rated or editorialized.</p>
              <p>You can bring a state here sooner by researching where its candidate lists, campaign money and district maps live, adding a photo, translating a guide, or telling us when something is wrong. No code needed. <a className={LINK} href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener">How to contribute</a> or <a className={LINK} href={`${REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22`} target="_blank" rel="noopener">pick something to help with</a>.</p>
              <p className="text-[15px]"><a className={LINK} href="https://chihacknight.github.io/govbot/" target="_blank" rel="noopener">Built on Govbot</a>, Chi Hack Night&rsquo;s open civic data.</p>
            </div>
          </section>
        </div>
      </div>
    </GovbotChrome>
  );
}
