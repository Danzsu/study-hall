import fs from 'node:fs'
import path from 'node:path'
import { verifyIdToken, isAdminEmail } from '@/lib/firebase-admin'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

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
  return String(slug || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 80)
}

function padIndex(n) {
  return String(n).padStart(2, '0')
}

function buildFrontmatter(lesson, index) {
  return `---\ntitle: "${lesson.title}"\nlesson: ${index + 1}\nsection: "${lesson.section}"\ntime: "${lesson.time || '10 min'}"\n---\n`
}

export async function POST(req) {
  const admin = await requireAdmin(req)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { slug, name, lessons, mode = 'overwrite' } = body

  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 })
  if (!Array.isArray(lessons) || lessons.length === 0) {
    return Response.json({ error: 'lessons array required' }, { status: 400 })
  }

  const safeSlug = sanitizeSlug(slug)
  if (!safeSlug) return Response.json({ error: 'invalid slug' }, { status: 400 })

  const notesDir = path.join(CONTENT_ROOT, safeSlug, 'notes')
  fs.mkdirSync(notesDir, { recursive: true })

  // Determine final lesson list (merge or overwrite)
  let finalLessons = lessons
  if (mode === 'append') {
    const lessonsJsonPath = path.join(notesDir, 'lessons.json')
    if (fs.existsSync(lessonsJsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(lessonsJsonPath, 'utf-8'))
        const existingSlugs = new Set(existing.map(l => l.slug))
        const newOnes = lessons.filter(l => !existingSlugs.has(l.slug))
        finalLessons = [...existing, ...newOnes.map(l => ({
          // Strip mdxContent when merging existing metadata — it may not be present there
          slug: l.slug,
          title: l.title,
          section: l.section,
          time: l.time || '10 min',
          lesson: l.lesson,
          // Carry mdxContent through for file writing below
          mdxContent: l.mdxContent,
        }))]
      } catch { /* ignore parse errors, fall through to overwrite */ }
    }
  }

  // Write individual .mdx files
  for (let i = 0; i < finalLessons.length; i++) {
    const lesson = finalLessons[i]
    if (!lesson.mdxContent) continue // skip meta-only entries from append merge

    const mdxFileName = `${padIndex(i + 1)}-${lesson.slug}.mdx`
    const mdxFilePath = path.join(notesDir, mdxFileName)

    let mdxContent = lesson.mdxContent
    if (!mdxContent.trimStart().startsWith('---')) {
      mdxContent = buildFrontmatter(lesson, i) + '\n' + mdxContent
    }

    fs.writeFileSync(mdxFilePath, mdxContent, 'utf-8')
  }

  // Build lessons.json (without mdxContent)
  const lessonsMetadata = finalLessons.map((lesson, i) => ({
    slug: lesson.slug,
    title: lesson.title,
    lesson: lesson.lesson ?? i + 1,
    section: lesson.section || 'General',
    time: lesson.time || '10 min',
  }))
  fs.writeFileSync(path.join(notesDir, 'lessons.json'), JSON.stringify(lessonsMetadata, null, 2), 'utf-8')

  // Update subjects.json — set lessonCount
  const subjectsPath = path.join(CONTENT_ROOT, 'subjects.json')
  let subjects = []
  if (fs.existsSync(subjectsPath)) {
    try { subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8')) } catch { /* ignore */ }
  }
  const existingIdx = subjects.findIndex(s => s.slug === safeSlug)
  const subjectEntry = {
    ...(existingIdx >= 0 ? subjects[existingIdx] : {}),
    slug: safeSlug,
    name: name || (existingIdx >= 0 ? subjects[existingIdx].name : safeSlug),
    lessonCount: lessonsMetadata.length,
  }
  if (existingIdx >= 0) subjects[existingIdx] = subjectEntry
  else subjects.push(subjectEntry)
  fs.writeFileSync(subjectsPath, JSON.stringify(subjects, null, 2), 'utf-8')

  // Clear in-memory content cache so new files are visible immediately
  try {
    const { clearCache } = await import('../../../../lib/content.js')
    clearCache?.()
  } catch { /* non-fatal */ }

  return Response.json({ ok: true, slug: safeSlug, lessonCount: lessonsMetadata.length })
}
