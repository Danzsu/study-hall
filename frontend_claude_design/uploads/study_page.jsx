import { useState } from "react";
import {
  CheckCircle2, Circle, ChevronRight, ChevronLeft, ChevronDown,
  BookOpen, Brain, Zap, Target, BarChart2, GitBranch, Layers,
  ArrowRight, Sun, Moon, Menu, X, AlertCircle, Lightbulb,
  TrendingUp, Database, Shuffle, CheckSquare
} from "lucide-react";

// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  accent:      "#E07355",
  accentHover: "#C85E40",
  accentBg:    "rgba(224,115,85,0.10)",
  accentBg2:   "rgba(224,115,85,0.18)",
  blue:        "#4A7FC1",
  blueBg:      "rgba(74,127,193,0.13)",
  gold:        "#C49A3C",
  goldBg:      "rgba(196,154,60,0.13)",
  green:       "#5A9E72",
  greenBg:     "rgba(90,158,114,0.13)",
};

const LIGHT = {
  bg:        "#F5F2EE",
  surface:   "#FFFFFF",
  surface2:  "#F0ECE6",
  text:      "#1A1A1A",
  textSub:   "#6B6560",
  textMuted: "#9B9590",
  border:    "#E4DDD4",
  border2:   "#D4CCC2",
  sidebar:   "#FAFAF8",
  sidebarBorder: "#E4DDD4",
};

const DARK = {
  bg:        "#141414",
  surface:   "#1E1E1E",
  surface2:  "#252525",
  text:      "#F0EDE8",
  textSub:   "#9B9590",
  textMuted: "#6B6560",
  border:    "#2E2E2E",
  border2:   "#3A3A3A",
  sidebar:   "#191919",
  sidebarBorder: "#2A2A2A",
};

// ── CURRICULUM DATA ──────────────────────────────────────────────────────────
const curriculum = [
  {
    section: "Foundations",
    lessons: [
      { id: 1, title: "What is Machine Learning?", done: true, time: "8 min" },
      { id: 2, title: "The ML Workflow", done: true, time: "10 min" },
      { id: 3, title: "Training, Validation & Test Sets", done: false, active: true, time: "12 min" },
      { id: 4, title: "Bias vs. Variance Tradeoff", done: false, time: "15 min" },
    ]
  },
  {
    section: "Supervised Learning",
    lessons: [
      { id: 5, title: "Linear Regression", done: false, time: "14 min" },
      { id: 6, title: "Logistic Regression", done: false, time: "12 min" },
      { id: 7, title: "Decision Trees", done: false, time: "18 min" },
    ]
  },
  {
    section: "Model Evaluation",
    lessons: [
      { id: 8, title: "Confusion Matrix & Metrics", done: false, time: "11 min" },
      { id: 9, title: "Cross-Validation", done: false, time: "9 min" },
    ]
  }
];

// ── HIGHLIGHT COMPONENT ──────────────────────────────────────────────────────
function H({ children, color = "accent" }) {
  const map = {
    accent: { bg: C.accentBg2, border: C.accent },
    blue:   { bg: C.blueBg,    border: C.blue   },
    gold:   { bg: C.goldBg,    border: C.gold   },
    green:  { bg: C.greenBg,   border: C.green  },
  };
  const s = map[color];
  return (
    <mark style={{
      background: s.bg,
      borderBottom: `2px solid ${s.border}`,
      color: "inherit",
      padding: "1px 3px",
      borderRadius: "3px 3px 0 0",
      fontWeight: 600,
    }}>{children}</mark>
  );
}

// ── CALLOUT BOX ──────────────────────────────────────────────────────────────
function Callout({ icon: Icon, label, color, children, t }) {
  const colorMap = {
    accent: { border: C.accent, bg: C.accentBg, ic: C.accent, labelC: C.accent },
    blue:   { border: C.blue,   bg: C.blueBg,   ic: C.blue,   labelC: C.blue   },
    gold:   { border: C.gold,   bg: C.goldBg,   ic: C.gold,   labelC: C.gold   },
    green:  { border: C.green,  bg: C.greenBg,  ic: C.green,  labelC: C.green  },
  };
  const s = colorMap[color || "blue"];
  return (
    <div style={{
      border: `1px solid ${s.border}`,
      borderLeft: `4px solid ${s.border}`,
      background: s.bg,
      borderRadius: "0 10px 10px 0",
      padding: "16px 18px",
      margin: "28px 0",
      display: "flex", gap: 14,
    }}>
      <Icon size={18} style={{ color: s.ic, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.8px", color: s.labelC, marginBottom: 5 }}>{label}</p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text }}>{children}</p>
      </div>
    </div>
  );
}

// ── VISUAL: DATA SPLIT DIAGRAM ────────────────────────────────────────────────
function DataSplitDiagram({ t }) {
  const segments = [
    { label: "Training Set", pct: 60, color: C.accent, desc: "Model learns patterns" },
    { label: "Validation Set", pct: 20, color: C.blue, desc: "Tune hyperparameters" },
    { label: "Test Set", pct: 20, color: C.green, desc: "Final evaluation" },
  ];
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 14,
      padding: "28px 24px",
      margin: "32px 0",
    }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1px", color: t.textMuted, marginBottom: 20 }}>
        VISUAL · DATA SPLIT
      </p>
      {/* Bar */}
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 44, marginBottom: 20 }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            width: `${s.pct}%`, background: s.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
            borderRight: i < 2 ? "2px solid rgba(255,255,255,0.3)" : "none",
          }}>{s.pct}%</div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, marginTop: 3, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{s.label}</p>
              <p style={{ fontSize: 12, color: t.textSub }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VISUAL: OVERFITTING CHART ─────────────────────────────────────────────────
function OverfitChart({ t }) {
  // Simple SVG chart
  const w = 320, h = 140;
  const trainPts = [[0,100],[40,75],[80,55],[120,38],[160,26],[200,18],[240,14],[280,12]];
  const valPts   = [[0,100],[40,78],[80,62],[120,54],[160,54],[200,58],[240,68],[280,84]];
  const toPath = pts => pts.map((p,i) => `${i===0?"M":"L"}${p[0]+20},${h-p[1]*0.9}`).join(" ");
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: "28px 24px", margin: "32px 0",
    }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1px", color: t.textMuted, marginBottom: 6 }}>
        VISUAL · OVERFITTING
      </p>
      <p style={{ fontSize: 13, color: t.textSub, marginBottom: 20 }}>
        Training error keeps dropping. Validation error bottoms out, then rises — that's overfitting.
      </p>
      <svg viewBox={`0 0 ${w+40} ${h+20}`} style={{ width: "100%", maxWidth: 380, display: "block" }}>
        {/* Grid lines */}
        {[0,1,2,3].map(i => (
          <line key={i} x1={20} y1={h - i*35} x2={w+20} y2={h - i*35}
            stroke={t.border} strokeWidth={1} />
        ))}
        {/* Paths */}
        <path d={toPath(trainPts)} fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(valPts)} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
        {/* Labels */}
        <text x={w+24} y={h - trainPts[trainPts.length-1][1]*0.9 + 4} fontSize={11} fill={C.accent} fontWeight={700}>Train</text>
        <text x={w+24} y={h - valPts[valPts.length-1][1]*0.9 + 4} fontSize={11} fill={C.blue} fontWeight={700}>Val</text>
        {/* Axes labels */}
        <text x={20} y={h+16} fontSize={10} fill={t.textMuted}>Complexity →</text>
        <text x={4} y={16} fontSize={10} fill={t.textMuted} transform={`rotate(-90,10,${h/2})`}>Loss</text>
      </svg>
      <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 3, background: C.accent, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: t.textSub }}>Training loss</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 3, background: C.blue, borderRadius: 2, borderTop: "2px dashed", backgroundImage: `repeating-linear-gradient(to right, ${C.blue} 0, ${C.blue} 6px, transparent 6px, transparent 9px)`, backgroundSize: "9px 3px" }} />
          <span style={{ fontSize: 12, color: t.textSub }}>Validation loss</span>
        </div>
      </div>
    </div>
  );
}

// ── CONCEPT PILLS ─────────────────────────────────────────────────────────────
function ConceptGrid({ t }) {
  const items = [
    { icon: Database,   label: "Training Set",    desc: "60–80% of data",        color: "accent" },
    { icon: Target,     label: "Validation Set",  desc: "Tune & compare models",  color: "blue"   },
    { icon: CheckSquare,label: "Test Set",         desc: "One-shot final eval",    color: "green"  },
    { icon: Shuffle,    label: "k-Fold CV",        desc: "Rotate folds, avg score",color: "gold"   },
  ];
  const colorMap = {
    accent: { bg: C.accentBg2, ic: C.accent },
    blue:   { bg: C.blueBg,    ic: C.blue   },
    green:  { bg: C.greenBg,   ic: C.green  },
    gold:   { bg: C.goldBg,    ic: C.gold   },
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "28px 0" }}>
      {items.map((it, i) => {
        const s = colorMap[it.color];
        const Icon = it.icon;
        return (
          <div key={i} style={{
            background: s.bg, borderRadius: 12,
            padding: "16px", display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <Icon size={18} style={{ color: s.ic, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 2 }}>{it.label}</p>
              <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.4 }}>{it.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function StudyPage() {
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({ 0: true, 1: true, 2: true });

  const t = dark ? DARK : LIGHT;
  const totalLessons = curriculum.reduce((a, s) => a + s.lessons.length, 0);
  const doneLessons  = curriculum.reduce((a, s) => a + s.lessons.filter(l => l.done).length, 0);
  const progress     = doneLessons / totalLessons;

  const toggleSection = i => setExpandedSections(p => ({ ...p, [i]: !p[i] }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border2}; border-radius: 10px; }

        .sidebar-link { transition: background 0.15s, color 0.15s; }
        .sidebar-link:hover { background: ${t.surface2} !important; }
        .lesson-active { background: ${C.accentBg2} !important; }
        
        .dive-btn {
          background: ${C.accent};
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 11px 22px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'DM Sans', system-ui;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.2px;
        }
        .dive-btn:hover { background: ${C.accentHover}; transform: translateY(-1px); }

        .nav-btn {
          background: ${t.surface};
          border: 1px solid ${t.border};
          border-radius: 8px;
          color: ${t.text};
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', system-ui;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: border-color 0.15s;
        }
        .nav-btn:hover { border-color: ${C.accent}; color: ${C.accent}; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .article-body { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', system-ui", background: t.bg, color: t.text, minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background 0.3s, color 0.3s" }}>
        
        {/* ── TOP NAV ─────────────────────────────────────────────────────── */}
        <header style={{
          background: t.surface, borderBottom: `1px solid ${t.border}`,
          height: 56, display: "flex", alignItems: "center",
          padding: "0 20px", gap: 16, position: "sticky", top: 0, zIndex: 200,
          transition: "background 0.3s",
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: t.textSub, padding: 4, display: "flex",
          }}>
            <Menu size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={18} style={{ color: C.accent }} />
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>
              📚 Study Hall
            </span>
          </div>
          <span style={{ color: t.border2, fontSize: 16 }}>›</span>
          <span style={{ fontSize: 13, color: t.textSub, fontWeight: 500 }}>Machine Learning</span>
          <span style={{ color: t.border2, fontSize: 16 }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Training, Validation & Test Sets</span>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {/* Progress pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "5px 12px",
            }}>
              <div style={{ width: 60, height: 5, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${progress*100}%`, height: "100%", background: C.accent, borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.textSub }}>
                {doneLessons}/{totalLessons}
              </span>
            </div>
            <button onClick={() => setDark(!dark)} style={{
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "6px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: t.textSub, fontSize: 12, fontWeight: 600,
            }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </header>

        <div style={{ display: "flex", flex: 1 }}>

          {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
          {sidebarOpen && (
            <aside style={{
              width: 268, background: t.sidebar,
              borderRight: `1px solid ${t.sidebarBorder}`,
              padding: "20px 0", overflowY: "auto",
              position: "sticky", top: 56, height: "calc(100vh - 56px)",
              flexShrink: 0, transition: "background 0.3s",
            }}>
              {/* Course title */}
              <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${t.border}` }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1px", color: t.textMuted, marginBottom: 6 }}>
                  COURSE
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>Machine Learning</p>
                <p style={{ fontSize: 12, color: t.textSub, marginTop: 4 }}>Foundations to deployment</p>
              </div>

              {/* Lessons */}
              <nav style={{ padding: "12px 0" }}>
                {curriculum.map((sec, si) => (
                  <div key={si}>
                    <button
                      onClick={() => toggleSection(si)}
                      style={{
                        width: "100%", background: "none", border: "none",
                        padding: "8px 20px", display: "flex", alignItems: "center",
                        justifyContent: "space-between", cursor: "pointer",
                        color: t.textMuted,
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1px" }}>{sec.section.toUpperCase()}</span>
                      <ChevronDown size={13} style={{ transform: expandedSections[si] ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </button>
                    {expandedSections[si] && sec.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`sidebar-link${lesson.active ? " lesson-active" : ""}`}
                        style={{
                          padding: "9px 20px 9px 16px",
                          display: "flex", alignItems: "center", gap: 10,
                          cursor: "pointer",
                          borderLeft: lesson.active ? `3px solid ${C.accent}` : "3px solid transparent",
                        }}
                      >
                        {lesson.done
                          ? <CheckCircle2 size={15} style={{ color: C.green, flexShrink: 0 }} />
                          : <Circle size={15} style={{ color: lesson.active ? C.accent : t.border2, flexShrink: 0 }} />
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 13, fontWeight: lesson.active ? 700 : 500,
                            color: lesson.active ? C.accent : lesson.done ? t.textSub : t.text,
                            lineHeight: 1.3,
                          }}>{lesson.title}</p>
                          <p style={{ fontSize: 11, color: t.textMuted }}>{lesson.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </nav>
            </aside>
          )}

          {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
          <main style={{
            flex: 1, overflowY: "auto", padding: "0 0 80px",
            maxHeight: "calc(100vh - 56px)", position: "relative",
          }}>
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 40px" }} className="article-body">
              
              {/* Lesson header */}
              <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                  <span style={{
                    background: C.accentBg2, color: C.accent,
                    fontSize: 10, fontWeight: 800, letterSpacing: "1px",
                    padding: "4px 10px", borderRadius: 20,
                  }}>LESSON 3 · FOUNDATIONS</span>
                  <span style={{ fontSize: 12, color: t.textMuted }}>12 min read</span>
                </div>
                <h1 style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 32, fontWeight: 700, lineHeight: 1.25,
                  letterSpacing: "-0.5px", marginBottom: 12,
                }}>Training, Validation & Test Sets</h1>
                <p style={{
                  fontSize: 16, color: t.textSub, lineHeight: 1.6,
                  fontFamily: "'Lora', Georgia, serif", fontStyle: "italic",
                }}>
                  How you split your data determines how well you can trust your model's reported performance.
                </p>
              </div>

              {/* ── BODY ── */}
              <div style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 15.5, lineHeight: 1.8, color: t.text,
              }}>

                <p style={{ marginBottom: 20 }}>
                  In most supervised machine learning tasks, best practice recommends splitting your data into 
                  three independent sets: a <H color="accent">training set</H>, a <H color="gold">validation set</H>, and a <H color="blue">test set</H>.
                </p>

                <p style={{ marginBottom: 20 }}>
                  To understand why, imagine you're a student preparing for an exam. You practice on past papers 
                  (training), check your weak areas on practice quizzes (validation), then sit the final exam (test). 
                  Using the final exam as practice defeats the purpose entirely.
                </p>

                <DataSplitDiagram t={t} />

                <h2 style={{
                  fontFamily: "'DM Sans', system-ui", fontSize: 20, fontWeight: 800,
                  letterSpacing: "-0.3px", marginBottom: 12, marginTop: 36,
                }}>The Training Set</h2>

                <p style={{ marginBottom: 20 }}>
                  The <H color="accent">training set</H> is the data your model directly learns from. During training, 
                  the model adjusts its internal parameters to minimise prediction error on these examples. 
                  It typically makes up <H>60–80%</H> of your total dataset.
                </p>

                <Callout icon={AlertCircle} label="COMMON MISTAKE" color="gold" t={t}>
                  Never use test-set performance to make decisions about your model architecture or hyperparameters. 
                  Every time you peek at test results and adjust, you're implicitly "leaking" information.
                </Callout>

                <h2 style={{
                  fontFamily: "'DM Sans', system-ui", fontSize: 20, fontWeight: 800,
                  letterSpacing: "-0.3px", marginBottom: 12, marginTop: 36,
                }}>The Validation Set</h2>

                <p style={{ marginBottom: 20 }}>
                  The <H color="gold">validation set</H> acts as a referee during development. After each training epoch, 
                  you evaluate performance on this held-out slice to detect <H color="accent">overfitting</H> — the phenomenon 
                  where your model memorises the training data rather than learning general patterns.
                </p>

                <OverfitChart t={t} />

                <p style={{ marginBottom: 20 }}>
                  When validation loss stops improving (or starts rising) while training loss keeps dropping, 
                  it's time to stop — you've found the point of <H color="accent">optimal complexity</H>.
                </p>

                <Callout icon={Lightbulb} label="KEY INSIGHT" color="blue" t={t}>
                  The gap between training and validation error is a direct measure of your model's variance. 
                  A large gap means overfitting; a small gap but poor absolute performance means underfitting.
                </Callout>

                <h2 style={{
                  fontFamily: "'DM Sans', system-ui", fontSize: 20, fontWeight: 800,
                  letterSpacing: "-0.3px", marginBottom: 12, marginTop: 36,
                }}>The Test Set</h2>

                <p style={{ marginBottom: 20 }}>
                  The <H color="blue">test set</H> is your model's final exam — evaluated <em>exactly once</em>, after all 
                  development is complete. This gives you an unbiased estimate of real-world performance. 
                  Treat it as sealed until you're ready to ship.
                </p>

                <ConceptGrid t={t} />

                <h2 style={{
                  fontFamily: "'DM Sans', system-ui", fontSize: 20, fontWeight: 800,
                  letterSpacing: "-0.3px", marginBottom: 12, marginTop: 36,
                }}>When Data is Scarce: k-Fold Cross-Validation</h2>

                <p style={{ marginBottom: 20 }}>
                  When your dataset is small, a static split wastes precious examples. 
                  <H color="gold"> k-fold cross-validation</H> solves this by rotating which fold acts as the validation set, 
                  training k separate models, and averaging their scores.
                </p>

                <Callout icon={TrendingUp} label="RULE OF THUMB" color="green" t={t}>
                  k=5 or k=10 are the most common choices. More folds → less bias, more variance in the estimate, 
                  and significantly more compute time.
                </Callout>

                <p style={{ marginBottom: 0 }}>
                  This technique is especially valuable in medical or scientific domains where every labelled 
                  example is expensive to obtain. The tradeoff is training time: k=10 means training ten models 
                  instead of one.
                </p>

              </div>

              {/* ── BOTTOM NAV ─────────────────────────────────────────────── */}
              <div style={{
                marginTop: 56, paddingTop: 28,
                borderTop: `1px solid ${t.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <button className="nav-btn">
                  <ChevronLeft size={16} />
                  The ML Workflow
                </button>
                <button className="dive-btn">
                  Next: Bias vs. Variance
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
