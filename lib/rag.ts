import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const geminiApiKey = process.env.GEMINI_API_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
export const gemini = new GoogleGenerativeAI(geminiApiKey)

export async function getEmbedding(text: string) {
  const model = gemini.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  return result.embedding?.values ?? []
}

export async function retrieveRelevantDocs({
  query,
  country,
  airline,
  baggageType,
  category,
  limit = 5,
}: {
  query: string
  country?: string
  airline?: string
  baggageType?: string
  category?: string
  limit?: number
}) {
  const embedding = await getEmbedding(query)

  let queryBuilder = supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: limit,
  })

  if (country) {
    queryBuilder = supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: limit,
      filter_country: country,
    })
  }

  if (airline) {
    queryBuilder = supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: limit,
      filter_country: country ?? '',
      filter_airline: airline,
    })
  }

  const { data, error } = await queryBuilder
  if (error) throw error

  return data ?? []
}

export async function getRagJudgment({
  query,
  country,
  airline,
  baggageType,
  category,
}: {
  query: string
  country?: string
  airline?: string
  baggageType?: string
  category?: string
}) {
  const docs = await retrieveRelevantDocs({
    query,
    country,
    airline,
    baggageType,
    category,
    limit: 5,
  })

  const context = docs
    .map((doc: any, idx: number) => `Source ${idx + 1}: ${doc.content}\nMetadata: ${JSON.stringify(doc.metadata)}`)
    .join('\n\n')

  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const prompt = `
    너는 항공 수하물 규정 분석 어시스턴트야.
    아래 문서 근거를 기준으로 사용자의 물품과 여행 조건에 대해 판정해.
    반드시 JSON 형식으로만 답변해.

    규칙:
    - verdict는 PACK, CHECK, PASS 중 하나여야 함
    - explanation은 한글로 1~3문장 작성
    - sources는 근거 문서 목록

    사용자 질문:
    ${query}

    문서 근거:
    ${context || '관련 문서를 찾지 못했습니다.'}

    JSON 형태:
    {
      "verdict": "PACK|CHECK|PASS",
      "explanation": "...",
      "sources": [{"source": "...", "snippet": "..."}]
    }
  `

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  try {
    return JSON.parse(text)
  } catch {
    return {
      verdict: 'CHECK',
      explanation: text,
      sources: docs.map((doc: any) => ({ source: doc.metadata?.source ?? 'document', snippet: doc.content })),
    }
  }
}
