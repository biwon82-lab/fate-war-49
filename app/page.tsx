"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TaegukSpinner } from "@/components/TaegukSpinner";
import { TypewriterText } from "@/components/TypewriterText";
import { TalismanFrame } from "@/components/TalismanFrame";
import { RitualButton } from "@/components/RitualButton";
import { QiFlowLine } from "@/components/QiFlowLine";

type ApiSuccess = { result: string; requestId?: string; cached?: boolean };
type ApiError = { error: string; details?: string; requestId?: string; retryAfterSeconds?: number };

export default function HomePage() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const flashTimerRef = useRef<number | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && birthDate.trim().length > 0 && birthTime.trim().length > 0 && !isLoading;
  }, [name, birthDate, birthTime, isLoading]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  function triggerScreenFlash() {
    if (typeof window === "undefined") return;
    // 연속 클릭에도 잘 보이도록 타이머 리셋
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    setIsScreenFlashing(false);
    // 다음 프레임에 on
    window.setTimeout(() => setIsScreenFlashing(true), 0);
    flashTimerRef.current = window.setTimeout(() => setIsScreenFlashing(false), 560);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    // Enter 제출(클릭 없이 submit)에도 봉인 플래시가 보이게.
    // 클릭 제출은 버튼 onCast에서 이미 트리거하므로 중복 방지.
    const submitter = (e.nativeEvent as unknown as { submitter?: HTMLElement | null }).submitter;
    if (!submitter) triggerScreenFlash();

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birthDate: birthDate.trim(),
          birthTime: birthTime.trim()
        })
      });

      const data = (await res.json()) as ApiSuccess | ApiError;
      if (!res.ok) {
        const msg = "error" in data ? data.error : "요청에 실패했습니다.";
        const rid = "requestId" in data && data.requestId ? ` (requestId: ${data.requestId})` : "";
        const retry =
          "retryAfterSeconds" in data && typeof data.retryAfterSeconds === "number"
            ? ` ${data.retryAfterSeconds}초 후 다시 시도해보세요.`
            : "";
        setError(`${msg}${retry}${rid}`);
        return;
      }

      setResult((data as ApiSuccess).result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 text-white sm:px-6 sm:py-16">
      {/* full-screen seal flash overlay */}
      <div
        className={[
          "screen-seal",
          isScreenFlashing ? "is-on" : "",
          "bg-[radial-gradient(700px_340px_at_50%_20%,rgba(212,175,55,0.25),transparent_60%),radial-gradient(640px_300px_at_55%_80%,rgba(139,0,0,0.18),transparent_62%),linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.0))]"
        ].join(" ")}
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-70 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/35 shadow-glowGold" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/20 bg-black/20 px-4 py-2 text-xs text-gold/90 shadow-[0_0_0_1px_rgba(212,175,55,0.10)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            동양풍 다크 판타지 사주풀이
          </div>

          <h1 className="mt-6 bg-[linear-gradient(90deg,rgba(212,175,55,0.95),rgba(255,255,255,0.92),rgba(139,0,0,0.9))] bg-[length:200%_200%] bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:text-6xl md:leading-tight animate-shimmer">
            운명전쟁49 - 당신의 운명을 확인하세요
          </h1>

          <p className="mt-4 text-sm text-white/70 md:text-base">
            이름과 생년월일시를 올리면, 운명전쟁49의 명리학자가 단호하게 길을 비춰드립니다.
          </p>
        </header>

        <TalismanFrame
          title="봉인된 운명의 문"
          subtitle="세 글자만 맞추면 길이 열립니다. 생년월일시는 운명을 여는 열쇠입니다."
          className=""
        >
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/85">이름</span>
              <input
                className="rounded-2xl border border-gold/15 bg-black/35 px-4 py-3 text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-gold/35 focus:shadow-glowGold focus:ring-2 focus:ring-gold/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white/85">생년월일</span>
                <input
                  className="rounded-2xl border border-gold/15 bg-black/35 px-4 py-3 text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-gold/35 focus:shadow-glowGold focus:ring-2 focus:ring-gold/20"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  autoComplete="bday"
                />
                <span className="text-xs text-white/50">예: 1997-03-21</span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white/85">태어난 시간</span>
                <input
                  className="rounded-2xl border border-gold/15 bg-black/35 px-4 py-3 text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-gold/35 focus:shadow-glowGold focus:ring-2 focus:ring-gold/20"
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  placeholder="HH:MM"
                />
                <span className="text-xs text-white/50">예: 09:35 (24시간)</span>
              </label>
            </div>

            <RitualButton
              type="submit"
              disabled={!canSubmit}
              className="mt-3 w-full"
              onCast={triggerScreenFlash}
            >
              운명 확인하기
            </RitualButton>

            {isLoading ? (
              <div className="loading-card is-loading relative mt-5 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-gold/15 bg-black/20 p-5">
                {/* scanline sweep */}
                <div
                  className="loading-scanline pointer-events-none absolute -inset-10 bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.16),rgba(255,255,255,0.06),rgba(139,0,0,0.12),transparent)] blur-md"
                  aria-hidden="true"
                />

                {/* stamp imprint */}
                <div className="loading-stamp pointer-events-none absolute right-2 top-2 sm:right-3 sm:top-3" aria-hidden="true">
                  <svg viewBox="0 0 120 120" className="h-16 w-16 opacity-90 sm:h-20 sm:w-20">
                    <defs>
                      <linearGradient id="stampGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#D4AF37" stopOpacity="0.95" />
                        <stop offset="1" stopColor="#8B0000" stopOpacity="0.75" />
                      </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="44" fill="none" stroke="url(#stampGrad)" strokeWidth="5" />
                    <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                    <path
                      d="M36 62 C46 36, 74 36, 84 62 C74 84, 46 84, 36 62 Z"
                      fill="none"
                      stroke="rgba(212,175,55,0.55)"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M50 50 V80 M70 44 V76 M44 60 H76"
                      stroke="rgba(255,255,255,0.14)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <text
                      x="60"
                      y="66"
                      textAnchor="middle"
                      fontSize="18"
                      fill="rgba(212,175,55,0.65)"
                      fontFamily="ui-serif, Georgia, serif"
                    >
                      印
                    </text>
                  </svg>
                </div>

                <QiFlowLine className="-mt-2 h-10 w-full max-w-[420px] opacity-90" />
                <TaegukSpinner className="" label="사주 분석 로딩" />
                <p className="text-sm text-white/75">명리학자가 당신의 사주를 분석 중입니다...</p>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-crimson/30 bg-[linear-gradient(135deg,rgba(139,0,0,0.25),rgba(0,0,0,0.25))] p-4 text-sm text-white/85 shadow-glowCrimson">
                <p className="font-semibold text-white">경고</p>
                <p className="mt-1 text-white/80">{error}</p>
              </div>
            ) : null}

            {result ? (
              <div className="relative mt-6 overflow-hidden rounded-3xl border border-gold/15 bg-black/25 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(212,175,55,0.35)_1px,transparent_2px)] [background-size:34px_34px] mix-blend-screen animate-sigil-drift"
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-gold/90">풀이 결과</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-gold/30 via-white/10 to-crimson/30" />
                  </div>

                  <TypewriterText
                    text={result}
                    className="mt-4 whitespace-pre-wrap break-words text-[13px] leading-6 text-white/90 sm:text-sm sm:leading-7"
                  />
                </div>
              </div>
            ) : null}
          </form>
        </TalismanFrame>
      </div>
    </main>
  );
}
