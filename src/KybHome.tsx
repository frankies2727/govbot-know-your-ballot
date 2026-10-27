import { navigate } from './lib/router';
import { useDocumentMeta } from './Bits';
import ilOutline from './data/illinois/outline.json';
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
  { id: 'illinois', name: 'Illinois', ink: 'var(--gb-amber-hi)', covers: 'Chicago and suburban Cook County: every contest from U.S. Senate to the judges, plus every county to browse.', map: <StateMap outline={ilOutline as Outline} name="Illinois" colors={IL_MAP} id="il-home" /> },
  { id: 'michigan', name: 'Michigan', ink: 'var(--gb-primary-hi)', covers: 'Governor, U.S. Senate, Congress, every seat in Lansing, the courts, the university boards and both proposals.', map: <MichiganMap /> },
  { id: 'minnesota', name: 'Minnesota', ink: 'var(--mn-teal)', covers: 'Governor, U.S. Senate, Congress, every seat in St. Paul, the courts and the school-fund amendment.', map: <MinnesotaMap /> },
  { id: 'wisconsin', name: 'Wisconsin', ink: 'var(--wi-cardinal)', covers: 'Governor, Congress, the state Senate and every Assembly seat, and all three constitutional questions.', map: <WisconsinMap /> },
];

const LINK = 'underline decoration-2 underline-offset-4 font-semibold text-[var(--gb-text)] hover:text-[var(--gb-link)]';

/** The root of the Know Your Ballot site: pick your state, drawn as a ballot. Each guide is one tap away at /illinois, /michigan, /minnesota or /wisconsin. */
export function KybHome() {
  useDocumentMeta('Know Your Ballot');
  return (
    <GovbotChrome>
      <div className="kyb min-h-[100dvh] bg-[var(--gb-bg)] text-[var(--gb-text)]">
        <div className="mx-auto grid max-w-[1140px] gap-10 px-4 pb-28 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-x-16 lg:gap-y-6 lg:pt-20">
          <div className="max-w-[56ch] space-y-6 text-[17px] leading-relaxed">
            <h1 className="font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight text-balance sm:text-[3.4rem] lg:text-[3.9rem]">Know what&rsquo;s on your ballot before you vote.</h1>
            <p className="text-xl leading-snug">Enter your address and get the ballot you&rsquo;ll be handed on <strong className="font-semibold">Tuesday, November 3, 2026</strong>: what each job is, who&rsquo;s running, who&rsquo;s funding them and what every question means.</p>
          </div>

          <section aria-labelledby="pick-h" className="kyb-paper self-start lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="px-[18px] pb-4 pt-5">
              <h2 id="pick-h" className="font-serif text-3xl font-medium leading-tight">Pick your state</h2>
              <p className="mt-1 text-[15px]">Fill in one oval. Your state&rsquo;s guide opens on the next screen.</p>
            </div>
            <ul aria-label="States with a guide">
              {STATES.map((s) => (
                <li key={s.id}>
                  <a href={`/${s.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); navigate(`projects/know-your-ballot-${s.id}`); }}
                    className="kyb-line" style={{ '--ink': s.ink } as React.CSSProperties}>
                    <span className="kyb-oval" aria-hidden="true" />
                    <span className="w-14">{s.map}</span>
                    <span>
                      <span className="block font-serif text-[1.75rem] font-medium leading-tight">{s.name}</span>
                      <span className="mt-0.5 block text-[15px] leading-snug">{s.covers}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="kyb-line kyb-line-write cursor-default hover:bg-transparent" style={{ '--ink': 'var(--gb-text)' } as React.CSSProperties}>
              <span className="kyb-oval kyb-oval-dashed" aria-hidden="true" />
              <span className="font-serif text-[1.25rem] italic leading-tight">Write-in</span>
              <p className="text-[15px] leading-snug">
                {COMING.map((c, i) => (
                  <span key={c.name}>
                    <a className={LINK} href={`${REPO}/issues/${c.issue}`} target="_blank" rel="noopener">{c.name}</a>
                    {i < COMING.length - 2 ? ', ' : i === COMING.length - 2 ? ' and ' : ''}
                  </span>
                ))}
                {' '}are being researched now. Each link is the work in progress, and how to join it.
              </p>
            </div>
          </section>

          <div className="max-w-[56ch] space-y-6 text-[17px] leading-relaxed lg:col-start-1">
            <p>Everything comes from an official or documented public source, named next to it. Nothing is rated or editorialized, and nothing about you is kept: no names, no cookies, no tracking.</p>
            <p>This is an open-source project, built by and for everyone. You can bring a state here sooner by researching where its candidate lists, campaign money and district maps live, adding a photo, translating a guide, or telling us when something is wrong. No code needed. <a className={LINK} href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener">How to contribute</a> or <a className={LINK} href={`${REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22`} target="_blank" rel="noopener">pick something to help with</a>.</p>
            <p className="text-[15px]">Free and non-partisan. <a className={LINK} href="https://chihacknight.github.io/govbot/" target="_blank" rel="noopener">Built on Govbot</a>, Chi Hack Night&rsquo;s open civic data.</p>
          </div>
        </div>
      </div>
    </GovbotChrome>
  );
}
