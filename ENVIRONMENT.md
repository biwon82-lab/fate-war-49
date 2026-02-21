### 로컬 환경변수 설정 (.env.local)

프로젝트 루트(`/Users/hanjunhee/Desktop/cusor/260221`)에 `.env.local` 파일을 만들고 아래처럼 추가하세요.

```bash
GEMINI_API_KEY=발급받은_키_붙여넣기
```

그 다음 개발 서버를 재시작하면 `app/api/saju/route.ts`에서 `process.env.GEMINI_API_KEY`로 읽어서 Gemini API 호출에 사용합니다.

