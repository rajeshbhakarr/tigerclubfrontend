import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://indr-backend-77tp.onrender.com/api";

function DragonManager() {
  const [timer, setTimer] = useState(30);
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState(null);
  const [bets, setBets] = useState([]);
  const [totals, setTotals] = useState({ dragon: 0, tiger: 0, tie: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // Smart Odds
  const [oddsValue, setOddsValue] = useState(100);
  const [appliedOdds, setAppliedOdds] = useState(100);
  const [oddsMsg, setOddsMsg] = useState("");

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await axios.get(API + "/dragon-tiger/state");
        const data = res.data;
        setTimer(data.timer || 30);
        setPeriod(data.roundId || "");
        
        // ✅ Bets with names now
        if (data.bets) {
          setBets(data.bets);
          const t = { dragon: 0, tiger: 0, tie: 0 };
          data.bets.forEach(b => { 
            if (t[b.betOn] !== undefined) t[b.betOn] += b.amount; 
          });
          setTotals(t);
        }
        if (data.totals) setTotals(data.totals);
        
        // ✅ Get odds from DB (not from state value)
        if (data.oddsPercent !== undefined) {
          setAppliedOdds(data.oddsPercent);
          setOddsValue(data.oddsPercent);
        }
      } catch (e) { console.log(e.message); }
    };
    
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!selected) { setMsg("Pehle Dragon / Tiger / Tie select karo!"); return; }
    setSubmitting(true); setMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        API + "/dragon-tiger/set-result",
        { result: selected },
        { headers: { Authorization: "Bearer " + token } }
      );
      if (res.data.success) { setMsg("Result set: " + selected.toUpperCase() + " ✅"); setSelected(null); }
      else { setMsg("Error: " + res.data.message); }
    } catch (e) { setMsg("Error: " + (e.response?.data?.message || e.message)); }
    setSubmitting(false);
  };

  const handleApplyOdds = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        API + "/dragon-tiger/set-odds",
        { oddsPercent: oddsValue },
        { headers: { Authorization: "Bearer " + token } }
      );
      if (res.data.success) {
        setAppliedOdds(oddsValue);
        setOddsMsg("Odds applied: " + oddsValue + "% ✅");
      } else { setOddsMsg("Error: " + res.data.message); }
    } catch (e) { setOddsMsg("Error: " + (e.response?.data?.message || e.message)); }
    setTimeout(() => setOddsMsg(""), 3000);
  };

  const getOddsDesc = (v) => {
    if (v === 0) return "0% — Fully Random (Dragon/Tiger/Tie kuch bhi)";
    if (v <= 50) return v + "% — Mostly Random, thoda House advantage";
    if (v <= 80) return v + "% — Mixed (kam bet wali side zyada jeete)";
    if (v < 100) return v + "% — House wins zyada baar";
    return "100% — House Always Wins (kam bet wali side hamesha jeete)";
  };

  const timerPct = (timer / 30) * 100;
  const timerColor = timer <= 5 ? "#ef4444" : timer <= 10 ? "#f97316" : "#22c55e";
  const lowBetSide = totals.dragon < totals.tiger ? "🐉 Dragon" : totals.tiger < totals.dragon ? "🐯 Tiger" : "Equal";

  return (
    <div style={styles.page}>

      {/* HEADER CARD */}
      <div style={styles.card}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.label}>Round ID</div>
            <div style={styles.periodText}>{period || "Loading..."}</div>
          </div>
          <div style={styles.timerBox}>
            <svg width="64" height="64" style={{ position: "absolute" }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={timerColor} strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerPct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s", transformOrigin: "32px 32px", transform: "rotate(-90deg)" }}
              />
            </svg>
            <span style={{ ...styles.timerNum, color: timerColor }}>{timer}</span>
          </div>
        </div>

        {/* Totals */}
        <div style={styles.totalsRow}>
          <div style={{ ...styles.totalBadge, background: "#fff2f0", border: "1px solid #fca5a5" }}>
            <span style={{ fontSize: 20 }}>🐉</span>
            <div style={styles.badgeLabel}>Dragon</div>
            <div style={{ ...styles.badgeAmt, color: "#ef4444" }}>₹{totals.dragon.toLocaleString()}</div>
          </div>
          <div style={{ ...styles.totalBadge, background: "#f5f0ff", border: "1px solid #c4b5fd" }}>
            <span style={{ fontSize: 20 }}>🐯</span>
            <div style={styles.badgeLabel}>Tiger</div>
            <div style={{ ...styles.badgeAmt, color: "#7c3aed" }}>₹{totals.tiger.toLocaleString()}</div>
          </div>
          <div style={{ ...styles.totalBadge, background: "#f0fdf4", border: "1px solid #86efac" }}>
            <span style={{ fontSize: 20 }}>🤝</span>
            <div style={styles.badgeLabel}>Tie</div>
            <div style={{ ...styles.badgeAmt, color: "#16a34a" }}>₹{totals.tie.toLocaleString()}</div>
          </div>
        </div>

        {/* Low bet indicator */}
        <div style={styles.lowBetRow}>
          <span style={styles.lowBetLabel}>Kam bet side:</span>
          <span style={styles.lowBetValue}>{lowBetSide}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>(House win candidate)</span>
        </div>
      </div>

      {/* ✅ LIVE BETS AT TOP (With names) */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🎮 Live Bets This Round ({bets.length})</div>
        {bets.length === 0 ? (
          <div style={styles.emptyMsg}>Abhi koi bet nahi aayi...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "200px", overflowY: "auto" }}>
            {bets.map((b, i) => (
              <div key={b.id || i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", background: "#f9fafb", borderRadius: 10, fontSize: 13
              }}>
                <div style={{ display: "flex", gap: 10, flex: 1 }}>
                  <span style={{ fontWeight: 700, color: "#111827", minWidth: 120 }}>
                    {b.username}
                  </span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: b.betOn === "dragon" ? "#fee2e2" : b.betOn === "tiger" ? "#ede9fe" : "#dcfce7",
                    color: b.betOn === "dragon" ? "#dc2626" : b.betOn === "tiger" ? "#7c3aed" : "#16a34a"
                  }}>
                    {b.betOn === "dragon" ? "🐉" : b.betOn === "tiger" ? "🐯" : "🤝"} {b.betOn.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>₹{b.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SET RESULT CARD */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Set Result Manually</div>
        <div style={styles.btnRow}>
          {["dragon", "tiger", "tie"].map(opt => (
            <button
              key={opt}
              style={{ ...styles.choiceBtn, ...(selected === opt ? (opt === "dragon" ? styles.activeDragon : opt === "tiger" ? styles.activeTiger : styles.activeTie) : {}) }}
              onClick={() => setSelected(opt)}
            >
              <span style={{ fontSize: 24 }}>{opt === "dragon" ? "🐉" : opt === "tiger" ? "🐯" : "🤝"}</span>
              <span style={{ textTransform: "capitalize" }}>{opt}</span>
            </button>
          ))}
        </div>

        {msg && (
          <div style={{ ...styles.msgBox, background: msg.includes("✅") ? "#f0fdf4" : "#fef2f2", color: msg.includes("✅") ? "#16a34a" : "#dc2626", border: "1px solid " + (msg.includes("✅") ? "#86efac" : "#fca5a5") }}>
            {msg}
          </div>
        )}

        <button style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Result"}
        </button>
      </div>

      {/* SMART ODDS CARD */}
      <div style={styles.card}>
        <div style={styles.oddsHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>⚖️</span>
            <span style={styles.cardTitle}>Smart Odds</span>
          </div>
          <div style={styles.oddsBadge}>{oddsValue}%</div>
        </div>

        <div style={styles.oddsDesc}>{getOddsDesc(oddsValue)}</div>

        <div style={{ marginBottom: 16 }}>
          <input type="range" min={0} max={100} step={10} value={oddsValue} onChange={e => setOddsValue(Number(e.target.value))} style={styles.slider} />
          <div style={styles.sliderLabels}>
            <span>0% Random</span>
            <span>50% Mixed</span>
            <span>100% House Wins</span>
          </div>
        </div>

        <div style={styles.quickBtns}>
          {[0, 50, 70, 80, 90, 100].map(v => (
            <button key={v} style={{ ...styles.quickBtn, ...(oddsValue === v ? styles.quickBtnActive : {}) }} onClick={() => setOddsValue(v)}>
              {v}%
            </button>
          ))}
        </div>

        {oddsMsg && (
          <div style={{ ...styles.msgBox, background: oddsMsg.includes("✅") ? "#f0fdf4" : "#fef2f2", color: oddsMsg.includes("✅") ? "#16a34a" : "#dc2626", border: "1px solid " + (oddsMsg.includes("✅") ? "#86efac" : "#fca5a5"), marginBottom: 12 }}>
            {oddsMsg}
          </div>
        )}

        <button style={styles.applyBtn} onClick={handleApplyOdds}>
          ✅ Apply Odds
        </button>

        <div style={styles.appliedInfo}>
          Currently applied: <strong>{appliedOdds}%</strong>
          {appliedOdds === 0 && " — Pure Random"}
          {appliedOdds === 100 && " — House Always Wins"}
        </div>
      </div>

      {/* LIVE BETS TABLE (existing) */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Live Bets Detail ({bets.length})</div>
        {bets.length === 0 ? (
          <div style={styles.emptyMsg}>Abhi koi bet nahi aayi...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Bet On</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((b, i) => (
                  <tr key={b.id || i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{b.username || "User"}</td>
                    <td style={styles.td}>{b.mobile || "-"}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: b.betOn === "dragon" ? "#fee2e2" : b.betOn === "tiger" ? "#ede9fe" : "#dcfce7",
                        color: b.betOn === "dragon" ? "#dc2626" : b.betOn === "tiger" ? "#7c3aed" : "#16a34a"
                      }}>
                        {b.betOn === "dragon" ? "🐉 Dragon" : b.betOn === "tiger" ? "🐯 Tiger" : "🤝 Tie"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>₹{b.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  page: { padding: "20px", background: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px" },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  label: { fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" },
  periodText: { fontSize: 14, fontWeight: 700, color: "#111827", marginTop: 4 },
  timerBox: { position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" },
  timerNum: { fontSize: 20, fontWeight: 900, position: "relative", zIndex: 1 },
  totalsRow: { display: "flex", gap: 12, marginBottom: 12 },
  totalBadge: { flex: 1, borderRadius: 12, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  badgeLabel: { fontSize: 11, color: "#6b7280", fontWeight: 600 },
  badgeAmt: { fontSize: 16, fontWeight: 800 },
  lowBetRow: { display: "flex", alignItems: "center", gap: 6, background: "#fffbeb", padding: "8px 12px", borderRadius: 8, border: "1px solid #fde68a" },
  lowBetLabel: { fontSize: 12, color: "#92400e", fontWeight: 600 },
  lowBetValue: { fontSize: 13, fontWeight: 800, color: "#b45309" },
  oddsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 14, borderBottom: "2px solid #f3f4f6", paddingBottom: 10 },
  oddsBadge: { background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", fontWeight: 800, fontSize: 15, padding: "4px 14px", borderRadius: 20 },
  oddsDesc: { fontSize: 13, color: "#6b7280", marginBottom: 14, background: "#f9fafb", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb" },
  slider: { width: "100%", accentColor: "#f97316", height: 6, cursor: "pointer" },
  sliderLabels: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 4 },
  quickBtns: { display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" },
  quickBtn: { padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 20, background: "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151", transition: "all 0.15s" },
  quickBtnActive: { background: "#f97316", borderColor: "#f97316", color: "#fff", boxShadow: "0 0 0 3px rgba(249,115,22,0.2)" },
  applyBtn: { width: "100%", padding: "12px", border: "none", borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" },
  appliedInfo: { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 10 },
  btnRow: { display: "flex", gap: 12, marginBottom: 14 },
  choiceBtn: { flex: 1, padding: "16px 8px", border: "2px solid #e5e7eb", borderRadius: 12, background: "#f9fafb", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#374151", transition: "all 0.2s" },
  activeDragon: { background: "#fee2e2", borderColor: "#ef4444", color: "#dc2626", transform: "scale(1.03)", boxShadow: "0 0 0 3px rgba(239,68,68,0.2)" },
  activeTiger: { background: "#ede9fe", borderColor: "#7c3aed", color: "#7c3aed", transform: "scale(1.03)", boxShadow: "0 0 0 3px rgba(124,58,237,0.2)" },
  activeTie: { background: "#dcfce7", borderColor: "#22c55e", color: "#16a34a", transform: "scale(1.03)", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" },
  msgBox: { padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: "center" },
  submitBtn: { width: "100%", padding: "14px", border: "none", borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(249,115,22,0.35)", transition: "all 0.2s" },
  emptyMsg: { textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  td: { padding: "10px 14px", color: "#4b5563", borderBottom: "1px solid #f3f4f6" },
};

export default DragonManager;