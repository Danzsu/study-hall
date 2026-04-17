'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Brain, BarChart2, Code2,
  ChevronRight, ChevronLeft, Check,
  Flame, Zap, Sparkles,
} from 'lucide-react'
import type { Subject } from '@/lib/content'

interface Props {
  subjects: Subject[]
}

const LEVELS = [
  { id: 'beginner',     icon: BookOpen,  label: 'Kezdő',        desc: 'Alaptól kezdem – alapoktól felfelé',         color: 'var(--green)',  bg: 'var(--green-bg)' },
  { id: 'intermediate', icon: Brain,     label: 'Középhaladó',  desc: 'Ismerem az alapokat, mélyülni szeretnék',     color: 'var(--blue)',   bg: 'var(--blue-bg)'  },
  { id: 'advanced',     icon: BarChart2, label: 'Haladó',       desc: 'Szilárd tudás – vizsgafelkészítés',           color: 'var(--accent)', bg: 'var(--accent-bg)' },
  { id: 'expert',       icon: Code2,     label: 'Szakértő',     desc: 'Aktív szakember – hiányok betömése',          color: 'var(--purple)', bg: 'var(--purple-bg)' },
]

const SEMESTERS = [
  { id: 1,  label: '1. szemeszter',  desc: 'Az elején járok',      color: 'var(--green)',  bg: 'var(--green-bg)'  },
  { id: 2,  label: '2. szemeszter',  desc: 'Alapok építése',        color: 'var(--green)',  bg: 'var(--green-bg)'  },
  { id: 3,  label: '3. szemeszter',  desc: 'Alapfogalmak',          color: 'var(--blue)',   bg: 'var(--blue-bg)'   },
  { id: 4,  label: '4. szemeszter',  desc: 'Mélyülő tudás',         color: 'var(--blue)',   bg: 'var(--blue-bg)'   },
  { id: 5,  label: '5. szemeszter',  desc: 'Haladó témák',          color: 'var(--accent)', bg: 'var(--accent-bg)' },
  { id: 6,  label: '6. szemeszter',  desc: 'Specializáció',         color: 'var(--accent)', bg: 'var(--accent-bg)' },
  { id: 7,  label: '7. szemeszter',  desc: 'Végzős előtt',          color: 'var(--purple)', bg: 'var(--purple-bg)' },
  { id: 8,  label: '8. szemeszter',  desc: 'Végső év',              color: 'var(--purple)', bg: 'var(--purple-bg)' },
  { id: 9,  label: 'Posztgraduális', desc: 'MSc / PhD szint',        color: 'var(--gold)',   bg: 'var(--gold-bg)'   },
  { id: 10, label: 'Vizsgafelkészítés', desc: 'Certifikáció fókusz', color: 'var(--gold)',   bg: 'var(--gold-bg)', highlight: true },
]

const POMODORO_PRESETS = [
  { id: 'classic',  label: 'Classic',    focus: 25, brk: 5,  desc: '25 perc fókusz · 5 perc szünet', recommended: true  },
  { id: 'deepwork', label: 'Deep work',  focus: 50, brk: 10, desc: '50 perc fókusz · 10 perc szünet' },
  { id: 'sprint',   label: 'Sprint',     focus: 15, brk: 3,  desc: '15 perc fókusz · 3 perc szünet'  },
]

const TOTAL_STEPS = 4

function semesterLabel(id: number): string {
  if (id <= 8) return String(id)
  if (id === 9) return 'PG'
  return '✦'
}

function canAdvance(step: number, subjects: string[], level: string | null, semester: number | null): boolean {
  if (step === 1) return subjects.length > 0
  if (step === 2) return level !== null
  if (step === 3) return semester !== null
  return true
}

/* ── Step dots ── */
function StepDots({ total, current }: Readonly<{ total: number; current: number }>) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 40 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 99,
          width: i === current - 1 ? 24 : i < current - 1 ? 16 : 12,
          background: i < current ? 'var(--accent)' : 'var(--border)',
          opacity: i < current - 1 ? 0.5 : 1,
          transition: 'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      ))}
    </div>
  )
}

/* ── Step 0: Welcome ── */
function StepWelcome({ onNext }: Readonly<{ onNext: () => void }>) {
  return (
    <div style={{ textAlign: 'center' }} className="animate-fade-up">
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--accent-bg2)',
        border: '1.5px solid rgba(224,115,85,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 28px',
      }}>
        <BookOpen size={32} style={{ color: 'var(--accent)' }} />
      </div>
      <h1 style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 34, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 14, lineHeight: 1.2,
        color: 'var(--text)',
      }}>
        Üdv a<br /><span style={{ color: 'var(--accent)' }}>Study Hall</span>-ban!
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.65, maxWidth: 380, margin: '0 auto 40px' }}>
        Koncentrált tanulási tér – kvízek, flashkártyák és AI-értékelés egy helyen.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto 44px', textAlign: 'left' }}>
        {[
          { icon: Brain,    color: 'var(--blue)',   text: 'Adaptív kvízek, amelyek nyomon követik a gyenge pontjaidat' },
          { icon: Zap,      color: 'var(--accent)', text: 'Flashkártyák, írásbeli tesztek és szójegyzék egy helyen' },
          { icon: Flame,    color: 'var(--gold)',   text: 'Napi sorozatok a folyamatos lendület megőrzéséhez' },
          { icon: Sparkles, color: 'var(--purple)', text: 'AI-értékelt írásbeli válaszok a mélyebb megértésért' },
        ].map(({ icon: Icon, color, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={15} style={{ color }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>
      <button onClick={onNext} style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        borderRadius: 12, padding: '15px 40px',
        fontSize: 15, fontWeight: 700, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 9,
      }}>
        Kezdjük el <ChevronRight size={16} />
      </button>
    </div>
  )
}

/* ── Step 1: Subject selection ── */
function StepSubjects({ selected, onToggle, subjects }: Readonly<{ selected: string[]; onToggle: (id: string) => void; subjects: Subject[] }>) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 8, color: 'var(--text)' }}>
        Mit tanulsz?
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>Válassz egy vagy több tantárgyat.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        {subjects.map((s) => {
          const isSel = selected.includes(s.slug)
          return (
            <button key={s.slug} onClick={() => onToggle(s.slug)} style={{
              background: isSel ? `${s.color}18` : 'var(--surface)',
              border: `1.5px solid ${isSel ? s.color + '55' : 'var(--border)'}`,
              borderRadius: 14, padding: '16px 14px',
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 6,
              position: 'relative', transition: 'all 0.18s',
            }}>
              {isSel && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 18, height: 18, borderRadius: '50%',
                  background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={10} color="#fff" strokeWidth={3} />
                </div>
              )}
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: isSel ? s.color : 'var(--text)', marginBottom: 2 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-sub)', lineHeight: 1.4 }}>{s.description}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: isSel ? s.color : 'var(--text-muted)' }}>
                {s.questionCount} kérdés
              </span>
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
          {selected.length} tantárgy kiválasztva
        </p>
      )}
    </div>
  )
}

/* ── Step 2: Level ── */
function StepLevel({ level, onSelect }: Readonly<{ level: string | null; onSelect: (id: string) => void }>) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 8, color: 'var(--text)' }}>
        Mi a jelenlegi szinted?
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>Ehhez igazítjuk a kérdések nehézségét.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LEVELS.map((l) => {
          const isSel = level === l.id
          const Icon = l.icon
          return (
            <button key={l.id} onClick={() => onSelect(l.id)} style={{
              background: isSel ? l.bg : 'var(--surface)',
              border: `1.5px solid ${isSel ? l.color + '55' : 'var(--border)'}`,
              borderRadius: 14, padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.18s',
              transform: isSel ? 'translateX(4px)' : 'translateX(0)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: isSel ? `${l.color}28` : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={19} style={{ color: isSel ? l.color : 'var(--text-muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: isSel ? l.color : 'var(--text)', marginBottom: 3 }}>{l.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-sub)' }}>{l.desc}</p>
              </div>
              {isSel && (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: l.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 3: Semester + Pomodoro ── */
function StepSemester({ semester, pomodoro, pomodoroPreset, onSemester, onPomodoro, onPreset }:
  Readonly<{
    semester: number | null; pomodoro: boolean; pomodoroPreset: string;
    onSemester: (id: number) => void; onPomodoro: (v: boolean) => void; onPreset: (id: string) => void
  }>
) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 8, color: 'var(--text)' }}>
        Hol tartasz a tanulmányaidban?
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>A leghasznosabb tartalmat hozzuk előre a számodra.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {SEMESTERS.map((s) => {
          const isSel = semester === s.id
          return (
            <button key={s.id} onClick={() => onSemester(s.id)} style={{
              background: isSel ? s.bg : 'var(--surface)',
              border: `1.5px solid ${isSel ? s.color + '55' : 'var(--border)'}`,
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
              position: 'relative',
            }}>
              {s.highlight && (
                <span style={{
                  position: 'absolute', top: -1, right: -1,
                  background: 'var(--gold)', color: '#fff',
                  fontSize: 8, fontWeight: 800, padding: '3px 7px',
                  borderRadius: '0 10px 0 7px',
                }}>NÉPSZERŰ</span>
              )}
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: isSel ? `${s.color}28` : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: isSel ? s.color : 'var(--text-muted)' }}>
                  {semesterLabel(s.id)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: isSel ? s.color : 'var(--text)', marginBottom: 1 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.desc}</p>
              </div>
              {isSel && (
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={9} color="#fff" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Pomodoro toggle */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0 0 20px' }} />
      <div style={{
        background: 'var(--surface)', border: `1.5px solid ${pomodoro ? 'rgba(224,115,85,0.4)' : 'var(--border)'}`,
        borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
      }}>
        <button onClick={() => onPomodoro(!pomodoro)} style={{
          width: '100%', padding: '16px 18px', background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: pomodoro ? 'var(--accent-bg2)' : 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20 }}>🍅</span>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Pomodoro timer</p>
            <p style={{ fontSize: 12, color: 'var(--text-sub)' }}>Időzített fókusz-sessionök a fejlécben</p>
          </div>
          <div style={{
            width: 44, height: 24, borderRadius: 99,
            background: pomodoro ? 'var(--accent)' : 'var(--border)',
            position: 'relative', flexShrink: 0, transition: 'background 0.22s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: pomodoro ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }} />
          </div>
        </button>
        {pomodoro && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 4 }}>PRESET VÁLASZTÁSA</p>
            {POMODORO_PRESETS.map((p) => {
              const isSel = pomodoroPreset === p.id
              return (
                <button key={p.id} onClick={() => onPreset(p.id)} style={{
                  background: isSel ? 'var(--accent-bg2)' : 'var(--surface2)',
                  border: `1.5px solid ${isSel ? 'rgba(224,115,85,0.4)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '11px 14px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                  position: 'relative',
                }}>
                  {p.recommended && (
                    <span style={{
                      position: 'absolute', top: -1, right: -1,
                      background: 'var(--blue)', color: '#fff',
                      fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: '0 8px 0 7px',
                    }}>AJÁNLOTT</span>
                  )}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '3px 8px',
                      color: isSel ? 'var(--accent)' : 'var(--text-muted)',
                      background: isSel ? 'var(--accent-bg2)' : 'var(--surface)',
                      border: `1px solid ${isSel ? 'rgba(224,115,85,0.3)' : 'var(--border)'}`,
                    }}>{p.focus}′</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '3px 8px',
                      color: isSel ? 'var(--green)' : 'var(--text-muted)',
                      background: isSel ? 'var(--green-bg)' : 'var(--surface)',
                      border: `1px solid ${isSel ? 'rgba(90,158,114,0.3)' : 'var(--border)'}`,
                    }}>{p.brk}′</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isSel ? 'var(--accent)' : 'var(--text)' }}>{p.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)', marginLeft: 8 }}>{p.desc}</span>
                  </div>
                  {isSel && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={9} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Step 4: All set ── */
function StepAllSet({ selectedSlugs, level, semester, pomodoro, pomodoroPreset, subjects, onDone }:
  Readonly<{
    selectedSlugs: string[]; level: string | null; semester: number | null;
    pomodoro: boolean; pomodoroPreset: string; subjects: Subject[]; onDone: () => void
  }>
) {
  const selSubjects = subjects.filter((s) => selectedSlugs.includes(s.slug))
  const selLevel = LEVELS.find((l) => l.id === level)
  const selSemester = SEMESTERS.find((s) => s.id === semester)
  const selPreset = POMODORO_PRESETS.find((p) => p.id === pomodoroPreset)

  return (
    <div style={{ textAlign: 'center' }} className="animate-fade-up">
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--green-bg)', border: '1.5px solid rgba(90,158,114,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
      }}>
        <Check size={30} style={{ color: 'var(--green)' }} strokeWidth={2.5} />
      </div>
      <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 8, color: 'var(--text)' }}>
        Minden kész!
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-sub)', marginBottom: 36, lineHeight: 1.6 }}>
        A tanulási tér elkészült. Íme a beállításaid:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36, textAlign: 'left' }}>
        {/* Subjects */}
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>TANTÁRGYAK</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selSubjects.map((s) => (
                <span key={s.slug} style={{
                  fontSize: 12, fontWeight: 700, color: s.color,
                  background: `${s.color}18`, border: `1px solid ${s.color}35`,
                  borderRadius: 20, padding: '2px 9px',
                }}>
                  {s.icon} {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Level */}
        {selLevel && (
          <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: selLevel.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <selLevel.icon size={16} style={{ color: selLevel.color }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 2 }}>SZINT</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: selLevel.color }}>{selLevel.label}</p>
            </div>
          </div>
        )}

        {/* Semester */}
        {selSemester && (
          <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: selSemester.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: selSemester.color }}>
                {semesterLabel(selSemester.id)}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 2 }}>SZEMESZTER</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: selSemester.color }}>{selSemester.label}</p>
            </div>
          </div>
        )}

        {/* Pomodoro */}
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: pomodoro ? 'var(--accent-bg2)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🍅</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 2 }}>POMODORO TIMER</p>
            {pomodoro && selPreset
              ? <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{selPreset.label} · {selPreset.desc}</p>
              : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nincs engedélyezve</p>
            }
          </div>
          {pomodoro && (
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid rgba(90,158,114,0.3)', borderRadius: 20, padding: '3px 9px' }}>BE</span>
          )}
        </div>
      </div>

      <button onClick={onDone} style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        borderRadius: 12, padding: '15px 44px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 9, width: '100%', justifyContent: 'center',
      }}>
        Tanulás megkezdése <ChevronRight size={16} />
      </button>
    </div>
  )
}

/* ── Main component ── */
export function OnboardingClient({ subjects }: Readonly<Props>) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [level, setLevel] = useState<string | null>(null)
  const [semester, setSemester] = useState<number | null>(null)
  const [pomodoro, setPomodoro] = useState(false)
  const [pomodoroPreset, setPomodoroPreset] = useState('classic')

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const next = () => {
    if (!canAdvance(step, selectedSubjects, level, semester)) return
    setStep((s) => s + 1)
  }

  const back = () => setStep((s) => s - 1)

  const finish = () => {
    localStorage.setItem('onboardingDone', JSON.stringify({
      subjects: selectedSubjects, level, semester, pomodoro, pomodoroPreset,
    }))
    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '48px 24px 80px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--accent-bg)', border: '1.5px solid rgba(224,115,85,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
          }}>📚</div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--text)' }}>Study Hall</span>
        </div>

        {/* Step dots (steps 1-4 only) */}
        {step >= 1 && step <= TOTAL_STEPS && <StepDots total={TOTAL_STEPS} current={step} />}

        {/* Step content */}
        {step === 0 && <StepWelcome onNext={next} />}
        {step === 1 && <StepSubjects selected={selectedSubjects} onToggle={toggleSubject} subjects={subjects} />}
        {step === 2 && <StepLevel level={level} onSelect={setLevel} />}
        {step === 3 && (
          <StepSemester
            semester={semester} pomodoro={pomodoro} pomodoroPreset={pomodoroPreset}
            onSemester={setSemester} onPomodoro={setPomodoro} onPreset={setPomodoroPreset}
          />
        )}
        {step === 4 && (
          <StepAllSet
            selectedSlugs={selectedSubjects} level={level} semester={semester}
            pomodoro={pomodoro} pomodoroPreset={pomodoroPreset}
            subjects={subjects} onDone={finish}
          />
        )}

        {/* Bottom nav (steps 1-3) */}
        {step >= 1 && step <= 3 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32 }}>
            <button onClick={back} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', cursor: 'pointer',
            }}>
              <ChevronLeft size={14} /> Vissza
            </button>
            <button
              onClick={next}
              disabled={!canAdvance(step, selectedSubjects, level, semester)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 8,
                background: canAdvance(step, selectedSubjects, level, semester) ? 'var(--accent)' : 'var(--surface2)',
                color: canAdvance(step, selectedSubjects, level, semester) ? '#fff' : 'var(--text-muted)',
                border: 'none', fontSize: 13, fontWeight: 700,
                cursor: canAdvance(step, selectedSubjects, level, semester) ? 'pointer' : 'not-allowed',
                transition: 'all .15s',
              }}
            >
              Tovább <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
