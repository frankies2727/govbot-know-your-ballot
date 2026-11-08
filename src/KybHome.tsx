import { useState } from 'react';
import { ChevronDown, Pause, Play } from 'lucide-react';
import { guidePath } from './hosts';
import { navigate } from './lib/router';
import { BackToTop, useDocumentMeta } from './Bits';
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
import { ChicagoMap } from './chicago-2027/Hero';
import { ELECTION_DAY as CHICAGO_DAY } from './chicago-2027/dates';
import { DenverMap } from './denver-2027/Hero';
import { ELECTION_DAY as DENVER_DAY } from './denver-2027/dates';
import { JacksonvilleMap } from './jacksonville-2027/Hero';
import { ELECTION_DAY as JACKSONVILLE_DAY } from './jacksonville-2027/dates';
import { ELECTION_DAY as SPRING_DAY } from './wisconsin-2027/dates';
import type { GuideId } from './hosts';
import { daysUntil } from './store';
import type { Outline } from './types';
import './ballot.css';
import './michigan/michigan.css';
import './minnesota/minnesota.css';
import './wisconsin/wisconsin.css';
import './chicago-2027/chicago.css';
import './denver-2027/denver.css';
import './jacksonville-2027/jacksonville.css';
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

/** Spring 2027's guides, by Election Day: their card's map, what's on the ballot and when. */
const SPRING: { id: GuideId; name: string; ink: string; map: React.ReactNode; event: string; covers: string; day: string; when: string; srName?: string }[] = [
  { id: 'chicago-2027', name: 'Chicago', ink: 'var(--chi-blue)', map: <ChicagoMap />, event: 'Chicago’s city election, Tue, Feb 23', covers: 'Mayor, clerk, treasurer, all 50 alderpersons and the police district councils.', day: CHICAGO_DAY, when: 'days to Election Day' },
  { id: 'jacksonville-2027', name: 'Jacksonville', ink: STATE_INK.florida, map: <JacksonvilleMap />, event: 'Jacksonville’s city election, Tue, Mar 9', covers: 'Mayor, sheriff, the county’s officers and all 19 City Council seats.', day: JACKSONVILLE_DAY, when: 'days to Election Day (May 18 runoffs where needed)' },
  { id: 'denver-2027', name: 'Denver', ink: STATE_INK.colorado, map: <DenverMap />, event: 'Denver’s city election, Tue, Apr 6', covers: 'Mayor, auditor, clerk and recorder and all 13 City Council seats.', day: DENVER_DAY, when: 'days to Election Day (Jun 1 runoffs where needed)' },
  { id: 'wisconsin-2027', name: 'Wisconsin', ink: STATE_INK.wisconsin, map: <WisconsinMap />, event: 'Wisconsin’s spring election, Tue, Apr 6', covers: 'An open Supreme Court seat, the Court of Appeals and circuit courts.', day: SPRING_DAY, when: 'days to Election Day (a Feb 16 primary only where needed)', srName: 'Wisconsin’s spring election' },
];

/** The page's parts for the pinned bar's contents, in page order. */
const PARTS: LandingItem[] = [
  { id: 'kyb-intro', emoji: '🗳️', label: 'Know Your Ballot' },
  { id: 'elections', emoji: '📅', label: 'Elections' },
  { id: 'spring-2027', emoji: '🗓️', label: 'Spring 2027', sub: SPRING.map((g) => ({ id: `kyb-home-${g.id}`, emoji: '📍', label: g.name, color: g.ink })) },
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
              <h1 className="font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight text-balance sm:text-[3.4rem] lg:text-[3.9rem]">Everything on Your Ballot. All in One Place.</h1>
              <p className="text-pretty text-xl leading-snug">From presidential and statewide races to judges, school boards, and local ballot questions. Discover who&rsquo;s running, who&rsquo;s funding them, and what you need to know before Election Day.</p>
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

          {/* One section per election the guides cover, newest first, each folding away, so the page holds every year's guides without growing endlessly. */}
          <section id="spring-2027" aria-label="Spring 2027" className={`mt-16 space-y-6 sm:mt-24 ${UNDER_BAR}`}>
            <details open className="kyb-cycle">
              <summary className="kyb-cycle-head">
                <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">Spring 2027</h2>
                <ChevronDown className="kyb-cycle-chev h-7 w-7 shrink-0" aria-hidden="true" />
              </summary>
              <p className="mt-2 max-w-[60ch] text-[17px]">Every race, who holds each seat now, and who’s running as the lists come out.</p>
              <ul className="mt-6 grid grid-cols-2 gap-x-4 lg:grid-cols-4" aria-label="Guides for spring 2027">
                {SPRING.map((g) => (
                  <li key={g.id} id={`kyb-home-${g.id}`} className={`kyb-card row-span-3 grid grid-rows-subgrid ${UNDER_BAR}`} style={{ '--ink': g.ink } as React.CSSProperties}>
                    <a href={guidePath(g.id)} onClick={openIn(`projects/know-your-ballot-${g.id}`)} className="kyb-tile h-full">
                      <span className="flex h-[140px] items-end justify-center sm:h-[160px]">{g.map}</span>
                      <span className="kyb-tile-name block font-serif text-[1.6rem] font-medium leading-tight sm:text-[1.9rem]">{g.name}</span>
                      <span className="block text-[15px] font-bold leading-snug">{g.event}</span>
                      <span className="block text-[15px] leading-snug">{g.covers}</span>
                    </a>
                    <p className="kyb-card-act">
                      <a href={guidePath(g.id)} onClick={openIn(`projects/know-your-ballot-${g.id}`)}>See full race<span className="sr-only"> for {g.srName ?? g.name}</span> <span aria-hidden="true">→</span></a>
                    </p>
                    <p className="border-t border-[var(--gb-border)] p-3 text-[13.5px] leading-snug sm:p-4">
                      <span className="block font-serif text-[2rem] font-medium leading-none sm:text-[2.4rem]">{Math.max(0, daysUntil(g.day))}</span>
                      <span className="mt-1 block">{g.when}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </section>

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
                      <a href={guidePath(s.id)} onClick={openIn(`projects/know-your-ballot-${s.id}`)}>See full race<span className="sr-only"> for {s.name}</span> <span aria-hidden="true">→</span></a>
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
        <BackToTop />
      </div>
    </GovbotChrome>
  );
}
