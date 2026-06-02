import React, { useEffect, useState, useRef } from "react";

const API = "http://localhost:5000/api/admin/wingo";
const WINGO_API = "http://localhost:5000/api/wingo";

const token = () => localStorage.getItem("token");

const WinGoManager = () => {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("...");
  const [timer, setTimer] = useState(30);
  const [forcedNum, setForcedNum] = useState(null);
  const [odds, setOddsVal] = useState(100);
  const [msg, setMsg] = useState({ text: "", type: "success" });
  const clientIntervalRef = useRef(null);
  const roundStartRef = useRef(null);
  const lastPeriodRef = useRef(null);

  // ── Smooth client-side timer (same logic as WinGo.jsx) ──────
  const startCountdown = (serverTime, serverTimeRemaining) => {
    if (clientIntervalRef.current) clearInterval(clientIntervalRef.current);
    const startedAt = Date.now() - ((30 - serverTimeRemaining) * 1000);
    roundStartRef.current = startedAt;

    clientIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartRef.current) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimer(remaining);
    }, 100);
  };

  // ── Fetch live stats every 2s ────────────────────────────────
  const fetchStats = async () => {
    try {
      const [statsRes, wingoRes] = await Promise.all([
        fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(WINGO_API),
      ]);
      const statsData = await statsRes.json();
      const wingoData = await wingoRes.json();

      if (statsData.success) setStats(statsData.stats);

      // Sync period & timer from wingo API
      if (wingoData.period && wingoData.period !== lastPeriodRef.current) {
        lastPeriodRef.current = wingoData.period;
        setPeriod(wingoData.period);
        startCountdown(wingoData.serverTime, wingoData.time);
      }
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/settings`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) { setForcedNum(data.forcedResult); setOddsVal(data.smartOdds); }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
    const iv = setInterval(fetchStats, 2000);
    return () => { clearInterval(iv); if (clientIntervalRef.current) clearInterval(clientIntervalRef.current); };
  }, []);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "success" }), 3000);
  };

  const handleForce = async (number) => {
    const res = await fetch(`${API}/force`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ number }),
    });
    const data = await res.json();
    showMsg(data.message);
    setForcedNum(number);
  };

  const handleSetOdds = async () => {
    const res = await fetch(`${API}/odds`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ odds }),
    });
    const data = await res.json();
    showMsg(data.message);
  };

  const s = stats;
  const timerColor = timer <= 5 ? "#ef4444" : timer <= 10 ? "#f97316" : "#16a34a";
  const timerPct = (timer / 30) * 100;

  return (
    <div style={styles.page}>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🎰 WinGo Manager</h2>
          <p style={styles.subtitle}>Real-time control panel</p>
        </div>
        <div style={styles.timerBox}>
          <div style={styles.periodLabel}>Period</div>
          <div style={styles.periodVal}>{period}</div>
          <div style={{ ...styles.timerNum, color: timerColor }}>{timer}s</div>
          {/* Progress bar */}
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${timerPct}%`, background: timerColor }} />
          </div>
          {timer <= 5 && <div style={styles.lockedBadge}>🔒 Betting Locked</div>}
        </div>
      </div>

      {/* ── MESSAGE ── */}
      {msg.text && (
        <div style={{ ...styles.msgBox, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          borderColor: msg.type === "success" ? "#86efac" : "#fca5a5",
          color: msg.type === "success" ? "#166534" : "#991b1b" }}>
          {msg.type === "success" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* ── LIVE BET STATS ── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardIcon}>📊</span>
          <h3 style={styles.cardTitle}>Live Bet Stats</h3>
          <span style={styles.liveDot}>● LIVE</span>
        </div>

        {/* Big / Small */}
        <div style={styles.row2}>
          {[["Big","#f97316","#fff7ed"],["Small","#3b82f6","#eff6ff"]].map(([k,c,bg]) => (
            <div key={k} style={{ ...styles.statCard, borderColor: c, background: bg }}>
              <div style={{ color: c, fontWeight: 700, fontSize: 16 }}>{k}</div>
              <div style={styles.statCount}>{s?.[k]?.count || 0} bets</div>
              <div style={{ ...styles.statAmt, color: c }}>₹{s?.[k]?.amount || 0}</div>
            </div>
          ))}
        </div>

        {/* Colors */}
        <div style={styles.row3}>
          {[["Green","#16a34a","#f0fdf4"],["Red","#dc2626","#fef2f2"],["Violet","#7c3aed","#f5f3ff"]].map(([k,c,bg]) => (
            <div key={k} style={{ ...styles.statCard, borderColor: c, background: bg }}>
              <div style={{ color: c, fontWeight: 700, fontSize: 15 }}>{k}</div>
              <div style={styles.statCount}>{s?.[k]?.count || 0} bets</div>
              <div style={{ ...styles.statAmt, color: c }}>₹{s?.[k]?.amount || 0}</div>
            </div>
          ))}
        </div>

        {/* Numbers */}
        <div style={styles.numGrid}>
          {[0,1,2,3,4,5,6,7,8,9].map(n => {
            const c = getNumColor(n);
            return (
              <div key={n} style={{ ...styles.numCard, borderColor: c }}>
                <div style={{ color: c, fontWeight: 800, fontSize: 22 }}>{n}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s?.numbers?.[n]?.count || 0} bets</div>
                <div style={{ fontSize: 12, color: c, fontWeight: 600 }}>₹{s?.numbers?.[n]?.amount || 0}</div>
              </div>
            );
          })}
        </div>

        <div style={styles.totalRow}>
          Total: <b style={{ color: "#1e293b" }}>&nbsp;{s?.total?.count || 0} bets</b>
          &nbsp;|&nbsp; ₹<b style={{ color: "#f97316" }}>{s?.total?.amount || 0}</b>
        </div>
      </div>

      {/* ── FORCE RESULT ── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardIcon}>🎯</span>
          <h3 style={styles.cardTitle}>Force Result</h3>
          {forcedNum !== null && (
            <span style={styles.forcedBadge}>Forced: {forcedNum}</span>
          )}
        </div>
        <p style={styles.hint}>Next round mein ye result forcefully aayega</p>

        {/* Big / Small */}
        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          {[["Big","#f97316",[5,6,7,8,9]],["Small","#3b82f6",[0,1,2,3,4]]].map(([label,c,nums]) => (
            <button key={label} onClick={() => handleForce(nums[Math.floor(Math.random()*nums.length)])}
              style={forceBtn(c)}>{label}</button>
          ))}
        </div>

        {/* Colors */}
        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          {[["Green","#16a34a",[1,3,7,9]],["Red","#dc2626",[2,4,6,8]],["Violet","#7c3aed",[0,5]]].map(([label,c,nums]) => (
            <button key={label} onClick={() => handleForce(nums[Math.floor(Math.random()*nums.length)])}
              style={forceBtn(c)}>{label}</button>
          ))}
        </div>

        {/* Numbers */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
          {[0,1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleForce(n)}
              style={{
                width:44, height:44, borderRadius:"50%", border:`2px solid ${getNumColor(n)}`,
                background: forcedNum===n ? getNumColor(n) : "#fff",
                color: forcedNum===n ? "#fff" : getNumColor(n),
                fontWeight:800, fontSize:16, cursor:"pointer",
              }}>{n}</button>
          ))}
        </div>

        {forcedNum !== null && (
          <button onClick={() => handleForce(null)}
            style={{ ...forceBtn("#94a3b8"), fontSize:13 }}>✕ Force Cancel</button>
        )}
      </div>

      {/* ── SMART ODDS ── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardIcon}>⚖️</span>
          <h3 style={styles.cardTitle}>Smart Odds</h3>
          <span style={{ ...styles.forcedBadge, background: odds>=80?"#fef3c7":"#f1f5f9",
            color: odds>=80?"#92400e":"#475569" }}>{odds}%</span>
        </div>
        <p style={styles.hint}>
          {odds===100 ? "🏦 House always wins (kam bet wali side jeete)" :
           odds>=80   ? "📉 House-friendly result" :
           odds>=50   ? "🎲 Mixed — thoda random thoda house" :
           odds===0   ? "🎰 Pure random result" : "🎰 Mostly random"}
        </p>

        <input type="range" min={0} max={100} value={odds}
          onChange={e => setOddsVal(Number(e.target.value))}
          style={{ width:"100%", accentColor:"#f97316", height:6, marginBottom:8 }}
        />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:16 }}>
          <span>0% Random</span><span>50% Mixed</span><span>100% House Wins</span>
        </div>

        {/* Presets */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {[0,50,70,80,90,100].map(v => (
            <button key={v} onClick={() => setOddsVal(v)}
              style={{ padding:"6px 14px", borderRadius:20, border:"1px solid #e2e8f0",
                background: odds===v?"#f97316":"#fff", color: odds===v?"#fff":"#475569",
                fontWeight:600, fontSize:13, cursor:"pointer" }}>{v}%</button>
          ))}
        </div>

        <button onClick={handleSetOdds} style={applyBtn}>✅ Apply Odds</button>
      </div>

    </div>
  );
};

// ── Colors ──────────────────────────────────────────────────────
function getNumColor(n) {
  if (n===0||n===5) return "#7c3aed";
  if ([1,3,7,9].includes(n)) return "#16a34a";
  return "#dc2626";
}

function forceBtn(bg) {
  return { background:bg, color:"#fff", border:"none", borderRadius:8,
    padding:"9px 20px", fontWeight:700, fontSize:14, cursor:"pointer" };
}

const applyBtn = {
  background:"linear-gradient(135deg,#f97316,#ef4444)", color:"#fff", border:"none",
  borderRadius:10, padding:"11px 28px", fontWeight:700, fontSize:15, cursor:"pointer",
  boxShadow:"0 4px 12px rgba(249,115,22,0.35)"
};

// ── Styles ───────────────────────────────────────────────────────
const styles = {
  page:        { padding:28, fontFamily:"'Segoe UI',sans-serif", background:"#f8fafc", minHeight:"100vh" },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                 background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:20,
                 boxShadow:"0 2px 12px rgba(0,0,0,0.07)", flexWrap:"wrap", gap:16 },
  title:       { margin:0, fontSize:24, fontWeight:800, color:"#1e293b" },
  subtitle:    { margin:"4px 0 0", color:"#94a3b8", fontSize:14 },
  timerBox:    { textAlign:"right", minWidth:200 },
  periodLabel: { fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:1 },
  periodVal:   { fontSize:13, fontWeight:700, color:"#334155", marginBottom:4, wordBreak:"break-all" },
  timerNum:    { fontSize:36, fontWeight:900, lineHeight:1 },
  progressBg:  { background:"#e2e8f0", borderRadius:99, height:6, marginTop:6, overflow:"hidden" },
  progressFill:{ height:"100%", borderRadius:99, transition:"width 0.1s linear" },
  lockedBadge: { background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:600,
                 padding:"3px 10px", borderRadius:20, display:"inline-block", marginTop:6 },
  msgBox:      { border:"1px solid", borderRadius:10, padding:"10px 16px",
                 marginBottom:16, fontSize:14, fontWeight:600 },
  card:        { background:"#fff", borderRadius:16, padding:24, marginBottom:20,
                 boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
  cardHeader:  { display:"flex", alignItems:"center", gap:10, marginBottom:12 },
  cardIcon:    { fontSize:20 },
  cardTitle:   { margin:0, fontSize:18, fontWeight:800, color:"#1e293b", flex:1 },
  liveDot:     { fontSize:12, color:"#16a34a", fontWeight:700, animation:"pulse 1.5s infinite" },
  forcedBadge: { background:"#fff7ed", color:"#c2410c", fontSize:13, fontWeight:700,
                 padding:"4px 12px", borderRadius:20 },
  hint:        { color:"#64748b", fontSize:13, marginTop:0, marginBottom:14 },
  row2:        { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 },
  row3:        { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 },
  statCard:    { border:"2px solid", borderRadius:12, padding:"12px 16px" },
  statCount:   { color:"#64748b", fontSize:12, margin:"2px 0" },
  statAmt:     { fontWeight:700, fontSize:18 },
  numGrid:     { display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 },
  numCard:     { border:"2px solid", borderRadius:10, padding:"8px 12px",
                 minWidth:64, textAlign:"center", background:"#fafafa" },
  totalRow:    { color:"#64748b", fontSize:13, paddingTop:8, borderTop:"1px solid #f1f5f9" },
};

export default WinGoManager;