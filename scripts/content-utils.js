const fs = require('fs')
const path = require('path')

function titleFromSlug(slug) {
  if (slug === 'it_biztonsag') return 'IT Biztonság'
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function readJSON(filePath, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function normalizeQuestion(q, idx, sectionName) {
  const rawType = q.type ?? 'mcq'
  const type = rawType === 'mc' ? 'mcq' : rawType
  const options = q.options ?? q.opts ?? []
  const correctMultiple = q.correctMultiple ?? (Array.isArray(q.correct) ? q.correct : undefined)
  const correct = typeof q.correct === 'number'
    ? q.correct
    : typeof q.answer === 'number'
      ? q.answer
      : Array.isArray(q.correct)
        ? q.correct[0]
        : undefined

  return {
    id: `q${idx + 1}`,
    type,
    section: q.section || sectionName || 'General',
    difficulty: q.difficulty || 'medium',
    question: q.question || q.q || '',
    options,
    correct,
    correctMultiple: type === 'multi' ? (correctMultiple || []) : undefined,
    explanation: q.explanation || q.explain || '',
    idealAnswer: q.idealAnswer || q.ideal_answer || q.model_answer || q.ideal || '',
    keywords: q.keywords || q.key_points || [],
  }
}

function normalizeFlashcard(f, idx, sectionName) {
  return {
    id: `f${idx + 1}`,
    front: f.front || f.question || f.term || f.full || '',
    back: f.back || f.answer || f.definition || f.def || '',
    section: f.section || sectionName || 'General',
    type: f.type || (f.abbr ? 'abbr' : 'definition'),
    abbr: f.abbr,
    full: f.full,
  }
}

function normalizeGlossary(g, idx, sectionName) {
  return {
    id: `g${idx + 1}`,
    term: g.term || g.full || g.front || '',
    definition: g.definition || g.def || g.back || '',
    category: g.category || g.section || sectionName || 'General',
    section: g.section || g.category || sectionName || 'General',
    aliases: g.aliases || [],
    abbr: g.abbr,
  }
}

function updateSubjectsIndex(contentRoot, subjectSlug, patch) {
  const subjectsPath = path.join(contentRoot, 'subjects.json')
  const subjects = readJSON(subjectsPath, [])
  const idx = subjects.findIndex(s => s.slug === subjectSlug)
  const existing = idx >= 0 ? subjects[idx] : {}
  const next = {
    slug: subjectSlug,
    name: titleFromSlug(subjectSlug),
    description: `${titleFromSlug(subjectSlug)} tanulasi anyagok`,
    color: '#E07355',
    icon: 'book',
    ...existing,
    ...patch,
  }
  if (idx >= 0) subjects[idx] = next
  else subjects.push(next)
  writeJSON(subjectsPath, subjects)
}

module.exports = {
  normalizeFlashcard,
  normalizeGlossary,
  normalizeQuestion,
  readJSON,
  titleFromSlug,
  updateSubjectsIndex,
  writeJSON,
}
