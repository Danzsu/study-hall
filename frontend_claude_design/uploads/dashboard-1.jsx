import { useState } from "react";
import {
  Flame, TrendingUp, Target, BookOpen,
  ChevronRight, Moon, Sun, Award, Zap,
  BarChart2, CheckCircle2, Calendar, Play, PenLine
} from "lucide-react";

const C = {
  accent:  "#E07355", accentHov:"#C85E40",
  accentBg:"rgba(224,115,85,0.10)", accentBg2:"rgba(224,115,85,0.16)",
  blue:    "#4A7FC1", blueBg:  "rgba(74,127,193,0.11)",
  green:   "#5A9E72", greenBg: "rgba(90,158,114,0.11)",
  gold:    "#C49A3C", goldBg:  "rgba(196,154,60,0.11)",
  purple:  "#9B6DD9",
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

// ── DATA ──────────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { id:"ml",    name:"Machine Learning", color:C.accent,
    total:150, done:87, quizzesTaken:12, avgScore:74, streak:5,
    sections:[
      { name:"ML Framing",    q:30, done:30 },
      { name:"Data Prep",     q:35, done:28 },
      { name:"Evaluation",    q:40, done:22 },
      { name:"Supervised",    q:28, done:7  },
      { name:"Deep Learning", q:17, done:0  },
    ],
  },
  { id:"stats", name:"Statistics", color:C.blue,
    total:120, done:43, quizzesTaken:6, avgScore:81, streak:2,
    sections:[
      { name:"Probability",   q:30, done:30 },
      { name:"Distributions", q:35, done:13 },
      { name:"Inference",     q:30, done:0  },
      { name:"Regression",    q:25, done:0  },
    ],
  },
  { id:"algo",  name:"Algorithms", color:C.green,
    total:180, done:12, quizzesTaken:2, avgScore:62, streak:0,
    sections:[
      { name:"Sorting",       q:30, done:12 },
      { name:"Graph Theory",  q:40, done:0  },
      { name:"Dynamic Prog.", q:35, done:0  },
      { name:"Complexity",    q:40, done:0  },
      { name:"Data Structs",  q:35, done:0  },
    ],
  },
];

const WEEK = [
  { day:"Mon", mins:0  },
  { day:"Tue", mins:18 },
  { day:"Wed", mins:32 },
  { day:"Thu", mins:25 },
  { day:"Fri", mins:14 },
  { day:"Sat", mins:40 },
  { day:"Sun", mins:0  },
];

const SESSIONS = [
  { type:"Quiz",         subject:"Machine Learning", score:8,  total:10, time:"2h ago",    color:C.accent },
  { type:"Written Test", subject:"Statistics",       score:7,  total:10, time:"Yesterday", color:C.blue   },
  { type:"Flashcards",   subject:"Machine Learning", score:14, total:18, time:"Yesterday", color:C.purple },
  { type:"Quiz",         subject:"Algorithms",       score:5,  total:10, time:"2 days ago",color:C.green  },
];

const ACHIEVEMENTS = [
  { icon:Flame,        label:"7-day streak",  desc:"Study 7 days in a row",   done:false, progress:5,  total:7  },
  { icon:Target,       label:"Perfect score", desc:"Get 10/10 on a quiz",     done:false, progress:8,  total:10 },
  { icon:Award,        label:"50 questions",  desc:"Answer 50 questions",     done:true,  progress:50, total:50 },
  { icon:BarChart2,    label:"All subjects",  desc:"Study 3+ subjects",       done:true,  progress:3,  total:3  },
  { icon:Zap,          label:"Speed runner",  desc:"Complete quiz in < 5 min",done:false, progress:0,  total:1  },
];

// ── HEATMAP DATA ──────────────────────────────────────────────────────────────
function buildHeatmap() {
  const W = 15;
  return Array.from({length:W}, (_,w) =>
    Array.from({length:7}, (_,d) => {
      const age = (W-w)*7 - d;
      const p = age < 7 ? 0.82 : age < 21 ? 0.55 : 0.3;
      return Math.random() < p ? Math.ceil(Math.random()*4) : 0;
    })
  );
}
const HMAP = buildHeatmap();
const MONTHS = ["Oct","Nov","Dec","Jan","Feb","Mar","Apr"];

// ── HEATMAP ───────────────────────────────────────────────────────────────────
function Heatmap({ dark, t }) {
  const bg  = dark
    ? ["#252525","#4A1F10","#7A3020","#B04428","#E07355"]
    : ["#EDE9E3","#F5C4B3","#F0A088","#E07355","#C85E40"];
  const DAYS = ["M","","W","","F","",""];

  return (
    <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"18px 20px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted }}>ACTIVITY — 15 WEEKS</p>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:10, color:t.textMuted }}>Less</span>
          {bg.map((c,i)=><div key={i} style={{ width:8, height:8, borderRadius:2, background:c }}/>)}
          <span style={{ fontSize:10, color:t.textMuted }}>More</span>
        </div>
      </div>
      <div style={{ display:"flex", gap:3 }}>
        {/* Day labels */}
        <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:18, marginRight:3 }}>
          {DAYS.map((d,i)=>(
            <div key={i} style={{ height:11, fontSize:8, color:t.textMuted, fontWeight:600, lineHeight:"11px" }}>{d}</div>
          ))}
        </div>
        <div style={{ flex:1 }}>
          {/* Month row */}
          <div style={{ display:"flex", marginBottom:4 }}>
            {MONTHS.map((m,i)=>(
              <div key={i} style={{ flex:1, fontSize:8, fontWeight:600, color:t.textMuted }}>{m}</div>
            ))}
            <div style={{ flex:1 }}/>
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {HMAP.map((week,wi)=>(
              <div key={wi} style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
                {week.map((v,di)=>(
                  <div key={di} style={{ height:11, borderRadius:2, background:bg[v], cursor:v>0?"pointer":"default" }}
                    title={v>0?`${v*10} min`:"No activity"}/>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── WEEKLY BARS ───────────────────────────────────────────────────────────────
function WeekBars({ t }) {
  const max = Math.max(...WEEK.map(d=>d.mins), 1);
  const total = WEEK.reduce((a,d)=>a+d.mins,0);
  return (
    <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"18px 20px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted }}>THIS WEEK</p>
        <span style={{ fontSize:12, fontWeight:700, color:C.accent }}>{total} min</span>
      </div>
      <div style={{ display:"flex", gap:5, alignItems:"flex-end", height:60 }}>
        {WEEK.map((d,i)=>{
          const h = d.mins > 0 ? Math.max(5, (d.mins/max)*52) : 3;
          const today = i===6;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <div style={{
                width:"100%", height:h, borderRadius:4,
                background: d.mins===0 ? t.border : today ? C.accent : `${C.accent}50`,
                transition:"height 0.4s cubic-bezier(0.22,1,0.36,1)",
              }}/>
              <span style={{ fontSize:9, fontWeight:today?700:500, color:today?C.accent:t.textMuted }}>{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SUBJECT CARD ──────────────────────────────────────────────────────────────
function SubjectRow({ s, t, open, onToggle }) {
  const pct = Math.round((s.done/s.total)*100);
  return (
    <div style={{ background:t.surface, border:`1px solid ${open ? s.color+"45" : t.border}`, borderRadius:14, overflow:"hidden", transition:"border-color 0.2s" }}>
      <div
        onClick={onToggle}
        style={{ padding:"16px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}
        onMouseEnter={e=>e.currentTarget.style.background=t.surface2}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        {/* Color dot */}
        <div style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }}/>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
            <p style={{ fontSize:14, fontWeight:700, color:t.text }}>{s.name}</p>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {s.streak > 0 && (
                <span style={{ fontSize:11, fontWeight:700, color:C.accent, display:"flex", alignItems:"center", gap:3 }}>
                  <Flame size={11}/>{s.streak}d
                </span>
              )}
              <span style={{ fontSize:13, fontWeight:800, color:s.color }}>{pct}%</span>
            </div>
          </div>
          <div style={{ height:4, background:t.border, borderRadius:99, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:s.color, borderRadius:99, transition:"width 0.6s cubic-bezier(0.22,1,0.36,1)" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
            <span style={{ fontSize:11, color:t.textMuted }}>{s.done} / {s.total} questions</span>
            <span style={{ fontSize:11, color:t.textMuted }}>Avg <b style={{ color:t.textSub }}>{s.avgScore}%</b></span>
          </div>
        </div>
        <ChevronRight size={14} style={{ color:t.textMuted, transform:open?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0 }}/>
      </div>

      {open && (
        <div style={{ borderTop:`1px solid ${t.border}`, padding:"14px 18px 16px", animation:"fadeDown 0.18s ease both" }}>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:11 }}>SECTIONS</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {s.sections.map((sec,i)=>{
              const sp = Math.round((sec.done/sec.q)*100);
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:12, color:t.textSub, minWidth:112, flexShrink:0 }}>{sec.name}</span>
                  <div style={{ flex:1, height:4, background:t.border, borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${sp}%`, height:"100%", background:sp===100?C.green:s.color, borderRadius:99, opacity:sp===0?0.25:1, transition:"width 0.5s" }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:sp===100?C.green:sp>0?s.color:t.textMuted, minWidth:28, textAlign:"right" }}>
                    {sp===100?"✓":sp>0?`${sp}%`:"—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <button style={{ flex:1, padding:"8px", background:s.color, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',system-ui", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <Play size={11}/> Quick quiz
            </button>
            <button style={{ flex:1, padding:"8px", background:t.surface2, border:`1px solid ${t.border}`, borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", color:t.textSub, fontFamily:"'DM Sans',system-ui", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <BookOpen size={11}/> Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dark, setDark]     = useState(false);
  const [open, setOpen]     = useState({ ml:true });
  const t = dark ? DARK : LIGHT;

  const totalDone = SUBJECTS.reduce((a,s)=>a+s.done,0);
  const totalQ    = SUBJECTS.reduce((a,s)=>a+s.total,0);
  const pctTotal  = Math.round((totalDone/totalQ)*100);
  const streak    = Math.max(...SUBJECTS.map(s=>s.streak));
  const avgScore  = Math.round(SUBJECTS.reduce((a,s)=>a+s.avgScore,0)/SUBJECTS.length);
  const sessions  = SUBJECTS.reduce((a,s)=>a+s.quizzesTaken,0);

  const circ = 2*Math.PI*30;
  const dash  = (pctTotal/100)*circ;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
        .fu{animation:fadeUp .32s ease both}
        .fu2{animation:fadeUp .32s ease both .07s}
        .fu3{animation:fadeUp .32s ease both .13s}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${dark?"#333":"#ddd"};border-radius:10px}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background 0.3s" }}>

        {/* HEADER */}
        <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 24px", gap:12, position:"sticky", top:0, zIndex:100 }}>
          <TrendingUp size={15} style={{color:C.accent}}/>
          <span style={{fontWeight:800,fontSize:14}}>Progress</span>
          <div style={{marginLeft:"auto"}}>
            <button onClick={()=>setDark(d=>!d)} style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:t.textSub, fontSize:12, fontWeight:600 }}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        <main style={{ maxWidth:780, margin:"0 auto", padding:"32px 24px 80px" }}>

          {/* ── SUMMARY BANNER ── */}
          <div className="fu" style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:"24px", marginBottom:20, display:"flex", alignItems:"center", gap:24 }}>
            {/* Ring */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <svg width={72} height={72} style={{transform:"rotate(-90deg)"}}>
                <circle cx={36} cy={36} r={30} fill="none" stroke={t.surface2} strokeWidth={5}/>
                <circle cx={36} cy={36} r={30} fill="none" stroke={C.accent} strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ}`}
                  style={{transition:"stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)"}}
                />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:16, fontWeight:800, color:t.text, letterSpacing:"-0.5px" }}>{pctTotal}%</span>
              </div>
            </div>

            {/* Text */}
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:"'Lora',serif", fontSize:20, fontWeight:700, letterSpacing:"-0.3px", marginBottom:4 }}>
                {streak > 0 ? `${streak}-day streak` : "Start your streak today"}
              </h1>
              <p style={{ fontSize:13, color:t.textSub }}>
                {totalDone} of {totalQ} questions answered across {SUBJECTS.length} subjects
              </p>
            </div>

            {/* Quick stats inline */}
            <div style={{ display:"flex", gap:24, flexShrink:0 }}>
              {[
                { label:"Avg score",  value:`${avgScore}%`, color:C.blue   },
                { label:"Sessions",   value:sessions,       color:C.green  },
                { label:"Streak",     value:`${streak}d`,   color:C.accent },
              ].map(({label,value,color})=>(
                <div key={label} style={{ textAlign:"center" }}>
                  <p style={{ fontSize:20, fontWeight:800, color, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</p>
                  <p style={{ fontSize:11, color:t.textMuted, marginTop:4 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ACTIVITY ROW ── */}
          <div className="fu2" style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:14, marginBottom:20 }}>
            <WeekBars t={t}/>
            <Heatmap dark={dark} t={t}/>
          </div>

          {/* ── SUBJECTS ── */}
          <div className="fu2" style={{ marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted, marginBottom:12 }}>SUBJECTS</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {SUBJECTS.map(s=>(
                <SubjectRow key={s.id} s={s} t={t} open={!!open[s.id]} onToggle={()=>setOpen(p=>({...p,[s.id]:!p[s.id]}))}/>
              ))}
            </div>
          </div>

          {/* ── BOTTOM GRID ── */}
          <div className="fu3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

            {/* Recent sessions */}
            <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${t.border}` }}>
                <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted }}>RECENT SESSIONS</p>
              </div>
              {SESSIONS.map((s,i)=>{
                const pct = Math.round((s.score/s.total)*100);
                const scoreColor = pct>=80?C.green:pct>=60?C.gold:C.accent;
                return (
                  <div key={i} style={{ padding:"11px 18px", borderBottom:i<SESSIONS.length-1?`1px solid ${t.border}`:"none", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:t.text }}>{s.type}</p>
                      <p style={{ fontSize:11, color:t.textMuted }}>{s.subject}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:13, fontWeight:800, color:scoreColor }}>{s.score}/{s.total}</p>
                      <p style={{ fontSize:10, color:t.textMuted }}>{s.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Achievements */}
            <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${t.border}` }}>
                <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.7px", color:t.textMuted }}>ACHIEVEMENTS</p>
              </div>
              <div style={{ padding:"12px 18px 14px", display:"flex", flexDirection:"column", gap:11 }}>
                {ACHIEVEMENTS.map((a,i)=>{
                  const Icon = a.icon;
                  const pct  = Math.min(100, Math.round((a.progress/a.total)*100));
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:11, opacity:a.done?1:0.75 }}>
                      <div style={{
                        width:30, height:30, borderRadius:8, flexShrink:0,
                        background:a.done?C.goldBg:t.surface2,
                        border:`1px solid ${a.done?C.gold+"40":t.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <Icon size={13} style={{color:a.done?C.gold:t.textMuted}}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <p style={{ fontSize:12, fontWeight:700, color:a.done?t.text:t.textSub }}>{a.label}</p>
                          {a.done
                            ? <CheckCircle2 size={13} style={{color:C.green}}/>
                            : <span style={{ fontSize:10, color:t.textMuted }}>{a.progress}/{a.total}</span>
                          }
                        </div>
                        <div style={{ height:3, background:t.border, borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:a.done?C.green:C.gold, borderRadius:99 }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
