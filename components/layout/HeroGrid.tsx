export default function HeroGrid() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="glowC" cx="50%" cy="60%" r="40%">
            <stop offset="0%" stopColor="#cc00aa" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowT" cx="50%" cy="45%" r="30%">
            <stop offset="0%" stopColor="#00d4c8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#glowC)" />
        <rect width="100%" height="100%" fill="url(#glowT)" />

        {/* Teal accent lines */}
        <g opacity="0.06" stroke="#00d4c8" fill="none" strokeWidth="0.5">
          <line x1="0" y1="200" x2="1400" y2="200" />
          <line x1="0" y1="300" x2="1400" y2="300" />
        </g>
      </svg>
    </div>
  )
}
