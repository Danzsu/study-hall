import { useState } from "react";
import { Moon, Sun, ArrowLeft, ChevronDown, Check, BookOpen, Play, PenLine, RotateCcw, Layers, List, AlignLeft, Flame, User } from "lucide-react";

const COLORS = {
  accent: "#E07355",
  accentLight: "#F5E6E1",
  accentDark: "#C85E40",
};

const subjects = [
  {
    id: "ml",
    emoji: "🤖",
    name: "Machine Learning",
    desc: "Supervised, unsupervised & reinforcement learning fundamentals",
    questions: 150,
    lessons: 8,
    color: "#E07355",
  },
  {
    id: "stats",
    emoji: "📊",
    name: "Statistics",
    desc: "Probability, distributions, hypothesis testing & inference",
    questions: 120,
    lessons: 6,
    color: "#5B8DD9",
  },
  {
    id: "algo",
    emoji: "⚙️",
    name: "Algorithms",
    desc: "Data structures, complexity analysis & algorithm design",
    questions: 180,
    lessons: 10,
    color: "#6DB88A",
  },
];

const modes = [
  { icon: BookOpen, label: "Study", sub: "Cheat sheets for quiz", color: "#E07355" },
  { icon: Play, label: "Quiz", sub: "Scored · auto-advance", color: "#5B8DD9" },
  { icon: PenLine, label: "Written Test", sub: "AI evaluates your answer", color: "#9B6DD9" },
  { icon: RotateCcw, label: "Wrong Answers", sub: "Practice mistakes", color: "#D95B5B" },
  { icon: Layers, label: "Flashcards", sub: "Tap to flip", color: "#6DB88A" },
  { icon: List, label: "Review", sub: "Browse all", color: "#D9A45B" },
  { icon: AlignLeft, label: "Glossary", sub: "Terms & abbreviations", color: "#5BBDD9" },
];

const quizQuestions = [
  {
    q: "Which of the following best describes the bias-variance tradeoff in machine learning models?",
    options: [
      "High bias models overfit training data; high variance models underfit",
      "High bias leads to underfitting and high variance leads to overfitting",
      "Both bias and variance should be maximized to improve generalization",
      "Bias and variance are independent metrics with no interaction",
    ],
    correct: 1,
    section: "ML Problem Framing",
    type: "MULTIPLE CHOICE",
  },
];

export default function StudyHall() {
  const [view, setView] = useState("home"); // home | subject | quiz
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const t = {
    bg: dark ? "#1A1A1A" : "#F5F2EE",
    card: dark ? "#242424" : "#FFFFFF",
    text: dark ? "#F0EDE8" : "#1A1A1A",
    sub: dark ? "#888" : "#666",
    border: dark ? "#333" : "#E8E3DC",
    navBg: dark ? "#1E1E1E" : "#FFFFFF",
    chipBg: dark ? "#2E2E2E" : "#F0EDE8",
    inputBg: dark ? "#2A2A2A" : "#F5F2EE",
  };

  const base = {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: t.bg,
    color: t.text,
    minHeight: "100vh",
    transition: "background 0.3s, color 0.3s",
  };

  // NAV
  const Nav = ({ backFn, title }) => (
    <nav style={{
      background: t.navBg,
      borderBottom: `1px solid ${t.border}`,
      padding: "0 24px",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
      transition: "background 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {backFn && (
          <button onClick={backFn} style={{
            background: "none", border: "none", cursor: "pointer",
            color: t.text, display: "flex", alignItems: "center",
            padding: "6px 8px 6px 4px", borderRadius: 8,
          }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>
          {title || "📚 Study Hall"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setDark(!dark)} style={{
          background: t.chipBg, border: `1px solid ${t.border}`,
          borderRadius: 20, padding: "6px 10px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          color: t.text, fontSize: 13, fontWeight: 500,
          transition: "background 0.2s",
        }}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          {dark ? "Light" : "Dark"}
        </button>
        {!backFn && (
          <button style={{
            background: COLORS.accent, color: "#fff",
            border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 600,
            cursor: "pointer",
          }}>
            <User size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Sign in
          </button>
        )}
      </div>
    </nav>
  );

  // STREAK BANNER
  const StreakBanner = () => (
    <div style={{
      background: `linear-gradient(135deg, ${COLORS.accentDark}, ${COLORS.accent})`,
      color: "#fff",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: "0.5px",
    }}>
      <Flame size={18} />
      <span>0 DAYS STREAK</span>
      <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>—</span>
      <span style={{ opacity: 0.9, fontWeight: 500 }}>COMPLETE A QUIZ TODAY</span>
    </div>
  );

  // HOME
  const HomeView = () => (
    <div style={base}>
      <Nav />
      <StreakBanner />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
            Your Subjects
          </h1>
          <p style={{ color: t.sub, fontSize: 15 }}>Pick a subject to start studying</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {subjects.map((s) => (
            <SubjectCard key={s.id} s={s} t={t} onClick={() => { setSelected(s); setView("subject"); }} />
          ))}
        </div>
      </div>
    </div>
  );

  // SUBJECT PAGE
  const SubjectView = () => (
    <div style={base}>
      <Nav backFn={() => setView("home")} title={selected?.name} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {/* Controls */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <Dropdown label="SECTION" value="All Sections" t={t} />
          <Dropdown label="SIZE" value="10 Questions" t={t} />
        </div>

        {/* Mode grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}>
          {modes.map((m) => (
            <ModeCard key={m.label} m={m} t={t} onClick={() => setView("quiz")} />
          ))}
        </div>

        {/* Exam sections */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: t.sub, marginBottom: 12 }}>
            EXAM SECTIONS
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["S1 — Framing", "S2 — Data Prep", "S3 — Model Dev", "S4 — Evaluation", "S5 — Deployment"].map((chip, i) => (
              <button key={i} style={{
                background: t.chipBg, border: `1px solid ${t.border}`,
                borderRadius: 20, padding: "7px 14px",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                color: t.text, transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text; }}
              >
                {i + 1} {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // QUIZ
  const QuizView = () => {
    const q = quizQuestions[0];
    const progress = 1 / 10;
    return (
      <div style={base}>
        <Nav backFn={() => setView("subject")} title="Quiz" />
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{
              flex: 1, height: 6, background: t.border, borderRadius: 99, overflow: "hidden",
            }}>
              <div style={{
                width: `${progress * 100}%`, height: "100%",
                background: COLORS.accent, borderRadius: 99,
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.sub, whiteSpace: "nowrap" }}>1 / 10</span>
          </div>

          {/* Type + Section badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "1px",
              color: COLORS.accent, textTransform: "uppercase",
            }}>{q.type}</span>
            <span style={{
              background: t.chipBg, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "4px 12px",
              fontSize: 11, fontWeight: 600, color: t.sub,
            }}>{q.section}</span>
          </div>

          {/* Question */}
          <h2 style={{
            fontSize: 19, fontWeight: 700, lineHeight: 1.5,
            letterSpacing: "-0.2px", marginBottom: 28,
          }}>{q.q}</h2>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            {q.options.map((opt, i) => {
              const labels = ["A", "B", "C", "D"];
              const isSelected = quizAnswer === i;
              const isCorrect = submitted && i === q.correct;
              const isWrong = submitted && isSelected && i !== q.correct;
              return (
                <button key={i} onClick={() => !submitted && setQuizAnswer(i)} style={{
                  background: isCorrect ? "#E6F5EC" : isWrong ? "#FDECEA" : isSelected ? COLORS.accentLight : t.card,
                  border: `2px solid ${isCorrect ? "#6DB88A" : isWrong ? "#D95B5B" : isSelected ? COLORS.accent : t.border}`,
                  borderRadius: 12, padding: "16px 18px",
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: submitted ? "default" : "pointer",
                  textAlign: "left", width: "100%",
                  transition: "all 0.15s",
                  color: t.text,
                }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: isCorrect ? "#6DB88A" : isWrong ? "#D95B5B" : isSelected ? COLORS.accent : t.chipBg,
                    color: (isSelected || isCorrect || isWrong) ? "#fff" : t.sub,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, flexShrink: 0,
                    transition: "all 0.15s",
                  }}>{labels[i]}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: isSelected ? 500 : 400 }}>{opt}</span>
                  {isCorrect && <Check size={16} style={{ marginLeft: "auto", color: "#6DB88A", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Submit / Next */}
          <button
            disabled={quizAnswer === null}
            onClick={() => {
              if (!submitted) setSubmitted(true);
              else { setQuizAnswer(null); setSubmitted(false); }
            }}
            style={{
              width: "100%", padding: "16px",
              background: quizAnswer === null ? t.border : COLORS.accent,
              color: quizAnswer === null ? t.sub : "#fff",
              border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: quizAnswer === null ? "not-allowed" : "pointer",
              transition: "all 0.2s", letterSpacing: "0.2px",
            }}>
            {submitted ? "Next Question →" : "Submit Answer"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        /* View switcher */
        .view-switcher {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: ${dark ? "#2A2A2A" : "#fff"}; border: 1px solid ${dark ? "#333" : "#E8E3DC"};
          border-radius: 40px; padding: 6px; display: flex; gap: 4px; z-index: 999;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        }
        .view-btn {
          padding: 8px 18px; border-radius: 30px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', system-ui;
          transition: all 0.15s;
          color: ${dark ? "#F0EDE8" : "#1A1A1A"};
          background: transparent;
        }
        .view-btn.active {
          background: ${COLORS.accent}; color: #fff;
        }
      `}</style>

      {view === "home" && <HomeView />}
      {view === "subject" && <SubjectView />}
      {view === "quiz" && <QuizView />}

      {/* Floating view switcher */}
      <div className="view-switcher">
        {[["home","🏠 Home"],["subject","📗 Subject"],["quiz","❓ Quiz"]].map(([v, label]) => (
          <button key={v} className={`view-btn${view===v?" active":""}`}
            onClick={() => { setView(v); setQuizAnswer(null); setSubmitted(false); }}>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

function SubjectCard({ s, t, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderLeft: `4px solid ${s.color}`,
        borderRadius: 14,
        padding: "22px 20px",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 8px 30px rgba(0,0,0,0.1)" : "none",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{s.emoji}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.2px" }}>{s.name}</h3>
      <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.5, marginBottom: 16 }}>{s.desc}</p>
      <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 600, color: t.sub }}>
        <span>{s.questions} questions</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{s.lessons} lessons</span>
      </div>
    </div>
  );
}

function ModeCard({ m, t, onClick }) {
  const [hover, setHover] = useState(false);
  const Icon = m.icon;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: t.card,
        border: `1px solid ${hover ? m.color : t.border}`,
        borderRadius: 14,
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.18s",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? `0 6px 20px ${m.color}20` : "none",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: hover ? m.color : `${m.color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14, transition: "all 0.18s",
        color: hover ? "#fff" : m.color,
      }}>
        <Icon size={18} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{m.label}</p>
      <p style={{ fontSize: 12, color: t.sub, lineHeight: 1.4 }}>{m.sub}</p>
    </div>
  );
}

function Dropdown({ label, value, t }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: t.sub }}>{label}</span>
      <button style={{
        background: t.card, border: `1px solid ${t.border}`,
        borderRadius: 8, padding: "9px 14px",
        display: "flex", alignItems: "center", gap: 8,
        cursor: "pointer", color: t.text,
        fontSize: 13, fontWeight: 500, fontFamily: "inherit",
      }}>
        {value}
        <ChevronDown size={14} style={{ color: t.sub }} />
      </button>
    </div>
  );
}
