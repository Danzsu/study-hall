#!/usr/bin/env node
/**
 * generate-notes.js
 * PDF/DOCX források → MDX notes generálása Groq LLM-mel
 *
 * Használat: node scripts/generate-notes.js <subject-slug>
 *
 * Kimenet: content/<subject-slug>/notes/*.mdx
 */

const fs = require('fs')
const path = require('path')
require('./load-env')
const { chunkDocument } = require('./document-chunker')
const { buildActiveRecall, buildFallbackNote } = require('./local-generators')
const { buildNotePrompt, getNoteDepth, getNoteLanguage } = require('./note-prompts')
const { loadContentPlanSummary } = require('./content-plan')
const { callWithProviderLimit } = require('./llm-rate-limit')
const { readSourceDocument } = require('./source-intelligence')
const { Groq } = require('groq-sdk')

// ── KONFIGURÁCIÓ ──────────────────────────────────────────────────────────────
const STORAGE_ROOT = path.join(__dirname, '..', 'storage', 'subjects')
const CONTENT_ROOT = path.join(__dirname, '..', 'content')

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const OPENROUTER_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
]

// ── HELPER FÜGGVÉNYEK ─────────────────────────────────────────────────────────

/**
 * Forrásfájlok listázása egy mappából
 */
function listSourceFiles(folderPath, extensions) {
  if (!fs.existsSync(folderPath)) return []
  return fs.readdirSync(folderPath)
    .filter(f => extensions.some(ext => f.toLowerCase().endsWith(ext)))
    .map(f => path.join(folderPath, f))
}

function listFilesRecursive(folderPath, extensions) {
  if (!fs.existsSync(folderPath)) return []
  const entries = fs.readdirSync(folderPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath, extensions))
      continue
    }
    if (extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
      files.push(fullPath)
    }
  }
  return files.sort((a, b) => a.localeCompare(b))
}

function collectSourceAssets(sourceDir) {
  const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff']
  return listFilesRecursive(sourceDir, assetExtensions).map((assetPath) => ({
    filePath: assetPath,
    relativePath: path.relative(sourceDir, assetPath),
    size: fs.statSync(assetPath).size,
  }))
}

function copySourceAssets(assets, targetDir) {
  if (!assets.length) return []

  fs.mkdirSync(targetDir, { recursive: true })
  const copied = []

  for (const asset of assets) {
    const outputPath = path.join(targetDir, asset.relativePath)
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.copyFileSync(asset.filePath, outputPath)
    copied.push({
      sourcePath: asset.filePath,
      relativePath: path.relative(path.join(CONTENT_ROOT, path.basename(path.dirname(targetDir))), outputPath),
      outputPath,
      size: asset.size,
    })
  }

  return copied
}

function summarizeSourceAssets(assets, limit = 5) {
  if (!assets.length) return 'Source assets: none'
  const names = assets.slice(0, limit).map((asset) => path.basename(asset.relativePath))
  return `Source assets (${assets.length}): ${names.join(', ')}${assets.length > limit ? ', ...' : ''}`
}

/**
 * Szöveg darabolása kezelhető méretű chunkokra (~4000 karakter)
 */
function chunkText(text, maxChunkSize = 3800, overlap = 400) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length)

    // Próbáljunk mondat vagy bekezdés végén vágni
    if (end < text.length) {
      const searchBack = Math.min(500, end - start)
      for (let i = 0; i < searchBack; i++) {
        const pos = end - i
        if (text[pos] === '\n' && text[pos - 1] === '\n') {
          end = pos
          break
        }
        if (text[pos] === '.' || text[pos] === '!' || text[pos] === '?') {
          end = pos + 1
          break
        }
      }
    }

    chunks.push(text.slice(start, end).trim())
    start = end - overlap
    if (start < 0) start = 0
    if (end >= text.length) break
  }

  return chunks
}

/**
 * Groq API hívás notes generálására
 */
async function generateNotesWithGroq(groq, sourceText, subjectName, sectionName, options = {}) {
  const prompt = buildNotePrompt({
    sourceText,
    subjectName,
    sectionName,
    chunkIndex: options.chunkIndex ?? 0,
    chunkCount: options.chunkCount ?? 1,
    language: options.language ?? 'hu',
    depth: options.depth ?? 'exam-prep notes',
    planContext: options.planContext ?? '',
    extractionMetadata: options.extractionMetadata ?? '',
  })
  /* Legacy prompt removed; see scripts/note-prompts.js.

TÁRGY: ${subjectName}
FEJEZET/CÍM: ${sectionName}

FORRÁSSZÖVEG:
${sourceText}

KÉSZÍTS EGY TELJES, JÓL SZERKESZTETT MDX JEGYZETET AZ ALÁBBI SZABÁLYOK SZERINT:

1. FORMÁTUM: MDX (Markdown + JSX komponensek támogatással)
2. STÍLUS: Humanizált, könnyen érthető, de szakmailag pontos
3. STRUKTÚRA:
   - Kezdd egy rövid bevezetővel (2-3 mondat)
   - Használj fejezetcímeket (##, ###) a logikai tagoláshoz
   - Emeld ki a **fontos kifejezéseket** félkövéren
   - Használj listákat (- vagy 1.) ahol áttekinthetőbb
   - Legyen legalább egy > idézet blokk (kiemelt gondolat)
   - Legyen legalább egy kód blokk (\`\`\`) ha technikai téma

4. LATEX TÁMOGATÁS: Használj $...$ inline és $$...$$ blokk matematikai képletekhez

5. NE használj:
   - HTML tageket (kivéve ha JSX komponens)
   - Túl hosszú bekezdéseket (max 5-6 sor)
   - Passzív szerkezeteket túlzottan

6. ADD HOZZÁ a következő frontmatter-t a fájl elején:
---
title: "${sectionName}"
lesson: 1
section: "${sectionName}"
sources:
  - type: "pdf"
    title: "${subjectName} - ${sectionName}"
    year: 2025
---

*/

  const completion = await callWithProviderLimit('groq', () => groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 6000,
  }))

  return completion.choices[0]?.message?.content || ''
}

async function generateNotesWithOpenRouter(apiKey, sourceText, subjectName, sectionName, options = {}) {
  const prompt = buildNotePrompt({
    sourceText,
    subjectName,
    sectionName,
    chunkIndex: options.chunkIndex ?? 0,
    chunkCount: options.chunkCount ?? 1,
    language: options.language ?? 'hu',
    depth: options.depth ?? 'exam-prep notes',
    planContext: options.planContext ?? '',
    extractionMetadata: options.extractionMetadata ?? '',
  })

  const errors = []
  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await callWithProviderLimit('openrouter', () => fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Study Hall Content Pipeline',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.35,
          max_tokens: 6000,
        }),
      }))

      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (err) {
      errors.push(`${model}: ${err.message || err}`)
    }
  }

  throw new Error(`OpenRouter note generation failed: ${errors.slice(-2).join(' | ')}`)
}

/**
 * Aktív Recall kérdések generálása egy lecke végére
 */
async function generateActiveRecall(groq, notesContent, sectionName) {
  const prompt = `A következő jegyzet alapján generálj 3-5 rövid önellenőrző kérdést a hallgatók számára.

FEJEZET: ${sectionName}

JEGYZET:
${notesContent.slice(0, 3000)}

VÁLASZ FORMÁTUMA (csak JSON, magyarázat nélkül):
[
  {
    "question": "A kérdés szövege?",
    "answer": "A válasz, amit a kártya flip után mutat"
  }
]

A kérdések legyenek:
- Rövidek (1-2 mondatos válasz várható)
- A legfontosabb koncepciókra fókuszáljanak
- Gyakorlatiasak (ne csak definíciók)`

  const completion = await callWithProviderLimit('groq', () => groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  }))

  try {
    const json = completion.choices[0]?.message?.content || '{}'
    const data = JSON.parse(json)
    return data.questions || data || []
  } catch {
    return []
  }
}

// ── FŐ FOLYAMAT ───────────────────────────────────────────────────────────────

async function main() {
  const subjectSlug = process.argv[2]

  if (!subjectSlug) {
    console.error('❌ Használat: node scripts/generate-notes.js <subject-slug>')
    console.error('   Példa: node scripts/generate-notes.js it_biztonsag')
    process.exit(1)
  }

  const apiKey = process.env.GROQ_API_KEY
  const openRouterApiKey = process.env.OPENROUTER_API_KEY
  const forceLocalFallback = process.env.LOCAL_CONTENT_FALLBACK === '1'
  const groq = apiKey && !forceLocalFallback ? new Groq({ apiKey }) : null
  const canUseOpenRouter = !!openRouterApiKey && !forceLocalFallback
  let useLocalFallback = !groq && !canUseOpenRouter
  if (useLocalFallback) {
    console.log('Using local fallback note generation.')
  }
  const noteLanguage = getNoteLanguage()
  const noteDepth = getNoteDepth()
  const planContext = loadContentPlanSummary(subjectSlug)
  console.log(`Note profile: language=${noteLanguage}, depth=${noteDepth}`)

  const sourceDir = path.join(STORAGE_ROOT, subjectSlug, 'sources', 'lesson_sources')
  const outputDir = path.join(CONTENT_ROOT, subjectSlug, 'notes')
  const artifactsDir = path.join(CONTENT_ROOT, subjectSlug, 'notes', 'artifacts')
  const sourceAssetsDir = path.join(CONTENT_ROOT, subjectSlug, 'source-assets')

  // Forrásfájlok listázása
  const pdfFiles = listSourceFiles(sourceDir, ['.pdf'])
  const docxFiles = listSourceFiles(sourceDir, ['.docx'])
  const mdFiles = listSourceFiles(sourceDir, ['.md', '.mdx', '.txt'])
  const allFiles = [...pdfFiles, ...docxFiles, ...mdFiles]
  const sourceAssets = collectSourceAssets(sourceDir)

  if (allFiles.length === 0) {
    console.error(`❌ Nem található forrásfájl itt: ${sourceDir}`)
    console.error('   Helyezz el PDF vagy DOCX fájlokat a mappában')
    process.exit(1)
  }

  console.log(`📚 ${subjectSlug} feldolgozása...`)
  console.log(`   Talált fájlok: ${allFiles.length} (${pdfFiles.length} PDF, ${docxFiles.length} DOCX, ${mdFiles.length} MD/TXT)`)

  // Kimeneti mappa létrehozása
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`   📁 Kimeneti mappa létrehozva: ${outputDir}`)
  }

  // Meta információk a subjecthez
  fs.mkdirSync(artifactsDir, { recursive: true })
  const copiedAssets = copySourceAssets(sourceAssets, sourceAssetsDir)
  if (copiedAssets.length) {
    fs.writeFileSync(path.join(CONTENT_ROOT, subjectSlug, 'source-assets.json'), JSON.stringify(copiedAssets.map((asset) => ({
      sourcePath: path.relative(CONTENT_ROOT, asset.sourcePath),
      relativePath: path.relative(path.join(CONTENT_ROOT, subjectSlug), asset.outputPath),
      size: asset.size,
    })), null, 2), 'utf-8')
  }

  const metaPath = path.join(CONTENT_ROOT, subjectSlug, 'meta.json')
  const meta = {
    slug: subjectSlug,
    name: subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: `${subjectSlug} jegyzetek és tanulási anyagok`,
    color: '#E07355',
    icon: 'book',
  }

  // Feldolgozás fájlonként
  let lessonCounter = 0
  const lessonsList = []

  for (const file of allFiles) {
    const fileName = path.basename(file)
    const fileExt = path.extname(file).toLowerCase()

    console.log(`\n📄 ${fileName} feldolgozása...`)

    // Szöveg, kérdésblokkok és forrás-assetek kinyerése
    let sourceDocument
    let rawText = ''
    try {
      sourceDocument = await readSourceDocument(file, {
        subjectSlug,
        sourceKind: 'lesson',
        contentRoot: CONTENT_ROOT,
      })
      rawText = sourceDocument.text
    } catch (err) {
      console.error(`   ❌ Hiba a fájl olvasásakor: ${err.message}`)
      continue
    }

    if (rawText.length < 100) {
      console.error(`   ⚠️  Túl rövid szöveg (${rawText.length} karakter), kihagyva`)
      continue
    }

    console.log(`   📝 Szöveg hossza: ${rawText.length} karakter`)

    // Chunkokra darabolás
    const chunks = chunkDocument(rawText, { sourceTitle: fileName })
    console.log(`   📦 Chunkok száma: ${chunks.length}`)

    // Section név generálása (fájlnévből vagy első chunkból)
    let sectionName = fileName.replace(/\.(pdf|docx)$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Ha van ékezetes fájlnév, megtartjuk
    if (/[áéíóöőúüű]/i.test(fileName)) {
      sectionName = fileName.replace(/\.(pdf|docx)$/i, '').trim()
    }

    const lessonSlug = `${String(lessonCounter + 1).padStart(2, '0')}-${path.basename(file, fileExt).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}`
    const outputPath = path.join(outputDir, `${lessonSlug}.mdx`)
    const artifactPath = path.join(artifactsDir, `${lessonSlug}.json`)
    const sourceRef = {
      type: sourceDocument.sourceKind,
      title: sourceDocument.sourceFile,
      manifest: path.relative(path.join(CONTENT_ROOT, subjectSlug), sourceDocument.manifestPath).replace(/\\/g, '/'),
      visualReferences: sourceDocument.visualReferences.length,
      assessmentBlocks: sourceDocument.assessmentBlocks.length,
      routedAssessmentBlocks: sourceDocument.assessmentBlocks.filter((block) => block.target === 'questions').length,
      extractedAssets: sourceDocument.extractedAssets.map((asset) => ({
        ...asset,
        path: path.relative(path.join(CONTENT_ROOT, subjectSlug), path.join(sourceDocument.assetDir, asset.file)).replace(/\\/g, '/'),
      })),
    }
    fs.writeFileSync(artifactPath, JSON.stringify({
      sourceFile: fileName,
      lessonSlug,
      sectionName,
      language: noteLanguage,
      depth: noteDepth,
      extraction: sourceDocument.extraction,
      sourceManifest: sourceRef.manifest,
      assessmentBlocks: sourceDocument.assessmentBlocks,
      visualReferences: sourceDocument.visualReferences,
      learningSignals: sourceDocument.learningSignals,
      extractedAssets: sourceRef.extractedAssets,
      sourceAssets: copiedAssets.map((asset) => ({
        relativePath: path.relative(path.join(CONTENT_ROOT, subjectSlug), asset.outputPath),
        size: asset.size,
      })),
      chunks: chunks.map(chunk => ({
        index: chunk.index,
        chars: chunk.chars,
        headings: chunk.headings,
        visualCandidates: chunk.visualCandidates,
        questionCandidates: chunk.questionCandidates,
        learningSignals: chunk.learningSignals,
        learningIntent: chunk.learningIntent,
      })),
    }, null, 2), 'utf-8')

    // Notes generálása chunkonként (ha több chunk van)
    if (fs.existsSync(outputPath)) {
      console.log(`   Existing note found, keeping: ${lessonSlug}.mdx`)
      lessonsList.push({
        slug: lessonSlug,
        title: sectionName,
        section: sectionName,
        lesson: lessonCounter + 1,
        time: `${Math.ceil(rawText.length / 2000) * 3 + 5} min`,
        sources: [sourceRef],
      })
      lessonCounter++
      continue
    }

    if (useLocalFallback) {
      const fallbackNotes = buildFallbackNote(rawText, meta.name, sectionName, lessonCounter + 1, fileName)
      fs.writeFileSync(outputPath, fallbackNotes, 'utf-8')
      console.log(`   Local fallback saved: ${lessonSlug}.mdx`)
      lessonsList.push({
        slug: lessonSlug,
        title: sectionName,
        section: sectionName,
        lesson: lessonCounter + 1,
        time: `${Math.ceil(rawText.length / 2000) * 3 + 5} min`,
        sources: [sourceRef],
      })
      lessonCounter++
      continue
    }

    let fullNotes = ''
    for (let i = 0; i < chunks.length; i++) {
      console.log(`   ✍️  ${i + 1}/${chunks.length} chunk generálása...`)

      let chunkNotes
      try {
        const noteOptions = {
          chunkIndex: i,
          chunkCount: chunks.length,
          language: noteLanguage,
          depth: noteDepth,
          planContext,
          extractionMetadata: [
            summarizeSourceAssets(copiedAssets),
            `Extracted embedded assets: ${sourceDocument.extractedAssets.length}`,
            `Visual references in source: ${sourceDocument.visualReferences.length}`,
            `Assessment/question blocks in source: ${sourceDocument.assessmentBlocks.length}`,
            `Routed assessment blocks: ${sourceDocument.assessmentBlocks.filter((block) => block.target === 'questions').length}`,
            `Learning signal density: ${JSON.stringify(sourceDocument.learningSignals?.density || {})}`,
            `Chunk learning intent: ${chunks[i].learningIntent?.label || chunks[i].learningIntent?.primary || 'study'}`,
            `Question-like blocks in chunk: ${chunks[i].questionCandidates?.length || 0}`,
          ].join('\n'),
        }
        const chunkSectionName = sectionName + (chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : '')

        if (groq) {
          try {
            chunkNotes = await generateNotesWithGroq(
              groq,
              chunks[i].promptText,
              meta.name,
              chunkSectionName,
              noteOptions
            )
          } catch (err) {
            if (!canUseOpenRouter) throw err
            console.log(`   Groq note generation failed (${err.status || err.code || err.message}); trying OpenRouter.`)
          }
        }

        if (!chunkNotes && canUseOpenRouter) {
          chunkNotes = await generateNotesWithOpenRouter(
            openRouterApiKey,
            chunks[i].promptText,
            meta.name,
            chunkSectionName,
            noteOptions
          )
        }
      } catch (err) {
        console.log(`   Remote note generation failed (${err.status || err.code || err.message}); switching to local fallback.`)
        useLocalFallback = true
        fullNotes = buildFallbackNote(rawText, meta.name, sectionName, lessonCounter + 1, fileName)
        break
      }

      // Frontmatter csak az első chunknál
      if (i > 0) {
        fullNotes += chunkNotes.replace(/^---[\s\S]*?---\n/, '')
      } else {
        fullNotes += chunkNotes
      }

      // Rate limit elkerülése
      // Provider-aware rate limiting is handled by llm-rate-limit.js.
    }

    // Aktív Recall kérdések generálása
    console.log(`   ❓ Aktív Recall kérdések generálása...`)
    let activeRecall = []
    if (!useLocalFallback) {
      try {
        activeRecall = await generateActiveRecall(groq, fullNotes, sectionName)
      } catch (err) {
        console.log(`   Groq Active Recall failed (${err.status || err.code || err.message}); using local fallback.`)
        activeRecall = buildActiveRecall(rawText, sectionName)
      }
    }

    // Active Recall hozzáfűzése a notes végéhez
    if (activeRecall.length > 0) {
      fullNotes += '\n\n---\n\n## 🧠 Active Recall\n\n<details>\n<summary>Önellenőrző kérdések (kattints a kibontáshoz)</summary>\n\n'
      activeRecall.forEach((item, idx) => {
        fullNotes += `### Kérdés ${idx + 1}\n**${item.question}**\n\n<details>\n<summary>Válasz</summary>\n${item.answer}\n</details>\n\n`
      })
      fullNotes += '</details>\n'
    }

    // MDX fájl mentése
    fs.writeFileSync(outputPath, fullNotes, 'utf-8')
    console.log(`   ✅ Mentve: ${lessonSlug}.mdx`)

    lessonsList.push({
      slug: lessonSlug,
      title: sectionName,
      section: sectionName,
      lesson: lessonCounter + 1,
      time: `${Math.ceil(rawText.length / 2000) * 3 + 5} min`, // Becsült olvasási idő
      sources: [sourceRef],
    })

    lessonCounter++
  }

  // Meta fájl mentése
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
  console.log(`\n📋 meta.json frissítve`)

  // Lessons lista mentése (a notes mappa szintjén, hogy az API elérje)
  const lessonsIndexPath = path.join(outputDir, 'lessons.json')
  fs.writeFileSync(lessonsIndexPath, JSON.stringify(lessonsList, null, 2), 'utf-8')
  console.log(`📋 lessons.json létrehozva (${lessonsList.length} lecke)`)

  // Összegzés
  console.log(`\n✅ ${subjectSlug} generálása kész!`)
  console.log(`   📊 Összesen: ${lessonCounter} lecke`)
  console.log(`   📁 Helye: ${outputDir}`)
  console.log(`\n👉 Következő lépés: node scripts/generate-questions.js ${subjectSlug}`)
}

main().catch(err => {
  console.error('❌ Hiba:', err.message)
  if (process.env.DEBUG) console.error(err)
  process.exit(1)
})
