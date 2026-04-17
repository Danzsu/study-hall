import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Clock, Play, ChevronRight, ChevronLeft,
  Moon, Sun, AlertTriangle, CheckCircle2, XCircle,
  PenLine, ToggleLeft, List, Sparkles, RotateCcw,
  Flag, Check, X, Minus, Plus
} from "lucide-react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  accent:  "#E07355", accentHov:"#C85E40",
  accentBg:"rgba(224,115,85,0.10)", accentBg2:"rgba(224,115,85,0.17)",
  blue:    "#4A7FC1", blueBg:  "rgba(74,127,193,0.11)",
  green:   "#5A9E72", greenBg: "rgba(90,158,114,0.11)",
  gold:    "#C49A3C", goldBg:  "rgba(196,154,60,0.11)",
  red:     "#C0504A", redBg:   "rgba(192,80,74,0.10)",
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

// ── QUESTION BANK ─────────────────────────────────────────────────────────────
const MC_QUESTIONS = [
  { id:"mc1", section:"ML Framing",
    q:"Which of the following best describes overfitting?",
    options:["Model performs poorly on both train and test data","Model performs well on train data but poorly on unseen data","Model performs well on test data but poorly on train data","Model has high bias and low variance"],
    correct:1 },
  { id:"mc2", section:"Data Prep",
    q:"PCA is primarily used for:",
    options:["Increasing the number of features","Dimensionality reduction via variance maximisation","Normalising feature scales","Handling missing values"],
    correct:1 },
  { id:"mc3", section:"Evaluation",
    q:"Which metric is most appropriate when false negatives are very costly?",
    options:["Precision","Accuracy","Recall","F1 Score"],
    correct:2 },
  { id:"mc4", section:"Evaluation",
    q:"An AUC score of 0.5 indicates:",
    options:["A perfect classifier","A classifier performing at chance level","A model with high precision","Severe class imbalance"],
    correct:1 },
  { id:"mc5", section:"Supervised",
    q:"What is the purpose of the validation set?",
    options:["Training model parameters","Final evaluation of model performance","Tuning hyperparameters and model selection","Increasing training data size"],
    correct:2 },
  { id:"mc6", section:"Deep Learning",
    q:"LSTMs were designed to solve:",
    options:["High memory usage in CNNs","The vanishing gradient problem in RNNs","Overfitting in feedforward networks","Class imbalance in sequence data"],
    correct:1 },
  { id:"mc7", section:"ML Framing",
    q:"Regularisation techniques such as L1 and L2 primarily help with:",
    options:["Reducing training time","Increasing model complexity","Preventing overfitting","Handling missing data"],
    correct:2 },
  { id:"mc8", section:"Data Prep",
    q:"Which of the following is a hyperparameter (not a model parameter)?",
    options:["Neural network weights","Decision tree leaf values","Learning rate","Regression coefficients"],
    correct:2 },
  { id:"mc9", section:"Evaluation",
    q:"In k-fold cross-validation with k=5, each observation is used for validation:",
    options:["Once","Twice","Five times","k-1 times"],
    correct:0 },
  { id:"mc10", section:"Supervised",
    q:"Which algorithm finds the hyperplane that maximises the margin between classes?",
    options:["Decision Tree","K-Nearest Neighbours","Support Vector Machine","Linear Regression"],
    correct:2 },
];

const TF_QUESTIONS = [
  { id:"tf1", section:"ML Framing",
    q:"A model with high bias is more likely to overfit the training data.",
    correct:false },
  { id:"tf2", section:"Evaluation",
    q:"The ROC curve plots True Positive Rate against False Positive Rate.",
    correct:true },
  { id:"tf3", section:"Data Prep",
    q:"The test set should be used to tune model hyperparameters.",
    correct:false },
  { id:"tf4", section:"Deep Learning",
    q:"LSTM networks contain gating mechanisms to control memory flow.",
    correct:true },
  { id:"tf5", section:"Evaluation",
    q:"F1 score is the arithmetic mean of precision and recall.",
    correct:false },
  { id:"tf6", section:"Supervised",
    q:"In k-fold cross-validation, a higher k value always leads to a better model.",
    correct:false },
  { id:"tf7", section:"Data Prep",
    q:"PCA components are always orthogonal to each other.",
    correct:true },
  { id:"tf8", section:"ML Framing",
    q:"Regularisation always reduces model performance on the training set.",
    correct:true },
];

const WRITTEN_QUESTIONS = [
  { id:"wr1", section:"ML Framing",
    q:"Explain the bias-variance tradeoff in your own words. Why does it matter when selecting a model?",
    keywords:["bias","variance","overfitting","underfitting","complexity","generalise"],
    ideal:"High bias means the model is too simple and underfits (misses patterns). High variance means the model is too complex and overfits (memorises noise). The tradeoff is finding a complexity level that minimises total error: Bias² + Variance + irreducible noise. This matters because you want a model that generalises well, not just one that performs well on training data." },
  { id:"wr2", section:"Evaluation",
    q:"A medical diagnostic model achieves 99% accuracy but only 30% recall on positive cases. Is this a good model? Explain your reasoning.",
    keywords:["class imbalance","recall","false negative","positive","accuracy","misleading"],
    ideal:"No. High accuracy here is misleading — it likely results from class imbalance (e.g. 99% negative cases). With only 30% recall, the model misses 70% of actual positive cases (false negatives), which is catastrophic in medical settings where missing a diagnosis has severe consequences. Recall should be the primary metric here." },
  { id:"wr3", section:"Data Prep",
    q:"Why is it important to perform feature scaling before applying PCA or gradient-based models?",
    keywords:["scale","variance","dominate","gradient","PCA","normalise","standardise"],
    ideal:"Without scaling, features with large magnitudes dominate the variance calculation (PCA) or cause unstable gradient updates. PCA finds axes of maximum variance — if one feature is in thousands and another in fractions, PCA will prioritise the larger one regardless of actual importance. Similarly, gradient descent converges faster and more stably when features are on similar scales." },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function fmtTime(s) {
  const m = Math.floor(s/60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2,"0")}`;
}

// ── STEPPER ───────────────────────────────────────────────────────────────────
function Stepper({ label, value, min, max, onChange, color, t }) {
  const capped = value >= max && max > 0;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", background:t.surface, border:`1px solid ${capped ? color+"40" : t.border}`, borderRadius:12, transition:"border-color .2s" }}>
      <p style={{ fontSize:13, fontWeight:700, color:t.text }}>{label}</p>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={()=>onChange(Math.max(min,value-1))} style={{ width:28,height:28,borderRadius:"50%",background:t.surface2,border:`1px solid ${t.border}`,cursor:value<=min?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:value<=min?t.border2:t.textSub,transition:"border-color .15s,color .15s",opacity:value<=min?0.4:1 }}
          onMouseEnter={e=>{ if(value>min){e.currentTarget.style.borderColor=color;e.currentTarget.style.color=color;} }}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.textSub;}}>
          <Minus size={12}/>
        </button>
        {/* value / max fraction */}
        <div style={{ display:"flex", alignItems:"baseline", gap:2, minWidth:48, justifyContent:"center" }}>
          <span style={{ fontSize:18, fontWeight:800, color, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</span>
          <span style={{ fontSize:11, color:t.textMuted, fontWeight:600 }}>/{max}</span>
        </div>
        <button onClick={()=>onChange(Math.min(max,value+1))} style={{ width:28,height:28,borderRadius:"50%",background:t.surface2,border:`1px solid ${t.border}`,cursor:value>=max?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:value>=max?t.border2:t.textSub,transition:"border-color .15s,color .15s",opacity:value>=max?0.4:1 }}
          onMouseEnter={e=>{ if(value<max){e.currentTarget.style.borderColor=color;e.currentTarget.style.color=color;} }}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.textSub;}}>
          <Plus size={12}/>
        </button>
      </div>
    </div>
  );
}

// ── TOGGLE ROW ────────────────────────────────────────────────────────────────
function ToggleRow({ label, sub, checked, onChange, color, t }) {
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:t.surface,border:`1px solid ${checked?color+"45":t.border}`,borderRadius:12,cursor:"pointer",transition:"border-color .2s" }} onClick={()=>onChange(!checked)}>
      <div>
        <p style={{ fontSize:13,fontWeight:700,color:t.text,marginBottom:sub?2:0 }}>{label}</p>
        {sub && <p style={{ fontSize:11,color:t.textMuted }}>{sub}</p>}
      </div>
      <div style={{ width:40,height:22,borderRadius:99,background:checked?color:t.border,position:"relative",transition:"background .22s",flexShrink:0 }}>
        <div style={{ position:"absolute",top:3,left:checked?21:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .22s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:"0 1px 4px rgba(0,0,0,.15)" }}/>
      </div>
    </div>
  );
}

// ── ALL SECTIONS ─────────────────────────────────────────────────────────────
const ALL_SECTIONS = ["ML Framing","Data Prep","Evaluation","Supervised","Deep Learning"];

const SECTION_COLORS = {
  "ML Framing":   C.accent,
  "Data Prep":    C.blue,
  "Evaluation":   C.gold,
  "Supervised":   C.green,
  "Deep Learning":C.purple,
};

// ── CONFIGURATOR ──────────────────────────────────────────────────────────────
function Configurator({ onStart, t }) {
  const [activeSections, setActiveSections] = useState(new Set(ALL_SECTIONS));
  const [mcCount,   setMcCount]   = useState(10);
  const [tfCount,   setTfCount]   = useState(5);
  const [wrCount,   setWrCount]   = useState(2);
  const [minutes,   setMinutes]   = useState(30);
  const [shuffleQ,  setShuffleQ]  = useState(true);
  const [showTimer, setShowTimer] = useState(true);

  // Dynamic available counts based on selected sections
  const availMC = MC_QUESTIONS.filter(q => activeSections.has(q.section)).length;
  const availTF = TF_QUESTIONS.filter(q => activeSections.has(q.section)).length;
  const availWR = WRITTEN_QUESTIONS.filter(q => activeSections.has(q.section)).length;

  // Clamp counts when sections change
  const safeMc = Math.min(mcCount, availMC);
  const safeTf = Math.min(tfCount, availTF);
  const safeWr = Math.min(wrCount, availWR);
  const totalQ = safeMc + safeTf + safeWr;
  const canStart = totalQ > 0 && activeSections.size > 0;

  const toggleSection = (sec) => {
    setActiveSections(prev => {
      const next = new Set(prev);
      if (next.has(sec)) { if (next.size > 1) next.delete(sec); }
      else next.add(sec);
      return next;
    });
  };

  const buildExam = () => {
    const filtered = (pool) => pool.filter(q => activeSections.has(q.section));
    const mc = shuffle(filtered(MC_QUESTIONS)).slice(0, safeMc).map(q => ({ ...q, type:"mc" }));
    const tf = shuffle(filtered(TF_QUESTIONS)).slice(0, safeTf).map(q => ({ ...q, type:"tf" }));
    const wr = shuffle(filtered(WRITTEN_QUESTIONS)).slice(0, safeWr).map(q => ({ ...q, type:"written" }));
    const combined = shuffleQ ? shuffle([...mc, ...tf, ...wr]) : [...mc, ...tf, ...wr];
    onStart({ questions: combined, minutes, showTimer });
  };

  // Section stats: how many questions available per section across all types
  const sectionStats = ALL_SECTIONS.map(sec => ({
    sec,
    mc: MC_QUESTIONS.filter(q=>q.section===sec).length,
    tf: TF_QUESTIONS.filter(q=>q.section===sec).length,
    wr: WRITTEN_QUESTIONS.filter(q=>q.section===sec).length,
  }));

  return (
    <div style={{ maxWidth:520, margin:"0 auto", padding:"36px 24px 80px", animation:"fadeUp .32s ease both" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:24, fontWeight:700, letterSpacing:"-0.3px", marginBottom:6 }}>
          Configure your exam
        </h1>
        <p style={{ fontSize:14, color:t.textSub, lineHeight:1.6 }}>
          Choose which topics to include, set the question mix, and time limit.
        </p>
      </div>

      {/* ── SECTION PICKER ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted }}>TOPICS</p>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setActiveSections(new Set(ALL_SECTIONS))} style={{ fontSize:11, fontWeight:700, color:C.accent, background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',system-ui" }}>All</button>
            <span style={{ color:t.border2 }}>·</span>
            <button onClick={()=>setActiveSections(new Set([ALL_SECTIONS[0]]))} style={{ fontSize:11, fontWeight:700, color:t.textMuted, background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',system-ui" }}>None</button>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {sectionStats.map(({ sec, mc, tf, wr }) => {
            const active = activeSections.has(sec);
            const color  = SECTION_COLORS[sec];
            const total  = mc + tf + wr;
            return (
              <div
                key={sec}
                onClick={() => toggleSection(sec)}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"11px 14px",
                  background: active ? `${color}0e` : t.surface,
                  border: `1.5px solid ${active ? color+"50" : t.border}`,
                  borderRadius:11, cursor:"pointer",
                  transition:"all .15s",
                  opacity: active ? 1 : 0.55,
                }}
                onMouseEnter={e=>{ if(!active) e.currentTarget.style.opacity="0.75"; }}
                onMouseLeave={e=>{ if(!active) e.currentTarget.style.opacity="0.55"; }}
              >
                {/* Checkbox */}
                <div style={{
                  width:18, height:18, borderRadius:5, flexShrink:0,
                  background: active ? color : "transparent",
                  border: `1.5px solid ${active ? color : t.border2}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all .15s",
                }}>
                  {active && <Check size={11} color="#fff" strokeWidth={3}/>}
                </div>

                {/* Section name */}
                <span style={{ fontSize:13, fontWeight:700, color: active ? t.text : t.textSub, flex:1 }}>{sec}</span>

                {/* Question count pills */}
                <div style={{ display:"flex", gap:5 }}>
                  {mc>0 && <span style={{ fontSize:10, fontWeight:700, color:active?C.accent:t.textMuted, background:active?C.accentBg:t.surface2, border:`1px solid ${active?C.accent+"30":t.border}`, borderRadius:20, padding:"1px 7px", transition:"all .15s" }}>{mc} MC</span>}
                  {tf>0 && <span style={{ fontSize:10, fontWeight:700, color:active?C.blue:t.textMuted,   background:active?C.blueBg:t.surface2,   border:`1px solid ${active?C.blue+"30":t.border}`,   borderRadius:20, padding:"1px 7px", transition:"all .15s" }}>{tf} T/F</span>}
                  {wr>0 && <span style={{ fontSize:10, fontWeight:700, color:active?C.purple:t.textMuted, background:active?C.purpleBg:t.surface2, border:`1px solid ${active?C.purple+"30":t.border}`, borderRadius:20, padding:"1px 7px", transition:"all .15s" }}>{wr} W</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* no extra summary row - pills above already show available counts */}
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ flex:1, height:1, background:t.border }}/>
      </div>

      {/* ── QUESTION MIX ── */}
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:10 }}>QUESTION MIX</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <Stepper label="Multiple choice" value={safeMc} min={0} max={availMC} onChange={v => setMcCount(v)} color={C.accent} t={t}/>
          <Stepper label="True / False"    value={safeTf} min={0} max={availTF} onChange={v => setTfCount(v)} color={C.blue}   t={t}/>
          <Stepper label="Written"         value={safeWr} min={0} max={availWR} onChange={v => setWrCount(v)} color={C.purple} t={t}/>
        </div>

        {/* Total preview — merged, no duplicate available row */}
        <div style={{ marginTop:12, padding:"12px 16px", background:t.surface2, borderRadius:10, display:"flex", alignItems:"center", gap:0 }}>
          {[
            { label:"Total",   val:totalQ, color:t.text,   border:true  },
            { label:"MC",      val:safeMc, color:C.accent, border:true  },
            { label:"T/F",     val:safeTf, color:C.blue,   border:true  },
            { label:"Written", val:safeWr, color:C.purple, border:false },
          ].map(({label,val,color,border})=>(
            <div key={label} style={{ flex:1, textAlign:"center", borderRight:border?`1px solid ${t.border}`:"none", padding:"0 8px" }}>
              <p style={{ fontSize:20, fontWeight:800, color, letterSpacing:"-0.5px", lineHeight:1 }}>{val}</p>
              <p style={{ fontSize:10, color:t.textMuted, marginTop:3 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TIME ── */}
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:10 }}>TIME LIMIT</p>
        <Stepper label={`${minutes} minutes`} value={minutes} min={5} max={180} onChange={setMinutes} color={C.gold} t={t}/>
        <p style={{ fontSize:11, color:t.textMuted, marginTop:7, paddingLeft:2 }}>
          ≈ {totalQ > 0 ? Math.round((minutes*60)/totalQ) : "—"}s per question
        </p>
      </div>

      {/* ── OPTIONS ── */}
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:10 }}>OPTIONS</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <ToggleRow label="Show timer" sub="Visible countdown during the exam" checked={showTimer} onChange={setShowTimer} color={C.gold} t={t}/>
          <ToggleRow label="Shuffle questions" sub="Randomise the order" checked={shuffleQ} onChange={setShuffleQ} color={C.green} t={t}/>
        </div>
      </div>

      {safeWr > 0 && (
        <div style={{ background:C.purpleBg, border:`1px solid ${C.purple}35`, borderRadius:10, padding:"11px 14px", marginBottom:24, display:"flex", gap:10 }}>
          <Sparkles size={14} style={{ color:C.purple, flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:12, color:t.textSub, lineHeight:1.6 }}>
            Written answers are AI-evaluated after submission. You'll see a score and feedback once the exam ends.
          </p>
        </div>
      )}

      <button
        onClick={buildExam}
        disabled={!canStart}
        style={{
          width:"100%", padding:"15px",
          background:canStart?C.accent:t.border,
          color:canStart?"#fff":t.textMuted,
          border:"none", borderRadius:12,
          fontSize:15, fontWeight:700, cursor:canStart?"pointer":"not-allowed",
          fontFamily:"'DM Sans',system-ui",
          display:"flex", alignItems:"center", justifyContent:"center", gap:9,
          transition:"background .15s, transform .12s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onMouseEnter={e=>{ if(canStart){e.currentTarget.style.background=C.accentHov;e.currentTarget.style.transform="translateY(-1px)";}}}
        onMouseLeave={e=>{ if(canStart){e.currentTarget.style.background=C.accent;e.currentTarget.style.transform="none";}}}
      >
        <Play size={16}/> Start exam · {totalQ} question{totalQ!==1?"s":""}
      </button>
    </div>
  );
}

// ── QUESTION COMPONENTS ───────────────────────────────────────────────────────
function McQuestion({ q, answer, onAnswer, submitted, t }) {
  const labels = ["A","B","C","D"];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {q.options.map((opt,i) => {
        const isSel = answer===i;
        const isCorr = submitted && i===q.correct;
        const isWrong = submitted && isSel && i!==q.correct;
        let bg=t.surface, border=`1.5px solid ${t.border}`, labelBg=t.surface2, labelColor=t.textMuted;
        if (isCorr)       { bg=C.greenBg; border=`2px solid ${C.green}60`; labelBg=C.green; labelColor="#fff"; }
        else if (isWrong) { bg=C.redBg;   border=`2px solid ${C.red}55`;   labelBg=C.red;   labelColor="#fff"; }
        else if (isSel)   { bg=C.accentBg2; border=`2px solid ${C.accent}`; labelBg=C.accent; labelColor="#fff"; }
        return (
          <button key={i} onClick={()=>!submitted&&onAnswer(i)} style={{ background:bg, border, borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"flex-start", gap:12, cursor:submitted?"default":"pointer", textAlign:"left", width:"100%", transition:"all .15s" }}>
            <span style={{ width:26,height:26,borderRadius:7,background:labelBg,color:labelColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0,transition:"all .15s" }}>{labels[i]}</span>
            <span style={{ fontSize:14, lineHeight:1.55, color:t.text, flex:1, fontWeight:isSel||isCorr?600:400 }}>{opt}
              {isCorr&&!isWrong&&<span style={{ marginLeft:6, fontSize:11, color:C.green, fontWeight:700 }}>✓ correct</span>}
              {isWrong&&<span style={{ marginLeft:6, fontSize:11, color:C.red, fontWeight:700 }}>✗ your answer</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TfQuestion({ q, answer, onAnswer, submitted, t }) {
  return (
    <div style={{ display:"flex", gap:10 }}>
      {[true,false].map(val => {
        const isSel = answer===val;
        const isCorr = submitted && val===q.correct;
        const isWrong = submitted && isSel && val!==q.correct;
        let bg=t.surface, border=`1.5px solid ${t.border}`, textColor=t.textSub;
        if (isCorr)       { bg=C.greenBg; border=`2px solid ${C.green}60`; textColor=C.green; }
        else if (isWrong) { bg=C.redBg;   border=`2px solid ${C.red}55`;   textColor=C.red;   }
        else if (isSel)   { bg=C.accentBg2; border=`2px solid ${C.accent}`; textColor=C.accent; }
        return (
          <button key={String(val)} onClick={()=>!submitted&&onAnswer(val)} style={{ flex:1, background:bg, border, borderRadius:12, padding:"16px", cursor:submitted?"default":"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:"all .15s" }}>
            <div style={{ width:36,height:36,borderRadius:"50%",background:isSel||isCorr?textColor+"22":t.surface2,border:`1.5px solid ${isSel||isCorr?textColor:t.border}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s" }}>
              {val ? <Check size={18} style={{color:isSel||isCorr?textColor:t.textMuted}}/> : <X size={18} style={{color:isSel||isCorr?textColor:t.textMuted}}/>}
            </div>
            <span style={{ fontSize:14, fontWeight:700, color:textColor }}>{val?"True":"False"}</span>
            {isCorr && <span style={{ fontSize:10, color:C.green, fontWeight:700 }}>correct</span>}
          </button>
        );
      })}
    </div>
  );
}

function WrittenQuestion({ q, answer, onAnswer, submitted, evalResult, t }) {
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current){ref.current.style.height="auto";ref.current.style.height=ref.current.scrollHeight+"px"; }}, [answer]);
  const wc = (answer||"").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Hint card */}
      <div style={{ background:C.purpleBg, border:`1px solid ${C.purple}30`, borderRadius:10, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start" }}>
        <PenLine size={13} style={{ color:C.purple, flexShrink:0, marginTop:1 }}/>
        <p style={{ fontSize:12, color:t.textSub, lineHeight:1.5 }}>
          Write a complete answer in your own words. Aim for at least 3–4 sentences. AI will evaluate after submission.
        </p>
      </div>

      {/* Textarea */}
      <div style={{ background:t.surface, border:`1.5px solid ${submitted ? t.border : C.purple+"55"}`, borderRadius:12, overflow:"hidden", transition:"border-color .15s" }}>
        <textarea
          ref={ref}
          value={answer||""}
          onChange={e=>!submitted&&onAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer here…"
          rows={5}
          style={{
            width:"100%", background:"transparent",
            border:"none", outline:"none",
            padding:"14px 16px",
            fontSize:15, fontFamily:"'Lora',Georgia,serif",
            color:t.text, lineHeight:1.75, resize:"none",
            display:"block",
          }}
          onFocus={e=>{ const p=e.target.closest("div"); if(p&&!submitted) p.style.borderColor=C.purple; }}
          onBlur={e=>{  const p=e.target.closest("div"); if(p&&!submitted) p.style.borderColor=C.purple+"55"; }}
        />
        <div style={{ padding:"8px 16px 10px", borderTop:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, color:t.textMuted }}>{wc} word{wc!==1?"s":""}</span>
          {wc > 0 && wc < 20 && !submitted && <span style={{ fontSize:11, color:C.gold, fontWeight:600 }}>Aim for more detail</span>}
          {wc >= 20 && !submitted && <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>Good length</span>}
        </div>
      </div>

      {/* AI eval result */}
      {submitted && evalResult && (
        <div style={{ background:evalResult.grade==="correct"?C.greenBg:evalResult.grade==="partial"?C.goldBg:C.redBg, border:`1px solid ${evalResult.grade==="correct"?C.green:evalResult.grade==="partial"?C.gold:C.red}35`, borderLeft:`3px solid ${evalResult.grade==="correct"?C.green:evalResult.grade==="partial"?C.gold:C.red}`, borderRadius:"0 10px 10px 0", padding:"12px 14px", animation:"fadeDown .22s ease" }}>
          <p style={{ fontSize:11,fontWeight:800,letterSpacing:"0.5px",color:evalResult.grade==="correct"?C.green:evalResult.grade==="partial"?C.gold:C.red,marginBottom:5 }}>
            {evalResult.grade==="correct"?"AI EVALUATION: CORRECT":evalResult.grade==="partial"?"AI EVALUATION: PARTIAL CREDIT":"AI EVALUATION: NEEDS IMPROVEMENT"}
          </p>
          <p style={{ fontSize:13,color:t.textSub,lineHeight:1.6,marginBottom:8 }}>{evalResult.feedback}</p>
          <details>
            <summary style={{ fontSize:12,fontWeight:700,color:t.textSub,cursor:"pointer" }}>See ideal answer</summary>
            <p style={{ fontSize:13,color:t.textSub,lineHeight:1.65,marginTop:8,fontStyle:"italic",fontFamily:"'Lora',serif" }}>{q.ideal}</p>
          </details>
        </div>
      )}
    </div>
  );
}

function evalWritten(answer, q) {
  const lower = (answer||"").toLowerCase();
  const hits = q.keywords.filter(k=>lower.includes(k));
  const pct = hits.length/q.keywords.length;
  const wc = (answer||"").trim().split(/\s+/).filter(Boolean).length;
  if (wc<15) return { grade:"incorrect", feedback:"Answer too brief — aim for at least 2–3 sentences.", score:0 };
  if (pct>=0.6) return { grade:"correct",  feedback:`Strong answer. You covered the key ideas: ${hits.map(k=>`"${k}"`).join(", ")}.`, score:2 };
  if (pct>=0.3) return { grade:"partial",  feedback:`Partially correct. You mentioned ${hits.length}/${q.keywords.length} key concepts. Consider also discussing: ${q.keywords.filter(k=>!lower.includes(k)).slice(0,3).map(k=>`"${k}"`).join(", ")}.`, score:1 };
  return { grade:"incorrect", feedback:"The key concepts are missing. Review the material and try again.", score:0 };
}

// ── EXAM SESSION ──────────────────────────────────────────────────────────────
function ExamSession({ config, onEnd, t }) {
  const { questions, minutes, showTimer } = config;
  const [idx,      setIdx]      = useState(0);
  const [answers,  setAnswers]  = useState({});   // { id: value }
  const [flagged,  setFlagged]  = useState({});   // { id: bool }
  const [timeLeft, setTimeLeft] = useState(minutes*60);
  const [submitted, setSubmitted] = useState(false);
  const [evalResults, setEvalResults] = useState({});
  const [phase, setPhase] = useState("idle");

  const q = questions[idx];
  const isAnswered = answers[q.id] !== undefined;
  const isFlagged  = !!flagged[q.id];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount  = Object.values(flagged).filter(Boolean).length;

  // Timer
  useEffect(()=>{
    if (submitted) return;
    const iv = setInterval(()=>{
      setTimeLeft(t=>{ if(t<=1){ clearInterval(iv); handleSubmitAll(); return 0; } return t-1; });
    }, 1000);
    return ()=>clearInterval(iv);
  }, [submitted]);

  const timerColor = timeLeft < 120 ? C.red : timeLeft < 300 ? C.gold : C.green;

  const handleSubmitAll = useCallback(()=>{
    const evals = {};
    questions.filter(q=>q.type==="written").forEach(q=>{
      evals[q.id] = evalWritten(answers[q.id], q);
    });
    setEvalResults(evals);
    setSubmitted(true);
  }, [questions, answers]);

  const navigate = (dir) => {
    const next = idx + dir;
    if (next<0||next>=questions.length) return;
    setPhase(dir>0?"out-left":"out-right");
    setTimeout(()=>{ setIdx(next); setPhase("in"); requestAnimationFrame(()=>requestAnimationFrame(()=>setPhase("idle"))); }, 200);
  };

  const typeLabel = { mc:"MULTIPLE CHOICE", tf:"TRUE / FALSE", written:"WRITTEN" };
  const typeColor = { mc:C.accent, tf:C.blue, written:C.purple };

  const phaseStyle = {
    idle:       {opacity:1,transform:"translateX(0) scale(1)"},
    "out-left": {opacity:0,transform:"translateX(-40px) scale(0.97)"},
    "out-right":{opacity:0,transform:"translateX(40px) scale(0.97)"},
    in:         {opacity:0,transform:"translateX(0) scale(0.98)"},
  }[phase]||{};
  const phaseTr = phase==="idle"
    ?"opacity .28s ease, transform .3s cubic-bezier(0.22,1,0.36,1)"
    :phase==="in"?"none":"opacity .18s, transform .2s ease";

  // Results summary
  if (submitted) {
    const mcScore  = questions.filter(q=>q.type==="mc").filter(q=>answers[q.id]===q.correct).length;
    const tfScore  = questions.filter(q=>q.type==="tf").filter(q=>answers[q.id]===q.correct).length;
    const wrScore  = Object.values(evalResults).reduce((a,r)=>a+r.score,0);
    const wrMax    = questions.filter(q=>q.type==="written").length * 2;
    const mcMax    = questions.filter(q=>q.type==="mc").length;
    const tfMax    = questions.filter(q=>q.type==="tf").length;
    const totalPts = mcScore + tfScore + wrScore;
    const maxPts   = mcMax + tfMax + wrMax;
    const pct      = maxPts>0 ? Math.round((totalPts/maxPts)*100) : 0;
    const grade    = pct>=85?"Excellent":pct>=70?"Good":pct>=55?"Passing":"Needs work";
    const gradeCol = pct>=85?C.green:pct>=70?C.blue:pct>=55?C.gold:C.red;

    return (
      <div style={{ maxWidth:560, margin:"0 auto", padding:"40px 24px 80px", animation:"fadeUp .36s ease" }}>
        {/* Score hero */}
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:18, padding:"28px 24px", textAlign:"center", marginBottom:20 }}>
          <p style={{ fontSize:32, marginBottom:10 }}>{pct>=85?"🏆":pct>=70?"👍":pct>=55?"📈":"💪"}</p>
          <h2 style={{ fontFamily:"'Lora',serif", fontSize:24, fontWeight:700, marginBottom:6 }}>{grade}</h2>
          <p style={{ fontSize:38, fontWeight:800, color:gradeCol, letterSpacing:"-1px", lineHeight:1 }}>{pct}%</p>
          <p style={{ fontSize:13, color:t.textSub, marginTop:6 }}>{totalPts} / {maxPts} points</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:20, flexWrap:"wrap" }}>
            {mcMax>0&&<div style={{ background:C.accentBg, borderRadius:10, padding:"10px 16px" }}><p style={{ fontSize:18,fontWeight:800,color:C.accent }}>{mcScore}/{mcMax}</p><p style={{ fontSize:10,color:C.accent,fontWeight:700 }}>MC</p></div>}
            {tfMax>0&&<div style={{ background:C.blueBg,   borderRadius:10, padding:"10px 16px" }}><p style={{ fontSize:18,fontWeight:800,color:C.blue   }}>{tfScore}/{tfMax}</p><p style={{ fontSize:10,color:C.blue,  fontWeight:700 }}>T/F</p></div>}
            {wrMax>0&&<div style={{ background:C.purpleBg, borderRadius:10, padding:"10px 16px" }}><p style={{ fontSize:18,fontWeight:800,color:C.purple }}>{wrScore}/{wrMax}</p><p style={{ fontSize:10,color:C.purple,fontWeight:700 }}>Written</p></div>}
          </div>
        </div>

        {/* Per-question review */}
        <p style={{ fontSize:11,fontWeight:800,letterSpacing:"0.7px",color:t.textMuted,marginBottom:12 }}>QUESTION REVIEW</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
          {questions.map((q,i)=>{
            let correct=false;
            if(q.type==="mc"||q.type==="tf") correct = answers[q.id]===q.correct;
            else correct = evalResults[q.id]?.grade==="correct";
            const partial = q.type==="written" && evalResults[q.id]?.grade==="partial";
            const col = correct?C.green:partial?C.gold:C.red;
            return (
              <div key={q.id} style={{ background:t.surface, border:`1px solid ${t.border}`, borderLeft:`3px solid ${col}`, borderRadius:"0 10px 10px 0", padding:"12px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:10,fontWeight:800,color:t.textMuted,flexShrink:0,minWidth:20 }}>#{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                    <span style={{ fontSize:10,fontWeight:700,color:typeColor[q.type],background:`${typeColor[q.type]}14`,border:`1px solid ${typeColor[q.type]}28`,borderRadius:20,padding:"1px 7px" }}>{typeLabel[q.type]}</span>
                    {correct?<CheckCircle2 size={13} style={{color:C.green}}/>:partial?<span style={{fontSize:11,color:C.gold,fontWeight:700}}>Partial</span>:<XCircle size={13} style={{color:C.red}}/>}
                  </div>
                  <p style={{ fontSize:12,color:t.textSub,lineHeight:1.4 }}>{q.q}</p>
                  {q.type==="written"&&evalResults[q.id]&&<p style={{ fontSize:11,color:t.textMuted,marginTop:3 }}>{evalResults[q.id].feedback}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onEnd} style={{ flex:1,padding:"13px",background:C.accent,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',system-ui",display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
            <RotateCcw size={14}/> New exam
          </button>
          <button onClick={onEnd} style={{ flex:1,padding:"13px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",color:t.text,fontFamily:"'DM Sans',system-ui" }}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"28px 24px 100px" }}>
      {/* Progress + timer */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ flex:1, height:3, background:t.border, borderRadius:99, overflow:"hidden" }}>
          <div style={{ width:`${((idx+1)/questions.length)*100}%`,height:"100%",background:C.accent,borderRadius:99,transition:"width .4s cubic-bezier(0.22,1,0.36,1)" }}/>
        </div>
        <span style={{ fontSize:12,fontWeight:600,color:t.textMuted,whiteSpace:"nowrap" }}>{idx+1}/{questions.length}</span>
        {showTimer && (
          <div style={{ display:"flex",alignItems:"center",gap:5,background:timeLeft<120?C.redBg:t.surface2,border:`1px solid ${timeLeft<120?C.red+"40":t.border}`,borderRadius:8,padding:"4px 10px",transition:"all .3s" }}>
            <Clock size={12} style={{color:timerColor}}/>
            <span style={{ fontSize:13,fontWeight:800,color:timerColor,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.3px" }}>{fmtTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <span style={{ fontSize:11,color:t.textMuted }}>{answeredCount}/{questions.length} answered</span>
        {flaggedCount>0&&<span style={{ fontSize:11,color:C.gold,fontWeight:700,display:"flex",alignItems:"center",gap:3 }}><Flag size={10}/>{flaggedCount} flagged</span>}
      </div>

      {/* Question card */}
      <div key={q.id} style={{ ...phaseStyle, transition:phaseTr }}>
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, overflow:"hidden", marginBottom:16 }}>
          {/* Card header */}
          <div style={{ padding:"16px 20px 14px", borderBottom:`1px solid ${t.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:10,fontWeight:800,letterSpacing:"0.7px",color:typeColor[q.type] }}>{typeLabel[q.type]}</span>
                <span style={{ fontSize:10,color:t.textMuted }}>{q.section}</span>
              </div>
              <button onClick={()=>setFlagged(p=>({...p,[q.id]:!p[q.id]}))} style={{ background:isFlagged?C.goldBg:"none",border:`1px solid ${isFlagged?C.gold+"50":t.border}`,borderRadius:7,padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:isFlagged?C.gold:t.textMuted,fontSize:11,fontWeight:700,fontFamily:"inherit",transition:"all .15s" }}>
                <Flag size={11}/>{isFlagged?"Flagged":"Flag"}
              </button>
            </div>
            <h2 style={{ fontFamily:"'Lora',serif", fontSize:18,fontWeight:700,lineHeight:1.48,color:t.text }}>{q.q}</h2>
          </div>

          <div style={{ padding:"18px 20px" }}>
            {q.type==="mc" && <McQuestion q={q} answer={answers[q.id]} onAnswer={v=>setAnswers(p=>({...p,[q.id]:v}))} submitted={false} t={t}/>}
            {q.type==="tf" && <TfQuestion q={q} answer={answers[q.id]} onAnswer={v=>setAnswers(p=>({...p,[q.id]:v}))} submitted={false} t={t}/>}
            {q.type==="written" && <WrittenQuestion q={q} answer={answers[q.id]} onAnswer={v=>setAnswers(p=>({...p,[q.id]:v}))} submitted={false} evalResult={null} t={t}/>}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:t.bg,borderTop:`1px solid ${t.border}`,padding:"12px 20px 20px" }}>
        <div style={{ maxWidth:640,margin:"0 auto",display:"flex",gap:10 }}>
          <button onClick={()=>navigate(-1)} disabled={idx===0} style={{ width:48,height:48,borderRadius:10,border:`1px solid ${t.border}`,background:t.surface,cursor:idx===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:t.textSub,opacity:idx===0?0.35:1,flexShrink:0 }}>
            <ChevronLeft size={18}/>
          </button>
          {idx < questions.length-1 ? (
            <button onClick={()=>navigate(1)} style={{ flex:1,height:48,background:C.accent,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',system-ui",display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"background .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.accentHov}
              onMouseLeave={e=>e.currentTarget.style.background=C.accent}>
              Next <ChevronRight size={16}/>
            </button>
          ) : (
            <button onClick={handleSubmitAll} style={{ flex:1,height:48,background:C.green,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',system-ui",display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
              <CheckCircle2 size={16}/> Submit exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function ExamSimulation() {
  const [dark, setDark]   = useState(false);
  const [phase, setPhase] = useState("config"); // config | exam
  const [config, setConfig] = useState(null);
  const t = dark ? DARK : LIGHT;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none}}
        textarea{font-family:'Lora',Georgia,serif}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${dark?"#333":"#ddd"};border-radius:10px}
        details summary::-webkit-details-marker{display:none}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background 0.3s" }}>
        <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", gap:12, position:"sticky", top:0, zIndex:100 }}>
          <button onClick={()=>{ if(phase==="exam"){ if(window.confirm("Exit exam? Your progress will be lost.")) setPhase("config"); } }} style={{ background:"none",border:"none",cursor:"pointer",color:t.textSub,display:"flex",padding:4 }}>
            <ArrowLeft size={18}/>
          </button>
          <span style={{ fontWeight:800,fontSize:14 }}>
            {phase==="config" ? "Exam Simulation" : "Exam in progress"}
          </span>
          {phase==="exam" && (
            <span style={{ fontSize:12,color:t.textMuted,background:C.redBg,border:`1px solid ${C.red}30`,borderRadius:20,padding:"3px 10px",fontWeight:700,color:C.red }}>
              No going back
            </span>
          )}
          <div style={{ marginLeft:"auto" }}>
            <button onClick={()=>setDark(d=>!d)} style={{ background:t.surface2,border:`1px solid ${t.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:t.textSub,fontSize:12,fontWeight:600 }}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        {phase==="config" && <Configurator onStart={cfg=>{ setConfig(cfg); setPhase("exam"); }} t={t}/>}
        {phase==="exam"   && <ExamSession  config={config} onEnd={()=>setPhase("config")} t={t}/>}
      </div>
    </>
  );
}
