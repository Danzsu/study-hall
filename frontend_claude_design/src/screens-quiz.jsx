/* Quiz screen — multiple-choice, with inline explanation + results pathway */
const { useTheme, useStore, Card, Btn, Pill, SectionLabel, TopBar, Icon } = window;

function Quiz(){
  const t = useTheme();
  const s = useStore();
  const sid = s.params.id || "ml";
  const subject = window.SUBJECTS.find(x=>x.id===sid) || window.SUBJECTS[0];
  const questions = window.QUIZ_QUESTIONS;
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [revealed, setRevealed] = React.useState({});

  const q = questions[idx];
  const isAnswered = revealed[idx];
  const progress = (idx+1) / questions.length;

  const pick = (v) => {
    if(isAnswered) return;
    setAnswers(a => ({...a, [idx]:v}));
    setRevealed(r => ({...r, [idx]:true}));
  };
  const correct = q.type==="mc" ? (answers[idx] === q.correct) : (answers[idx] === q.correct);
  const done = Object.keys(revealed).length === questions.length;

  if(done && idx === questions.length-1 && s.params.showResults !== "no"){
    // keep on last card, show "see results"
  }

  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text}}>
      <TopBar crumbs={[{label:subject.name, href:`/subject?id=${subject.id}`}, {label:"Quiz"}]}/>
      <main style={{maxWidth:720, margin:"0 auto", padding:"36px 28px"}}>
        {/* Progress */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
          <Pill color="accent">Quiz · {subject.name}</Pill>
          <span style={{fontSize:12, fontWeight:700, color:t.textSub}}>{idx+1} of {questions.length}</span>
        </div>
        <div style={{height:5, background:t.border, borderRadius:99, overflow:"hidden", marginBottom:28}}>
          <div style={{width:`${progress*100}%`, height:"100%", background:t.accent, transition:"width .4s"}}/>
        </div>

        <Card pad={0} style={{animation:"fadeUp .3s ease both"}}>
          <div style={{padding:"30px 32px 24px"}}>
            <div style={{display:"flex", gap:10, marginBottom:16}}>
              <Pill color="muted">{q.section}</Pill>
              <Pill color="blue">{q.type === "mc" ? "Multiple choice" : "True / False"}</Pill>
            </div>
            <h2 style={{fontFamily:window.FONT_SERIF, fontSize:22, fontWeight:700, lineHeight:1.4, marginBottom:24}}>
              {q.q}
            </h2>

            {q.type==="mc" && (
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                {q.options.map((opt, i) => {
                  const picked = answers[idx] === i;
                  const isCorrect = i === q.correct;
                  let bg = t.surface, border = t.border, color = t.text;
                  if(isAnswered){
                    if(isCorrect){ bg = window.C.greenBg; border = window.C.green; color = t.text; }
                    else if(picked){ bg = window.C.redBg; border = window.C.red; color = t.text; }
                  } else if(picked){ bg = t.accentBg; border = t.accent; }
                  return (
                    <button key={i} onClick={()=>pick(i)} disabled={isAnswered} style={{
                      display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                      background:bg, border:`1.5px solid ${border}`, borderRadius:10,
                      fontFamily:window.FONT_SANS, fontSize:14.5, color, textAlign:"left",
                      cursor:isAnswered?"default":"pointer", transition:"all .15s",
                    }}>
                      <div style={{
                        width:24, height:24, borderRadius:"50%", flexShrink:0,
                        border:`1.5px solid ${isAnswered && isCorrect ? window.C.green : isAnswered && picked ? window.C.red : picked ? t.accent : t.border2}`,
                        background: isAnswered && isCorrect ? window.C.green : isAnswered && picked ? window.C.red : picked ? t.accent : "transparent",
                        color:"#fff", fontSize:11, fontWeight:800,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        {isAnswered && isCorrect ? "✓" : isAnswered && picked ? "✗" : String.fromCharCode(65+i)}
                      </div>
                      <span style={{flex:1, fontWeight: picked||isCorrect?600:500}}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {q.type==="tf" && (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                {[true,false].map(v => {
                  const picked = answers[idx] === v;
                  const isCorrect = v === q.correct;
                  let bg = t.surface, border = t.border;
                  if(isAnswered){
                    if(isCorrect){ bg = window.C.greenBg; border = window.C.green; }
                    else if(picked){ bg = window.C.redBg; border = window.C.red; }
                  } else if(picked){ bg = t.accentBg; border = t.accent; }
                  return (
                    <button key={String(v)} onClick={()=>pick(v)} disabled={isAnswered} style={{
                      padding:"18px", background:bg, border:`1.5px solid ${border}`, borderRadius:10,
                      fontFamily:window.FONT_SANS, fontSize:16, fontWeight:700, cursor:isAnswered?"default":"pointer",
                      color:t.text, transition:"all .15s",
                    }}>{v ? "✓ True" : "✗ False"}</button>
                  );
                })}
              </div>
            )}

            {isAnswered && (
              <div style={{
                marginTop:22, padding:"16px 18px",
                background: correct ? window.C.greenBg : window.C.redBg,
                borderLeft: `3px solid ${correct ? window.C.green : window.C.red}`,
                borderRadius:"0 10px 10px 0", animation:"fadeUp .25s ease both",
              }}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                  <Icon name={correct?"check-circle-2":"x-circle"} size={16} style={{color: correct?window.C.green:window.C.red}}/>
                  <span style={{fontSize:12, fontWeight:800, letterSpacing:"1px", color: correct?window.C.green:window.C.red, textTransform:"uppercase"}}>
                    {correct ? "Correct" : "Not quite"}
                  </span>
                </div>
                <p style={{fontSize:14, lineHeight:1.7, color:t.text, fontFamily:window.FONT_SERIF}}>{q.explain}</p>
              </div>
            )}
          </div>

          <div style={{borderTop:`1px solid ${t.border}`, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <Btn variant="ghost" icon="chevron-left" onClick={()=>setIdx(Math.max(0, idx-1))} style={{opacity:idx===0?0.4:1}}>Previous</Btn>
            <span style={{fontSize:11, color:t.textMuted}}>
              {Object.values(answers).filter((v,i)=> questions[i] && v===questions[i].correct).length} correct · {Object.keys(revealed).length - Object.values(answers).filter((v,i)=> questions[i] && v===questions[i].correct).length} wrong
            </span>
            {idx === questions.length-1 ? (
              <Btn variant="primary" icon="flag" onClick={()=>window.navigate("/quiz-results", {id:subject.id})} style={{opacity:isAnswered?1:0.4}} disabled={!isAnswered}>See results</Btn>
            ) : (
              <Btn variant="primary" icon="chevron-right" onClick={()=>setIdx(idx+1)} style={{opacity:isAnswered?1:0.4}} disabled={!isAnswered}>Next</Btn>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

// ── Quiz Results ──
function QuizResults(){
  const t = useTheme();
  const s = useStore();
  const sid = s.params.id || "ml";
  const subject = window.SUBJECTS.find(x=>x.id===sid) || window.SUBJECTS[0];
  const score = 8, total = 10;
  const pct = score/total*100;
  const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
  const msg = pct>=80 ? "Excellent work!" : pct>=60 ? "Solid effort — review the tricky ones." : "Worth another pass.";

  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text}}>
      <TopBar crumbs={[{label:subject.name, href:`/subject?id=${subject.id}`}, {label:"Quiz results"}]}/>
      <main style={{maxWidth:720, margin:"0 auto", padding:"40px 28px"}}>
        <div style={{textAlign:"center", marginBottom:28, animation:"fadeUp .4s ease both"}}>
          <img src="assets/mascot-whiteboard.png" style={{width:200, height:"auto", objectFit:"contain", marginBottom:10}}/>
          <Pill color="accent">Quiz complete</Pill>
          <h1 style={{fontFamily:window.FONT_SERIF, fontSize:36, fontWeight:700, letterSpacing:"-.6px", margin:"14px 0 8px"}}>{msg}</h1>
          <p style={{fontSize:14, color:t.textSub}}>{subject.name} · {total} questions</p>
        </div>

        <Card pad={0} style={{marginBottom:18}}>
          <div style={{padding:"28px 32px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:28, alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <svg width={110} height={110} style={{transform:"rotate(-90deg)"}}>
                <circle cx={55} cy={55} r={48} fill="none" stroke={t.surface2} strokeWidth={8}/>
                <circle cx={55} cy={55} r={48} fill="none" stroke={pct>=80?window.C.green:pct>=60?window.C.gold:t.accent} strokeWidth={8}
                  strokeLinecap="round" strokeDasharray={`${(pct/100)*301.6} 301.6`}/>
              </svg>
              <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                <span style={{fontSize:30, fontWeight:800, letterSpacing:"-1px"}}>{grade}</span>
                <span style={{fontSize:11, color:t.textMuted, fontWeight:700}}>{score}/{total}</span>
              </div>
            </div>
            <div>
              <p style={{fontSize:20, fontFamily:window.FONT_SERIF, fontWeight:700, marginBottom:4}}>{Math.round(pct)}% correct</p>
              <p style={{fontSize:13, color:t.textSub, lineHeight:1.6}}>Your average for {subject.name} is now <b>{subject.avgScore}%</b>. Keep up the momentum with 2 more quizzes this week to maintain your streak.</p>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:8, minWidth:180}}>
              <Btn variant="primary" icon="rotate-ccw" onClick={()=>window.navigate("/quiz", {id:subject.id})}>Retry quiz</Btn>
              <Btn variant="ghost" icon="book-open" onClick={()=>window.navigate("/study", {id:subject.id})}>Back to notes</Btn>
            </div>
          </div>
        </Card>

        {/* Breakdown */}
        <SectionLabel style={{marginBottom:12}}>Question breakdown</SectionLabel>
        <Card pad={0}>
          {window.QUIZ_QUESTIONS.map((q,i)=>{
            const ok = i<8;
            return (
              <div key={i} style={{padding:"14px 20px", borderBottom:i<window.QUIZ_QUESTIONS.length-1?`1px solid ${t.border}`:"none", display:"flex", gap:14, alignItems:"flex-start"}}>
                <div style={{width:28, height:28, borderRadius:"50%", background:ok?window.C.greenBg:window.C.redBg, color:ok?window.C.green:window.C.red, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  <Icon name={ok?"check":"x"} size={14}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontSize:13.5, fontWeight:600, marginBottom:2, color:t.text}}>{q.q}</p>
                  <p style={{fontSize:11.5, color:t.textMuted}}>{q.section}</p>
                </div>
                {!ok && <Btn variant="soft" icon="rotate-ccw" style={{fontSize:11, padding:"5px 10px"}}>Add to review</Btn>}
              </div>
            );
          })}
        </Card>
      </main>
    </div>
  );
}

Object.assign(window, { Quiz, QuizResults });
