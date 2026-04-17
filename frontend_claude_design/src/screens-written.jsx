/* Written test — essay answer + AI feedback (inline highlights, ideal comparison, follow-ups) */
const { useTheme, useStore, Card, Btn, Pill, SectionLabel, TopBar, Icon } = window;

function Written(){
  const t = useTheme();
  const s = useStore();
  const sid = s.params.id || "ml";
  const subject = window.SUBJECTS.find(x=>x.id===sid) || window.SUBJECTS[0];
  const questions = window.WRITTEN_QUESTIONS;
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [phase, setPhase] = React.useState("writing"); // writing | evaluating | feedback

  const q = questions[idx];

  const evaluate = () => {
    setPhase("evaluating");
    setTimeout(()=>setPhase("feedback"), 2200);
  };

  if(phase === "feedback"){
    return <WrittenFeedback
      question={q}
      answer={answers[idx] || ""}
      onNext={()=>{ setPhase("writing"); setIdx((idx+1)%questions.length); }}
      onRetry={()=>{ setPhase("writing"); }}
      subject={subject}
    />;
  }

  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text}}>
      <TopBar crumbs={[{label:subject.name, href:`/subject?id=${subject.id}`}, {label:"Written test"}]}/>
      <main style={{maxWidth:760, margin:"0 auto", padding:"36px 28px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
          <Pill color="accent">Written · {subject.name}</Pill>
          <span style={{fontSize:12, fontWeight:700, color:t.textSub}}>Q {idx+1} of {questions.length}</span>
        </div>

        <Card pad={0}>
          <div style={{padding:"30px 34px"}}>
            <div style={{display:"flex", gap:8, marginBottom:14}}>
              <Pill color="muted">{q.section}</Pill>
              <Pill color="blue">Long-form answer</Pill>
            </div>
            <h2 style={{fontFamily:window.FONT_SERIF, fontSize:22, fontWeight:700, lineHeight:1.45, marginBottom:18}}>{q.q}</h2>
            <p style={{fontSize:13, color:t.textMuted, marginBottom:16}}>
              Explain in your own words. Aim for 3–6 sentences. Your answer will be evaluated against a model answer by AI.
            </p>

            {phase === "evaluating" ? (
              <div style={{
                padding:"40px 30px", background:t.accentBg, border:`1px dashed ${t.accent+"55"}`,
                borderRadius:12, display:"flex", alignItems:"center", gap:22,
              }}>
                <img src="assets/mascot-clipboard.png" style={{width:84, height:"auto", objectFit:"contain", animation:"pulse 1.6s ease-in-out infinite"}}/>
                <div style={{flex:1}}>
                  <SectionLabel style={{marginBottom:6}}>Evaluating your answer</SectionLabel>
                  <p style={{fontFamily:window.FONT_SERIF, fontSize:17, fontWeight:600, color:t.text, marginBottom:10}}>Reading carefully…</p>
                  <div style={{display:"flex", gap:6}}>
                    {[0,1,2].map(i=><span key={i} style={{width:8, height:8, borderRadius:"50%", background:t.accent, animation:"pulse 1.2s ease-in-out infinite", animationDelay:`${i*.2}s`}}/>)}
                  </div>
                </div>
              </div>
            ) : (
              <textarea
                value={answers[idx] || ""}
                onChange={e=>setAnswers(a=>({...a, [idx]:e.target.value}))}
                placeholder="Write your answer…"
                style={{
                  width:"100%", minHeight:220, resize:"vertical",
                  background:t.surface2, border:`1.5px solid ${t.border}`, borderRadius:10,
                  padding:"16px 18px", fontSize:15, color:t.text,
                  fontFamily:window.FONT_SERIF, lineHeight:1.7, outline:"none",
                }}
                onFocus={e=>e.target.style.borderColor=t.accent}
                onBlur={e=>e.target.style.borderColor=t.border}
              />
            )}

            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:18}}>
              <span style={{fontSize:12, color:t.textMuted}}>{(answers[idx]||"").split(/\s+/).filter(Boolean).length} words</span>
              <Btn variant="primary" icon="sparkles" onClick={evaluate} disabled={phase==="evaluating" || (answers[idx]||"").length < 20}>
                Evaluate with AI
              </Btn>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

function WrittenFeedback({ question, answer, onNext, onRetry, subject }){
  const t = useTheme();
  // Build annotated view: split answer into sentences, mark some as green (good), some as gold (partial)
  const sentences = answer.split(/(?<=[.!?])\s+/).filter(Boolean);
  const marks = sentences.map((_,i) => i%3===0 ? "good" : i%3===1 ? "partial" : "neutral");
  const covered = question.keywords.slice(0, Math.ceil(question.keywords.length*0.6));
  const missing = question.keywords.slice(covered.length);
  const score = Math.min(95, 55 + covered.length * 8);

  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text}}>
      <TopBar crumbs={[{label:subject.name, href:`/subject?id=${subject.id}`}, {label:"Written test"}, {label:"Feedback"}]}/>
      <main style={{maxWidth:900, margin:"0 auto", padding:"36px 28px", display:"grid", gridTemplateColumns:"1fr 320px", gap:20, animation:"fadeUp .4s ease both"}}>

        <div>
          <Pill color="accent">AI Feedback · {score}% coverage</Pill>
          <h1 style={{fontFamily:window.FONT_SERIF, fontSize:26, fontWeight:700, lineHeight:1.35, margin:"14px 0 8px"}}>{question.q}</h1>
          <p style={{fontSize:13, color:t.textSub, marginBottom:24}}>Your answer, annotated by AI. Green = well-stated; gold = partial / needs depth.</p>

          {/* Annotated answer */}
          <Card pad={24} style={{marginBottom:20}}>
            <SectionLabel style={{marginBottom:14}}>Your answer, annotated</SectionLabel>
            <div style={{fontFamily:window.FONT_SERIF, fontSize:16, lineHeight:1.9, color:t.text}}>
              {sentences.map((sent, i) => {
                const m = marks[i];
                const bg = m==="good" ? window.C.greenBg : m==="partial" ? window.C.goldBg : "transparent";
                const border = m==="good" ? window.C.green : m==="partial" ? window.C.gold : "transparent";
                return (
                  <span key={i} style={{
                    background:bg, borderBottom: m!=="neutral" ? `2px solid ${border}` : "none",
                    padding:"0 3px", borderRadius:"3px 3px 0 0", marginRight:3,
                  }}>{sent} </span>
                );
              })}
            </div>
            <div style={{display:"flex", gap:18, marginTop:18, fontSize:12, color:t.textSub}}>
              <span style={{display:"flex", alignItems:"center", gap:6}}><span style={{width:14, height:10, background:window.C.greenBg, borderBottom:`2px solid ${window.C.green}`, borderRadius:"2px 2px 0 0"}}/> Well-stated</span>
              <span style={{display:"flex", alignItems:"center", gap:6}}><span style={{width:14, height:10, background:window.C.goldBg, borderBottom:`2px solid ${window.C.gold}`, borderRadius:"2px 2px 0 0"}}/> Partial / missing depth</span>
            </div>
          </Card>

          {/* Ideal answer */}
          <Card pad={24} style={{marginBottom:20}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
              <Icon name="sparkles" size={16} style={{color:t.accent}}/>
              <SectionLabel style={{margin:0}}>Model answer · for comparison</SectionLabel>
            </div>
            <div style={{background:t.accentBg, borderLeft:`3px solid ${t.accent}`, borderRadius:"0 10px 10px 0", padding:"16px 18px"}}>
              <p style={{fontFamily:window.FONT_SERIF, fontSize:15, lineHeight:1.75, color:t.text}}>{question.ideal}</p>
            </div>
          </Card>

          {/* Follow-ups */}
          <Card pad={24}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
              <Icon name="compass" size={16} style={{color:window.C.blue}}/>
              <SectionLabel style={{margin:0}}>Recommended follow-up</SectionLabel>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {missing.slice(0,3).map((kw,i)=>(
                <div key={i} onClick={()=>window.navigate("/study", {id:subject.id})} style={{
                  padding:"14px 16px", background:t.surface2, border:`1px solid ${t.border}`, borderRadius:10,
                  display:"flex", alignItems:"center", gap:12, cursor:"pointer",
                }}>
                  <Icon name="book-open" size={15} style={{color:window.C.blue}}/>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13.5, fontWeight:700}}>Review: {kw}</p>
                    <p style={{fontSize:11.5, color:t.textMuted, marginTop:2}}>This concept didn't quite come through in your answer.</p>
                  </div>
                  <Icon name="arrow-right" size={14} style={{color:t.textMuted}}/>
                </div>
              ))}
            </div>
          </Card>

          <div style={{display:"flex", gap:10, marginTop:24}}>
            <Btn variant="ghost" icon="rotate-ccw" onClick={onRetry}>Retry</Btn>
            <Btn variant="primary" icon="arrow-right" onClick={onNext}>Next question</Btn>
          </div>
        </div>

        {/* Side rail */}
        <aside style={{display:"flex", flexDirection:"column", gap:14}}>
          <Card pad={22}>
            <div style={{textAlign:"center", marginBottom:14}}>
              <img src="assets/mascot-clipboard.png" style={{width:100, objectFit:"contain"}}/>
            </div>
            <p style={{textAlign:"center", fontFamily:window.FONT_SERIF, fontSize:32, fontWeight:700, color:t.accent, lineHeight:1}}>{score}%</p>
            <p style={{textAlign:"center", fontSize:12, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginTop:4}}>Coverage</p>
            <div style={{height:6, background:t.border, borderRadius:99, overflow:"hidden", marginTop:16}}>
              <div style={{width:`${score}%`, height:"100%", background:t.accent}}/>
            </div>
          </Card>

          <Card pad={22}>
            <SectionLabel style={{marginBottom:12}}>Key concept checklist</SectionLabel>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {question.keywords.map((kw,i)=>{
                const got = covered.includes(kw);
                return (
                  <div key={i} style={{display:"flex", alignItems:"center", gap:8, fontSize:13}}>
                    <Icon name={got?"check-circle-2":"circle"} size={15} style={{color:got?window.C.green:t.border2, flexShrink:0}}/>
                    <span style={{color:got?t.text:t.textMuted, textDecoration:got?"none":"none", fontWeight:got?600:500}}>{kw}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>
      </main>
    </div>
  );
}

window.Written = Written;
