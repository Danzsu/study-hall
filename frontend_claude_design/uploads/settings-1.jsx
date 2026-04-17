import { useState } from "react";
import {
  ArrowLeft, Moon, Sun, ChevronRight,
  Flame, Download, Trash2, LogOut, Check,
  Volume2, Clock, Edit2, BookOpen
} from "lucide-react";

const C = {
  accent:  "#E07355", accentHov:"#C85E40",
  accentBg:"rgba(224,115,85,0.10)", accentBg2:"rgba(224,115,85,0.17)",
  blue:    "#4A7FC1", blueBg:  "rgba(74,127,193,0.11)",
  green:   "#5A9E72", greenBg: "rgba(90,158,114,0.11)",
  gold:    "#C49A3C",
  purple:  "#9B6DD9",
  red:     "#C0504A", redBg:   "rgba(192,80,74,0.10)",
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

const SEMESTERS = [
  "1st semester","2nd semester","3rd semester","4th semester",
  "5th semester","6th semester","7th semester","8th semester",
  "Postgraduate","Exam prep",
];

const LEVELS = ["Beginner","Intermediate","Advanced","Expert"];

const LEVEL_COLORS = {
  Beginner:     C.green,
  Intermediate: C.blue,
  Advanced:     C.accent,
  Expert:       "#9B6DD9",
};

const DEFAULT_SUBJECTS = [
  { id:"ml",    name:"Machine Learning", color:C.accent, active:true,  level:"Intermediate" },
  { id:"stats", name:"Statistics",       color:C.blue,   active:true,  level:"Beginner"     },
  { id:"algo",  name:"Algorithms",       color:C.green,  active:true,  level:"Beginner"     },
  { id:"dl",    name:"Deep Learning",    color:"#9B6DD9",active:false, level:"Beginner"     },
  { id:"mlops", name:"MLOps",            color:C.gold,   active:false, level:"Beginner"     },
];

// ── SUBJECTS PANEL (inline expand) ───────────────────────────────────────────
function SubjectsPanel({ subjects, onChange, t }) {
  const [openLevel, setOpenLevel] = useState(null); // subject id with open level picker

  const toggleActive = (id) => {
    // at least one must stay active
    const active = subjects.filter(s => s.active);
    if (active.length === 1 && subjects.find(s => s.id === id)?.active) return;
    onChange(subjects.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const setLevel = (id, level) => {
    onChange(subjects.map(s => s.id === id ? { ...s, level } : s));
    setOpenLevel(null);
  };

  return (
    <div style={{ borderTop:`1px solid ${t.border}`, animation:"fadeDown .2s ease both" }}>
      {subjects.map((s, i) => {
        const lvlColor = LEVEL_COLORS[s.level] || C.blue;
        const isLevelOpen = openLevel === s.id;
        return (
          <div key={s.id} style={{ borderBottom: i < subjects.length - 1 ? `1px solid ${t.border}` : "none" }}>
            {/* Subject row */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px" }}>
              {/* Color dot + name */}
              <div style={{ width:8, height:8, borderRadius:"50%", background:s.active ? s.color : t.border2, flexShrink:0, transition:"background .2s" }}/>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:s.active ? t.text : t.textMuted, transition:"color .2s" }}>
                {s.name}
              </span>

              {/* Level pill — only if active */}
              {s.active && (
                <button
                  onClick={()=>setOpenLevel(isLevelOpen ? null : s.id)}
                  style={{
                    fontSize:11, fontWeight:700,
                    color: lvlColor,
                    background:`${lvlColor}14`,
                    border:`1px solid ${lvlColor}35`,
                    borderRadius:20, padding:"3px 9px",
                    cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", gap:4,
                    transition:"all .15s",
                  }}
                >
                  {s.level}
                  <ChevronRight size={10} style={{ transform:isLevelOpen?"rotate(90deg)":"none", transition:"transform .18s" }}/>
                </button>
              )}

              {/* Active toggle */}
              <Toggle
                checked={s.active}
                onChange={() => toggleActive(s.id)}
                color={s.color}
              />
            </div>

            {/* Level picker — inline */}
            {isLevelOpen && s.active && (
              <div style={{ padding:"0 16px 10px 28px", display:"flex", gap:6, flexWrap:"wrap", animation:"fadeDown .15s ease both" }}>
                {LEVELS.map(lvl => {
                  const lc = LEVEL_COLORS[lvl];
                  const sel = s.level === lvl;
                  return (
                    <button key={lvl} onClick={() => setLevel(s.id, lvl)} style={{
                      fontSize:11, fontWeight:700,
                      color: sel ? "#fff" : t.textSub,
                      background: sel ? lc : t.surface2,
                      border:`1px solid ${sel ? lc : t.border}`,
                      borderRadius:20, padding:"4px 12px",
                      cursor:"pointer", fontFamily:"inherit",
                      transition:"all .15s",
                    }}>
                      {sel && <Check size={10} style={{display:"inline",marginRight:4,verticalAlign:"middle"}}/>}
                      {lvl}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer hint */}
      <div style={{ padding:"10px 16px", borderTop:`1px solid ${t.border}` }}>
        <p style={{ fontSize:11, color:t.textMuted }}>
          {subjects.filter(s=>s.active).length} active subject{subjects.filter(s=>s.active).length!==1?"s":""}
          <span style={{ marginLeft:8, opacity:0.6 }}>· toggle to add or remove</span>
        </p>
      </div>
    </div>
  );
}

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, color = C.accent }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange(!checked); }}
      style={{
        width:40, height:22, borderRadius:99,
        background: checked ? color : "#C4BDB5",
        position:"relative", cursor:"pointer", flexShrink:0,
        transition:"background .2s",
      }}
    >
      <div style={{
        position:"absolute", top:3, left:checked?21:3,
        width:16, height:16, borderRadius:"50%", background:"#fff",
        transition:"left .2s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow:"0 1px 3px rgba(0,0,0,.2)",
      }}/>
    </div>
  );
}

function Card({ children, t }) {
  return (
    <div style={{
      background:t.surface, border:`1px solid ${t.border}`,
      borderRadius:14, overflow:"hidden", marginBottom:8,
    }}>
      {children}
    </div>
  );
}

function Divider({ t }) {
  return <div style={{ height:1, background:t.border, marginLeft:61 }}/>;
}

function SectionLabel({ label }) {
  return (
    <p style={{
      fontSize:11, fontWeight:800, letterSpacing:"0.8px",
      color:"#9B9590", marginBottom:8, marginTop:16,
      paddingLeft:4,
    }}>
      {label}
    </p>
  );
}

function Row({ icon:Icon, iconColor, label, sub, right, onClick, danger, t }) {
  return (
    <div
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:13,
        padding:"13px 16px", cursor:onClick?"pointer":"default",
        transition:"background .12s",
      }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.background=t.surface2; }}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >
      <div style={{
        width:32, height:32, borderRadius:8, flexShrink:0,
        background: danger ? C.redBg : `${iconColor}18`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <Icon size={15} style={{ color: danger ? C.red : iconColor }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:danger?C.red:t.text, lineHeight:1.2 }}>{label}</p>
        {sub && <p style={{ fontSize:12, color:t.textMuted, marginTop:1 }}>{sub}</p>}
      </div>
      {right !== undefined
        ? <div style={{ flexShrink:0 }}>{right}</div>
        : onClick && <ChevronRight size={14} style={{ color:t.textMuted, flexShrink:0 }}/>
      }
    </div>
  );
}

// Semester inline picker
function SemesterRow({ value, onChange, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        onClick={()=>setOpen(o=>!o)}
        style={{ display:"flex",alignItems:"center",gap:13,padding:"13px 16px",cursor:"pointer",transition:"background .12s" }}
        onMouseEnter={e=>e.currentTarget.style.background=t.surface2}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        <div style={{ width:32,height:32,borderRadius:8,flexShrink:0,background:C.blueBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <BookOpen size={15} style={{color:C.blue}}/>
        </div>
        <p style={{ fontSize:14,fontWeight:600,color:t.text,flex:1 }}>Semester</p>
        <span style={{ fontSize:13,color:t.textSub,marginRight:6 }}>{value}</span>
        <ChevronRight size={14} style={{ color:t.textMuted,transform:open?"rotate(90deg)":"none",transition:"transform .2s" }}/>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${t.border}`,maxHeight:220,overflowY:"auto",animation:"fadeDown .18s ease both" }}>
          {SEMESTERS.map(s=>(
            <div key={s} onClick={()=>{onChange(s);setOpen(false);}} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"10px 16px 10px 61px",cursor:"pointer",
              background:s===value?C.accentBg:"transparent",
              transition:"background .1s",
            }}
              onMouseEnter={e=>{if(s!==value)e.currentTarget.style.background=t.surface2;}}
              onMouseLeave={e=>{if(s!==value)e.currentTarget.style.background="transparent";}}
            >
              <span style={{ fontSize:13,color:s===value?C.accent:t.textSub,fontWeight:s===value?700:400 }}>{s}</span>
              {s===value && <Check size={13} style={{color:C.accent}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [dark, setDark]         = useState(false);
  const [semester, setSemester] = useState("5th semester");
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [pomodoro, setPomodoro] = useState(true);
  const [sound, setSound]       = useState(true);

  const t = dark ? DARK : LIGHT;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none}}
        .fu{animation:fadeUp .3s ease both}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${dark?"#333":"#ddd"};border-radius:10px}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background .3s" }}>

        {/* HEADER */}
        <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", gap:12, position:"sticky", top:0, zIndex:100 }}>
          <button style={{ background:"none",border:"none",cursor:"pointer",color:t.textSub,display:"flex",padding:4 }}>
            <ArrowLeft size={18}/>
          </button>
          <span style={{ fontWeight:800, fontSize:14 }}>Settings</span>
          <div style={{ marginLeft:"auto" }}>
            <button onClick={()=>setDark(d=>!d)} style={{ background:t.surface2,border:`1px solid ${t.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:t.textSub,fontSize:12,fontWeight:600 }}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        <main style={{ maxWidth:480, margin:"0 auto", padding:"16px 20px 80px" }} className="fu">

          {/* ── PROFILE ── */}
          <Card t={t}>
            <div style={{ padding:"18px 16px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:48,height:48,borderRadius:"50%",background:C.accentBg2,border:`1.5px solid ${C.accent}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <span style={{ fontSize:16,fontWeight:800,color:C.accent,letterSpacing:"-0.3px" }}>AK</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:15,fontWeight:700,color:t.text,marginBottom:1 }}>Alex Kovács</p>
                <p style={{ fontSize:12,color:t.textMuted }}>alex@example.com</p>
              </div>
              <button style={{ background:"none",border:`1px solid ${t.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:t.textSub,display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"border-color .15s,color .15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.textSub;}}
              >
                <Edit2 size={12}/> Edit
              </button>
            </div>

            <Divider t={t}/>

            {/* Streak inline — just one number, not a full stats grid */}
            <div style={{ padding:"10px 16px 12px 61px", display:"flex", alignItems:"center", gap:6 }}>
              <Flame size={14} style={{color:C.accent}}/>
              <span style={{ fontSize:13,fontWeight:700,color:C.accent }}>5-day streak</span>
              <span style={{ fontSize:12,color:t.textMuted,marginLeft:4 }}>· keep it up</span>
            </div>
          </Card>

          {/* ── STUDY ── */}
          <SectionLabel label="STUDY"/>
          <Card t={t}>
            <SemesterRow value={semester} onChange={setSemester} t={t}/>
            <Divider t={t}/>
            {/* Subjects & levels row */}
            <div>
              <div
                onClick={()=>setSubjectsOpen(o=>!o)}
                style={{ display:"flex",alignItems:"center",gap:13,padding:"13px 16px",cursor:"pointer",transition:"background .12s" }}
                onMouseEnter={e=>e.currentTarget.style.background=t.surface2}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div style={{ width:32,height:32,borderRadius:8,flexShrink:0,background:C.greenBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <BookOpen size={15} style={{color:C.green}}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14,fontWeight:600,color:t.text }}>Subjects & levels</p>
                  <p style={{ fontSize:12,color:t.textMuted,marginTop:1 }}>
                    {subjects.filter(s=>s.active).length} active · tap to manage
                  </p>
                </div>
                <ChevronRight size={14} style={{ color:t.textMuted, transform:subjectsOpen?"rotate(90deg)":"none", transition:"transform .2s" }}/>
              </div>
              {subjectsOpen && (
                <SubjectsPanel subjects={subjects} onChange={setSubjects} t={t}/>
              )}
            </div>
          </Card>

          {/* ── APPEARANCE ── */}
          <SectionLabel label="APPEARANCE"/>
          <Card t={t}>
            <Row
              icon={dark?Sun:Moon} iconColor={C.gold}
              label="Dark mode"
              right={<Toggle checked={dark} onChange={setDark} color={C.gold}/>}
              onClick={()=>setDark(d=>!d)} t={t}
            />
          </Card>

          {/* ── TIMER & SOUND ── */}
          <SectionLabel label="TIMER & SOUND"/>
          <Card t={t}>
            <Row
              icon={Clock} iconColor={C.accent}
              label="Pomodoro timer"
              sub="Show timer in the top bar"
              right={<Toggle checked={pomodoro} onChange={setPomodoro}/>}
              onClick={()=>setPomodoro(p=>!p)} t={t}
            />
            <Divider t={t}/>
            <Row
              icon={Clock} iconColor={C.blue}
              label="Configure timer"
              sub="Preset, focus & break duration"
              onClick={()=>{}} t={t}
            />
            <Divider t={t}/>
            <Row
              icon={Volume2} iconColor={C.purple}
              label="Sound effects"
              sub="Audio feedback on correct answers"
              right={<Toggle checked={sound} onChange={setSound} color={C.purple}/>}
              onClick={()=>setSound(s=>!s)} t={t}
            />
          </Card>

          {/* ── ACCOUNT ── */}
          <SectionLabel label="ACCOUNT"/>
          <Card t={t}>
            <Row icon={Download} iconColor={C.green} label="Export progress" sub="Download your data as JSON" onClick={()=>{}} t={t}/>
            <Divider t={t}/>
            <Row icon={Trash2} iconColor={C.red} label="Reset all progress" danger onClick={()=>window.confirm("Reset all progress? This cannot be undone.")} t={t}/>
            <Divider t={t}/>
            <Row icon={LogOut} iconColor={C.red} label="Sign out" danger onClick={()=>{}} t={t}/>
          </Card>

        </main>
      </div>
    </>
  );
}
