# PACK-or-PASS
사진 한 장으로 확인하는 해외여행 반입 가능 물품 검사 서비스

Ingest 문서(임베딩 업로드)

1. 환경변수 설정: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`
2. 의존성 설치: `npm install`
3. 문서 업로드 실행: `npm run ingest`

스크립트는 `docs/` 아래의 markdown 파일을 읽고 임베딩을 생성해 Supabase `documents` 테이블에 업로드합니다.
