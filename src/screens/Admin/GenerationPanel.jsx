'use client'
import { useState, useEffect, useRef } from 'react'

const STEPS = [
  { id: 'extracting',          label: 'Szöveg kinyerés' },
  { id: 'evaluating_images',   label: 'Képek értékelése' },
  { id: 'generating_sections', label: 'Szekciók generálása' },
  { id: 'generating_diagrams', label: 'Diagramok' },
  { id: 'generating_quiz',     label: 'Kérdések generálása' },
  { id: 'generating_extras',   label: 'Flashcard & szójegyzék' },
  { id: 'validating_answers',  label: 'Válaszok validálása' },
  { id: 'done',                label: 'Kész' },
]

const DEPTH_OPTIONS = [
  { value: 'overview',  label: 'Áttekintő' },
  { value: 'exam',      label: 'Vizsga-prep' },
  { value: 'detailed',  label: 'Részletes' },
]

const DIAGRAM_OPTIONS = [
  { value: 'auto',            label: 'Auto (típus szerint)' },
  { value: 'excalidraw_only', label: 'Csak Excalidraw' },
  { value: 'mermaid_only',    label: 'Csak Mermaid' },
  { value: 'off',             label: 'Ki' },
]

export default function GenerationPanel() {
  const [config, setConfig] = useState({
    subjectSlug: '',
    subjectName: '',
    depth: 'exam',
    language: 'auto',
    includeImages: true,
    diagramMode: 'auto',
  })
  const [jobId, setJobId] = useState(null)
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [connLost, setConnLost] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!jobId) return
    const es = new EventSource(`/api/jobs/${jobId}/stream`)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setConnLost(false)
        setJob(data)
        if (data.status === 'done' || data.status === 'failed' || data.error) es.close()
      } catch {}
    }
    // Transient errors: keep the EventSource open so the browser auto-reconnects;
    // just surface the state to the user. Terminal states close in onmessage above.
    es.onerror = () => setConnLost(true)
    return () => es.close()
  }, [jobId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Válassz fájlt!'); return }
    if (!config.subjectSlug.trim()) { setError('Add meg a tantárgy slug-ját!'); return }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('config', JSON.stringify(config))

      const token = globalThis.window ? (sessionStorage.getItem('admin-token') || '') : ''
      const res = await fetch('/api/upload/generate-pipeline', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hiba a feltöltésnél')
      setJobId(data.job_id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const currentStepIdx = job ? STEPS.findIndex(s => s.id === job.current_step) : -1

  if (jobId && job) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>
          Generálás folyamatban
        </h2>

        {/* Step indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {STEPS.map((step, i) => {
            const isDone = i < currentStepIdx || job.status === 'done'
            const isActive = i === currentStepIdx && job.status === 'running'
            const isFailed = job.status === 'failed' && i === currentStepIdx
            return (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                opacity: i > currentStepIdx && job.status !== 'done' ? 0.4 : 1,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: isFailed ? '#ffc9c9'
                    : isDone ? '#b2f2bb'
                    : isActive ? 'var(--accent)'
                    : 'var(--surface)',
                  color: isDone || isFailed ? '#1e1e1e' : isActive ? '#fff' : 'var(--text-muted)',
                  border: '2px solid',
                  borderColor: isFailed ? '#e03131' : isDone ? '#2f9e44' : isActive ? 'var(--accent)' : 'var(--border)',
                }}>
                  {isDone ? '✓' : isFailed ? '✗' : i + 1}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: isActive ? 600 : 400 }}>
                  {step.label}
                  {isActive && job.sections_total > 0 && step.id === 'generating_sections' && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                      {job.sections_done}/{job.sections_total}
                    </span>
                  )}
                  {isActive && <span style={{ marginLeft: 8, color: 'var(--accent)' }}>···</span>}
                </span>
              </div>
            )
          })}
        </div>

        {/* Overall progress bar */}
        <div style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden', height: 10, marginBottom: '1rem' }}>
          <div style={{
            height: '100%', borderRadius: 8,
            background: job.status === 'failed' ? '#e03131' : 'var(--accent)',
            width: `${job.overall_pct ?? 0}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {job.overall_pct ?? 0}%
          {job.status === 'done' && ' — Elkészült!'}
          {job.status === 'failed' && ` — Hiba: ${job.error}`}
        </p>

        {connLost && job.status !== 'done' && job.status !== 'failed' && (
          <div style={{
            background: '#fff3bf', border: '1px solid #f59f00', borderRadius: 8,
            padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.85rem',
          }}>
            ⚠ Kapcsolat megszakadt — újracsatlakozás… (a generálás a háttérben fut tovább)
          </div>
        )}

        {/* Warnings */}
        {job.warnings?.length > 0 && (
          <div style={{
            background: '#fff3bf', border: '1px solid #f59f00', borderRadius: 8,
            padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem',
          }}>
            {job.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}

        {/* Done actions */}
        {job.status === 'done' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => { setJobId(null); setJob(null) }}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              Új generálás
            </button>
            <a
              href={`/#study/${config.subjectSlug}`}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              Megnyitás →
            </a>
          </div>
        )}

        {job.status === 'failed' && (
          <button
            onClick={() => { setJobId(null); setJob(null); setError('') }}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none',
              background: '#ffc9c9', color: '#1e1e1e', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Visszalépés
          </button>
        )}
      </div>
    )
  }

  // Config panel
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>
        Új anyag feltöltése
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* File input */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Forrás fájl (PDF, DOCX, PPTX, TXT, MD, PNG, JPG)
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.pptx,.ppt,.txt,.md,.png,.jpg,.jpeg"
            style={{
              padding: '0.5rem', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: '0.9rem',
            }}
          />
        </label>

        {/* Subject slug */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tantárgy slug</span>
          <input
            type="text"
            placeholder="pl. it_biztonsag"
            value={config.subjectSlug}
            onChange={e => setConfig(c => ({ ...c, subjectSlug: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: '0.9rem',
            }}
          />
        </label>

        {/* Subject name */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tantárgy neve</span>
          <input
            type="text"
            placeholder="pl. IT Biztonság"
            value={config.subjectName}
            onChange={e => setConfig(c => ({ ...c, subjectName: e.target.value }))}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: '0.9rem',
            }}
          />
        </label>

        {/* Depth */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mélység</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {DEPTH_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setConfig(c => ({ ...c, depth: opt.value }))}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: 20,
                  border: '1px solid',
                  borderColor: config.depth === opt.value ? 'var(--accent)' : 'var(--border)',
                  background: config.depth === opt.value ? 'var(--accent)' : 'var(--surface)',
                  color: config.depth === opt.value ? '#fff' : 'var(--text)',
                  fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>

        {/* Diagram mode */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ábragenerálás</span>
          <select
            value={config.diagramMode}
            onChange={e => setConfig(c => ({ ...c, diagramMode: e.target.value }))}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: '0.9rem',
            }}
          >
            {DIAGRAM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        {/* Include images toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.includeImages}
            onChange={e => setConfig(c => ({ ...c, includeImages: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Forrás képek beillesztése</span>
        </label>

        {/* Error */}
        {error && (
          <div style={{
            background: '#ffc9c9', border: '1px solid #e03131', borderRadius: 8,
            padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#c92a2a',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.65rem 1.5rem', borderRadius: 8, border: 'none',
            background: submitting ? 'var(--border)' : 'var(--accent)',
            color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {submitting ? 'Feltöltés...' : 'Generálás indítása →'}
        </button>
      </form>
    </div>
  )
}
