import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CachedValue = { text: string; expiresAt: number };
const sajuCache = new Map<string, CachedValue>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type SajuRequestBody = {
  name?: string;
  birthDate?: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM
};

const SYSTEM_PROMPT =
  "너는 '운명전쟁49' 프로그램에 등장하는 최고의 사주명리학자야. 사용자의 생년월일시를 바탕으로 성격, 재물운, 연애운, 올해의 주의할 점을 아주 신비롭고 단호한 어조로, 하지만 희망적인 메시지를 담아 3문단으로 풀이해줘.";

function normalizeBirthDate(input: string) {
  const v = input.trim();
  // Common localized display: "1982. 04. 27." / "1982.04.27."
  const m = v.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
  if (m) {
    const y = m[1];
    const mm = m[2].padStart(2, "0");
    const dd = m[3].padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  return v;
}

function normalizeBirthTime(input: string) {
  const v = input.trim();
  // Common localized display in some browsers: "오전 10:00", "오후 3:05"
  const m = v.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (m) {
    const ampm = m[1];
    let hh = Number(m[2]);
    const mm = m[3];
    if (ampm === "오전") {
      if (hh === 12) hh = 0;
    } else {
      if (hh !== 12) hh += 12;
    }
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  return v;
}

function isValidDateYYYYMMDD(v: string) {
  // Basic format check + actual date check
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isValidTimeHHMM(v: string) {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [hh, mm] = v.split(":").map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function getCacheKey(name: string, birthDate: string, birthTime: string) {
  return `${name.toLowerCase()}|${birthDate}|${birthTime}`;
}

function getCached(key: string) {
  const v = sajuCache.get(key);
  if (!v) return null;
  if (Date.now() > v.expiresAt) {
    sajuCache.delete(key);
    return null;
  }
  return v.text;
}

function setCached(key: string, text: string) {
  sajuCache.set(key, { text, expiresAt: Date.now() + CACHE_TTL_MS });
  // very small & simple eviction
  if (sajuCache.size > 200) {
    const firstKey = sajuCache.keys().next().value as string | undefined;
    if (firstKey) sajuCache.delete(firstKey);
  }
}

function extractStatusCode(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const anyErr = err as any;
  const candidates = [anyErr.status, anyErr.statusCode, anyErr.code, anyErr.response?.status];
  for (const c of candidates) {
    if (typeof c === "number") return c;
    if (typeof c === "string" && /^\d+$/.test(c)) return Number(c);
  }
  return undefined;
}

function isRateLimitError(err: unknown, message?: string) {
  const m = (message ?? (err instanceof Error ? err.message : String(err))).toLowerCase();
  const status = extractStatusCode(err);
  return status === 429 || m.includes("429") || m.includes("resource exhausted") || m.includes("rate") || m.includes("quota");
}

function toUserFriendlyGeminiError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("429") || m.includes("resource exhausted") || m.includes("rate") || m.includes("quota")) {
    return "Gemini API 호출 한도(Quota/Rate limit)에 걸렸습니다. 잠시 후 다시 시도하거나 플랜/쿼터를 확인해주세요.";
  }
  if (m.includes("api key") && (m.includes("invalid") || m.includes("not valid"))) {
    return "Gemini API 키가 유효하지 않습니다. Netlify/로컬 환경변수 GEMINI_API_KEY를 다시 확인해주세요.";
  }
  if (m.includes("permission") || m.includes("unauthorized") || m.includes("forbidden") || m.includes("403")) {
    return "Gemini API 권한 오류가 발생했습니다. API 키 권한/결제/프로젝트 설정을 확인해주세요.";
  }
  if (m.includes("not found") || m.includes("404") || m.includes("model")) {
    return "Gemini 모델 호출에 실패했습니다(모델/리전/권한). 잠시 후 다시 시도하거나 설정을 확인해주세요.";
  }
  if (m.includes("fetch failed") || m.includes("enotfound") || m.includes("econn") || m.includes("timeout")) {
    return "외부 AI 서버 통신에 실패했습니다(네트워크/타임아웃). 잠시 후 다시 시도해주세요.";
  }
  return "사주 분석 요청 중 오류가 발생했습니다.";
}

export async function POST(req: Request) {
  const requestId = globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}`;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "서버 환경변수 GEMINI_API_KEY가 설정되어 있지 않습니다.", requestId },
        { status: 500 }
      );
    }

    const body = (await req.json()) as SajuRequestBody;
    const name = (body.name ?? "").trim();
    const birthDate = normalizeBirthDate(body.birthDate ?? "");
    const birthTime = normalizeBirthTime(body.birthTime ?? "");
    const cacheKey = getCacheKey(name, birthDate, birthTime);

    if (!name) return NextResponse.json({ error: "이름을 입력해주세요.", requestId }, { status: 400 });
    if (!isValidDateYYYYMMDD(birthDate)) {
      return NextResponse.json(
        { error: "생년월일은 YYYY-MM-DD 형식으로 입력해주세요.", requestId, received: birthDate },
        { status: 400 }
      );
    }
    if (!isValidTimeHHMM(birthTime)) {
      return NextResponse.json(
        { error: "태어난 시간은 HH:MM(24시간) 형식으로 입력해주세요.", requestId, received: birthTime },
        { status: 400 }
      );
    }

    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ result: cached, requestId, cached: true });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      // 가장 흔히 동작하는 라인업부터
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest",
      // 환경에 따라 2.0 계열이 열려 있는 경우가 있어 fallback으로 시도
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite"
    ];

    const userPrompt = [
      `사용자 이름: ${name}`,
      `생년월일: ${birthDate}`,
      `태어난 시간: ${birthTime}`,
      "",
      "위 정보를 바탕으로 사주를 풀이해줘."
    ].join("\n");

    let text = "";
    const errors: Array<{ model: string; message: string; phase: "systemInstruction" | "inlinePrompt" }> = [];

    async function tryGenerate(modelName: string, phase: "systemInstruction" | "inlinePrompt") {
      const model =
        phase === "systemInstruction"
          ? genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT })
          : genAI.getGenerativeModel({ model: modelName });

      const prompt = phase === "systemInstruction" ? userPrompt : `${SYSTEM_PROMPT}\n\n${userPrompt}`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    // 1) systemInstruction 지원 모델이면 우선 이 방식으로 시도
    for (const modelName of candidateModels) {
      try {
        text = await tryGenerate(modelName, "systemInstruction");
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // 429는 재시도/다른 모델 시도가 오히려 호출량만 늘릴 수 있어 즉시 중단
        if (isRateLimitError(e, msg)) throw e;
        errors.push({ model: modelName, message: msg, phase: "systemInstruction" });
        console.error("[/api/saju] generateContent failed (systemInstruction)", { requestId, modelName, msg });
      }
    }

    // 2) 실패 시: systemInstruction 미지원/환경 이슈 대비 inline prompt로 재시도
    if (!text) {
      for (const modelName of candidateModels) {
        try {
          text = await tryGenerate(modelName, "inlinePrompt");
          break;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (isRateLimitError(e, msg)) throw e;
          errors.push({ model: modelName, message: msg, phase: "inlinePrompt" });
          console.error("[/api/saju] generateContent failed (inlinePrompt)", { requestId, modelName, msg });
        }
      }
    }

    if (!text) {
      const last = errors.at(-1)?.message ?? "Unknown error";
      throw new Error(
        `All Gemini model attempts failed. last=${last} attempts=${errors
          .slice(0, 6)
          .map((e) => `${e.model}:${e.phase}`)
          .join(",")}`
      );
    }

    setCached(cacheKey, text);
    return NextResponse.json({ result: text, requestId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/saju] error", { requestId, message, err });
    if (isRateLimitError(err, message)) {
      const retryAfterSeconds = 20;
      return NextResponse.json(
        {
          error: "Gemini API 호출 한도(Quota/Rate limit)에 걸렸습니다. 잠시 후 다시 시도하거나 플랜/쿼터를 확인해주세요.",
          details: message,
          requestId,
          retryAfterSeconds
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }
    return NextResponse.json({ error: toUserFriendlyGeminiError(message), details: message, requestId }, { status: 500 });
  }
}

