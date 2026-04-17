import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Search, BookOpen, Layers, AlignLeft, Hash,
  ChevronDown, ChevronUp, Zap, RotateCcw, Check, X,
  Moon, Sun, ChevronLeft, ChevronRight, Shuffle, GitMerge, Link2
} from "lucide-react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  accent: "#E07355", accentHov: "#C85E40",
  accentBg: "rgba(224,115,85,0.10)", accentBg2: "rgba(224,115,85,0.16)",
  blue: "#4A7FC1", blueBg: "rgba(74,127,193,0.12)",
  green: "#5A9E72", greenBg: "rgba(90,158,114,0.12)",
  red: "#C0504A", redBg: "rgba(192,80,74,0.10)",
  gold: "#C49A3C", goldBg: "rgba(196,154,60,0.12)",
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

// ── DATA ──────────────────────────────────────────────────────────────────────
const TOPICS = ["All Topics", "Foundations", "Data Prep", "Supervised Learning", "Evaluation", "Deep Learning"];

const TERMS = [
  // Abbreviations
  { id:1,  abbr:"ML",    full:"Machine Learning",           topic:"Foundations",         type:"abbr",
    def:"The study of algorithms that improve through experience without being explicitly programmed." },
  { id:2,  abbr:"DL",    full:"Deep Learning",              topic:"Deep Learning",        type:"abbr",
    def:"A subfield of ML using multi-layer neural networks to learn hierarchical representations." },
  { id:3,  abbr:"CV",    full:"Cross-Validation",           topic:"Evaluation",           type:"abbr",
    def:"A technique to estimate model performance by rotating held-out subsets of training data." },
  { id:4,  abbr:"MSE",   full:"Mean Squared Error",         topic:"Evaluation",           type:"abbr",
    def:"Average of squared differences between predictions and actual values. Penalises large errors." },
  { id:5,  abbr:"MAE",   full:"Mean Absolute Error",        topic:"Evaluation",           type:"abbr",
    def:"Average of absolute differences between predictions and actual values. More robust to outliers." },
  { id:6,  abbr:"AUC",   full:"Area Under the Curve",       topic:"Evaluation",           type:"abbr",
    def:"Measures classifier performance across all decision thresholds. 1.0 = perfect, 0.5 = random." },
  { id:7,  abbr:"ROC",   full:"Receiver Operating Characteristic", topic:"Evaluation",   type:"abbr",
    def:"A curve plotting True Positive Rate vs. False Positive Rate at varying thresholds." },
  { id:8,  abbr:"FPR",   full:"False Positive Rate",        topic:"Evaluation",           type:"abbr",
    def:"Fraction of negatives incorrectly classified as positive. FPR = FP / (FP + TN)." },
  { id:9,  abbr:"TPR",   full:"True Positive Rate (Recall)", topic:"Evaluation",          type:"abbr",
    def:"Fraction of actual positives correctly identified. TPR = TP / (TP + FN)." },
  { id:10, abbr:"SVM",   full:"Support Vector Machine",     topic:"Supervised Learning",  type:"abbr",
    def:"Algorithm that finds the hyperplane maximising the margin between classes." },
  { id:11, abbr:"KNN",   full:"K-Nearest Neighbours",       topic:"Supervised Learning",  type:"abbr",
    def:"Classifies a sample based on the majority class among its k closest training examples." },
  { id:12, abbr:"LR",    full:"Logistic Regression",        topic:"Supervised Learning",  type:"abbr",
    def:"Linear model for binary classification that outputs probabilities via the sigmoid function." },
  { id:13, abbr:"PCA",   full:"Principal Component Analysis", topic:"Data Prep",          type:"abbr",
    def:"Dimensionality reduction technique that projects data onto axes of maximum variance." },
  { id:14, abbr:"SGD",   full:"Stochastic Gradient Descent", topic:"Foundations",         type:"abbr",
    def:"Optimisation algorithm that updates parameters using one (or a mini-batch of) training examples." },
  { id:15, abbr:"CNN",   full:"Convolutional Neural Network", topic:"Deep Learning",       type:"abbr",
    def:"Neural network using learned filters to detect spatial patterns, primarily for image data." },
  { id:16, abbr:"RNN",   full:"Recurrent Neural Network",   topic:"Deep Learning",        type:"abbr",
    def:"Neural network with cyclic connections enabling processing of sequential data." },
  { id:17, abbr:"LSTM",  full:"Long Short-Term Memory",     topic:"Deep Learning",        type:"abbr",
    def:"RNN variant with gating mechanisms to retain long-range dependencies in sequences." },
  // Definitions
  { id:18, full:"Overfitting",    topic:"Foundations",        type:"def",
    def:"When a model learns training data too well, including noise, and fails to generalise." },
  { id:19, full:"Underfitting",   topic:"Foundations",        type:"def",
    def:"When a model is too simple to capture the underlying patterns in the data." },
  { id:20, full:"Feature Engineering", topic:"Data Prep",     type:"def",
    def:"The process of transforming raw data into informative features that improve model performance." },
  { id:21, full:"Regularisation", topic:"Foundations",        type:"def",
    def:"Techniques (L1, L2, dropout) that penalise model complexity to prevent overfitting." },
  { id:22, full:"Hyperparameter", topic:"Foundations",        type:"def",
    def:"A parameter set before training (e.g. learning rate, depth) — not learned from data." },
  { id:23, full:"Precision",      topic:"Evaluation",         type:"def",
    def:"Of all predicted positives, the fraction that were actually positive. TP / (TP + FP)." },
  { id:24, full:"Recall",         topic:"Evaluation",         type:"def",
    def:"Of all actual positives, the fraction correctly identified. TP / (TP + FN)." },
  { id:25, full:"F1 Score",       topic:"Evaluation",         type:"def",
    def:"Harmonic mean of Precision and Recall. Useful when classes are imbalanced." },
  { id:26, full:"Normalisation",  topic:"Data Prep",          type:"def",
    def:"Scaling features to a standard range (e.g. [0,1]) so no single feature dominates training." },
  { id:27, full:"One-Hot Encoding", topic:"Data Prep",        type:"def",
    def:"Representing categorical variables as binary vectors — one '1' per category." },
  { id:28, full:"Ensemble Method", topic:"Supervised Learning", type:"def",
    def:"Combining multiple models (e.g. Random Forest, Boosting) to reduce variance or bias." },
  { id:29, full:"Gradient Descent", topic:"Foundations",      type:"def",
    def:"Iterative optimisation algorithm that adjusts parameters in the direction of steepest loss decrease." },
  { id:30, full:"Activation Function", topic:"Deep Learning", type:"def",
    def:"Non-linear function (ReLU, sigmoid, tanh) applied in neural network layers to enable complex mappings." },
];

// ── CONCEPT CLUSTERS ─────────────────────────────────────────────────────────
// Groups of terms that are best understood together
const CLUSTERS = [
  {
    id: "c1",
    name: "Bias–Variance Tradeoff",
    emoji: "⚖️",
    color: C.accent,
    why: "These four concepts form a single mental model — you can't understand one without the others.",
    termIds: [18, 19, 21, 22], // Overfitting, Underfitting, Regularisation, Hyperparameter
  },
  {
    id: "c2",
    name: "Classification Metrics",
    emoji: "🎯",
    color: C.gold,
    why: "Precision, Recall and F1 are always discussed together — F1 is literally derived from the other two.",
    termIds: [23, 24, 25, 9, 8], // Precision, Recall, F1, TPR, FPR
  },
  {
    id: "c3",
    name: "ROC & AUC",
    emoji: "📈",
    color: C.blue,
    why: "ROC is the curve; AUC is the single number that summarises it. They're two sides of the same coin.",
    termIds: [6, 7, 8, 9], // AUC, ROC, FPR, TPR
  },
  {
    id: "c4",
    name: "Regression Error Metrics",
    emoji: "📐",
    color: C.green,
    why: "MSE and MAE measure the same thing differently — knowing both helps you choose the right one.",
    termIds: [4, 5], // MSE, MAE
  },
  {
    id: "c5",
    name: "Sequential Neural Networks",
    emoji: "🔄",
    color: "#9B6DD9",
    why: "LSTM was invented to fix the vanishing gradient problem in vanilla RNNs — understanding the problem makes the solution obvious.",
    termIds: [16, 17, 2], // RNN, LSTM, DL
  },
  {
    id: "c6",
    name: "Data Splitting & Validation",
    emoji: "✂️",
    color: C.accent,
    why: "Training set, validation set, test set, and cross-validation all answer the same question: how do we trust our model?",
    termIds: [3, 22], // CV, Hyperparameter — plus abbr terms by topic overlap
  },
  {
    id: "c7",
    name: "Feature Preparation",
    emoji: "🧹",
    color: C.blue,
    why: "These steps almost always appear together in any real ML pipeline before model training.",
    termIds: [13, 20, 26, 27], // PCA, Feature Engineering, Normalisation, One-Hot Encoding
  },
  {
    id: "c8",
    name: "Optimisation & Training",
    emoji: "⚡",
    color: C.gold,
    why: "Gradient Descent is the algorithm; SGD is how you run it efficiently; activation functions are what make it work in deep nets.",
    termIds: [14, 29, 30], // SGD, Gradient Descent, Activation Function
  },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function termLabel(term) {
  return term.abbr || term.full;
}

// ── TYPE CHIP ─────────────────────────────────────────────────────────────────
function TypeChip({ type, t }) {
  const map = {
    abbr: { label: "Abbreviation", color: C.accent, bg: C.accentBg },
    def:  { label: "Definition",   color: C.blue,   bg: C.blueBg   },
  };
  const s = map[type];
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "0.6px",
      color: s.color, background: s.bg,
      padding: "3px 8px", borderRadius: 20,
    }}>{s.label}</span>
  );
}

// ── GLOSSARY LIST ─────────────────────────────────────────────────────────────
function GlossaryList({ filtered, t, onStartFlash }) {
  const [open, setOpen] = useState({});
  const toggle = id => setOpen(p => ({ ...p, [id]: !p[id] }));

  return (
    <div>
      {/* Start flashcard bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 0 18px",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted }}>
          {filtered.length} term{filtered.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => onStartFlash(filtered)}
          style={{
            background: C.accent, color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 16px",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            fontFamily: "'DM Sans', system-ui",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
        >
          <Zap size={14} /> Practice as Flashcards
        </button>
      </div>

      {/* Term rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map(term => (
          <div key={term.id} style={{ borderBottom: `1px solid ${t.border}` }}>
            <div
              onClick={() => toggle(term.id)}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 4px", cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.surface2}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {/* Abbreviation or icon */}
              <span style={{
                minWidth: 56, fontSize: 14, fontWeight: 800,
                color: C.accent, fontFamily: "'DM Sans', system-ui",
                letterSpacing: "-0.3px",
              }}>
                {term.abbr || <span style={{ color: t.border2 }}>—</span>}
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: term.abbr ? 500 : 600, color: t.text }}>
                {term.full}
              </span>
              <TypeChip type={term.type} t={t} />
              <span style={{ color: t.textMuted, marginLeft: 8 }}>
                {open[term.id] ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
              </span>
            </div>
            {open[term.id] && (
              <div style={{
                padding: "0 4px 16px 72px",
                fontSize: 14, lineHeight: 1.7, color: t.textSub,
                fontFamily: "'Lora', Georgia, serif",
                animation: "fadeDown 0.18s ease",
              }}>
                <p>{term.def}</p>
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                    color: t.textMuted, background: t.surface2,
                    padding: "3px 8px", borderRadius: 20,
                    border: `1px solid ${t.border}`,
                  }}>{term.topic}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onStartFlash([term]); }}
                    style={{
                      background: "none", border: `1px solid ${t.border}`,
                      borderRadius: 6, padding: "3px 10px",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      color: C.accent, display: "flex", alignItems: "center", gap: 5,
                      fontFamily: "'DM Sans', system-ui",
                    }}
                  >
                    <Zap size={11}/> Flash this
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FLASH CARD ────────────────────────────────────────────────────────────────
function FlashCard({ term, flipped, onFlip, mode, t }) {
  const front = mode === "abbr-to-full"
    ? { label: "Abbreviation", content: term.abbr || term.full, sub: null }
    : mode === "full-to-def"
    ? { label: "Term", content: term.full, sub: term.abbr ? `(${term.abbr})` : null }
    : { label: term.type === "abbr" ? "Abbreviation" : "Term",
        content: term.abbr || term.full, sub: null };

  const back = mode === "abbr-to-full"
    ? { label: "Full Name", content: term.full, sub: term.def }
    : mode === "full-to-def"
    ? { label: "Definition", content: term.def, sub: null }
    : { label: term.type === "abbr" ? "Full Name + Definition" : "Definition",
        content: term.type === "abbr" ? term.full : term.def,
        sub: term.type === "abbr" ? term.def : null };

  const face = flipped ? back : front;

  return (
    <div
      onClick={onFlip}
      style={{
        background: t.surface,
        border: `2px solid ${flipped ? C.accent : t.border}`,
        borderRadius: 20,
        padding: "48px 40px",
        minHeight: 260,
        cursor: "pointer",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
        userSelect: "none",
        boxShadow: flipped ? `0 0 0 4px ${C.accentBg}` : "none",
        transform: "scale(1)",
        position: "relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = flipped ? `0 0 0 4px ${C.accentBg}` : "none"; }}
    >
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "1px",
        color: flipped ? C.accent : t.textMuted,
        marginBottom: 20, textTransform: "uppercase",
      }}>{face.label}</span>

      <p style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: face.content.length > 60 ? 16 : face.content.length > 30 ? 22 : 32,
        fontWeight: 700, lineHeight: 1.4,
        color: t.text, marginBottom: face.sub ? 16 : 0,
        letterSpacing: "-0.3px",
      }}>{face.content}</p>

      {face.sub && (
        <p style={{
          fontSize: 14, color: t.textSub, lineHeight: 1.65,
          fontFamily: "'Lora', Georgia, serif", fontStyle: "italic",
          maxWidth: 420,
        }}>{face.sub}</p>
      )}

      <span style={{
        position: "absolute", bottom: 16,
        fontSize: 11, color: t.textMuted, fontWeight: 500,
      }}>
        {flipped ? "Click to see front" : "Click to reveal"}
      </span>
    </div>
  );
}

// ── FLASH SESSION ─────────────────────────────────────────────────────────────
function FlashSession({ deck, mode, t, onExit }) {
  const [cards] = useState(() => shuffle(deck));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [retry, setRetry] = useState(new Set());
  const [done, setDone] = useState(false);

  const card = cards[idx];
  const progress = idx / cards.length;

  const advance = (result) => {
    if (result === "known") setKnown(p => new Set([...p, card.id]));
    else setRetry(p => new Set([...p, card.id]));
    if (idx + 1 >= cards.length) setDone(true);
    else { setIdx(i => i + 1); setFlipped(false); }
  };

  if (done) {
    const knownCount = known.size;
    const retryCount = retry.size;
    const pct = Math.round((knownCount / cards.length) * 100);
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📖"}
        </div>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
          Session Complete
        </h2>
        <p style={{ color: t.textSub, marginBottom: 36, fontSize: 15 }}>
          {cards.length} cards reviewed
        </p>
        {/* Score */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 40 }}>
          <div style={{ background: C.greenBg, borderRadius: 14, padding: "20px 28px" }}>
            <p style={{ fontSize: 32, fontWeight: 800, color: C.green }}>{knownCount}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Got it</p>
          </div>
          <div style={{ background: C.redBg, borderRadius: 14, padding: "20px 28px" }}>
            <p style={{ fontSize: 32, fontWeight: 800, color: C.red }}>{retryCount}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Needs review</p>
          </div>
          <div style={{ background: C.accentBg, borderRadius: 14, padding: "20px 28px" }}>
            <p style={{ fontSize: 32, fontWeight: 800, color: C.accent }}>{pct}%</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>Score</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {retryCount > 0 && (
            <button onClick={onExit} style={{
              background: C.accent, color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 24px",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', system-ui",
            }}>
              <RotateCcw size={14} style={{ display: "inline", marginRight: 6 }} />
              Retry {retryCount} cards
            </button>
          )}
          <button onClick={onExit} style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 10, padding: "12px 24px",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            color: t.text, fontFamily: "'DM Sans', system-ui",
          }}>
            Back to Glossary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 5, background: t.border, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: C.accent, borderRadius: 99, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, whiteSpace: "nowrap" }}>
          {idx + 1} / {cards.length}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ {known.size}</span>
          <span style={{ fontSize: 11, color: t.textMuted }}>·</span>
          <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>✗ {retry.size}</span>
        </div>
      </div>

      {/* Topic badge */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <span style={{
          background: t.surface2, border: `1px solid ${t.border}`,
          borderRadius: 20, padding: "4px 12px",
          fontSize: 11, fontWeight: 700, color: t.textMuted,
        }}>{card.topic}</span>
        <TypeChip type={card.type} t={t} />
      </div>

      {/* Card */}
      <FlashCard term={card} flipped={flipped} onFlip={() => setFlipped(f => !f)} mode={mode} t={t} />

      {/* Action buttons — only show after flip */}
      <div style={{
        display: "flex", gap: 12, marginTop: 20,
        opacity: flipped ? 1 : 0,
        pointerEvents: flipped ? "auto" : "none",
        transition: "opacity 0.2s",
      }}>
        <button onClick={() => advance("retry")} style={{
          flex: 1, padding: "13px", border: `1px solid ${C.red}`,
          borderRadius: 10, background: C.redBg, color: C.red,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "'DM Sans', system-ui",
        }}>
          <X size={16} /> Still learning
        </button>
        <button onClick={() => advance("known")} style={{
          flex: 1, padding: "13px", border: `none`,
          borderRadius: 10, background: C.accent, color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "'DM Sans', system-ui",
        }}>
          <Check size={16} /> Got it
        </button>
      </div>

      {!flipped && (
        <p style={{ textAlign: "center", fontSize: 12, color: t.textMuted, marginTop: 14 }}>
          Click the card to reveal the answer
        </p>
      )}
    </div>
  );
}

// ── CONCEPT MAP (force-directed, Anthropic style) ─────────────────────────────
function ConceptMap({ t, dark }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    nodes: [], drag: null, hovered: null,
    pan: { x: 0, y: 0 }, zoom: 1, panStart: null,
    running: true, animFrame: null,
  });
  const [tooltip, setTooltip] = useState(null); // {label, clusters, x, y}
  const [hovCluster, setHovCluster] = useState(null);

  // Graph data — same as before
  const GC = [
    { id:"bv",    name:"Bias–Variance",          color: C.accent },
    { id:"clf",   name:"Classification metrics", color: C.gold   },
    { id:"roc",   name:"ROC & AUC",              color: C.blue   },
    { id:"reg",   name:"Regression errors",      color: C.green  },
    { id:"seq",   name:"Sequential nets",        color: "#9B6DD9"},
    { id:"split", name:"Data splitting",         color: C.accent },
    { id:"feat",  name:"Feature prep",           color: C.blue   },
    { id:"opt",   name:"Optimisation",           color: C.gold   },
  ];
  const GN = [
    { id:"overfit",   label:"Overfitting",      abbr:null,   clusters:["bv","split"] },
    { id:"underfit",  label:"Underfitting",     abbr:null,   clusters:["bv"] },
    { id:"reg_l",     label:"Regularisation",   abbr:null,   clusters:["bv","opt"] },
    { id:"hyperparam",label:"Hyperparameter",   abbr:null,   clusters:["bv","split"] },
    { id:"prec",      label:"Precision",        abbr:null,   clusters:["clf"] },
    { id:"recall",    label:"Recall",           abbr:null,   clusters:["clf","roc"] },
    { id:"f1",        label:"F1 Score",         abbr:"F1",   clusters:["clf"] },
    { id:"tpr",       label:"True Pos Rate",    abbr:"TPR",  clusters:["clf","roc"] },
    { id:"fpr",       label:"False Pos Rate",   abbr:"FPR",  clusters:["clf","roc"] },
    { id:"auc",       label:"Area Under Curve", abbr:"AUC",  clusters:["roc"] },
    { id:"roc_c",     label:"ROC Curve",        abbr:"ROC",  clusters:["roc"] },
    { id:"mse",       label:"Mean Sq Error",    abbr:"MSE",  clusters:["reg"] },
    { id:"mae",       label:"Mean Abs Error",   abbr:"MAE",  clusters:["reg"] },
    { id:"rnn",       label:"Recurrent Net",    abbr:"RNN",  clusters:["seq"] },
    { id:"lstm",      label:"Long Short-Term",  abbr:"LSTM", clusters:["seq"] },
    { id:"dl",        label:"Deep Learning",    abbr:"DL",   clusters:["seq"] },
    { id:"cv",        label:"Cross-Validation", abbr:"CV",   clusters:["split"] },
    { id:"pca",       label:"PCA",              abbr:"PCA",  clusters:["feat"] },
    { id:"feateng",   label:"Feature Eng.",     abbr:null,   clusters:["feat"] },
    { id:"norm",      label:"Normalisation",    abbr:null,   clusters:["feat"] },
    { id:"onehot",    label:"One-Hot Enc.",     abbr:null,   clusters:["feat"] },
    { id:"sgd",       label:"SGD",              abbr:"SGD",  clusters:["opt"] },
    { id:"gd",        label:"Gradient Descent", abbr:null,   clusters:["opt"] },
    { id:"activ",     label:"Activation Fn",    abbr:null,   clusters:["opt","seq"] },
  ];
  const EDGES = [];
  for (let i = 0; i < GN.length; i++) {
    for (let j = i + 1; j < GN.length; j++) {
      const shared = GN[i].clusters.filter(c => GN[j].clusters.includes(c));
      if (shared.length) EDGES.push({ a: i, b: j, clusters: shared, w: shared.length });
    }
  }

  function nodeColor(n) {
    return GC.find(c => c.id === n.clusters[0])?.color || "#888";
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const S = stateRef.current;
    let W, H, dpr;

    function initNodes() {
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.35;
      S.nodes = GN.map((d, i) => {
        const a = (i / GN.length) * Math.PI * 2;
        return { ...d, x: cx + r * Math.cos(a) * (0.5 + Math.random() * 0.8),
                       y: cy + r * Math.sin(a) * (0.5 + Math.random() * 0.8),
                       vx: 0, vy: 0 };
      });
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = 340;
      canvas.style.height = H + "px";
      dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }

    function tick() {
      const rep = 2800, k = 0.011;
      for (let i = 0; i < S.nodes.length; i++) {
        for (let j = i + 1; j < S.nodes.length; j++) {
          const dx = S.nodes[j].x - S.nodes[i].x, dy = S.nodes[j].y - S.nodes[i].y;
          const d2 = dx * dx + dy * dy || 1, d = Math.sqrt(d2);
          const f = rep / d2;
          S.nodes[i].vx -= f * dx / d; S.nodes[i].vy -= f * dy / d;
          S.nodes[j].vx += f * dx / d; S.nodes[j].vy += f * dy / d;
        }
      }
      for (const e of EDGES) {
        const a = S.nodes[e.a], b = S.nodes[e.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = 110 / e.w;
        const f = (d - ideal) * k * e.w;
        a.vx += f * dx / d; a.vy += f * dy / d;
        b.vx -= f * dx / d; b.vy -= f * dy / d;
      }
      for (const n of S.nodes) {
        if (n === S.drag) continue;
        n.vx *= 0.80; n.vy *= 0.80;
        n.x += n.vx; n.y += n.vy;
        n.x = Math.max(24, Math.min(W - 24, n.x));
        n.y = Math.max(24, Math.min(H - 24, n.y));
      }
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(S.pan.x, S.pan.y);
      ctx.scale(S.zoom, S.zoom);

      const isDk = dark;
      const hovId = S.hovered ? S.hovered.id : null;

      // edges
      for (const e of EDGES) {
        const a = S.nodes[e.a], b = S.nodes[e.b];
        const isHov = hovId && (S.nodes[e.a].id === hovId || S.nodes[e.b].id === hovId);
        const clCol = GC.find(c => c.id === e.clusters[0])?.color;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHov
          ? (clCol + "90")
          : (isDk ? "rgba(255,255,255,0.07)" : "rgba(26,26,26,0.08)");
        ctx.lineWidth = isHov ? (1.5 / S.zoom) : (0.8 / S.zoom);
        ctx.stroke();
      }

      // nodes
      for (const n of S.nodes) {
        const isHov = n.id === hovId;
        const col = nodeColor(n);
        const R = 18;

        // subtle halo
        if (isHov) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, R + 7, 0, Math.PI * 2);
          ctx.fillStyle = col + "18";
          ctx.fill();
        }

        // filled circle — Anthropic style: low opacity fill, clean border
        ctx.beginPath();
        ctx.arc(n.x, n.y, R, 0, Math.PI * 2);
        ctx.fillStyle = isHov
          ? col + (isDk ? "55" : "28")
          : (isDk ? col + "22" : col + "14");
        ctx.fill();
        ctx.strokeStyle = isHov ? col : col + (isDk ? "70" : "55");
        ctx.lineWidth = isHov ? (1.8 / S.zoom) : (1 / S.zoom);
        ctx.stroke();

        // label — show abbr if exists, else first word
        const lbl = n.abbr || n.label.split(" ")[0];
        ctx.fillStyle = isHov ? col : (isDk ? col + "DD" : col + "CC");
        ctx.font = `${isHov ? 500 : 400} ${Math.round(10.5 / S.zoom * 10) / 10}px DM Sans,system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, n.x, n.y);
      }

      ctx.restore();
    }

    function loop() {
      if (!S.running) return;
      tick();
      draw();
      S.animFrame = requestAnimationFrame(loop);
    }

    function screenToWorld(sx, sy) {
      return { x: (sx - S.pan.x) / S.zoom, y: (sy - S.pan.y) / S.zoom };
    }

    function nodeAt(sx, sy) {
      const w = screenToWorld(sx, sy);
      let best = null, bd = Infinity;
      for (const n of S.nodes) {
        const d = Math.hypot(n.x - w.x, n.y - w.y);
        if (d < 22 / S.zoom && d < bd) { bd = d; best = n; }
      }
      return best;
    }

    function canvasXY(e) {
      const r = canvas.getBoundingClientRect();
      const cl = e.touches ? e.touches[0] : e;
      return { x: cl.clientX - r.left, y: cl.clientY - r.top };
    }

    const onDown = e => {
      const p = canvasXY(e);
      const n = nodeAt(p.x, p.y);
      if (n) { S.drag = n; canvas.style.cursor = "grabbing"; }
      else { S.panStart = { x: p.x - S.pan.x, y: p.y - S.pan.y }; canvas.style.cursor = "grabbing"; }
    };
    const onMove = e => {
      const p = canvasXY(e);
      if (S.drag) {
        const w = screenToWorld(p.x, p.y);
        S.drag.x = w.x; S.drag.y = w.y; S.drag.vx = 0; S.drag.vy = 0;
      } else if (S.panStart) {
        S.pan.x = p.x - S.panStart.x; S.pan.y = p.y - S.panStart.y;
      } else {
        const n = nodeAt(p.x, p.y);
        S.hovered = n || null;
        canvas.style.cursor = n ? "pointer" : "grab";
        if (n) {
          const r = canvas.getBoundingClientRect();
          const clNames = n.clusters.map(cid => GC.find(c => c.id === cid)?.name).filter(Boolean).join(" · ");
          setTooltip({ label: n.label, clusters: clNames, x: r.left + p.x, y: r.top + p.y });
          setHovCluster(n.clusters[0]);
        } else {
          setTooltip(null);
          setHovCluster(null);
        }
      }
    };
    const onUp = () => { S.drag = null; S.panStart = null; canvas.style.cursor = "grab"; };
    const onWheel = e => {
      e.preventDefault();
      const p = canvasXY(e);
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const wx = (p.x - S.pan.x) / S.zoom, wy = (p.y - S.pan.y) / S.zoom;
      S.zoom = Math.max(0.25, Math.min(4, S.zoom * factor));
      S.pan.x = p.x - wx * S.zoom; S.pan.y = p.y - wy * S.zoom;
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp);

    const onResize = () => { resize(); };
    window.addEventListener("resize", onResize);

    resize();
    initNodes();
    S.running = true;
    loop();

    // expose reset
    canvas._reset = () => { S.pan = { x: 0, y: 0 }; S.zoom = 1; initNodes(); };

    return () => {
      S.running = false;
      if (S.animFrame) cancelAnimationFrame(S.animFrame);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      window.removeEventListener("resize", onResize);
    };
  }, [dark]);

  const clusterColor = cid => GC.find(c => c.id === cid)?.color || "#888";

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 16, overflow: "hidden", marginBottom: 32,
    }}>
      {/* Header bar */}
      <div style={{
        padding: "16px 20px 12px",
        borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: t.textMuted, marginBottom: 3 }}>
            CONCEPT MAP
          </p>
          <p style={{ fontSize: 12, color: t.textSub }}>
            Scroll to zoom · drag to pan · hover a node to see connections
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Zoom buttons */}
          {[{ label: "+", delta: 1.2 }, { label: "−", delta: 0.83 }].map(({ label, delta }) => (
            <button key={label} onClick={() => {
              const S = stateRef.current;
              S.zoom = Math.max(0.25, Math.min(4, S.zoom * delta));
            }} style={{
              width: 28, height: 28, background: t.surface2,
              border: `1px solid ${t.border}`, borderRadius: 6,
              fontSize: 16, cursor: "pointer", color: t.textSub,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit", lineHeight: 1,
            }}>{label}</button>
          ))}
          <button onClick={() => canvasRef.current?._reset()} style={{
            height: 28, padding: "0 10px", background: t.surface2,
            border: `1px solid ${t.border}`, borderRadius: 6,
            fontSize: 11, fontWeight: 700, cursor: "pointer", color: t.textMuted,
            fontFamily: "'DM Sans', system-ui", letterSpacing: "0.3px",
          }}>RESET</button>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", cursor: "grab" }} />

      {/* Legend */}
      <div style={{
        padding: "10px 20px", borderTop: `1px solid ${t.border}`,
        display: "flex", gap: 12, flexWrap: "wrap",
      }}>
        {GC.map(cl => (
          <div key={cl.id} style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 11,
            fontWeight: hovCluster === cl.id ? 700 : 500,
            color: hovCluster === cl.id ? cl.color : t.textMuted,
            transition: "color 0.15s",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: cl.color,
              opacity: hovCluster === cl.id ? 1 : 0.5,
              transition: "opacity 0.15s",
            }}/>
            {cl.name}
          </div>
        ))}
      </div>

      {/* Tooltip (portal-style fixed) */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 14, top: tooltip.y - 10,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 8, padding: "8px 12px",
          fontSize: 12, pointerEvents: "none", zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}>
          <p style={{ fontWeight: 700, color: t.text, marginBottom: 2 }}>{tooltip.label}</p>
          <p style={{ color: t.textSub }}>{tooltip.clusters}</p>
        </div>
      )}
    </div>
  );
}

// ── CLUSTER VIEW ─────────────────────────────────────────────────────────────
function ClusterView({ t, dark, onStartFlash }) {
  const [openCluster, setOpenCluster] = useState(null);

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 28px" }} className="fade-up">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Concept Clusters
        </h2>
        <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.6 }}>
          Terms that are best understood together. Each cluster tells one complete story.
        </p>
      </div>

      {/* Concept Map */}
      <ConceptMap t={t} dark={dark} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CLUSTERS.map(cluster => {
          const clusterTerms = cluster.termIds.map(id => TERMS.find(t => t.id === id)).filter(Boolean);
          const isOpen = openCluster === cluster.id;

          return (
            <div key={cluster.id} style={{
              background: t.surface,
              border: `1.5px solid ${isOpen ? cluster.color : t.border}`,
              borderRadius: 14,
              overflow: "hidden",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxShadow: isOpen ? `0 4px 24px ${cluster.color}18` : "none",
            }}>
              {/* Cluster header */}
              <div
                onClick={() => setOpenCluster(isOpen ? null : cluster.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px", cursor: "pointer",
                  background: isOpen ? `${cluster.color}08` : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = t.surface2; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{cluster.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{cluster.name}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.5px",
                      color: cluster.color, background: `${cluster.color}18`,
                      padding: "2px 8px", borderRadius: 20,
                    }}>{clusterTerms.length} terms</span>
                  </div>
                  {/* Term pills preview */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {clusterTerms.map(term => (
                      <span key={term.id} style={{
                        fontSize: 11, fontWeight: 700,
                        color: isOpen ? cluster.color : t.textMuted,
                        background: isOpen ? `${cluster.color}14` : t.surface2,
                        border: `1px solid ${isOpen ? `${cluster.color}30` : t.border}`,
                        padding: "2px 7px", borderRadius: 20,
                        transition: "all 0.2s",
                      }}>
                        {term.abbr || term.full}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {isOpen && (
                    <button
                      onClick={e => { e.stopPropagation(); onStartFlash(clusterTerms, "mixed"); }}
                      style={{
                        background: cluster.color, color: "#fff",
                        border: "none", borderRadius: 7,
                        padding: "7px 13px", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        fontFamily: "'DM Sans', system-ui",
                      }}
                    >
                      <Zap size={12}/> Flash
                    </button>
                  )}
                  {isOpen
                    ? <ChevronUp size={16} style={{ color: cluster.color }}/>
                    : <ChevronDown size={16} style={{ color: t.textMuted }}/>
                  }
                </div>
              </div>

              {/* Expanded: why + term definitions */}
              {isOpen && (
                <div style={{
                  borderTop: `1px solid ${cluster.color}28`,
                  animation: "fadeDown 0.2s ease",
                }}>
                  {/* Why this cluster */}
                  <div style={{
                    padding: "14px 20px 14px 56px",
                    background: `${cluster.color}06`,
                    borderBottom: `1px solid ${t.border}`,
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <Link2 size={14} style={{ color: cluster.color, flexShrink: 0, marginTop: 2 }}/>
                    <p style={{
                      fontSize: 13, color: t.textSub, lineHeight: 1.6,
                      fontFamily: "'Lora', Georgia, serif", fontStyle: "italic",
                    }}>
                      {cluster.why}
                    </p>
                  </div>

                  {/* Term rows */}
                  {clusterTerms.map((term, i) => (
                    <div key={term.id} style={{
                      padding: "14px 20px 14px 20px",
                      borderBottom: i < clusterTerms.length - 1 ? `1px solid ${t.border}` : "none",
                      display: "flex", gap: 14, alignItems: "flex-start",
                    }}>
                      {/* Connector dot */}
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: cluster.color, flexShrink: 0, marginTop: 6,
                        opacity: 0.7,
                      }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {term.abbr && (
                            <span style={{ fontSize: 13, fontWeight: 800, color: cluster.color }}>
                              {term.abbr}
                            </span>
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                            {term.full}
                          </span>
                          <TypeChip type={term.type} t={t} />
                        </div>
                        <p style={{
                          fontSize: 13, color: t.textSub, lineHeight: 1.65,
                          fontFamily: "'Lora', Georgia, serif",
                        }}>{term.def}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function GlossaryApp() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("overview"); // overview | list | clusters | flash
  const [typeFilter, setTypeFilter] = useState("all"); // all | abbr | def
  const [topicFilter, setTopicFilter] = useState("All Topics");
  const [search, setSearch] = useState("");
  const [flashDeck, setFlashDeck] = useState([]);
  const [flashMode, setFlashMode] = useState("mixed");

  const t = dark ? DARK : LIGHT;

  // Filter terms
  const filtered = TERMS.filter(term => {
    const matchType = typeFilter === "all" || term.type === typeFilter;
    const matchTopic = topicFilter === "All Topics" || term.topic === topicFilter;
    const s = search.toLowerCase();
    const matchSearch = !s || term.full.toLowerCase().includes(s)
      || (term.abbr && term.abbr.toLowerCase().includes(s))
      || term.def.toLowerCase().includes(s);
    return matchType && matchTopic && matchSearch;
  });

  const startFlash = (deck, mode = flashMode) => {
    setFlashDeck(deck);
    setFlashMode(mode);
    setView("flash");
  };

  // Stats for overview
  const abbrCount  = TERMS.filter(t => t.type === "abbr").length;
  const defCount   = TERMS.filter(t => t.type === "def").length;
  const topicCounts = TOPICS.slice(1).map(tp => ({
    topic: tp,
    count: TERMS.filter(t => t.topic === tp).length,
  }));

  const TOPIC_COLORS = {
    "Foundations": C.accent, "Data Prep": C.blue,
    "Supervised Learning": C.green, "Evaluation": C.gold, "Deep Learning": "#9B6DD9",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: 'DM Sans', system-ui; }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "#333" : "#ddd"}; border-radius: 10px; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', system-ui", background: t.bg, color: t.text, minHeight: "100vh", transition: "background 0.3s" }}>

        {/* ── HEADER ── */}
        <header style={{
          background: t.surface, borderBottom: `1px solid ${t.border}`,
          height: 56, display: "flex", alignItems: "center",
          padding: "0 24px", gap: 14, position: "sticky", top: 0, zIndex: 100,
        }}>
          {view !== "overview" && (
            <button onClick={() => setView(view === "flash" ? (flashDeck.length > 0 ? "clusters" : "list") : "overview")}
              style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub, display: "flex", padding: 4 }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <BookOpen size={16} style={{ color: C.accent }} />
          <span style={{ fontWeight: 800, fontSize: 14 }}>Machine Learning</span>
          <span style={{ color: t.border2 }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
            {view === "flash" ? "Flashcards" : view === "clusters" ? "Concept Clusters" : "Glossary"}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {view === "list" && (
              <button onClick={() => startFlash(filtered)} style={{
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 8, padding: "7px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "'DM Sans', system-ui",
              }}>
                <Zap size={13} /> Practice ({filtered.length})
              </button>
            )}
            <button onClick={() => setDark(!dark)} style={{
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "5px 10px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              color: t.textSub, fontSize: 12, fontWeight: 600,
            }}>
              {dark ? <Sun size={13}/> : <Moon size={13}/>}
            </button>
          </div>
        </header>

        {/* ── OVERVIEW ── */}
        {view === "overview" && (
          <div style={{ maxWidth: 780, margin: "0 auto", padding: "44px 28px" }} className="fade-up">
            <h1 style={{ fontFamily: "'Lora',serif", fontSize: 30, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 6 }}>
              Glossary
            </h1>
            <p style={{ color: t.textSub, fontSize: 15, marginBottom: 40 }}>
              {TERMS.length} terms across {TOPICS.length - 1} topics
            </p>

            {/* Type cards — 4 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 40 }}>
              {[
                { key: "all",      label: "All Terms",          count: TERMS.length,    icon: Layers,    color: C.accent,
                  desc: "Abbreviations + definitions",  action: () => { setTypeFilter("all"); setTopicFilter("All Topics"); setView("list"); } },
                { key: "abbr",     label: "Abbreviations",      count: TERMS.filter(t=>t.type==="abbr").length, icon: Hash, color: C.blue,
                  desc: "Acronyms & short-form terms",  action: () => { setTypeFilter("abbr"); setTopicFilter("All Topics"); setView("list"); } },
                { key: "def",      label: "Definitions",        count: TERMS.filter(t=>t.type==="def").length,  icon: AlignLeft, color: C.green,
                  desc: "Conceptual explanations",      action: () => { setTypeFilter("def"); setTopicFilter("All Topics"); setView("list"); } },
                { key: "clusters", label: "Concept Clusters",   count: CLUSTERS.length, icon: GitMerge,  color: "#9B6DD9",
                  desc: "Terms best learned together",  action: () => setView("clusters") },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.key}
                    onClick={card.action}
                    style={{
                      background: t.surface, border: `1.5px solid ${t.border}`,
                      borderRadius: 16, padding: "20px 16px", cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = card.color; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.07)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} style={{ color: card.color }} />
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.count}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{card.label}</p>
                    <p style={{ fontSize: 11, color: t.textSub, lineHeight: 1.4 }}>{card.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* By topic */}
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.5px", color: t.textMuted, marginBottom: 14 }}>
              BY TOPIC
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {topicCounts.map(({ topic, count }) => {
                const color = TOPIC_COLORS[topic] || C.accent;
                const pct = (count / TERMS.length) * 100;
                return (
                  <div
                    key={topic}
                    onClick={() => { setTopicFilter(topic); setTypeFilter("all"); setView("list"); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = t.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{topic}</span>
                    <div style={{ width: 100, height: 5, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, minWidth: 28, textAlign: "right" }}>{count}</span>
                    <ChevronRight size={14} style={{ color: t.textMuted }} />
                  </div>
                );
              })}
            </div>

            {/* Quick practice row */}
            <div style={{ marginTop: 40, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: "24px" }}>
              <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.5px", color: t.textMuted, marginBottom: 16 }}>QUICK PRACTICE</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "All Terms · Mixed",   mode: "mixed",        deck: TERMS,                          color: C.accent },
                  { label: "Abbreviations only",  mode: "abbr-to-full", deck: TERMS.filter(t=>t.type==="abbr"), color: C.blue   },
                  { label: "Definitions only",    mode: "full-to-def",  deck: TERMS.filter(t=>t.type==="def"),  color: C.green  },
                ].map(item => (
                  <button key={item.label} onClick={() => startFlash(item.deck, item.mode)} style={{
                    background: `${item.color}14`, border: `1px solid ${item.color}40`,
                    borderRadius: 8, padding: "9px 16px",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    color: item.color, fontFamily: "'DM Sans', system-ui",
                    display: "flex", alignItems: "center", gap: 7,
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = `${item.color}26`}
                    onMouseLeave={e => e.currentTarget.style.background = `${item.color}14`}
                  >
                    <Zap size={13}/> {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CLUSTERS VIEW ── */}
        {view === "clusters" && (
          <ClusterView t={t} dark={dark} onStartFlash={(deck, mode) => { setFlashDeck(deck); setFlashMode(mode); setView("flash"); }} />
        )}

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 28px" }} className="fade-up">
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: t.textMuted }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search terms…"
                style={{
                  width: "100%", background: t.surface,
                  border: `1px solid ${t.border}`, borderRadius: 10,
                  padding: "11px 14px 11px 38px", fontSize: 14,
                  color: t.text, outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = t.border}
              />
            </div>

            {/* Filter chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {/* Type */}
              {[
                { key: "all",  label: "All" },
                { key: "abbr", label: "Abbreviations" },
                { key: "def",  label: "Definitions" },
              ].map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key)} style={{
                  background: typeFilter === f.key ? C.accent : t.surface,
                  color: typeFilter === f.key ? "#fff" : t.textSub,
                  border: `1px solid ${typeFilter === f.key ? C.accent : t.border}`,
                  borderRadius: 20, padding: "6px 14px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui", transition: "all 0.12s",
                }}>{f.label}</button>
              ))}
              <div style={{ width: 1, background: t.border, margin: "0 4px" }} />
              {TOPICS.map(tp => (
                <button key={tp} onClick={() => setTopicFilter(tp)} style={{
                  background: topicFilter === tp ? (TOPIC_COLORS[tp] || C.accent) : t.surface,
                  color: topicFilter === tp ? "#fff" : t.textSub,
                  border: `1px solid ${topicFilter === tp ? (TOPIC_COLORS[tp] || C.accent) : t.border}`,
                  borderRadius: 20, padding: "6px 14px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui", transition: "all 0.12s",
                }}>{tp}</button>
              ))}
            </div>

            <GlossaryList filtered={filtered} t={t} onStartFlash={startFlash} />
          </div>
        )}

        {/* ── FLASH VIEW ── */}
        {view === "flash" && (
          <FlashSession deck={flashDeck} mode={flashMode} t={t} onExit={() => setView("list")} />
        )}

      </div>
    </>
  );
}
