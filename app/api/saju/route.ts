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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "서버 환경변수 GEMINI_API_KEY가 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as SajuRequestBody;
    const name = (body.name ?? "").trim();
    const birthDate = (body.birthDate ?? "").trim();
    const birthTime = (body.birthTime ?? "").trim();

    if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    if (!isValidDateYYYYMMDD(birthDate)) {
      return NextResponse.json({ error: "생년월일은 YYYY-MM-DD 형식으로 입력해주세요." }, { status: 400 });
    }
    if (!isValidTimeHHMM(birthTime)) {
      return NextResponse.json({ error: "태어난 시간은 HH:MM(24시간) 형식으로 입력해주세요." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
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

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    return NextResponse.json({ result: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "사주 분석 요청 중 오류가 발생했습니다.", details: message }, { status: 500 });
  }
}

