"use client";

type Props = {
  className?: string;
};

export function QiFlowLine({ className }: Props) {
  return (
    <svg
      className={`qi-flow ${className ?? ""}`}
      viewBox="0 0 320 80"
      role="img"
      aria-label="기 흐름"
    >
      <defs>
        <linearGradient id="qiGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="0.25" stopColor="#D4AF37" stopOpacity="0.85" />
          <stop offset="0.75" stopColor="#8B0000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8B0000" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M10 40 C 70 10, 120 70, 160 40 C 200 10, 250 70, 310 40"
        fill="none"
        stroke="url(#qiGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M10 40 C 70 10, 120 70, 160 40 C 200 10, 250 70, 310 40"
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

