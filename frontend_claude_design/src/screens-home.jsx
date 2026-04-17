/* Dashboard (home) — overview of all subjects, activity heatmap, recent sessions, achievements */
const { Card, Btn, Pill, SectionLabel, TopBar, TabBar, Mascot, useTheme, useStore, Icon } = window;
const HOME_C = window.C;

function Heatmap({ t }){
  const W=15;
  const data = React.useMemo(()=>Array.from({length:W},(_,w)=>Array.from({length:7},(_,d)=>{
    const age=(W-w)*7-d; const p=age<7?0.82:age<21?0.55:0.3;
    return Math.random()<p?Math.ceil(Math.random()*4):0;
  })),[]);
  const bg = t.dark
    ? ["#252525","#4A1F10","#7A3020","#B04428","#E07355"]
    : ["#EDE9E3","#F5C4B3","#F0A088","#E07355","#C85E40"];
  const DAYS=["M","","W","","F","",""];
  const MONTHS=["Oct","Nov","Dec","Jan","Feb","Mar","Apr"];
  return (
    <Card pad={0}>
      <div style={{padding:"18px 22px 14px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <SectionLabel>Activity — 15 weeks</SectionLabel>
        <div style={{display:"flex", alignItems:"center", gap:4}}>
          <span style={{fontSize:10, color:t.textMuted}}>Less</span>
          {bg.map((c,i)=><div key={i} style={{width:10, height:10, borderRadius:2, background:c}}/>)}
          <span style={{fontSize:10, color:t.textMuted}}>More</span>
        </div>
      </div>
      <div style={{padding:"0 22px 20px", display:"flex", gap:4}}>
        <div style={{display:"flex", flexDirection:"column", gap:2, marginTop:18, marginRight:3}}>
          {DAYS.map((dd,i)=><div key={i} style={{height:11, fontSize:8, color:t.textMuted, fontWeight:600, lineHeight:"11px"}}>{dd}</div>)}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex", marginBottom:4}}>
            {MONTHS.map((m,i)=><div key={i} style={{flex:1, fontSize:8.5, fontWeight:600, color:t.textMuted}}>{m}</div>)}
            <div style={{flex:1}}/>
          </div>
          <div style={{display:"flex", gap:2}}>
            {data.map((week,wi)=>(
              <div key={wi} style={{flex:1, display:"flex", flexDirection:"column", gap:2}}>
                {week.map((v,di)=>(
                  <div key={di} style={{height:11, borderRadius:2, background:bg[v]}} title={v>0?`${v*10} min`:"No activity"}/>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function WeekBars({ t }){
  const WEEK = [
    {day:"Mon",mins:0},{day:"Tue",mins:18},{day:"Wed",mins:32},{day:"Thu",mins:25},
    {day:"Fri",mins:14},{day:"Sat",mins:40},{day:"Sun",mins:22},
  ];
  const max = Math.max(...WEEK.map(d=>d.mins),1);
  const total = WEEK.reduce((a,d)=>a+d.mins,0);
  return (
    <Card pad={0}>
      <div style={{padding:"18px 22px 12px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <SectionLabel>This week</SectionLabel>
        <span style={{fontSize:12, fontWeight:700, color:t.accent}}>{total} min</span>
      </div>
      <div style={{padding:"0 22px 20px", display:"flex", gap:6, alignItems:"flex-end", height:68}}>
        {WEEK.map((d,i)=>{
          const h = d.mins>0 ? Math.max(6, (d.mins/max)*55) : 4;
          const today = i===6;
          return (
            <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
              <div style={{width:"100%", height:h, borderRadius:4, background:d.mins===0?t.border:today?t.accent:`${t.accent}50`, transition:"height .5s"}}/>
              <span style={{fontSize:9, fontWeight:today?800:500, color:today?t.accent:t.textMuted}}>{d.day}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SubjectRow({ s, t, open, onToggle }){
  const pct = Math.round((s.done/s.questions)*100);
  return (
    <div style={{background:t.surface, border:`1px solid ${open?s.color+"45":t.border}`, borderRadius:14, overflow:"hidden", transition:"border-color .2s"}}>
      <div onClick={onToggle} style={{padding:"18px 22px", cursor:"pointer", display:"flex", alignItems:"center", gap:16}}>
        <div style={{width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0}}/>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div>
              <p style={{fontSize:15, fontWeight:700, color:t.text}}>{s.name}</p>
              <p style={{fontSize:12, color:t.textMuted, marginTop:2}}>{s.desc}</p>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:14}}>
              {s.streak>0 && (
                <span style={{fontSize:11, fontWeight:700, color:t.accent, display:"flex", alignItems:"center", gap:4}}>
                  <Icon name="flame" size={11}/>{s.streak}d
                </span>
              )}
              <span style={{fontSize:15, fontWeight:800, color:s.color}}>{pct}%</span>
            </div>
          </div>
          <div style={{height:5, background:t.border, borderRadius:99, overflow:"hidden"}}>
            <div style={{width:`${pct}%`, height:"100%", background:s.color, transition:"width .6s"}}/>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
            <span style={{fontSize:11, color:t.textMuted}}>{s.done} / {s.questions} questions · {s.lessons} lessons</span>
            <span style={{fontSize:11, color:t.textMuted}}>Avg <b style={{color:t.textSub}}>{s.avgScore}%</b></span>
          </div>
        </div>
        <Icon name="chevron-right" size={15} style={{color:t.textMuted, transform:open?"rotate(90deg)":"none", transition:"transform .2s"}}/>
      </div>

      {open && (
        <div style={{borderTop:`1px solid ${t.border}`, padding:"16px 22px 18px", animation:"fadeUp .18s ease both"}}>
          <SectionLabel style={{marginBottom:12}}>Sections</SectionLabel>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {s.sections.map((sec,i)=>{
              const sp = Math.round((sec.done/sec.q)*100);
              return (
                <div key={i} style={{display:"flex", alignItems:"center", gap:12}}>
                  <span style={{fontSize:13, color:t.textSub, minWidth:130}}>{sec.name}</span>
                  <div style={{flex:1, height:4, background:t.border, borderRadius:99, overflow:"hidden"}}>
                    <div style={{width:`${sp}%`, height:"100%", background:sp===100?window.C.green:s.color, opacity:sp===0?0.2:1, transition:"width .5s"}}/>
                  </div>
                  <span style={{fontSize:11, fontWeight:700, color:sp===100?window.C.green:sp>0?s.color:t.textMuted, minWidth:30, textAlign:"right"}}>
                    {sp===100?"✓":sp>0?`${sp}%`:"—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex", gap:10, marginTop:16}}>
            <Btn variant="primary" icon="arrow-right" onClick={(e)=>{e.stopPropagation(); window.navigate("/subject", {id:s.id});}}
                 style={{background:s.color, borderColor:s.color}}>Open subject</Btn>
            <Btn variant="ghost" icon="play" onClick={(e)=>{e.stopPropagation(); window.navigate("/quiz", {id:s.id});}}>Quick quiz</Btn>
            <Btn variant="soft" icon="pen-line" onClick={(e)=>{e.stopPropagation(); window.navigate("/flashcards", {id:s.id});}}>Flashcards</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard(){
  const t = useTheme();
  const [open, setOpen] = React.useState({ ml:true });
  const s = window.SUBJECTS;
  const totalDone = s.reduce((a,x)=>a+x.done,0);
  const totalQ = s.reduce((a,x)=>a+x.questions,0);
  const pctTotal = Math.round(totalDone/totalQ*100);
  const streak = Math.max(...s.map(x=>x.streak));
  const avgScore = Math.round(s.reduce((a,x)=>a+x.avgScore,0)/s.length);
  const sessions = s.reduce((a,x)=>a+x.quizzesTaken,0);
  const circ = 2*Math.PI*34, dash = (pctTotal/100)*circ;

  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text, paddingBottom:90}}>
      <TopBar/>
      <main style={{maxWidth:1040, margin:"0 auto", padding:"36px 28px 20px"}}>

        {/* Hero: mascot + streak */}
        <div className="fadeUp" style={{
          display:"grid", gridTemplateColumns:"auto 1fr auto", gap:28, alignItems:"center",
          background:t.surface, border:`1px solid ${t.border}`, borderRadius:18,
          padding:"26px 28px", marginBottom:20, animation:"fadeUp .4s ease both",
        }}>
          <div style={{position:"relative", flexShrink:0}}>
            <svg width={80} height={80} style={{transform:"rotate(-90deg)"}}>
              <circle cx={40} cy={40} r={34} fill="none" stroke={t.surface2} strokeWidth={6}/>
              <circle cx={40} cy={40} r={34} fill="none" stroke={t.accent} strokeWidth={6}
                strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}/>
            </svg>
            <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <span style={{fontSize:18, fontWeight:800}}>{pctTotal}%</span>
            </div>
          </div>
          <div>
            <h1 style={{fontFamily:window.FONT_SERIF, fontSize:26, fontWeight:700, letterSpacing:"-.5px", marginBottom:6}}>
              {streak>0 ? `${streak}-day streak 🔥` : "Start your streak today"}
            </h1>
            <p style={{fontSize:14, color:t.textSub}}>
              {totalDone} of {totalQ} questions answered across {s.length} subjects. Nice going — pick up where you left off.
            </p>
            <div style={{display:"flex", gap:10, marginTop:16}}>
              <Btn variant="primary" icon="arrow-right" onClick={()=>window.navigate("/study", {id:"ml", lesson:3})}>Continue learning</Btn>
              <Btn variant="ghost" icon="timer" onClick={()=>window.navigate("/pomodoro")}>Start pomodoro</Btn>
            </div>
          </div>
          <div style={{display:"flex", gap:28}}>
            {[
              {label:"Avg", value:`${avgScore}%`, color:window.C.blue},
              {label:"Sessions", value:sessions, color:window.C.green},
              {label:"Streak", value:`${streak}d`, color:t.accent},
            ].map(x=>(
              <div key={x.label} style={{textAlign:"center"}}>
                <p style={{fontSize:24, fontWeight:800, color:x.color, letterSpacing:"-.5px", lineHeight:1}}>{x.value}</p>
                <p style={{fontSize:11, color:t.textMuted, marginTop:5, fontWeight:600, letterSpacing:".4px", textTransform:"uppercase"}}>{x.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity row */}
        <div style={{display:"grid", gridTemplateColumns:"260px 1fr", gap:14, marginBottom:22, animation:"fadeUp .4s ease both .08s"}}>
          <WeekBars t={t}/>
          <Heatmap t={t}/>
        </div>

        {/* Subjects */}
        <SectionLabel style={{marginBottom:12}}>Subjects</SectionLabel>
        <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:24, animation:"fadeUp .4s ease both .12s"}}>
          {s.map(x => <SubjectRow key={x.id} s={x} t={t} open={!!open[x.id]} onToggle={()=>setOpen(p=>({...p,[x.id]:!p[x.id]}))}/>)}
          <div onClick={()=>window.navigate("/onboarding")} style={{
            border:`2px dashed ${t.border2}`, borderRadius:14, padding:"22px",
            display:"flex", alignItems:"center", gap:14, cursor:"pointer",
            color:t.textMuted, background:"transparent",
          }}>
            <div style={{width:36, height:36, borderRadius:"50%", background:t.surface2, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <Icon name="plus" size={16}/>
            </div>
            <div>
              <p style={{fontSize:14, fontWeight:700, color:t.textSub}}>Add a new subject</p>
              <p style={{fontSize:12, color:t.textMuted, marginTop:2}}>Upload notes or paste a syllabus — we'll turn it into lessons, flashcards and quizzes.</p>
            </div>
            <Icon name="arrow-right" size={14} style={{marginLeft:"auto", color:t.textMuted}}/>
          </div>
        </div>

        {/* Bottom grid: sessions + achievements */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
          <Card pad={0}>
            <div style={{padding:"16px 22px 12px", borderBottom:`1px solid ${t.border}`}}>
              <SectionLabel>Recent sessions</SectionLabel>
            </div>
            {window.RECENT_SESSIONS.map((x,i)=>{
              const pct = Math.round((x.score/x.total)*100);
              const sc = pct>=80?window.C.green:pct>=60?window.C.gold:t.accent;
              return (
                <div key={i} style={{padding:"13px 22px", borderBottom:i<3?`1px solid ${t.border}`:"none", display:"flex", alignItems:"center", gap:12}}>
                  <div style={{width:8, height:8, borderRadius:"50%", background:x.color}}/>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{fontSize:13, fontWeight:600}}>{x.type}</p>
                    <p style={{fontSize:11, color:t.textMuted}}>{x.subject}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:14, fontWeight:800, color:sc}}>{x.score}/{x.total}</p>
                    <p style={{fontSize:10, color:t.textMuted}}>{x.time}</p>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card pad={0}>
            <div style={{padding:"16px 22px 12px", borderBottom:`1px solid ${t.border}`}}>
              <SectionLabel>Achievements</SectionLabel>
            </div>
            <div style={{padding:"14px 22px 16px", display:"flex", flexDirection:"column", gap:12}}>
              {[
                {icon:"flame", label:"7-day streak", prog:5, total:7, done:false, color:t.accent},
                {icon:"target", label:"Perfect score", prog:8, total:10, done:false, color:window.C.gold},
                {icon:"award", label:"50 questions", prog:50, total:50, done:true, color:window.C.gold},
                {icon:"layers", label:"All subjects", prog:3, total:3, done:true, color:window.C.green},
                {icon:"zap", label:"Speed runner", prog:0, total:1, done:false, color:window.C.purple},
              ].map((a,i)=>{
                const pct = Math.min(100, Math.round(a.prog/a.total*100));
                return (
                  <div key={i} style={{display:"flex", alignItems:"center", gap:12, opacity:a.done?1:.8}}>
                    <div style={{width:32, height:32, borderRadius:9, flexShrink:0,
                      background:a.done?window.C.goldBg:t.surface2,
                      border:`1px solid ${a.done?window.C.gold+"40":t.border}`,
                      display:"flex", alignItems:"center", justifyContent:"center", color:a.done?window.C.gold:t.textMuted
                    }}>
                      <Icon name={a.icon} size={14}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex", justifyContent:"space-between", marginBottom:5}}>
                        <p style={{fontSize:13, fontWeight:700, color:a.done?t.text:t.textSub}}>{a.label}</p>
                        {a.done ? <Icon name="check-circle-2" size={13} style={{color:window.C.green}}/> : <span style={{fontSize:10, color:t.textMuted}}>{a.prog}/{a.total}</span>}
                      </div>
                      <div style={{height:3, background:t.border, borderRadius:99, overflow:"hidden"}}>
                        <div style={{width:`${pct}%`, height:"100%", background:a.done?window.C.green:a.color}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
      <TabBar/>
    </div>
  );
}

window.Dashboard = Dashboard;
