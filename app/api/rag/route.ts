import { NextRequest } from 'next/server'

// 간단한 RAG API 스켈레톤
// TODO: LangChain 또는 직접 LLM 호출 + 벡터 DB 검색 로직으로 교체

export async function POST(req: NextRequest) {
  try {
    const { query, country, airline, baggageType } = await req.json()

    // TODO: 1) 벡터 DB로 관련 문서 검색 2) LLM에 검색 결과와 query 전달하여 판정

    const answer = {
      verdict: 'CHECK',
      explanation: '샘플 응답입니다. 실제 규정 기반 판단은 ingest 후 작동합니다.',
      sources: [],
    }

    return new Response(JSON.stringify(answer), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
