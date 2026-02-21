"use client";

type Props = {
  className?: string;
  label?: string;
};

export function TaegukSpinner({ className, label = "로딩 중" }: Props) {
  return (
    <div className={className}>
      <div className="relative mx-auto h-16 w-16">
        <div
          className="absolute inset-0 rounded-full border border-gold/25 shadow-glowGold"
          aria-hidden="true"
        />
        <svg
          className="absolute inset-0 h-full w-full animate-spin-slow drop-shadow-[0_0_16px_rgba(212,175,55,0.25)]"
          viewBox="0 0 100 100"
          role="img"
          aria-label={label}
        >
          <defs>
            <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#D4AF37" stopOpacity="0.95" />
              <stop offset="1" stopColor="#8B0000" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Outer circle */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />

          {/* Taeguk-like swirl: two opposing circles */}
          <path
            d="M50,10 a40,40 0 1,0 0,80 a20,20 0 1,1 0,-40 a20,20 0 1,0 0,-40"
            fill="url(#gGold)"
            opacity="0.95"
          />

          {/* Inner dots */}
          <circle cx="50" cy="30" r="7" fill="rgba(10,10,16,0.85)" />
          <circle cx="50" cy="70" r="7" fill="rgba(255,255,255,0.75)" />
        </svg>

        <div
          className="pointer-events-none absolute -inset-2 animate-float rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.22),transparent_60%)] blur-md"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

