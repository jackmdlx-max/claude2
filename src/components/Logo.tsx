/**
 * Capital AI brand mark — an inline SVG combining a water droplet with a cog
 * (utility + engineering). Deterministic and self-contained so it works
 * offline and scales crisply at any size. `className` controls the box size.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Capital AI logo"
      className={className}
    >
      <defs>
        <linearGradient id="st-logo-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c3e6" />
          <stop offset="55%" stopColor="#15b3a6" />
          <stop offset="100%" stopColor="#0e9488" />
        </linearGradient>
      </defs>
      {/* Cog teeth ring */}
      <g fill="url(#st-logo-fill)" opacity="0.95">
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const cx = 24 + Math.cos(angle) * 19;
          const cy = 24 + Math.sin(angle) * 19;
          return (
            <rect
              key={i}
              x={cx - 3}
              y={cy - 3}
              width="6"
              height="6"
              rx="1.5"
              transform={`rotate(${(i * 45)} ${cx} ${cy})`}
            />
          );
        })}
      </g>
      <circle cx="24" cy="24" r="16" fill="#0b2740" />
      {/* Water droplet */}
      <path
        d="M24 11c5 6 8 9.5 8 14a8 8 0 1 1-16 0c0-4.5 3-8 8-14z"
        fill="url(#st-logo-fill)"
      />
      {/* Highlight */}
      <path
        d="M21 24a3 3 0 0 0 3 3"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
