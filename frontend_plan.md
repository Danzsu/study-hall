# Frontend Design Implementation Plan

> Referencia: `frontend_claude_design/` (src/ + uploads/ mappák)  
> Cél: minden képernyő 1:1-ben egyezzen a design fájlokkal
> Dátum: 2026-04-19

---

## Prioritási sorrend

| Prioritás | Képernyő / komponens | Indok |
|-----------|---------------------|-------|
| 🔴 P1 | Study oldal — Callout, ActiveRecall, SourceDisclaimer | Legnagyobb vizuális különbség, minden lecke érinti |
| 🔴 P1 | Subject hero méret + modes kártyák layout | Főoldalról azonnal látható |
| 🔴 P1 | Home — CTA gombok + SubjectRow gombok + "Add subject" | Első képernyő, sok hiány |
| 🟠 P2 | Written Test feedback — 2-oszlopos layout + annotáció | Teljesen hiányzó layout |
| 🟠 P2 | Quiz Results — grade arc + section breakdown + kérdéslista | Hiányzó eredményképernyő részletek |
| 🟠 P2 | Flashcard — Ghost stack + ResultOverlay | Kis animációs hiányok |
| 🟡 P3 | Glossary — Concept map, cluster view, flash session | Komplex extra funkciók |
| 🟡 P3 | Study oldal — inline `<H>` highlight, `<T>` tooltip | Szép-to-have a notes szöveghez |
| 🟢 P4 | Review, WrongAnswers | Már nagyon közel van |
| 🟢 P4 | Onboarding, Pomodoro, Settings, Search, ExamSim | Szinte teljesen egyezik |

---

## 1. HOME (Dashboard)

### Referencia: `frontend_claude_design/uploads/dashboard.jsx` + `src/screens-home.jsx`

### 1.1 Hero banner
**Design:**
```jsx
gridTemplateColumns: "auto 1fr auto"   // 3 oszlop
// 1. oszlop: 80px SVG progress ring
// 2. oszlop: h1 (streak szöveg) + subtitle + 2 CTA gomb
// 3. oszlop: 3 stat (Avg, Sessions, Streak)
```
**Hiány:**
- `src/screens/Home.jsx:236-256` — a hero-ban NINCS h1 + subtitle szöveg
- Nincs "Continue learning" (`Play` ikon, `primary` variant) gomb
- Nincs "Start pomodoro" (`Timer` ikon, `ghost` variant) gomb
- A stat block van (Avg/Sessions/Streak), de nincs a 2 CTA

**Fix:** `Home.jsx` hero div-jébe a `flex: 1` section-be add hozzá:
```jsx
<h1 style={{ fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
  {streak > 0 ? `${streak}-day streak 🔥` : 'Start your streak today'}
</h1>
<p style={{ fontSize: 13, color: t.textSub }}>
  {totalDone} of {totalQ} questions answered across {subjects.length} subjects
</p>
<div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
  <Btn variant="primary" onClick={() => navigate('/study', { id: subjects[0]?.id })}>
    <Play size={13}/> Continue learning
  </Btn>
  <Btn variant="ghost" onClick={() => navigate('/pomodoro')}>
    <Timer size={13}/> Start pomodoro
  </Btn>
</div>
```

### 1.2 SubjectRow — expanded state
**Design:** 3 gomb: "Open subject" (primary, subject.color háttér) + "Quick quiz" (ghost) + "Flashcards" (soft)  
**Hiány:** `Home.jsx:144-158` — csak "Quick quiz" + "Review" van, hiányzik az "Open subject" és "Flashcards"

**Fix:**
```jsx
<div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
  <button onClick={() => navigate('/subject', { id: s.id })}
    style={{ background: s.color, color: '#fff', ... }}>
    <ArrowRight size={11}/> Open subject
  </button>
  <button onClick={() => navigate('/quiz', { id: s.id })}>
    <Play size={11}/> Quick quiz
  </button>
  <button onClick={() => navigate('/flashcards', { id: s.id })}>
    <Layers size={11}/> Flashcards
  </button>
</div>
```

### 1.3 SubjectRow — meta text
**Design:** `{s.done} / {s.questions} questions · {s.lessons} lessons`  
**Hiány:** `Home.jsx:119` — `{s.lessons} lessons` szöveg hiányzik

**Fix:** `Home.jsx:119` sor:
```jsx
<span style={{ fontSize: 11, color: t.textMuted }}>
  {s.done} / {s.questions} questions · {s.lessons} lessons
</span>
```

### 1.4 "Add a new subject" kártya
**Design:** A subjects lista végén dashed border kártya, plus ikon körben, szöveg + arrow-right  
**Hiány:** Teljesen hiányzik

**Fix:** `Home.jsx:276` — subjects lista után, a `</div>` előtt:
```jsx
<div onClick={() => navigate('/onboarding')} style={{
  border: `2px dashed ${t.border2}`, borderRadius: 14, padding: '20px 18px',
  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', color: t.textMuted,
}}>
  <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.surface2,
    border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Plus size={16}/>
  </div>
  <div>
    <p style={{ fontSize: 14, fontWeight: 700, color: t.textSub }}>Add a new subject</p>
    <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
      Upload notes or paste a syllabus — we'll turn it into lessons, flashcards and quizzes.
    </p>
  </div>
  <ArrowRight size={14} style={{ marginLeft: 'auto', color: t.textMuted }}/>
</div>
```

---

## 2. SUBJECT DETAIL

### Referencia: `frontend_claude_design/uploads/subject_detail.jsx` + `src/screens-subject.jsx`

### 2.1 Hero méret
**Design:**
- h1: `fontSize: 36, fontFamily: "'Lora',serif", letterSpacing: '-0.8px'`
- Progress SVG: `width={110} height={110}`, r=48, strokeWidth=7
- Körben: fontSize 26, fontWeight 800 + `{s.done}/{s.questions}` sor

**Hiány:** `Subject.jsx:251` — h1 fontSize csak 22px (kell: 36px), `Subject.jsx:268` — SVG 64px (kell: 110px)

**Fix** `Subject.jsx:251`:
```jsx
<h1 style={{ fontFamily: "'Lora',serif", fontSize: 36, fontWeight: 700,
  letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 8, color: t.text }}>
  {subject.name}
</h1>
```

**Fix** `Subject.jsx:268-278` — SVG + körszöveg:
```jsx
<svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
  <circle cx={55} cy={55} r={48} fill="none" stroke={t.surface2} strokeWidth={7}/>
  <circle cx={55} cy={55} r={48} fill="none" stroke={subject.color} strokeWidth={7}
    strokeLinecap="round" strokeDasharray={`${(pct/100)*301.6} 301.6`}/>
</svg>
<div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center' }}>
  <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px' }}>{pct}%</span>
  <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 600 }}>{doneQ}/{subject.questions}</span>
</div>
```

### 2.2 "Continue lesson" gomb helye
**Design:** A circle jobb oldalán, a hero card-on BELÜL (`flexDirection: 'column', alignItems: 'center', gap: 12`)  
**Hiány:** `Subject.jsx:281-293` — önálló full-width button a hero UTÁN

**Fix:** Mozdítsd a Continue gombot a hero SVG mellé:
```jsx
<div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
  {/* ... SVG ring ... */}
  <button onClick={() => navigate('/study', { id: subjectId, name: subject.name })}
    style={{ background: subject.color, color: '#fff', border: 'none', borderRadius: 8,
      padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6 }}>
    <ArrowRight size={14}/> Continue lesson
  </button>
</div>
```
Majd a standalone Continue button blockat (`Subject.jsx:281-293`) töröld.

### 2.3 Modes kártyák layout
**Design:** Vízszintes kártya: `display: 'flex', alignItems: 'center', gap: 14`
```
[40x40 icon box] | [label + sub text] | [arrow-right]
```
**Hiány:** `Subject.jsx:328-340` — flexDirection: 'column' (függőleges), nincs `arrow-right`

**Fix** a mode kártya belső struktúrája:
```jsx
<button style={{ ..., display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}1a`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <m.icon size={18} style={{ color: m.color }}/>
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <p style={{ fontSize: 14, fontWeight: 700 }}>{m.label}</p>
    <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{m.sub}</p>
  </div>
  <ArrowRight size={14} style={{ color: t.textMuted, flexShrink: 0 }}/>
</button>
```

### 2.4 Sorrend: Modes ELŐBB, sections UTÓBB
**Design:** hero → modes grid → sections curriculum  
**Hiány:** `Subject.jsx:295-342` — sections (LEARNING PATH) ELŐBB, modes UTÓBB

**Fix:** Csere a JSX-ben — a STUDY MODES div-et (`Subject.jsx:320`) mozgasd a LEARNING PATH div (`Subject.jsx:295`) elé.

---

## 3. STUDY OLDAL

### Referencia: `frontend_claude_design/uploads/study_page.jsx` + `src/screens-study.jsx`

### 3.1 `<Callout>` komponens
**Design:** 4 színű callout (accent/blue/gold/green), bal oldalt thick border, ikon + uppercase label + serif tartalom

```jsx
function Callout({ icon, label, color = 'blue', children }) {
  const colorMap = {
    accent: { border: C.accent, bg: `${C.accent}10` },
    blue:   { border: C.blue,   bg: C.blueBg },
    gold:   { border: C.gold,   bg: C.goldBg },
    green:  { border: C.green,  bg: C.greenBg },
  }
  const s = colorMap[color]
  return (
    <div style={{ border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.border}`,
      background: s.bg, borderRadius: '0 10px 10px 0', padding: '16px 20px',
      margin: '28px 0', display: 'flex', gap: 14 }}>
      <IconComponent name={icon} size={18} style={{ color: s.border, flexShrink: 0, marginTop: 2 }}/>
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: s.border, marginBottom: 5 }}>
          {label}
        </p>
        <div style={{ fontSize: 14.5, lineHeight: 1.7, color: t.text, fontFamily: "'Lora',serif" }}>
          {children}
        </div>
      </div>
    </div>
  )
}
```

**Markdown szintaxis** (hogy a backend által generált tartalom is renderelje):
- `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]` → megfelelő callout szín
- Vagy custom: `:::blue Key insight\n...\n:::` szintaxis

**Hiány:** `Study.jsx:56-59` — csak sima `> blockquote` van, nincs ikon, nincs label, csak accent szín

### 3.2 `<ActiveRecall>` — type + reveal + rating
**Design (study_page.jsx):**
- Textarea ahol a tanuló begépeli a válaszát
- "Reveal answer" gomb → megjelenik a model answer
- 3 értékelő gomb: Forgot (red) / Partial (gold) / Confident (green)
- Progress dots az összes kérdéshez (piros/arany/zöld/semleges)
- Alul nav: Previous / "X of Y marked · Z% confidence reviewed" / Next

**Hiány:** `Study.jsx:162-193` — csak kattintásra kinyíló accordion, nincs textarea, nincs rating, nincs progress dots

**Fix:** `RecallCards` komponenst teljesen újra kell írni:

```jsx
function RecallCards({ items, t }) {
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState({})
  const [revealed, setRevealed] = useState({})
  const [ratings, setRatings] = useState({}) // {idx: 'correct'|'partial'|'wrong'}

  if (!items?.length) return null
  const q = items[idx]
  const doneCount = Object.keys(ratings).length

  return (
    <section style={{ margin: '48px 0 0' }}>
      {/* Header */}
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted, marginBottom: 12 }}>
        ACTIVE RECALL
      </p>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {items.map((_, i) => {
          const r = ratings[i]
          const color = r === 'correct' ? C.green : r === 'partial' ? C.gold : r === 'wrong' ? C.red
            : i === idx ? C.accent : t.border
          return <button key={i} onClick={() => setIdx(i)}
            style={{ flex: 1, height: 4, borderRadius: 99, background: color, border: 'none', cursor: 'pointer' }}/>
        })}
      </div>
      {/* Card */}
      <div style={{ background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: '28px 30px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, letterSpacing: '1px' }}>
          QUESTION {idx + 1} OF {items.length}
        </span>
        <p style={{ fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginTop: 12, marginBottom: 18 }}>
          {q.question}
        </p>
        <textarea
          value={typed[idx] || ''}
          onChange={e => setTyped(p => ({ ...p, [idx]: e.target.value }))}
          placeholder="Type your answer here, then reveal the model answer…"
          style={{ width: '100%', minHeight: 72, resize: 'vertical', background: t.surface2,
            border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px',
            fontSize: 14, color: t.text, fontFamily: "'DM Sans',system-ui", lineHeight: 1.5, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = t.border}
        />
        {revealed[idx] ? (
          <div style={{ marginTop: 18, padding: '16px 18px', background: `${C.accent}10`,
            borderLeft: `3px solid ${C.accent}`, borderRadius: '0 10px 10px 0' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px', color: C.accent }}>
              MODEL ANSWER
            </span>
            <p style={{ fontSize: 14, color: t.text, lineHeight: 1.7, marginTop: 6, fontFamily: "'Lora',serif" }}>
              {q.answer}
            </p>
            <p style={{ fontSize: 12, color: t.textSub, marginTop: 12, fontWeight: 700 }}>
              How well did you know this?
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[
                { key: 'wrong',   label: 'Forgot',    color: C.red },
                { key: 'partial', label: 'Partial',   color: C.gold },
                { key: 'correct', label: 'Confident', color: C.green },
              ].map(b => (
                <button key={b.key} onClick={() => setRatings(p => ({ ...p, [idx]: b.key }))}
                  style={{ flex: 1, padding: '10px', borderRadius: 8,
                    background: ratings[idx] === b.key ? b.color : t.surface,
                    color: ratings[idx] === b.key ? '#fff' : b.color,
                    border: `1.5px solid ${b.color}`, cursor: 'pointer',
                    fontFamily: "'DM Sans',system-ui", fontSize: 13, fontWeight: 700 }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setRevealed(p => ({ ...p, [idx]: true }))}
            style={{ marginTop: 14, background: C.accent, color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Eye size={14}/> Reveal answer
          </button>
        )}
      </div>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
          style={{ opacity: idx === 0 ? 0.4 : 1, ... }}>
          ← Previous
        </button>
        <span style={{ fontSize: 12, color: t.textMuted }}>
          {doneCount} of {items.length} marked
        </span>
        <button onClick={() => setIdx(Math.min(items.length - 1, idx + 1))}>
          {idx === items.length - 1 ? 'Done' : 'Next →'}
        </button>
      </div>
    </section>
  )
}
```

### 3.3 `<SourceDisclaimer>` expandable
**Design:**
- Kattintható fejléc: file-text ikon + "AI-generated content · verify before exam" + chevron
- Expandált állapot: sources lista numbered pill-lel + lábszöveg disclaimer

**Hiány:** `Study.jsx:196-213` — statikus lista, nincs AI warning fejléc, nincs expand/collapse

**Fix:** `SourcesBlock` → `SourceDisclaimer` átírás:
```jsx
function SourceDisclaimer({ sources, t }) {
  const [open, setOpen] = useState(false)
  if (!sources?.length) return null
  return (
    <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12,
      margin: '32px 0 0', overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '14px 20px', display: 'flex',
        alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <FileText size={16} style={{ color: t.textMuted }}/>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
            AI-generated content · verify before exam
          </p>
          <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
            Grounded in {sources.length} source{sources.length > 1 ? 's' : ''} from your notes — always cross-check.
          </p>
        </div>
        {open ? <ChevronUp size={16} style={{ color: t.textMuted }}/> : <ChevronDown size={16} style={{ color: t.textMuted }}/>}
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${t.border}`, padding: '16px 20px 18px', background: t.surface }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 12 }}>
            SOURCES
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sources.map((src, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13,
                color: t.textSub, padding: '8px 10px', borderRadius: 8, background: t.surface2 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, background: `${C.accent}14`,
                  padding: '2px 6px', borderRadius: 4, minWidth: 22, textAlign: 'center', flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: t.text }}>{src.title}</p>
                  {src.detail && <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{src.detail}</p>}
                </div>
                {src.type && <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, flexShrink: 0 }}>{src.type}</span>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
            Explanations and definitions were generated by AI using your uploaded materials as grounding.
            For high-stakes exam prep, verify formulas and definitions against the original source.
          </p>
        </div>
      )}
    </div>
  )
}
```

### 3.4 TopBar progress indicator
**Design:** TopBar `right` prop-ként progress pil (haladás bar + `doneLessons/totalLessons` szöveg)  
**Hiány:** `Study.jsx:363-388` toolbar-ban nincs a TopBar-hoz adott progress

**Fix:** A Study komponensben számold ki `doneLessons` / `totalLessons`-t és add a TopBar `right` prop-nak:
```jsx
const doneLessons = lessons.filter(l => l.done).length
const totalLessons = lessons.length

// A TopBar-nál (shell.jsx-en keresztül van kezelve, de a Study-ban a toolbar adja)
// A progress pill a study page saját toolbar-ában legyen:
<div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface2,
  border: `1px solid ${t.border}`, borderRadius: 20, padding: '5px 12px' }}>
  <div style={{ width: 60, height: 4, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
    <div style={{ width: `${totalLessons > 0 ? (doneLessons/totalLessons)*100 : 0}%`,
      height: '100%', background: C.accent }}/>
  </div>
  <span style={{ fontSize: 11, fontWeight: 700, color: t.textSub }}>{doneLessons}/{totalLessons}</span>
</div>
```

### 3.5 `<H>` inline szöveg kiemelés (P3 — opcionális)
**Design:** `<H color="accent">szöveg</H>` — colored background + bottom border a szó alatt  
**Implementáció:** Ha a backend `==szöveg==` szintaxist küld, parse-old ki és rendereld `<H>`-ként  
Szintaxis javaslat: `==szöveg==` → accent, `==szöveg=={blue}` → kék

### 3.6 `<T>` glossary tooltip (P3 — opcionális)
**Design:** Hover-re popup definíció boxot mutat (position absolute, dark background, serif szöveg)  
Megvalósítás: A study markdown parser ismeri fel a `{term}[definíció]` szintaxist

---

## 4. WRITTEN TEST

### Referencia: `frontend_claude_design/uploads/written_test.jsx` + `src/screens-written.jsx`

### 4.1 Evaluating animáció
**Design:** A textarea helyett teljes placeholder blokk: `mascot-clipboard.png` + "Reading carefully…" + 3 pulzáló dot  
**Hiány:** `Written.jsx` — nincs mascot kép, csak egyszerű loading state

**Fix:** Ha `phase === 'evaluating'`:
```jsx
<div style={{ padding: '40px 30px', background: `${C.accent}10`,
  border: `1px dashed ${C.accent}55`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 22 }}>
  <img src="/assets/mascot-clipboard.png" style={{ width: 84, objectFit: 'contain' }}/>
  <div>
    <p style={{ fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 600, marginBottom: 10 }}>
      Reading carefully…
    </p>
    <div style={{ display: 'flex', gap: 6 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent,
          animation: `pulse 1.2s ease-in-out infinite`, animationDelay: `${i*0.2}s` }}/>
      ))}
    </div>
  </div>
</div>
```

### 4.2 Feedback — 2-oszlopos layout
**Design:** `gridTemplateColumns: "1fr 320px"` — bal: annotáció + model answer + follow-up; jobb: mascot + % + keyword checklist  
**Hiány:** `Written.jsx` — single-column layout, nincs side rail

**Fix:** A feedback fázisban (grade ismert után):
```jsx
<main style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px',
  display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

  {/* Bal oldal */}
  <div>
    {/* Annotált válasz */}
    <div style={{ ... /* Card */ }}>
      <p>ANNOTATED ANSWER</p>
      {/* sentences sentence-level zöld/arany highlight */}
    </div>
    {/* Model answer */}
    <div style={{ background: `${C.accent}10`, borderLeft: `3px solid ${C.accent}`, ... }}>
      {question.ideal}
    </div>
    {/* Follow-up ajánlások */}
  </div>

  {/* Jobb rail */}
  <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {/* Mascot + score % */}
    <div style={{ textAlign: 'center' }}>
      <img src="/assets/mascot-clipboard.png" style={{ width: 100 }}/>
      <p style={{ fontSize: 32, fontWeight: 700, color: C.accent }}>{score}%</p>
      <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 700 }}>Coverage</p>
    </div>
    {/* Keyword checklist */}
    <div>
      <p>KEY CONCEPT CHECKLIST</p>
      {question.keywords.map((kw, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {covered.includes(kw)
            ? <CheckCircle2 size={15} style={{ color: C.green }}/>
            : <Circle size={15} style={{ color: t.border2 }}/>
          }
          <span style={{ color: covered.includes(kw) ? t.text : t.textMuted }}>{kw}</span>
        </div>
      ))}
    </div>
  </aside>
</main>
```

### 4.3 Sentence-level annotáció
**Design:** A user válaszát mondatokra bontja, minden mondatot green/gold/neutral-lal color-kódol  
**Hiány:** Sima szöveg megjelenítés

**Fix:**
```jsx
const sentences = answer.split(/(?<=[.!?])\s+/).filter(Boolean)
// coverage alapján marking: covered sentences → green, partially → gold, rest → neutral
{sentences.map((sent, i) => {
  const mark = /* logika alapján */ 'good' | 'partial' | 'neutral'
  return (
    <span key={i} style={{
      background: mark === 'good' ? C.greenBg : mark === 'partial' ? C.goldBg : 'transparent',
      borderBottom: mark !== 'neutral' ? `2px solid ${mark === 'good' ? C.green : C.gold}` : 'none',
      padding: '0 3px', borderRadius: '3px 3px 0 0', marginRight: 3,
    }}>{sent} </span>
  )
})}
```

---

## 5. QUIZ RESULTS

### Referencia: `frontend_claude_design/uploads/quiz_results.jsx`

### 5.1 Score arc + grade
**Design:**
- 110px SVG arc, grade betű (A/B/C/D/F) a közepén, `{score}/{total}` alatta
- Szín: pct>=80 → green, pct>=60 → gold, különben → accent
- Jobb oldalon: szöveg + 3 action gomb

**Hiány:** `Quiz.jsx` quiz results screen-t tartalmaz de nincs grade betű, nincs megfelelő layout

**Fix:** Külön `QuizResults` komponens (ami már le is van kódolva a design-ban):
```jsx
const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'
const arcColor = pct >= 80 ? C.green : pct >= 60 ? C.gold : C.accent
// SVG: cx=55, cy=55, r=48, strokeDasharray={(pct/100)*301.6} 301.6
```

### 5.2 Section breakdown chart
**Design:** Minden section-höz progress bar + helyes/összes kérdés szám, section szín szerint  
**Hiány:** Nincs section breakdown

### 5.3 Question breakdown lista
**Design:** Collapsible sorok — kérdés szöveg + helyes/helytelen badge, expand-ra: helyes válasz + magyarázat + "Add to review" gomb  
**Hiány:** Nincs kérdéslista az eredmény képernyőn

---

## 6. FLASHCARD

### Referencia: `frontend_claude_design/uploads/flashcard.jsx`

### 6.1 Ghost stack
**Design:** 2 ghost kártya a fő kártya mögött, eltolva
```jsx
function Ghosts({ t }) {
  return (
    <>
      {[2, 1].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: i * 7, left: i * 4, right: -(i * 4),
          height: 300, background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: 20, opacity: 0.38 - i * 0.12, zIndex: -i,
        }}/>
      ))}
    </>
  )
}
```
**Hiány:** `Flashcard.jsx` — nincs ghost stack komponens

### 6.2 ResultOverlay flash
**Design:** Kártya felett fadeOut overlay: zöld ha "known", piros ha "retry"
```jsx
function ResultOverlay({ result }) {
  if (!result) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none', zIndex: 5,
      background: result === 'known' ? `${C.green}18` : `${C.red}14`,
      animation: 'rfade 380ms ease forwards',
    }}/>
  )
}
```
**Hiány:** `Flashcard.jsx` — nincs result flash overlay

### 6.3 Back kártya: topic pill + colored glow border
**Design:** Back oldalon top-right sarokban topic pill, border: `1px solid ${backColor}50`, `boxShadow: 0 0 0 4px ${backColor}0c`  
**Hiány:** `Flashcard.jsx` — nincs topic pill a back-en, nincs colored border/glow

---

## 7. GLOSSARY

### Referencia: `frontend_claude_design/uploads/glossary_v3.jsx`

### 7.1 Flash session módok
**Design:** 3 mód a session-hoz:
- `abbr-to-full`: Rövidítés → teljes név
- `full-to-def`: Teljes név → definíció  
- `mixed`: Random mindkettő

**Hiány:** `Glossary.jsx` — van flash session, de nincs mód választó

### 7.2 Concept clusters nézet (P3)
**Design:** 8 cluster csoport (Bias-Variance, Classification Metrics, stb.) — kártyás megjelenítés, klaszterenként kapcsolódó termsek  
**Hiány:** Nincs cluster view

### 7.3 Force-directed concept map (P3)
**Design:** Canvas alapú interaktív graph, csomópontok vonszolhatók, pan/zoom  
**Hiány:** Nincs concept map

---

## 8. KÉPERNYŐK AMELYEK MÁR KÖZEL VANNAK (kisebb javítások)

### 8.1 Review
Jelenlegi: nagyon közel a design-hoz (`Hl` kiemelés megvan, topic filter, bookmark, difficulty badge)  
**Hiányzó részletek:**
- `review.jsx` design-ban: "Key points" lista (bullet pontok a magyarázat után)
- Figure komponensek (BiasVariance, DataSplit inline SVG ábrák) bizonyos kérdéseknél
- "Related terms" chip-ek a kérdés alján

### 8.2 WrongAnswers
Jelenlegi: szinte pontos  
**Hiányzó részletek:**
- Design-ban: "X wrong · Y mastered" stat bar a fejlécben
- A header-ban stat: `{wrong.length} to review · {mastered} mastered`

### 8.3 Onboarding
Jelenlegi: szinte pontos  
**Hiányzó részletek:**
- Design-ban a subjects kártyákon emoji ikon is van (🤖 ML, 📊 Stats, stb.)
- `Subject.jsx:30` design-ban `emoji` mező is van az adatoknál

### 8.4 Pomodoro
Jelenlegi: szinte pontos  
**Kisebb különbség:**
- Design Ring: `size=240`, current: `size=260`
- Design header alap méretesebb padding

### 8.5 Settings
Jelenlegi: szinte pontos  
**Kisebb különbség:**
- Design-ban: `Edit2` ikon a felhasználónév mellett (szerkesztési gomb)
- `LogOut` gomb a lap alján

### 8.6 Search
Jelenlegi: szinte pontos  
**Kisebb különbség:**
- Design-ban: "Quick navigation" section (Subject / Quiz / Flashcards / Written Test shortcutok) üres query esetén
- A result item-ek snippetjében bold highlight pontosabb

### 8.7 Exam Simulation
Jelenlegi: nagyon közel  
**Kisebb különbség:**
- Design config screenben: kérdésszám ± gombokkal (Plus/Minus) — az van
- Design-ban flag-elt kérdések számlálója a fejlécben (`{flagged} flagged`)

---

## 9. GLOBÁLIS / DESIGN TOKENS

A jelenlegi `src/theme.js` teljes egyezésben van a design tokenekkel:
- `C.accent: "#E07355"` ✅
- `LIGHT/DARK` objektumok ✅
- `FONT_SANS/SERIF/MONO` ✅

**Egyetlen hiány:** A design-ban `C.purple` és `purpleBg` is definiált — ellenőrizd hogy `src/theme.js`-ben megvan-e.

---

## 10. MASCOT KÉPEK

A design képernyőkön ezek a képek szerepelnek:
- `mascot-plain.png` — TopBar logo
- `mascot-wave.png` — Dashboard hero (opcionálisan)
- `mascot-clipboard.png` — ActiveRecall fejléc + Written evaluating animáció + Written feedback side rail
- `mascot-whiteboard.png` — Quiz results fejléc
- `mascot-reading.png` — Study oldal (opcionálisan)

**Jelenlegi állapot:** `public/assets/` mappában van-e mind az 5? Ellenőrizd.

---

## 11. ANIMÁCIÓK

A design-ban definiált kulcs animációk:
```css
@keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes rfade  { 0%{opacity:1} 100%{opacity:0} }  /* Flashcard result overlay */
@keyframes cardDrop { from{opacity:0;transform:translateY(-20px) scale(0.96)} to{opacity:1;transform:none} }
```

**Hiány:** `rfade` és `cardDrop` animációk nincsenek a globals.css-ben

**Fix** `app/globals.css`-be:
```css
@keyframes rfade    { 0%{opacity:1} 100%{opacity:0} }
@keyframes cardDrop { from{opacity:0;transform:translateY(-20px) scale(0.96)} to{opacity:1;transform:none} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
```

---

## Implementációs sorrend (sprint-ek)

### Sprint 1 — Leginkább látható változások
1. Subject hero: h1 36px, circle 110px, `{doneQ}/{total}` felirat
2. Subject modes: vízszintes kártya layout + arrow-right + sorrend csere
3. Home: CTA gombok hozzáadása hero-ba
4. Home: SubjectRow 3 gomb + lessons szöveg + "Add subject" kártya

### Sprint 2 — Study oldal gazdagítás
5. Callout komponens (4 szín + ikon + label) + markdown parse
6. ActiveRecall átírás (textarea + reveal + rating + dots)
7. SourceDisclaimer expandable (AI warning + numbered sources)
8. TopBar study progress pill

### Sprint 3 — Written Test & Quiz Results
9. Written: 2-oszlopos feedback layout
10. Written: sentence-level annotáció + keyword checklist sidebar
11. Written: evaluating mascot animáció
12. Quiz Results: grade arc + section breakdown + question lista

### Sprint 4 — Animációk & Finishing
13. Flashcard: Ghost stack + ResultOverlay + topic pill + colored glow
14. Glossary: flash session módok
15. Globals.css: rfade, cardDrop, pulse animációk
16. Mascot képek ellenőrzés
17. WrongAnswers / Review kisebb hiányok
18. Glossary concept clusters (P3)
