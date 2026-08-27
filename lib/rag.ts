import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const geminiApiKey = process.env.GEMINI_API_KEY || ''
const openaiKey = process.env.OPENAI_API_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)
export const gemini = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null

async function tryGeminiEmbedding(text: string, modelName: string) {
  if (!gemini) return null
  try {
    const model = gemini.getGenerativeModel({ model: modelName })
    const result = await model.embedContent(text)
    const vals = result?.embedding?.values
    if (vals && vals.length) return vals
  } catch (err: any) {
    console.warn('Gemini embed failed:', modelName, err?.message ?? err)
  }
  return null
}

async function tryOpenAIEmbedding(text: string, modelName: string) {
  if (!openaiKey) return null
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ model: modelName, input: text }),
    })
    if (!res.ok) {
      const txt = await res.text()
      console.warn('OpenAI embed failed', res.status, txt)
      return null
    }
    const data = await res.json()
    const vals = data?.data?.[0]?.embedding
    if (vals && vals.length) return vals
  } catch (err: any) {
    console.warn('OpenAI embed error', err?.message ?? err)
  }
  return null
}

export async function getEmbedding(text: string) {
  // The OpenAI model matches the configured vector(1536) column and should be
  // used first when its key is available, especially during bulk ingestion.
  const openaiModel = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small'
  const openaiCandidates = [openaiModel, 'text-embedding-3-small', 'text-embedding-3-large'].filter(
    (model, index, models) => models.indexOf(model) === index,
  )
  for (const m of openaiCandidates) {
    const vals = await tryOpenAIEmbedding(text, m)
    if (vals) {
      console.log('Embedding model (OpenAI) success:', m)
      return vals
    }
  }

  // Fall back to Gemini if OpenAI is not configured or unavailable.
  const preferred = process.env.GEMINI_EMBED_MODEL
  const geminiCandidates = [preferred, 'text-embedding-004', 'textembedding-gecko-001', 'embed-text-001'].filter(Boolean)
  for (const m of geminiCandidates) {
    const vals = await tryGeminiEmbedding(text, m!)
    if (vals) {
      console.log('Embedding model (Gemini) success:', m)
      return vals
    }
  }

  // fallback: return zero vector with configured dim
  const dim = Number(process.env.VECTOR_DIM || 1536)
  console.warn('No embedding model succeeded; falling back to zero-vector of dim', dim)
  return new Array(dim).fill(0)
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

  let text: string
  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    })
    if (!res.ok) throw new Error(`OpenAI judgment failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    text = data?.choices?.[0]?.message?.content ?? ''
  } else if (gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    text = result.response.text()
  } else {
    throw new Error('Set OPENAI_API_KEY or GEMINI_API_KEY to generate a judgment.')
  }

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
