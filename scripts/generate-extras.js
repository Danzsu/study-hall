#!/usr/bin/env node
/**
 * generate-extras.js
 * Flashcards + Glossary generálás meglévő notes/questions alapján
 *
 * Használat: node scripts/generate-extras.js <subject-slug>
 *
 * Kimenet:
 *   - content/<subject-slug>/flashcards.json
 *   - content/<subject-slug>/glossary.json
 */

const fs = require('fs')
const path = require('path')
require('./load-env')
const { buildFallbackFlashcards, buildFallbackGlossary } = require('./local-generators')
const { loadContentPlanSummary } = require('./content-plan')
const { callWithProviderLimit } = require('./llm-rate-limit')
const { Groq } = require('groq-sdk')

// ── KONFIGURÁCIÓ ──────────────────────────────────────────────────────────────
const CONTENT_ROOT = path.join(__dirname, '..', 'content')
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── HELPER FÜGGVÉNYEK ─────────────────────────────────────────────────────────

/**
 * MDX fájlok olvasása egy mappából
 */
function readMDXFiles(folderPath) {
  if (!fs.existsSync(folderPath)) return []
  return fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.mdx'))
    .map(f => ({
      path: path.join(folderPath, f),
      content: fs.readFileSync(path.join(folderPath, f), 'utf-8'),
    }))
}

/**
 * Kiemelt kifejezések kinyerése MDX-ből (félkövér szövegek)
 */
function extractBoldTerms(content) {
  const regex = /\*\*(.+?)\*\*/g
  const matches = []
  let match
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1])
  }
  return [...new Set(matches)] // unique
}

/**
 * Fejezetcímek kinyerése MDX-ből
 */
function extractSections(content) {
  const lines = content.split('\n')
  const sections = []
  let currentSection = null
  let currentContent = []

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n'),
        })
      }
      currentSection = line.replace(/^#+ /, '').trim()
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    }
  }

  if (currentSection) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n'),
    })
  }

  return sections
}

/**
 * Flashcardok generálása Groq-val
 */
async function generateFlashcardsWithGroq(groq, notesContent, subjectName, planContext = '') {
  const prompt = `A következő tanulási anyag alapján készíts flashcardokat (kérdés-válasz párokat).

TÁRGY: ${subjectName}

SHARED CONTENT PLAN:
${planContext || 'No cached plan available yet. Use the note structure directly.'}

ANYAG:
${notesContent.slice(0, 6000)}

KÉSZÍTS FLASHCARDOKAT AZ ALÁBBI SZABÁLYOK SZERINT:

1. FORMÁTUM:
   - Rövid kérdés (front)
   - Tömör válasz (back)
   - Minden kártya legyen önállóan értelmezhető

2. TÍPUSOK:
   - Definíciók: "Mi az X?" → "X definíciója"
   - Fogalmak: "X fogalma" → "Magyarázat"
   - Rövidítések: "MIT jelent az X?" → "Full name"

3. JSON FORMÁTUM:
[
  {
    "id": "f1",
    "front": "Kérdés vagy fogalom",
    "back": "Válasz vagy definíció",
    "section": "Fejezet neve",
    "type": "definition"
  }
]

4. DARABSZÁM: 15-25 flashcard legyen

5. MAGYAR NYELV: Minden magyarul!

VISSZA: Csak a tiszta JSON tömböt.`

  const completion = await callWithProviderLimit('groq', () => groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  }))

  try {
    const json = completion.choices[0]?.message?.content || '{}'
    const data = JSON.parse(json)
    return data.flashcards || data || []
  } catch {
    return []
  }
}

/**
 * Glossary entries generálása Groq-val
 */
async function generateGlossaryWithGroq(groq, notesContent, subjectName) {
  const prompt = `A következő tanulási anyag alapján készíts szakmai glosszáriumot.

TÁRGY: ${subjectName}

ANYAG:
${notesContent.slice(0, 6000)}

SZIGORÚ SZABÁLYOK — olvasd el figyelmesen:

EGY GLOSSARY ENTRY: önálló szakkifejezés, rövidítés vagy tulajdonnév, amelyet a
hallgatónak vizsgán definiálnia kell. NEM az:
- Fejezetcím (pl. "Bevezetés az IT biztonságba", "A CIA triád alkalmazása")
- Mondattöredék (pl. "Ezeket a követelményeket", "Az információszerzés megelőzheti")
- Magyar névelővel kezdődő kifejezés, amely nem maga a fogalom
  (ROSSZ: "Az IT biztonság", "Az egyéni támadók" — ezek mondatkezdetek)
- Általános fogalom domain-specifikus értelem nélkül (pl. "Képességek", "Erőforrások")

HELYES term példák: "CIA triád", "AES-256", "SQL injection", "hitelesítés",
"TLS 1.3", "Diffie–Hellman kulcscsere", "brute-force támadás", "hash függvény"

DEFINÍCIÓ: 2–3 mondat. Magyarázd meg MI EZ és HOGYAN MŰKÖDIK.
SOHA ne írd: "A(z) X szekcióban szereplő fogalom" — ez értéktelen.

DARABSZÁM: pontosan 6–12 entry. Kevesebb de jobb minőségű.

ELLENŐRZÉS felvétel előtt:
- Főnév, rövidítés vagy névvel ellátott fogalom? ✓
- Vizsgán definíció kérhető belőle? ✓
- A definíció elmagyarázza mi ez, nem egy szekcióra hivatkozik? ✓
- 50 karakternél rövidebb és legfeljebb 4 szóból áll? ✓

JSON FORMÁTUM (csak a tömböt add vissza, wrapper kulcs nélkül):
[
  {
    "term": "Szakkifejezés",
    "definition": "2-3 mondatos definíció, ami elmagyarázza mi ez és hogyan működik.",
    "category": "Kriptográfia",
    "aliases": []
  }
]`

  const completion = await callWithProviderLimit('groq', () => groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  }))

  try {
    const json = completion.choices[0]?.message?.content || '{}'
    const data = JSON.parse(json)
    return data.glossary || data || []
  } catch {
    return []
  }
}

/**
 * Kiszűri a rossz minőségű glossary entryket:
 * - placeholder definíciókat (fallback generátortól)
 * - fejezetcímeket és mondattöredékeket (Magyar névelővel kezdődő term)
 * - túl hosszú termeket (mondattöredékek)
 */
function validateGlossaryEntry(g) {
  const term = (g.term || '').trim()
  const def  = (g.definition || g.def || '').trim()
  if (def.includes('szereplo fontos fogalom') || def.includes('kapcsolodo jegyzetkornyezetbol')) return false
  if (/^(Az?\s|A\(z\)\s)/i.test(term)) return false
  if (term.length > 55 || term.length < 2) return false
  if (term.split(/\s+/).length > 5) return false
  if (!def || def.length < 30) return false
  return true
}

// ── FŐ FOLYAMAT ───────────────────────────────────────────────────────────────

async function main() {
  const subjectSlug = process.argv[2]

  if (!subjectSlug) {
    console.error('❌ Használat: node scripts/generate-extras.js <subject-slug>')
    console.error('   Példa: node scripts/generate-extras.js it_biztonsag')
    process.exit(1)
  }

  const apiKey = process.env.GROQ_API_KEY
  const forceLocalFallback = process.env.LOCAL_CONTENT_FALLBACK === '1'
  const groq = apiKey && !forceLocalFallback ? new Groq({ apiKey }) : null
  let useLocalFallback = !groq
  const planContext = loadContentPlanSummary(subjectSlug)
  if (useLocalFallback) {
    console.log('Using local fallback extras generation.')
  }

  const notesDir = path.join(CONTENT_ROOT, subjectSlug, 'notes')
  const contentDir = path.join(CONTENT_ROOT, subjectSlug)
  const flashcardsPath = path.join(contentDir, 'flashcards.json')
  const glossaryPath = path.join(contentDir, 'glossary.json')

  // Notes fájlok olvasása
  const mdxFiles = readMDXFiles(notesDir)

  if (mdxFiles.length === 0) {
    console.error(`❌ Nem található MDX fájl itt: ${notesDir}`)
    console.error('   Először futtasd: node scripts/generate-notes.js ${subjectSlug}')
    process.exit(1)
  }

  console.log(`🃏 ${subjectSlug} flashcardok és glosszárium generálása...`)
  console.log(`   Talált noteszek: ${mdxFiles.length}`)

  let allFlashcards = []
  let allGlossary = []

  // Notesz fájlonkénti feldolgozás
  for (const file of mdxFiles) {
    const fileName = path.basename(file.path)
    console.log(`\n📄 ${fileName} feldolgozása...`)

    // Sectionök kinyerése
    const sections = extractSections(file.content)

    // Sectionönkénti generálás
    for (const section of sections) {
      console.log(`   📑 ${section.title}...`)

      // Flashcardok
      let flashcards
      if (useLocalFallback) {
        flashcards = buildFallbackFlashcards(section.title, section.content)
      } else {
        try {
          flashcards = await generateFlashcardsWithGroq(
            groq,
            section.content,
            subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            planContext
          )
        } catch (err) {
          console.log(`   Groq flashcard generation failed (${err.status || err.code || err.message}); switching to local fallback.`)
          useLocalFallback = true
          flashcards = buildFallbackFlashcards(section.title, section.content)
        }
      }
      const flashcardsWithSection = flashcards.map(f => ({
        ...f,
        section: section.title,
      }))
      allFlashcards = allFlashcards.concat(flashcardsWithSection)
      console.log(`   ✅ ${flashcardsWithSection.length} flashcard`)

      // Glossary
      let glossary
      if (useLocalFallback) {
        glossary = []
        console.log(`   ⚠️  Using local fallback mode — skipping glossary for "${section.title}"`)
      } else {
        try {
          glossary = await generateGlossaryWithGroq(
            groq,
            section.content,
            subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          )
        } catch (err) {
          console.log(`   ⚠️  Glossary LLM failed for "${section.title}" (${err.status || err.code || err.message}), skipping section (no placeholders)`)
          glossary = []
        }
      }
      const glossaryWithSection = glossary.map(g => ({
        ...g,
        section: section.title,
      }))
      allGlossary = allGlossary.concat(glossaryWithSection)
      console.log(`   ✅ ${glossaryWithSection.length} glossary entry`)

      // Provider-aware rate limiting is handled by llm-rate-limit.js.
    }
  }

  // Deduplikálás
  const seenFlashcards = new Set()
  const uniqueFlashcards = allFlashcards.filter(f => {
    const key = `${f.front}|${f.back}`.toLowerCase().slice(0, 80)
    if (seenFlashcards.has(key)) return false
    seenFlashcards.add(key)
    return true
  })

  const seenGlossary = new Set()
  const uniqueGlossary = allGlossary.filter(g => {
    const key = (g.term || '').toLowerCase()
    if (seenGlossary.has(key)) return false
    seenGlossary.add(key)
    return true
  })

  const validatedGlossary = uniqueGlossary.filter(validateGlossaryEntry)

  // ID-k generálása
  uniqueFlashcards.forEach((f, idx) => { f.id = `f${idx + 1}` })
  validatedGlossary.forEach((g, idx) => { g.id = `g${idx + 1}` })

  // Mentés
  fs.writeFileSync(flashcardsPath, JSON.stringify(uniqueFlashcards, null, 2), 'utf-8')
  fs.writeFileSync(glossaryPath, JSON.stringify(validatedGlossary, null, 2), 'utf-8')

  console.log(`\n✅ Generálás kész!`)
  console.log(`   🃏 Flashcardok: ${uniqueFlashcards.length}`)
  console.log(`   📖 Glossary: ${validatedGlossary.length} (${uniqueGlossary.length - validatedGlossary.length} placeholder/fragment kiszűrve)`)
  console.log(`   📁 Flashcards: ${flashcardsPath}`)
  console.log(`   📁 Glossary: ${glossaryPath}`)

  // subjects.json frissítése
  const subjectsPath = path.join(CONTENT_ROOT, 'subjects.json')
  let subjects = []
  if (fs.existsSync(subjectsPath)) {
    subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8'))
  }

  const existingIdx = subjects.findIndex(s => s.slug === subjectSlug)
  const subjectData = {
    slug: subjectSlug,
    name: subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: `${subjectSlug} tanulási anyagok`,
    color: '#E07355',
    icon: 'book',
    questionCount: uniqueFlashcards.length + validatedGlossary.length,
    lessonCount: mdxFiles.length,
    flashcardCount: uniqueFlashcards.length,
    glossaryCount: validatedGlossary.length,
  }

  if (existingIdx >= 0) {
    subjects[existingIdx] = subjectData
  } else {
    subjects.push(subjectData)
  }

  fs.writeFileSync(subjectsPath, JSON.stringify(subjects, null, 2), 'utf-8')
  console.log(`   📋 subjects.json frissítve`)

  console.log(`\n🎉 ${subjectSlug} teljes generálása kész!`)
  console.log(`\nHasználat:\n   git add .\n   git commit -m "Add ${subjectSlug} content"\n   git push`)
}

main().catch(err => {
  console.error('❌ Hiba:', err.message)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})
