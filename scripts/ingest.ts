import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { getEmbedding, supabase } from '../lib/rag'

async function walkDir(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const ent of entries) {
    const res = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      files.push(...(await walkDir(res)))
    } else if (ent.isFile() && res.endsWith('.md')) {
      files.push(res)
    }
  }
  return files
}

function parseFrontmatter(src: string) {
  if (!src.startsWith('---')) return { metadata: {}, body: src }
  const end = src.indexOf('\n---', 3)
  if (end === -1) return { metadata: {}, body: src }
  const fm = src.slice(3, end + 1).trim()
  const body = src.slice(end + 4).trim()
  const metadata: any = {}
  for (const line of fm.split(/\n+/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    metadata[key] = val
  }
  return { metadata, body }
}

function chunkText(text: string, maxChars = 1000) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const chunks: string[] = []
  let buf = ''
  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length > maxChars) {
      if (buf) chunks.push(buf.trim())
      buf = p
    } else {
      buf = buf ? `${buf}\n\n${p}` : p
    }
  }
  if (buf) chunks.push(buf.trim())
  return chunks
}

async function upsertChunks(source: string, metadata: any, chunks: string[]) {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = await getEmbedding(chunk)
    const row = {
      source,
      content: chunk,
      metadata: { ...metadata, chunk_index: i },
      embedding,
    }

    const { error } = await supabase.from('documents').insert(row)
    if (error) {
      console.error('Supabase insert error for', source, error)
    }
  }
}

async function main() {
  const docsDir = path.resolve(process.cwd(), 'docs')
  console.log('Scanning docs in', docsDir)
  const files = await walkDir(docsDir)
  console.log(`Found ${files.length} markdown files`)
  let processed = 0
  for (const file of files) {
    try {
      const src = await fs.readFile(file, 'utf-8')
      const { metadata, body } = parseFrontmatter(src)
      const chunks = chunkText(body, 1200)
      await upsertChunks(path.relative(process.cwd(), file), metadata, chunks)
      processed++
      console.log(`Uploaded ${chunks.length} chunks for ${file}`)
    } catch (err) {
      console.error('Error processing', file, err)
    }
  }
  console.log(`Done. Processed ${processed}/${files.length} files.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
