import { useState } from "react";
import {
  ArrowLeft, BookOpen, Play, PenLine, RotateCcw,
  Layers, AlignLeft, List, CheckCircle2, Circle,
  Clock, ChevronRight, ChevronDown, ChevronUp,
  Moon, Sun, Zap, TrendingUp, Target,
  ArrowRight, Flame
} from "lucide-react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  accent:  "#E07355", accentHov:"#C85E40",
  accentBg:"rgba(224,115,85,0.10)", accentBg2:"rgba(224,115,85,0.17)",
  blue:    "#4A7FC1", blueBg:  "rgba(74,127,193,0.11)",
  green:   "#5A9E72", greenBg: "rgba(90,158,114,0.11)",
  gold:    "#C49A3C", goldBg:  "rgba(196,154,60,0.11)",
  purple:  "#9B6DD9", purpleBg:"rgba(155,109,217,0.11)",
};
const LIGHT = {
  bg:"#F5F2EE", surface:"#FFFFFF", surface2:"#F0ECE6",
  text:"#1A1A1A", textSub:"#6B6560", textMuted:"#9B9590",
  border:"#E4DDD4", border2:"#D4CCC2",
};
const DARK = {
  bg:"#141414", surface:"#1E1E1E", surface2:"#252525",
  text:"#F0EDE8", textSub:"#9B9590", textMuted:"#6B6560",
  border:"#2E2E2E", border2:"#3A3A3A",
};

// ── SUBJECT DATA ──────────────────────────────────────────────────────────────
const SUBJECT = {
  id: "ml",
  name: "Machine Learning",
  desc: "From supervised learning fundamentals to model evaluation and deployment. Structured for the Google PMLE exam.",
  color: C.accent,
  totalQ: 150,
  totalLessons: 18,
  estimatedHours: 24,
  semester: "5th semester",
  lastStudied: "2 hours ago",
  streak: 5,
  sections: [
    {
      id: "s1", label: "S1", name: "ML Problem Framing",
      color: C.accent,
      status: "complete", // complete | active | locked
      lessons: [
        { id:1, title:"What is Machine Learning?",        time:"8 min",  done:true,  type:"study" },
        { id:2, title:"The ML Workflow",                  time:"10 min", done:true,  type:"study" },
        { id:3, title:"Types of ML Problems",             time:"7 min",  done:true,  type:"study" },
        { id:4, title:"Framing a Real Business Problem",  time:"12 min", done:true,  type:"study" },
      ],
      quizDone: true,  quizScore: 88,
      questions: 30, questionsAttempted: 30,
    },
    {
      id: "s2", label: "S2", name: "Data Preparation",
      color: C.blue,
      status: "active",
      lessons: [
        { id:5, title:"Data Collection & Labelling",      time:"11 min", done:true,  type:"study" },
        { id:6, title:"Exploratory Data Analysis",        time:"14 min", done:true,  type:"study" },
        { id:7, title:"Feature Engineering",              time:"13 min", done:false, type:"study", active:true },
        { id:8, title:"Handling Missing Values",          time:"9 min",  done:false, type:"study" },
        { id:9, title:"Train / Val / Test Split",         time:"10 min", done:false, type:"study" },
      ],
      quizDone: false, quizScore: null,
      questions: 35, questionsAttempted: 18,
    },
    {
      id: "s3", label: "S3", name: "Model Development",
      color: C.green,
      status: "upcoming",
      lessons: [
        { id:10, title:"Linear & Logistic Regression",   time:"15 min", done:false, type:"study" },
        { id:11, title:"Decision Trees & Ensembles",     time:"18 min", done:false, type:"study" },
        { id:12, title:"Neural Network Basics",          time:"20 min", done:false, type:"study" },
        { id:13, title:"Regularisation & Overfitting",   time:"12 min", done:false, type:"study" },
      ],
      quizDone: false, quizScore: null,
      questions: 40, questionsAttempted: 0,
    },
    {
      id: "s4", label: "S4", name: "Model Evaluation",
      color: C.gold,
      status: "upcoming",
      lessons: [
        { id:14, title:"Evaluation Metrics Overview",    time:"10 min", done:false, type:"study" },
        { id:15, title:"Confusion Matrix & ROC",         time:"13 min", done:false, type:"study" },
        { id:16, title:"Cross-Validation Strategies",    time:"11 min", done:false, type:"study" },
      ],
      quizDone: false, quizScore: null,
      questions: 28, questionsAttempted: 0,
    },
    {
      id: "s5", label: "S5", name: "Deployment & MLOps",
      color: C.purple,
      status: "upcoming",
      lessons: [
        { id:17, title:"Model Serving & APIs",           time:"14 min", done:false, type:"study" },
        { id:18, title:"Monitoring & Data Drift",        time:"12 min", done:false, type:"study" },
      ],
      quizDone: false, quizScore: null,
      questions: 17, questionsAttempted: 0,
    },
  ],
};

const MODES = [
  { icon:Play,     label:"Quiz",         sub:"Scored · auto-advance",      color:C.accent  },
  { icon:BookOpen, label:"Study",        sub:"Notes & explanations",       color:C.blue    },
  { icon:Layers,   label:"Flashcards",   sub:"Tap to flip",                color:C.green   },
  { icon:PenLine,  label:"Written Test", sub:"AI evaluates your answer",   color:C.purple  },
  { icon:RotateCcw,label:"Wrong Answers",sub:"Practice mistakes",          color:C.gold    },
  { icon:AlignLeft,label:"Glossary",     sub:"Terms & abbreviations",      color:C.blue    },
];

// ── SECTION STATUS ICON ───────────────────────────────────────────────────────
function StatusIcon({ status, color, size = 18 }) {
  if (status === "complete")
    return <CheckCircle2 size={size} style={{ color: C.green }} />;
  if (status === "active")
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
      </div>
    );
  // upcoming — open circle, muted
  return <Circle size={size} style={{ color: "#9B9590" }} />;
}

// ── SECTION CARD ──────────────────────────────────────────────────────────────
function SectionCard({ sec, t, open, onToggle, isNext }) {
  const doneLessons = sec.lessons.filter(l => l.done).length;
  const lessonPct   = Math.round((doneLessons / sec.lessons.length) * 100);
  const qPct        = Math.round((sec.questionsAttempted / sec.questions) * 100);
  const upcoming    = sec.status === "upcoming";

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${open ? sec.color + "50" : isNext ? `${C.accent}50` : t.border}`,
      borderRadius: 14,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* "Continue here" nudge */}
      {isNext && !open && (
        <div style={{ background: C.accentBg2, borderBottom: `1px solid ${C.accent}30`, padding: "7px 18px", display: "flex", alignItems: "center", gap: 7 }}>
          <ArrowRight size={12} style={{ color: C.accent }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>Continue here</span>
        </div>
      )}

      {/* Header */}
      <div
        onClick={onToggle}
        style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
        onMouseEnter={e => e.currentTarget.style.background = t.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Section label */}
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: upcoming ? t.surface2 : `${sec.color}18`,
          border: `1px solid ${upcoming ? t.border : sec.color + "35"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: upcoming ? t.textMuted : sec.color }}>{sec.label}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: upcoming ? t.textSub : t.text }}>{sec.name}</p>
              <StatusIcon status={sec.status} color={sec.color} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {sec.quizDone && (
                <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenBg, border: `1px solid ${C.green}30`, borderRadius: 20, padding: "2px 8px" }}>
                  Quiz {sec.quizScore}%
                </span>
              )}
              <span style={{ fontSize: 11, color: t.textMuted }}>
                {sec.lessons.length} lessons · {sec.questions}q
              </span>
            </div>
          </div>

          {/* Progress bars — show even if 0% */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ flex: 1, height: 3, background: t.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${lessonPct}%`, height: "100%", background: sec.color, borderRadius: 99, opacity: 0.7, transition: "width 0.5s" }} />
            </div>
            <div style={{ flex: 1, height: 3, background: t.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${qPct}%`, height: "100%", background: sec.color, borderRadius: 99, transition: "width 0.5s" }} />
            </div>
            <span style={{ fontSize: 10, color: t.textMuted, marginLeft: 4, flexShrink: 0 }}>
              {upcoming ? "Not started" : `${doneLessons}/${sec.lessons.length} · ${sec.questionsAttempted}/${sec.questions}q`}
            </span>
          </div>
        </div>

        {open
          ? <ChevronUp size={14} style={{ color: t.textMuted, flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: t.textMuted, flexShrink: 0 }} />
        }
      </div>

      {/* Expanded: lessons list */}
      {open && (
        <div style={{ borderTop: `1px solid ${t.border}`, animation: "fadeDown 0.2s ease both" }}>
          {/* Lesson rows */}
          <div>
            {sec.lessons.map((lesson, i) => (
              <div
                key={lesson.id}
                style={{
                  padding: "11px 18px 11px 68px",
                  borderBottom: i < sec.lessons.length - 1 ? `1px solid ${t.border}` : "none",
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "pointer",
                  background: lesson.active ? C.accentBg : "transparent",
                  borderLeft: lesson.active ? `3px solid ${C.accent}` : "3px solid transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!lesson.active) e.currentTarget.style.background = t.surface2; }}
                onMouseLeave={e => { if (!lesson.active) e.currentTarget.style.background = lesson.active ? C.accentBg : "transparent"; }}
              >
                {lesson.done
                  ? <CheckCircle2 size={15} style={{ color: C.green, flexShrink: 0 }} />
                  : <Circle size={15} style={{ color: lesson.active ? C.accent : t.border2, flexShrink: 0 }} />
                }
                <span style={{
                  flex: 1, fontSize: 13, fontWeight: lesson.active ? 700 : 500,
                  color: lesson.active ? C.accent : lesson.done ? t.textMuted : t.text,
                }}>
                  {lesson.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: t.textMuted, display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={10} />{lesson.time}
                  </span>
                  {lesson.active && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: C.accent,
                      background: C.accentBg2, border: `1px solid ${C.accent}35`,
                      borderRadius: 20, padding: "2px 8px",
                    }}>START</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Section actions */}
          <div style={{ padding: "12px 18px", background: t.surface2, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={{
              background: sec.color, color: "#fff", border: "none",
              borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans',system-ui",
              display: "flex", alignItems: "center", gap: 5,
              transition: "opacity 0.15s",
            }}>
              <Play size={11} />
              {sec.quizDone ? "Retake quiz" : "Take section quiz"}
            </button>
            <button style={{
              background: "transparent", border: `1px solid ${t.border}`,
              borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", color: t.textSub, fontFamily: "'DM Sans',system-ui",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Layers size={11} />
              Flashcards
            </button>
            {sec.quizDone && (
              <button style={{
                background: "transparent", border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", color: t.textSub, fontFamily: "'DM Sans',system-ui",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <RotateCcw size={11} />
                Wrong answers
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MODE GRID ─────────────────────────────────────────────────────────────────
function ModeGrid({ t }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {MODES.map((m, i) => {
        const Icon = m.icon;
        return (
          <button
            key={i}
            style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: "14px 12px",
              cursor: "pointer", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 8,
              transition: "all 0.15s",
              fontFamily: "'DM Sans',system-ui",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = m.color + "70";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${m.color}18`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${m.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={15} style={{ color: m.color }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 2 }}>{m.label}</p>
              <p style={{ fontSize: 11, color: t.textSub, lineHeight: 1.4 }}>{m.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function SubjectDetail() {
  const [dark, setDark]   = useState(false);
  const [openSec, setOpenSec] = useState({ s2: true }); // active section open by default
  const t = dark ? DARK : LIGHT;
  const s = SUBJECT;

  const doneLessons = s.sections.reduce((a, sec) => a + sec.lessons.filter(l => l.done).length, 0);
  const doneQ       = s.sections.reduce((a, sec) => a + sec.questionsAttempted, 0);
  const pct         = Math.round((doneQ / s.totalQ) * 100);
  const activeSection = s.sections.find(sec => sec.status === "active");

  const circ = 2 * Math.PI * 26;
  const dash  = (pct / 100) * circ;

  const toggleSec = id => setOpenSec(p => ({ ...p, [id]: !p[id] }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none}}
        .fu{animation:fadeUp .32s ease both}
        .fu2{animation:fadeUp .32s ease both .07s}
        .fu3{animation:fadeUp .32s ease both .13s}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${dark?"#333":"#ddd"};border-radius:10px}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background 0.3s" }}>

        {/* ── HEADER ── */}
        <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 24px", gap:12, position:"sticky", top:0, zIndex:100, transition:"background 0.3s" }}>
          <button style={{ background:"none", border:"none", cursor:"pointer", color:t.textSub, display:"flex", padding:4 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
          <span style={{ fontWeight:800, fontSize:14, flex:1 }}>{s.name}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {s.streak > 0 && (
              <span style={{ fontSize:12, fontWeight:700, color:C.accent, display:"flex", alignItems:"center", gap:4, background:C.accentBg, border:`1px solid ${C.accent}30`, borderRadius:20, padding:"4px 10px" }}>
                <Flame size={12}/>{s.streak}d streak
              </span>
            )}
            <button onClick={()=>setDark(d=>!d)} style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:t.textSub, fontSize:12, fontWeight:600 }}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        <main style={{ maxWidth:720, margin:"0 auto", padding:"32px 24px 80px" }}>

          {/* ── HERO ── */}
          <div className="fu" style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:"24px", marginBottom:20, display:"flex", gap:20, alignItems:"flex-start" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.5px", color:t.textMuted, marginBottom:6 }}>{s.semester.toUpperCase()}</p>
              <h1 style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, letterSpacing:"-0.3px", marginBottom:8 }}>{s.name}</h1>
              <p style={{ fontSize:14, color:t.textSub, lineHeight:1.6, marginBottom:18 }}>{s.desc}</p>

              {/* Meta row */}
              <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
                {[
                  { icon:BookOpen,   val:`${s.totalLessons} lessons`        },
                  { icon:Target,     val:`${s.totalQ} questions`            },
                  { icon:Clock,      val:`~${s.estimatedHours}h total`      },
                  { icon:TrendingUp, val:`Last studied ${s.lastStudied}`    },
                ].map(({icon:Icon,val},i)=>(
                  <span key={i} style={{ fontSize:12, color:t.textSub, display:"flex", alignItems:"center", gap:5 }}>
                    <Icon size={12} style={{color:t.textMuted}}/>{val}
                  </span>
                ))}
              </div>
            </div>

            {/* Progress ring */}
            <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ position:"relative" }}>
                <svg width={64} height={64} style={{transform:"rotate(-90deg)"}}>
                  <circle cx={32} cy={32} r={26} fill="none" stroke={t.surface2} strokeWidth={5}/>
                  <circle cx={32} cy={32} r={26} fill="none" stroke={s.color} strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{transition:"stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)"}}
                  />
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:14, fontWeight:800, color:t.text }}>{pct}%</span>
                </div>
              </div>
              <span style={{ fontSize:11, color:t.textMuted, textAlign:"center", lineHeight:1.4 }}>
                {doneQ}/{s.totalQ}<br/>questions
              </span>
            </div>
          </div>

          {/* ── CONTINUE BUTTON ── */}
          {activeSection && (
            <div className="fu2" style={{ marginBottom:20 }}>
              <button style={{
                width:"100%", padding:"14px 20px",
                background:C.accent, color:"#fff", border:"none",
                borderRadius:12, fontSize:14, fontWeight:700,
                cursor:"pointer", fontFamily:"'DM Sans',system-ui",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                transition:"background 0.15s, transform 0.12s cubic-bezier(0.34,1.56,0.64,1)",
              }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.accentHov;e.currentTarget.style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.transform="none";}}
              >
                <ArrowRight size={16}/>
                Continue — {activeSection.name}
                <span style={{ marginLeft:4, fontSize:12, opacity:0.8, fontWeight:500 }}>
                  · Lesson {activeSection.lessons.filter(l=>l.done).length + 1} of {activeSection.lessons.length}
                </span>
              </button>
            </div>
          )}

          {/* ── SECTIONS / LEARNING PATH ── */}
          <div className="fu2" style={{ marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted }}>LEARNING PATH</p>
              <div style={{ display:"flex", gap:14 }}>
                {[{color:C.green,label:"Lessons"},{color:s.color,label:"Questions"}].map(it=>(
                  <span key={it.label} style={{ fontSize:10, color:t.textMuted, display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:20, height:3, borderRadius:99, background:it.color, opacity:0.7 }}/>
                    {it.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {s.sections.map((sec, i) => (
                <SectionCard
                  key={sec.id} sec={sec} t={t}
                  open={!!openSec[sec.id]}
                  onToggle={()=>toggleSec(sec.id)}
                  isNext={sec.status === "active" && !openSec[sec.id]}
                />
              ))}
            </div>
          </div>

          {/* ── STUDY MODES ── */}
          <div className="fu3">
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:12 }}>STUDY MODES</p>
            <ModeGrid t={t}/>
          </div>

        </main>
      </div>
    </>
  );
}
