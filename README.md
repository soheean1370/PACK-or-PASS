# PACK-or-PASS
사진 한 장으로 확인하는 해외여행 반입 가능 물품 검사 서비스

Ingest 문서(임베딩 업로드)

1. 환경변수 설정: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`
2. 의존성 설치: `npm install`
3. 문서 업로드 실행: `npm run ingest`

스크립트는 `docs/` 아래의 markdown 파일을 읽고 임베딩을 생성해 Supabase `documents` 테이블에 업로드합니다.

주의:
- `SUPABASE_SERVICE_KEY`는 Supabase의 service_role 키여야 하며, RLS(Row Level Security)가 활성화된 테이블에 쓰려면 service_role 키를 사용해야 합니다. `.env`에 익명(anon) 키가 들어있으면 삽입이 실패합니다.
- 키를 절대 깃에 커밋하지 마세요. `.env`에만 저장하고 푸시 전에 항상 `.gitignore`에 추가되어 있는지 확인하세요.

브랜치 & PR:
- 현재 작업 브랜치: `feat/ingest` (원격 push 완료)
- PR 생성: https://github.com/soheean1370/PACK-or-PASS/pull/new/feat/ingest
