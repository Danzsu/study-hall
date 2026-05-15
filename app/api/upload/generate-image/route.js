import fs from 'node:fs'
import path from 'node:path'
import { requireAdmin } from '@/lib/auth-middleware'

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

function mimeToExt(mimeType) {
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/webp') return '.webp'
  return '.png'
}

// ── Diagram type → style prefix ───────────────────────────────────────────────

const STYLE_PREFIXES = {
  concept: `Clean educational illustration, soft warm palette (cream background, coral and sage
accent colors), rounded shapes, icon-driven design, minimal shadows, generous whitespace,
sans-serif labels 12-14px. Semi-flat illustration style, not photo-realistic.
Example uses: memory layout boxes (stack/heap), triangle diagrams, Venn diagrams, trees.`,

  sketch: `Hand-drawn educational diagram in Excalidraw style: rough sketchy edges on boxes and
arrows, slightly imperfect lines, off-white background, dark gray strokes, occasional
color fills (light blue, light yellow, light green boxes). Clean sans-serif labels despite
the hand-drawn aesthetic. Whiteboard feel — approachable and informal.`,

  flow: `Clean flat-design process flowchart, white background, rounded rectangles for processes,
diamonds for decisions, directional arrows with labels, 3-color palette max (blue process
nodes, orange decision diamonds, gray arrows), bold sans-serif labels 13px, ample whitespace.`,

  arch: `System architecture diagram, white background, flat outlined boxes with 2px borders,
clean sans-serif labels, colored zones (light blue frontend, light green backend, light orange
storage/DB), thin labeled arrows showing data flow, no gradients, no 3D effects.
Blueprint/schematic aesthetic.`,

  compare: `Educational comparison layout, white background, two or three clean columns with colored
header row, alternating very-light-gray row backgrounds, small icons per item, clear visual
hierarchy. Flat design, no 3D. Shows differences and similarities at a glance.`,

  data: `Minimal educational chart, white background, single accent-colored data series, clean gray
axis labels, light or no gridlines, rounded bar tops or smooth line curves, 12px sans-serif
labels. Tufte data-ink ratio — remove everything that doesn't carry information.`,
}

function parseTypeFromPrompt(raw) {
  const match = /^type:(\w+)\s*\|\s*/.exec(String(raw))
  return (match && STYLE_PREFIXES[match[1]]) ? match[1] : 'concept'
}

function cleanImagePrompt(raw) {
  return String(raw).replace(/^type:\w+\s*\|\s*/, '').trim()
}

// ── Image generation functions ────────────────────────────────────────────────

const NANO_BANANA_CHAIN = [
  'gemini-3.0-pro-preview-image-generation',    // Nano Banana Pro — best quality
  'gemini-2.5-flash-preview-image-generation',  // Nano Banana — high volume
  'gemini-3.1-flash-preview-image-generation',  // Nano Banana 2 — extra fallback
]

async function generateWithNanoBanana(fullPrompt, GOOGLE_AI_KEY, model) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
      signal: AbortSignal.timeout(45000),
    }
  )
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    throw new Error(`Permanent error ${res.status} from ${model}`)
  }
  if (!res.ok) return null
  const data = await res.json()
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
  if (!part?.inlineData?.data) return null
  return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' }
}

async function generateWithImagen4Fast(fullPrompt, GOOGLE_AI_KEY) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-002:predict?key=${GOOGLE_AI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: fullPrompt }],
        parameters: { sampleCount: 1, aspectRatio: '4:3' },
      }),
      signal: AbortSignal.timeout(30000),
    }
  )
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    throw new Error(`Permanent error ${res.status} from imagen-4.0-fast-generate-002`)
  }
  if (!res.ok) return null
  const data = await res.json()
  const base64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!base64) return null
  return { base64, mimeType: 'image/png' }
}

// ── POST handler ──────────────────────────────────────────────────────────────

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

  const diagramType = parseTypeFromPrompt(imagePrompt)
  const cleanedPrompt = cleanImagePrompt(imagePrompt)
  const stylePrefix = STYLE_PREFIXES[diagramType]
  const fullPrompt = `${stylePrefix}\n\nDiagram to generate: ${cleanedPrompt}`

  const safeSlug = sanitizeSlug(slug)
  const sanitizedConceptName = sanitizeConceptName(conceptName || cleanedPrompt.slice(0, 40) || 'image')

  // Try Nano Banana chain
  let result = null
  let usedModel = null
  try {
    for (const model of NANO_BANANA_CHAIN) {
      result = await generateWithNanoBanana(fullPrompt, GOOGLE_AI_KEY, model)
      if (result) { usedModel = model; break }
    }

    // Last resort: Imagen 4 Fast
    if (!result) {
      result = await generateWithImagen4Fast(fullPrompt, GOOGLE_AI_KEY)
      if (result) usedModel = 'imagen-4.0-fast-generate-002'
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 })
  }

  if (!result) {
    return Response.json({ error: 'Image generation failed on all providers' }, { status: 502 })
  }

  const ext = mimeToExt(result.mimeType)
  const fileName = sanitizedConceptName + ext
  const filePath = path.join(process.cwd(), 'public', 'assets', 'generated', safeSlug, fileName)

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, Buffer.from(result.base64, 'base64'))

  const metaPath = filePath.replace(/\.(png|jpg|webp)$/, '.meta.json')
  fs.writeFileSync(metaPath, JSON.stringify({
    concept: conceptName,
    type: diagramType,
    originalPrompt: imagePrompt,
    fullPrompt,
    model: usedModel,
    generatedAt: new Date().toISOString(),
    mimeType: result.mimeType,
  }, null, 2))

  return Response.json({ imagePath: `/assets/generated/${safeSlug}/${fileName}` })
}
