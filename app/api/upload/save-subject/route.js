import fs from 'node:fs'
import path from 'node:path'
import { requireAdmin } from '@/lib/auth-middleware'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

function sanitizeSlug(slug) {
  return String(slug || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 80)
}

export async function POST(req) {
  const admin = await requireAdmin(req)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { slug, name, questions, meta, mode = 'overwrite' } = body
  const safeSlug = sanitizeSlug(slug)
  if (!safeSlug) return Response.json({ error: 'slug required' }, { status: 400 })
  if (!Array.isArray(questions) || questions.length === 0) return Response.json({ error: 'questions array required' }, { status: 400 })

  const subjectDir = path.join(CONTENT_ROOT, safeSlug)
  fs.mkdirSync(subjectDir, { recursive: true })

  // Merge or overwrite questions
  let finalQuestions = questions
  if (mode === 'append') {
    const existingPath = path.join(subjectDir, 'questions.json')
    if (fs.existsSync(existingPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'))
        const seen = new Set(existing.map(q => String(q.question || '').toLowerCase().slice(0, 60)))
        const newOnes = questions.filter(q => !seen.has(String(q.question || '').toLowerCase().slice(0, 60)))
        finalQuestions = [...existing, ...newOnes]
      } catch { /* ignore parse errors, overwrite */ }
    }
  }

  // Re-index IDs
  finalQuestions.forEach((q, i) => { q.id = `q${i + 1}` })
  fs.writeFileSync(path.join(subjectDir, 'questions.json'), JSON.stringify(finalQuestions, null, 2), 'utf-8')

  // Update meta.json if provided
  if (meta && typeof meta === 'object') {
    const metaPath = path.join(subjectDir, 'meta.json')
    let existingMeta = {}
    if (fs.existsSync(metaPath)) {
      try { existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) } catch { /* ignore */ }
    }
    fs.writeFileSync(metaPath, JSON.stringify({ ...existingMeta, slug: safeSlug, name: name || existingMeta.name || safeSlug, ...meta }, null, 2), 'utf-8')
  }

  // Update subjects.json
  const subjectsPath = path.join(CONTENT_ROOT, 'subjects.json')
  let subjects = []
  if (fs.existsSync(subjectsPath)) {
    try { subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8')) } catch { /* ignore */ }
  }
  const existing = subjects.findIndex(s => s.slug === safeSlug)
  const entry = {
    ...(existing >= 0 ? subjects[existing] : {}),
    slug: safeSlug,
    name: name || (existing >= 0 ? subjects[existing].name : safeSlug),
    questionCount: finalQuestions.length,
  }
  if (existing >= 0) subjects[existing] = entry
  else subjects.push(entry)
  fs.writeFileSync(subjectsPath, JSON.stringify(subjects, null, 2), 'utf-8')

  return Response.json({ ok: true, slug: safeSlug, questionCount: finalQuestions.length })
}
