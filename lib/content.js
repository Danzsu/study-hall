import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getSubjects() {
  return readJSON(path.join(CONTENT_DIR, 'subjects.json')) ?? []
}

export function getSubject(slug) {
  return getSubjects().find((s) => s.slug === slug) ?? null
}

export function getQuestions(slug) {
  return readJSON(path.join(CONTENT_DIR, slug, 'questions.json')) ?? []
}

export function getFlashcards(slug) {
  return readJSON(path.join(CONTENT_DIR, slug, 'flashcards.json')) ?? []
}

export function getGlossary(slug) {
  return readJSON(path.join(CONTENT_DIR, slug, 'glossary.json')) ?? []
}

export function getNotesLessons(slug) {
  const notesDir = path.join(CONTENT_DIR, slug, 'notes')
  if (!fs.existsSync(notesDir)) return []

  const lessons = []
  for (const file of fs.readdirSync(notesDir).filter(f => f.endsWith('.mdx')).sort()) {
    const raw = fs.readFileSync(path.join(notesDir, file), 'utf-8')
    const fm = parseFrontmatter(raw)
    lessons.push({
      slug: file.replace('.mdx', ''),
      title: fm.title ?? file,
      lesson: Number(fm.lesson ?? 1),
      section: fm.section ?? 'General',
      sources: fm.sources,
    })
  }
  return lessons.sort((a, b) => a.lesson - b.lesson)
}

export function getNoteContent(subjectSlug, lessonSlug) {
  const filePath = path.join(CONTENT_DIR, subjectSlug, 'notes', `${lessonSlug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  return { frontmatter: parseFrontmatter(raw), content: raw.replace(/^---[\s\S]*?---\n/, '') }
}

export function getSubjectSections(slug) {
  return [...new Set(getQuestions(slug).map(q => q.section))]
}

export function getSubjectSectionInfos(slug) {
  const map = new Map()
  for (const q of getQuestions(slug)) map.set(q.section, (map.get(q.section) ?? 0) + 1)
  return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
}

function parseFrontmatter(raw) {
  const match = /^---\n([\s\S]*?)\n---/.exec(raw)
  if (!match) return {}
  const result = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (val.startsWith('"') && val.endsWith('"')) result[key] = val.slice(1, -1)
    else if (val !== '' && !Number.isNaN(Number(val))) result[key] = Number(val)
    else result[key] = val
  }
  return result
}
