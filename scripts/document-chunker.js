function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
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

function classifyBlock(text) {
  const lines = text.split('\n')
  const compact = text.toLowerCase()
  const hasFigureCue = /\b(fig\.?|figure|diagram|schema|architecture|flow|slide|abra|ábra|diagram|kep|kép)\b/i.test(text)
  const hasTableCue = /\b(table|tablazat|táblázat)\b/i.test(text) || lines.some(line => (line.match(/\s{2,}|\t/g) || []).length >= 2)
  const hasEquationCue = /[$=∑√≤≥≈≠→←↔]|\\frac|\\sum|\\int|\bO\([^)]+\)/.test(text)
  const hasCodeCue = /```|function\s+\w+|class\s+\w+|SELECT\s+.+FROM|<\w+[\s>]/i.test(text)

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
    .map(block => block.trim())
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
      chars: block.length,
    })
  }

  return blocks
}

function buildChunk(blocks, index, sourceTitle, overlapText = '') {
  const text = [overlapText, ...blocks.map(block => block.text)].filter(Boolean).join('\n\n')
  const headings = [...new Set(blocks.map(block => block.heading).filter(Boolean))]
  const visualCandidates = blocks
    .map((block, blockIndex) => ({ ...block, blockIndex }))
    .filter(block => ['figure', 'table', 'equation', 'code'].includes(block.type))
    .map(block => ({
      type: block.type,
      heading: block.heading,
      excerpt: block.text.slice(0, 360),
    }))

  const metadataLines = [
    `Source title: ${sourceTitle}`,
    `Chunk index: ${index + 1}`,
    `Detected headings: ${headings.join(' | ') || 'General'}`,
  ]

  if (visualCandidates.length) {
    metadataLines.push('Detected visual/technical candidates:')
    visualCandidates.forEach((item, i) => {
      metadataLines.push(`- ${i + 1}. ${item.type} near "${item.heading}": ${item.excerpt.replace(/\s+/g, ' ')}`)
    })
  }

  return {
    index,
    text,
    promptText: `${metadataLines.join('\n')}\n\nSOURCE CHUNK:\n${text}`,
    headings,
    visualCandidates,
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
  splitIntoBlocks,
}
