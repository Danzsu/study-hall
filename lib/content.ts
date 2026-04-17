import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export interface Subject {
  slug: string
  name: string
  description: string
  color: string
  icon: string
  questionCount: number
  lessonCount: number
  flashcardCount?: number
  glossaryCount?: number
}

export interface Question {
  id: string
  type: 'mcq' | 'multi' | 'written'
  question: string
  options?: string[]
  correct?: number | number[]
  explanation?: string
  model_answer?: string
  key_points?: string[]
  section: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface Flashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  tags?: string[]
}

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  category: string
}

export interface NoteLesson {
  slug: string
  title: string
  lesson: number
  section: string
  sources?: { type: string; title: string; author?: string; year?: number; chapter?: string }[]
}

function readJSON<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getSubjects(): Subject[] {
  return readJSON<Subject[]>(path.join(CONTENT_DIR, 'subjects.json')) ?? []
}

export function getSubject(slug: string): Subject | null {
  const subjects = getSubjects()
  return subjects.find((s) => s.slug === slug) ?? null
}

export function getQuestions(slug: string): Question[] {
  return readJSON<Question[]>(path.join(CONTENT_DIR, slug, 'questions.json')) ?? []
}

export function getFlashcards(slug: string): Flashcard[] {
  return readJSON<Flashcard[]>(path.join(CONTENT_DIR, slug, 'flashcards.json')) ?? []
}

export function getGlossary(slug: string): GlossaryTerm[] {
  return readJSON<GlossaryTerm[]>(path.join(CONTENT_DIR, slug, 'glossary.json')) ?? []
}

export function getNotesLessons(slug: string): NoteLesson[] {
  const notesDir = path.join(CONTENT_DIR, slug, 'notes')
  if (!fs.existsSync(notesDir)) return []

  const files = fs.readdirSync(notesDir).filter((f) => f.endsWith('.mdx'))
  const lessons: NoteLesson[] = []

  for (const file of files.sort()) {
    const raw = fs.readFileSync(path.join(notesDir, file), 'utf-8')
    const frontmatter = parseFrontmatter(raw)
    lessons.push({
      slug: file.replace('.mdx', ''),
      title: frontmatter.title ?? file,
      lesson: Number(frontmatter.lesson ?? 1),
      section: frontmatter.section ?? 'General',
      sources: frontmatter.sources,
    })
  }

  return lessons.sort((a, b) => a.lesson - b.lesson)
}

export function getNoteContent(subjectSlug: string, lessonSlug: string): { frontmatter: Record<string, unknown>; content: string } | null {
  const filePath = path.join(CONTENT_DIR, subjectSlug, 'notes', `${lessonSlug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const frontmatter = parseFrontmatter(raw)
  const content = raw.replace(/^---[\s\S]*?---\n/, '')

  return { frontmatter, content }
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---/.exec(raw)
  if (!match) return {}

  const result: Record<string, unknown> = {}
  const lines = match[1].split('\n')

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (val.startsWith('"') && val.endsWith('"')) {
      result[key] = val.slice(1, -1)
    } else if (val !== '' && !Number.isNaN(Number(val))) {
      result[key] = Number(val)
    } else {
      result[key] = val
    }
  }

  return result
}

export function getSubjectSections(slug: string): string[] {
  const questions = getQuestions(slug)
  const sections = [...new Set(questions.map((q) => q.section))]
  return sections
}

export interface SectionInfo {
  name: string
  total: number
}

/** Returns each unique section with its question count for a subject */
export function getSubjectSectionInfos(slug: string): SectionInfo[] {
  const questions = getQuestions(slug)
  const map = new Map<string, number>()
  for (const q of questions) {
    map.set(q.section, (map.get(q.section) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
}
