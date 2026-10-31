export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="48" x2="48" y2="0">
          <stop offset="0" stopColor="#2f8bff" />
          <stop offset="1" stopColor="#18ff8a" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill="#0a1020" stroke="url(#lg)" strokeWidth="1.5" />
      {/* candlesticks */}
      <g strokeLinecap="round">
        <line x1="13" y1="14" x2="13" y2="34" stroke="#ff4d6a" strokeWidth="1.6" />
        <rect x="10.5" y="19" width="5" height="9" rx="1" fill="#ff4d6a" />
        <line x1="22" y1="10" x2="22" y2="32" stroke="#18ff8a" strokeWidth="1.6" />
        <rect x="19.5" y="15" width="5" height="12" rx="1" fill="#18ff8a" />
        <line x1="31" y1="16" x2="31" y2="38" stroke="#18ff8a" strokeWidth="1.6" />
        <rect x="28.5" y="21" width="5" height="12" rx="1" fill="#18ff8a" />
      </g>
      {/* growth arrow */}
      <path d="M8 36 L20 26 L27 30 L40 12" stroke="url(#lg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 12 H40 V19" stroke="url(#lg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className="block text-[15px] font-extrabold tracking-wide text-white">TRENDING SAHAM</span>
        <span className="block text-[10px] font-bold tracking-[0.35em] text-neon">PRO</span>
      </span>
    </span>
  );
}
