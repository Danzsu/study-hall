import { useState } from "react";
import {
  BookOpen, Brain, BarChart2, Code2,
  ChevronRight, ChevronLeft, Check,
  Flame, Target, Clock, Zap,
  Moon, Sun, Sparkles
} from "lucide-react";

const C = {
  accent: "#E07355", accentHov: "#C85E40",
  accentBg: "rgba(224,115,85,0.10)", accentBg2: "rgba(224,115,85,0.16)",
  blue: "#4A7FC1", blueBg: "rgba(74,127,193,0.11)",
  green: "#5A9E72", greenBg: "rgba(90,158,114,0.11)",
  purple: "#9B6DD9", purpleBg: "rgba(155,109,217,0.11)",
  gold: "#C49A3C", goldBg: "rgba(196,154,60,0.11)",
};
const LIGHT = {
  bg: "#F5F2EE", surface: "#FFFFFF", surface2: "#F0ECE6",
  text: "#1A1A1A", textSub: "#6B6560", textMuted: "#9B9590",
  border: "#E4DDD4", border2: "#D4CCC2",
};
const DARK = {
  bg: "#141414", surface: "#1E1E1E", surface2: "#252525",
  text: "#F0EDE8", textSub: "#9B9590", textMuted: "#6B6560",
  border: "#2E2E2E", border2: "#3A3A3A",
};

// ── DATA ─────────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { id: "ml",    emoji: "🤖", name: "Machine Learning",    desc: "Supervised, unsupervised & deep learning",   color: C.accent,  bg: C.accentBg,  questions: 150 },
  { id: "stats", emoji: "📊", name: "Statistics",           desc: "Probability, distributions & inference",      color: C.blue,    bg: C.blueBg,    questions: 120 },
  { id: "algo",  emoji: "⚙️", name: "Algorithms",           desc: "Data structures & complexity analysis",        color: C.green,   bg: C.greenBg,   questions: 180 },
  { id: "dl",    emoji: "🧠", name: "Deep Learning",        desc: "Neural networks, CNNs, transformers",         color: C.purple,  bg: C.purpleBg,  questions: 95  },
  { id: "mlops", emoji: "🚀", name: "MLOps",                desc: "Deployment, monitoring & pipelines",           color: C.gold,    bg: C.goldBg,    questions: 80  },
  { id: "cv",    emoji: "👁️", name: "Computer Vision",      desc: "Image classification, detection & GANs",      color: C.blue,    bg: C.blueBg,    questions: 110 },
];

const LEVELS = [
  { id: "beginner",     icon: BookOpen,  label: "Beginner",     desc: "New to the subject — start from fundamentals", color: C.green,  bg: C.greenBg  },
  { id: "intermediate", icon: Brain,     label: "Intermediate", desc: "Familiar with basics, want to go deeper",       color: C.blue,   bg: C.blueBg   },
  { id: "advanced",     icon: BarChart2, label: "Advanced",     desc: "Solid knowledge — exam prep & edge cases",      color: C.accent, bg: C.accentBg },
  { id: "expert",       icon: Code2,     label: "Expert",       desc: "Working practitioner — fill specific gaps",     color: C.purple, bg: C.purpleBg },
];

const SEMESTERS = [
  { id: 1, label: "1st semester", desc: "Just getting started", color: C.green,  bg: C.greenBg  },
  { id: 2, label: "2nd semester", desc: "Building foundations",  color: C.green,  bg: C.greenBg  },
  { id: 3, label: "3rd semester", desc: "Core concepts",         color: C.blue,   bg: C.blueBg   },
  { id: 4, label: "4th semester", desc: "Deepening knowledge",   color: C.blue,   bg: C.blueBg   },
  { id: 5, label: "5th semester", desc: "Advanced topics",       color: C.accent, bg: C.accentBg },
  { id: 6, label: "6th semester", desc: "Specialisation",        color: C.accent, bg: C.accentBg },
  { id: 7, label: "7th semester", desc: "Pre-graduation",        color: C.purple, bg: C.purpleBg },
  { id: 8, label: "8th semester", desc: "Final year",            color: C.purple, bg: C.purpleBg },
  { id: 9, label: "Postgraduate", desc: "MSc / PhD level",       color: C.gold,   bg: C.goldBg   },
  { id: 10,label: "Exam prep",    desc: "Certification focus",   color: C.gold,   bg: C.goldBg,  highlight: true },
];

const POMODORO_PRESETS = [
  { id: "classic",   label: "Classic",    focus: 25, brk: 5,  desc: "25 min focus · 5 min break",  recommended: true },
  { id: "deepwork",  label: "Deep work",  focus: 50, brk: 10, desc: "50 min focus · 10 min break" },
  { id: "sprint",    label: "Sprint",     focus: 15, brk: 3,  desc: "15 min focus · 3 min break"  },
];

// ── STEP INDICATOR ────────────────────────────────────────────────────────────
function StepDots({ total, current, t }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 40 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 99,
          width: i === current ? 24 : i < current ? 16 : 12,
          background: i <= current ? C.accent : t.border,
          opacity: i < current ? 0.5 : 1,
          transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      ))}
    </div>
  );
}

// ── STEP 0: WELCOME ───────────────────────────────────────────────────────────
function StepWelcome({ t, onNext }) {
  return (
    <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease both" }}>
      {/* Logo mark */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: C.accentBg2,
        border: `1.5px solid ${C.accent}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 28px",
      }}>
        <BookOpen size={32} style={{ color: C.accent }} />
      </div>

      <h1 style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 34, fontWeight: 700,
        letterSpacing: "-0.6px", marginBottom: 14,
        lineHeight: 1.2,
      }}>
        Welcome to<br />
        <span style={{ color: C.accent }}>Study Hall</span>
      </h1>
      <p style={{
        fontSize: 16, color: t.textSub, lineHeight: 1.65,
        maxWidth: 380, margin: "0 auto 40px",
      }}>
        A focused space to study, quiz yourself, and actually remember what you learn.
      </p>

      {/* Feature list */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        maxWidth: 340, margin: "0 auto 44px",
        textAlign: "left",
      }}>
        {[
          { icon: Brain,   color: C.blue,   text: "Adaptive quizzes that track your weak spots" },
          { icon: Zap,     color: C.accent, text: "Flashcards, written tests & glossary in one place" },
          { icon: Flame,   color: C.gold,   text: "Daily streaks to keep your momentum going" },
          { icon: Sparkles,color: C.purple, text: "AI-evaluated written answers for deeper retention" },
        ].map(({ icon: Icon, color, text }, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px",
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={15} style={{ color }} />
            </div>
            <span style={{ fontSize: 13, color: t.textSub, lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext} style={{
        background: C.accent, color: "#fff", border: "none",
        borderRadius: 12, padding: "15px 40px",
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "'DM Sans', system-ui",
        display: "inline-flex", alignItems: "center", gap: 9,
        transition: "background 0.15s, transform 0.12s cubic-bezier(0.34,1.56,0.64,1)",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = C.accentHov; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = "none"; }}
      >
        Get started <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── STEP 1: SUBJECT SELECTION ─────────────────────────────────────────────────
function StepSubjects({ selected, onToggle, t }) {
  return (
    <div style={{ animation: "slideIn 0.36s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 8,
        }}>
          What are you studying?
        </h2>
        <p style={{ fontSize: 14, color: t.textSub }}>
          Pick one or more subjects to get started.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12, marginBottom: 8,
      }}>
        {SUBJECTS.map(s => {
          const isSelected = selected.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s.id)}
              style={{
                background: isSelected ? s.bg : t.surface,
                border: `1.5px solid ${isSelected ? s.color + "60" : t.border}`,
                borderRadius: 14, padding: "16px 14px",
                cursor: "pointer", textAlign: "left",
                display: "flex", flexDirection: "column", gap: 6,
                position: "relative",
                transition: "all 0.18s ease",
                transform: isSelected ? "scale(1.01)" : "scale(1)",
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = s.color + "50"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = t.border; }}
            >
              {/* Check */}
              {isSelected && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  width: 18, height: 18, borderRadius: "50%",
                  background: s.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={10} color="#fff" strokeWidth={3} />
                </div>
              )}
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div>
                <p style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSelected ? s.color : t.text, marginBottom: 2,
                }}>{s.name}</p>
                <p style={{ fontSize: 11, color: t.textSub, lineHeight: 1.4 }}>{s.desc}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: isSelected ? s.color : t.textMuted,
              }}>{s.questions} questions</span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p style={{
          fontSize: 12, color: t.textMuted, textAlign: "center",
          marginTop: 8, animation: "fadeUp 0.2s ease both",
        }}>
          {selected.length} subject{selected.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}

// ── STEP 2: LEVEL ─────────────────────────────────────────────────────────────
function StepLevel({ level, onSelect, t }) {
  return (
    <div style={{ animation: "slideIn 0.36s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 8,
        }}>
          What's your current level?
        </h2>
        <p style={{ fontSize: 14, color: t.textSub }}>
          We'll adjust question difficulty and pacing to match.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LEVELS.map(l => {
          const isSelected = level === l.id;
          const Icon = l.icon;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              style={{
                background: isSelected ? l.bg : t.surface,
                border: `1.5px solid ${isSelected ? l.color + "60" : t.border}`,
                borderRadius: 14, padding: "16px 18px",
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 14,
                transition: "all 0.18s ease",
                transform: isSelected ? "translateX(4px)" : "translateX(0)",
              }}
              onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = l.color + "45"; e.currentTarget.style.background = t.surface2; } }}
              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; } }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: isSelected ? l.color + "28" : t.surface2,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.18s",
              }}>
                <Icon size={19} style={{ color: isSelected ? l.color : t.textMuted }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: 15, fontWeight: 700,
                  color: isSelected ? l.color : t.text, marginBottom: 3,
                }}>{l.label}</p>
                <p style={{ fontSize: 13, color: t.textSub }}>{l.desc}</p>
              </div>
              {isSelected && (
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: l.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── STEP 3: SEMESTER + POMODORO ──────────────────────────────────────────────
function StepSemester({ semester, pomodoro, pomodoroPreset, onSemester, onPomodoro, onPreset, t }) {
  return (
    <div style={{ animation: "slideIn 0.36s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 8,
        }}>
          Where are you in your studies?
        </h2>
        <p style={{ fontSize: 14, color: t.textSub }}>
          We'll surface the most relevant content for your stage.
        </p>
      </div>

      {/* Semester grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8, marginBottom: 32,
      }}>
        {SEMESTERS.map(s => {
          const isSel = semester === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSemester(s.id)}
              style={{
                background: isSel ? s.bg : t.surface,
                border: `1.5px solid ${isSel ? s.color + "55" : t.border}`,
                borderRadius: 12, padding: "12px 14px",
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
                transition: "all 0.15s ease",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = s.color + "40"; e.currentTarget.style.background = t.surface2; }}}
              onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; }}}
            >
              {/* Highlight badge for Exam prep */}
              {s.highlight && (
                <span style={{
                  position: "absolute", top: -1, right: -1,
                  background: C.gold, color: "#fff",
                  fontSize: 8, fontWeight: 800, letterSpacing: "0.4px",
                  padding: "3px 7px", borderRadius: "0 10px 0 7px",
                }}>POPULAR</span>
              )}
              {/* Semester number indicator */}
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: isSel ? s.color + "28" : t.surface2,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 800,
                  color: isSel ? s.color : t.textMuted,
                }}>
                  {s.id <= 8 ? s.id : s.id === 9 ? "PG" : "✦"}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSel ? s.color : t.text,
                  marginBottom: 1,
                }}>{s.label}</p>
                <p style={{ fontSize: 11, color: t.textSub }}>{s.desc}</p>
              </div>
              {isSel && (
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: s.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={9} color="#fff" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
      }}>
        <div style={{ flex: 1, height: 1, background: t.border }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.5px" }}>
          OPTIONAL
        </span>
        <div style={{ flex: 1, height: 1, background: t.border }} />
      </div>

      {/* Pomodoro toggle */}
      <div style={{
        background: t.surface, border: `1.5px solid ${pomodoro ? C.accent + "55" : t.border}`,
        borderRadius: 14, overflow: "hidden",
        transition: "border-color 0.2s",
      }}>
        {/* Toggle row */}
        <div
          onClick={() => onPomodoro(!pomodoro)}
          style={{
            padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
            cursor: "pointer",
          }}
          onMouseEnter={e => e.currentTarget.style.background = t.surface2}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: pomodoro ? C.accentBg2 : t.surface2,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}>
            <span style={{ fontSize: 20 }}>🍅</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 2 }}>
              Pomodoro timer
            </p>
            <p style={{ fontSize: 12, color: t.textSub }}>
              Timed focus sessions in the study bar
            </p>
          </div>
          {/* Toggle switch */}
          <div style={{
            width: 44, height: 24, borderRadius: 99,
            background: pomodoro ? C.accent : t.border,
            position: "relative", flexShrink: 0,
            transition: "background 0.22s ease",
          }}>
            <div style={{
              position: "absolute",
              top: 3, left: pomodoro ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%",
              background: "#fff",
              transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }} />
          </div>
        </div>

        {/* Preset picker — slides open when enabled */}
        {pomodoro && (
          <div style={{
            borderTop: `1px solid ${t.border}`,
            padding: "14px 18px",
            display: "flex", flexDirection: "column", gap: 8,
            animation: "fadeDown 0.22s ease both",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: t.textMuted, marginBottom: 4 }}>
              CHOOSE A PRESET
            </p>
            {POMODORO_PRESETS.map(p => {
              const isPSel = pomodoroPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onPreset(p.id)}
                  style={{
                    background: isPSel ? C.accentBg2 : t.surface2,
                    border: `1.5px solid ${isPSel ? C.accent + "55" : t.border}`,
                    borderRadius: 10, padding: "11px 14px",
                    cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                >
                  {p.recommended && (
                    <span style={{
                      position: "absolute", top: -1, right: -1,
                      background: C.blue, color: "#fff",
                      fontSize: 8, fontWeight: 800, letterSpacing: "0.4px",
                      padding: "3px 8px", borderRadius: "0 8px 0 7px",
                    }}>RECOMMENDED</span>
                  )}
                  {/* Focus/break pills */}
                  <div style={{ display: "flex", gap: 5 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      color: isPSel ? C.accent : t.textMuted,
                      background: isPSel ? C.accentBg2 : t.surface,
                      border: `1px solid ${isPSel ? C.accent + "40" : t.border}`,
                      borderRadius: 6, padding: "3px 8px",
                      transition: "all 0.15s",
                    }}>{p.focus}′</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      color: isPSel ? C.green : t.textMuted,
                      background: isPSel ? C.greenBg : t.surface,
                      border: `1px solid ${isPSel ? C.green + "40" : t.border}`,
                      borderRadius: 6, padding: "3px 8px",
                      transition: "all 0.15s",
                    }}>{p.brk}′</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isPSel ? C.accent : t.text }}>
                      {p.label}
                    </span>
                    <span style={{ fontSize: 12, color: t.textSub, marginLeft: 8 }}>{p.desc}</span>
                  </div>
                  {isPSel && (
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: C.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Check size={9} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 4: ALL SET ───────────────────────────────────────────────────────────
function StepAllSet({ subjects, level, semester, pomodoro, pomodoroPreset, t, onDone }) {
  const selectedSubjects = SUBJECTS.filter(s => subjects.includes(s.id));
  const selectedLevel    = LEVELS.find(l => l.id === level);
  const selectedSemester = SEMESTERS.find(s => s.id === semester);
  const selectedPreset   = POMODORO_PRESETS.find(p => p.id === pomodoroPreset);

  return (
    <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease both" }}>
      {/* Animated checkmark */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: C.greenBg,
        border: `1.5px solid ${C.green}50`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
        animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both 0.1s",
      }}>
        <Check size={30} style={{ color: C.green }} strokeWidth={2.5} />
      </div>

      <h2 style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 28, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 8,
      }}>
        You're all set!
      </h2>
      <p style={{ fontSize: 15, color: t.textSub, marginBottom: 36, lineHeight: 1.6 }}>
        Your study space is ready. Here's your setup:
      </p>

      {/* Summary cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, textAlign: "left" }}>
        {/* Subjects */}
        <div style={{
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: C.accentBg2,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <BookOpen size={16} style={{ color: C.accent }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: t.textMuted, marginBottom: 3 }}>SUBJECTS</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {selectedSubjects.map(s => (
                <span key={s.id} style={{
                  fontSize: 12, fontWeight: 700,
                  color: s.color, background: s.bg,
                  border: `1px solid ${s.color}35`,
                  borderRadius: 20, padding: "2px 9px",
                }}>
                  {s.emoji} {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Level */}
        {selectedLevel && (() => {
          const Icon = selectedLevel.icon;
          return (
            <div style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 14, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: selectedLevel.bg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={16} style={{ color: selectedLevel.color }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: t.textMuted, marginBottom: 2 }}>LEVEL</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: selectedLevel.color }}>{selectedLevel.label}</p>
              </div>
            </div>
          );
        })()}

        {/* Semester */}
        {selectedSemester && (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: selectedSemester.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: selectedSemester.color }}>
                {semester <= 8 ? semester : semester === 9 ? "PG" : "✦"}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: t.textMuted, marginBottom: 2 }}>SEMESTER</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: selectedSemester.color }}>{selectedSemester.label}</p>
            </div>
          </div>
        )}

        {/* Pomodoro */}
        <div style={{
          background: t.surface, border: `1px solid ${pomodoro ? C.accent + "40" : t.border}`,
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: pomodoro ? C.accentBg2 : t.surface2,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>🍅</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: t.textMuted, marginBottom: 2 }}>
              POMODORO TIMER
            </p>
            {pomodoro && selectedPreset ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{selectedPreset.label}</p>
                <span style={{ fontSize: 12, color: t.textSub }}>· {selectedPreset.desc}</span>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: t.textMuted }}>Not enabled</p>
            )}
          </div>
          {pomodoro && (
            <span style={{
              fontSize: 10, fontWeight: 800, color: C.green,
              background: C.greenBg, border: `1px solid ${C.green}35`,
              borderRadius: 20, padding: "3px 9px",
            }}>ON</span>
          )}
        </div>
      </div>

      <button onClick={onDone} style={{
        background: C.accent, color: "#fff", border: "none",
        borderRadius: 12, padding: "15px 44px",
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "'DM Sans', system-ui",
        display: "inline-flex", alignItems: "center", gap: 9,
        transition: "background 0.15s, transform 0.12s cubic-bezier(0.34,1.56,0.64,1)",
        width: "100%", justifyContent: "center",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = C.accentHov; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = "none"; }}
      >
        Start studying <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [dark, setDark]       = useState(false);
  const [step, setStep]       = useState(0);   // 0=welcome 1=subjects 2=level 3=goal 4=allset
  const [subjects, setSubjects] = useState([]);
  const [level, setLevel]         = useState(null);
  const [semester, setSemester]   = useState(null);
  const [pomodoro, setPomodoro]   = useState(false);
  const [pomodoroPreset, setPomodoroPreset] = useState("classic");
  const [direction, setDirection] = useState("forward");

  const t = dark ? DARK : LIGHT;
  const TOTAL_STEPS = 4; // dots for steps 1-4 (not welcome)

  const canAdvance = () => {
    if (step === 1) return subjects.length > 0;
    if (step === 2) return level !== null;
    if (step === 3) return semester !== null;
    return true;
  };

  const next = () => {
    if (!canAdvance()) return;
    setDirection("forward");
    setStep(s => s + 1);
  };
  const back = () => {
    setDirection("back");
    setStep(s => s - 1);
  };

  const toggleSubject = id => {
    setSubjects(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes slideIn {
          from { opacity:0; transform:translateX(32px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideInBack {
          from { opacity:0; transform:translateX(-32px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.5); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${dark?"#333":"#ddd"}; border-radius:10px; }
      `}</style>

      <div style={{
        fontFamily: "'DM Sans', system-ui",
        background: t.bg, color: t.text,
        minHeight: "100vh",
        transition: "background 0.3s",
        display: "flex", flexDirection: "column",
      }}>

        {/* Top bar */}
        <header style={{
          height: 54,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: step > 0 ? `1px solid ${t.border}` : "none",
          background: step > 0 ? t.surface : "transparent",
          transition: "background 0.3s, border-color 0.3s",
        }}>
          {/* Back button (hidden on step 0 and last step) */}
          <div style={{ width: 80 }}>
            {step > 0 && step < 4 && (
              <button onClick={back} style={{
                background: "none", border: "none", cursor: "pointer",
                color: t.textSub, display: "flex", alignItems: "center", gap: 5,
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', system-ui",
                padding: 4,
                transition: "color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = t.text}
                onMouseLeave={e => e.currentTarget.style.color = t.textSub}
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
          </div>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <BookOpen size={15} style={{ color: C.accent }} />
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.2px" }}>Study Hall</span>
          </div>

          {/* Dark toggle */}
          <div style={{ width: 80, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setDark(d => !d)} style={{
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "5px 10px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              color: t.textSub, fontSize: 12, fontWeight: 600,
            }}>
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: step === 0 || step === 4 ? "center" : "flex-start",
          padding: step === 0 || step === 4 ? "40px 24px" : "40px 24px 100px",
          overflowY: "auto",
        }}>
          <div style={{ width: "100%", maxWidth: step === 1 ? 560 : 480 }}>

            {/* Step dots (shown on steps 1–3) */}
            {step >= 1 && step <= 3 && (
              <StepDots total={TOTAL_STEPS} current={step - 1} t={t} />
            )}

            {/* Steps */}
            {step === 0 && <StepWelcome t={t} onNext={next} />}
            {step === 1 && (
              <StepSubjects selected={subjects} onToggle={toggleSubject} t={t} />
            )}
            {step === 2 && (
              <StepLevel level={level} onSelect={setLevel} t={t} />
            )}
            {step === 3 && (
              <StepSemester
                semester={semester}
                pomodoro={pomodoro}
                pomodoroPreset={pomodoroPreset}
                onSemester={setSemester}
                onPomodoro={setPomodoro}
                onPreset={setPomodoroPreset}
                t={t}
              />
            )}
            {step === 4 && (
              <StepAllSet
                subjects={subjects} level={level}
                semester={semester} pomodoro={pomodoro}
                pomodoroPreset={pomodoroPreset} t={t}
                onDone={() => alert("→ Navigate to Home screen")}
              />
            )}
          </div>
        </div>

        {/* Bottom nav (steps 1–3 only) */}
        {step >= 1 && step <= 3 && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            padding: "16px 24px 28px",
            background: t.bg,
            borderTop: `1px solid ${t.border}`,
          }}>
            <div style={{ maxWidth: 480, margin: "0 auto" }}>
              <button
                onClick={next}
                disabled={!canAdvance()}
                style={{
                  width: "100%", padding: "15px",
                  background: canAdvance() ? C.accent : t.border,
                  color: canAdvance() ? "#fff" : t.textMuted,
                  border: "none", borderRadius: 12,
                  fontSize: 15, fontWeight: 700,
                  cursor: canAdvance() ? "pointer" : "not-allowed",
                  fontFamily: "'DM Sans', system-ui",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  transition: "background 0.2s, color 0.2s, transform 0.12s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onMouseEnter={e => { if (canAdvance()) { e.currentTarget.style.background = C.accentHov; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                onMouseLeave={e => { if (canAdvance()) { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = "none"; } }}
              >
                {step === 3 ? "Finish setup" : "Continue"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
