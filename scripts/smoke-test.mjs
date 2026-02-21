/**
 * 로컬 스모크 테스트
 * 1) 터미널 A: npm run dev
 * 2) 터미널 B: node scripts/smoke-test.mjs
 */

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const payload = {
  name: "홍길동",
  birthDate: "1997-03-21",
  birthTime: "09:35"
};

const res = await fetch(`${baseUrl}/api/saju`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const json = await res.json().catch(() => null);

console.log(JSON.stringify({ url: `${baseUrl}/api/saju`, status: res.status, ok: res.ok, payload, json }, null, 2));

if (!res.ok) process.exit(1);

