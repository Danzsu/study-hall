const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')
const { extractPdfText } = require('./pdf-text')

const CONTENT_ROOT = path.join(__dirname, '..', 'content')

function normalizeExtractedText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}

function slugifySourceName(value) {
  return String(value || 'source')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'source'
}

function listParagraphBlocks(text) {
  return normalizeExtractedText(text)
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
}

function uniqueByKey(values, keyFn) {
  const seen = new Set()
  const output = []
  for (const value of values) {
    const key = keyFn(value)
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

function compactExcerpt(value, limit = 420) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit)
}

function stableSignalId(prefix, index) {
  return `${prefix}-${String(index + 1).padStart(2, '0')}`
}

function classifyAssessmentKind(text, sourceKind = '') {
  const value = String(text || '').toLowerCase()
  const source = String(sourceKind || '').toLowerCase()
  if (/zh|exam|vizsga|midterm|final|dolgozat/.test(value) || /test/.test(source)) return 'exam'
  if (/control questions?|kontroll\s*k[eé]rd[eé]s|ellen[oő]rz[oő]\s*k[eé]rd[eé]s/.test(value)) return 'control'
  if (/quiz|teszt|practice test|gyakorl[oó]\s*teszt/.test(value)) return 'quiz'
  if (/active recall|self[- ]?check|[oö]nellen[oő]rz/.test(value)) return 'self-check'
  return source.includes('test') ? 'exam' : 'question-candidate'
}

function isRoutableAssessmentBlock(block) {
  if (!block) return false
  if (['exam', 'control', 'quiz', 'self-check'].includes(block.kind)) return true
  return Number(block.confidence || 0) >= 0.65
}

function looksLikeQuestionLine(line) {
  const value = String(line || '').trim()
  if (!value || value.length < 8) return false
  if (/\?$/.test(value)) return true
  if (/^(q|k[eé]rd[eé]s|question|feladat)\s*\d*[:.)-]/i.test(value)) return true
  if (/^\d+[.)]\s+.+\?$/.test(value)) return true
  if (/^(what|why|how|when|which|who|define|explain|compare|describe)\b/i.test(value)) return true
  if (/^(mi|milyen|hogyan|mi[eé]rt|mikor|melyik|ki|defini[aá]ld|magyar[aá]zd|hasonl[ií]tsd|[ií]rd le)\b/i.test(value)) return true
  return false
}

function detectAssessmentBlocks(text, options = {}) {
  const blocks = listParagraphBlocks(text)
  const candidates = []
  let currentHeading = ''

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
    const firstLine = lines[0] || ''
    const hasAssessmentCue = /control questions?|kontroll\s*k[eé]rd[eé]s|ellen[oő]rz[oő]\s*k[eé]rd[eé]s|active recall|quiz|teszt|vizsga|zh|feladat/i.test(block)
    const questionLines = lines.filter(looksLikeQuestionLine)
    const previousContext = blocks[Math.max(0, i - 1)] || ''

    if (firstLine.length <= 120 && /^(#+\s+)?([A-ZÁÉÍÓÖŐÚÜŰ0-9][\p{L}\d\s:._-]+)$/u.test(firstLine)) {
      currentHeading = firstLine.replace(/^#+\s+/, '')
    }

    if (!hasAssessmentCue && !questionLines.length) continue

    const kind = classifyAssessmentKind(`${currentHeading}\n${block}`, options.sourceKind)
    const confidence = Math.min(0.95, 0.45 + (hasAssessmentCue ? 0.25 : 0) + Math.min(questionLines.length, 3) * 0.1)
    const candidate = {
      id: `assessment-${String(candidates.length + 1).padStart(2, '0')}`,
      kind,
      confidence: Number(confidence.toFixed(2)),
      heading: currentHeading || 'Assessment',
      questionCount: Math.max(questionLines.length, hasAssessmentCue ? 1 : 0),
      excerpt: block.slice(0, 900),
      questions: questionLines.slice(0, 12),
      context: [previousContext, block].filter(Boolean).join('\n\n').slice(0, 1600),
    }
    candidate.target = isRoutableAssessmentBlock(candidate) ? 'questions' : 'notes-review'
    candidate.routeReason = candidate.target === 'questions'
      ? 'strong assessment cue or confidence threshold met'
      : 'weak question-like cue preserved for review, not automatic quiz routing'
    candidates.push(candidate)
  }

  return candidates
}

function detectVisualReferences(text) {
  const blocks = listParagraphBlocks(text)
  const references = []

  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
    const excerpt = block.replace(/\s+/g, ' ').slice(0, 500)
    const hasFigureCue = /\b(fig\.?|figure|diagram|schema|architecture|flow|slide|abra|ábra|kep|kép|image|screenshot)\b/i.test(block)
    const hasTableCue = /\b(table|tablazat|táblázat)\b/i.test(block) || lines.some(line => (line.match(/\s{2,}|\t/g) || []).length >= 2)
    const hasEquationCue = /[$=∑√≤≥≈≠→←↔]|\\frac|\\sum|\\int|\bO\([^)]+\)/.test(block)

    if (!hasFigureCue && !hasTableCue && !hasEquationCue) continue

    references.push({
      id: `visual-${String(references.length + 1).padStart(2, '0')}`,
      type: hasFigureCue ? 'figure' : hasTableCue ? 'table' : 'equation',
      status: 'referenced',
      excerpt,
    })
  }

  return references
}

function extractCandidateTerms(text, limit = 24) {
  const source = normalizeExtractedText(text)
  const headings = source
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length >= 4 && line.length <= 90)
    .filter(line => /^#{1,4}\s+/.test(line) || /^\d+(\.\d+){0,3}\s+/.test(line) || (line === line.toUpperCase() && /[A-Z]/.test(line)))
    .map(line => line.replace(/^#{1,4}\s+/, '').replace(/^\d+(\.\d+){0,3}\s+/, '').trim())

  const boldTerms = [...source.matchAll(/\*\*(.+?)\*\*/g)].map(match => match[1])
  const acronyms = source.match(/\b[A-Z0-9]{2,}\b/g) || []
  const phrases = source.match(/\b[A-Z][A-Za-z0-9-]+(?:\s+[A-Z]?[A-Za-z0-9-]+){0,2}/g) || []
  const stop = new Set(['The', 'And', 'For', 'With', 'This', 'That', 'Source', 'Slide', 'Page'])

  return uniqueByKey([...headings, ...boldTerms, ...acronyms, ...phrases]
    .map(term => String(term || '').replace(/\s+/g, ' ').trim())
    .filter(term => term.length > 2 && term.length <= 70 && !stop.has(term)), term => term.toLowerCase())
    .slice(0, limit)
}

function detectLearningSignals(text) {
  const blocks = listParagraphBlocks(text)
  const definitions = []
  const examples = []
  const formulas = []
  const procedures = []
  const pitfalls = []

  for (const block of blocks) {
    const excerpt = compactExcerpt(block)
    const lower = block.toLowerCase()
    const hasDefinitionCue = /\b(is|are|means|refers to|defined as|definition|fogalom|definicio|definial)\b/i.test(block)
    const hasExampleCue = /\b(example|for example|e\.g\.|pelda|peldakent)\b/i.test(block)
    const hasFormulaCue = /[$=]|\\frac|\\sum|\\int|\bO\([^)]+\)|\bformula\b|\bkeplet\b/i.test(block)
    const hasProcedureCue = /\b(step|steps|algorithm|workflow|procedure|process|lepes|algoritmus|folyamat)\b/i.test(block)
    const hasPitfallCue = /\b(common mistake|pitfall|trap|avoid|warning|mistake|hiba|csapda|figyelj)\b/i.test(block)

    if (hasDefinitionCue) definitions.push({ excerpt })
    if (hasExampleCue) examples.push({ excerpt })
    if (hasFormulaCue) formulas.push({ excerpt })
    if (hasProcedureCue) procedures.push({ excerpt })
    if (hasPitfallCue) pitfalls.push({ excerpt })

    if (!hasPitfallCue && /\bnot\b.+\b(because|unless|only)\b/i.test(lower)) {
      pitfalls.push({ excerpt, inferred: true })
    }
  }

  const concepts = extractCandidateTerms(text, 24).map((label, index) => ({
    id: stableSignalId('concept', index),
    label,
    confidence: 0.55,
  }))

  const withIds = (prefix, items, limit = 12) => uniqueByKey(items, item => item.excerpt.toLowerCase())
    .slice(0, limit)
    .map((item, index) => ({ id: stableSignalId(prefix, index), ...item }))

  return {
    concepts,
    definitions: withIds('definition', definitions),
    examples: withIds('example', examples),
    formulas: withIds('formula', formulas),
    procedures: withIds('procedure', procedures),
    pitfalls: withIds('pitfall', pitfalls),
    density: {
      concepts: concepts.length,
      definitions: definitions.length,
      examples: examples.length,
      formulas: formulas.length,
      procedures: procedures.length,
      pitfalls: pitfalls.length,
    },
  }
}

function extensionFromContentType(contentType) {
  const value = String(contentType || '').toLowerCase()
  if (value.includes('png')) return 'png'
  if (value.includes('jpeg') || value.includes('jpg')) return 'jpg'
  if (value.includes('gif')) return 'gif'
  if (value.includes('svg')) return 'svg'
  if (value.includes('webp')) return 'webp'
  return 'bin'
}

async function extractDocxImages(filePath, assetDir) {
  const images = []

  await mammoth.convertToHtml({ path: filePath }, {
    convertImage: mammoth.images.imgElement(async (image) => {
      const buffer = await image.read()
      const ext = extensionFromContentType(image.contentType)
      const fileName = `image-${String(images.length + 1).padStart(2, '0')}.${ext}`
      fs.mkdirSync(assetDir, { recursive: true })
      fs.writeFileSync(path.join(assetDir, fileName), buffer)
      images.push({
        id: `image-${String(images.length + 1).padStart(2, '0')}`,
        type: 'image',
        status: 'extracted',
        file: fileName,
        contentType: image.contentType || 'application/octet-stream',
        bytes: buffer.length,
      })
      return { src: fileName }
    }),
  })

  return images
}

function assetRootFor(subjectSlug, sourcePath, contentRoot = CONTENT_ROOT) {
  const sourceSlug = slugifySourceName(path.basename(sourcePath, path.extname(sourcePath)))
  return path.join(contentRoot, subjectSlug, 'sources', 'assets', sourceSlug)
}

async function readSourceDocument(filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase()
  const sourceKind = options.sourceKind || 'source'
  const subjectSlug = options.subjectSlug || 'unknown'
  const contentRoot = options.contentRoot || CONTENT_ROOT
  const assetDir = assetRootFor(subjectSlug, filePath, contentRoot)
  let text = ''
  let extractedAssets = []

  if (ext === '.pdf') {
    text = await extractPdfText(filePath)
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    text = result.value || ''
    extractedAssets = await extractDocxImages(filePath, assetDir)
  } else if (ext === '.md' || ext === '.mdx' || ext === '.txt') {
    text = fs.readFileSync(filePath, 'utf-8')
  } else {
    throw new Error(`Unsupported source extension: ${ext || '(none)'}`)
  }

  const normalizedText = normalizeExtractedText(text)
  const assessmentBlocks = detectAssessmentBlocks(normalizedText, { sourceKind })
  const routedAssessmentBlocks = assessmentBlocks.filter(isRoutableAssessmentBlock)
  const visualReferences = detectVisualReferences(normalizedText)
  const learningSignals = detectLearningSignals(normalizedText)
  const manifestPath = writeSourceAssetManifest({
    subjectSlug,
    sourcePath: filePath,
    sourceKind,
    text: normalizedText,
    assessmentBlocks,
    visualReferences,
    extractedAssets,
    learningSignals,
    contentRoot,
  })

  return {
    text: normalizedText,
    sourceKind,
    sourceFile: path.basename(filePath),
    assetDir,
    manifestPath,
    assessmentBlocks,
    visualReferences,
    extractedAssets,
    learningSignals,
    extraction: {
      chars: normalizedText.length,
      assessmentBlocks: assessmentBlocks.length,
      routedAssessmentBlocks: routedAssessmentBlocks.length,
      visualReferences: visualReferences.length,
      extractedAssets: extractedAssets.length,
      concepts: learningSignals.concepts.length,
      definitions: learningSignals.definitions.length,
      examples: learningSignals.examples.length,
      formulas: learningSignals.formulas.length,
      procedures: learningSignals.procedures.length,
      pitfalls: learningSignals.pitfalls.length,
    },
  }
}

function writeSourceAssetManifest({ subjectSlug, sourcePath, sourceKind, text, assessmentBlocks, visualReferences, extractedAssets, learningSignals, contentRoot = CONTENT_ROOT }) {
  const assetDir = assetRootFor(subjectSlug, sourcePath, contentRoot)
  fs.mkdirSync(assetDir, { recursive: true })
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    subjectSlug,
    sourceKind,
    sourceFile: path.basename(sourcePath),
    sourceExt: path.extname(sourcePath).toLowerCase(),
    textChars: String(text || '').length,
    assessmentBlocks,
    visualReferences,
    extractedAssets,
    learningSignals: learningSignals || detectLearningSignals(text),
    note: extractedAssets.length
      ? 'Embedded assets were extracted when the source format exposed them.'
      : 'No embedded raster assets were extracted. Visual references are preserved for manual or future OCR/image extraction.',
  }
  const manifestPath = path.join(assetDir, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
  return manifestPath
}

function buildAssessmentSourceText(sourceDocument) {
  const blocks = (sourceDocument.assessmentBlocks || []).filter(isRoutableAssessmentBlock)
  if (!blocks.length) return ''

  const header = [
    `SOURCE ROUTING: assessment blocks detected in ${sourceDocument.sourceFile}.`,
    'Treat this as test/quiz material. Preserve explicit source questions where possible, then generate answerable MCQ/multi/written items.',
    'Assessment blocks:',
  ]

  const body = blocks.map(block => [
    `## ${block.heading} (${block.kind}, confidence ${block.confidence})`,
    block.context || block.excerpt,
  ].join('\n')).join('\n\n')

  return `${header.join('\n')}\n\n${body}`.trim()
}

module.exports = {
  buildAssessmentSourceText,
  classifyAssessmentKind,
  detectAssessmentBlocks,
  detectLearningSignals,
  detectVisualReferences,
  isRoutableAssessmentBlock,
  normalizeExtractedText,
  readSourceDocument,
  slugifySourceName,
  writeSourceAssetManifest,
}
