import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const env = process.env
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (service_role) in env')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const dumpPath = path.resolve(process.cwd(), 'scripts/failed_uploads.jsonl')
  let data: string
  try {
    data = await fs.readFile(dumpPath, 'utf-8')
  } catch (e) {
    console.error('No failed uploads file found at', dumpPath)
    process.exit(1)
  }

  const lines = data.split(/\n+/).filter(Boolean)
  console.log(`Found ${lines.length} failed rows to retry`)
  let success = 0
  let fail = 0
  const remaining: string[] = []
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      const row = parsed.row
      const { error } = await supabase.from('documents').insert(row)
      if (error) {
        console.error('Retry insert failed:', error)
        fail++
        remaining.push(line)
      } else {
        success++
      }
    } catch (e) {
      console.error('Failed to parse or insert line:', e)
      fail++
      remaining.push(line)
    }
  }

  await fs.writeFile(dumpPath, remaining.length ? `${remaining.join('\n')}\n` : '', 'utf-8')
  console.log(`Retry finished. success=${success}, fail=${fail}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
