import fs from 'node:fs'
import path from 'node:path'
import { verifyIdToken, isAdminEmail } from '@/lib/firebase-admin'

async function requireAdmin(req) {
  const token = req.headers.get('authorization')?.slice(7)
  if (!token) return null
  // Password fallback (when Firebase not configured)
  const adminPw = process.env.ADMIN_PASSWORD
  if (adminPw && token === adminPw) return { email: 'admin', uid: 'local' }
  try {
    const decoded = await verifyIdToken(token)
    return isAdminEmail(decoded.email) ? decoded : null
  } catch {
    return null
  }
}

function sanitizeSlug(slug) {
  return String(slug || '').toLowerCase().replaceAll(/[^a-z0-9_-]/g, '').slice(0, 80)
}

function sanitizeConceptName(name) {
  return String(name || 'image')
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '')
    .slice(0, 40)
}

export async function POST(req) {
  const admin = await requireAdmin(req)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { prompt: imagePrompt, slug, conceptName } = body
  if (!imagePrompt || typeof imagePrompt !== 'string') {
    return Response.json({ error: 'prompt required' }, { status: 400 })
  }
  if (!slug) {
    return Response.json({ error: 'slug required' }, { status: 400 })
  }

  const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY
  if (!GOOGLE_AI_KEY) {
    return Response.json({ error: 'GOOGLE_AI_KEY not set' }, { status: 503 })
  }

  const safeSlug = sanitizeSlug(slug)
  const sanitizedConceptName = sanitizeConceptName(conceptName || 'image')
  const fileName = sanitizedConceptName + '.png'
  const filePath = path.join(process.cwd(), 'public', 'assets', 'generated', safeSlug, fileName)

  const apiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GOOGLE_AI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: `Educational diagram, clean minimal style, white background, clear labels. ${imagePrompt}` }],
        parameters: { sampleCount: 1, aspectRatio: '4:3' },
      }),
      signal: AbortSignal.timeout(30000),
    }
  )

  if (!apiRes.ok) {
    const errText = await apiRes.text()
    return Response.json(
      { error: 'Image generation failed', detail: errText.slice(0, 300) },
      { status: 502 }
    )
  }

  const data = await apiRes.json()
  const base64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!base64) {
    return Response.json({ error: 'No image in response' }, { status: 502 })
  }

  const imgBuffer = Buffer.from(base64, 'base64')
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, imgBuffer)

  return Response.json({ imagePath: `/assets/generated/${safeSlug}/${fileName}` })
}
