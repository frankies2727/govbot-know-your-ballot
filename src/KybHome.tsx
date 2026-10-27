import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { navigate } from './lib/router';
import { useDocumentMeta } from './Bits';
import ilOutline from './data/illinois/outline.json';
import { BallotBox } from './BallotBox';
import { GovbotChrome } from './GovbotChrome';
import { StateMap } from './Hero';
import { MichiganMap } from './michigan/Hero';
import { MinnesotaMap } from './minnesota/Hero';
import { WisconsinMap } from './wisconsin/Hero';
import type { Outline } from './types';
import './ballot.css';
import './michigan/michigan.css';
import './minnesota/minnesota.css';
import './wisconsin/wisconsin.css';
import './home.css';

const IL_MAP = { fill: ['var(--gb-blue-hi)', 'var(--gb-primary)', 'var(--gb-blue)'] as [string, string, string], stroke: 'var(--kyb-gold)', pin: 'var(--kyb-gold)', pinStroke: 'var(--gb-bg)' };

const REPO = 'https://github.com/frankies2727/govbot-know-your-ballot';
/** States with a tracking issue (research, then build) and no guide yet. */
const COMING = [{ name: 'Ohio', issue: 8 }, { name: 'Pennsylvania', issue: 9 }, { name: 'Georgia', issue: 11 }];

const STATES = [
  { id: 'illinois', name: 'Illinois', ink: 'var(--gb-amber-hi)', covers: 'Chicago and suburban Cook County, from U.S. Senate to the judges.', map: <StateMap outline={ilOutline as Outline} name="Illinois" colors={IL_MAP} id="il-home" /> },
  { id: 'michigan', name: 'Michigan', ink: 'var(--gb-primary-hi)', covers: 'Governor to school board, the courts and both proposals.', map: <MichiganMap /> },
  { id: 'minnesota', name: 'Minnesota', ink: 'var(--mn-teal)', covers: 'Governor to state representative, the courts and the amendment.', map: <MinnesotaMap /> },
  { id: 'wisconsin', name: 'Wisconsin', ink: 'var(--wi-cardinal)', covers: 'Governor to Assembly seat and all three constitutional questions.', map: <WisconsinMap /> },
];

const LINK = 'underline decoration-2 underline-offset-4 font-semibold text-[var(--gb-text)] hover:text-[var(--gb-link)]';

/** The root of the Know Your Ballot site: pick your state. Each guide is one tap away at /illinois, /michigan, /minnesota or /wisconsin. */
export function KybHome() {
  useDocumentMeta('Know Your Ballot');
  const [paused, setPaused] = useState(false);
  return (
    <GovbotChrome>
      <div className="kyb min-h-[100dvh] bg-[var(--gb-bg)] text-[var(--gb-text)]">
        <div className="mx-auto max-w-[1140px] px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
          <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:gap-12">
            <div className="max-w-[52ch] space-y-6 text-[17px] leading-relaxed">
              <h1 className="font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight text-balance sm:text-[3.4rem] lg:text-[3.9rem]">Know what&rsquo;s on your ballot before you vote.</h1>
              <p className="text-xl leading-snug">Enter your address and get the ballot you&rsquo;ll be handed on <strong className="font-semibold">Tuesday, November 3, 2026</strong>: what each job is, who&rsquo;s running, who&rsquo;s funding them and what every question means.</p>
              <p>
                <a href="#pick" className="inline-flex min-h-[48px] items-center rounded-full bg-[var(--gb-primary)] px-6 text-[16px] font-bold text-[var(--gb-on-primary)] no-underline hover:bg-[var(--gb-primary-hi)] focus-visible:outline-[var(--gb-text)]">Pick your state</a>
              </p>
              <p className="text-[15px]">Free, non-partisan and open source. Nothing about you is kept: no names, no cookies, no tracking.</p>
            </div>
            <div className="relative mx-auto w-full max-w-[640px]">
              <BallotBox className={paused ? 'kyb-box-paused' : ''} />
              <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}
                className="absolute bottom-0 right-0 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--gb-border-strong)] bg-[var(--gb-surface)] px-3 text-[13px] font-bold hover:bg-[var(--kyb-chip)]">
                {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                {paused ? 'Play animation' : 'Pause animation'}
              </button>
            </div>
          </section>

          <section id="pick" aria-labelledby="pick-h" className="mt-16 scroll-mt-[calc(var(--kyb-top)+16px)] space-y-6 sm:mt-24">
            <div className="space-y-2">
              <h2 id="pick-h" className="font-serif text-3xl font-medium leading-tight sm:text-4xl">Pick your state</h2>
              <p className="max-w-[60ch] text-[17px]">Four guides are live for November. Each opens on the next screen and asks for your address there.</p>
            </div>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="States with a guide">
              {STATES.map((s) => (
                <li key={s.id}>
                  <a href={`/${s.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); navigate(`projects/know-your-ballot-${s.id}`); }}
                    className="kyb-tile h-full" style={{ '--ink': s.ink } as React.CSSProperties}>
                    <span className="flex h-[140px] items-end justify-center sm:h-[160px]">{s.map}</span>
                    <span className="kyb-tile-name block font-serif text-[1.6rem] font-medium leading-tight sm:text-[1.9rem]">{s.name}</span>
                    <span className="block text-[15px] leading-snug">{s.covers}</span>
                  </a>
                </li>
              ))}
            </ul>
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

          <section aria-labelledby="open-h" className="mt-16 grid gap-6 border-t border-[var(--gb-border)] pt-10 sm:mt-24 lg:grid-cols-2 lg:gap-12">
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
