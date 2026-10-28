import type { CSSProperties } from 'react';

// "GO VOTE" in block letters, in the hero's empty lower-left beside the ballot
// box: each letter on a cube with a thick outline, a face standing proud of
// its depth and a heavy serif letter. GO takes the site's green, VOTE is white.
// The cubes drop in once, one after another, then hop in a wave every 8 seconds
// in time with a ballot landing in the box (home.css). One inline SVG, so the
// colours follow the site's theme through govbot's tokens.

/** [letter, x, y]: GO on top, VOTE below, centred over each other; each cube is 62 wide and 62 tall with 9 of depth up and to the left. */
const CUBES: [string, number, number][] = [
  ['G', 92, 40], ['O', 170, 40],
  ['V', 14, 130], ['O', 92, 130], ['T', 170, 130], ['E', 248, 130],
];

export function GoVote({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 210" className={`kyb-gv ${className}`} role="img" aria-label="Go vote, spelled on six cubes">
      <defs>
        <symbol id="kyb-cube" overflow="visible">
          {/* The cube's depth: a rim of the text colour on the dark theme (it vanishes on the light one), the dark body, a lighter top and the edges. */}
          <polygon points="-9,-9 53,-9 62,0 62,62 0,62 -9,53" fill="none" stroke="var(--gb-text)" strokeOpacity="0.42" strokeWidth="11" strokeLinejoin="round" />
          <polygon points="-9,-9 53,-9 62,0 62,62 0,62 -9,53" fill="#0B1119" stroke="#0B1119" strokeWidth="8" strokeLinejoin="round" />
          <polygon points="-9,-9 53,-9 62,0 0,0" fill="#26344D" />
          <polygon points="-9,-9 0,0 0,62 -9,53" fill="#0B1119" />
          <path d="M0 0L-9 -9M0 62L-9 53M62 0L53 -9" stroke="#8794AD" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </symbol>
      </defs>
      {CUBES.map(([letter, x, y], i) => {
        const go = i < 2;
        const ink = go ? 'var(--gb-on-primary)' : '#0B1119';
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <g className="kyb-gv-in" style={{ '--i': i } as CSSProperties}>
              <g className="kyb-gv-hop" style={{ '--i': i } as CSSProperties}>
                <use href="#kyb-cube" />
                <rect width="62" height="62" rx="9" fill={go ? 'var(--gb-primary)' : '#FFFFFF'} stroke="#0B1119" strokeWidth="4" />
                <text x="31" y="47" textAnchor="middle" fontFamily="var(--gb-font-display), Georgia, serif" fontWeight="700" fontSize="48" fill={ink} stroke={ink} strokeWidth="1.6">{letter}</text>
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
