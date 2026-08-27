import dotenv from 'dotenv'
dotenv.config()
import { getEmbedding } from '../lib/rag'

async function main(){
  const text = 'test embedding for pack or pass system'
  const v = await getEmbedding(text)
  console.log('embedding length:', v.length)
  console.log('preview:', v.slice(0,5))
}

main().catch((e)=>{console.error(e); process.exit(1)})
