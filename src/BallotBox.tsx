import type { CSSProperties } from 'react';

// The home page's hero: ballots with different options circled in pen float
// in one after another and drop into a glowing ballot box. One inline SVG, so
// it needs no image file. The ballots are shared; the scene around them
// follows the site's theme (home.css): a dark "hologram" (light cone, floor
// grid, pulsing rings) and a light "daylight" (flat box, soft shadow,
// confetti). Colours come from govbot's tokens. Under reduced motion it holds
// one frame.

/** Each ballot: pen ink, paper, how long each option's line is, and the three options circled (a row's y). */
const BALLOTS = [
  { pen: '#1E56E6', paper: '#FFFFFF', lines: [20, 8, 24, 14, 18, 26], marks: [-98, -50, -30] },
  { pen: '#0B7D45', paper: '#EAF1FF', lines: [12, 26, 20, 28, 10, 22], marks: [-84, -50, -30] },
  { pen: '#C93B40', paper: '#FFFFFF', lines: [24, 16, 10, 26, 22, 12], marks: [-98, -64, -16] },
  { pen: '#6A54C7', paper: '#FFF4DF', lines: [18, 28, 14, 22, 26, 16], marks: [-84, -64, -16] },
  { pen: '#B87914', paper: '#EAFBF2', lines: [26, 14, 18, 24, 12, 28], marks: [-98, -50, -16] },
];
/** The six options on a ballot (two for each of three contests), by y. */
const ROWS = [-98, -84, -64, -50, -30, -16];
const OVALS = ROWS.map((y) => `M-30.5 ${y}a4.5 3 0 1 0 9 0a4.5 3 0 1 0 -9 0`).join('');
/** A hand-drawn loop around one option, with the pen's overshoot. */
const RING = 'M-31 -2C-22 -8 24 -8 30 -1C33 5 8 7 -22 5C-35 4 -33 -5 -10 -7';
const GHOSTS = [
  { at: 'translate(150 170) rotate(-14)', delay: '0s', lines: 'M10 16h42M10 30h30M10 44h38M10 58h26' },
  { at: 'translate(226 330) rotate(9)', delay: '-2.5s', lines: 'M10 16h42M10 30h34M10 44h22M10 58h40' },
  { at: 'translate(138 408) rotate(-6)', delay: '-4.5s', lines: 'M10 16h42M10 30h26M10 44h36M10 58h30' },
  { at: 'translate(290 130) rotate(16)', delay: '-1s', lines: 'M10 16h42M10 30h36M10 44h28M10 58h34' },
];

function Ballot({ b, i }: { b: (typeof BALLOTS)[number]; i: number }) {
  const style = { '--d': `${i * 4}s`, '--pen': b.pen, '--paper': b.paper } as CSSProperties;
  return (
    <g style={style}>
      <g className={i === 0 ? "kyb-bl kyb-first" : "kyb-bl"}><g transform="skewY(-20.7)">
        <rect x="-46" y="-132" width="92" height="136" rx="8" fill="var(--gb-primary)" fillOpacity="0.16" />
        <rect x="-42" y="-128" width="84" height="128" rx="4" fill="var(--paper)" stroke="#0B1119" strokeWidth="2" />
        <rect x="-34" y="-120" width="68" height="8" rx="2" fill="#C9D2E3" />
        <path d="M-34 -74H34M-34 -40H34" stroke="#C9D2E3" strokeWidth="1" fill="none" />
        <path d={OVALS} fill="none" stroke="#0B1119" strokeWidth="1.3" />
        <path d={ROWS.map((y, k) => `M-16 ${y}H${b.lines[k]}`).join('')} fill="none" stroke="#5B6577" strokeWidth="2.4" strokeLinecap="round" />
        <g fill="none" stroke="var(--pen)" strokeWidth="2" strokeLinecap="round">
          {b.marks.map((y, k) => (
            <path key={y} className="kyb-pen" style={{ '--c': `${k * 0.5}s` } as CSSProperties} transform={`translate(-2 ${y})`} pathLength={1} d={RING} />
          ))}
        </g>
      </g></g>
    </g>
  );
}

export function BallotBox({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="120 60 680 480" className={`kyb-box ${className}`} role="img"
      aria-label="Ballots with different choices circled in pen float in one after another and slide into a glowing ballot box. A check appears as each one is counted.">
      <defs>
        <pattern id="kyb-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill="var(--gb-text)" fillOpacity="0.12" />
        </pattern>
        <radialGradient id="kyb-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--gb-primary)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--gb-primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="kyb-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--gb-primary)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--gb-primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="kyb-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gb-primary)" stopOpacity="0.6" />
          <stop offset="1" stopColor="var(--gb-blue-hi)" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="kyb-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gb-blue-hi)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--gb-blue)" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="kyb-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gb-blue)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--gb-blue)" stopOpacity="0.05" />
        </linearGradient>
        <clipPath id="kyb-floor"><rect x="0" y="330" width="880" height="230" /></clipPath>
        {/* A ballot is only drawn above the slot's line: as it drops it disappears into the box. */}
        <clipPath id="kyb-above-slot"><polygon points="0,0 880,0 880,174 0,506" /></clipPath>
      </defs>

      {/* Dark: the room is a halo, a floor grid and rings that pulse with each ballot. */}
      <g className="kyb-sc-dark">
        <ellipse cx="540" cy="320" rx="250" ry="240" fill="url(#kyb-halo)" />
        <g clipPath="url(#kyb-floor)" stroke="var(--gb-text)" strokeOpacity="0.09" fill="none">
          <path d="M0 400H880M0 428H880M0 466H880M0 514H880" />
          <path d="M-240 560L440 300M-80 560L440 300M80 560L440 300M240 560L440 300M400 560L440 300M560 560L440 300M720 560L440 300M880 560L440 300M1040 560L440 300M1200 560L440 300" />
        </g>
        <g fill="none" stroke="var(--gb-primary)" strokeWidth="2">
          <ellipse className="kyb-ring" cx="570" cy="470" rx="130" ry="40" />
          <ellipse className="kyb-ring" style={{ animationDelay: '-0.15s' }} cx="570" cy="470" rx="180" ry="56" />
          <ellipse className="kyb-ring" style={{ animationDelay: '-0.3s' }} cx="570" cy="470" rx="228" ry="70" />
        </g>
      </g>
      {/* Light: a dot grid, a wash of the accent and a soft shadow that swells on each drop. */}
      <g className="kyb-sc-light">
        <rect x="0" y="0" width="880" height="560" fill="url(#kyb-dots)" />
        <circle cx="560" cy="300" r="205" fill="var(--gb-primary)" fillOpacity="0.1" />
        <ellipse className="kyb-shadow" cx="570" cy="500" rx="225" ry="32" fill="var(--gb-text)" fillOpacity="0.12" />
      </g>

      {/* More ballots drifting in the background, both themes. */}
      <g fill="var(--gb-text)" fillOpacity="0.04" stroke="var(--gb-text)" strokeOpacity="0.17" strokeWidth="2">
        {GHOSTS.map((g) => (
          <g key={g.at} transform={g.at}><g className="kyb-ghost" style={{ animationDelay: g.delay }}>
            <rect width="62" height="86" rx="5" /><path d={g.lines} fill="none" />
          </g></g>
        ))}
      </g>

      {/* The box. Dark: glass with a lit slot. */}
      <g className="kyb-sc-dark kyb-box-dark" stroke="var(--gb-text)" strokeWidth="2.5" strokeLinejoin="round">
        <polygon points="560,360 720,300 720,450 560,510" fill="url(#kyb-right)" />
        <polygon points="420,300 560,360 560,510 420,450" fill="url(#kyb-left)" />
        <g stroke="var(--gb-text)" strokeOpacity="0.55" strokeWidth="7" strokeLinecap="round">
          <path d="M440 430l100 43M440 416l100 43M440 402l100 43" />
        </g>
        <polygon points="420,300 560,240 720,300 560,360" fill="url(#kyb-top)" />
        <polygon points="520,310 610,276 616,279 526,313" fill="var(--gb-bg)" stroke="var(--gb-primary)" strokeWidth="2" />
        <path className="kyb-slot" d="M520 310L610 276" stroke="var(--gb-primary)" strokeWidth="4" strokeLinecap="round" />
        <circle className="kyb-led" cx="690" cy="330" r="6" fill="var(--gb-primary)" stroke="none" />
        <g transform="translate(455 350) skewY(23)" fill="none" stroke="var(--gb-text)" strokeWidth="2.5">
          <rect width="70" height="48" rx="4" />
          <ellipse cx="13" cy="14" rx="6" ry="4" fill="var(--gb-primary)" stroke="none" />
          <path d="M24 14h34M9 28h48M9 38h32" />
        </g>
      </g>
      {/* The box. Light: flat navy sides and a white lid. */}
      <g className="kyb-sc-light" stroke="var(--gb-text)" strokeWidth="2.5" strokeLinejoin="round">
        <polygon points="560,360 720,300 720,450 560,510" fill="var(--gb-text)" />
        <polygon points="420,300 560,360 560,510 420,450" fill="#1A2233" />
        <polygon points="420,300 560,240 720,300 560,360" fill="var(--gb-surface)" />
        <polygon points="520,310 610,276 616,279 526,313" fill="var(--gb-text)" />
        <path className="kyb-slot" d="M520 310L610 276" stroke="var(--gb-primary)" strokeWidth="4" strokeLinecap="round" />
        <g transform="translate(455 350) skewY(23)" fill="none" stroke="var(--gb-surface)" strokeWidth="2.5">
          <rect width="70" height="48" rx="4" />
          <ellipse cx="13" cy="14" rx="6" ry="4" fill="var(--gb-primary)" stroke="none" />
          <path d="M24 14h34M9 28h48M9 38h32" />
        </g>
      </g>

      {/* Dark: a column of light and counted ballots rising out of the slot. */}
      <g className="kyb-sc-dark">
        <polygon className="kyb-beam" points="520,310 610,276 660,30 470,30" fill="url(#kyb-beam)" />
        <g className="kyb-motes" fill="var(--gb-primary)">
          <circle cx="548" cy="296" r="3.5" />
          <circle cx="578" cy="286" r="2.5" style={{ animationDelay: '-1.4s' }} />
          <circle cx="598" cy="282" r="3" style={{ animationDelay: '-2.8s' }} />
          <circle cx="535" cy="300" r="2" style={{ animationDelay: '-3.5s' }} />
        </g>
      </g>

      {/* The ballots, one every four seconds. */}
      <g clipPath="url(#kyb-above-slot)">
        <g transform="translate(565 293)">
          {BALLOTS.map((b, i) => <Ballot key={b.pen} b={b} i={i} />)}
        </g>
      </g>

      {/* Light: confetti on every drop. */}
      <g className="kyb-sc-light">
        <rect className="kyb-confetti" x="540" y="262" width="10" height="6" rx="1" fill="var(--gb-primary)" style={{ '--dx': '-70px' } as CSSProperties} />
        <rect className="kyb-confetti" x="575" y="256" width="8" height="8" rx="1" fill="var(--gb-blue-hi)" style={{ '--dx': '30px', animationDelay: '0.06s' } as CSSProperties} />
        <rect className="kyb-confetti" x="600" y="266" width="10" height="6" rx="1" fill="var(--gb-amber)" style={{ '--dx': '80px', animationDelay: '0.12s' } as CSSProperties} />
        <circle className="kyb-confetti" cx="560" cy="270" r="4" fill="var(--gb-link)" style={{ '--dx': '-30px', animationDelay: '0.04s' } as CSSProperties} />
        <circle className="kyb-confetti" cx="590" cy="260" r="4" fill="var(--gb-primary)" style={{ '--dx': '55px', animationDelay: '0.1s' } as CSSProperties} />
      </g>

      {/* The check that floats up as each ballot is counted. */}
      <g transform="translate(565 250)"><g className="kyb-check">
        <circle r="18" fill="var(--gb-primary)" />
        <path d="M-8 0L-2 6L9 -7" fill="none" stroke="var(--gb-on-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g></g>
    </svg>
  );
}
