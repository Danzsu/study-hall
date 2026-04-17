import { useState, useRef, useEffect } from "react";
import {
  Search, X, ArrowLeft, Moon, Sun,
  BookOpen, Layers, AlignLeft, Play,
  ChevronRight, Clock, Hash, Brain,
  FileText, Zap
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

// ── SEARCH INDEX ──────────────────────────────────────────────────────────────
const INDEX = [
  // Questions
  { id:"q1",  kind:"question", subject:"Machine Learning", section:"ML Framing",
    title:"What is the bias-variance tradeoff?",
    body:"High bias leads to underfitting; high variance leads to overfitting. Total error = Bias² + Variance + noise.",
    tags:["bias","variance","overfitting","underfitting"], color:C.accent },
  { id:"q2",  kind:"question", subject:"Machine Learning", section:"Data Prep",
    title:"Why split data into training, validation and test sets?",
    body:"Training fits parameters, validation tunes hyperparameters, test gives unbiased final estimate.",
    tags:["training","validation","test","split"], color:C.accent },
  { id:"q3",  kind:"question", subject:"Machine Learning", section:"Evaluation",
    title:"What is the difference between precision and recall?",
    body:"Precision = TP/(TP+FP). Recall = TP/(TP+FN). F1 is their harmonic mean.",
    tags:["precision","recall","F1","classification"], color:C.accent },
  { id:"q4",  kind:"question", subject:"Machine Learning", section:"Evaluation",
    title:"How do you interpret AUC-ROC?",
    body:"AUC of 0.85 means the model ranks a random positive above a random negative 85% of the time.",
    tags:["AUC","ROC","threshold","evaluation"], color:C.accent },
  { id:"q5",  kind:"question", subject:"Statistics", section:"Probability",
    title:"What is the Central Limit Theorem?",
    body:"The sampling distribution of the mean approaches normal as sample size grows, regardless of population distribution.",
    tags:["CLT","normal","sampling","distribution"], color:C.blue },
  { id:"q6",  kind:"question", subject:"Algorithms", section:"Sorting",
    title:"What is the time complexity of merge sort?",
    body:"O(n log n) in all cases. Stable sort. Requires O(n) extra space.",
    tags:["merge sort","O(n log n)","stable","complexity"], color:C.green },
  { id:"q7",  kind:"question", subject:"Machine Learning", section:"Deep Learning",
    title:"What problem do LSTMs solve that vanilla RNNs cannot?",
    body:"LSTMs solve the vanishing gradient problem through gating mechanisms (forget, input, output gates).",
    tags:["LSTM","RNN","vanishing gradient","sequence"], color:C.accent },

  // Glossary terms
  { id:"g1",  kind:"term", subject:"Machine Learning",
    title:"AUC", body:"Area Under the Curve — measures classifier performance across all decision thresholds. 1.0 = perfect, 0.5 = random.",
    tags:["abbreviation","evaluation"], color:C.accent },
  { id:"g2",  kind:"term", subject:"Machine Learning",
    title:"SGD", body:"Stochastic Gradient Descent — updates parameters using one or a mini-batch of training examples per step.",
    tags:["abbreviation","optimisation"], color:C.accent },
  { id:"g3",  kind:"term", subject:"Machine Learning",
    title:"PCA", body:"Principal Component Analysis — dimensionality reduction via projection onto axes of maximum variance.",
    tags:["abbreviation","data prep"], color:C.accent },
  { id:"g4",  kind:"term", subject:"Machine Learning",
    title:"Overfitting", body:"When a model learns training data too well, including noise, and fails to generalise to new data.",
    tags:["definition","foundations"], color:C.gold },
  { id:"g5",  kind:"term", subject:"Machine Learning",
    title:"Regularisation", body:"Techniques (L1, L2, dropout) that penalise model complexity to reduce overfitting.",
    tags:["definition","foundations"], color:C.gold },
  { id:"g6",  kind:"term", subject:"Statistics",
    title:"p-value", body:"Probability of observing results at least as extreme as the sample, assuming the null hypothesis is true.",
    tags:["definition","inference"], color:C.blue },

  // Lessons / Study notes
  { id:"l1",  kind:"lesson", subject:"Machine Learning", section:"Data Prep",
    title:"Feature Engineering",
    body:"Transforming raw data into informative features that improve model performance.",
    tags:["study","data prep","features"], color:C.blue },
  { id:"l2",  kind:"lesson", subject:"Machine Learning", section:"ML Framing",
    title:"The ML Workflow",
    body:"Problem framing → data collection → model selection → training → evaluation → deployment.",
    tags:["study","workflow","overview"], color:C.blue },
  { id:"l3",  kind:"lesson", subject:"Machine Learning", section:"Evaluation",
    title:"Cross-Validation Strategies",
    body:"k-fold, stratified k-fold, leave-one-out. When to use each and tradeoffs.",
    tags:["study","evaluation","k-fold"], color:C.blue },
  { id:"l4",  kind:"lesson", subject:"Statistics", section:"Distributions",
    title:"Normal & t-Distributions",
    body:"Properties of normal distribution. When to use t-distribution vs. z-test.",
    tags:["study","distributions","statistics"], color:C.purple },
];

const RECENT_SEARCHES = ["bias variance", "AUC ROC", "k-fold", "precision recall", "LSTM"];

const SUGGESTIONS = [
  { label:"Questions with wrong answers", icon:Zap,      color:C.accent },
  { label:"Glossary — abbreviations",     icon:Hash,     color:C.blue   },
  { label:"Deep Learning lessons",        icon:BookOpen, color:C.purple },
  { label:"Model Evaluation section",     icon:Brain,    color:C.gold   },
];

// ── KIND CONFIG ───────────────────────────────────────────────────────────────
const KIND = {
  question: { label:"Question", icon:FileText, color:C.accent },
  term:     { label:"Term",     icon:Hash,     color:C.gold   },
  lesson:   { label:"Lesson",   icon:BookOpen, color:C.blue   },
};

// ── HIGHLIGHT matching text ───────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p)
          ? <mark key={i} style={{ background: C.accentBg2, color: C.accent, borderRadius: 3, padding: "0 2px", fontWeight: 700 }}>{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ── SEARCH LOGIC ──────────────────────────────────────────────────────────────
function runSearch(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return INDEX.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.body.toLowerCase().includes(q) ||
    item.tags.some(t => t.toLowerCase().includes(q)) ||
    (item.section && item.section.toLowerCase().includes(q)) ||
    item.subject.toLowerCase().includes(q)
  ).sort((a, b) => {
    // Exact title match first
    const aTitle = a.title.toLowerCase().includes(q) ? 0 : 1;
    const bTitle = b.title.toLowerCase().includes(q) ? 0 : 1;
    return aTitle - bTitle;
  });
}

function groupResults(results) {
  const groups = {};
  results.forEach(r => {
    if (!groups[r.kind]) groups[r.kind] = [];
    groups[r.kind].push(r);
  });
  return groups;
}

// ── RESULT ITEM ───────────────────────────────────────────────────────────────
function ResultItem({ item, query, t }) {
  const k = KIND[item.kind];
  const Icon = k.icon;
  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "13px 18px", cursor: "pointer",
        transition: "background 0.12s",
        borderRadius: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.background = t.surface2}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginTop: 1,
        background: `${item.color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={14} style={{ color: item.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.3 }}>
            <Highlight text={item.title} query={query} />
          </p>
        </div>
        <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          <Highlight text={item.body} query={query} />
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: item.color, background: `${item.color}14`, border: `1px solid ${item.color}28`, borderRadius: 20, padding: "1px 7px" }}>
            {k.label}
          </span>
          <span style={{ fontSize: 10, color: t.textMuted }}>{item.subject}</span>
          {item.section && <><span style={{ fontSize: 10, color: t.border2 }}>·</span><span style={{ fontSize: 10, color: t.textMuted }}>{item.section}</span></>}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: t.textMuted, flexShrink: 0, marginTop: 8 }} />
    </div>
  );
}

// ── TOPBAR SEARCH WIDGET ──────────────────────────────────────────────────────
// Drop this into any header — opens an overlay with live results
export function TopbarSearch({ t, dark }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const results  = runSearch(query);
  const grouped  = groupResults(results);
  const hasResults = results.length > 0;

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") { setOpen(false); setQuery(""); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        background: t.surface2, border: `1px solid ${t.border}`,
        borderRadius: 8, padding: "6px 12px",
        cursor: "pointer", color: t.textMuted,
        fontSize: 13, fontWeight: 500,
        transition: "border-color 0.15s, color 0.15s",
        fontFamily: "'DM Sans', system-ui",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = t.textSub; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
    >
      <Search size={14} />
      <span>Search</span>
      <span style={{ fontSize: 11, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>⌘K</span>
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { setOpen(false); setQuery(""); }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, backdropFilter: "blur(2px)" }}
      />
      {/* Dropdown panel */}
      <div style={{
        position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)",
        width: "min(580px, calc(100vw - 32px))",
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 16, zIndex: 201, overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
        animation: "dropIn 0.2s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${t.border}` }}>
          <Search size={16} style={{ color: C.accent, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions, terms, lessons…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 15, color: t.text, fontFamily: "'DM Sans', system-ui",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, display: "flex", padding: 2 }}>
              <X size={14} />
            </button>
          )}
          <button onClick={() => { setOpen(false); setQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>
            Esc
          </button>
        </div>

        {/* Results or empty */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {!query && (
            <div style={{ padding: "12px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.7px", color: t.textMuted, marginBottom: 8 }}>RECENT</p>
              {RECENT_SEARCHES.map(r => (
                <div key={r} onClick={() => setQuery(r)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 4px", cursor: "pointer", borderRadius: 7,
                  transition: "background 0.12s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = t.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Clock size={13} style={{ color: t.textMuted }} />
                  <span style={{ fontSize: 13, color: t.textSub }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {query && !hasResults && (
            <div style={{ padding: "32px 18px", textAlign: "center", color: t.textMuted }}>
              <Search size={24} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No results for "{query}"</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Try a different term or browse by subject</p>
            </div>
          )}

          {query && hasResults && Object.entries(grouped).map(([kind, items]) => {
            const k = KIND[kind];
            const Icon = k.icon;
            return (
              <div key={kind}>
                <div style={{ padding: "10px 18px 4px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon size={11} style={{ color: k.color }} />
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.7px", color: t.textMuted }}>
                    {k.label.toUpperCase()}S · {items.length}
                  </p>
                </div>
                {items.slice(0, 3).map(item => (
                  <ResultItem key={item.id} item={item} query={query} t={t} />
                ))}
                {items.length > 3 && (
                  <div style={{ padding: "6px 18px 10px" }}>
                    <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, cursor: "pointer" }}>
                      +{items.length - 3} more {k.label.toLowerCase()}s →
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${t.border}`, display: "flex", gap: 14 }}>
          {[
            { key:"↵", label:"open" },
            { key:"↑↓", label:"navigate" },
            { key:"esc", label:"close" },
          ].map(({key,label}) => (
            <span key={key} style={{ fontSize: 11, color: t.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
              <kbd style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 4, padding: "1px 5px", fontSize: 10, fontWeight: 700, color: t.textSub }}>{key}</kbd>
              {label}
            </span>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: t.textMuted }}>
            {results.length > 0 ? `${results.length} result${results.length > 1 ? "s" : ""}` : ""}
          </span>
        </div>
      </div>
    </>
  );
}

// ── FULL SEARCH PAGE ──────────────────────────────────────────────────────────
export default function SearchPage() {
  const [dark, setDark]       = useState(false);
  const [query, setQuery]     = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const inputRef = useRef(null);

  const t = dark ? DARK : LIGHT;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const subjects = ["all", "Machine Learning", "Statistics", "Algorithms"];

  const rawResults = runSearch(query);
  const results = rawResults.filter(r => {
    const matchKind    = kindFilter === "all" || r.kind === kindFilter;
    const matchSubject = subjectFilter === "all" || r.subject === subjectFilter;
    return matchKind && matchSubject;
  });
  const grouped = groupResults(results);
  const hasQuery = query.trim().length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        mark{background:transparent}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes dropIn  {from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .fu{animation:fadeUp .28s ease both}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${dark?"#333":"#ddd"};border-radius:10px}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background 0.3s" }}>

        {/* HEADER */}
        <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", gap:12, position:"sticky", top:0, zIndex:100 }}>
          <button style={{ background:"none", border:"none", cursor:"pointer", color:t.textSub, display:"flex", padding:4 }}>
            <ArrowLeft size={18}/>
          </button>
          <Search size={15} style={{ color:C.accent }}/>
          <span style={{ fontWeight:800, fontSize:14 }}>Search</span>
          <div style={{ marginLeft:"auto" }}>
            <button onClick={()=>setDark(d=>!d)} style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:t.textSub, fontSize:12, fontWeight:600 }}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        {/* SEARCH BAR */}
        <div style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, padding:"16px 20px" }}>
          <div style={{ maxWidth:680, margin:"0 auto" }}>
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              background:t.bg, border:`1.5px solid ${C.accent}`,
              borderRadius:12, padding:"12px 16px",
            }}>
              <Search size={16} style={{ color:C.accent, flexShrink:0 }}/>
              <input
                ref={inputRef}
                value={query}
                onChange={e=>setQuery(e.target.value)}
                placeholder="Search questions, terms, lessons, concepts…"
                style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:15, color:t.text, fontFamily:"'DM Sans',system-ui" }}
              />
              {query && (
                <button onClick={()=>setQuery("")} style={{ background:"none", border:"none", cursor:"pointer", color:t.textMuted, display:"flex", padding:2 }}>
                  <X size={15}/>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        {hasQuery && (
          <div style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, padding:"10px 20px" }}>
            <div style={{ maxWidth:680, margin:"0 auto", display:"flex", gap:6, flexWrap:"wrap" }}>
              {/* Kind */}
              {[
                {id:"all",      label:"All"},
                {id:"question", label:"Questions"},
                {id:"term",     label:"Terms"},
                {id:"lesson",   label:"Lessons"},
              ].map(f => (
                <button key={f.id} onClick={()=>setKindFilter(f.id)} style={{
                  background:kindFilter===f.id ? C.accent : t.surface2,
                  color:kindFilter===f.id ? "#fff" : t.textSub,
                  border:`1px solid ${kindFilter===f.id ? C.accent : t.border}`,
                  borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"'DM Sans',system-ui", transition:"all 0.12s",
                }}>{f.label}</button>
              ))}
              <div style={{ width:1, background:t.border, margin:"0 4px" }}/>
              {/* Subject */}
              {subjects.map(s => (
                <button key={s} onClick={()=>setSubjectFilter(s)} style={{
                  background:subjectFilter===s ? t.surface : "transparent",
                  color:subjectFilter===s ? t.text : t.textSub,
                  border:`1px solid ${subjectFilter===s ? t.border2 : "transparent"}`,
                  borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"'DM Sans',system-ui", transition:"all 0.12s",
                }}>{s === "all" ? "All subjects" : s}</button>
              ))}
            </div>
          </div>
        )}

        <main style={{ maxWidth:680, margin:"0 auto", padding:"24px 20px 80px" }}>

          {/* ── EMPTY / PRE-SEARCH STATE ── */}
          {!hasQuery && (
            <div className="fu">
              {/* Suggestions */}
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:12 }}>BROWSE</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:32 }}>
                {SUGGESTIONS.map((s,i) => {
                  const Icon = s.icon;
                  return (
                    <button key={i} onClick={()=>setQuery(s.label)} style={{
                      background:t.surface, border:`1px solid ${t.border}`,
                      borderRadius:12, padding:"14px 16px",
                      display:"flex", alignItems:"center", gap:10,
                      cursor:"pointer", textAlign:"left",
                      transition:"border-color 0.15s, transform 0.12s",
                      fontFamily:"'DM Sans',system-ui",
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color+"60";e.currentTarget.style.transform="translateY(-1px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.transform="none";}}
                    >
                      <div style={{ width:32, height:32, borderRadius:8, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={14} style={{ color:s.color }}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:t.textSub }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Recent */}
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:10 }}>RECENT SEARCHES</p>
              <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, overflow:"hidden" }}>
                {RECENT_SEARCHES.map((r,i) => (
                  <div key={i} onClick={()=>setQuery(r)} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"12px 18px",
                    borderBottom:i<RECENT_SEARCHES.length-1?`1px solid ${t.border}`:"none",
                    cursor:"pointer", transition:"background 0.12s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background=t.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <Clock size={13} style={{ color:t.textMuted, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:t.textSub }}>{r}</span>
                    <ChevronRight size={13} style={{ color:t.textMuted }}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NO RESULTS ── */}
          {hasQuery && results.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 0", color:t.textMuted, animation:"fadeUp .25s ease" }}>
              <Search size={28} style={{ margin:"0 auto 12px", opacity:0.3 }}/>
              <p style={{ fontSize:15, fontWeight:700, color:t.textSub, marginBottom:6 }}>No results for "{query}"</p>
              <p style={{ fontSize:13, color:t.textMuted }}>Try different keywords or browse by subject</p>
              <button onClick={()=>setQuery("")} style={{ marginTop:16, background:"none", border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", color:t.textSub, fontFamily:"'DM Sans',system-ui" }}>
                Clear search
              </button>
            </div>
          )}

          {/* ── RESULTS ── */}
          {hasQuery && results.length > 0 && (
            <div className="fu">
              <p style={{ fontSize:12, fontWeight:600, color:t.textMuted, marginBottom:16 }}>
                {results.length} result{results.length!==1?"s":""} for "{query}"
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {Object.entries(grouped).map(([kind, items]) => {
                  const k = KIND[kind];
                  const Icon = k.icon;
                  return (
                    <div key={kind} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, overflow:"hidden" }}>
                      {/* Group header */}
                      <div style={{ padding:"11px 18px 9px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:7, background:t.surface2 }}>
                        <Icon size={12} style={{ color:k.color }}/>
                        <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted }}>
                          {k.label.toUpperCase()}S · {items.length}
                        </p>
                      </div>
                      {/* Items */}
                      {items.map((item,i) => (
                        <div key={item.id} style={{ borderBottom:i<items.length-1?`1px solid ${t.border}`:"none" }}>
                          <ResultItem item={item} query={query} t={t}/>
                        </div>
                      ))}
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
