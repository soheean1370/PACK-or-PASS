import 'dotenv/config'

async function main() {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error('GEMINI_API_KEY not set in env')
    process.exit(1)
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models'
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Failed to list models', res.status, res.statusText, text)
    process.exit(2)
  }

  const data = await res.json()
  const models = data.models || []
  console.log(`Found ${models.length} models`)
  for (const m of models) {
    const name = m.name || m.model || m.id || JSON.stringify(m)
    const methods = m.supportedMethods || m.supported_generation || m.supportedUseCases || []
    console.log('- ', name)
    if (methods && methods.length) console.log('   supportedMethods:', methods.join(', '))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
