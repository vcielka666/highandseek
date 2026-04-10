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

        {/* Perspective grid lines */}
        <g
          opacity="0.18"
          stroke="#cc00aa"
          fill="none"
          strokeWidth="0.5"
          style={{ animation: 'gridMove 3s linear infinite alternate' }}
        >
          {/* Horizontal lines */}
          <line x1="0" y1="680" x2="1400" y2="680" />
          <line x1="100" y1="710" x2="1300" y2="710" />
          <line x1="180" y1="735" x2="1220" y2="735" />
          <line x1="250" y1="757" x2="1150" y2="757" />
          <line x1="310" y1="775" x2="1090" y2="775" />
          <line x1="360" y1="790" x2="1040" y2="790" />
          <line x1="405" y1="803" x2="995" y2="803" />
          <line x1="445" y1="814" x2="955" y2="814" />
          {/* Vertical lines from vanishing point */}
          <line x1="700" y1="500" x2="200" y2="900" />
          <line x1="700" y1="500" x2="350" y2="900" />
          <line x1="700" y1="500" x2="500" y2="900" />
          <line x1="700" y1="500" x2="620" y2="900" />
          <line x1="700" y1="500" x2="700" y2="900" />
          <line x1="700" y1="500" x2="780" y2="900" />
          <line x1="700" y1="500" x2="900" y2="900" />
          <line x1="700" y1="500" x2="1050" y2="900" />
          <line x1="700" y1="500" x2="1200" y2="900" />
        </g>

        {/* Teal accent lines */}
        <g opacity="0.06" stroke="#00d4c8" fill="none" strokeWidth="0.5">
          <line x1="0" y1="200" x2="1400" y2="200" />
          <line x1="0" y1="300" x2="1400" y2="300" />
        </g>
      </svg>
    </div>
  )
}
