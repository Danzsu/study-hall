import fs from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'
import { verifyIdToken, isAdminEmail } from '@/lib/firebase-admin'

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

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

async function callLLM(systemPrompt, userMessage) {
  const providers = [
    {
      key: process.env.GOOGLE_AI_KEY,
      base: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model: 'gemini-2.5-flash',
    },
    {
      key: process.env.GROQ_API_KEY,
      base: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile',
    },
  ]

  for (const p of providers) {
    if (!p.key) continue
    try {
      const client = new OpenAI({ apiKey: p.key, baseURL: p.base })
      const res = await client.chat.completions.create({
        model: p.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 4000,
        temperature: 0.4,
      })
      return res.choices[0].message.content
    } catch (e) {
      console.error(`[generate-notes] LLM provider ${p.base} failed:`, e.message)
    }
  }
  throw new Error('All LLM providers failed')
}

function parseImageCandidates(mdx) {
  const lines = mdx.split('\n')
  const imageCandidates = []
  const cleanedLines = []

  for (const line of lines) {
    // Match: IMAGE_NEEDED: "concept | imagePrompt"
    const match = line.match(/IMAGE_NEEDED:\s*"([^"]+)"/)
    if (match) {
      const parts = match[1].split('|')
      const concept = parts[0]?.trim() || ''
      const imagePrompt = parts.slice(1).join('|').trim() || ''
      const placeholder = `IMAGE_NEEDED_${imageCandidates.length}`
      imageCandidates.push({ concept, imagePrompt, placeholder })
      cleanedLines.push(placeholder)
    } else {
      cleanedLines.push(line)
    }
  }

  return { cleanedMdx: cleanedLines.join('\n'), imageCandidates }
}

function extractSectionTitle(mdx) {
  const match = mdx.match(/^##\s+(.+)$/m)
  return match ? match[1].trim() : ''
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

  const {
    textChunk,
    chunkIndex = 0,
    totalChunks = 1,
    subjectName = 'Unknown Subject',
    slug = 'unknown',
    difficulty = 'medium',
    previousContext = '',
  } = body

  if (!textChunk || typeof textChunk !== 'string') {
    return Response.json({ error: 'textChunk required' }, { status: 400 })
  }

  // Load system prompt
  const systemPromptPath = path.join(PROMPTS_DIR, 'system_notes_generator.txt')
  let systemPrompt
  if (fs.existsSync(systemPromptPath)) {
    systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8')
  } else {
    systemPrompt = `You are an expert educational content writer. Generate comprehensive MDX study notes in Hungarian for the given text chunk. Use ## for main sections, ### for subsections. Include key concepts, definitions, and explanations. For any concept that would benefit from a visual diagram, add a line: IMAGE_NEEDED: "concept name | detailed image prompt for an educational diagram". Keep the language academic but accessible.`
  }

  // Build user message
  const contextBlock = previousContext
    ? `Context from previous sections:\n${previousContext}\n\n---\n\n`
    : ''

  const userMessage = `${contextBlock}Subject: ${subjectName} (slug: ${slug})
Difficulty: ${difficulty}
Chunk ${chunkIndex + 1} of ${totalChunks}

Text to transform into study notes:
---
${textChunk}
---

Generate detailed MDX study notes for this section. Start with a ## heading that describes the section topic.`

  let rawMdx
  try {
    rawMdx = await callLLM(systemPrompt, userMessage)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 })
  }

  const { cleanedMdx, imageCandidates } = parseImageCandidates(rawMdx)
  const sectionTitle = extractSectionTitle(cleanedMdx)

  return Response.json({
    mdxContent: cleanedMdx,
    imageCandidates,
    sectionTitle,
  })
}
