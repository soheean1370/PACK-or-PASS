import 'dotenv/config'
import { getEmbedding } from '../lib/rag'

async function test() {
  const text = 'test embedding'
  try {
    const emb = await getEmbedding(text)
    const sum = emb.reduce((s: number, v: any) => s + Number(v || 0), 0)
    console.log('embedding length:', emb.length, 'sum:', sum)
    if (sum === 0) {
      console.log('Result looks like zero-vector; no embedding model succeeded')
      process.exit(2)
    }
    console.log('Embedding appears valid')
  } catch (e) {
    console.error('Embedding test failed', e)
    process.exit(1)
  }
}

test()
