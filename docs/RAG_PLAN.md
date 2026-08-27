# RAG(문서기반 검색+생성) 기능 설계 (초안)

목표
- 수하물/반입 규정 문서를 기반으로 사용자 질의에 대해 근거 있는 판단(PACK / CHECK / PASS) 제공

아키텍처 개요
- 문서 수집: PDF/HTML/Markdown 규정 문서 저장 (폴더: `docs/`)
- 전처리(ingest): 문서를 문장 단위로 분할하고 임베딩 생성 후 벡터 DB에 upsert (`scripts/ingest.js`)
- 벡터 DB: pgvector / Supabase Vector / Qdrant 중 선택
- 검색: 질의와 문맥 필터(국가/항공사/수하물유형)를 이용한 검색
- 응답: LangChain (or 직접 LLM 호출)로 검색 결과를 근거로 판정 및 근거 반환

핵심 컴포넌트
- `docs/` : 원문 규정 자료
- `scripts/ingest.js` : 문서 전처리 및 벡터 업로드 스크립트
- `app/api/rag/route.ts` : RAG 질의용 서버 엔드포인트
- `lib/rag.ts` : 검색 + LLM 결합 로직 (추후)

환경 변수
- `OPENAI_API_KEY` (또는 사용하려는 LLM 키)
- `VECTOR_DB_URL` (예: Supabase URL or QDRANT_URL)
- `VECTOR_DB_KEY`

데이터 스키마(간단)
- document_id: string
- text: string
- metadata: { country, airline, category, source, url }
- embedding: vector

우선순위(초기 MVP)
1. 설계 및 스켈레톤 코드 추가 (이 PR)
2. 로컬/테스트용 벡터 DB로 ingest 검증 (sqlite/pgvector or qdrant cloud 평가)
3. 간단한 질의 API 구현 및 UI 연동
4. 신뢰도 점수, 소스 인용, 규정 링크 제공

다음 단계
- `npm install langchain openai pgvector` 등 의존성 추가
- 실제 규정 문서(`docs/`) 업로드 후 `node scripts/ingest.js` 실행
- `POST /api/rag`로 쿼리 테스트

참고
- 규정은 법/행정 문서이므로 LLM의 추론을 그대로 신뢰하지 말고, 항상 근거 문서(citation)를 함께 제시하도록 설계할 것
