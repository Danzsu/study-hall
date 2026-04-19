import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const CACHE = new Map()

function cached(key, loader) {
  if (CACHE.has(key)) return CACHE.get(key)
  const value = loader()
  CACHE.set(key, value)
  return value
}

function readJSON(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

export function getSubjects() {
  return cached('subjects', () => readJSON(path.join(CONTENT_DIR, 'subjects.json'), []))
}

export function getSubject(slug) {
  return cached(`subject:${slug}`, () => getSubjects().find((s) => s.slug === slug) ?? null)
}

export function getQuestions(slug) {
  return cached(`questions:${slug}`, () => readJSON(path.join(CONTENT_DIR, slug, 'questions.json'), []).map(normalizeQuestion))
}

export function getFlashcards(slug) {
  return cached(`flashcards:${slug}`, () => readJSON(path.join(CONTENT_DIR, slug, 'flashcards.json'), []).map((f, idx) => ({
    id: f.id ?? `f${idx + 1}`,
    front: f.front ?? f.question ?? f.term ?? f.full ?? '',
    back: f.back ?? f.answer ?? f.definition ?? f.def ?? '',
    section: f.section ?? f.topic ?? f.category ?? 'General',
    type: f.type ?? (f.abbr ? 'abbr' : 'definition'),
    abbr: f.abbr,
    full: f.full,
  })))
}

export function getGlossary(slug) {
  return cached(`glossary:${slug}`, () => readJSON(path.join(CONTENT_DIR, slug, 'glossary.json'), []).map((g, idx) => ({
    id: g.id ?? `g${idx + 1}`,
    term: g.term ?? g.full ?? g.front ?? '',
    definition: g.definition ?? g.def ?? g.back ?? '',
    category: g.category ?? g.section ?? g.topic ?? 'General',
    section: g.section ?? g.category ?? g.topic ?? 'General',
    aliases: g.aliases ?? [],
    abbr: g.abbr,
    full: g.full ?? g.term,
    def: g.def ?? g.definition,
  })))
}

export function getDiagrams(slug) {
  return cached(`diagrams:${slug}`, () => readJSON(path.join(CONTENT_DIR, slug, 'diagrams.json'), []))
}

export function getNotesLessons(slug) {
  return cached(`notes:${slug}`, () => {
    const lessonsPath = path.join(CONTENT_DIR, slug, 'notes', 'lessons.json')
    if (fs.existsSync(lessonsPath)) {
      const lessons = readJSON(lessonsPath, [])
      return lessons.map((lesson, idx) => ({
        slug: lesson.slug,
        title: lesson.title ?? lesson.slug,
        lesson: Number(lesson.lesson ?? idx + 1),
        section: lesson.section ?? 'General',
        sources: lesson.sources ?? [],
        time: lesson.time ?? '10 min',
        activeRecall: lesson.activeRecall ?? [],
      }))
    }

    const notesDir = path.join(CONTENT_DIR, slug, 'notes')
    if (!fs.existsSync(notesDir)) return []

    return fs.readdirSync(notesDir)
      .filter((file) => file.endsWith('.mdx'))
      .sort()
      .map((file, idx) => {
        const raw = fs.readFileSync(path.join(notesDir, file), 'utf-8')
        const fm = parseFrontmatter(raw)
        return {
          slug: file.replace('.mdx', ''),
          title: fm.title ?? file.replace('.mdx', ''),
          lesson: Number(fm.lesson ?? idx + 1),
          section: fm.section ?? 'General',
          sources: fm.sources ?? [],
          time: fm.time ?? `${Math.ceil(raw.length / 2000) * 3 + 5} min`,
        }
      })
      .sort((a, b) => a.lesson - b.lesson)
  })
}

export function getNoteContent(subjectSlug, lessonSlug) {
  return cached(`note:${subjectSlug}:${lessonSlug}`, () => {
    const filePath = path.join(CONTENT_DIR, subjectSlug, 'notes', `${lessonSlug}.mdx`)
    if (!fs.existsSync(filePath)) return null

    const raw = fs.readFileSync(filePath, 'utf-8')
    const { frontmatter, body } = parseFrontmatterAndBody(raw)
    const activeRecall = frontmatter.activeRecall ?? extractActiveRecall(body)

    return {
      content: body,
      contentMdx: body,
      frontmatter,
      activeRecall,
      sources: frontmatter.sources ?? [],
    }
  })
}

export function getSubjectSections(slug) {
  return cached(`sections:${slug}`, () => [...new Set(getQuestions(slug).map((q) => q.section))])
}

export function getSubjectSectionInfos(slug) {
  return cached(`sectionInfos:${slug}`, () => {
    const map = new Map()
    for (const q of getQuestions(slug)) {
      map.set(q.section, (map.get(q.section) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
  })
}

export function getSubjectSummary(slug) {
  return cached(`summary:${slug}`, () => {
    const subject = getSubject(slug)
    if (!subject) return null
    const lessons = getNotesLessons(slug)
    const questions = getQuestions(slug)
    const flashcards = getFlashcards(slug)
    const glossary = getGlossary(slug)
    return {
      ...subject,
      questionCount: questions.length,
      lessonCount: lessons.length || subject.lessonCount || 0,
      flashcardCount: flashcards.length,
      glossaryCount: glossary.length,
      sections: getSubjectSectionInfos(slug),
    }
  })
}

export function searchContent(query, slugs, types) {
  const normalizedQuery = normalizeSearchText(query)
  if (normalizedQuery.length < 2) return []

  const subjectSlugs = Array.isArray(slugs) && slugs.length
    ? slugs
    : getSubjects().map((subject) => subject.slug)
  const allowedTypes = normalizeSearchTypes(types)
  const results = []

  for (const slug of subjectSlugs) {
    const subject = getSubject(slug)
    if (!subject) continue

    if (allowedTypes.has('notes')) {
      for (const lesson of getNotesLessons(slug)) {
        const score = scoreSearchHit(normalizedQuery, [lesson.title, lesson.section])
        if (score === null) continue
        results.push({
          type: 'notes',
          subject: subject.slug,
          slug: lesson.slug,
          title: lesson.title,
          snippet: [lesson.section, lesson.time].filter(Boolean).join(' - '),
          url: `/study/${encodeURIComponent(subject.slug)}?lesson=${encodeURIComponent(lesson.slug)}`,
          score,
        })
      }
    }

    if (allowedTypes.has('questions')) {
      for (const question of getQuestions(slug)) {
        const body = [
          question.question,
          question.explanation,
          question.idealAnswer,
          ...(question.keywords ?? []),
          ...(question.options ?? []),
        ]
        const score = scoreSearchHit(normalizedQuery, [question.question, question.section, question.explanation])
        if (score === null && !body.some((part) => normalizeSearchText(part).includes(normalizedQuery))) continue
        results.push({
          type: 'questions',
          subject: subject.slug,
          slug: question.id,
          title: question.question,
          snippet: question.explanation || question.idealAnswer || question.section,
          url: `/review/${encodeURIComponent(subject.slug)}`,
          score: score ?? 2,
        })
      }
    }

    if (allowedTypes.has('glossary')) {
      for (const entry of getGlossary(slug)) {
        const score = scoreSearchHit(normalizedQuery, [entry.term, entry.definition, entry.abbr, ...(entry.aliases ?? [])])
        if (score === null) continue
        results.push({
          type: 'glossary',
          subject: subject.slug,
          slug: entry.id,
          title: entry.term,
          snippet: entry.definition,
          url: `/glossary/${encodeURIComponent(subject.slug)}`,
          score,
        })
      }
    }

    if (allowedTypes.has('flashcards')) {
      for (const card of getFlashcards(slug)) {
        const score = scoreSearchHit(normalizedQuery, [card.front, card.back, card.section, card.abbr, card.full])
        if (score === null) continue
        results.push({
          type: 'flashcards',
          subject: subject.slug,
          slug: card.id,
          title: card.front,
          snippet: card.back,
          url: `/flashcards/${encodeURIComponent(subject.slug)}`,
          score,
        })
      }
    }
  }

  return results
    .sort((a, b) => a.score - b.score || String(a.title || '').localeCompare(String(b.title || ''), 'en', { sensitivity: 'base' }) || String(a.subject).localeCompare(String(b.subject)))
    .map(({ score, ...item }) => item)
}

function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeSearchTypes(types) {
  const allowed = new Set(['notes', 'questions', 'glossary', 'flashcards'])
  if (!types || !types.length) return allowed

  const result = new Set()
  for (const type of types) {
    const values = String(type || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)

    for (const value of values) {
      if (value === 'note') result.add('notes')
      else if (value === 'question') result.add('questions')
      else if (value === 'flashcard') result.add('flashcards')
      else if (allowed.has(value)) result.add(value)
    }
  }

  return result.size ? result : allowed
}

function scoreSearchHit(query, values) {
  let best = null
  for (const value of values) {
    const text = normalizeSearchText(value)
    if (!text) continue
    if (text === query) return 0
    if (text.startsWith(query)) best = best === null ? 1 : Math.min(best, 1)
    else if (text.includes(query)) best = best === null ? 2 : Math.min(best, 2)
  }
  return best
}

function normalizeQuestion(q, idx = 0) {
  const rawType = q.type ?? 'mcq'
  const type = rawType === 'mc' ? 'mcq' : rawType
  const options = q.options ?? q.opts ?? []
  const correctMultiple = q.correctMultiple ?? (Array.isArray(q.correct) ? q.correct : undefined)
  const correct = typeof q.correct === 'number'
    ? q.correct
    : typeof q.answer === 'number'
      ? q.answer
      : typeof q.correct_index === 'number'
        ? q.correct_index
        : Array.isArray(q.correct)
          ? q.correct[0]
          : undefined

  return {
    id: q.id ?? `q${idx + 1}`,
    type,
    section: q.section ?? q.topic ?? 'General',
    difficulty: q.difficulty ?? 'medium',
    question: q.question ?? q.q ?? '',
    options,
    correct,
    correctMultiple: type === 'multi' ? (correctMultiple ?? []) : undefined,
    explanation: q.explanation ?? q.explain ?? '',
    idealAnswer: q.idealAnswer ?? q.ideal_answer ?? q.model_answer ?? q.ideal ?? '',
    keywords: q.keywords ?? q.key_points ?? [],
  }
}

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!match) return {}

  const result = {}
  const lines = match[1].split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const top = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!top) continue

    const [, key, rawVal] = top
    if (rawVal.trim() !== '') {
      result[key] = parseScalar(rawVal)
      continue
    }

    const arr = []
    while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
      i++
      const first = lines[i].match(/^\s+-\s+([A-Za-z0-9_-]+):\s*(.*)$/)
      if (!first) {
        arr.push(parseScalar(lines[i].replace(/^\s+-\s+/, '')))
        continue
      }

      const obj = { [first[1]]: parseScalar(first[2]) }
      while (i + 1 < lines.length && /^\s{4,}[A-Za-z0-9_-]+:/.test(lines[i + 1])) {
        i++
        const prop = lines[i].match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/)
        if (prop) obj[prop[1]] = parseScalar(prop[2])
      }
      arr.push(obj)
    }
    result[key] = arr
  }

  return result
}

function parseScalar(value) {
  const v = String(value).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
  if (v === 'true') return true
  if (v === 'false') return false
  if (v !== '' && !Number.isNaN(Number(v))) return Number(v)
  return v
}

function parseFrontmatterAndBody(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)/.exec(raw)
  if (!match) return { frontmatter: {}, body: raw }
  return { frontmatter: parseFrontmatter(raw), body: match[2] || '' }
}

function extractActiveRecall(body) {
  const match = /## .*Active Recall\r?\n\r?\n([\s\S]*)/.exec(body)
  if (!match) return []

  const questions = []
  const qRegex = /### .*?(\d+)\r?\n\*\*(.+?)\*\*\r?\n\r?\n<details>\r?\n<summary>.*?<\/summary>\r?\n([\s\S]*?)<\/details>/g
  let qMatch
  while ((qMatch = qRegex.exec(match[1])) !== null) {
    questions.push({ question: qMatch[2], answer: qMatch[3].trim() })
  }
  return questions
}
