/* Shell: global app state, theme, navigation, pomodoro, tweaks */

// ── GLOBAL STATE (context-free, uses a tiny event bus so everything stays simple) ──
const store = (() => {
  const listeners = new Set();
  let state = {
    route: (location.hash || "#/home").replace(/^#/, "") || "/home",
    params: {},
    dark: false,
    density: "comfortable", // compact | comfortable | spacious
    accent: "coral", // coral | blue | green | purple
    mascot: true,
    pomodoro: {
      mode:"focus", // focus | break
      secondsLeft: 25*60,
      running: false,
      completedPomodoros: 2,
    },
    route_history: ["/home"],
  };
  const get = () => state;
  const set = (patch) => { state = {...state, ...patch}; window.__studyhall_tweaks = state; listeners.forEach(l=>l()); };
  const sub = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  return { get, set, sub };
})();
window.__studyhall_store = store;
window.__studyhall_tweaks = store.get();

function useStore(){
  const [, force] = React.useReducer(x=>x+1, 0);
  React.useEffect(()=> store.sub(force), []);
  return store.get();
}

// Accent palette
const ACCENT_MAP = {
  coral:  { accent:"#E07355", accentHov:"#C85E40", accentBg:"rgba(224,115,85,0.10)", accentBg2:"rgba(224,115,85,0.18)" },
  blue:   { accent:"#4A7FC1", accentHov:"#3A6CAA", accentBg:"rgba(74,127,193,0.11)", accentBg2:"rgba(74,127,193,0.20)" },
  green:  { accent:"#5A9E72", accentHov:"#488860", accentBg:"rgba(90,158,114,0.11)", accentBg2:"rgba(90,158,114,0.20)" },
  purple: { accent:"#9B6DD9", accentHov:"#8456C6", accentBg:"rgba(155,109,217,0.11)", accentBg2:"rgba(155,109,217,0.20)" },
};

function useTheme(){
  const s = useStore();
  const palette = ACCENT_MAP[s.accent] || ACCENT_MAP.coral;
  // Build a merged theme: tokens + accent overrides
  const base = s.dark ? window.DARK : window.LIGHT;
  return { ...base, ...palette, dark: s.dark, density: s.density };
}
window.useTheme = useTheme;
window.useStore = useStore;

// Density multipliers
const DENSITY = { compact:0.85, comfortable:1, spacious:1.15 };
function d(v){ const m = DENSITY[store.get().density] || 1; return Math.round(v*m); }
window.densityScale = d;

// ── ROUTER ──────────────────────────────────────────────────────────────────
function parseHash(){
  const h = (location.hash || "#/home").replace(/^#/, "");
  const [path, query=""] = h.split("?");
  const params = {};
  query.split("&").forEach(kv => { if(!kv) return; const [k,v] = kv.split("="); params[k] = decodeURIComponent(v||""); });
  return { path, params };
}
function navigate(path, params={}){
  const query = Object.keys(params).map(k=>`${k}=${encodeURIComponent(params[k])}`).join("&");
  const full = query ? `${path}?${query}` : path;
  location.hash = full;
}
window.navigate = navigate;

window.addEventListener("hashchange", ()=>{
  const {path, params} = parseHash();
  const hist = [...store.get().route_history];
  if(hist[hist.length-1] !== path) hist.push(path);
  if(hist.length > 20) hist.shift();
  store.set({ route:path, params, route_history:hist });
});

// ── POMODORO TIMER (ticks once a second when running) ───────────────────────
setInterval(()=>{
  const s = store.get();
  if(!s.pomodoro.running) return;
  const left = s.pomodoro.secondsLeft - 1;
  if(left <= 0){
    // switch mode
    const nextMode = s.pomodoro.mode === "focus" ? "break" : "focus";
    const nextDur = nextMode === "focus" ? 25*60 : 5*60;
    const done = s.pomodoro.completedPomodoros + (s.pomodoro.mode==="focus" ? 1 : 0);
    store.set({ pomodoro:{ mode:nextMode, secondsLeft:nextDur, running:false, completedPomodoros:done } });
  } else {
    store.set({ pomodoro:{ ...s.pomodoro, secondsLeft:left } });
  }
}, 1000);

function fmt(s){ const m=Math.floor(s/60), ss=s%60; return `${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`; }
window.fmtTime = fmt;

// ── TOP HEADER (shared across all screens) ──────────────────────────────────
function TopBar({ title, crumbs=[], right }){
  const t = useTheme();
  const s = useStore();
  const pom = s.pomodoro;
  const pomPct = pom.mode==="focus" ? (1 - pom.secondsLeft/(25*60)) : (1 - pom.secondsLeft/(5*60));
  return (
    <header style={{
      background:t.surface, borderBottom:`1px solid ${t.border}`,
      height:56, display:"flex", alignItems:"center",
      padding:"0 20px", gap:14, position:"sticky", top:0, zIndex:100,
    }}>
      <div onClick={()=>window.navigate("/home")} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
        <img src="assets/mascot-plain.png" style={{width:26, height:26, objectFit:"contain"}}/>
        <span style={{fontWeight:800, fontSize:15, letterSpacing:"-0.3px"}}>Study Hall</span>
      </div>
      {crumbs.length > 0 && (
        <>
          <span style={{color:t.border2, fontSize:16}}>›</span>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <span
                onClick={c.href ? () => window.navigate(c.href) : undefined}
                style={{
                  fontSize:13,
                  color: i === crumbs.length-1 ? t.text : t.textSub,
                  fontWeight: i === crumbs.length-1 ? 600 : 500,
                  cursor: c.href ? "pointer" : "default",
                }}>{c.label}</span>
              {i < crumbs.length-1 && <span style={{color:t.border2, fontSize:16}}>›</span>}
            </React.Fragment>
          ))}
        </>
      )}
      <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:10}}>
        {right}
        {/* Pomodoro mini */}
        <button
          onClick={()=>window.navigate("/pomodoro")}
          title="Pomodoro"
          style={{
            display:"flex", alignItems:"center", gap:8,
            background:pom.running ? t.accentBg : t.surface2,
            border:`1px solid ${pom.running ? t.accent+"55" : t.border}`,
            borderRadius:20, padding:"5px 10px 5px 6px", cursor:"pointer",
            fontSize:12, fontWeight:700, color: pom.running ? t.accent : t.textSub,
          }}>
          <svg width={20} height={20} viewBox="0 0 20 20" style={{display:"block"}}>
            <circle cx={10} cy={10} r={8} fill="none" stroke={t.border} strokeWidth={2}/>
            <circle cx={10} cy={10} r={8} fill="none" stroke={t.accent} strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`${pomPct*50.26} 50.26`}
              transform="rotate(-90 10 10)"
              style={{transition:"stroke-dasharray 0.5s ease"}}/>
          </svg>
          <span style={{fontFamily:window.FONT_MONO, fontVariantNumeric:"tabular-nums"}}>{fmt(pom.secondsLeft)}</span>
        </button>
        {/* Search */}
        <button onClick={()=>window.navigate("/search")} title="Search" style={{
          background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20,
          width:32, height:32, cursor:"pointer", color:t.textSub,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}><Icon name="search" size={14}/></button>
        {/* Dark */}
        <button onClick={()=>store.set({dark:!s.dark})} title="Theme" style={{
          background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20,
          width:32, height:32, cursor:"pointer", color:t.textSub,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}><Icon name={s.dark?"sun":"moon"} size={14}/></button>
        {/* Settings */}
        <button onClick={()=>window.navigate("/settings")} title="Settings" style={{
          background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20,
          width:32, height:32, cursor:"pointer", color:t.textSub,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}><Icon name="settings" size={14}/></button>
      </div>
    </header>
  );
}
window.TopBar = TopBar;

// ── BOTTOM TAB BAR (secondary nav) ──────────────────────────────────────────
function TabBar(){
  const t = useTheme();
  const s = useStore();
  const tabs = [
    { path:"/home", label:"Home", icon:"home" },
    { path:"/review", label:"Review", icon:"layers" },
    { path:"/wrong-answers", label:"Mistakes", icon:"alert-triangle" },
    { path:"/glossary", label:"Glossary", icon:"book-open" },
  ];
  const active = tabs.find(x => s.route.startsWith(x.path));
  return (
    <nav style={{
      position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)",
      background:t.surface, border:`1px solid ${t.border}`,
      borderRadius:99, padding:"6px", display:"flex", gap:4,
      boxShadow:"0 8px 28px rgba(0,0,0,0.08)", zIndex:90,
    }}>
      {tabs.map(tab => {
        const on = active?.path === tab.path;
        return (
          <button key={tab.path} onClick={()=>window.navigate(tab.path)} style={{
            display:"flex", alignItems:"center", gap:7,
            padding:"8px 14px", borderRadius:99,
            border:"none", cursor:"pointer",
            background: on ? t.accent : "transparent",
            color: on ? "#fff" : t.textSub,
            fontWeight:700, fontSize:12.5,
          }}>
            <Icon name={tab.icon} size={14}/>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
window.TabBar = TabBar;

// ── SHARED UI PRIMITIVES ────────────────────────────────────────────────────
function Card({ children, style={}, pad=20, ...rest }){
  const t = useTheme();
  return <div style={{
    background:t.surface, border:`1px solid ${t.border}`,
    borderRadius:14, padding:pad, ...style
  }} {...rest}>{children}</div>;
}
function Btn({ children, variant="primary", icon, style={}, ...rest }){
  const t = useTheme();
  const v = {
    primary: { bg:t.accent, color:"#fff", border:t.accent },
    ghost:   { bg:t.surface, color:t.text, border:t.border },
    soft:    { bg:t.surface2, color:t.textSub, border:t.border },
    accent:  { bg:t.accentBg, color:t.accent, border:t.accent+"55" },
  }[variant];
  return (
    <button {...rest} style={{
      display:"inline-flex", alignItems:"center", gap:7,
      padding:"9px 16px", borderRadius:8,
      background:v.bg, color:v.color, border:`1px solid ${v.border}`,
      fontSize:13, fontWeight:700, cursor:"pointer",
      fontFamily:window.FONT_SANS,
      transition:"transform .08s, background .15s, border-color .15s",
      ...style
    }} onMouseDown={e=>e.currentTarget.style.transform="translateY(1px)"}
       onMouseUp={e=>e.currentTarget.style.transform=""}
       onMouseLeave={e=>e.currentTarget.style.transform=""}>
      {icon && <Icon name={icon} size={14}/>}
      {children}
    </button>
  );
}
function Pill({ children, color="accent" }){
  const t = useTheme();
  const map = {
    accent: { bg:t.accentBg, color:t.accent },
    blue:   { bg:window.C.blueBg, color:window.C.blue },
    green:  { bg:window.C.greenBg, color:window.C.green },
    gold:   { bg:window.C.goldBg, color:window.C.gold },
    red:    { bg:window.C.redBg, color:window.C.red },
    muted:  { bg:t.surface2, color:t.textSub },
  }[color];
  return <span style={{
    display:"inline-block",
    background:map.bg, color:map.color,
    fontSize:10, fontWeight:800, letterSpacing:"1px",
    padding:"4px 10px", borderRadius:20, textTransform:"uppercase",
  }}>{children}</span>;
}
function SectionLabel({ children, style={} }){
  const t = useTheme();
  return <p style={{
    fontSize:11, fontWeight:800, letterSpacing:"0.8px",
    color:t.textMuted, textTransform:"uppercase", ...style
  }}>{children}</p>;
}
function Page({ children, center=false, maxWidth=1120 }){
  const t = useTheme();
  return (
    <div style={{minHeight:"100vh", background:t.bg, color:t.text, fontFamily:window.FONT_SANS, transition:"background .3s, color .3s"}}
         data-dark={t.dark?"1":"0"}>
      {children}
    </div>
  );
}

Object.assign(window, { Card, Btn, Pill, SectionLabel, Page });
