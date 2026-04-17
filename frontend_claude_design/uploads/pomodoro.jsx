import { useState, useEffect, useRef, useCallback } from "react";
import {
  Settings, X, RotateCcw, ChevronLeft,
  Moon, Sun, Coffee, BookOpen, Plus, Minus
} from "lucide-react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  accent:    "#E07355",
  accentHov: "#C85E40",
  accentBg:  "rgba(224,115,85,0.10)",
  accentBg2: "rgba(224,115,85,0.18)",
  green:     "#5A9E72",
  greenBg:   "rgba(90,158,114,0.12)",
  blue:      "#4A7FC1",
  blueBg:    "rgba(74,127,193,0.11)",
};
const LIGHT = {
  bg:        "#F5F2EE",
  surface:   "#FFFFFF",
  surface2:  "#F0ECE6",
  text:      "#1A1A1A",
  textSub:   "#6B6560",
  textMuted: "#9B9590",
  border:    "#E4DDD4",
  border2:   "#D4CCC2",
};
const DARK = {
  bg:        "#141414",
  surface:   "#1E1E1E",
  surface2:  "#252525",
  text:      "#F0EDE8",
  textSub:   "#9B9590",
  textMuted: "#6B6560",
  border:    "#2E2E2E",
  border2:   "#3A3A3A",
};

function pad(n) { return String(n).padStart(2, "0"); }
function fmt(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

// ── SVG RING TIMER ────────────────────────────────────────────────────────────
function Ring({ pct, phase, size = 240, stroke = 7, children }) {
  const R    = (size - stroke) / 2;
  const circ = 2 * Math.PI * R;
  const dash = pct * circ;
  const color = phase === "focus" ? C.accent : C.green;
  const trackColor = phase === "focus"
    ? "rgba(224,115,85,0.12)"
    : "rgba(90,158,114,0.12)";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size} height={size}
        style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}
      >
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke={trackColor} strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.4s ease" }}
        />
      </svg>
      {/* Children centered */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── ROUND DOTS ────────────────────────────────────────────────────────────────
function RoundDots({ total, current, t }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{
            width:  active ? 10 : done ? 8 : 7,
            height: active ? 10 : done ? 8 : 7,
            borderRadius: "50%",
            background: done ? C.accent : active ? C.accent : t.border2,
            opacity: done ? 0.45 : active ? 1 : 0.3,
            transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            border: active ? `2px solid ${C.accent}` : "none",
            boxSizing: "border-box",
          }} />
        );
      })}
    </div>
  );
}

// ── STEPPER ───────────────────────────────────────────────────────────────────
function Stepper({ label, value, unit, min, max, onChange, t, accentColor }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      background: t.surface2, borderRadius: 16, padding: "18px 20px",
      border: `1px solid ${t.border}`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.7px", color: t.textMuted }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: t.surface, border: `1px solid ${t.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: t.textSub,
            transition: "border-color 0.15s, color 0.15s, transform 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub; }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <Minus size={13} />
        </button>
        <div style={{ textAlign: "center", minWidth: 48 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: accentColor, letterSpacing: "-1px", fontFamily: "'DM Sans', system-ui" }}>{value}</span>
          <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 4 }}>{unit}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: t.surface, border: `1px solid ${t.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: t.textSub,
            transition: "border-color 0.15s, color 0.15s, transform 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub; }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ── TOPBAR WIDGET ─────────────────────────────────────────────────────────────
// Compact pill that lives in the header of any page
function TopbarWidget({ timeLeft, phase, running, round, totalRounds, onToggle, onLongPress, onOpen, t }) {
  const pressTimer = useRef(null);
  const [pressing, setPressing] = useState(false);
  const [resetPct, setResetPct] = useState(0);
  const resetAnim = useRef(null);

  const startPress = () => {
    setPressing(true);
    let start = Date.now();
    resetAnim.current = setInterval(() => {
      const pct = Math.min(1, (Date.now() - start) / 800);
      setResetPct(pct);
      if (pct >= 1) {
        clearInterval(resetAnim.current);
        setPressing(false);
        setResetPct(0);
        onLongPress();
      }
    }, 16);
  };
  const cancelPress = () => {
    clearInterval(resetAnim.current);
    setPressing(false);
    setResetPct(0);
  };

  const phaseColor = phase === "focus" ? C.accent : C.green;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 0,
        background: t.surface2,
        border: `1px solid ${t.border}`,
        borderRadius: 99,
        overflow: "hidden",
        height: 32,
        userSelect: "none",
        cursor: "pointer",
      }}
    >
      {/* Phase dot */}
      <div
        onClick={onOpen}
        style={{
          padding: "0 10px 0 12px",
          display: "flex", alignItems: "center", gap: 6,
          height: "100%",
          borderRight: `1px solid ${t.border}`,
        }}
      >
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: phaseColor,
          boxShadow: running ? `0 0 0 2px ${phaseColor}35` : "none",
          transition: "box-shadow 0.3s",
        }} />
        <span style={{
          fontSize: 13, fontWeight: 800, letterSpacing: "-0.5px",
          color: t.text, fontFamily: "'DM Sans', system-ui",
          minWidth: 38,
        }}>{fmt(timeLeft)}</span>
      </div>

      {/* Round indicator */}
      <div onClick={onOpen} style={{
        padding: "0 8px",
        borderRight: `1px solid ${t.border}`,
        height: "100%",
        display: "flex", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>
          {round + 1}/{totalRounds}
        </span>
      </div>

      {/* Play/pause + long press reset */}
      <div
        onMouseDown={startPress}
        onMouseUp={() => { if (pressing) { cancelPress(); onToggle(); } }}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={() => { if (pressing) { cancelPress(); onToggle(); } }}
        style={{
          width: 36, height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden", cursor: "pointer",
        }}
      >
        {/* Long press fill */}
        <div style={{
          position: "absolute", inset: 0,
          background: C.accent,
          transform: `scaleX(${resetPct})`,
          transformOrigin: "left",
          transition: pressing ? "none" : "transform 0.2s ease",
          opacity: 0.25,
        }} />
        {pressing && resetPct > 0.05 ? (
          <RotateCcw size={13} style={{ color: C.accent, position: "relative" }} />
        ) : running ? (
          /* Pause bars */
          <div style={{ display: "flex", gap: 2.5, position: "relative" }}>
            <div style={{ width: 2.5, height: 11, borderRadius: 2, background: t.textSub }} />
            <div style={{ width: 2.5, height: 11, borderRadius: 2, background: t.textSub }} />
          </div>
        ) : (
          /* Play triangle */
          <div style={{
            width: 0, height: 0, position: "relative",
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderLeft: `9px solid ${t.textSub}`,
            marginLeft: 2,
          }} />
        )}
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function PomodoroTimer() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("timer"); // timer | settings

  // Settings
  const [focusMins,  setFocusMins]  = useState(25);
  const [breakMins,  setBreakMins]  = useState(5);
  const [totalRounds, setTotalRounds] = useState(4);

  // Timer state
  const [phase, setPhase]     = useState("focus"); // focus | break
  const [running, setRunning] = useState(false);
  const [round, setRound]     = useState(0);       // 0-indexed current round
  const [timeLeft, setTimeLeft] = useState(focusMins * 60);
  const [done, setDone]       = useState(false);   // all rounds complete

  const intervalRef = useRef(null);
  const t = dark ? DARK : LIGHT;

  const totalSecs  = phase === "focus" ? focusMins * 60 : breakMins * 60;
  const pct        = timeLeft / totalSecs;
  const phaseColor = phase === "focus" ? C.accent : C.green;

  // Reset to fresh state
  const doReset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase("focus");
    setRound(0);
    setTimeLeft(focusMins * 60);
    setDone(false);
  }, [focusMins]);

  // When settings change, reset
  useEffect(() => { doReset(); }, [focusMins, breakMins, totalRounds]);

  // Tick
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // phase complete
          clearInterval(intervalRef.current);
          if (phase === "focus") {
            if (round + 1 >= totalRounds) {
              setRunning(false);
              setDone(true);
              return 0;
            }
            setPhase("break");
            setRunning(false); // pause between phases
            return breakMins * 60;
          } else {
            setPhase("focus");
            setRound(r => r + 1);
            setRunning(false);
            return focusMins * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, round, totalRounds, focusMins, breakMins]);

  const toggle  = () => { if (!done) setRunning(r => !r); };
  const skipPhase = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    if (phase === "focus") {
      if (round + 1 >= totalRounds) { setDone(true); return; }
      setPhase("break");
      setTimeLeft(breakMins * 60);
    } else {
      setPhase("focus");
      setRound(r => r + 1);
      setTimeLeft(focusMins * 60);
    }
  };

  // ── SETTINGS VIEW ──────────────────────────────────────────────────────────
  if (view === "settings") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
          .fu{animation:fadeUp .3s ease both}
        `}</style>
        <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background 0.3s" }}>
          <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", gap:12 }}>
            <button onClick={()=>setView("timer")} style={{ background:"none", border:"none", cursor:"pointer", color:t.textSub, display:"flex", padding:4 }}>
              <ChevronLeft size={18}/>
            </button>
            <span style={{ fontWeight:800, fontSize:14 }}>Timer settings</span>
            <div style={{ marginLeft:"auto" }}>
              <button onClick={()=>setDark(d=>!d)} style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:t.textSub, fontSize:12, fontWeight:600 }}>
                {dark ? <Sun size={13}/> : <Moon size={13}/>}
              </button>
            </div>
          </header>

          <div className="fu" style={{ maxWidth:440, margin:"0 auto", padding:"40px 24px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:32 }}>
              <Stepper label="FOCUS" value={focusMins}  unit="min" min={5}  max={90} onChange={v=>{setFocusMins(v)}}  t={t} accentColor={C.accent}/>
              <Stepper label="BREAK" value={breakMins}  unit="min" min={1}  max={30} onChange={v=>{setBreakMins(v)}}  t={t} accentColor={C.green}/>
              <Stepper label="ROUNDS" value={totalRounds} unit="×"  min={1}  max={8}  onChange={v=>{setTotalRounds(v)}} t={t} accentColor={C.blue}/>
            </div>

            {/* Session preview */}
            <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"18px 20px", marginBottom:24 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.7px", color:t.textMuted, marginBottom:14 }}>SESSION PREVIEW</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {Array.from({length:totalRounds},(_,i)=>(
                  <div key={i} style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:t.textMuted, minWidth:20 }}>#{i+1}</span>
                    <div style={{ flex:focusMins, height:8, background:C.accent, borderRadius:3, opacity:0.85 }}/>
                    {i < totalRounds-1 && <div style={{ flex:breakMins, height:8, background:C.green, borderRadius:3, opacity:0.6 }}/>}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:16, marginTop:14 }}>
                {[
                  {color:C.accent, label:`${focusMins}′ focus`},
                  {color:C.green,  label:`${breakMins}′ break`},
                ].map(({color,label})=>(
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:color }}/>
                    <span style={{ fontSize:11, color:t.textSub }}>{label}</span>
                  </div>
                ))}
                <span style={{ fontSize:11, color:t.textMuted, marginLeft:"auto" }}>
                  Total: {Math.round((focusMins * totalRounds + breakMins * (totalRounds-1)))} min
                </span>
              </div>
            </div>

            <button onClick={()=>setView("timer")} style={{
              width:"100%", padding:"14px",
              background:C.accent, color:"#fff", border:"none",
              borderRadius:12, fontSize:14, fontWeight:700,
              cursor:"pointer", fontFamily:"'DM Sans',system-ui",
            }}>
              Save & start
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── TIMER VIEW ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes completePop{
          0%{transform:scale(0.8);opacity:0}
          60%{transform:scale(1.05)}
          100%{transform:scale(1);opacity:1}
        }

        .fu{animation:fadeUp .36s ease both}
        .tick-running{animation:none}

        .main-btn {
          border:none; cursor:pointer; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          transition: transform 160ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 160ms ease;
          font-family:'DM Sans',system-ui;
          user-select:none;
        }
        .main-btn:hover { transform:scale(1.05); }
        .main-btn:active { transform:scale(0.96); }

        .ghost-btn {
          background:none; border:1px solid ${t.border}; cursor:pointer;
          border-radius:10px; padding:9px 16px;
          font-size:12px; font-weight:700; font-family:'DM Sans',system-ui;
          display:flex; align-items:center; gap:6px;
          transition: border-color .15s, color .15s, transform .1s;
          color:${t.textSub};
        }
        .ghost-btn:hover { border-color:${C.accent}; color:${C.accent}; }
        .ghost-btn:active { transform:scale(0.97); }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',system-ui", background:t.bg, color:t.text, minHeight:"100vh", transition:"background 0.3s", display:"flex", flexDirection:"column" }}>

        {/* ── HEADER with topbar widget demo ── */}
        <header style={{ background:t.surface, borderBottom:`1px solid ${t.border}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", gap:12, position:"sticky", top:0, zIndex:50 }}>
          <BookOpen size={15} style={{color:C.accent}}/>
          <span style={{fontWeight:800,fontSize:14}}>Study Hall</span>
          <span style={{color:t.border2}}>·</span>
          <span style={{fontSize:13,color:t.textSub}}>Pomodoro</span>

          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            {/* Topbar widget — this is what appears on every screen */}
            <TopbarWidget
              timeLeft={timeLeft}
              phase={phase}
              running={running}
              round={round}
              totalRounds={totalRounds}
              onToggle={toggle}
              onLongPress={doReset}
              onOpen={()=>{}}
              t={t}
            />
            <button onClick={()=>setView("settings")} style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:8, padding:"6px 8px", cursor:"pointer", display:"flex", color:t.textSub }}>
              <Settings size={14}/>
            </button>
            <button onClick={()=>setDark(d=>!d)} style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:t.textSub, fontSize:12, fontWeight:600 }}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        {/* ── MAIN TIMER ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>

          {done ? (
            /* All rounds complete */
            <div style={{ textAlign:"center", animation:"completePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, marginBottom:8 }}>Session complete!</h2>
              <p style={{ color:t.textSub, fontSize:14, marginBottom:8 }}>
                {totalRounds} rounds · {focusMins * totalRounds} minutes of focus
              </p>
              <p style={{ color:t.textMuted, fontSize:13, marginBottom:36 }}>
                That's {focusMins * totalRounds} minutes you can't un-learn.
              </p>
              <button onClick={doReset} style={{
                background:C.accent, color:"#fff", border:"none",
                borderRadius:12, padding:"13px 32px",
                fontSize:14, fontWeight:700, cursor:"pointer",
                fontFamily:"'DM Sans',system-ui",
                display:"inline-flex", alignItems:"center", gap:8,
              }}>
                <RotateCcw size={15}/> Start again
              </button>
            </div>
          ) : (
            <div className="fu" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:32 }}>

              {/* Phase label */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:phaseColor,
                    boxShadow: running ? `0 0 0 3px ${phaseColor}30` : "none",
                    transition:"box-shadow 0.3s",
                  }}/>
                  <span style={{
                    fontSize:11, fontWeight:800, letterSpacing:"1.2px",
                    color:phaseColor, textTransform:"uppercase",
                  }}>
                    {phase === "focus" ? "Focus" : "Break"}
                  </span>
                </div>
                <RoundDots total={totalRounds} current={round} t={t}/>
              </div>

              {/* Ring */}
              <Ring pct={pct} phase={phase} size={260} stroke={7}>
                {/* Time */}
                <span style={{
                  fontFamily:"'DM Sans',system-ui",
                  fontSize:58, fontWeight:800, letterSpacing:"-3px",
                  color:t.text, lineHeight:1,
                  animation: running && timeLeft <= 10 ? "pulse 1s ease infinite" : "none",
                }}>
                  {fmt(timeLeft)}
                </span>
                {/* Round label inside ring */}
                <span style={{ fontSize:12, fontWeight:600, color:t.textMuted, marginTop:6, letterSpacing:"0.2px" }}>
                  Round {round + 1} of {totalRounds}
                </span>
              </Ring>

              {/* Main button */}
              <button
                className="main-btn"
                onClick={toggle}
                style={{
                  width:72, height:72,
                  background:phaseColor,
                  color:"#fff",
                  boxShadow:`0 8px 28px ${phaseColor}45`,
                }}
              >
                {running ? (
                  <div style={{ display:"flex", gap:5 }}>
                    <div style={{ width:4, height:20, borderRadius:2, background:"#fff" }}/>
                    <div style={{ width:4, height:20, borderRadius:2, background:"#fff" }}/>
                  </div>
                ) : (
                  <div style={{
                    width:0, height:0,
                    borderTop:"11px solid transparent",
                    borderBottom:"11px solid transparent",
                    borderLeft:"18px solid #fff",
                    marginLeft:4,
                  }}/>
                )}
              </button>

              {/* Secondary actions */}
              <div style={{ display:"flex", gap:10 }}>
                <button className="ghost-btn" style={{ border:`1px solid ${t.border}`, color:t.textSub }} onClick={skipPhase}>
                  {phase === "focus"
                    ? <><Coffee size={13}/> Skip to break</>
                    : <><BookOpen size={13}/> Skip to focus</>
                  }
                </button>
                <button className="ghost-btn" style={{ border:`1px solid ${t.border}`, color:t.textSub }} onClick={doReset}>
                  <RotateCcw size={13}/> Reset
                </button>
              </div>

              {/* Long press hint in topbar */}
              <p style={{ fontSize:11, color:t.textMuted, textAlign:"center", maxWidth:240, lineHeight:1.5 }}>
                Long-press the play button in the top bar to reset from any screen
              </p>

            </div>
          )}

        </main>
      </div>
    </>
  );
}
