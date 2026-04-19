const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')
const { extractPdfText } = require('./pdf-text')
const { getProviderBudgetSnapshot, getPreferredProviders } = require('./llm-rate-limit')
const { readJSON, titleFromSlug, writeJSON } = require('./content-utils')

const ROOT = path.join(__dirname, '..')
const STORAGE_ROOT = path.join(ROOT, 'storage', 'subjects')
const CONTENT_ROOT = path.join(ROOT, 'content')

function subjectDir(subjectSlug) {
  return path.join(CONTENT_ROOT, subjectSlug)
}

function subjectStorageDir(subjectSlug) {
  return path.join(STORAGE_ROOT, subjectSlug)
}

function planPath(subjectSlug) {
  return path.join(subjectDir(subjectSlug), 'plan.json')
}

function reportPath(subjectSlug) {
  return path.join(subjectDir(subjectSlug), 'quality-report.json')
}

function loadPlan(subjectSlug) {
  const filePath = planPath(subjectSlug)
  if (!fs.existsSync(filePath)) return null
  return readJSON(filePath, null)
}

function writePlan(subjectSlug, plan) {
  writeJSON(planPath(subjectSlug), plan)
  return planPath(subjectSlug)
}

function writeReport(subjectSlug, report) {
  writeJSON(reportPath(subjectSlug), report)
  return reportPath(subjectSlug)
}

function listFilesRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return []

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath))
    } else {
      files.push(fullPath)
    }
  }
  return files.sort((a, b) => a.localeCompare(b))
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function take(values, limit) {
  return values.slice(0, limit)
}

function cleanTitle(value) {
  return titleFromSlug(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSignals(text, limit = 12) {
  const source = normalizeText(text)
  if (!source) return []

  const phrases = source.match(/\b[A-Z][A-Za-z0-9-]+(?:\s+[A-Z]?[A-Za-z0-9-]+){0,2}/g) || []
  const acronyms = source.match(/\b[A-Z0-9]{2,}\b/g) || []
  const technical = source.match(/\b[a-z]+(?:-[a-z]+){1,2}\b/gi) || []
  const stop = new Set(['The', 'And', 'For', 'With', 'This', 'That', 'Egy', 'Az', 'A', 'Es', 'Or', 'In'])
  const seen = new Set()

  return unique([...phrases, ...acronyms, ...technical])
    .map((term) => term.replace(/\s+/g, ' ').trim())
    .filter((term) => term.length > 2 && !stop.has(term))
    .filter((term) => {
      const key = term.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, limit)
}

function extractHeadings(text, limit = 12) {
  const lines = String(text || '').split(/\r?\n/)
  const headings = []

  for (const line of lines) {
    const value = line.trim()
    if (!value) continue
    if (/^#{1,4}\s+/.test(value)) {
      headings.push(value.replace(/^#{1,4}\s+/, ''))
      continue
    }
    if (/^\d+(\.\d+){0,3}\s+/.test(value)) {
      headings.push(value.replace(/^\d+(\.\d+){0,3}\s+/, ''))
      continue
    }
    if (value === value.toUpperCase() && /[A-Z]/.test(value) && value.length > 4) {
      headings.push(value)
    }
  }

  return unique(headings.map((item) => item.trim()).filter(Boolean)).slice(0, limit)
}

function extractBoldTerms(text, limit = 12) {
  const matches = String(text || '').match(/\*\*(.+?)\*\*/g) || []
  return unique(matches.map((value) => value.replace(/\*\*/g, '').trim()).filter(Boolean)).slice(0, limit)
}

async function extractPdfTextAsync(filePath) {
  return extractPdfText(filePath)
}

async function readTextForPlan(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  try {
    if (ext === '.pdf') {
      return normalizeText(await extractPdfTextAsync(filePath))
    }
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath })
      return normalizeText(result.value)
    }
    if (ext === '.md' || ext === '.mdx' || ext === '.txt') {
      return normalizeText(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch (error) {
    return ''
  }
  return ''
}

function sourceGroups(subjectSlug) {
  const baseDir = subjectStorageDir(subjectSlug)
  const lessonDir = path.join(baseDir, 'sources', 'lesson_sources')
  const testDir = path.join(baseDir, 'sources', 'test_sources')

  const lessonSources = listFilesRecursive(lessonDir)
  const testSources = listFilesRecursive(testDir)

  return { lessonDir, lessonSources, testDir, testSources }
}

async function summarizeSource(filePath, kind, order) {
  const title = cleanTitle(path.basename(filePath, path.extname(filePath)))
  const text = await readTextForPlan(filePath)
  const headings = extractHeadings(text, 8)
  const signals = extractSignals(text, 8)
  const boldTerms = extractBoldTerms(text, 8)

  return {
    id: `${kind}-${String(order + 1).padStart(2, '0')}`,
    kind,
    order: order + 1,
    fileName: path.basename(filePath),
    title,
    textChars: text.length,
    headings,
    signals,
    boldTerms,
    summary: text ? text.slice(0, 280) : '',
  }
}

function readExistingNotes(subjectSlug) {
  const dir = path.join(subjectDir(subjectSlug), 'notes')
  const lessonsPath = path.join(dir, 'lessons.json')
  const noteFiles = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((file) => file.endsWith('.mdx')).sort()
    : []

  const lessons = readJSON(lessonsPath, [])
  const lessonOutline = lessons.length
    ? lessons.map((lesson, idx) => ({
        id: lesson.slug || `lesson-${idx + 1}`,
        order: Number(lesson.lesson || idx + 1),
        title: lesson.title || lesson.slug || `Lesson ${idx + 1}`,
        section: lesson.section || lesson.title || 'General',
        time: lesson.time || null,
      }))
    : noteFiles.map((file, idx) => ({
        id: file.replace(/\.mdx$/, ''),
        order: idx + 1,
        title: cleanTitle(file.replace(/\.mdx$/, '')),
        section: cleanTitle(file.replace(/\.mdx$/, '')),
        time: null,
      }))

  const rawNotes = noteFiles.map((file) => {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    return {
      file,
      headings: extractHeadings(content, 10),
      boldTerms: extractBoldTerms(content, 12),
      signals: extractSignals(content, 12),
    }
  })

  return { lessonOutline, rawNotes }
}

function readExistingContentStats(subjectSlug) {
  const dir = subjectDir(subjectSlug)
  return {
    subject: readJSON(path.join(CONTENT_ROOT, 'subjects.json'), []).find((item) => item.slug === subjectSlug) || null,
    meta: readJSON(path.join(dir, 'meta.json'), {}),
    questions: readJSON(path.join(dir, 'questions.json'), []),
    flashcards: readJSON(path.join(dir, 'flashcards.json'), []),
    glossary: readJSON(path.join(dir, 'glossary.json'), []),
  }
}

function makeObjectives(plan) {
  const sourceObjectives = plan.lessonSources.map((item) => `Explain the core ideas in ${item.title}.`)
  const noteObjectives = plan.lessonOutline.map((item) => `Summarize ${item.section} clearly and accurately.`)
  const assessmentObjectives = plan.testSources.map((item) => `Solve and explain the material from ${item.title}.`)
  return take(unique([...sourceObjectives, ...noteObjectives, ...assessmentObjectives]), 18)
}

function makeConceptInventory(plan) {
  const tokens = [
    ...plan.lessonSources.flatMap((item) => [...item.headings, ...item.signals, ...item.boldTerms]),
    ...plan.rawNotes.flatMap((item) => [...item.headings, ...item.signals, ...item.boldTerms]),
  ]
  return take(unique(tokens), 36)
}

function buildSummary(plan) {
  const targets = plan.qualityTargets
  return [
    `Subject: ${plan.subject.name} (${plan.subject.slug})`,
    `Lesson sources: ${plan.lessonSources.length}`,
    `Test sources: ${plan.testSources.length}`,
    `Existing notes: ${plan.existing.notesCount}`,
    `Existing questions: ${plan.existing.questionCount}`,
    `Existing flashcards: ${plan.existing.flashcardCount}`,
    `Existing glossary entries: ${plan.existing.glossaryCount}`,
    `Planned note target: ${targets.notesIdeal}`,
    `Planned question target: ${targets.questionsIdeal}`,
    `Planned flashcard target: ${targets.flashcardsIdeal}`,
    `Planned glossary target: ${targets.glossaryIdeal}`,
    `Key concepts: ${plan.conceptInventory.slice(0, 8).join(', ') || 'none yet'}`,
    `Learning objectives: ${plan.learningObjectives.slice(0, 6).join(' | ') || 'none yet'}`,
  ].join('\n')
}

function buildQualityTargets(plan) {
  const lessonCount = Math.max(plan.lessonSources.length, plan.lessonOutline.length, plan.existing.notesCount)
  const testCount = Math.max(plan.testSources.length, 1)
  const conceptCount = Math.max(plan.conceptInventory.length, 1)

  return {
    notesMin: Math.max(1, lessonCount),
    notesIdeal: Math.max(lessonCount, 1),
    questionsMin: Math.max(8, testCount * 6),
    questionsIdeal: Math.max(12, testCount * 8),
    flashcardsMin: Math.max(8, conceptCount),
    flashcardsIdeal: Math.max(12, conceptCount * 2),
    glossaryMin: Math.max(6, Math.ceil(conceptCount * 0.75)),
    glossaryIdeal: Math.max(10, conceptCount),
  }
}

async function buildContentPlan(subjectSlug, options = {}) {
  const { lessonSources, testSources } = sourceGroups(subjectSlug)
  const existing = readExistingContentStats(subjectSlug)
  const existingNotes = readExistingNotes(subjectSlug)

  const lessonSummaries = []
  for (let i = 0; i < lessonSources.length; i++) {
    lessonSummaries.push(await summarizeSource(lessonSources[i], 'lesson', i))
  }

  const testSummaries = []
  for (let i = 0; i < testSources.length; i++) {
    testSummaries.push(await summarizeSource(testSources[i], 'test', i))
  }

  const plan = {
    version: 1,
    generatedAt: new Date().toISOString(),
    subject: {
      slug: subjectSlug,
      name: existing.meta.name || existing.subject?.name || titleFromSlug(subjectSlug),
      description: existing.meta.description || existing.subject?.description || `${titleFromSlug(subjectSlug)} tanulasi anyagok`,
    },
    sourceCounts: {
      lessonSources: lessonSummaries.length,
      testSources: testSummaries.length,
    },
    existing: {
      notesCount: existingNotes.lessonOutline.length,
      questionCount: existing.questions.length,
      flashcardCount: existing.flashcards.length,
      glossaryCount: existing.glossary.length,
    },
    lessonSources: lessonSummaries,
    testSources: testSummaries,
    lessonOutline: existingNotes.lessonOutline,
    rawNotes: existingNotes.rawNotes,
    conceptInventory: [],
    learningObjectives: [],
    qualityTargets: {},
    llm: {
      preferredProviders: getPreferredProviders({ preferFast: false }),
      budgetSnapshot: getProviderBudgetSnapshot(),
    },
    status: 'draft',
  }

  plan.conceptInventory = makeConceptInventory(plan)
  plan.learningObjectives = makeObjectives(plan)
  plan.qualityTargets = buildQualityTargets(plan)
  plan.summary = buildSummary(plan)
  plan.status = plan.lessonSources.length || plan.lessonOutline.length ? 'ready' : 'draft'

  if (options.write !== false) {
    writePlan(subjectSlug, plan)
  }

  return plan
}

function loadContentPlanSummary(subjectSlug) {
  const plan = loadPlan(subjectSlug)
  if (!plan) return ''
  return plan.summary || buildSummary(plan)
}

function inspectGeneratedContent(subjectSlug) {
  const dir = subjectDir(subjectSlug)
  return {
    notes: fs.existsSync(path.join(dir, 'notes'))
      ? fs.readdirSync(path.join(dir, 'notes')).filter((file) => file.endsWith('.mdx')).length
      : 0,
    questions: readJSON(path.join(dir, 'questions.json'), []),
    flashcards: readJSON(path.join(dir, 'flashcards.json'), []),
    glossary: readJSON(path.join(dir, 'glossary.json'), []),
    lessons: readJSON(path.join(dir, 'notes', 'lessons.json'), []),
  }
}

function scoreBand(score) {
  if (score >= 85) return 'pass'
  if (score >= 60) return 'warn'
  return 'fail'
}

function validateContent(subjectSlug, plan = loadPlan(subjectSlug)) {
  const fallbackPlan = plan || {
    subject: { slug: subjectSlug, name: titleFromSlug(subjectSlug) },
    qualityTargets: {
      notesIdeal: 1,
      questionsIdeal: 8,
      flashcardsIdeal: 8,
      glossaryIdeal: 6,
    },
    lessonOutline: [],
    conceptInventory: [],
    learningObjectives: [],
    llm: {
      preferredProviders: getPreferredProviders({ preferFast: false }),
      budgetSnapshot: getProviderBudgetSnapshot(),
    },
  }

  const content = inspectGeneratedContent(subjectSlug)
  const questions = content.questions
  const flashcards = content.flashcards
  const glossary = content.glossary
  const lessons = content.lessons
  const writtenQuestions = questions.filter((item) => String(item.type || '').toLowerCase() === 'written')
  const issues = []
  const warnings = []
  const checks = []
  let score = 0

  const noteTarget = fallbackPlan.qualityTargets?.notesIdeal || 1
  const questionTarget = fallbackPlan.qualityTargets?.questionsIdeal || 8
  const flashcardTarget = fallbackPlan.qualityTargets?.flashcardsIdeal || 8
  const glossaryTarget = fallbackPlan.qualityTargets?.glossaryIdeal || 6

  const notesOk = content.notes >= noteTarget
  checks.push({
    name: 'notes_count',
    status: notesOk ? 'pass' : 'warn',
    detail: `${content.notes} notes found, target ${noteTarget}`,
  })
  score += notesOk ? 20 : 5
  if (!notesOk) warnings.push('Notes count is below the planned target.')

  const questionsOk = questions.length >= questionTarget
  checks.push({
    name: 'questions_count',
    status: questionsOk ? 'pass' : 'warn',
    detail: `${questions.length} questions found, target ${questionTarget}`,
  })
  score += questionsOk ? 15 : 5
  if (!questionsOk) warnings.push('Questions count is below the planned target.')

  const flashcardsOk = flashcards.length >= flashcardTarget
  checks.push({
    name: 'flashcards_count',
    status: flashcardsOk ? 'pass' : 'warn',
    detail: `${flashcards.length} flashcards found, target ${flashcardTarget}`,
  })
  score += flashcardsOk ? 15 : 5
  if (!flashcardsOk) warnings.push('Flashcard count is below the planned target.')

  const glossaryOk = glossary.length >= glossaryTarget
  checks.push({
    name: 'glossary_count',
    status: glossaryOk ? 'pass' : 'warn',
    detail: `${glossary.length} glossary entries found, target ${glossaryTarget}`,
  })
  score += glossaryOk ? 10 : 5
  if (!glossaryOk) warnings.push('Glossary count is below the planned target.')

  const lessonCoverageOk = fallbackPlan.lessonOutline.length ? lessons.length >= fallbackPlan.lessonOutline.length : content.notes > 0
  checks.push({
    name: 'lesson_coverage',
    status: lessonCoverageOk ? 'pass' : 'warn',
    detail: `${lessons.length} lesson records, ${fallbackPlan.lessonOutline.length} planned outline entries`,
  })
  score += lessonCoverageOk ? 15 : 5

  const writtenComplete = writtenQuestions.every((item) => {
    const answer = String(item.model_answer || item.model_answer_text || item.idealAnswer || item.ideal || '').trim()
    const points = Array.isArray(item.key_points)
      ? item.key_points
      : Array.isArray(item.keywords)
        ? item.keywords
        : []
    return !!answer && points.length > 0
  })
  checks.push({
    name: 'written_questions',
    status: writtenQuestions.length ? 'pass' : 'warn',
    detail: `${writtenQuestions.length} written questions found`,
  })
  score += writtenQuestions.length ? 5 : 0
  checks.push({
    name: 'written_completeness',
    status: writtenComplete ? 'pass' : 'warn',
    detail: writtenComplete ? 'Written questions have answers and key points.' : 'Some written questions are missing model answers or key points.',
  })
  score += writtenComplete ? 10 : 3
  if (!writtenComplete) warnings.push('Some written questions are missing model answers or key points.')

  const planReady = fallbackPlan.conceptInventory.length > 0 || fallbackPlan.learningObjectives.length > 0
  checks.push({
    name: 'plan_artifact',
    status: planReady ? 'pass' : 'warn',
    detail: `Plan has ${fallbackPlan.conceptInventory.length} concepts and ${fallbackPlan.learningObjectives.length} objectives`,
  })
  score += planReady ? 15 : 5

  if (!questions.length) issues.push('No questions.json content found.')
  if (!flashcards.length) issues.push('No flashcards.json content found.')
  if (!glossary.length) issues.push('No glossary.json content found.')
  if (!content.notes) issues.push('No notes .mdx files found.')

  const finalScore = Math.max(0, Math.min(100, score))
  const status = issues.length ? (finalScore >= 80 ? 'warn' : 'fail') : scoreBand(finalScore)

  const recommendations = []
  if (content.notes < noteTarget) recommendations.push('Generate or review the missing notes before shipping.')
  if (questions.length < questionTarget) recommendations.push('Increase assessment coverage, especially written questions.')
  if (flashcards.length < flashcardTarget) recommendations.push('Add more flashcards for the major concepts.')
  if (glossary.length < glossaryTarget) recommendations.push('Expand the glossary with the highest-value terms.')
  if (!planReady) recommendations.push('Rebuild the shared content plan to capture concepts and objectives.')

  const report = {
    version: 1,
    subject: {
      slug: subjectSlug,
      name: fallbackPlan.subject?.name || titleFromSlug(subjectSlug),
    },
    generatedAt: new Date().toISOString(),
    status,
    score: finalScore,
    checks,
    issues,
    warnings,
    recommendations,
    plan: {
      lessonSources: fallbackPlan.sourceCounts?.lessonSources || fallbackPlan.lessonSources?.length || 0,
      testSources: fallbackPlan.sourceCounts?.testSources || fallbackPlan.testSources?.length || 0,
      conceptInventory: fallbackPlan.conceptInventory.length,
      learningObjectives: fallbackPlan.learningObjectives.length,
    },
    content: {
      notes: content.notes,
      questions: questions.length,
      flashcards: flashcards.length,
      glossary: glossary.length,
    },
    llm: fallbackPlan.llm || {},
  }

  return report
}

function renderReportMarkdown(report) {
  const lines = []
  lines.push(`# Content quality report`)
  lines.push('')
  lines.push(`- Subject: ${report.subject?.name || report.subject?.slug || 'unknown'}`)
  lines.push(`- Status: ${report.status}`)
  lines.push(`- Score: ${report.score}/100`)
  lines.push('')
  lines.push('## Checks')
  for (const check of report.checks || []) {
    lines.push(`- ${check.name}: ${check.status} - ${check.detail}`)
  }
  if (report.issues?.length) {
    lines.push('')
    lines.push('## Issues')
    for (const item of report.issues) lines.push(`- ${item}`)
  }
  if (report.warnings?.length) {
    lines.push('')
    lines.push('## Warnings')
    for (const item of report.warnings) lines.push(`- ${item}`)
  }
  if (report.recommendations?.length) {
    lines.push('')
    lines.push('## Recommendations')
    for (const item of report.recommendations) lines.push(`- ${item}`)
  }
  return lines.join('\n')
}

module.exports = {
  buildContentPlan,
  inspectGeneratedContent,
  loadContentPlanSummary,
  loadPlan,
  planPath,
  readExistingContentStats,
  renderReportMarkdown,
  reportPath,
  sourceGroups,
  validateContent,
  writePlan,
  writeReport,
}
