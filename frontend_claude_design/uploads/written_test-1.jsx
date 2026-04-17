import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Moon, Sun, Sparkles,
  CheckCircle2, XCircle, AlertCircle, ArrowLeft,
  BookOpen, RotateCcw, ImageIcon
} from "lucide-react";

// ── DESIGN TOKENS (same as Study Hall) ───────────────────────────────────────
const C = {
  accent:     "#E07355",
  accentHov:  "#C85E40",
  accentBg:   "rgba(224,115,85,0.10)",
  accentBg2:  "rgba(224,115,85,0.16)",
  blue:       "#4A7FC1",
  blueBg:     "rgba(74,127,193,0.12)",
  green:      "#5A9E72",
  greenBg:    "rgba(90,158,114,0.12)",
  red:        "#C0504A",
  redBg:      "rgba(192,80,74,0.10)",
  gold:       "#C49A3C",
  goldBg:     "rgba(196,154,60,0.12)",
};

const LIGHT = {
  bg:       "#F5F2EE",
  surface:  "#FFFFFF",
  surface2: "#F0ECE6",
  text:     "#1A1A1A",
  textSub:  "#6B6560",
  textMuted:"#9B9590",
  border:   "#E4DDD4",
  border2:  "#D4CCC2",
};
const DARK = {
  bg:       "#141414",
  surface:  "#1E1E1E",
  surface2: "#252525",
  text:     "#F0EDE8",
  textSub:  "#9B9590",
  textMuted:"#6B6560",
  border:   "#2E2E2E",
  border2:  "#3A3A3A",
};

// ── INLINE FIGURES ────────────────────────────────────────────────────────────
// Each figure is a React component; attach via figure: FigureName in QUESTIONS.

function FigureBiasVariance({ t }) {
  // 3-column conceptual diagram: Underfitting | Sweet spot | Overfitting
  const cols = [
    { label: "Underfitting", sub: "High bias · Low variance", color: C.blue,
      shape: "line", note: "Too simple — misses patterns" },
    { label: "Sweet Spot", sub: "Balanced", color: C.green,
      shape: "curve", note: "Generalises well to new data" },
    { label: "Overfitting", sub: "Low bias · High variance", color: C.red,
      shape: "squiggle", note: "Memorises noise" },
  ];
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: "22px 20px", marginBottom: 28,
    }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1px", color: t.textMuted, marginBottom: 16 }}>
        FIGURE · BIAS–VARIANCE SPECTRUM
      </p>
      <div style={{ display: "flex", gap: 0 }}>
        {cols.map((col, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "16px 10px",
            borderRight: i < 2 ? `1px dashed ${t.border}` : "none",
          }}>
            {/* Mini SVG sketch */}
            <svg viewBox="0 0 80 50" style={{ width: 80, height: 50, display: "block", margin: "0 auto 10px" }}>
              {/* dots (data points) */}
              {[[10,40],[20,15],[35,35],[50,10],[65,30],[72,18]].map(([x,y],j)=>(
                <circle key={j} cx={x} cy={y} r={3} fill={t.border2} />
              ))}
              {/* fit line */}
              {col.shape === "line" &&
                <line x1={5} y1={38} x2={75} y2={12} stroke={col.color} strokeWidth={2.5} strokeLinecap="round"/>}
              {col.shape === "curve" && (
                <path d="M5,38 C20,30 35,8 50,18 S70,14 75,12"
                  fill="none" stroke={col.color} strokeWidth={2.5} strokeLinecap="round"/>
              )}
              {col.shape === "squiggle" && (
                <path d="M5,38 C10,10 18,42 25,15 S38,38 48,10 S62,32 75,12"
                  fill="none" stroke={col.color} strokeWidth={2.5} strokeLinecap="round"/>
              )}
            </svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: col.color, marginBottom: 3 }}>{col.label}</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: t.textSub, marginBottom: 6 }}>{col.sub}</p>
            <p style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.4 }}>{col.note}</p>
          </div>
        ))}
      </div>
      {/* Error curve */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, marginBottom: 8 }}>Total Error = Bias² + Variance + Irreducible Noise</p>
        <svg viewBox="0 0 400 70" style={{ width: "100%", display: "block" }}>
          <path d="M10,10 C60,10 100,55 160,58 S240,55 390,62"
            fill="none" stroke={C.red} strokeWidth={2} opacity={0.7}/>
          <path d="M10,62 C80,62 160,50 390,10"
            fill="none" stroke={C.blue} strokeWidth={2} opacity={0.7}/>
          <path d="M10,30 C60,22 120,20 160,20 S240,22 390,18"
            fill="none" stroke={C.accent} strokeWidth={2.5} strokeDasharray="5 3"/>
          <text x={12} y={8} fontSize={9} fill={C.red} fontWeight={700}>Variance</text>
          <text x={12} y={68} fontSize={9} fill={C.blue} fontWeight={700}>Bias²</text>
          <text x={155} y={16} fontSize={9} fill={C.accent} fontWeight={700}>Total</text>
        </svg>
      </div>
    </div>
  );
}

function FigureDataSplit({ t }) {
  const segments = [
    { label: "Training", pct: 70, color: C.accent },
    { label: "Validation", pct: 15, color: C.blue },
    { label: "Test", pct: 15, color: C.green },
  ];
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: "22px 20px", marginBottom: 28,
    }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1px", color: t.textMuted, marginBottom: 14 }}>
        FIGURE · DATA SPLIT
      </p>
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 38, marginBottom: 14 }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            width: `${s.pct}%`, background: s.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff",
            borderRight: i < 2 ? "2px solid rgba(255,255,255,0.25)" : "none",
          }}>{s.pct}%</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.textSub }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FigureKFold({ t }) {
  const k = 5;
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: "22px 20px", marginBottom: 28,
    }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1px", color: t.textMuted, marginBottom: 16 }}>
        FIGURE · 5-FOLD CROSS-VALIDATION
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: k }, (_, fold) => (
          <div key={fold} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, width: 44, flexShrink: 0 }}>
              Fold {fold + 1}
            </span>
            <div style={{ display: "flex", flex: 1, borderRadius: 6, overflow: "hidden", height: 26 }}>
              {Array.from({ length: k }, (_, i) => {
                const isVal = i === fold;
                return (
                  <div key={i} style={{
                    flex: 1,
                    background: isVal ? C.blue : `${C.accent}28`,
                    borderRight: i < k - 1 ? "2px solid rgba(255,255,255,0.3)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800,
                    color: isVal ? "#fff" : C.accent,
                  }}>
                    {isVal ? "VAL" : "TR"}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
        {[{ color: C.accent, bg: `${C.accent}28`, label: "Training" }, { color: "#fff", bg: C.blue, label: "Validation" }].map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: it.bg, border: `1px solid ${it.bg === C.blue ? C.blue : C.accent}` }}/>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.textSub }}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QUESTIONS ─────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    section: "ML Foundations",
    question: "What are the distinguishing features of the bias-variance tradeoff in machine learning?",
    figure: "BiasVariance",
    ideal: "The bias-variance tradeoff describes the tension between a model's ability to fit training data (low bias) and its ability to generalise to new data (low variance). High bias leads to underfitting — the model is too simple and misses patterns. High variance leads to overfitting — the model memorises noise and performs poorly on unseen data. The goal is to find the sweet spot where total error (bias² + variance + irreducible noise) is minimised.",
    keywords: ["bias", "variance", "overfitting", "underfitting", "generalise", "tradeoff", "error"],
  },
  {
    id: 2,
    section: "Data Preparation",
    question: "Explain the purpose of the three-way data split (training, validation, and test sets) and why using only a training/test split can be misleading.",
    figure: "DataSplit",
    ideal: "The training set is used to fit model parameters. The validation set guides model selection and hyperparameter tuning — it acts as a proxy for unseen data during development. The test set provides a final, unbiased estimate of real-world performance and should be evaluated only once. Using only train/test leads to implicit data leakage: every time you adjust the model based on test performance, you're indirectly fitting to it.",
    keywords: ["training", "validation", "test", "hyperparameter", "leakage", "bias", "unbiased"],
  },
  {
    id: 3,
    section: "Model Evaluation",
    question: "When would you use k-fold cross-validation instead of a static train/validation split, and what are the tradeoffs?",
    figure: "KFold",
    ideal: "k-fold cross-validation is preferred when data is scarce, as it uses all data for both training and validation by rotating which fold is held out. It provides a less biased, lower-variance estimate of model performance. The main tradeoff is computational: k models must be trained instead of one. Common choices are k=5 or k=10. For very small datasets, leave-one-out cross-validation (k=n) maximises training data but is expensive.",
    keywords: ["k-fold", "cross-validation", "scarce", "rotate", "computational", "bias", "variance"],
  },
  {
    id: 4,
    section: "ML Foundations",
    question: "Describe the difference between supervised and unsupervised learning. Give one real-world example of each.",
    ideal: "Supervised learning uses labelled data — each input has a known output. The model learns a mapping from inputs to outputs (e.g., email spam detection: input is email text, label is spam/not-spam). Unsupervised learning finds structure in unlabelled data without predefined outputs (e.g., customer segmentation: group customers by purchase behaviour without predetermined categories).",
    keywords: ["supervised", "unsupervised", "labelled", "unlabelled", "classification", "clustering", "example"],
  },
];

const FIGURE_MAP = {
  BiasVariance: FigureBiasVariance,
  DataSplit: FigureDataSplit,
  KFold: FigureKFold,
};

// ── FAKE AI EVALUATOR ─────────────────────────────────────────────────────────
function evaluateAnswer(answer, question) {
  const lower = answer.toLowerCase();
  const hits = question.keywords.filter(k => lower.includes(k));
  const coverage = hits.length / question.keywords.length;
  const wordCount = answer.trim().split(/\s+/).length;

  let score, grade, feedback, explanation;

  if (wordCount < 15) {
    score = 1; grade = "incomplete";
    feedback = "Your answer is too brief to evaluate properly. Try to explain the concept in at least 2–3 sentences.";
    explanation = null;
  } else if (coverage >= 0.65) {
    score = 3; grade = "correct";
    feedback = `Strong answer! You covered ${hits.length} of the key concepts: ${hits.map(k => `"${k}"`).join(", ")}.`;
    explanation = question.ideal;
  } else if (coverage >= 0.35) {
    score = 2; grade = "partial";
    const missed = question.keywords.filter(k => !lower.includes(k)).slice(0, 3);
    feedback = `Partially correct. You touched on ${hits.length} key ideas but missed some important points — consider mentioning: ${missed.map(k => `"${k}"`).join(", ")}.`;
    explanation = question.ideal;
  } else {
    score = 1; grade = "incorrect";
    feedback = "Your answer doesn't cover the key concepts expected. Review the material and try again.";
    explanation = question.ideal;
  }

  return { score, grade, feedback, explanation, hits };
}

// ── SCORE BADGE ───────────────────────────────────────────────────────────────
function ScoreBadge({ grade, t }) {
  const map = {
    correct:    { icon: CheckCircle2, color: C.green,  bg: C.greenBg, label: "Correct" },
    partial:    { icon: AlertCircle,  color: C.gold,   bg: C.goldBg,  label: "Partial" },
    incorrect:  { icon: XCircle,      color: C.red,    bg: C.redBg,   label: "Incorrect" },
    incomplete: { icon: AlertCircle,  color: t.textMuted, bg: t.surface2, label: "Too brief" },
  };
  const s = map[grade];
  const Icon = s.icon;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.bg, borderRadius: 20,
      padding: "5px 12px", fontSize: 13, fontWeight: 700,
      color: s.color,
    }}>
      <Icon size={14} />
      {s.label}
    </div>
  );
}

// ── ANSWER COMPARISON ─────────────────────────────────────────────────────────
function AnswerComparison({ userAnswer, result, question, t }) {
  const borderMap = {
    correct:    C.green,
    partial:    C.gold,
    incorrect:  C.red,
    incomplete: t.border2,
  };
  const borderColor = borderMap[result.grade];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
      {/* User answer */}
      <div style={{
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "0 10px 10px 0",
        padding: "14px 16px",
        background: result.grade === "correct" ? C.greenBg : result.grade === "partial" ? C.goldBg : C.redBg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <ScoreBadge grade={result.grade} t={t} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: t.textMuted }}>YOUR ANSWER</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, fontFamily: "'Lora', Georgia, serif" }}>
          {userAnswer}
        </p>
      </div>

      {/* Ideal answer */}
      {result.explanation && (
        <div style={{
          border: `1px solid ${C.green}`,
          borderLeft: `4px solid ${C.green}`,
          borderRadius: "0 10px 10px 0",
          padding: "14px 16px",
          background: C.greenBg,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: C.green, display: "block", marginBottom: 8 }}>
            ✓ IDEAL ANSWER
          </span>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, fontFamily: "'Lora', Georgia, serif" }}>
            {result.explanation}
          </p>
        </div>
      )}

      {/* AI feedback */}
      <div style={{
        background: t.surface2, border: `1px solid ${t.border}`,
        borderRadius: 10, padding: "14px 16px",
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <Sparkles size={16} style={{ color: C.accent, flexShrink: 0, marginTop: 2 }} />
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.8px", color: C.accent, display: "block", marginBottom: 5 }}>
            AI FEEDBACK
          </span>
          <p style={{ fontSize: 13.5, lineHeight: 1.65, color: t.textSub }}>
            {result.feedback}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function WrittenTest() {
  const [dark, setDark] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});      // { qId: text }
  const [results, setResults] = useState({});      // { qId: result }
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  const t = dark ? DARK : LIGHT;
  const q = QUESTIONS[idx];
  const userAnswer = answers[q.id] || "";
  const result = results[q.id];
  const submitted = !!result;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  }, [userAnswer]);

  const handleSubmit = () => {
    if (!userAnswer.trim() || submitted) return;
    setLoading(true);
    setTimeout(() => {
      const res = evaluateAnswer(userAnswer, q);
      setResults(p => ({ ...p, [q.id]: res }));
      setLoading(false);
    }, 900);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) handleSubmit();
  };

  const goTo = (newIdx) => {
    setIdx(newIdx);
  };

  const scoreCount = Object.values(results);
  const totalScore = scoreCount.reduce((a, r) => a + r.score, 0);
  const maxScore = scoreCount.length * 3;
  const allDone = Object.keys(results).length === QUESTIONS.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .wt-textarea {
          width: 100%;
          background: ${t.bg};
          border: 1.5px solid ${t.border};
          border-radius: 12px;
          padding: 16px 18px;
          font-size: 15px;
          font-family: 'Lora', Georgia, serif;
          color: ${t.text};
          line-height: 1.75;
          resize: none;
          min-height: 140px;
          outline: none;
          transition: border-color 0.15s;
        }
        .wt-textarea:focus { border-color: ${C.accent}; }
        .wt-textarea::placeholder { color: ${t.textMuted}; font-style: italic; }

        .submit-btn {
          background: ${C.accent};
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 28px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'DM Sans', system-ui;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          letter-spacing: 0.2px;
        }
        .submit-btn:hover:not(:disabled) { background: ${C.accentHov}; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .nav-btn {
          background: ${t.surface};
          border: 1px solid ${t.border};
          border-radius: 8px;
          color: ${t.textSub};
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', system-ui;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px;
          transition: border-color 0.15s, color 0.15s;
        }
        .nav-btn:hover:not(:disabled) { border-color: ${C.accent}; color: ${C.accent}; }
        .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .q-dot {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; cursor: pointer;
          transition: all 0.15s; border: 2px solid transparent;
          font-family: 'DM Sans', system-ui;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      <div style={{
        fontFamily: "'DM Sans', system-ui",
        background: t.bg, color: t.text,
        minHeight: "100vh", transition: "background 0.3s, color 0.3s",
      }}>

        {/* ── HEADER ── */}
        <header style={{
          background: t.surface, borderBottom: `1px solid ${t.border}`,
          height: 56, display: "flex", alignItems: "center",
          padding: "0 24px", gap: 16, position: "sticky", top: 0, zIndex: 100,
          transition: "background 0.3s",
        }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub, display: "flex", padding: 4 }}>
            <ArrowLeft size={18} />
          </button>
          <BookOpen size={16} style={{ color: C.accent }} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.2px" }}>Machine Learning</span>
          <span style={{ color: t.border2 }}>›</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              background: C.accentBg2, color: C.accent,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.8px",
              padding: "3px 9px", borderRadius: 20,
            }}>WRITTEN TEST</div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            {/* Question dots */}
            <div style={{ display: "flex", gap: 5 }}>
              {QUESTIONS.map((qq, i) => {
                const r = results[qq.id];
                const isActive = i === idx;
                const bg = r
                  ? r.grade === "correct" ? C.green : r.grade === "partial" ? C.gold : C.red
                  : isActive ? C.accent : t.border;
                return (
                  <div key={qq.id} className="q-dot"
                    onClick={() => goTo(i)}
                    style={{
                      background: bg,
                      color: (r || isActive) ? "#fff" : t.textMuted,
                      borderColor: isActive && !r ? C.accent : "transparent",
                      transform: isActive ? "scale(1.15)" : "scale(1)",
                    }}
                  >{i + 1}</div>
                );
              })}
            </div>
            <button onClick={() => setDark(!dark)} style={{
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "5px 10px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              color: t.textSub, fontSize: 12, fontWeight: 600,
            }}>
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 28px 80px" }}>

          {/* Section badge + counter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }} className="fade-up">
            <span style={{
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "4px 12px",
              fontSize: 11, fontWeight: 700, color: t.textSub,
              letterSpacing: "0.5px",
            }}>{q.section}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted }}>
              {idx + 1} / {QUESTIONS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 4, background: t.border, borderRadius: 99, marginBottom: 32, overflow: "hidden",
          }} className="fade-up">
            <div style={{
              width: `${((idx + (submitted ? 1 : 0)) / QUESTIONS.length) * 100}%`,
              height: "100%", background: C.accent, borderRadius: 99,
              transition: "width 0.4s ease",
            }} />
          </div>

          {/* Question */}
          <h2 key={q.id} style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 22, fontWeight: 700, lineHeight: 1.45,
            letterSpacing: "-0.2px", marginBottom: 28,
          }} className="fade-up">
            {q.question}
          </h2>

          {/* Optional figure */}
          {q.figure && (() => {
            const Fig = FIGURE_MAP[q.figure];
            return Fig ? (
              <div className="fade-up" style={{ animationDelay: "0.08s" }}>
                <Fig t={t} />
              </div>
            ) : null;
          })()}

          {/* Textarea or submitted state */}
          {!submitted ? (
            <div className="fade-up">
              <textarea
                ref={textareaRef}
                className="wt-textarea"
                value={userAnswer}
                onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here… (Ctrl+Enter to submit)"
                rows={5}
                disabled={loading}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <span style={{ fontSize: 12, color: t.textMuted }}>
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  {userAnswer.length > 0 && userAnswer.trim().split(/\s+/).length < 20 &&
                    <span style={{ color: C.gold, marginLeft: 8 }}>· Aim for at least 30 words</span>
                  }
                </span>
                <button
                  className="submit-btn"
                  disabled={!userAnswer.trim() || loading}
                  onClick={handleSubmit}
                >
                  {loading
                    ? <><div className="spinner" /> Evaluating…</>
                    : <><Sparkles size={15} /> Submit</>
                  }
                </button>
              </div>
            </div>
          ) : (
            <div className="fade-up">
              <AnswerComparison
                userAnswer={userAnswer}
                result={result}
                question={q}
                t={t}
              />
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 36, paddingTop: 24, borderTop: `1px solid ${t.border}`,
          }}>
            <button className="nav-btn" disabled={idx === 0} onClick={() => goTo(idx - 1)}>
              <ChevronLeft size={15} /> Previous
            </button>

            {submitted && (
              <button
                className="nav-btn"
                style={{ color: t.textSub, gap: 6 }}
                onClick={() => {
                  setResults(p => { const n = {...p}; delete n[q.id]; return n; });
                  setAnswers(p => ({ ...p, [q.id]: "" }));
                }}
              >
                <RotateCcw size={14} /> Retry
              </button>
            )}

            {idx < QUESTIONS.length - 1 ? (
              <button className="nav-btn" onClick={() => goTo(idx + 1)}
                style={submitted ? { borderColor: C.accent, color: C.accent } : {}}>
                Next <ChevronRight size={15} />
              </button>
            ) : (
              allDone && (
                <div style={{
                  background: C.accentBg2, border: `1px solid ${C.accent}`,
                  borderRadius: 10, padding: "10px 18px",
                  fontSize: 13, fontWeight: 700, color: C.accent,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <CheckCircle2 size={15} />
                  {totalScore}/{maxScore} pts — Test complete!
                </div>
              )
            )}
          </div>

          {/* Score summary (only when all done) */}
          {allDone && (
            <div style={{
              marginTop: 32, background: t.surface,
              border: `1px solid ${t.border}`, borderRadius: 14,
              padding: "24px", display: "flex", gap: 20, flexWrap: "wrap",
            }} className="fade-up">
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1px", color: t.textMuted, marginBottom: 6 }}>
                  FINAL SCORE
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, color: C.accent, letterSpacing: "-1px" }}>
                  {totalScore}<span style={{ fontSize: 16, color: t.textMuted, fontWeight: 600 }}>/{maxScore}</span>
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {[
                  { g: "correct",   c: C.green, label: "Correct" },
                  { g: "partial",   c: C.gold,  label: "Partial" },
                  { g: "incorrect", c: C.red,   label: "Incorrect" },
                ].map(({ g, c, label }) => {
                  const count = scoreCount.filter(r => r.grade === g).length;
                  return (
                    <div key={g} style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: c }}>{count}</p>
                      <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
