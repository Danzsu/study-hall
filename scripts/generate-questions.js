#!/usr/bin/env node
/**
 * generate-questions.js
 * Test sources (PDF/DOCX/MD) → questions.json generálás Groq LLM-mel
 *
 * Használat: node scripts/generate-questions.js <subject-slug>
 *
 * Kimenet: content/<subject-slug>/questions.json
 */

const fs = require('fs')
const path = require('path')
require('./load-env')
const { extractPdfText } = require('./pdf-text')
const { buildFallbackQuestions } = require('./local-generators')
const { callWithProviderLimit } = require('./llm-rate-limit')
const mammoth = require('mammoth')
const { Groq } = require('groq-sdk')

// ── KONFIGURÁCIÓ ──────────────────────────────────────────────────────────────
const STORAGE_ROOT = path.join(__dirname, '..', 'storage', 'subjects')
const CONTENT_ROOT = path.join(__dirname, '..', 'content')

const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── HELPER FÜGGVÉNYEK ─────────────────────────────────────────────────────────

async function extractTextFromPDF(pdfPath) {
  return extractPdfText(pdfPath)
}

async function extractTextFromDOCX(docxPath) {
  const result = await mammoth.extractRawText({ path: docxPath })
  return result.value
}

async function extractTextFromMD(mdPath) {
  return fs.readFileSync(mdPath, 'utf-8')
}

function listSourceFiles(folderPath, extensions) {
  if (!fs.existsSync(folderPath)) return []
  return fs.readdirSync(folderPath)
    .filter(f => extensions.some(ext => f.toLowerCase().endsWith(ext)))
    .map(f => path.join(folderPath, f))
}

function chunkText(text, maxChunkSize = 5000, overlap = 500) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length)
    if (end < text.length) {
      const searchBack = Math.min(500, end - start)
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

// ── KÉRDÉS GENERÁLÁS ──────────────────────────────────────────────────────────

/**
 * MCQ + Written kérdések generálása forrásszövegből
 */
async function generateQuestionsWithGroq(groq, sourceText, subjectName, sectionName) {
  const prompt = `Te egy tapasztalt vizsgakérdés-szerkesztő vagy. A következő forrásanyag alapján készíts egyensúlyos kérdéssort.

TÁRGY: ${subjectName}
FEJEZET: ${sectionName}

FORRÁSSZÖVEG:
${sourceText.slice(0, 8000)}

KÉSZÍTS KÉRDÉSEKET AZ ALÁBBI SZABÁLYOK SZERINT:

1. MCQ KÉRDÉSEK (többválaszos):
   - 4 válaszlehetőség (A, B, C, D)
   - Csak EGY helyes válasz
   - A helyes válasz legyen véletlenszerű pozícióban (ne mindig az első)
   - A rossz válaszok legyenek hihetőek (ne nyilvánvalóan hibásak)

2. MULTI-SELECT KÉRDÉSEK:
   - 4-5 válaszlehetőség
   - 2-3 helyes válasz
   - Jelöld: "pick 2" vagy "pick 3" a kérdés végén

3. ÍRÁSBELI KÉRDÉSEK:
   - Kifejtős, magyarázatot igénylő kérdések
   - Legyen "ideal" minta válasz (3-5 mondat)
   - Legyenek "keywords" amiket ellenőrizni kell

4. ARÁNYOK:
   - 60% MCQ
   - 20% Multi-select
   - 20% Written

5. FORMÁTUM (JSON):
[
  {
    "id": "q1",
    "type": "mcq",
    "q": "Kérdés szövege?",
    "opts": ["A válasz", "B válasz", "C válasz", "D válasz"],
    "correct": 0,
    "explain": "Miért ez a helyes válasz + miért rosszak a többiek",
    "section": "${sectionName}",
    "difficulty": "easy"
  },
  {
    "id": "q2",
    "type": "multi",
    "q": "Kérdés szövege? (pick 2)",
    "opts": ["A", "B", "C", "D"],
    "correct": [0, 2],
    "explain": "Magyarázat",
    "section": "${sectionName}",
    "difficulty": "medium"
  },
  {
    "id": "q3",
    "type": "written",
    "q": "Kifejtős kérdés?",
    "ideal": "Minta válasz 3-5 mondatban",
    "keywords": ["kulcsszó1", "kulcsszó2", "kulcsszó3"],
    "section": "${sectionName}",
    "difficulty": "hard"
  }
]

6. NEHÉZSÉGI SZINTEK:
   - easy: definíciók, alapfogalmak
   - medium: alkalmazás, összehasonlítás
   - hard: elemzés, szintézis, kritikus gondolkodás

7. MAGYAR NYELV: Minden kérdés és válasz magyarul legyen!

VISSZA: Csak a tiszta JSON tömböt, magyarázat nélkül.`

  const completion = await callWithProviderLimit('groq', () => groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  }))

  try {
    const json = completion.choices[0]?.message?.content || '{}'
    const data = JSON.parse(json)
    return data.questions || data || []
  } catch (err) {
    console.error(`   ⚠️  JSON parse hiba: ${err.message}`)
    return []
  }
}

/**
 * Kérdések tisztítása és validálása
 */
function cleanQuestions(questions, sectionName) {
  return questions
    .filter(q => q.q && q.q.length > 10) // Túl rövid kérdések szűrése
    .map((q, idx) => ({
      ...q,
      id: q.id || `q${idx + 1}`,
      section: q.section || sectionName,
      type: q.type || 'mcq',
      difficulty: q.difficulty || 'medium',
    }))
}

// ── FŐ FOLYAMAT ───────────────────────────────────────────────────────────────

async function main() {
  const subjectSlug = process.argv[2]

  if (!subjectSlug) {
    console.error('❌ Használat: node scripts/generate-questions.js <subject-slug>')
    console.error('   Példa: node scripts/generate-questions.js it_biztonsag')
    process.exit(1)
  }

  const apiKey = process.env.GROQ_API_KEY
  const forceLocalFallback = process.env.LOCAL_CONTENT_FALLBACK === '1'
  const groq = apiKey && !forceLocalFallback ? new Groq({ apiKey }) : null
  let useLocalFallback = !groq
  if (useLocalFallback) {
    console.log('Using local fallback question generation.')
  }

  const sourceDir = path.join(STORAGE_ROOT, subjectSlug, 'sources', 'test_sources')
  const contentDir = path.join(CONTENT_ROOT, subjectSlug)
  const outputPath = path.join(contentDir, 'questions.json')

  // Forrásfájlok listázása
  const pdfFiles = listSourceFiles(sourceDir, ['.pdf'])
  const docxFiles = listSourceFiles(sourceDir, ['.docx'])
  const mdFiles = listSourceFiles(sourceDir, ['.md', '.mdx'])
  const allFiles = [...pdfFiles, ...docxFiles, ...mdFiles]

  if (allFiles.length === 0) {
    console.error(`❌ Nem található forrásfájl itt: ${sourceDir}`)
    process.exit(1)
  }

  console.log(`📝 ${subjectSlug} kérdések generálása...`)
  console.log(`   Talált fájlok: ${allFiles.length} (${pdfFiles.length} PDF, ${docxFiles.length} DOCX, ${mdFiles.length} MD)`)

  // Kimeneti mappa létrehozása
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true })
    console.log(`   📁 Kimeneti mappa létrehozva: ${contentDir}`)
  }

  let allQuestions = []

  for (const file of allFiles) {
    const fileName = path.basename(file)
    const fileExt = path.extname(file).toLowerCase()

    console.log(`\n📄 ${fileName} feldolgozása...`)

    // Szöveg kinyerése
    let rawText = ''
    try {
      if (fileExt === '.pdf') rawText = await extractTextFromPDF(file)
      else if (fileExt === '.docx') rawText = await extractTextFromDOCX(file)
      else if (fileExt === '.md' || fileExt === '.mdx') rawText = await extractTextFromMD(file)
    } catch (err) {
      console.error(`   ❌ Hiba a fájl olvasásakor: ${err.message}`)
      continue
    }

    if (rawText.length < 200) {
      console.error(`   ⚠️  Túl rövid szöveg (${rawText.length} karakter), kihagyva`)
      continue
    }

    console.log(`   📝 Szöveg hossza: ${rawText.length} karakter`)

    // Section név generálása
    let sectionName = fileName.replace(/\.(pdf|docx|md|mdx)$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Chunkokra darabolás ha túl hosszú
    const chunks = chunkText(rawText)
    console.log(`   📦 Chunkok: ${chunks.length}`)

    // Kérdések generálása chunkonként
    for (let i = 0; i < chunks.length; i++) {
      console.log(`   ✍️  ${i + 1}/${chunks.length} chunk kérdései...`)

      const chunkSection = chunks.length > 1
        ? `${sectionName} (${i + 1}/${chunks.length})`
        : sectionName

      let questions
      if (useLocalFallback) {
        questions = buildFallbackQuestions(chunks[i], chunkSection)
      } else {
        try {
          questions = await generateQuestionsWithGroq(
            groq,
            chunks[i],
            subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            chunkSection
          )
        } catch (err) {
          console.log(`   Groq question generation failed (${err.status || err.code || err.message}); switching to local fallback.`)
          useLocalFallback = true
          questions = buildFallbackQuestions(chunks[i], chunkSection)
        }
      }

      const cleaned = cleanQuestions(questions, chunkSection)
      allQuestions = allQuestions.concat(cleaned)

      console.log(`   ✅ ${cleaned.length} kérdés hozzáadva`)

      // Provider-aware rate limiting is handled by llm-rate-limit.js.
    }
  }

  // Kérdések számozása és deduplikálása
  const seenQuestions = new Set()
  const uniqueQuestions = allQuestions.filter(q => {
    const key = q.q.toLowerCase().slice(0, 50)
    if (seenQuestions.has(key)) return false
    seenQuestions.add(key)
    return true
  })

  // ID-k generálása
  uniqueQuestions.forEach((q, idx) => { q.id = `q${idx + 1}` })

  // Mentés
  fs.writeFileSync(outputPath, JSON.stringify(uniqueQuestions, null, 2), 'utf-8')

  // Statisztikák
  const mcqCount = uniqueQuestions.filter(q => q.type === 'mcq').length
  const multiCount = uniqueQuestions.filter(q => q.type === 'multi').length
  const writtenCount = uniqueQuestions.filter(q => q.type === 'written').length

  console.log(`\n✅ Kérdések generálva!`)
  console.log(`   📊 Összesen: ${uniqueQuestions.length} kérdés`)
  console.log(`      • MCQ: ${mcqCount}`)
  console.log(`      • Multi-select: ${multiCount}`)
  console.log(`      • Written: ${writtenCount}`)
  console.log(`   📁 Helye: ${outputPath}`)
  console.log(`\n👉 Következő lépés: node scripts/generate-extras.js ${subjectSlug}`)
}

main().catch(err => {
  console.error('❌ Hiba:', err.message)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})
