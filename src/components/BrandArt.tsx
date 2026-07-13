// Brand illustration set: clean geometric SVG art in the navy/teal palette.
// Drawn in code so it loads instantly, always matches the brand variables,
// and never carries stock-photo licensing risk. Decorative only (aria-hidden).

const navy = 'var(--navy, #1e40af)'
const teal = 'var(--teal, #0891b2)'
const bright = 'var(--bright, #22d3ee)'

// Three bureau nodes feeding one profile: the bureau map.
export function BureauMapArt({ width = 300 }: { width?: number }) {
  return (
    <svg viewBox="0 0 300 150" width={width} style={{ maxWidth: '100%', height: 'auto' }} aria-hidden="true">
      <line x1="60" y1="35" x2="150" y2="80" stroke={teal} strokeWidth="2" opacity="0.45" />
      <line x1="150" y1="28" x2="150" y2="80" stroke={teal} strokeWidth="2" opacity="0.45" />
      <line x1="240" y1="35" x2="150" y2="80" stroke={teal} strokeWidth="2" opacity="0.45" />
      <circle cx="60" cy="32" r="17" fill={navy} opacity="0.92" />
      <circle cx="150" cy="25" r="17" fill={teal} opacity="0.92" />
      <circle cx="240" cy="32" r="17" fill={navy} opacity="0.92" />
      <text x="60" y="37" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">EX</text>
      <text x="150" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">EQ</text>
      <text x="240" y="37" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">TU</text>
      <rect x="105" y="80" width="90" height="52" rx="9" fill={navy} />
      <rect x="105" y="80" width="90" height="13" rx="6" fill={bright} opacity="0.85" />
      <rect x="114" y="102" width="46" height="6" rx="3" fill="#fff" opacity="0.8" />
      <rect x="114" y="114" width="66" height="6" rx="3" fill="#fff" opacity="0.45" />
      <circle cx="181" cy="112" r="8" fill={teal} />
      <path d="M177 112 l3 3 l5 -6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Stacked cards climbing toward capital: the stacking method.
export function CardStackArt({ width = 260 }: { width?: number }) {
  return (
    <svg viewBox="0 0 260 170" width={width} style={{ maxWidth: '100%', height: 'auto' }} aria-hidden="true">
      <rect x="26" y="112" width="120" height="44" rx="8" fill={navy} opacity="0.35" />
      <rect x="44" y="84" width="120" height="44" rx="8" fill={navy} opacity="0.6" />
      <rect x="62" y="56" width="120" height="44" rx="8" fill={navy} />
      <rect x="62" y="56" width="120" height="12" rx="6" fill={bright} opacity="0.85" />
      <rect x="72" y="78" width="34" height="7" rx="3.5" fill="#fff" opacity="0.85" />
      <rect x="72" y="89" width="56" height="5" rx="2.5" fill="#fff" opacity="0.45" />
      <path d="M198 96 C 224 84, 232 60, 226 34" stroke={teal} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M216 40 l10 -8 l4 13" stroke={teal} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="210" cy="120" r="4" fill={teal} opacity="0.5" />
      <circle cx="224" cy="132" r="3" fill={teal} opacity="0.35" />
      <circle cx="200" cy="140" r="2.5" fill={teal} opacity="0.25" />
    </svg>
  )
}

// Member nodes trading wins in a room: the community.
export function CommunityArt({ width = 320 }: { width?: number }) {
  return (
    <svg viewBox="0 0 320 130" width={width} style={{ maxWidth: '100%', height: 'auto' }} aria-hidden="true">
      <line x1="70" y1="70" x2="160" y2="52" stroke={teal} strokeWidth="2" opacity="0.4" />
      <line x1="160" y1="52" x2="250" y2="70" stroke={teal} strokeWidth="2" opacity="0.4" />
      <line x1="70" y1="70" x2="250" y2="70" stroke={teal} strokeWidth="2" opacity="0.2" />
      <circle cx="70" cy="70" r="20" fill={navy} />
      <circle cx="70" cy="63" r="7" fill="#fff" opacity="0.9" />
      <path d="M56 84 a14 11 0 0 1 28 0" fill="#fff" opacity="0.9" />
      <circle cx="250" cy="70" r="20" fill={navy} />
      <circle cx="250" cy="63" r="7" fill="#fff" opacity="0.9" />
      <path d="M236 84 a14 11 0 0 1 28 0" fill="#fff" opacity="0.9" />
      <circle cx="160" cy="52" r="24" fill={teal} />
      <circle cx="160" cy="44" r="8" fill="#fff" opacity="0.95" />
      <path d="M143 69 a17 13 0 0 1 34 0" fill="#fff" opacity="0.95" />
      <g>
        <rect x="96" y="12" width="58" height="22" rx="11" fill={bright} opacity="0.9" />
        <text x="125" y="27" textAnchor="middle" fontSize="11" fontWeight="800" fill={navy}>$15K ✓</text>
      </g>
      <g>
        <rect x="186" y="8" width="66" height="22" rx="11" fill="#fff" stroke={teal} strokeWidth="1.5" />
        <text x="219" y="23" textAnchor="middle" fontSize="10" fontWeight="700" fill={teal}>EQ pull ✓</text>
      </g>
      <circle cx="30" cy="30" r="3.5" fill={teal} opacity="0.35" />
      <circle cx="292" cy="26" r="4" fill={teal} opacity="0.3" />
      <circle cx="304" cy="96" r="3" fill={navy} opacity="0.25" />
      <circle cx="16" cy="98" r="2.5" fill={navy} opacity="0.25" />
    </svg>
  )
}
