"use client";

import { useMemo, useState } from "react";
import { QiFlowLine } from "@/components/QiFlowLine";
import { RitualButton } from "@/components/RitualButton";
import { TaegukSpinner } from "@/components/TaegukSpinner";
import { TalismanFrame } from "@/components/TalismanFrame";
import { TypewriterText } from "@/components/TypewriterText";

type ApiSuccess = { result: string };
type ApiError = { error: string; details?: string };

export function TestSajuClient() {
  const [name, setName] = useState("홍길동");
  const [birthDate, setBirthDate] = useState("1997-03-21");
  const [birthTime, setBirthTime] = useState("09:35");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<unknown>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && birthDate.trim().length > 0 && birthTime.trim().length > 0 && !isLoading;
  }, [name, birthDate, birthTime, isLoading]);

  async function run() {
    if (!canSubmit) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    setRaw(null);

    try {
      const payload = { name: name.trim(), birthDate: birthDate.trim(), birthTime: birthTime.trim() };
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as ApiSuccess | ApiError;
      setRaw({ status: res.status, ok: res.ok, payload, data });

      if (!res.ok) {
        setError("error" in data ? data.error : "요청에 실패했습니다.");
        return;
      }
      setResult((data as ApiSuccess).result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setRaw(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 text-white sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/20 bg-black/20 px-4 py-2 text-xs text-gold/90 shadow-[0_0_0_1px_rgba(212,175,55,0.10)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            로컬 테스트 페이지 (/test)
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">운명전쟁49 - 사주 API 연결 점검</h1>
          <p className="mt-3 text-sm text-white/70">
            목적: 로컬에서 Gemini 키/네트워크/빌드 환경에 문제가 없는지 빠르게 확인합니다.
          </p>
        </header>

        <TalismanFrame
          title="테스트 입력"
          subtitle="샘플 값이 기본으로 채워져 있습니다. 수정 후 실행하세요."
          className=""
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/85">이름</span>
              <input
                className="rounded-2xl border border-gold/15 bg-black/35 px-4 py-3 text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-gold/35 focus:shadow-glowGold focus:ring-2 focus:ring-gold/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/85">생년월일</span>
              <input
                className="rounded-2xl border border-gold/15 bg-black/35 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-gold/35 focus:shadow-glowGold focus:ring-2 focus:ring-gold/20"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/85">태어난 시간</span>
              <input
                className="rounded-2xl border border-gold/15 bg-black/35 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-gold/35 focus:shadow-glowGold focus:ring-2 focus:ring-gold/20"
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <RitualButton onClick={run} disabled={!canSubmit} className="w-full sm:w-auto">
              API 테스트 실행
            </RitualButton>
            <p className="text-xs text-white/55">
              참고: `.env.local`에 <span className="text-gold/90">GEMINI_API_KEY</span>가 없으면 500 에러가 정상입니다.
            </p>
          </div>

          {isLoading ? (
            <div className="loading-card is-loading relative mt-6 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-gold/15 bg-black/20 p-5">
              <QiFlowLine className="-mt-2 h-10 w-full max-w-[420px] opacity-90" />
              <TaegukSpinner label="사주 분석 로딩" />
              <p className="text-sm text-white/75">명리학자가 당신의 사주를 분석 중입니다...</p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-crimson/30 bg-[linear-gradient(135deg,rgba(139,0,0,0.25),rgba(0,0,0,0.25))] p-4 text-sm text-white/85 shadow-glowCrimson">
              <p className="font-semibold text-white">에러</p>
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
        </TalismanFrame>

        <TalismanFrame
          title="Raw 응답(디버그)"
          subtitle="상태코드/요청 payload/응답 JSON을 그대로 보여줍니다."
          className=""
        >
          <pre className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-white/80">
            {raw ? JSON.stringify(raw, null, 2) : "아직 실행하지 않았습니다."}
          </pre>
        </TalismanFrame>
      </div>
    </main>
  );
}

