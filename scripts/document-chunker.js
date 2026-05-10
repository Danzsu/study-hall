function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}

function excerptText(text, maxChars = 220) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars)
}

function isHeading(line) {
  const value = line.trim()
  if (!value || value.length > 120) return false
  if (/^#{1,4}\s+/.test(value)) return true
  if (/^\d+(\.\d+){0,3}\s+[\p{L}A-Z]/u.test(value)) return true
  if (/^(chapter|section|lecture|slide|fejezet|eloadas|resz)\b/i.test(value)) return true
  if (value === value.toUpperCase() && /[A-Z]/.test(value) && value.length > 4) return true
  return false
}

function detectLearningSignals(text) {
  const lines = String(text || '').split('\n')
  const compact = String(text || '').toLowerCase()
  const firstLine = lines[0] || ''
  const hasQuestionCue = /\b(question|questions|kerdes|feladat|exercise|quiz|task|check|review)\b/i.test(text)
    || lines.some((line) => /^\s*(q:|question:|kerdes:|feladat:|exercise:|quiz:|task:)/i.test(line))
    || text.includes('?')
  const hasDefinitionCue = /\b(definition|define|defined as|means|refers to|stands for|explain(s)? what|definition:|definicio|jelenti|means that|meghatarozza|describes?|described as)\b/i.test(text)
    || /\b(is|are)\s+(a|an|the)?\s*(practice|method|process|way|form|type|technique|approach|system|set|group|collection|idea|concept|framework)\b/i.test(text)
    || /^\s*[\p{L}0-9][^?:\n]{2,80}\s*[:\-]\s+[^:]/u.test(firstLine)
    || /^\s*[\p{L}0-9][^?:\n]{2,80}\s*(is|means|refers to)\s+/i.test(firstLine)
  const hasExampleCue = /\b(example|examples|for example|e\.g\.|instance|sample|illustration|use case|case study|scenario|pelda)\b/i.test(text)
    || /^\s*(example|pelda)\s*[:\-]/i.test(firstLine)
  const hasConceptCue = isHeading(firstLine)
    || /\b(concept|concepts|principle|principles|model|models|framework|frameworks|theory|theories|mechanism|mechanisms|process|processes|policy|policies|pattern|patterns|architecture|architectures|control|controls|relationship|relationships|trade[- ]?off|risk|risks|topic|topics|idea|ideas|term|terms|core idea|key idea|alapfogalom|fogalom|kulcsfogalom)\b/i.test(text)
    || /^(what is|why does|how does|why is|what are|how are)\b/i.test(compact)

  return {
    concept: hasConceptCue ? excerptText(text) : '',
    definition: hasDefinitionCue ? excerptText(text) : '',
    example: hasExampleCue ? excerptText(text) : '',
    question: hasQuestionCue ? excerptText(text) : '',
  }
}

function classifyBlock(text) {
  const lines = text.split('\n')
  const compact = text.toLowerCase()
  const hasQuestionCue = /\b(question|questions|kerdes|feladat|exercise|quiz|task|check|review)\b/i.test(text)
    || lines.some((line) => /^\s*(q:|question:|kerdes:|feladat:|exercise:|quiz:|task:)/i.test(line))
    || text.includes('?')
  const hasFigureCue = /\b(fig\.?|figure|diagram|schema|architecture|flow|slide|abra|kep|image|screenshot)\b/i.test(text)
  const hasTableCue = /\b(table|tablazat|tabla)\b/i.test(text) || lines.some((line) => (line.match(/\s{2,}|\t/g) || []).length >= 2)
  const hasEquationCue = /[$=∑√≤≥≈≠→←↔]|\\frac|\\sum|\\int|\bO\([^)]+\)/.test(text)
  const hasCodeCue = /```|function\s+\w+|class\s+\w+|SELECT\s+.+FROM|<\w+[\s>]/i.test(text)

  if (hasQuestionCue) return 'question'
  if (hasFigureCue) return 'figure'
  if (hasTableCue) return 'table'
  if (hasEquationCue) return 'equation'
  if (hasCodeCue) return 'code'
  if (compact.length < 180 && isHeading(lines[0] || '')) return 'heading'
  return 'text'
}

function splitIntoBlocks(text) {
  const normalized = normalizeText(text)
  if (!normalized) return []

  const rawBlocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const blocks = []
  let currentHeading = 'General'

  for (const block of rawBlocks) {
    const firstLine = block.split('\n')[0]?.trim() || ''
    if (isHeading(firstLine)) currentHeading = firstLine.replace(/^#{1,4}\s+/, '')

    blocks.push({
      text: block,
      heading: currentHeading,
      type: classifyBlock(block),
      signals: detectLearningSignals(block),
      chars: block.length,
    })
  }

  return blocks
}

function extractQuestionLikeBlocks(text, limit = 12) {
  return splitIntoBlocks(text)
    .filter((block) => block.type === 'question')
    .map((block, idx) => ({
      id: `qblock-${idx + 1}`,
      heading: block.heading,
      excerpt: block.text.slice(0, 360).replace(/\s+/g, ' ').trim(),
      chars: block.chars,
    }))
    .slice(0, limit)
}

function buildChunk(blocks, index, sourceTitle, overlapText = '') {
  const text = [overlapText, ...blocks.map((block) => block.text)].filter(Boolean).join('\n\n')
  const headings = [...new Set(blocks.map((block) => block.heading).filter(Boolean))]
  const visualCandidates = blocks
    .map((block, blockIndex) => ({ ...block, blockIndex }))
    .filter((block) => ['figure', 'table', 'equation', 'code'].includes(block.type))
    .map((block) => ({
      type: block.type,
      heading: block.heading,
      excerpt: block.text.slice(0, 360),
    }))
  const questionCandidates = blocks
    .map((block, blockIndex) => ({ ...block, blockIndex }))
    .filter((block) => block.type === 'question')
    .map((block) => ({
      heading: block.heading,
      excerpt: block.text.slice(0, 360).replace(/\s+/g, ' '),
    }))

  const learningSignals = {
    concepts: [],
    definitions: [],
    examples: [],
    questions: [],
  }

  for (const block of blocks) {
    const signals = block.signals || {}
    if (signals.concept) {
      learningSignals.concepts.push({
        heading: block.heading,
        excerpt: signals.concept,
      })
    }
    if (signals.definition) {
      learningSignals.definitions.push({
        heading: block.heading,
        excerpt: signals.definition,
      })
    }
    if (signals.example) {
      learningSignals.examples.push({
        heading: block.heading,
        excerpt: signals.example,
      })
    }
    if (signals.question) {
      learningSignals.questions.push({
        heading: block.heading,
        excerpt: signals.question,
      })
    }
  }

  const intentLabels = {
    'question-practice': 'question practice',
    'definition-review': 'definition review',
    'concept-review': 'concept review',
    'example-grounding': 'example grounding',
    'general-study': 'general study',
  }
  const learningIntentFocus = []
  const learningIntentMap = [
    ['question-practice', learningSignals.questions.length],
    ['definition-review', learningSignals.definitions.length],
    ['concept-review', learningSignals.concepts.length],
    ['example-grounding', learningSignals.examples.length],
  ]
  for (const [intent, count] of learningIntentMap) {
    if (count > 0) learningIntentFocus.push(intent)
  }
  if (!learningIntentFocus.length) learningIntentFocus.push('general-study')

  const primaryIntent = learningIntentFocus[0]
  const supportingIntents = learningIntentFocus.slice(1)
  const learningIntent = {
    primary: primaryIntent,
    label: intentLabels[primaryIntent] || primaryIntent,
    focus: learningIntentFocus,
    supporting: supportingIntents,
    counts: {
      concepts: learningSignals.concepts.length,
      definitions: learningSignals.definitions.length,
      examples: learningSignals.examples.length,
      questions: learningSignals.questions.length,
    },
    rationale: `Detected ${learningSignals.concepts.length} concept, ${learningSignals.definitions.length} definition, ${learningSignals.examples.length} example, and ${learningSignals.questions.length} question signals in the chunk.`,
  }

  const metadataLines = [
    `Source title: ${sourceTitle}`,
    `Chunk index: ${index + 1}`,
    `Detected headings: ${headings.join(' | ') || 'General'}`,
    `Learning intent: ${learningIntent.label}${supportingIntents.length ? ` (supporting: ${supportingIntents.map((intent) => intentLabels[intent] || intent).join(', ')})` : ''}`,
  ]

  const appendSignalSection = (title, items) => {
    if (!items.length) return
    metadataLines.push(`${title}:`)
    items.forEach((item, i) => {
      metadataLines.push(`- ${i + 1}. ${item.heading}: ${item.excerpt}`)
    })
  }

  appendSignalSection('Detected concept signals', learningSignals.concepts)
  appendSignalSection('Detected definition signals', learningSignals.definitions)
  appendSignalSection('Detected example signals', learningSignals.examples)

  if (visualCandidates.length) {
    metadataLines.push('Detected visual/technical candidates:')
    visualCandidates.forEach((item, i) => {
      metadataLines.push(`- ${i + 1}. ${item.type} near "${item.heading}": ${item.excerpt.replace(/\s+/g, ' ')}`)
    })
  }

  if (questionCandidates.length) {
    metadataLines.push('Detected question-like blocks:')
    questionCandidates.forEach((item, i) => {
      metadataLines.push(`- ${i + 1}. ${item.heading}: ${item.excerpt}`)
    })
  }

  return {
    index,
    text,
    promptText: `${metadataLines.join('\n')}\n\nSOURCE CHUNK:\n${text}`,
    headings,
    visualCandidates,
    questionCandidates,
    learningSignals,
    learningIntent,
    chars: text.length,
  }
}

function tailSentences(text, maxChars) {
  const sentences = String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean)
  let acc = ''
  for (let i = sentences.length - 1; i >= 0; i--) {
    const next = `${sentences[i]} ${acc}`.trim()
    if (next.length > maxChars) break
    acc = next
  }
  return acc
}

function chunkDocument(text, options = {}) {
  const {
    maxChars = 7200,
    minChars = 1800,
    overlapChars = 700,
    sourceTitle = 'source',
  } = options

  const blocks = splitIntoBlocks(text)
  const chunks = []
  let bucket = []
  let bucketChars = 0
  let overlapText = ''

  for (const block of blocks) {
    const wouldOverflow = bucketChars + block.chars > maxChars
    const hasEnough = bucketChars >= minChars
    const startsNewMajorSection = bucket.length > 0 && isHeading(block.text.split('\n')[0] || '') && hasEnough

    if (bucket.length > 0 && (wouldOverflow || startsNewMajorSection)) {
      const chunk = buildChunk(bucket, chunks.length, sourceTitle, overlapText)
      chunks.push(chunk)
      overlapText = tailSentences(chunk.text, overlapChars)
      bucket = []
      bucketChars = 0
    }

    bucket.push(block)
    bucketChars += block.chars + 2
  }

  if (bucket.length) {
    chunks.push(buildChunk(bucket, chunks.length, sourceTitle, overlapText))
  }

  return chunks.length ? chunks : [buildChunk([{ text: normalizeText(text), heading: 'General', type: 'text', chars: normalizeText(text).length }], 0, sourceTitle)]
}

module.exports = {
  chunkDocument,
  extractQuestionLikeBlocks,
  splitIntoBlocks,
}
