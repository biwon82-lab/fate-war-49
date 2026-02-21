import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

function toUserFriendlyGeminiError(message: string) {
  const m = message.toLowerCase();
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

    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT
    });

    const userPrompt = [
      `사용자 이름: ${name}`,
      `생년월일: ${birthDate}`,
      `태어난 시간: ${birthTime}`,
      "",
      "위 정보를 바탕으로 사주를 풀이해줘."
    ].join("\n");

    let text = "";
    try {
      const result = await model.generateContent(userPrompt);
      text = result.response.text();
    } catch (e) {
      // SDK/환경 차이로 systemInstruction이 동작하지 않는 경우를 대비해 fallback
      const fallbackMessage = e instanceof Error ? e.message : String(e);
      console.error("[/api/saju] primary generateContent failed", { requestId, fallbackMessage });
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const fallbackPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
      const result = await model.generateContent(fallbackPrompt);
      text = result.response.text();
    }

    return NextResponse.json({ result: text, requestId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/saju] error", { requestId, message, err });
    return NextResponse.json(
      { error: toUserFriendlyGeminiError(message), details: message, requestId },
      { status: 500 }
    );
  }
}

