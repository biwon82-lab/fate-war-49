"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  /** click 연출을 강제로 켜고 싶을 때(예: submit 시작 시점) */
  forceCasting?: boolean;
  /** 클릭(의식 시작) 순간에 외부 연출을 붙이고 싶을 때 */
  onCast?: () => void;
};

export function RitualButton({ className, children, onClick, forceCasting, onCast, ...props }: Props) {
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
    if (!forceCasting) return;
    setIsCasting(true);
    const id = window.setTimeout(() => setIsCasting(false), 760);
    return () => window.clearTimeout(id);
  }, [forceCasting]);

  return (
    <button
      {...props}
      onClick={(e) => {
        // 클릭 즉시 의식 연출 트리거
        setIsCasting(true);
        window.setTimeout(() => setIsCasting(false), 760);
        onCast?.();
        onClick?.(e);
      }}
      className={[
        "ritual-btn group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-gold/25",
        "bg-[linear-gradient(90deg,rgba(212,175,55,0.16),rgba(139,0,0,0.15),rgba(212,175,55,0.16))] bg-[length:200%_200%]",
        "px-5 py-3 font-semibold text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition",
        "hover:border-gold/45 hover:shadow-glowGold hover:drop-shadow-[0_0_18px_rgba(212,175,55,0.18)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "animate-shimmer",
        isCasting ? "is-casting" : "",
        className ?? ""
      ].join(" ")}
    >
      {/* click flash */}
      <span
        className="ritual-flash pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(320px 140px at 50% 15%, rgba(212,175,55,0.40), transparent 60%), radial-gradient(280px 120px at 55% 85%, rgba(139,0,0,0.22), transparent 60%)"
        }}
      />

      {/* ripple ring */}
      <span
        className="ritual-ripple pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/40 shadow-[0_0_18px_rgba(212,175,55,0.16)]"
        aria-hidden="true"
      />

      {/* seal glyph */}
      <span className="ritual-seal pointer-events-none absolute inset-0" aria-hidden="true">
        <svg viewBox="0 0 200 60" className="absolute left-1/2 top-1/2 h-10 w-[220px] -translate-x-1/2 -translate-y-1/2">
          <defs>
            <linearGradient id="sealGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#D4AF37" stopOpacity="0.0" />
              <stop offset="0.2" stopColor="#D4AF37" stopOpacity="0.85" />
              <stop offset="0.8" stopColor="#8B0000" stopOpacity="0.65" />
              <stop offset="1" stopColor="#8B0000" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M10 30 H190"
            stroke="url(#sealGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M28 18 L20 30 L28 42"
            stroke="rgba(212,175,55,0.65)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M172 18 L180 30 L172 42"
            stroke="rgba(212,175,55,0.65)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="100" cy="30" r="10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
          <circle cx="100" cy="30" r="4" fill="rgba(212,175,55,0.55)" />
        </svg>
      </span>

      {/* gold dust on hover */}
      <span className="gold-dust absolute inset-0 group-hover:opacity-100" aria-hidden="true" />
      <span className="gold-dust absolute inset-0 group-hover:opacity-100 [animation-delay:180ms]" aria-hidden="true" />
      <span className="gold-dust absolute inset-0 group-hover:opacity-100 [animation-delay:360ms]" aria-hidden="true" />

      <span className="relative z-10">{children}</span>
    </button>
  );
}

