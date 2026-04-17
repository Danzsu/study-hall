import { useState } from "react";
import {
  BookOpen, ChevronLeft, ChevronRight,
  Moon, Sun, Check, HelpCircle,
  Tag, Eye, EyeOff, Bookmark, BookmarkCheck
} from "lucide-react";

const C = {
  accent: "#E07355", accentHov: "#C85E40",
  accentBg: "rgba(224,115,85,0.10)", accentBg2: "rgba(224,115,85,0.18)",
  blue: "#4A7FC1", blueBg: "rgba(74,127,193,0.11)",
  green: "#5A9E72", greenBg: "rgba(90,158,114,0.11)",
  gold: "#C49A3C", goldBg: "rgba(196,154,60,0.11)",
  purple: "#9B6DD9", purpleBg: "rgba(155,109,217,0.11)",
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

// ── HIGHLIGHT ─────────────────────────────────────────────────────────────────
function Hl({ children }) {
  const parts = String(children).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <mark key={i} style={{ background: "rgba(224,115,85,0.18)", color: "#E07355", borderBottom: "2px solid #E07355", borderRadius: "3px 3px 0 0", padding: "1px 3px", fontWeight: 700 }}>{p.slice(2,-2)}</mark>;
        if (p.startsWith("*") && p.endsWith("*"))
          return <mark key={i} style={{ background: "rgba(74,127,193,0.11)", color: "#4A7FC1", borderBottom: "2px solid #4A7FC1", borderRadius: "3px 3px 0 0", padding: "1px 3px", fontWeight: 600 }}>{p.slice(1,-1)}</mark>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const TOPICS = ["All", "ML Framing", "Data Prep", "Evaluation", "Supervised", "Deep Learning"];

const QS = [
  {
    id:1, topic:"ML Framing", difficulty:"core", concept:"Bias–Variance Tradeoff",
    q:"What is the bias-variance tradeoff?",
    explanation:"The **bias-variance tradeoff** describes the tension between two sources of error.\n\n**Bias** is error from overly simplistic assumptions — a *high-bias* model underfits, missing real patterns. **Variance** is sensitivity to training data — a *high-variance* model overfits, memorising noise.\n\nTotal error = **Bias²** + **Variance** + irreducible noise. The goal is finding the complexity sweet spot where this sum is minimised.",
    keyPoints:["High bias → underfitting, too simple","High variance → overfitting, too complex","Regularisation reduces variance","More training data reduces variance, not bias"],
    options:["High bias = overfit; high variance = underfit","High bias = underfit; high variance = overfit","Both should be maximised","They are independent"],
    correct:1, related:["Regularisation","Overfitting","Cross-Validation"],
    figure:"BiasVariance",
  },
  {
    id:2, topic:"Data Prep", difficulty:"core", concept:"Train / Val / Test Split",
    q:"Why split data into three sets?",
    explanation:"Each split serves a distinct purpose. The **training set** teaches the model its parameters. The *validation set* acts as a development proxy — tune hyperparameters and compare architectures against it. The **test set** is held back until the very end.\n\nUsing only train/test causes *data leakage*: every adjustment based on test scores implicitly fits to it. The validation set breaks this cycle.\n\nRule of thumb: **70/15/15** split. For small datasets, k-fold cross-validation is preferred.",
    keyPoints:["Training: fit model parameters","Validation: tune hyperparameters","Test: final unbiased estimate only","Never tune on test performance"],
    options:["To increase dataset size","To separate learning, selection, and final evaluation","More splits always help","To balance classes"],
    correct:1, related:["Cross-Validation","Overfitting","Data Leakage"],
    figure:"DataSplit",
  },
  {
    id:3, topic:"Data Prep", difficulty:"core", concept:"PCA",
    q:"What does PCA do and when should you use it?",
    explanation:"**PCA** projects data onto new axes — the **principal components** — ordered by variance explained. The first component captures the most variance, the second captures the most remaining variance *orthogonal* to the first.\n\nYou keep the top *k* components and discard the rest, compressing the data while retaining most information.\n\nUse it when features are highly correlated, the dataset has **high dimensionality**, or you need 2D/3D visualisation. Avoid it when feature interpretability matters.",
    keyPoints:["Projects onto axes of maximum variance","Components are orthogonal (uncorrelated)","Standardise features before applying","Loses some information — choose k carefully"],
    options:["LDA","t-SNE","PCA","UMAP"],
    correct:2, related:["Normalisation","Feature Engineering","Dimensionality Reduction"],
    figure:"PCA",
  },
  {
    id:4, topic:"Evaluation", difficulty:"core", concept:"Precision vs Recall",
    q:"What is the difference between precision and recall?",
    explanation:"**Precision** = TP / (TP + FP). Of everything *predicted positive*, how many actually were? High precision matters when **false positives are costly** — e.g. spam filters.\n\n**Recall** = TP / (TP + FN). Of everything *actually positive*, how many did you find? High recall matters when **false negatives are costly** — e.g. cancer screening.\n\nThe *F1 score* is their harmonic mean: **2 × P × R / (P + R)**. It penalises extreme imbalance between the two.",
    keyPoints:["Precision: quality of positive predictions","Recall: coverage of actual positives","F1 balances precision and recall","Choose based on cost of FP vs FN"],
    options:["They measure the same thing","Precision = quality of positives; recall = coverage of positives","Recall is always higher","Only F1 matters"],
    correct:1, related:["F1 Score","ROC-AUC","Confusion Matrix"],
    figure:"PrecisionRecall",
  },
  {
    id:5, topic:"Evaluation", difficulty:"advanced", concept:"ROC & AUC",
    q:"What does the ROC curve show and how do you interpret AUC?",
    explanation:"The **ROC** curve plots *True Positive Rate* against *False Positive Rate* as the decision threshold varies from 0 to 1.\n\nA **random classifier** gives a diagonal line (AUC = 0.5). A **perfect classifier** reaches the top-left corner (AUC = 1.0).\n\n**AUC** of 0.85 means: given one random positive and one random negative, the model ranks the positive higher *85% of the time*. It is **threshold-independent** and robust to class imbalance.",
    keyPoints:["X-axis: FPR, Y-axis: TPR (recall)","AUC 0.5 = random, 1.0 = perfect","Threshold-independent summary metric","Robust to class imbalance"],
    options:["Training loss over time","TPR vs FPR at all decision thresholds","Multi-class only","AUC > 0.5 = perfect"],
    correct:1, related:["Precision","Recall","Decision Threshold"],
    figure:"ROC",
  },
  {
    id:6, topic:"Supervised", difficulty:"core", concept:"k-Fold Cross-Validation",
    q:"When should you use k-fold cross-validation?",
    explanation:"k-fold is preferred when **data is scarce**. The dataset is split into *k* folds; each fold serves as the validation set once. Final performance = **average across all k runs**.\n\nThis ensures every example is used for both training and validation, reducing the *variance of the performance estimate*. k=5 and k=10 are standard.\n\nDownside: **k× the compute cost**. For very small datasets, *leave-one-out* (k=n) maximises training data but is expensive.",
    keyPoints:["All data used for training and validation","k=5 or k=10 most common","k models trained — more expensive","Better estimate than a single split"],
    options:["Very large datasets","Scarce data, need all examples for both roles","Unlimited compute","Perfectly balanced classes"],
    correct:1, related:["Validation Set","Overfitting","Hyperparameter Tuning"],
    figure:"KFold",
  },
  {
    id:7, topic:"Deep Learning", difficulty:"advanced", concept:"LSTM vs Vanilla RNN",
    q:"What problem do LSTMs solve that vanilla RNNs cannot?",
    explanation:"Standard **RNNs** suffer from the *vanishing gradient problem*: gradients shrink exponentially as they backpropagate through many timesteps, making it impossible to learn **long-range dependencies**.\n\n**LSTMs** introduce three *gating mechanisms*: the **forget gate** (what to discard), the **input gate** (what to store), and the **output gate** (what to pass forward). Together they maintain a *cell state* that carries information across hundreds of timesteps without gradient degradation.",
    keyPoints:["RNNs: vanishing gradient over long sequences","LSTMs: 3 gates control memory flow","Cell state carries long-range information","GRU is a simpler alternative"],
    options:["Computational efficiency","The vanishing gradient problem","Overfitting on small datasets","Multi-class classification"],
    correct:1, related:["Gradient Descent","Backpropagation","GRU","Attention"],
    figure:"LSTM",
  },
  {
    id:8, topic:"Supervised", difficulty:"core", concept:"Hyperparameters vs Parameters",
    q:"What is the difference between a model parameter and a hyperparameter?",
    explanation:"**Parameters** are values the model *learns from data* — neural network weights, regression coefficients. The optimiser finds them automatically.\n\n**Hyperparameters** are set *before training* — learning rate, layer count, regularisation λ, tree depth. They control the learning process itself, not the learned function.\n\nTuning hyperparameters is done against the *validation set*. Common strategies: grid search, random search, **Bayesian optimisation**.",
    keyPoints:["Parameters: learned from data during training","Hyperparameters: set manually before training","Always tune on validation — never test","Bayesian optimisation is most efficient"],
    options:["Learning rate","Number of hidden layers","Model weights after training","Regularisation λ"],
    correct:2, related:["Validation Set","Regularisation","Gradient Descent"],
  },
];

const DIFF_COLORS = {
  core:     { label:"Core",     color:C.blue,   bg:C.blueBg   },
  advanced: { label:"Advanced", color:C.purple, bg:C.purpleBg },
};

// ── FIGURES ───────────────────────────────────────────────────────────────────
function FigBiasVariance({ t }) {
  const cols = [
    { label:"Underfitting", sub:"High bias · Low variance", color:C.blue,
      pts:[[8,42],[20,14],[34,36],[50,10],[66,30],[76,18]],
      path:"M4,42 L78,10" },
    { label:"Sweet spot", sub:"Balanced", color:C.green,
      pts:[[8,42],[20,14],[34,36],[50,10],[66,30],[76,18]],
      path:"M4,40 C18,28 34,8 50,18 S70,14 78,10" },
    { label:"Overfitting", sub:"Low bias · High variance", color:C.accent,
      pts:[[8,42],[20,14],[34,36],[50,10],[66,30],[76,18]],
      path:"M4,42 C10,10 18,44 26,14 S40,38 50,8 S64,30 78,10" },
  ];
  return (
    <div style={{ border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden" }}>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.textMuted, padding:"10px 14px 0" }}>FIGURE · BIAS–VARIANCE SPECTRUM</p>
      <div style={{ display:"flex" }}>
        {cols.map((c,i) => (
          <div key={i} style={{ flex:1, padding:"12px 10px 14px", borderRight:i<2?`1px solid ${t.border}`:"none", textAlign:"center" }}>
            <svg viewBox="0 0 88 54" style={{ width:"100%", maxWidth:100, display:"block", margin:"0 auto 8px" }}>
              {c.pts.map(([x,y],j) => <circle key={j} cx={x} cy={y} r={2.8} fill={t.border2}/>)}
              <path d={c.path} fill="none" stroke={c.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize:12, fontWeight:700, color:c.color, marginBottom:2 }}>{c.label}</p>
            <p style={{ fontSize:10, color:t.textMuted, lineHeight:1.4 }}>{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FigDataSplit({ t }) {
  const segs = [
    { label:"Training",   pct:70, color:C.accent },
    { label:"Validation", pct:15, color:C.blue   },
    { label:"Test",       pct:15, color:C.green  },
  ];
  return (
    <div style={{ border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px" }}>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.textMuted, marginBottom:10 }}>FIGURE · 70 / 15 / 15 SPLIT</p>
      <div style={{ display:"flex", borderRadius:6, overflow:"hidden", height:32, marginBottom:10 }}>
        {segs.map((s,i) => (
          <div key={i} style={{ width:`${s.pct}%`, background:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", borderRight:i<2?"2px solid rgba(255,255,255,0.25)":"none" }}>{s.pct}%</div>
        ))}
      </div>
      <div style={{ display:"flex", gap:14 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color }}/>
            <span style={{ fontSize:11, color:t.textSub }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FigPCA({ t }) {
  return (
    <div style={{ border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px" }}>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.textMuted, marginBottom:10 }}>FIGURE · PCA PROJECTION</p>
      <svg viewBox="0 0 280 130" style={{ width:"100%", display:"block" }}>
        {/* Scatter cloud */}
        {[[50,80],[65,65],[72,72],[80,58],[88,68],[95,52],[105,60],[112,46],[120,55],[128,42],[138,50],[145,36],[155,44],[162,30],[170,40],[178,26]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={3} fill={C.blue} opacity={0.45}/>
        ))}
        {/* PC1 axis — diagonal through the cloud */}
        <line x1={38} y1={95} x2={188} y2={18} stroke={C.accent} strokeWidth={2} strokeLinecap="round" markerEnd="url(#arr)"/>
        {/* PC2 axis — perpendicular */}
        <line x1={95} y1={20} x2={128} y2={96} stroke={C.green} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="4 3" markerEnd="url(#arr2)"/>
        {/* Projected points on PC1 */}
        {[[60,85],[85,64],[110,50],[135,35],[160,22]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={C.accent} opacity={0.7}/>
        ))}
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke={C.accent} strokeWidth={1.5} strokeLinecap="round"/>
          </marker>
          <marker id="arr2" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke={C.green} strokeWidth={1.5} strokeLinecap="round"/>
          </marker>
        </defs>
        <text x={195} y={16} fontSize={11} fill={C.accent} fontWeight={700}>PC1</text>
        <text x={130} y={104} fontSize={11} fill={C.green} fontWeight={700}>PC2</text>
        <text x={40} y={118} fontSize={10} fill={t.textMuted}>original data points</text>
        <text x={150} y={118} fontSize={10} fill={C.accent}>projected onto PC1</text>
      </svg>
    </div>
  );
}

function FigPrecisionRecall({ t }) {
  const cells = [
    { label:"Predicted +", tp:"TP", tpSub:"True Positive", fp:"FP", fpSub:"False Positive" },
    { label:"Predicted −", fn:"FN", fnSub:"False Negative", tn:"TN", tnSub:"True Negative" },
  ];
  return (
    <div style={{ border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px" }}>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.textMuted, marginBottom:10 }}>FIGURE · CONFUSION MATRIX</p>
      <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr", gap:0 }}>
        <div/>
        <div style={{ textAlign:"center", padding:"4px 0", fontSize:10, fontWeight:700, color:t.textMuted }}>Actually +</div>
        <div style={{ textAlign:"center", padding:"4px 0", fontSize:10, fontWeight:700, color:t.textMuted }}>Actually −</div>
        {[
          { row:"Predicted +", a:"TP", aColor:C.green, aBg:C.greenBg, aSub:"Hit", b:"FP", bColor:C.accent, bBg:C.accentBg, bSub:"False alarm" },
          { row:"Predicted −", a:"FN", aColor:C.accent, aBg:C.accentBg, aSub:"Miss", b:"TN", bColor:t.textMuted, bBg:t.surface2, bSub:"Correct reject" },
        ].map((r,i) => (
          <>
            <div key={`row${i}`} style={{ display:"flex", alignItems:"center", fontSize:10, fontWeight:700, color:t.textMuted, paddingRight:8 }}>{r.row}</div>
            {[{v:r.a,c:r.aColor,bg:r.aBg,s:r.aSub},{v:r.b,c:r.bColor,bg:r.bBg,s:r.bSub}].map((cell,j) => (
              <div key={j} style={{ margin:3, background:cell.bg, border:`1px solid ${cell.c}30`, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                <p style={{ fontSize:16, fontWeight:800, color:cell.c, lineHeight:1 }}>{cell.v}</p>
                <p style={{ fontSize:9, color:t.textMuted, marginTop:3 }}>{cell.s}</p>
              </div>
            ))}
          </>
        ))}
      </div>
      <div style={{ marginTop:10, display:"flex", gap:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:11, color:t.textSub }}><b style={{color:C.blue}}>Precision</b> = TP / (TP+FP)</span>
        <span style={{ fontSize:11, color:t.textSub }}><b style={{color:C.accent}}>Recall</b> = TP / (TP+FN)</span>
      </div>
    </div>
  );
}

function FigROC({ t }) {
  const pts = [[0,100],[5,90],[12,78],[22,60],[35,45],[50,28],[68,14],[85,5],[100,0]];
  const toPath = ps => ps.map(([x,y],i) => `${i===0?"M":"L"}${10+x*1.6},${108-y*0.9}`).join(" ");
  return (
    <div style={{ border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px" }}>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.textMuted, marginBottom:10 }}>FIGURE · ROC CURVE</p>
      <svg viewBox="0 0 220 130" style={{ width:"100%", display:"block" }}>
        {/* Axes */}
        <line x1={10} y1={10} x2={10} y2={110} stroke={t.border2} strokeWidth={1}/>
        <line x1={10} y1={110} x2={175} y2={110} stroke={t.border2} strokeWidth={1}/>
        {/* Random diagonal */}
        <path d="M10,110 L170,10" fill="none" stroke={t.border2} strokeWidth={1} strokeDasharray="4 3"/>
        {/* ROC curve */}
        <path d={toPath(pts)} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        {/* AUC fill */}
        <path d={`${toPath(pts)} L170,110 Z`} fill={C.blue} opacity={0.08}/>
        {/* Labels */}
        <text x={6} y={8} fontSize={9} fill={t.textMuted} textAnchor="middle">TPR</text>
        <text x={178} y={113} fontSize={9} fill={t.textMuted}>FPR</text>
        <text x={60} y={48} fontSize={10} fill={C.blue} fontWeight={700}>AUC ≈ 0.87</text>
        <text x={90} y={75} fontSize={9} fill={t.textMuted}>random</text>
      </svg>
    </div>
  );
}

function FigKFold({ t }) {
  const k = 5;
  return (
    <div style={{ border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px" }}>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.textMuted, marginBottom:10 }}>FIGURE · 5-FOLD CROSS-VALIDATION</p>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {Array.from({length:k},(_,fold) => (
          <div key={fold} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:10, fontWeight:700, color:t.textMuted, width:38, flexShrink:0 }}>Fold {fold+1}</span>
            <div style={{ display:"flex", flex:1, borderRadius:5, overflow:"hidden", height:22 }}>
              {Array.from({length:k},(_,i) => {
                const isVal = i===fold;
                return (
                  <div key={i} style={{ flex:1, background:isVal?C.blue:`${C.accent}22`, borderRight:i<k-1?"1.5px solid rgba(255,255,255,0.3)":"none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:isVal?"#fff":C.accent }}>
                    {isVal?"VAL":"TR"}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:14, marginTop:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:`${C.accent}22`, border:`1px solid ${C.accent}` }}/>
          <span style={{ fontSize:10, color:t.textSub }}>Training</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:C.blue }}/>
          <span style={{ fontSize:10, color:t.textSub }}>Validation</span>
        </div>
      </div>
    </div>
  );
}

function FigLSTM({ t }) {
  return (
    <div style={{ border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px" }}>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.textMuted, marginBottom:10 }}>FIGURE · LSTM GATES</p>
      <svg viewBox="0 0 300 90" style={{ width:"100%", display:"block" }}>
        {/* Cell state highway */}
        <line x1={10} y1={16} x2={290} y2={16} stroke={C.green} strokeWidth={2.5} strokeLinecap="round"/>
        <text x={0} y={14} fontSize={9} fill={C.green} fontWeight={700}>C</text>
        {/* Gates */}
        {[
          { x:55,  label:"Forget", sub:"What to\ndiscard", color:C.accent  },
          { x:140, label:"Input",  sub:"What to\nstore",   color:C.blue    },
          { x:225, label:"Output", sub:"What to\npass",    color:C.purple  },
        ].map(g => (
          <g key={g.label}>
            <rect x={g.x-22} y={28} width={44} height={52} rx={7} fill={`${g.color}14`} stroke={g.color} strokeWidth={1.2}/>
            {/* Gate to cell state */}
            <line x1={g.x} y1={28} x2={g.x} y2={16} stroke={g.color} strokeWidth={1.5} strokeDasharray="3 2"/>
            <text x={g.x} y={48} fontSize={10} fontWeight={700} fill={g.color} textAnchor="middle">{g.label}</text>
            <text x={g.x} y={62} fontSize={8} fill={t.textMuted} textAnchor="middle">{g.sub.split("\n")[0]}</text>
            <text x={g.x} y={72} fontSize={8} fill={t.textMuted} textAnchor="middle">{g.sub.split("\n")[1]}</text>
          </g>
        ))}
        {/* Hidden state */}
        <line x1={10} y1={82} x2={290} y2={82} stroke={t.textMuted} strokeWidth={1.5} strokeDasharray="4 2"/>
        <text x={0} y={80} fontSize={9} fill={t.textMuted} fontWeight={700}>h</text>
      </svg>
    </div>
  );
}

const FIGURE_MAP = {
  BiasVariance:    FigBiasVariance,
  DataSplit:       FigDataSplit,
  PCA:             FigPCA,
  PrecisionRecall: FigPrecisionRecall,
  ROC:             FigROC,
  KFold:           FigKFold,
  LSTM:            FigLSTM,
};

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function ReviewMode() {
  const [dark, setDark]         = useState(false);
  const [topic, setTopic]       = useState("All");
  const [showSaved, setShowSaved] = useState(false);
  const [idx, setIdx]           = useState(0);
  const [phase, setPhase]       = useState("idle"); // idle | out-left | out-right | in
  const [knows, setKnows]       = useState({});     // { id: "know"|"unsure"|null }
  const [saved, setSaved]       = useState({});     // { id: bool }
  const [showAnswer, setShowAnswer] = useState({}); // { id: bool }

  const t = dark ? DARK : LIGHT;

  const pool = QS.filter(q => {
    const matchTopic = topic === "All" || q.topic === topic;
    const matchSaved = !showSaved || saved[q.id];
    return matchTopic && matchSaved;
  });
  const safeIdx = Math.min(idx, Math.max(0, pool.length - 1));
  const q = pool[safeIdx];

  const navigate = (dir) => {
    const next = safeIdx + dir;
    if (next < 0 || next >= pool.length) return;
    const exitPhase = dir > 0 ? "out-left" : "out-right";
    setPhase(exitPhase);
    setTimeout(() => {
      setIdx(next);
      setPhase("in");
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle")));
    }, 200);
  };

  const toggleSaved  = (id) => setSaved(p => ({ ...p, [id]: !p[id] }));
  const toggleKnow   = (id, val) => setKnows(p => ({ ...p, [id]: p[id] === val ? null : val }));
  const toggleAnswer = (id) => setShowAnswer(p => ({ ...p, [id]: !p[id] }));

  const savedCount = Object.values(saved).filter(Boolean).length;
  const knownCount = Object.values(knows).filter(v => v === "know").length;

  const phaseStyle = {
    idle:      { opacity:1, transform:"translateX(0) scale(1)" },
    "out-left":{ opacity:0, transform:"translateX(-52px) scale(0.96)" },
    "out-right":{ opacity:0, transform:"translateX(52px) scale(0.96)" },
    in:        { opacity:0, transform:"translateX(0) scale(0.98)" },
  }[phase] || {};
  const phaseTr = phase === "idle"
    ? "opacity 0.28s ease, transform 0.32s cubic-bezier(0.22,1,0.36,1)"
    : phase === "in"
    ? "none"
    : "opacity 0.18s ease, transform 0.2s ease";

  const dc = q ? DIFF_COLORS[q.difficulty] : null;
  const isBookmarked = q ? !!saved[q.id] : false;
  const knowState    = q ? (knows[q.id] || null) : null;
  const answerShown  = q ? !!showAnswer[q.id] : false;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        mark{background:transparent}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ans-in{animation:fadeDown 0.22s ease both}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${dark?"#333":"#ddd"};border-radius:10px}

        .nav-btn{
          display:flex;align-items:center;justify-content:center;gap:7px;
          border:none;border-radius:12px;cursor:pointer;
          font-family:'DM Sans',system-ui;font-weight:700;font-size:14px;
          transition:transform 150ms cubic-bezier(0.34,1.56,0.64,1),background 120ms,opacity 150ms,box-shadow 150ms;
        }
        .nav-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.1)}
        .nav-btn:active:not(:disabled){transform:scale(0.97);box-shadow:none}
        .nav-btn:disabled{opacity:0.28;cursor:not-allowed}

        .chip-btn{
          display:inline-flex;align-items:center;gap:5px;
          border-radius:20px;cursor:pointer;
          font-family:'DM Sans',system-ui;font-weight:700;font-size:12px;
          transition:all 0.13s;
        }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", display:"flex", flexDirection:"column", transition:"background 0.3s" }}>

        {/* ── HEADER ── */}
        <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", gap:12, position:"sticky", top:0, zIndex:100 }}>
          <BookOpen size={15} style={{color:C.accent}}/>
          <span style={{fontWeight:800,fontSize:14}}>Machine Learning</span>
          <span style={{color:t.border2}}>›</span>
          <span style={{fontWeight:700,fontSize:13}}>Review</span>

          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {/* Stats */}
            <div style={{display:"flex",alignItems:"center",gap:6,background:t.surface2,border:`1px solid ${t.border}`,borderRadius:20,padding:"4px 12px",fontSize:11}}>
              <span style={{color:C.green,fontWeight:700}}>✓ {knownCount}</span>
              <span style={{color:t.border2}}>·</span>
              <span style={{color:C.accent,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
                <Bookmark size={10} style={{fill:C.accent}}/>{savedCount}
              </span>
            </div>

            {/* Saved filter toggle */}
            <button
              onClick={()=>{ setShowSaved(s=>!s); setIdx(0); }}
              style={{
                display:"flex",alignItems:"center",gap:5,
                padding:"5px 11px",borderRadius:20,
                border:`1px solid ${showSaved ? C.accent+"55" : t.border}`,
                background:showSaved ? C.accentBg2 : "transparent",
                color:showSaved ? C.accent : t.textSub,
                fontSize:11,fontWeight:700,cursor:"pointer",
                fontFamily:"'DM Sans',system-ui",transition:"all 0.13s",
              }}
            >
              <Bookmark size={11} style={{fill:showSaved?C.accent:"none"}}/> Saved
            </button>

            <button onClick={()=>setDark(d=>!d)} style={{background:t.surface2,border:`1px solid ${t.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:t.textSub,fontSize:12,fontWeight:600}}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        {/* ── TOPIC CHIPS ── */}
        <div style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, padding:"10px 20px", display:"flex", gap:6, flexWrap:"wrap" }}>
          {TOPICS.map(tp => (
            <button key={tp} onClick={()=>{ setTopic(tp); setIdx(0); }} className="chip-btn" style={{
              padding:"5px 13px",
              background: topic===tp ? C.accent : t.surface2,
              color: topic===tp ? "#fff" : t.textSub,
              border:`1px solid ${topic===tp ? C.accent : t.border}`,
            }}>{tp}</button>
          ))}
        </div>

        {/* ── MAIN ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", maxWidth:640, width:"100%", margin:"0 auto", padding:"28px 20px 0" }}>

          {pool.length === 0 ? (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:t.textMuted,animation:"fadeUp .3s ease"}}>
              <Bookmark size={32} style={{opacity:0.3}}/>
              <p style={{fontSize:15,fontWeight:600}}>
                {showSaved ? "No saved questions yet" : "No questions in this topic"}
              </p>
              <button onClick={()=>{setShowSaved(false);setTopic("All");}} style={{marginTop:4,background:"none",border:`1px solid ${t.border}`,borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",color:t.textSub,fontFamily:"'DM Sans',system-ui"}}>
                Clear filters
              </button>
            </div>
          ) : q && (
            <>
              {/* Progress + counter */}
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:t.textMuted}}>{safeIdx+1} / {pool.length}</span>
                  <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.5px",color:t.textMuted}}>
                    {topic !== "All" ? topic : "All topics"}
                  </span>
                </div>
                <div style={{height:3,background:t.border,borderRadius:99,overflow:"hidden"}}>
                  <div style={{width:`${((safeIdx+1)/pool.length)*100}%`,height:"100%",background:C.accent,borderRadius:99,transition:"width 0.4s cubic-bezier(0.22,1,0.36,1)"}}/>
                </div>
              </div>

              {/* Card */}
              <div style={{...phaseStyle,transition:phaseTr,flex:1,display:"flex",flexDirection:"column"}}>
                <div style={{background:t.surface,border:`1px solid ${isBookmarked ? C.accent+"50" : t.border}`,borderRadius:18,overflow:"hidden",flex:1}}>

                  {/* Card header */}
                  <div style={{padding:"18px 20px 14px",borderBottom:`1px solid ${t.border}`}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
                      <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.6px",color:t.textMuted}}>{q.topic.toUpperCase()}</span>
                        {dc && <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.4px",color:dc.color,background:dc.bg,border:`1px solid ${dc.color}30`,borderRadius:20,padding:"2px 8px"}}>{dc.label}</span>}
                      </div>

                      {/* Right side: bookmark + self-assess */}
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                        {/* Self-assess chips */}
                        {[
                          {id:"know",  icon:Check,       label:"Know it", color:C.green,  bg:C.greenBg },
                          {id:"unsure",icon:HelpCircle,  label:"Unsure",  color:C.gold,   bg:C.goldBg  },
                        ].map(({id,icon:Icon,label,color,bg})=>{
                          const active = knowState === id;
                          return (
                            <button key={id} onClick={()=>toggleKnow(q.id,id)} className="chip-btn" style={{
                              padding:"4px 10px",fontSize:11,
                              border:`1px solid ${active ? color+"55" : t.border}`,
                              background: active ? bg : "transparent",
                              color: active ? color : t.textMuted,
                            }}>
                              <Icon size={11}/>{label}
                            </button>
                          );
                        })}

                        {/* Bookmark */}
                        <button
                          onClick={()=>toggleSaved(q.id)}
                          title={isBookmarked ? "Remove bookmark" : "Save as difficult"}
                          style={{
                            width:32,height:32,borderRadius:8,
                            background: isBookmarked ? C.accentBg2 : t.surface2,
                            border:`1px solid ${isBookmarked ? C.accent+"50" : t.border}`,
                            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                            transition:"all 0.15s",flexShrink:0,
                          }}
                          onMouseEnter={e=>{if(!isBookmarked){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.accentBg;}}}
                          onMouseLeave={e=>{if(!isBookmarked){e.currentTarget.style.borderColor=t.border;e.currentTarget.style.background=t.surface2;}}}
                        >
                          {isBookmarked
                            ? <BookmarkCheck size={15} style={{color:C.accent}}/>
                            : <Bookmark size={15} style={{color:t.textMuted}}/>
                          }
                        </button>
                      </div>
                    </div>

                    {/* Concept label */}
                    <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.5px",color:C.accent,marginBottom:5}}>{q.concept}</p>
                    <h2 style={{fontFamily:"'Lora',Georgia,serif",fontSize:18,fontWeight:700,lineHeight:1.45,color:t.text}}>{q.q}</h2>
                  </div>

                  {/* Explanation */}
                  <div style={{padding:"18px 20px"}}>
                    <p style={{fontSize:10,fontWeight:800,letterSpacing:"0.8px",color:t.textMuted,marginBottom:12}}>EXPLANATION</p>
                    <div style={{fontFamily:"'Lora',Georgia,serif",fontSize:14.5,lineHeight:1.82,color:t.textSub}}>
                      {q.explanation.split("\n\n").map((para,i,arr)=>(
                        <p key={i} style={{marginBottom:i<arr.length-1?14:0}}><Hl>{para}</Hl></p>
                      ))}
                    </div>

                    {/* Figure — only if defined */}
                    {q.figure && FIGURE_MAP[q.figure] && (() => {
                      const Fig = FIGURE_MAP[q.figure];
                      return (
                        <div style={{ marginTop:20, animation:"fadeUp 0.3s ease both" }}>
                          <Fig t={t}/>
                        </div>
                      );
                    })()}

                    {/* Key points */}
                    <div style={{marginTop:18,background:t.surface2,borderRadius:10,padding:"12px 14px"}}>
                      <p style={{fontSize:10,fontWeight:800,letterSpacing:"0.7px",color:t.textMuted,marginBottom:8}}>KEY POINTS</p>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {q.keyPoints.map((pt,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8}}>
                            <div style={{width:5,height:5,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:7}}/>
                            <span style={{fontSize:13,color:t.textSub,lineHeight:1.5}}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quiz question reveal */}
                    <div style={{marginTop:16}}>
                      <button onClick={()=>toggleAnswer(q.id)} style={{
                        background:"none",border:`1px solid ${t.border}`,borderRadius:8,padding:"7px 12px",
                        fontSize:12,fontWeight:700,cursor:"pointer",color:t.textMuted,
                        fontFamily:"'DM Sans',system-ui",display:"flex",alignItems:"center",gap:6,
                        transition:"border-color 0.15s,color 0.15s",
                      }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.textMuted;}}
                      >
                        {answerShown ? <EyeOff size={12}/> : <Eye size={12}/>}
                        {answerShown ? "Hide quiz question" : "See as quiz question"}
                      </button>

                      {answerShown && (
                        <div className="ans-in" style={{marginTop:12}}>
                          <div style={{display:"flex",flexDirection:"column",gap:7}}>
                            {q.options.map((opt,oi)=>{
                              const ok = oi===q.correct;
                              return (
                                <div key={oi} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:8,background:ok?C.greenBg:t.surface2,border:`1px solid ${ok?C.green+"45":t.border}`}}>
                                  <span style={{width:22,height:22,borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,background:ok?C.green:t.surface,color:ok?"#fff":t.textMuted,border:ok?"none":`1px solid ${t.border}`}}>
                                    {["A","B","C","D"][oi]}
                                  </span>
                                  <span style={{fontSize:13,color:ok?t.text:t.textSub,fontWeight:ok?600:400,lineHeight:1.5}}>
                                    {opt}{ok&&<span style={{marginLeft:6,fontSize:11,color:C.green,fontWeight:700}}>← correct</span>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Related */}
                    <div style={{marginTop:16,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                      <Tag size={11} style={{color:t.textMuted,flexShrink:0}}/>
                      {q.related.map(r=>(
                        <span key={r} className="chip-btn" style={{
                          fontSize:11,padding:"3px 9px",
                          color:t.textMuted,background:t.surface2,border:`1px solid ${t.border}`,
                        }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.textMuted;}}
                        >{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* ── BOTTOM NAV ── */}
        {pool.length > 0 && (
          <div style={{
            background:t.bg, borderTop:`1px solid ${t.border}`,
            padding:"16px 20px 28px", position:"sticky", bottom:0,
          }}>
            <div style={{maxWidth:640,margin:"0 auto",display:"flex",gap:10}}>
              <button
                className="nav-btn"
                disabled={safeIdx===0}
                onClick={()=>navigate(-1)}
                style={{
                  flex:"0 0 auto",width:52,height:52,
                  background:t.surface,
                  border:`1px solid ${t.border}`,
                  color:t.textSub,
                }}
              >
                <ChevronLeft size={20}/>
              </button>

              <button
                className="nav-btn"
                disabled={safeIdx>=pool.length-1}
                onClick={()=>navigate(1)}
                style={{
                  flex:1,height:52,
                  background:safeIdx<pool.length-1 ? C.accent : t.border,
                  color:safeIdx<pool.length-1 ? "#fff" : t.textMuted,
                }}
              >
                {safeIdx < pool.length-1 ? <>Next <ChevronRight size={16}/></> : "Last question"}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
