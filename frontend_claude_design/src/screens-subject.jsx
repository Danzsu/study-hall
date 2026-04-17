/* Subject detail — section list, study modes, progress */
const { useTheme, useStore, Card, Btn, Pill, SectionLabel, TopBar, TabBar, Mascot, Icon } = window;

function StatusIcon({ status, color, size=18, t }){
  if(status==="complete") return <div style={{width:size, height:size, borderRadius:"50%", background:window.C.green, display:"flex", alignItems:"center", justifyContent:"center"}}><Icon name="check" size={size*0.6} color="#fff"/></div>;
  if(status==="active") return <div style={{width:size, height:size, borderRadius:"50%", background:color, border:`3px solid ${t.surface}`, boxShadow:`0 0 0 2px ${color}`}}/>;
  return <div style={{width:size, height:size, borderRadius:"50%", background:t.surface2, border:`1.5px solid ${t.border2}`}}/>;
}

function SubjectDetail(){
  const t = useTheme();
  const s = useStore();
  const sid = s.params.id || "ml";
  const subject = window.SUBJECTS.find(x=>x.id===sid) || window.SUBJECTS[0];
  const [expanded, setExpanded] = React.useState({ s2:true });

  // Build a richer section list (reuse data but add status)
  const sections = subject.sections.map((sec,i)=>{
    const status = sec.done===sec.q ? "complete" : sec.done>0 ? "active" : "upcoming";
    return {
      ...sec,
      color: [subject.color, window.C.blue, window.C.green, window.C.gold, window.C.purple][i % 5],
      status,
      label: `S${i+1}`,
      lessons: Array.from({length: Math.min(4, Math.ceil(sec.q/8))}, (_,li) => ({
        id:`${sec.id}-l${li+1}`,
        title:[
          ["Data collection & labelling","Exploratory analysis","Feature engineering","Train / Val / Test split"],
          ["Probability fundamentals","Conditional probability","Bayes rule","Expected value"],
          ["Linear regression","Logistic regression","Decision trees","Neural basics"],
          ["Evaluation metrics","Confusion matrix","ROC & AUC","Cross-validation"],
          ["Deployment","Monitoring","Model drift"],
        ][i % 5][li] || `Lesson ${li+1}`,
        time: `${9+li} min`,
        done: (sec.done / sec.q) > (li+1)/4,
        active: (sec.done / sec.q) >= li/4 && (sec.done / sec.q) < (li+1)/4,
      })),
    };
  });

  const MODES = [
    { icon:"play",       label:"Quiz",         sub:"Scored · 10 questions",     color:t.accent,        route:"/quiz" },
    { icon:"book-open",  label:"Study",        sub:"Notes & explanations",      color:window.C.blue,   route:"/study" },
    { icon:"layers",     label:"Flashcards",   sub:"Tap to flip",               color:window.C.green,  route:"/flashcards" },
    { icon:"pen-line",   label:"Written test", sub:"AI evaluates your answer",  color:window.C.purple, route:"/written" },
    { icon:"rotate-ccw", label:"Wrong answers",sub:"Practice mistakes",         color:window.C.gold,   route:"/wrong-answers" },
    { icon:"clipboard-list", label:"Exam sim", sub:"Full timed simulation",     color:window.C.red,    route:"/exam" },
  ];

  const pct = Math.round(subject.done/subject.questions*100);

  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text, paddingBottom:90}}>
      <TopBar crumbs={[{label:"Subjects", href:"/home"}, {label:subject.name}]}/>
      <main style={{maxWidth:980, margin:"0 auto", padding:"32px 28px 20px"}}>
        {/* Hero */}
        <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:24, marginBottom:24, animation:"fadeUp .4s ease both"}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
              <div style={{width:10, height:10, borderRadius:"50%", background:subject.color}}/>
              <span style={{fontSize:11, fontWeight:800, letterSpacing:"1px", color:t.textMuted}}>SUBJECT</span>
              {subject.streak>0 && <Pill color="accent">🔥 {subject.streak}d streak</Pill>}
            </div>
            <h1 style={{fontFamily:window.FONT_SERIF, fontSize:36, fontWeight:700, letterSpacing:"-.8px", lineHeight:1.1, marginBottom:8}}>{subject.name}</h1>
            <p style={{fontSize:15, color:t.textSub, maxWidth:580, lineHeight:1.55}}>{subject.desc}. Structured into {subject.sections.length} sections with interactive lessons, quizzes, flashcards and a written exam.</p>
            <div style={{display:"flex", gap:20, marginTop:16, color:t.textSub, fontSize:12}}>
              <span style={{display:"flex", alignItems:"center", gap:6}}><Icon name="book-open" size={13}/> {subject.lessons} lessons</span>
              <span style={{display:"flex", alignItems:"center", gap:6}}><Icon name="target" size={13}/> {subject.questions} questions</span>
              <span style={{display:"flex", alignItems:"center", gap:6}}><Icon name="clock" size={13}/> ~24 hours</span>
              <span style={{display:"flex", alignItems:"center", gap:6}}><Icon name="trending-up" size={13}/> Avg {subject.avgScore}%</span>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12}}>
            <div style={{position:"relative"}}>
              <svg width={110} height={110} style={{transform:"rotate(-90deg)"}}>
                <circle cx={55} cy={55} r={48} fill="none" stroke={t.surface2} strokeWidth={7}/>
                <circle cx={55} cy={55} r={48} fill="none" stroke={subject.color} strokeWidth={7}
                  strokeLinecap="round" strokeDasharray={`${(pct/100)*301.6} 301.6`}/>
              </svg>
              <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                <span style={{fontSize:26, fontWeight:800, letterSpacing:"-1px"}}>{pct}%</span>
                <span style={{fontSize:10, color:t.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:".6px"}}>{subject.done}/{subject.questions}</span>
              </div>
            </div>
            <Btn variant="primary" icon="arrow-right" onClick={()=>window.navigate("/study", {id:subject.id, lesson:3})} style={{background:subject.color, borderColor:subject.color}}>
              Continue lesson
            </Btn>
          </div>
        </div>

        {/* Study modes grid */}
        <SectionLabel style={{marginBottom:12}}>Modes</SectionLabel>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12, marginBottom:28, animation:"fadeUp .4s ease both .06s"}}>
          {MODES.map((m,i)=>(
            <div key={i} onClick={()=>window.navigate(m.route, {id:subject.id})} style={{
              background:t.surface, border:`1px solid ${t.border}`, borderRadius:14,
              padding:"18px 18px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14,
              transition:"transform .14s, border-color .14s, box-shadow .14s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor=m.color+"55"; e.currentTarget.style.boxShadow=`0 8px 20px ${m.color}15`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform=""; e.currentTarget.style.borderColor=t.border; e.currentTarget.style.boxShadow="none";}}>
              <div style={{width:40, height:40, borderRadius:10, background:`${m.color}1a`, color:m.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <Icon name={m.icon} size={18}/>
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:14, fontWeight:700}}>{m.label}</p>
                <p style={{fontSize:12, color:t.textMuted, marginTop:2}}>{m.sub}</p>
              </div>
              <Icon name="arrow-right" size={14} style={{color:t.textMuted}}/>
            </div>
          ))}
        </div>

        {/* Sections */}
        <SectionLabel style={{marginBottom:12}}>Curriculum · {sections.length} sections</SectionLabel>
        <div style={{display:"flex", flexDirection:"column", gap:10, animation:"fadeUp .4s ease both .1s"}}>
          {sections.map((sec,i)=>{
            const open = !!expanded[sec.id];
            const sPct = Math.round(sec.done/sec.q*100);
            return (
              <Card key={sec.id} pad={0} style={{overflow:"hidden", borderColor:open?sec.color+"45":t.border}}>
                <div onClick={()=>setExpanded(p=>({...p, [sec.id]:!p[sec.id]}))} style={{padding:"18px 22px", cursor:"pointer", display:"flex", alignItems:"center", gap:16}}>
                  <StatusIcon status={sec.status} color={sec.color} size={22} t={t}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                      <div>
                        <span style={{fontSize:10, fontWeight:800, color:sec.color, letterSpacing:"1.5px"}}>{sec.label}</span>
                        <p style={{fontSize:16, fontWeight:700, marginTop:2}}>{sec.name}</p>
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:14}}>
                        <span style={{fontSize:12, color:t.textMuted}}>{sec.done}/{sec.q}</span>
                        <span style={{fontSize:15, fontWeight:800, color:sec.color}}>{sPct}%</span>
                      </div>
                    </div>
                    <div style={{height:4, background:t.border, borderRadius:99, overflow:"hidden", marginTop:10}}>
                      <div style={{width:`${sPct}%`, height:"100%", background:sec.color}}/>
                    </div>
                  </div>
                  <Icon name="chevron-right" size={16} style={{color:t.textMuted, transform:open?"rotate(90deg)":"none", transition:"transform .2s"}}/>
                </div>
                {open && (
                  <div style={{borderTop:`1px solid ${t.border}`, padding:"6px 12px 14px 48px"}}>
                    {sec.lessons.map((l,li)=>(
                      <div key={li} onClick={()=>window.navigate("/study", {id:subject.id, section:sec.id, lesson:l.id})} style={{
                        display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
                        borderRadius:8, cursor:"pointer",
                        background:l.active ? t.accentBg2 : "transparent",
                      }}
                        onMouseEnter={e=>{ if(!l.active) e.currentTarget.style.background=t.surface2; }}
                        onMouseLeave={e=>{ if(!l.active) e.currentTarget.style.background="transparent"; }}>
                        <Icon name={l.done?"check-circle-2":"circle"} size={16} style={{color:l.done?window.C.green:l.active?sec.color:t.border2}}/>
                        <span style={{flex:1, fontSize:13.5, fontWeight:l.active?700:500, color:l.active?sec.color:l.done?t.textSub:t.text}}>{l.title}</span>
                        <span style={{fontSize:11, color:t.textMuted}}>{l.time}</span>
                        <Icon name="chevron-right" size={13} style={{color:t.textMuted}}/>
                      </div>
                    ))}
                    <div style={{display:"flex", gap:8, paddingLeft:12, marginTop:10}}>
                      <Btn variant="primary" icon="play" onClick={(e)=>{e.stopPropagation(); window.navigate("/quiz", {id:subject.id, section:sec.id});}}
                           style={{background:sec.color, borderColor:sec.color}}>Section quiz</Btn>
                      <Btn variant="ghost" icon="layers" onClick={(e)=>{e.stopPropagation(); window.navigate("/flashcards", {id:subject.id});}}>Flashcards</Btn>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </main>
      <TabBar/>
    </div>
  );
}

window.SubjectDetail = SubjectDetail;
