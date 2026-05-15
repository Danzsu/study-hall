import { requireAdmin } from '@/lib/auth-middleware'

export async function POST(req) {
  const admin = await requireAdmin(req)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { textChunk, chunkId, images } = body
  if (!textChunk || typeof textChunk !== 'string') {
    return Response.json({ error: 'textChunk required' }, { status: 400 })
  }

  // Dynamic require — scripts/ is CommonJS, this route is ESM
  const { extractFacts } = await import('../../../../scripts/llm-service.js')

  try {
    const result = await extractFacts(textChunk, chunkId || '', images || [])
    if (!result.ok) return Response.json({ error: 'Fact extraction failed', raw: result.raw?.slice(0, 500) }, { status: 502 })
    return Response.json({ facts: result.data })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 })
  }
}
