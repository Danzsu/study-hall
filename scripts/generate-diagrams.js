#!/usr/bin/env node
/**
 * generate-diagrams.js
 * SVG diagramok generálása Mermaid szintaxisból
 *
 * Használat: node scripts/generate-diagrams.js <subject-slug>
 *
 * A script Mermaid diagramokat generál a questions.json alapján,
 * ahol a kérdések folyamatábrákat, architektúrát vagy összefüggéseket írnak le.
 */

const fs = require('fs')
const path = require('path')
require('./load-env')
const { Groq } = require('groq-sdk')

const CONTENT_ROOT = path.join(__dirname, '..', 'content')
const GROQ_MODEL = 'llama-3.3-70b-versatile'

/**
 * Diagramötletek generálása a tartalom alapján
 */
async function generateDiagramIdeasWithGroq(groq, questions, subjectName) {
  const prompt = `A következő kérdések alapján azonosítsd azokat a témákat, amelyekhez érdemes lenne diagramot/ábrát készíteni.

TÁRGY: ${subjectName}

KÉRDÉSEK:
${JSON.stringify(questions.slice(0, 30), null, 2)}

AZONOSÍTSD A DIAGRAMOT IGÉNYLŐ TÉMÁKAT:
- Folyamatábrák (flowcharts)
- Architektúra diagramok
- Összehasonlító táblázatok
- Hierarchiák/FA struktúrák
- Ciklusok/Loopok

MERMAID SZINTAXISBAN add meg a diagramokat!

PÉLDÁK:

1. Folyamatábra:
\`\`\`mermaid
flowchart TD
    A[Kezdet] --> B{Döntés?}
    B -->|Igen| C[Művelet 1]
    B -->|Nem| D[Művelet 2]
    C --> E[Vége]
    D --> E
\`\`\`

2. Architektúra:
\`\`\`mermaid
blockDiagram
    Client --> LoadBalancer
    LoadBalancer --> Server1
    LoadBalancer --> Server2
\`\`\`

3. Szekvencia:
\`\`\`mermaid
sequenceDiagram
    User->>API: Kérés
    API->>Database: Lekérdezés
    Database-->>API: Adat
    API-->>User: Válasz
\`\`\`

VISSZA JSON formátumban:
{
  "diagrams": [
    {
      "id": "diag1",
      "title": "Diagram címe",
      "topic": "Téma neve",
      "type": "flowchart|architecture|sequence|comparison",
      "mermaid": "mermaid kód egy sorban, \\n új sorokkal"
    }
  ]
}

Csak a JSON-t add vissza, magyarázat nélkül.`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  try {
    const json = completion.choices[0]?.message?.content || '{}'
    const data = JSON.parse(json)
    return data.diagrams || []
  } catch {
    return []
  }
}

/**
 * Mermaid kód konvertálása SVG-re (szerveroldali renderhez előkészítve)
 * Megjegyzés: A tényleges SVG render client-oldalon történik a Mermaid JS-szel
 */
function prepareDiagramsForFrontend(diagrams) {
  return diagrams.map(d => ({
    ...d,
    // A mermaid kódot tisztítjuk, hogy biztonságosan be lehessen illeszteni
    mermaid: d.mermaid
      .replace(/```mermaid/g, '')
      .replace(/```/g, '')
      .replace(/\n/g, '\\n')
      .replace(/"/g, "'"),
  }))
}

async function main() {
  const subjectSlug = process.argv[2]

  if (!subjectSlug) {
    console.error('❌ Használat: node scripts/generate-diagrams.js <subject-slug>')
    process.exit(1)
  }

  if (process.env.LOCAL_CONTENT_FALLBACK === '1') {
    console.log('LOCAL_CONTENT_FALLBACK=1, diagram generation skipped.')
    return
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.log('⚠️  GROQ_API_KEY nincs beállítva - diagramok kihagyva')
    console.log('   A diagramok opcionálisak, a kérdések nélküle is működnek')
    return
  }

  const groq = new Groq({ apiKey })

  const questionsPath = path.join(CONTENT_ROOT, subjectSlug, 'questions.json')
  const diagramsPath = path.join(CONTENT_ROOT, subjectSlug, 'diagrams.json')

  if (!fs.existsSync(questionsPath)) {
    console.error(`❌ Nem található questions.json: ${questionsPath}`)
    console.error('   Először futtasd: node scripts/generate-questions.js')
    process.exit(1)
  }

  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'))
  const subjectName = subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  console.log(`🖼️  ${subjectName} diagramok generálása...`)
  console.log(`   Feldolgozandó kérdések: ${questions.length}`)

  // Diagramötletek generálása
  const diagrams = await generateDiagramIdeasWithGroq(groq, questions, subjectName)

  if (diagrams.length === 0) {
    console.log('   ⚠️  Nem generálódtak diagramök - a tartalom nem igényel vizualizációt')
    // Üres fájlt is létrehozhatunk
    fs.writeFileSync(diagramsPath, JSON.stringify([], null, 2), 'utf-8')
    return
  }

  // Diagramok előkészítése
  const preparedDiagrams = prepareDiagramsForFrontend(diagrams)

  // Mentés
  fs.writeFileSync(diagramsPath, JSON.stringify(preparedDiagrams, null, 2), 'utf-8')

  console.log(`\n✅ Diagrammok generálva!`)
  console.log(`   📊 Darabszám: ${preparedDiagrams.length}`)
  console.log(`   📁 Helye: ${diagramsPath}`)

  // Típus szerinti statisztika
  const byType = {}
  preparedDiagrams.forEach(d => {
    byType[d.type] = (byType[d.type] || 0) + 1
  })
  console.log(`   📋 Típusok:`)
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`      • ${type}: ${count}`)
  })
}

main().catch(err => {
  console.error('❌ Hiba:', err.message)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})
