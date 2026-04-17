import { useState } from "react";
import {
  ArrowLeft, RotateCcw, BookOpen, Zap, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Moon, Sun, TrendingUp, Target, Clock,
  ChevronRight, AlertTriangle
} from "lucide-react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  accent: "#E07355", accentHov: "#C85E40",
  accentBg: "rgba(224,115,85,0.10)", accentBg2: "rgba(224,115,85,0.16)",
  blue: "#4A7FC1", blueBg: "rgba(74,127,193,0.11)",
  green: "#5A9E72", greenBg: "rgba(90,158,114,0.11)",
  red: "#C0504A", redBg: "rgba(192,80,74,0.10)",
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

// ── MOCK RESULT DATA ──────────────────────────────────────────────────────────
const RESULT = {
  subject: "Machine Learning",
  section: "All Sections",
  mode: "Quiz",
  totalQ: 10,
  timeTaken: 312, // seconds
  questions: [
    {
      id: 1, section: "ML Problem Framing",
      q: "Which best describes the bias-variance tradeoff in ML models?",
      options: [
        "High bias models overfit; high variance models underfit",
        "High bias leads to underfitting; high variance leads to overfitting",
        "Both should be maximised to improve generalisation",
        "They are independent metrics with no interaction",
      ],
      correct: 1, chosen: 1, // correct
    },
    {
      id: 2, section: "ML Problem Framing",
      q: "What is the primary purpose of a validation set during model training?",
      options: [
        "To provide more data for training the model",
        "To evaluate the final deployed model's performance",
        "To tune hyperparameters and detect overfitting during development",
        "To replace the test set when data is scarce",
      ],
      correct: 2, chosen: 2, // correct
    },
    {
      id: 3, section: "Data Preparation",
      q: "Which technique reduces dimensionality by projecting onto axes of maximum variance?",
      options: ["LDA", "t-SNE", "PCA", "UMAP"],
      correct: 2, chosen: 1, // wrong
    },
    {
      id: 4, section: "Data Preparation",
      q: "One-hot encoding is most appropriate when:",
      options: [
        "The categorical variable has a natural ordinal ranking",
        "There are only two categories",
        "The categorical variable has no inherent order",
        "The dataset has fewer than 100 samples",
      ],
      correct: 2, chosen: 2, // correct
    },
    {
      id: 5, section: "Model Evaluation",
      q: "A classifier has high recall but low precision. This means:",
      options: [
        "It misses many true positives but avoids false positives",
        "It captures most positives but also flags many negatives as positive",
        "It is well-calibrated and reliable",
        "It performs well on balanced datasets only",
      ],
      correct: 1, chosen: 3, // wrong
    },
    {
      id: 6, section: "Model Evaluation",
      q: "The AUC-ROC score of 0.5 indicates:",
      options: [
        "A perfect classifier",
        "A classifier performing at chance level",
        "A model that always predicts the minority class",
        "Severe class imbalance in the dataset",
      ],
      correct: 1, chosen: 1, // correct
    },
    {
      id: 7, section: "Model Evaluation",
      q: "Which metric is most useful when the cost of false negatives is very high?",
      options: ["Accuracy", "Precision", "Recall", "F1 Score"],
      correct: 2, chosen: 2, // correct
    },
    {
      id: 8, section: "Supervised Learning",
      q: "In k-fold cross-validation with k=5, how many times is the model trained?",
      options: ["1", "3", "5", "10"],
      correct: 2, chosen: 2, // correct
    },
    {
      id: 9, section: "Supervised Learning",
      q: "Which of the following is NOT a hyperparameter?",
      options: [
        "Learning rate",
        "Number of hidden layers",
        "Model weights after training",
        "Regularisation strength (λ)",
      ],
      correct: 2, chosen: 0, // wrong
    },
    {
      id: 10, section: "Deep Learning",
      q: "What problem do LSTM networks primarily solve compared to vanilla RNNs?",
      options: [
        "Computational efficiency on large datasets",
        "The vanishing gradient problem in long sequences",
        "Overfitting on small datasets",
        "Multi-class classification",
      ],
      correct: 1, chosen: 1, // correct
    },
  ],
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function scoreGrade(pct) {
  if (pct >= 90) return { label: "Excellent", color: C.green, emoji: "🏆" };
  if (pct >= 75) return { label: "Good",      color: C.blue,  emoji: "👍" };
  if (pct >= 60) return { label: "Passing",   color: C.gold,  emoji: "📈" };
  return               { label: "Keep going", color: C.red,   emoji: "💪" };
}

// ── SECTION BREAKDOWN ─────────────────────────────────────────────────────────
function SectionBreakdown({ questions, t }) {
  const sections = {};
  for (const q of questions) {
    if (!sections[q.section]) sections[q.section] = { total: 0, correct: 0 };
    sections[q.section].total++;
    if (q.chosen === q.correct) sections[q.section].correct++;
  }
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.8px", color: t.textMuted }}>
          BY SECTION
        </p>
      </div>
      {Object.entries(sections).map(([sec, { total, correct }], i, arr) => {
        const pct = Math.round((correct / total) * 100);
        const col = pct >= 80 ? C.green : pct >= 60 ? C.gold : C.red;
        return (
          <div key={sec} style={{
            padding: "14px 20px",
            borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : "none",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: t.text }}>{sec}</span>
            <div style={{ width: 90, height: 4, background: t.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%",
                background: col, borderRadius: 99,
                transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
              }}/>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: col, minWidth: 48, textAlign: "right" }}>
              {correct}/{total}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── QUESTION REVIEW ROW ───────────────────────────────────────────────────────
function QuestionRow({ q, idx, t }) {
  const [open, setOpen] = useState(false);
  const isCorrect = q.chosen === q.correct;
  const labels = ["A", "B", "C", "D"];

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${isCorrect ? t.border : C.red + "40"}`,
      borderLeft: `3px solid ${isCorrect ? C.green : C.red}`,
      borderRadius: "0 12px 12px 0",
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "14px 16px",
          display: "flex", alignItems: "flex-start", gap: 12,
          cursor: "pointer",
        }}
        onMouseEnter={e => e.currentTarget.style.background = t.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Icon */}
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          {isCorrect
            ? <CheckCircle2 size={17} style={{ color: C.green }}/>
            : <XCircle size={17} style={{ color: C.red }}/>
          }
        </div>
        {/* Q number + text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: t.textMuted }}>
            Q{idx + 1} · {q.section}
          </span>
          <p style={{
            fontSize: 14, fontWeight: 500, color: t.text,
            lineHeight: 1.5, marginTop: 3,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: open ? "unset" : 1,
            WebkitBoxOrient: "vertical",
          }}>{q.q}</p>
        </div>
        {/* Expand toggle */}
        <div style={{ flexShrink: 0, color: t.textMuted, marginTop: 2 }}>
          {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </div>
      </div>

      {/* Expanded: all answers */}
      {open && (
        <div style={{
          padding: "0 16px 16px 45px",
          display: "flex", flexDirection: "column", gap: 8,
          animation: "fadeDown 0.18s ease",
        }}>
          {q.options.map((opt, oi) => {
            const isChosen  = oi === q.chosen;
            const isCorrectOpt = oi === q.correct;
            const bg = isCorrectOpt
              ? C.greenBg
              : isChosen && !isCorrectOpt
              ? C.redBg
              : "transparent";
            const border = isCorrectOpt
              ? `1px solid ${C.green}50`
              : isChosen && !isCorrectOpt
              ? `1px solid ${C.red}40`
              : `1px solid ${t.border}`;
            return (
              <div key={oi} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 12px", borderRadius: 8,
                background: bg, border,
              }}>
                {/* Letter badge */}
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  background: isCorrectOpt ? C.green : isChosen ? C.red : t.surface2,
                  color: (isCorrectOpt || isChosen) ? "#fff" : t.textMuted,
                }}>
                  {labels[oi]}
                </span>
                <span style={{
                  fontSize: 13, lineHeight: 1.55, color: t.text,
                  fontWeight: isCorrectOpt ? 600 : 400,
                }}>
                  {opt}
                  {isCorrectOpt && !isChosen && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: C.green, fontWeight: 700 }}>
                      ← correct answer
                    </span>
                  )}
                  {isChosen && !isCorrectOpt && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: C.red, fontWeight: 700 }}>
                      ← your answer
                    </span>
                  )}
                  {isChosen && isCorrectOpt && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: C.green, fontWeight: 700 }}>
                      ✓ your answer
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function QuizResults() {
  const [dark, setDark] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const t = dark ? DARK : LIGHT;

  const { questions, subject, section, totalQ, timeTaken } = RESULT;
  const correctCount = questions.filter(q => q.chosen === q.correct).length;
  const wrongCount   = totalQ - correctCount;
  const pct          = Math.round((correctCount / totalQ) * 100);
  const grade        = scoreGrade(pct);
  const avgTime      = Math.round(timeTaken / totalQ);

  const wrongQs   = questions.filter(q => q.chosen !== q.correct);
  const correctQs = questions.filter(q => q.chosen === q.correct);

  // radial arc params
  const R = 52, STROKE = 6;
  const circ = 2 * Math.PI * R;
  const dash  = (pct / 100) * circ;
  const gapColor = dark ? "#2E2E2E" : "#E4DDD4";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes arcGrow  { from{stroke-dasharray:0 ${circ}} to{stroke-dasharray:${dash} ${circ}} }
        .fu { animation: fadeUp 0.38s ease both; }
        .arc { animation: arcGrow 900ms cubic-bezier(0.22,1,0.36,1) both 200ms; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "#333":"#ddd"}; border-radius:10px; }

        .action-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 20px; border-radius: 10px;
          font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', system-ui;
          cursor: pointer; border: none;
          transition: transform 150ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 150ms ease, background 120ms;
        }
        .action-pill:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .action-pill:active { transform: scale(0.97); box-shadow: none; }

        .toggle-btn {
          background: none; border: 1px solid ${dark ? "#2E2E2E":"#E4DDD4"};
          border-radius: 8px; padding: 8px 16px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          color: ${dark ? "#9B9590":"#6B6560"};
          font-family: 'DM Sans', system-ui;
          transition: border-color 0.15s, color 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .toggle-btn:hover { border-color: ${C.accent}; color: ${C.accent}; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background 0.3s" }}>

        {/* ── HEADER ── */}
        <header style={{
          background: t.surface, borderBottom: `1px solid ${t.border}`,
          height: 54, display: "flex", alignItems: "center",
          padding: "0 24px", gap: 12,
          position: "sticky", top: 0, zIndex: 100,
          transition: "background 0.3s",
        }}>
          <button style={{ background:"none", border:"none", cursor:"pointer", color:t.textSub, display:"flex", padding:4 }}>
            <ArrowLeft size={18}/>
          </button>
          <BookOpen size={15} style={{ color: C.accent }}/>
          <span style={{ fontWeight:800, fontSize:14 }}>{subject}</span>
          <span style={{ color:t.border2 }}>›</span>
          <span style={{ fontSize:13, color:t.textSub }}>Quiz</span>
          <span style={{ color:t.border2 }}>›</span>
          <span style={{ fontSize:13, fontWeight:700, color:t.text }}>Results</span>
          <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
            <button onClick={() => setDark(d => !d)} style={{
              background:t.surface2, border:`1px solid ${t.border}`,
              borderRadius:20, padding:"5px 10px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:5,
              color:t.textSub, fontSize:12, fontWeight:600,
            }}>
              {dark ? <Sun size={13}/> : <Moon size={13}/>}
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 28px 80px" }}>

          {/* ── HERO SCORE ── */}
          <div className="fu" style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: "36px 32px",
            display: "flex", alignItems: "center", gap: 36,
            marginBottom: 24, flexWrap: "wrap",
          }}>
            {/* Radial score */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
                {/* Track */}
                <circle cx={65} cy={65} r={R} fill="none"
                  stroke={gapColor} strokeWidth={STROKE}/>
                {/* Arc */}
                <circle className="arc" cx={65} cy={65} r={R} fill="none"
                  stroke={grade.color} strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ}`}/>
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: t.text, lineHeight: 1, letterSpacing: "-1px" }}>
                  {pct}%
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: grade.color, marginTop: 2 }}>
                  {grade.label}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>{grade.emoji}</span>
                <h1 style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px",
                }}>
                  {grade.label} work
                </h1>
              </div>
              <p style={{ fontSize: 14, color: t.textSub, marginBottom: 20, lineHeight: 1.5 }}>
                {section} · {totalQ} questions
              </p>

              {/* Stat pills */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { icon: CheckCircle2, label: "Correct",  val: correctCount, color: C.green,  bg: C.greenBg },
                  { icon: XCircle,      label: "Wrong",    val: wrongCount,   color: C.red,    bg: C.redBg   },
                  { icon: Clock,        label: "Avg / Q",  val: formatTime(avgTime), color: C.blue, bg: C.blueBg },
                  { icon: Target,       label: "Total time", val: formatTime(timeTaken), color: C.gold, bg: C.goldBg },
                ].map(({ icon: Icon, label, val, color, bg }) => (
                  <div key={label} style={{
                    background: bg, borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <Icon size={14} style={{ color }}/>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{val}</p>
                      <p style={{ fontSize: 10, fontWeight: 700, color, marginTop: 2, letterSpacing: "0.3px" }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION BREAKDOWN ── */}
          <div className="fu" style={{ marginBottom: 24, animationDelay: "0.06s" }}>
            <SectionBreakdown questions={questions} t={t}/>
          </div>

          {/* ── ACTION ROW ── */}
          <div className="fu" style={{
            display: "flex", gap: 10, flexWrap: "wrap",
            marginBottom: 36, animationDelay: "0.1s",
          }}>
            {wrongCount > 0 && (
              <button className="action-pill" style={{ background: C.accent, color: "#fff" }}>
                <RotateCcw size={14}/> Retry {wrongCount} wrong answers
              </button>
            )}
            <button className="action-pill" style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text }}>
              <Zap size={14} style={{ color: C.accent }}/> Start Flashcards
            </button>
            <button className="action-pill" style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text }}>
              <BookOpen size={14} style={{ color: C.blue }}/> Review study notes
            </button>
            <button className="action-pill" style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text }}>
              <TrendingUp size={14} style={{ color: C.green }}/> New quiz
            </button>
          </div>

          {/* ── WRONG ANSWERS ── */}
          {wrongQs.length > 0 && (
            <div className="fu" style={{ marginBottom: 28, animationDelay: "0.14s" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={15} style={{ color: C.red }}/>
                  <p style={{ fontSize: 13, fontWeight: 800, color: t.text, letterSpacing: "0.2px" }}>
                    Needs review
                  </p>
                  <span style={{
                    background: C.redBg, color: C.red,
                    fontSize: 11, fontWeight: 800,
                    padding: "2px 8px", borderRadius: 20,
                    border: `1px solid ${C.red}30`,
                  }}>{wrongQs.length}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {wrongQs.map((q, i) => (
                  <QuestionRow key={q.id} q={q} idx={questions.indexOf(q)} t={t}/>
                ))}
              </div>
            </div>
          )}

          {/* ── CORRECT ANSWERS (collapsible) ── */}
          <div className="fu" style={{ animationDelay: "0.18s" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={15} style={{ color: C.green }}/>
                <p style={{ fontSize: 13, fontWeight: 800, color: t.text, letterSpacing: "0.2px" }}>
                  Correct answers
                </p>
                <span style={{
                  background: C.greenBg, color: C.green,
                  fontSize: 11, fontWeight: 800,
                  padding: "2px 8px", borderRadius: 20,
                  border: `1px solid ${C.green}30`,
                }}>{correctQs.length}</span>
              </div>
              <button className="toggle-btn" onClick={() => setShowAll(s => !s)}>
                {showAll ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                {showAll ? "Hide" : "Show all"}
              </button>
            </div>

            {showAll && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {correctQs.map(q => (
                  <QuestionRow key={q.id} q={q} idx={questions.indexOf(q)} t={t}/>
                ))}
              </div>
            )}

            {!showAll && (
              <div style={{
                background: t.surface, border: `1px solid ${t.border}`,
                borderLeft: `3px solid ${C.green}`,
                borderRadius: "0 12px 12px 0",
                padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
              }} onClick={() => setShowAll(true)}>
                <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: t.textSub }}>
                  {correctQs.length} questions answered correctly — click to expand
                </span>
                <ChevronRight size={14} style={{ color: t.textMuted, marginLeft: "auto" }}/>
              </div>
            )}
          </div>

        </main>
      </div>
    </>
  );
}
