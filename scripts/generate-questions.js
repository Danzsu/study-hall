#!/usr/bin/env node
/**
 * generate-questions.js
 * 2-fázisú kérdésgenerálás: Fact Extraction → Quiz Generation
 * Elsődleges provider: Google AI Studio (Gemini), fallback: Groq → OpenRouter
 *
 * Használat: node scripts/generate-questions.js <subject-slug> [difficulty]
 * Kimenet: content/<subject-slug>/questions.json
 */

'use strict';

const fs = require('fs')
const path = require('path')
require('./load-env')
const { buildFallbackQuestions } = require('./local-generators')
const { loadContentPlanSummary, loadPlan } = require('./content-plan')
const { buildAssessmentSourceText, readSourceDocument } = require('./source-intelligence')
const { extractFacts, generateQuiz } = require('./llm-service')
const { parseMarkdownToQuiz, summarizeQuiz } = require('./markdown-parser')

// ── KONFIGURÁCIÓ ──────────────────────────────────────────────────────────────
const STORAGE_ROOT = path.join(__dirname, '..', 'storage', 'subjects')
const CONTENT_ROOT = path.join(__dirname, '..', 'content')
const FACT_CHUNK_SIZE = 16000   // quiz-aura chunk méret
const FACT_CHUNK_OVERLAP = 400
const MAX_PARALLEL_FACTS = 4    // párhuzamos fact extraction
const ALL_ENABLED_TYPES = ['multi_choice', 'true_false', 'fill_the_blanks', 'drag_n_drop', 'simple_input', 'formula_drag_drop', 'calc_input']

// ── HELPER FÜGGVÉNYEK ─────────────────────────────────────────────────────────

function listSourceFiles(folderPath, extensions) {
  if (!fs.existsSync(folderPath)) return []
  return fs.readdirSync(folderPath)
    .filter(f => extensions.some(ext => f.toLowerCase().endsWith(ext)))
    .map(f => path.join(folderPath, f))
}

function chunkText(text, maxChunkSize = FACT_CHUNK_SIZE, overlap = FACT_CHUNK_OVERLAP) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length)
    if (end < text.length) {
      const searchBack = Math.min(600, end - start)
      for (let i = 0; i < searchBack; i++) {
        const pos = end - i
        if (text[pos] === '\n' && text[pos - 1] === '\n') { end = pos; break }
        if (text[pos] === '.' || text[pos] === '!' || text[pos] === '?') { end = pos + 1; break }
      }
    }
    chunks.push(text.slice(start, end).trim())
    start = end - overlap
    if (start < 0) start = 0
    if (end >= text.length) break
  }
  return chunks
}

function loadCoveragePrompt(plan) {
  if (!plan?.coverageMatrix?.length) return ''
  return plan.coverageMatrix
    .slice(0, 18)
    .map((row) => `- ${row.conceptId}: ${row.concept} | quiz target ${row.quizTarget} | written target ${row.writtenTarget}`)
    .join('\n')
}

function inferConceptIds(question, plan, limit = 4) {
  const text = [
    question.question, question.explanation, question.idealAnswer,
    ...(Array.isArray(question.keywords) ? question.keywords : []),
  ].filter(Boolean).join(' ').toLowerCase()
  if (!text || !plan?.concepts?.length) return []
  return plan.concepts
    .map((concept) => {
      const label = String(concept.label || '').toLowerCase()
      if (!label) return null
      const direct = text.includes(label) ? 3 : 0
      const tokenHits = label.split(/\s+/).filter((token) => token.length > 3 && text.includes(token)).length
      const score = direct + tokenHits
      return score ? { id: concept.id, score } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.id)
}

// ── KONVERZIÓ: quiz-aura JSON → study-hall JSON ────────────────────────────

function optionsObjectToArray(optionsObj) {
  if (Array.isArray(optionsObj)) return optionsObj
  if (!optionsObj || typeof optionsObj !== 'object') return []
  return Object.values(optionsObj)
}

function answerKeysToIndices(answerKeys, optionsObj) {
  if (!Array.isArray(answerKeys) || !optionsObj || typeof optionsObj !== 'object') return []
  const keys = Object.keys(optionsObj)
  return answerKeys.map(k => keys.indexOf(k)).filter(i => i !== -1)
}

function convertToStudyHallFormat(quizAuraQuestions, sectionName) {
  const result = []
  for (const q of quizAuraQuestions) {
    const qt = q.question_type
    const base = {
      section: sectionName,
      difficulty: q.difficulty || 'medium',
    }

    if (qt === 'multi_choice') {
      const optionsArr = optionsObjectToArray(q.options)
      const correctIndices = answerKeysToIndices(q.answer ?? [], q.options)
      if (correctIndices.length === 1) {
        result.push({ ...base, type: 'mcq', question: q.question_title ?? '', options: optionsArr, correct: correctIndices[0], explanation: q.explanation ?? '' })
      } else {
        result.push({ ...base, type: 'multi', question: q.question_title ?? '', options: optionsArr, correctMultiple: correctIndices, explanation: q.explanation ?? '' })
      }
    } else if (qt === 'true_false') {
      result.push({ ...base, type: 'true_false', question: q.question_title ?? '', answer: q.answer ?? 'false' })
    } else if (qt === 'fill_the_blanks') {
      const blank = q.blank ?? []
      const blanks = Array.isArray(blank) ? blank : [blank]
      result.push({ ...base, type: 'fill_the_blanks', question: q.text ?? q.question_title ?? '', blanks })
    } else if (qt === 'drag_n_drop') {
      result.push({ ...base, type: 'drag_n_drop', question: q.text ?? q.question_title ?? '', choices: q.choices ?? [] })
    } else if (qt === 'simple_input') {
      result.push({ ...base, type: 'simple_input', question: q.question_title ?? '', answer: q.answer ?? '' })
    } else if (qt === 'formula_drag_drop') {
      result.push({ ...base, type: 'formula_drag_drop', question: q.question_title ?? '', formulaText: q.text ?? '', choices: q.choices ?? [] })
    } else if (qt === 'calc_input') {
      const entry = { ...base, type: 'calc_input', question: q.question_title ?? '', answer: q.answer ?? '' }
      if (q.formula_chips?.length) entry.formulaChips = q.formula_chips
      result.push(entry)
    }
  }
  return result
}

// ── FÁZIS 1: FACT EXTRACTION ─────────────────────────────────────────────────

async function extractFactsFromChunks(chunks, fileName) {
  const allFacts = []
  // Párhuzamos feldolgozás MAX_PARALLEL_FACTS-onként
  for (let i = 0; i < chunks.length; i += MAX_PARALLEL_FACTS) {
    const batch = chunks.slice(i, i + MAX_PARALLEL_FACTS)
    console.log(`   [Fázis 1] Chunk ${i + 1}-${Math.min(i + batch.length, chunks.length)}/${chunks.length} feldolgozása...`)
    const results = await Promise.allSettled(
      batch.map((chunk, j) => extractFacts(chunk, `${fileName}-chunk${i + j + 1}`))
    )
    for (const res of results) {
      if (res.status === 'fulfilled' && res.value?.ok) {
        allFacts.push(...res.value.data)
      } else {
        console.warn(`   ⚠️  Fact extraction részleges hiba: ${res.reason?.message || 'ismeretlen'}`)
      }
    }
    console.log(`   [Fázis 1] Tények összesen: ${allFacts.length}`)
  }
  return allFacts
}

// ── FŐ FOLYAMAT ───────────────────────────────────────────────────────────────

async function main() {
  const subjectSlug = process.argv[2]
  const difficulty = process.argv[3] || 'medium'

  if (!subjectSlug) {
    console.error('❌ Használat: node scripts/generate-questions.js <subject-slug> [difficulty]')
    console.error('   Példa: node scripts/generate-questions.js it_biztonsag medium')
    process.exit(1)
  }

  const hasAnyProvider = process.env.GOOGLE_AI_KEY || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY
  const forceLocalFallback = process.env.LOCAL_CONTENT_FALLBACK === '1' || !hasAnyProvider
  if (forceLocalFallback) {
    console.log('⚠️  Nincs API kulcs — helyi fallback kérdésgenerálás.')
  }

  const sourceDir = path.join(STORAGE_ROOT, subjectSlug, 'sources', 'test_sources')
  const lessonSourceDir = path.join(STORAGE_ROOT, subjectSlug, 'sources', 'lesson_sources')
  const contentDir = path.join(CONTENT_ROOT, subjectSlug)
  const outputPath = path.join(contentDir, 'questions.json')

  const planContext = loadContentPlanSummary(subjectSlug)
  const plan = loadPlan(subjectSlug)
  const coverageInfo = loadCoveragePrompt(plan)

  const pdfFiles = listSourceFiles(sourceDir, ['.pdf'])
  const docxFiles = listSourceFiles(sourceDir, ['.docx'])
  const mdFiles = listSourceFiles(sourceDir, ['.md', '.mdx', '.txt'])
  const lessonPdfFiles = listSourceFiles(lessonSourceDir, ['.pdf'])
  const lessonDocxFiles = listSourceFiles(lessonSourceDir, ['.docx'])
  const lessonMdFiles = listSourceFiles(lessonSourceDir, ['.md', '.mdx', '.txt'])

  const testFiles = [...pdfFiles, ...docxFiles, ...mdFiles].map(file => ({ file, sourceKind: 'test', assessmentOnly: false }))
  const lessonFiles = [...lessonPdfFiles, ...lessonDocxFiles, ...lessonMdFiles].map(file => ({ file, sourceKind: 'lesson', assessmentOnly: true }))
  const allFiles = [...testFiles, ...lessonFiles]

  if (allFiles.length === 0) {
    console.error(`❌ Nem található forrásfájl: ${sourceDir}`)
    process.exit(1)
  }

  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true })

  const subjectName = subjectSlug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  console.log(`\n📝 ${subjectName} kérdésgenerálás (2-fázisú pipeline, nehézség: ${difficulty})`)
  console.log(`   Test fájlok: ${testFiles.length} | Lesson scan: ${lessonFiles.length}`)

  let allQuestions = []

  for (const sourceItem of allFiles) {
    const fileName = path.basename(sourceItem.file)
    console.log(`\n📄 ${fileName} feldolgozása...`)

    let sourceDocument, rawText = ''
    try {
      sourceDocument = await readSourceDocument(sourceItem.file, { subjectSlug, sourceKind: sourceItem.sourceKind, contentRoot: CONTENT_ROOT })
      rawText = sourceItem.assessmentOnly ? buildAssessmentSourceText(sourceDocument) : sourceDocument.text
    } catch (err) {
      console.error(`   ❌ Fájl olvasási hiba: ${err.message}`)
      continue
    }

    if (sourceItem.assessmentOnly && !rawText) {
      console.log('   Nincs értékelhető blokk ebben a lesson source-ban, kihagyva.')
      continue
    }
    if (rawText.length < 200) {
      console.warn(`   ⚠️  Túl rövid szöveg (${rawText.length} kar), kihagyva`)
      continue
    }

    const sectionBase = fileName.replace(/\.(pdf|docx|md|mdx|txt)$/i, '').replace(/[_-]/g, ' ').trim()
    const sectionName = sourceItem.assessmentOnly ? `${sectionBase} - detected questions` : sectionBase
    console.log(`   Szöveg: ${rawText.length} kar | Section: "${sectionName}"`)

    if (forceLocalFallback) {
      const fallback = buildFallbackQuestions(rawText.slice(0, 5000), sectionName)
      allQuestions = allQuestions.concat(fallback)
      console.log(`   ✅ Fallback: ${fallback.length} kérdés`)
      continue
    }

    // ── FÁZIS 1: FACT EXTRACTION ─────────────────────────────────────────────
    const chunks = chunkText(rawText)
    console.log(`   [Fázis 1] ${chunks.length} chunk → fact extraction...`)

    let facts = []
    try {
      facts = await extractFactsFromChunks(chunks, fileName)
    } catch (err) {
      console.error(`   ❌ Fact extraction hiba: ${err.message} → fallback`)
      const fallback = buildFallbackQuestions(rawText.slice(0, 5000), sectionName)
      allQuestions = allQuestions.concat(fallback)
      continue
    }

    if (facts.length === 0) {
      console.warn('   ⚠️  Nulla tény kinyerve, kihagyva')
      continue
    }
    console.log(`   [Fázis 1] ✅ ${facts.length} tény kinyerve`)

    // ── FÁZIS 2: QUIZ GENERATION ─────────────────────────────────────────────
    console.log(`   [Fázis 2] Quiz generálás...`)
    const config = {
      subject: subjectName,
      type: 'Synthetic Questionnaire',
      year: new Date().getFullYear().toString(),
      difficulty,
      questionCount: Math.min(40, Math.max(10, Math.floor(facts.length * 0.8))),
      enabledTypes: ALL_ENABLED_TYPES,
      requirementsContext: [
        planContext ? `Content plan:\n${planContext}` : '',
        coverageInfo ? `Coverage targets:\n${coverageInfo}` : '',
      ].filter(Boolean).join('\n\n') || 'Nincs megadva.',
    }

    let markdown = ''
    try {
      markdown = await generateQuiz(facts, config)
    } catch (err) {
      console.error(`   ❌ Quiz generálás hiba: ${err.message} → fallback`)
      const fallback = buildFallbackQuestions(rawText.slice(0, 5000), sectionName)
      allQuestions = allQuestions.concat(fallback)
      continue
    }

    // ── PARSZELÁS + KONVERZIÓ ─────────────────────────────────────────────────
    const { questions: rawQuestions } = parseMarkdownToQuiz(markdown)
    const converted = convertToStudyHallFormat(rawQuestions, sectionName)

    // conceptIds hozzárendelése
    const enriched = converted.map(q => ({
      ...q,
      conceptIds: inferConceptIds(q, plan),
    }))

    allQuestions = allQuestions.concat(enriched)

    const summary = summarizeQuiz({ questions: rawQuestions })
    console.log(`   [Fázis 2] ✅ ${enriched.length} kérdés (${JSON.stringify(summary.counts)})`)
  }

  // Deduplikálás
  const seen = new Set()
  const unique = allQuestions.filter(q => {
    const key = String(q.question || '').toLowerCase().slice(0, 60)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // ID-k generálása
  unique.forEach((q, idx) => { q.id = `q${idx + 1}` })

  fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2), 'utf-8')

  const typeCounts = {}
  for (const q of unique) typeCounts[q.type] = (typeCounts[q.type] || 0) + 1

  console.log(`\n✅ Kész! ${unique.length} kérdés → ${outputPath}`)
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`   • ${type}: ${count}`)
  }
  console.log(`\n👉 Következő lépés: node scripts/generate-extras.js ${subjectSlug}`)
}

main().catch(err => {
  console.error('❌ Hiba:', err.message)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})
