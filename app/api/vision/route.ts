import { NextRequest } from 'next/server'

const MAX_IMAGE_BYTES = 6 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type VisionResult = {
  name: string
  category: 'battery' | 'liquids' | 'food' | 'medicine' | 'electronics' | 'unknown'
  summary: string
  visibleDetails: string[]
  confidence: number
  needsManualInput: boolean
}

function parseDataUrl(image: unknown) {
  if (typeof image !== 'string') return null
  const match = image.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/)
  if (!match || !SUPPORTED_TYPES.has(match[1])) return null
  const bytes = Buffer.byteLength(match[2], 'base64')
  if (bytes < 4 * 1024 || bytes > MAX_IMAGE_BYTES) return null
  return { dataUrl: image, mimeType: match[1] }
}

function parseVisionResult(content: string): VisionResult | null {
  try {
    const result = JSON.parse(content)
    const categories = new Set(['battery', 'liquids', 'food', 'medicine', 'electronics', 'unknown'])
    if (typeof result?.name !== 'string' || !categories.has(result?.category)) return null

    return {
      name: result.name,
      category: result.category,
      summary: typeof result.summary === 'string' ? result.summary : '',
      visibleDetails: Array.isArray(result.visibleDetails) ? result.visibleDetails.filter((value: unknown) => typeof value === 'string').slice(0, 5) : [],
      confidence: typeof result.confidence === 'number' ? Math.min(1, Math.max(0, result.confidence)) : 0,
      needsManualInput: Boolean(result.needsManualInput),
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 503 })

  try {
    const body = await req.json()
    const image = parseDataUrl(body?.image)
    if (!image) {
      return Response.json({ error: 'JPEG, PNG, or WebP image under 6MB is required.' }, { status: 400 })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You identify a single travel item in a photograph for baggage rules. Never guess brand, capacity, ingredients, or labels that are not visibly legible. Return JSON only with name, category, summary, visibleDetails, confidence, needsManualInput. category must be one of battery, liquids, food, medicine, electronics, unknown. Set needsManualInput true whenever the item is unclear or a regulation-critical detail such as battery Wh/mAh or liquid volume is not legible.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify the main travel item. Write name, summary, and visibleDetails in Korean.' },
              { type: 'image_url', image_url: { url: image.dataUrl, detail: 'high' } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Vision API failed:', response.status, await response.text())
      return Response.json({ error: '이미지 인식 요청에 실패했습니다.' }, { status: 502 })
    }

    const data = await response.json()
    const result = parseVisionResult(data?.choices?.[0]?.message?.content ?? '')
    if (!result) return Response.json({ error: '이미지 인식 결과를 해석하지 못했습니다.' }, { status: 502 })
    return Response.json(result)
  } catch (error) {
    console.error('Vision API error:', error)
    return Response.json({ error: '이미지 인식 요청에 실패했습니다.' }, { status: 500 })
  }
}
