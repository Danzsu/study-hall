'use client'
import { useState, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { FONT_SANS, FONT_MONO } from '../theme'

const T = {
  bg: '#F5F2EE',
  surface: '#fff',
  surface2: '#F0ECE6',
  text: '#1A1A1A',
  textSub: '#6B6560',
  textMuted: '#9B9590',
  border: '#E4DDD4',
  border2: '#D4CCC2',
  accent: '#E07355',
  accentBg: 'rgba(224,115,85,0.10)',
  green: '#5A9E72',
  greenBg: 'rgba(90,158,114,0.11)',
  red: '#C0504A',
  redBg: 'rgba(192,80,74,0.10)',
  blue: '#4A7FC1',
  blueBg: 'rgba(74,127,193,0.11)',
}

const card = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  padding: 28,
}

const PHASES = ['idle', 'extracting', 'extracted', 'generating', 'awaiting_images', 'generating_images', 'preview', 'saving', 'done']

function buildPrefixedCandidates(rawCandidates, chunkIndex) {
  return (rawCandidates || []).map((c, j) => ({
    ...c,
    placeholder: `IMAGE_NEEDED_${chunkIndex}_${j}_${c.placeholder || c.concept.replaceAll(/\s+/g, '_')}`,
  }))
}

function patchMdxPlaceholders(mdx, rawCandidates, prefixed) {
  let result = mdx
  prefixed.forEach((c, j) => {
    const bare = rawCandidates[j].placeholder || rawCandidates[j].concept.replaceAll(/\s+/g, '_')
    result = result.replaceAll(bare, c.placeholder)
  })
  return result
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  )
}

function ProgressBar({ value = 0, total = 0 }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ background: T.surface2, borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 6 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: T.accent, borderRadius: 99, transition: 'width 0.4s ease' }} />
    </div>
  )
}
ProgressBar.propTypes = {
  value: PropTypes.number,
  total: PropTypes.number,
}

export default function Upload() {
  const [phase, setPhase] = useState('idle')
  const [file, setFile] = useState(null)
  const [subjectName, setSubjectName] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [extractInfo, setExtractInfo] = useState(null)
  const [chunks, setChunks] = useState([])
  const [lessons, setLessons] = useState([])
  const [currentChunk, setCurrentChunk] = useState(0)
  const [currentSectionTitle, setCurrentSectionTitle] = useState('')
  const [allImageCandidates, setAllImageCandidates] = useState([])
  const [imageResults, setImageResults] = useState({})
  const [imageGenerating, setImageGenerating] = useState({})
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  const getToken = () =>
    globalThis.window ? (sessionStorage.getItem('admin-token') || '') : ''

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  })

  const getSlug = (name) =>
    name.toLowerCase().replaceAll(/\s+/g, '_').replaceAll(/[^a-z0-9_]/g, '').slice(0, 40) || 'subject'

  const formatBytes = (n) => {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / (1024 * 1024)).toFixed(1)} MB`
  }

  const phaseAfter = (p) => PHASES.indexOf(phase) > PHASES.indexOf(p)
  const phaseIs = (p) => phase === p
  const phaseAtLeast = (p) => PHASES.indexOf(phase) >= PHASES.indexOf(p)

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  // ── Step 1: Extract ────────────────────────────────────────────────────────

  async function handleExtract() {
    if (!file || !subjectName.trim()) return
    setError(null)
    setPhase('extracting')

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/extract', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setChunks(data.chunks)
      setExtractInfo({ totalChars: data.totalChars, fileName: data.fileName, fileType: data.fileType })
      setPhase('extracted')
    } catch (e) {
      setError(e.message || 'Kinyerési hiba.')
      setPhase('idle')
    }
  }

  // ── Step 2: Generate notes ─────────────────────────────────────────────────

  async function fetchChunkNotes(i, slug, previousContext) {
    const res = await fetch('/api/upload/generate-notes', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        textChunk: chunks[i].text,
        chunkIndex: i,
        totalChunks: chunks.length,
        subjectName,
        slug,
        difficulty,
        ...(previousContext ? { previousContext } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.json()
  }

  async function handleGenerate() {
    setError(null)
    setPhase('generating')
    setCurrentChunk(0)
    setLessons([])
    setAllImageCandidates([])

    const slug = getSlug(subjectName)
    const collectedLessons = []
    const collectedCandidates = []
    let previousContext = null

    for (let i = 0; i < chunks.length; i++) {
      setCurrentChunk(i)
      setCurrentSectionTitle('')
      try {
        const data = await fetchChunkNotes(i, slug, previousContext)
        setCurrentSectionTitle(data.sectionTitle || '')

        const prefixed = buildPrefixedCandidates(data.imageCandidates, i)
        const mdx = patchMdxPlaceholders(data.mdxContent || '', data.imageCandidates || [], prefixed)

        const lesson = {
          slug: `lesson-${i + 1}`,
          title: data.sectionTitle || `${i + 1}. fejezet`,
          section: data.sectionTitle || `Fejezet ${i + 1}`,
          mdxContent: mdx,
          time: Math.max(3, Math.round(chunks[i].charCount / 800)),
          done: true,
        }

        collectedLessons.push(lesson)
        collectedCandidates.push(...prefixed)
        setLessons([...collectedLessons])
        setAllImageCandidates([...collectedCandidates])
        previousContext = data.sectionTitle || null
      } catch (e) {
        setError(`Hiba a(z) ${i + 1}. szekciónál: ${e.message}`)
        setPhase('extracted')
        return
      }
    }

    setCurrentChunk(chunks.length)
    setPhase(collectedCandidates.length > 0 ? 'awaiting_images' : 'preview')
  }

  // ── Step 2b: Image generation ──────────────────────────────────────────────

  async function handleGenerateImage(candidate) {
    const { placeholder, concept, imagePrompt } = candidate
    setImageGenerating(prev => ({ ...prev, [placeholder]: true }))
    setImageResults(prev => ({ ...prev, [placeholder]: 'pending' }))

    try {
      const res = await fetch('/api/upload/generate-image', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ prompt: imagePrompt, slug: getSlug(subjectName), conceptName: concept }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const { imagePath } = await res.json()
      setImageResults(prev => ({ ...prev, [placeholder]: imagePath }))

      // Substitute placeholder in the relevant lesson's mdxContent
      setLessons(prev => prev.map(l => ({
        ...l,
        mdxContent: l.mdxContent.replaceAll(placeholder, `![${concept}](${imagePath})`),
      })))
    } catch (e) {
      setImageResults(prev => ({ ...prev, [placeholder]: 'error' }))
      setError(`Képgenerálási hiba (${concept}): ${e.message}`)
    } finally {
      setImageGenerating(prev => ({ ...prev, [placeholder]: false }))
    }
  }

  function handleSkipImage(candidate) {
    const { placeholder } = candidate
    setImageResults(prev => ({ ...prev, [placeholder]: 'skipped' }))
    setLessons(prev => prev.map(l => ({
      ...l,
      mdxContent: l.mdxContent.replaceAll(placeholder, ''),
    })))
  }

  const allCandidatesHandled = allImageCandidates.length > 0 &&
    allImageCandidates.every(c => {
      const r = imageResults[c.placeholder]
      return r && r !== 'pending'
    })

  function handleProceedToPreview() {
    // Strip any remaining unhandled placeholders
    setLessons(prev => prev.map(l => ({
      ...l,
      mdxContent: l.mdxContent.replaceAll(/IMAGE_NEEDED_\S+/g, ''),
    })))
    setPhase('preview')
  }

  // ── Step 3: Save ───────────────────────────────────────────────────────────

  async function handleSave() {
    setError(null)
    setPhase('saving')

    const slug = getSlug(subjectName)
    const cleanLessons = lessons.map(l => ({
      ...l,
      mdxContent: l.mdxContent.replaceAll(/IMAGE_NEEDED_\S+/g, ''),
    }))

    try {
      const res = await fetch('/api/upload/save-notes', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          slug,
          name: subjectName,
          lessons: cleanLessons,
          mode: 'overwrite',
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      await res.json()
      setPhase('done')
    } catch (e) {
      setError(`Mentési hiba: ${e.message}`)
      setPhase('preview')
    }
  }

  // ── Combined MDX preview ────────────────────────────────────────────────────

  const combinedMdx = lessons.map(l => l.mdxContent).join('\n\n---\n\n')
  const previewText = combinedMdx.slice(0, 1000) + (combinedMdx.length > 1000 ? '\n…' : '')
  const totalChars = lessons.reduce((s, l) => s + l.mdxContent.length, 0)
  const imageCount = Object.values(imageResults).filter(v => v && v !== 'skipped' && v !== 'error' && v !== 'pending').length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .upload-drop-zone:hover { border-color: ${T.accent} !important; background: ${T.accentBg} !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: FONT_SANS }}>

        {/* ── STEP 1: DOKUMENTUM ──────────────────────────────────────────── */}
        <section style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>1</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: '-0.01em' }}>Dokumentum</span>
            {phaseAfter('extracted') && (
              <span style={{ marginLeft: 'auto', fontSize: 13, color: T.green, fontWeight: 600 }}>
                Kész
              </span>
            )}
          </div>

          {/* Drop zone */}
          <button
            type="button"
            className="upload-drop-zone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              display: 'block', width: '100%',
              border: `2px dashed ${dragOver ? T.accent : T.border2}`,
              borderRadius: 10,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? T.accentBg : T.surface2,
              transition: 'border-color 0.18s, background 0.18s',
              marginBottom: 20,
              fontFamily: FONT_SANS,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: 'none' }}
              onChange={e => e.target.files[0] && setFile(e.target.files[0])}
            />
            {file ? (
              <div>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                <div style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{file.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{formatBytes(file.size)}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                <div style={{ color: T.textSub, fontSize: 14, fontWeight: 500 }}>Húzd ide a fájlt, vagy kattints a tallózáshoz</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>PDF vagy DOCX</div>
              </div>
            )}
          </button>

          {/* Subject name */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="subject-name" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tantárgy neve
            </label>
            <input
              id="subject-name"
              type="text"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              placeholder="pl. IT Biztonság"
              disabled={phaseAtLeast('extracting')}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.65rem 0.9rem', borderRadius: 8,
                border: `1px solid ${T.border}`, fontSize: '0.95rem',
                color: T.text, background: phaseAtLeast('extracting') ? T.surface2 : '#fff',
                outline: 'none', fontFamily: FONT_SANS,
              }}
            />
          </div>

          {/* Difficulty */}
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 20px' }}>
            <legend style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nehézségi szint
            </legend>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'easy', label: 'Könnyű' },
                { value: 'medium', label: 'Közepes' },
                { value: 'hard', label: 'Nehéz' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => !phaseAtLeast('extracting') && setDifficulty(opt.value)}
                  disabled={phaseAtLeast('extracting')}
                  style={{
                    padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1.5px solid ${difficulty === opt.value ? T.accent : T.border}`,
                    background: difficulty === opt.value ? T.accentBg : T.surface2,
                    color: difficulty === opt.value ? T.accent : T.textSub,
                    cursor: phaseAtLeast('extracting') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Extract button / status */}
          {phaseIs('idle') && (
            <button
              onClick={handleExtract}
              disabled={!file || !subjectName.trim()}
              style={{
                padding: '0.7rem 1.4rem', borderRadius: 9, fontWeight: 700, fontSize: 14,
                background: (!file || !subjectName.trim()) ? T.surface2 : T.accent,
                color: (!file || !subjectName.trim()) ? T.textMuted : '#fff',
                border: 'none', cursor: (!file || !subjectName.trim()) ? 'not-allowed' : 'pointer',
                fontFamily: FONT_SANS, transition: 'background 0.15s',
              }}
            >
              Szöveg kinyerése
            </button>
          )}

          {phaseIs('extracting') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.textSub, fontSize: 14 }}>
              <Spinner />
              Kinyerés folyamatban...
            </div>
          )}

          {phaseAtLeast('extracted') && extractInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.greenBg, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: T.green, fontWeight: 500 }}>
              <span style={{ fontSize: 16 }}>✓</span>
              {extractInfo.totalChars.toLocaleString()} karakter kinyerve, {chunks.length} szekció azonosítva
            </div>
          )}
        </section>

        {/* ── STEP 2: GENERÁLÁS ────────────────────────────────────────────── */}
        {phaseAtLeast('extracted') && (
          <section style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.blue }}>2</div>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: '-0.01em' }}>Generálás</span>
              {phaseAtLeast('preview') && (
                <span style={{ marginLeft: 'auto', fontSize: 13, color: T.green, fontWeight: 600 }}>Kész</span>
              )}
            </div>

            {/* Start button */}
            {phaseIs('extracted') && (
              <button
                onClick={handleGenerate}
                style={{
                  padding: '0.7rem 1.4rem', borderRadius: 9, fontWeight: 700, fontSize: 14,
                  background: T.blue, color: '#fff', border: 'none', cursor: 'pointer',
                  fontFamily: FONT_SANS,
                }}
              >
                Generálás indítása
              </button>
            )}

            {/* Progress */}
            {(phaseIs('generating') || phaseAtLeast('awaiting_images')) && chunks.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSub, marginBottom: 4 }}>
                  <span>{Math.min(currentChunk + (phaseIs('generating') ? 0 : lessons.length), chunks.length)}/{chunks.length} szekció</span>
                  <span>{phaseIs('generating') ? 'Folyamatban...' : 'Kész'}</span>
                </div>
                <ProgressBar value={phaseIs('generating') ? currentChunk : chunks.length} total={chunks.length} />
                {phaseIs('generating') && currentSectionTitle && (
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                    Feldolgozás: {currentSectionTitle}
                  </div>
                )}
              </div>
            )}

            {/* Completed sections log */}
            {lessons.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: allImageCandidates.length > 0 ? 24 : 0 }}>
                {lessons.map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: T.surface2, fontSize: 13 }}>
                    <span style={{ color: T.green, fontWeight: 700, fontSize: 15 }}>✓</span>
                    <span style={{ color: T.text, fontWeight: 500, flex: 1 }}>{l.title}</span>
                    <span style={{ color: T.green, fontSize: 12, fontWeight: 600 }}>Kész</span>
                  </div>
                ))}
              </div>
            )}

            {/* Image candidates */}
            {phaseIs('generating') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.textSub, fontSize: 14, marginTop: lessons.length > 0 ? 16 : 0 }}>
                <Spinner />
                {currentChunk + 1}. szekció feldolgozása...
              </div>
            )}

            {phaseAtLeast('awaiting_images') && allImageCandidates.length > 0 && !phaseAtLeast('preview') && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>
                  Azonosított képszükségletek:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {allImageCandidates.map((c) => {
                    const result = imageResults[c.placeholder]
                    const isGenerating = imageGenerating[c.placeholder]
                    const isDone = result && result !== 'pending' && result !== 'error'
                    const isSkipped = result === 'skipped'
                    const isError = result === 'error'
                    return (
                      <div key={c.placeholder} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 14px', borderRadius: 9,
                        background: isSkipped ? T.surface2 : isDone ? T.greenBg : T.surface2,
                        border: `1px solid ${isSkipped ? T.border : isDone ? T.green + '44' : T.border}`,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 2 }}>{c.concept}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(c.imagePrompt || '').slice(0, 90)}{(c.imagePrompt || '').length > 90 ? '…' : ''}
                          </div>
                          {isError && (
                            <div style={{ fontSize: 11, color: T.red, marginTop: 3 }}>Hiba a generálás során.</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {isDone && !isSkipped && (
                            <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>✓ Kész</span>
                          )}
                          {isSkipped && (
                            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>Kihagyva</span>
                          )}
                          {!isDone && !isSkipped && (
                            <>
                              <button
                                onClick={() => handleGenerateImage(c)}
                                disabled={isGenerating}
                                style={{
                                  padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                  background: T.accentBg, color: T.accent,
                                  border: `1px solid ${T.accent}44`, cursor: isGenerating ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 5,
                                }}
                              >
                                {isGenerating ? <Spinner /> : '🖼'}
                                {isGenerating ? 'Generálás...' : 'Generálás'}
                              </button>
                              <button
                                onClick={() => handleSkipImage(c)}
                                disabled={isGenerating}
                                style={{
                                  padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                  background: T.surface2, color: T.textSub,
                                  border: `1px solid ${T.border}`, cursor: isGenerating ? 'not-allowed' : 'pointer',
                                }}
                              >
                                Kihagyás
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={handleProceedToPreview}
                  disabled={!allCandidatesHandled}
                  style={{
                    padding: '0.65rem 1.3rem', borderRadius: 9, fontWeight: 700, fontSize: 14,
                    background: allCandidatesHandled ? T.accent : T.surface2,
                    color: allCandidatesHandled ? '#fff' : T.textMuted,
                    border: 'none', cursor: allCandidatesHandled ? 'pointer' : 'not-allowed',
                    fontFamily: FONT_SANS, transition: 'background 0.15s',
                  }}
                >
                  Tovább az előnézethez
                </button>
              </div>
            )}

            {/* No image candidates — auto-advance message */}
            {phaseAtLeast('awaiting_images') && allImageCandidates.length === 0 && !phaseAtLeast('preview') && (
              <div style={{ fontSize: 13, color: T.textSub }}>Nincs képszükséglet. Automatikus továbblépés...</div>
            )}
          </section>
        )}

        {/* ── STEP 3: ELŐNÉZET + MENTÉS ────────────────────────────────────── */}
        {phaseAtLeast('preview') && (
          <section style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.green }}>3</div>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: '-0.01em' }}>Előnézet és mentés</span>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Lecke', value: lessons.length },
                { label: 'Karakter', value: totalChars.toLocaleString() },
                { label: 'Kép', value: imageCount },
              ].map(s => (
                <div key={s.label} style={{ background: T.surface2, borderRadius: 9, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: T.text }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* MDX preview */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.textSub, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MDX előnézet</div>
              <pre style={{
                background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9,
                padding: '14px 16px', fontFamily: FONT_MONO, fontSize: 11.5,
                color: T.textSub, maxHeight: 300, overflow: 'auto',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
              }}>
                {previewText}
              </pre>
            </div>

            {/* Done state */}
            {phaseIs('done') ? (
              <div>
                <div style={{ background: T.greenBg, border: `1px solid ${T.green}44`, borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: T.green, fontSize: 14, marginBottom: 4 }}>Elmentve!</div>
                  <div style={{ fontSize: 13, color: T.textSub }}>A jegyzetek megjelennek a Study Hall-ban.</div>
                </div>
                <a
                  href={`#subject/${getSlug(subjectName)}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '0.65rem 1.2rem', borderRadius: 9,
                    background: T.accentBg, color: T.accent,
                    fontWeight: 700, fontSize: 14, textDecoration: 'none',
                    border: `1px solid ${T.accent}44`,
                  }}
                >
                  Tanulmányozás megkezdése →
                </a>
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={phaseIs('saving')}
                style={{
                  padding: '0.7rem 1.5rem', borderRadius: 9, fontWeight: 700, fontSize: 14,
                  background: phaseIs('saving') ? T.surface2 : T.accent,
                  color: phaseIs('saving') ? T.textMuted : '#fff',
                  border: 'none', cursor: phaseIs('saving') ? 'not-allowed' : 'pointer',
                  fontFamily: FONT_SANS, display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
              >
                {phaseIs('saving') && <Spinner />}
                {phaseIs('saving') ? 'Mentés folyamatban...' : 'Mentés és közzététel'}
              </button>
            )}
          </section>
        )}

        {/* ── Error box ───────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: T.redBg, border: `1px solid ${T.red}44`, borderRadius: 10,
            padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: T.red, fontSize: 13, marginBottom: 4 }}>Hiba</div>
              <div style={{ fontSize: 13, color: T.textSub }}>{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </>
  )
}
