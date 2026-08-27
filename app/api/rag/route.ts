import { NextRequest } from 'next/server'
import { getRagJudgment } from '@/lib/rag'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, country, airline, baggageType, category } = body

    if (!query) {
      return Response.json({ error: 'query is required' }, { status: 400 })
    }

    const result = await getRagJudgment({
      query,
      country,
      airline,
      baggageType,
      category,
    })

    return Response.json(result)
  } catch (error) {
    console.error('RAG API error:', error)
    const detail = error instanceof Error ? error.message : 'Unknown RAG error'
    const upstreamFailure = detail.startsWith('OpenAI judgment failed') || detail.startsWith('OpenAI embed')
    return Response.json(
      { error: 'RAG request failed', detail: process.env.NODE_ENV === 'production' ? undefined : detail },
      { status: upstreamFailure ? 502 : 500 },
    )
  }
}
