function titleFromSlug(value) {
  return String(value || '')
    .replace(/\.(pdf|docx|md|mdx)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripFrontmatter(text) {
  return String(text || '').replace(/^---[\s\S]*?---\s*/, '')
}

function cleanText(text) {
  return stripFrontmatter(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sentences(text, limit = 8) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 55 && s.length < 320)
    .slice(0, limit)
}

function terms(text, limit = 12) {
  const source = cleanText(text)
  const acronyms = source.match(/\b[A-ZÁÉÍÓÖŐÚÜŰ]{2,}\b/g) || []
  const phrases = source.match(/\b[A-ZÁÉÍÓÖŐÚÜŰ][\p{L}\d-]+(?:\s+[A-ZÁÉÍÓÖŐÚÜŰ]?[\p{L}\d-]+){0,2}/gu) || []
  const stop = new Set(['The', 'And', 'For', 'With', 'This', 'That', 'Egy', 'Az', 'A', 'Es'])
  const seen = new Set()

  return [...acronyms, ...phrases]
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

function excerpt(text, fallback = 'A forrasanyag ezt a temat es a kapcsolodo alapfogalmakat targyalja.') {
  return sentences(text, 1)[0] || fallback
}

function buildActiveRecall(sourceText, sectionName) {
  const keyTerms = terms(sourceText, 4)
  return [
    {
      question: `Mi a(z) ${sectionName} lenyege a forrasanyag alapjan?`,
      answer: excerpt(sourceText),
    },
    {
      question: `Mely fogalmakat erdemes biztosan felismerni ebben a reszben?`,
      answer: keyTerms.length ? keyTerms.join(', ') : 'A fejezet fo fogalmait es a koztuk levo kapcsolatokat.',
    },
    {
      question: 'Milyen gyakorlati kockazat vagy vedelmi szempont kovetkezik az anyagbol?',
      answer: sentences(sourceText, 3)[1] || 'A tanult fogalmakat konkret rendszer- es adatvedelmi donteseknel kell alkalmazni.',
    },
  ]
}

function buildFallbackNote(sourceText, subjectName, sectionName, lessonNumber, sourceTitle) {
  const keyTerms = terms(sourceText, 10)
  const notes = sentences(sourceText, 10)
  const recall = buildActiveRecall(sourceText, sectionName)

  const bullets = notes.length
    ? notes.slice(0, 6).map((s) => `- ${s}`).join('\n')
    : '- A forrasanyag feldolgozhato, de keves jol tagolhato mondatot tartalmazott.'

  const termBullets = keyTerms.length
    ? keyTerms.map((term) => `- **${term}**: a fejezetben kiemelt fogalom vagy hivatkozasi pont.`).join('\n')
    : '- **Alapfogalmak**: a fejezethez tartozo legfontosabb kifejezesek.'

  const recallBlock = recall
    .map((item, idx) => `### Kerdes ${idx + 1}\n**${item.question}**\n\n<details>\n<summary>Valasz</summary>\n${item.answer}\n</details>`)
    .join('\n\n')

  return `---
title: "${sectionName.replace(/"/g, "'")}"
lesson: ${lessonNumber}
section: "${sectionName.replace(/"/g, "'")}"
sources:
  - type: "source"
    title: "${String(sourceTitle || sectionName).replace(/"/g, "'")}"
    year: 2026
---

## Attekintes

Ez a jegyzet lokalis fallback generatort hasznalva keszult, mert az LLM szolgaltatas eppen nem volt elerheto vagy kvotaba futott. A cel, hogy a tanulasi csomag ilyenkor is teljes legyen, es kesobb ugyanazzal a pipeline-nal ujrageneralhato maradjon.

${excerpt(sourceText)}

## Fo pontok

${bullets}

## Fontos fogalmak

${termBullets}

## Vizsgara figyelj

- Tudd a fogalmakat sajat szavaiddal definialni.
- Keresd az osszefuggest a fenyegetes, sebezhetoseg, vedelmi kontroll es kockazat kozott.
- Gyakorold, hogy egy konkret peldaban felismered-e a helyes biztonsagi dontest.

---

## Active Recall

<details>
<summary>Onellenorzo kerdesek</summary>

${recallBlock}

</details>
`
}

function buildFallbackQuestions(sourceText, sectionName) {
  const keyTerms = terms(sourceText, 8)
  const primary = keyTerms[0] || sectionName
  const secondary = keyTerms[1] || 'biztonsagi kontroll'
  const third = keyTerms[2] || 'kockazatkezeles'
  const detail = excerpt(sourceText)

  return [
    {
      type: 'mcq',
      section: sectionName,
      difficulty: 'easy',
      q: `Mihez kapcsolodik leginkabb a(z) ${primary} fogalma?`,
      options: [
        `A(z) ${sectionName} temakor egyik fontos fogalmahoz`,
        'Kizarolag felhasznaloi felulet tervezeshez',
        'Csak adatbazis indexeleshez',
        'Nem kapcsolodik informaciobiztonsaghoz',
      ],
      answer: 0,
      explain: detail,
    },
    {
      type: 'multi',
      section: sectionName,
      difficulty: 'medium',
      q: `Mely elemek tartozhatnak a(z) ${sectionName} tanulasakor ellenorizendo pontok koze?`,
      options: [
        primary,
        secondary,
        third,
        'A biztonsagi kovetelmenyek figyelmen kivul hagyasa',
      ],
      correctMultiple: [0, 1, 2],
      explain: 'A helyes valaszok a forrasanyagbol kinyert kulcsfogalmakra es kapcsolodo biztonsagi szempontokra epulnek.',
    },
    {
      type: 'written',
      section: sectionName,
      difficulty: 'medium',
      q: `Fogalmazd meg roviden, miert fontos a(z) ${sectionName} az IT biztonsagban!`,
      ideal: detail,
      keywords: keyTerms.slice(0, 4),
    },
  ]
}

function buildFallbackFlashcards(sectionTitle, sectionContent) {
  const keyTerms = terms(sectionContent, 4)
  const summary = excerpt(sectionContent)
  const cards = [
    {
      front: `Mi a(z) ${sectionTitle} lenyege?`,
      back: summary,
      type: 'qa',
    },
  ]

  for (const term of keyTerms.slice(0, 3)) {
    cards.push({
      front: `Mit jelent vagy mire utal: ${term}?`,
      back: `A(z) ${sectionTitle} temakorben kiemelt fogalom, amelyet definicio es pelda szintjen is erdemes ismerni.`,
      type: 'term',
    })
  }

  return cards
}

function buildFallbackGlossary(sectionTitle, sectionContent) {
  return terms(sectionContent, 5).map((term) => ({
    term,
    def: `A(z) ${sectionTitle} reszben szereplo fontos fogalom; pontos jelentese a kapcsolodo jegyzetkornyezetbol tanulando.`,
    category: sectionTitle,
  }))
}

module.exports = {
  buildActiveRecall,
  buildFallbackFlashcards,
  buildFallbackGlossary,
  buildFallbackNote,
  buildFallbackQuestions,
  titleFromSlug,
}
