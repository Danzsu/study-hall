/* Study page — notes with callouts, LaTeX blocks, data split + overfit charts,
   Active Recall cards at end of lesson, Source Disclaimer block.
*/
const { useTheme, useStore, Card, Btn, Pill, SectionLabel, TopBar, Mascot, Icon } = window;

// ── HIGHLIGHT ──
function H({ children, color="accent" }){
  const t = useTheme();
  const map = {
    accent: { bg:t.accentBg2, border:t.accent },
    blue:   { bg:window.C.blueBg, border:window.C.blue },
    gold:   { bg:window.C.goldBg, border:window.C.gold },
    green:  { bg:window.C.greenBg, border:window.C.green },
  };
  const s = map[color];
  return <mark style={{background:s.bg, borderBottom:`2px solid ${s.border}`, color:"inherit", padding:"1px 3px", borderRadius:"3px 3px 0 0", fontWeight:600}}>{children}</mark>;
}

// ── TOOLTIP TERM (from glossary) ──
function T({ children, def }){
  const t = useTheme();
  const [show, setShow] = React.useState(false);
  return (
    <span style={{position:"relative", display:"inline-block"}}
          onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      <span style={{borderBottom:`1.5px dotted ${t.accent}`, cursor:"help", fontWeight:600, color:t.text}}>{children}</span>
      {show && (
        <span style={{
          position:"absolute", bottom:"calc(100% + 8px)", left:"50%", transform:"translateX(-50%)",
          background:t.text, color:t.bg, padding:"10px 14px", borderRadius:8,
          fontSize:12, fontFamily:window.FONT_SANS, lineHeight:1.5,
          width:260, textAlign:"left", zIndex:50,
          boxShadow:"0 8px 24px rgba(0,0,0,0.2)", fontWeight:500,
          animation:"fadeUp .15s ease both",
        }}>
          <span style={{fontSize:10, fontWeight:800, letterSpacing:"0.8px", color:t.accent, textTransform:"uppercase", display:"block", marginBottom:4}}>Definition</span>
          {def}
        </span>
      )}
    </span>
  );
}

// ── CALLOUT ──
function Callout({ icon, label, color="blue", children }){
  const t = useTheme();
  const colorMap = {
    accent: { border:t.accent, bg:t.accentBg },
    blue:   { border:window.C.blue, bg:window.C.blueBg },
    gold:   { border:window.C.gold, bg:window.C.goldBg },
    green:  { border:window.C.green, bg:window.C.greenBg },
  };
  const s = colorMap[color];
  return (
    <div style={{
      border:`1px solid ${s.border}`, borderLeft:`4px solid ${s.border}`,
      background:s.bg, borderRadius:"0 10px 10px 0", padding:"16px 20px",
      margin:"28px 0", display:"flex", gap:14,
    }}>
      <Icon name={icon} size={18} style={{color:s.border, flexShrink:0, marginTop:2}}/>
      <div>
        <p style={{fontSize:11, fontWeight:800, letterSpacing:"0.8px", color:s.border, marginBottom:5}}>{label}</p>
        <div style={{fontSize:14.5, lineHeight:1.7, color:t.text, fontFamily:window.FONT_SERIF}}>{children}</div>
      </div>
    </div>
  );
}

// ── LATEX BLOCK (uses KaTeX-style rendering via inline SVG/HTML; simple fallback with styled math font) ──
function Formula({ label, children, note }){
  const t = useTheme();
  return (
    <div style={{
      background:t.surface, border:`1px solid ${t.border}`, borderRadius:12,
      padding:"20px 24px", margin:"26px 0",
      display:"flex", alignItems:"center", gap:20,
    }}>
      {label && <div style={{
        fontSize:10, fontWeight:800, letterSpacing:"1px", color:t.textMuted,
        writingMode:"vertical-rl", transform:"rotate(180deg)",
        borderLeft:`2px solid ${t.accent}`, paddingLeft:8,
      }}>{label}</div>}
      <div style={{flex:1, fontFamily:"'Latin Modern Math','Cambria Math',Cambria,'Times New Roman',serif", fontSize:22, lineHeight:1.5, textAlign:"center", color:t.text}}>
        {children}
      </div>
      {note && <div style={{fontSize:11, color:t.textMuted, maxWidth:140, lineHeight:1.5}}>{note}</div>}
    </div>
  );
}

// ── DATA SPLIT DIAGRAM ──
function DataSplitDiagram(){
  const t = useTheme();
  const segs = [
    { label:"Training", pct:60, color:t.accent, desc:"Model learns patterns" },
    { label:"Validation", pct:20, color:window.C.blue, desc:"Tune hyperparameters" },
    { label:"Test", pct:20, color:window.C.green, desc:"Final evaluation" },
  ];
  return (
    <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"24px 26px", margin:"28px 0"}}>
      <SectionLabel style={{marginBottom:18}}>Visual · Data split</SectionLabel>
      <div style={{display:"flex", borderRadius:8, overflow:"hidden", height:46, marginBottom:18}}>
        {segs.map((s,i)=>(
          <div key={i} style={{width:`${s.pct}%`, background:s.color, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:800, color:"#fff", borderRight:i<2?"2px solid rgba(255,255,255,.3)":"none"}}>{s.pct}%</div>
        ))}
      </div>
      <div style={{display:"flex", gap:22, flexWrap:"wrap"}}>
        {segs.map((s,i)=>(
          <div key={i} style={{display:"flex", alignItems:"flex-start", gap:10}}>
            <div style={{width:12, height:12, borderRadius:3, background:s.color, marginTop:3}}/>
            <div>
              <p style={{fontSize:13, fontWeight:700}}>{s.label}</p>
              <p style={{fontSize:12, color:t.textSub}}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── OVERFIT CHART ──
function OverfitChart(){
  const t = useTheme();
  const w=320, h=140;
  const train=[[0,100],[40,75],[80,55],[120,38],[160,26],[200,18],[240,14],[280,12]];
  const val=[[0,100],[40,78],[80,62],[120,54],[160,54],[200,58],[240,68],[280,84]];
  const path=pts=>pts.map((p,i)=>`${i===0?"M":"L"}${p[0]+20},${h-p[1]*0.9}`).join(" ");
  return (
    <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"24px 26px", margin:"28px 0"}}>
      <SectionLabel style={{marginBottom:6}}>Visual · Overfitting</SectionLabel>
      <p style={{fontSize:13, color:t.textSub, marginBottom:18}}>Training error keeps dropping. Validation error bottoms out, then rises — that's overfitting.</p>
      <svg viewBox={`0 0 ${w+40} ${h+20}`} style={{width:"100%", maxWidth:420, display:"block"}}>
        {[0,1,2,3].map(i=><line key={i} x1={20} y1={h-i*35} x2={w+20} y2={h-i*35} stroke={t.border} strokeWidth={1}/>)}
        <path d={path(train)} fill="none" stroke={t.accent} strokeWidth={2.5} strokeLinecap="round"/>
        <path d={path(val)} fill="none" stroke={window.C.blue} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="6 3"/>
        <text x={w+24} y={h-train[train.length-1][1]*0.9+4} fontSize={11} fill={t.accent} fontWeight={700}>Train</text>
        <text x={w+24} y={h-val[val.length-1][1]*0.9+4} fontSize={11} fill={window.C.blue} fontWeight={700}>Val</text>
        <text x={20} y={h+16} fontSize={10} fill={t.textMuted}>Complexity →</text>
        <text x={4} y={16} fontSize={10} fill={t.textMuted} transform={`rotate(-90,10,${h/2})`}>Loss</text>
      </svg>
    </div>
  );
}

// ── SOURCE DISCLAIMER ──
function SourceDisclaimer({ sources }){
  const t = useTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{
      background:t.surface2, border:`1px solid ${t.border}`, borderRadius:12,
      margin:"32px 0 0", overflow:"hidden",
    }}>
      <div onClick={()=>setOpen(!open)} style={{
        padding:"14px 20px", display:"flex", alignItems:"center", gap:12, cursor:"pointer",
      }}>
        <Icon name="file-text" size={16} style={{color:t.textMuted}}/>
        <div style={{flex:1}}>
          <p style={{fontSize:13, fontWeight:700, color:t.text}}>AI-generated content · verify before exam</p>
          <p style={{fontSize:11.5, color:t.textMuted, marginTop:2}}>Grounded in {sources.length} sources from your notes — always cross-check.</p>
        </div>
        <Icon name={open?"chevron-up":"chevron-down"} size={16} style={{color:t.textMuted}}/>
      </div>
      {open && (
        <div style={{borderTop:`1px solid ${t.border}`, padding:"16px 20px 18px", background:t.surface, animation:"fadeUp .2s ease both"}}>
          <SectionLabel style={{marginBottom:12}}>Sources</SectionLabel>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {sources.map((src, i) => (
              <div key={i} style={{display:"flex", alignItems:"flex-start", gap:10, fontSize:13, color:t.textSub, padding:"8px 10px", borderRadius:8, background:t.surface2}}>
                <span style={{fontSize:10, fontWeight:800, color:t.accent, background:t.accentBg, padding:"2px 6px", borderRadius:4, minWidth:22, textAlign:"center", flexShrink:0, marginTop:1}}>{i+1}</span>
                <div style={{flex:1}}>
                  <p style={{fontWeight:600, color:t.text}}>{src.title}</p>
                  <p style={{fontSize:11.5, color:t.textMuted, marginTop:2}}>{src.detail}</p>
                </div>
                <span style={{fontSize:10, fontWeight:700, color:t.textMuted, flexShrink:0, marginTop:2}}>{src.type}</span>
              </div>
            ))}
          </div>
          <p style={{fontSize:11.5, color:t.textMuted, marginTop:14, lineHeight:1.6, fontStyle:"italic"}}>
            Explanations and definitions were generated by Claude using your uploaded materials as grounding. For high-stakes exam prep, verify formulas and definitions against the original source.
          </p>
        </div>
      )}
    </div>
  );
}

// ── ACTIVE RECALL CARDS ──
function ActiveRecall({ questions }){
  const t = useTheme();
  const [idx, setIdx] = React.useState(0);
  const [state, setState] = React.useState({}); // {qIdx: "correct" | "partial" | "wrong"}
  const [revealed, setRevealed] = React.useState({});
  const [typed, setTyped] = React.useState({});

  const q = questions[idx];
  const mark = (v) => { setState(s=>({...s, [idx]:v})); };

  const doneCount = Object.keys(state).length;
  const pct = Math.round(doneCount/questions.length*100);

  return (
    <section style={{margin:"48px 0 0"}}>
      <div style={{display:"flex", alignItems:"center", gap:14, marginBottom:18}}>
        <img src="assets/mascot-clipboard.png" style={{width:54, height:54, objectFit:"contain", flexShrink:0}}/>
        <div style={{flex:1}}>
          <SectionLabel style={{marginBottom:4}}>Active Recall · Test yourself</SectionLabel>
          <p style={{fontSize:14, color:t.textSub}}>Before moving on, close the notes and try to answer these in your own words.</p>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{display:"flex", gap:6, marginBottom:14}}>
        {questions.map((_,i) => {
          const s = state[i];
          const color = s==="correct"?window.C.green : s==="partial"?window.C.gold : s==="wrong"?window.C.red : (i===idx? t.accent : t.border);
          return (
            <button key={i} onClick={()=>setIdx(i)} style={{
              flex:1, height:4, borderRadius:99, background:color, border:"none",
              cursor:"pointer", transition:"background .2s",
            }}/>
          );
        })}
      </div>

      {/* Card */}
      <div style={{
        background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:14,
        padding:"28px 30px", minHeight:220,
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
          <span style={{fontSize:11, fontWeight:800, color:t.textMuted, letterSpacing:"1px"}}>QUESTION {idx+1} OF {questions.length}</span>
          {state[idx] && (
            <span style={{fontSize:11, fontWeight:800, color: state[idx]==="correct"?window.C.green : state[idx]==="partial"?window.C.gold : window.C.red, letterSpacing:".5px", textTransform:"uppercase"}}>
              ✓ {state[idx]==="correct"?"Confident":state[idx]==="partial"?"Partial":"Need review"}
            </span>
          )}
        </div>
        <p style={{fontFamily:window.FONT_SERIF, fontSize:18, fontWeight:600, lineHeight:1.5, color:t.text, marginBottom:18}}>{q.q}</p>

        <textarea
          placeholder="Type your answer here, then reveal the model answer…"
          value={typed[idx] || ""}
          onChange={e=>setTyped(p=>({...p, [idx]:e.target.value}))}
          style={{
            width:"100%", minHeight:72, resize:"vertical",
            background:t.surface2, border:`1px solid ${t.border}`, borderRadius:10,
            padding:"12px 14px", fontSize:14, color:t.text, fontFamily:window.FONT_SANS,
            lineHeight:1.5, outline:"none",
          }}
          onFocus={e=>e.target.style.borderColor=t.accent}
          onBlur={e=>e.target.style.borderColor=t.border}
        />

        {revealed[idx] ? (
          <div style={{marginTop:18, padding:"16px 18px", background:t.accentBg, borderLeft:`3px solid ${t.accent}`, borderRadius:"0 10px 10px 0", animation:"fadeUp .25s ease both"}}>
            <span style={{fontSize:10, fontWeight:800, letterSpacing:"1px", color:t.accent}}>MODEL ANSWER</span>
            <p style={{fontSize:14, color:t.text, lineHeight:1.7, marginTop:6, fontFamily:window.FONT_SERIF}}>{q.answer}</p>
            <p style={{fontSize:12, color:t.textSub, marginTop:12, fontWeight:700}}>How well did you know this?</p>
            <div style={{display:"flex", gap:8, marginTop:10}}>
              <button onClick={()=>mark("wrong")} style={btnStyle(t, window.C.red, state[idx]==="wrong")}>Forgot</button>
              <button onClick={()=>mark("partial")} style={btnStyle(t, window.C.gold, state[idx]==="partial")}>Partial</button>
              <button onClick={()=>mark("correct")} style={btnStyle(t, window.C.green, state[idx]==="correct")}>Confident</button>
            </div>
          </div>
        ) : (
          <Btn variant="primary" icon="eye" onClick={()=>setRevealed(p=>({...p, [idx]:true}))} style={{marginTop:14}}>Reveal answer</Btn>
        )}
      </div>

      {/* Nav */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16}}>
        <Btn variant="ghost" icon="chevron-left" onClick={()=>setIdx(Math.max(0, idx-1))} style={{opacity: idx===0?0.4:1}}>Previous</Btn>
        <span style={{fontSize:12, color:t.textMuted}}>{doneCount} of {questions.length} marked · {pct}% confidence reviewed</span>
        <Btn variant="primary" icon="chevron-right" onClick={()=>setIdx(Math.min(questions.length-1, idx+1))}>
          {idx===questions.length-1 ? "Done" : "Next"}
        </Btn>
      </div>
    </section>
  );
}
function btnStyle(t, color, on){
  return {
    flex:1, padding:"10px", borderRadius:8,
    background: on ? color : t.surface, color: on ? "#fff" : color,
    border: `1.5px solid ${color}`, cursor:"pointer",
    fontFamily:window.FONT_SANS, fontSize:13, fontWeight:700,
    transition:"background .15s, color .15s",
  };
}

// ── MAIN STUDY PAGE ──
function StudyPage(){
  const t = useTheme();
  const s = useStore();
  const sid = s.params.id || "ml";
  const subject = window.SUBJECTS.find(x=>x.id===sid) || window.SUBJECTS[0];
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [expanded, setExpanded] = React.useState({0:true, 1:true, 2:true});
  const curriculum = window.ML_CURRICULUM;
  const totalLessons = curriculum.reduce((a,x)=>a+x.lessons.length,0);
  const doneLessons = curriculum.reduce((a,x)=>a+x.lessons.filter(l=>l.done).length, 0);
  const progress = doneLessons/totalLessons;

  const sources = [
    { title:"ML Engineering Handbook, Ch. 4 — Data splits", detail:"Your uploaded PDF · pp. 48–57", type:"PDF" },
    { title:"Goodfellow et al. — Deep Learning", detail:"External reference · §5.3", type:"BOOK" },
    { title:"Lecture 3 slides — Evaluation", detail:"Your uploaded slides", type:"PPTX" },
  ];

  const recall = [
    { q:"In one sentence, explain why the test set should only be used once, at the very end.",
      answer:"Because every evaluation leaks information about the set. Re-using the test set while tuning implicitly turns it into a second validation set, and the 'final' score stops being an unbiased estimate of real-world performance." },
    { q:"A friend says: 'I'll use a 50/50 train/test split so my test estimate is more reliable.' What's wrong with this reasoning?",
      answer:"More test data does shrink the variance of the test-error estimate, but it halves the training data, which increases bias — the model itself becomes worse. Typical splits (60/20/20 or 80/10/10) balance these concerns. For small datasets, use k-fold cross-validation instead." },
    { q:"When should you prefer k-fold cross-validation over a fixed split?",
      answer:"When the dataset is small: a fixed split wastes data. k=5 or k=10 rotates the validation fold so every example is used for both training and validation, giving a more stable performance estimate at the cost of k× training time." },
  ];

  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text, fontFamily:window.FONT_SANS, display:"flex", flexDirection:"column"}}>
      <TopBar crumbs={[
        {label:"Subjects", href:"/home"},
        {label:subject.name, href:`/subject?id=${subject.id}`},
        {label:"Training, Validation & Test Sets"},
      ]} right={(
        <div style={{display:"flex", alignItems:"center", gap:8, background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20, padding:"5px 12px"}}>
          <div style={{width:60, height:5, background:t.border, borderRadius:99, overflow:"hidden"}}>
            <div style={{width:`${progress*100}%`, height:"100%", background:t.accent}}/>
          </div>
          <span style={{fontSize:11, fontWeight:700, color:t.textSub}}>{doneLessons}/{totalLessons}</span>
        </div>
      )}/>

      <div style={{display:"flex", flex:1}}>
        {sidebarOpen && (
          <aside style={{
            width:272, background:t.sidebar, borderRight:`1px solid ${t.sidebarBorder}`,
            padding:"20px 0", overflowY:"auto", position:"sticky", top:56,
            height:"calc(100vh - 56px)", flexShrink:0,
          }}>
            <div style={{padding:"0 22px 20px", borderBottom:`1px solid ${t.border}`}}>
              <SectionLabel style={{marginBottom:6}}>Course</SectionLabel>
              <p style={{fontSize:16, fontWeight:700, lineHeight:1.3}}>{subject.name}</p>
              <p style={{fontSize:12, color:t.textSub, marginTop:4}}>Foundations to deployment</p>
            </div>
            <nav style={{padding:"12px 0"}}>
              {curriculum.map((sec, si) => (
                <div key={si}>
                  <button onClick={()=>setExpanded(p=>({...p, [si]:!p[si]}))} style={{
                    width:"100%", background:"none", border:"none", padding:"8px 22px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    cursor:"pointer", color:t.textMuted,
                  }}>
                    <span style={{fontSize:10, fontWeight:800, letterSpacing:"1px"}}>{sec.section.toUpperCase()}</span>
                    <Icon name="chevron-down" size={13} style={{transform:expanded[si]?"rotate(180deg)":"none", transition:"transform .2s"}}/>
                  </button>
                  {expanded[si] && sec.lessons.map((l) => (
                    <div key={l.id} style={{
                      padding:"10px 22px 10px 18px", display:"flex", alignItems:"center", gap:10,
                      cursor:"pointer",
                      borderLeft: l.active ? `3px solid ${t.accent}` : "3px solid transparent",
                      background: l.active ? t.accentBg2 : "transparent",
                    }}>
                      <Icon name={l.done?"check-circle-2":"circle"} size={15}
                        style={{color:l.done?window.C.green:l.active?t.accent:t.border2, flexShrink:0}}/>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{fontSize:13, fontWeight:l.active?700:500, color:l.active?t.accent:l.done?t.textSub:t.text, lineHeight:1.3}}>{l.title}</p>
                        <p style={{fontSize:11, color:t.textMuted}}>{l.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        )}

        <main style={{flex:1, overflowY:"auto", maxHeight:"calc(100vh - 56px)", padding:"0 0 100px"}}>
          <div style={{maxWidth:760, margin:"0 auto", padding:"48px 44px", animation:"fadeUp .4s ease both"}}>
            {/* Header */}
            <div style={{marginBottom:36, paddingBottom:28, borderBottom:`1px solid ${t.border}`}}>
              <div style={{display:"flex", gap:10, alignItems:"center", marginBottom:16}}>
                <Pill color="accent">Lesson 3 · Foundations</Pill>
                <span style={{fontSize:12, color:t.textMuted}}>12 min read</span>
              </div>
              <h1 style={{fontFamily:window.FONT_SERIF, fontSize:38, fontWeight:700, lineHeight:1.2, letterSpacing:"-0.7px", marginBottom:14}}>
                Training, Validation &amp; Test Sets
              </h1>
              <p style={{fontSize:17, color:t.textSub, fontFamily:window.FONT_SERIF, fontStyle:"italic", lineHeight:1.6}}>
                How you split your data determines how well you can trust your model's reported performance.
              </p>
            </div>

            <div style={{fontFamily:window.FONT_SERIF, fontSize:16, lineHeight:1.85, color:t.text}}>

              <p style={{marginBottom:22}}>
                In most supervised machine learning tasks, best practice recommends splitting your data into three independent sets:
                a <H color="accent">training set</H>, a <H color="gold">validation set</H>, and a <H color="blue">test set</H>.
                Each plays a distinct role, and mixing them up is one of the most common sources of{" "}
                <T def="When information from your test set unintentionally influences model development, making test-set performance an overly optimistic estimate of real-world results.">data leakage</T>.
              </p>

              <p style={{marginBottom:22}}>
                To understand why, imagine you're a student preparing for an exam. You practice on past papers (training),
                check your weak areas on practice quizzes (validation), then sit the final exam (test).
                Using the final exam as practice defeats the purpose entirely.
              </p>

              <DataSplitDiagram/>

              <h2 style={h2Style(t)}>The training set</h2>
              <p style={{marginBottom:22}}>
                The <H color="accent">training set</H> is the data your model directly learns from.
                During training, the model adjusts its internal parameters to minimise prediction error on these examples.
                It typically makes up <H>60–80%</H> of your total dataset.
              </p>

              <Formula label="Training Objective" note="θ = parameters; L = loss function; D = training data">
                θ* = argmin<sub>θ</sub> &nbsp; <span style={{fontSize:"0.85em"}}>Σ</span><sub>(x,y)∈D<sub>train</sub></sub> &nbsp; <em>L</em>( f<sub>θ</sub>(x), y )
              </Formula>

              <Callout icon="alert-triangle" label="Common mistake" color="gold">
                Never use <H color="blue">test-set</H> performance to make decisions about your model architecture or hyperparameters.
                Every time you peek at test results and adjust, you're implicitly "leaking" information.
              </Callout>

              <h2 style={h2Style(t)}>The validation set</h2>
              <p style={{marginBottom:22}}>
                The <H color="gold">validation set</H> acts as a referee during development. After each training epoch,
                you evaluate performance on this held-out slice to detect{" "}
                <T def="When a model learns the training data including its noise, and fails to generalise. Signals: low training error, high validation error.">overfitting</T>{" "}
                — the phenomenon where your model memorises the training data rather than learning general patterns.
              </p>

              <OverfitChart/>

              <p style={{marginBottom:22}}>
                When validation loss stops improving (or starts rising) while training loss keeps dropping,
                it's time to stop — you've found the point of <H color="accent">optimal complexity</H>.
                This is the principle behind <em>early stopping</em>.
              </p>

              <Callout icon="lightbulb" label="Key insight" color="blue">
                The gap between training and validation error is a direct measure of your model's variance.
                A large gap means overfitting; a small gap but poor absolute performance means underfitting.
              </Callout>

              <Formula label="Bias–Variance" note="E[(ŷ − y)²] decomposed">
                E[(ŷ − y)²] = <span style={{color:t.accent}}>Bias²</span> + <span style={{color:window.C.blue}}>Variance</span> + <span style={{color:t.textMuted}}>σ²</span>
              </Formula>

              <h2 style={h2Style(t)}>The test set</h2>
              <p style={{marginBottom:22}}>
                The <H color="blue">test set</H> is your model's final exam — evaluated <em>exactly once</em>, after all
                development is complete. This gives you an unbiased estimate of real-world performance.
                Treat it as sealed until you're ready to ship.
              </p>

              <Callout icon="trending-up" label="Rule of thumb" color="green">
                For datasets over 10,000 rows, a 60/20/20 split works well. Under 1,000 rows, prefer k-fold cross-validation
                with k = 5 or k = 10 — it recovers information you'd otherwise lose to the holdouts.
              </Callout>
            </div>

            {/* Active Recall */}
            <ActiveRecall questions={recall}/>

            {/* Source Disclaimer */}
            <SourceDisclaimer sources={sources}/>

            {/* Bottom nav */}
            <div style={{marginTop:44, paddingTop:28, borderTop:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <Btn variant="ghost" icon="chevron-left">The ML Workflow</Btn>
              <div style={{display:"flex", gap:10}}>
                <Btn variant="ghost" icon="layers" onClick={()=>window.navigate("/flashcards", {id:subject.id})}>Flashcards</Btn>
                <Btn variant="primary" icon="arrow-right" onClick={()=>window.navigate("/quiz", {id:subject.id})}>
                  Take the quiz
                </Btn>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function h2Style(t){
  return {
    fontFamily:window.FONT_SANS, fontSize:22, fontWeight:800,
    letterSpacing:"-.4px", marginBottom:14, marginTop:40, color:t.text,
  };
}

window.StudyPage = StudyPage;
