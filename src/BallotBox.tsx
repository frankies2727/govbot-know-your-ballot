// The home page's hero: a voter slides a ballot into a glowing box, drawn as
// one inline SVG so it needs no image file and follows both themes through
// govbot's tokens. The loop (home.css): the ballot leaves the hand, turns,
// drops through the slot, a ring pulses out and the box's light blinks, then
// the next ballot appears. Under reduced motion it holds one frame.

export function BallotBox({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 440" className={`kyb-box ${className}`} role="img"
      aria-label="A voter sliding a ballot into a glowing ballot box">
      <defs>
        <pattern id="kyb-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="var(--gb-text)" opacity="0.14" />
        </pattern>
        <radialGradient id="kyb-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--gb-primary)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--gb-primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="kyb-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gb-blue-hi)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--gb-blue)" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="kyb-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gb-primary)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--gb-blue-hi)" stopOpacity="0.35" />
        </linearGradient>
        {/* The ballot is only drawn above the slot: as it drops it disappears into the box. */}
        <clipPath id="kyb-slot-clip"><rect x="0" y="0" width="640" height="209" /></clipPath>
      </defs>

      {/* The room: a dot grid and the glow the box throws on the floor. */}
      <rect width="640" height="440" fill="url(#kyb-dots)" />
      <ellipse cx="450" cy="400" rx="190" ry="34" fill="url(#kyb-floor)" />

      {/* Data rising from the box: counted ballots on their way. */}
      <g className="kyb-motes" fill="var(--gb-primary)">
        <circle cx="420" cy="190" r="3" />
        <circle cx="470" cy="190" r="2.5" style={{ animationDelay: '-1.3s' }} />
        <circle cx="505" cy="190" r="2" style={{ animationDelay: '-2.6s' }} />
      </g>

      {/* The voter, in line. */}
      <g fill="none" stroke="var(--gb-text)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="236" cy="158" r="28" fill="var(--gb-bg)" />
        <path d="M196 392 V268 a40 40 0 0 1 40 -40 h0 a40 40 0 0 1 40 40 V392" fill="var(--gb-bg)" />
        {/* The arm, reaching to the slot. */}
        <path d="M272 248 Q320 215 386 178" strokeWidth="22" stroke="var(--gb-bg)" />
        <path d="M272 248 Q320 215 386 178" strokeWidth="16" />
        <circle cx="394" cy="174" r="11" fill="var(--gb-bg)" />
      </g>

      {/* The ballot, in the hand and on its way. */}
      <g clipPath="url(#kyb-slot-clip)">
        <g className="kyb-ballot">
          <g transform="translate(352 114)">
            <rect x="0" y="0" width="84" height="60" rx="5" fill="#FFFFFF" stroke="#0B1119" strokeWidth="2" />
            <g fill="none" stroke="#0B1119" strokeWidth="2">
              <ellipse cx="14" cy="16" rx="7" ry="4.5" fill="var(--gb-primary)" stroke="none" />
              <path d="M28 16 h40" />
              <ellipse cx="14" cy="31" rx="7" ry="4.5" />
              <path d="M28 31 h34" />
              <ellipse cx="14" cy="46" rx="7" ry="4.5" />
              <path d="M28 46 h44" />
            </g>
          </g>
        </g>
      </g>

      {/* The box: a glass block with a lit slot. */}
      <g strokeLinejoin="round">
        <polygon points="530,230 570,195 570,345 530,380" fill="url(#kyb-face)" stroke="var(--gb-text)" strokeWidth="2.5" />
        <polygon points="330,230 370,195 570,195 530,230" fill="url(#kyb-top)" stroke="var(--gb-text)" strokeWidth="2.5" />
        <rect x="330" y="230" width="200" height="150" rx="10" fill="var(--gb-surface)" stroke="var(--gb-text)" strokeWidth="2.5" />
        <rect x="330" y="230" width="200" height="150" rx="10" fill="url(#kyb-face)" />
        {/* The slot, and the light along it. */}
        <polygon points="412,216 428,204 492,204 476,216" fill="var(--gb-bg)" stroke="var(--gb-primary)" strokeWidth="2" />
        <path d="M428 204 H492" className="kyb-slot-light" stroke="var(--gb-primary-hi)" strokeWidth="3" strokeLinecap="round" />
        {/* The ring that pulses out when a ballot lands. */}
        <ellipse cx="452" cy="210" rx="30" ry="12" className="kyb-ring" fill="none" stroke="var(--gb-primary)" strokeWidth="3" />
        {/* The box's own light: on, and blinking as it counts. */}
        <circle cx="510" cy="252" r="6" className="kyb-box-led" fill="var(--gb-primary)" />
        {/* A ballot on the front, the box's mark. */}
        <g transform="translate(400 280)" fill="none" stroke="var(--gb-text)" strokeWidth="2.5">
          <rect x="0" y="0" width="60" height="44" rx="4" />
          <ellipse cx="12" cy="13" rx="5" ry="3.5" fill="var(--gb-primary)" stroke="none" />
          <path d="M22 13 h28 M8 26 h42 M8 35 h30" />
        </g>
      </g>
    </svg>
  );
}
