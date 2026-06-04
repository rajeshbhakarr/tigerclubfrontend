// sections/AviatorManager.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "https://indr-backend-77tp.onrender.com/api/aviator";

function AviatorManager() {
  const [liveData,    setLiveData]    = useState(null);
  const [multiplier,  setMultiplier]  = useState(1.0);
  const [phase,       setPhase]       = useState("waiting");
  const [roundId,     setRoundId]     = useState(null);
  const [msg,         setMsg]         = useState({ text: "", type: "" });
  const [loading,     setLoading]     = useState(false);
  const esRef = useRef(null);

  // ── SSE — live multiplier real-time
  useEffect(() => {
    const es = new EventSource(`${API}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "tick") {
          setMultiplier(data.multiplier);
          setPhase("flying");
          setRoundId(data.roundId);
        }
        if (data.type === "state") {
          setPhase(data.phase);
          setRoundId(data.roundId);
          if (data.multiplier) setMultiplier(data.multiplier);
        }
        if (data.type === "crashed") {
          setPhase("crashed");
          setMultiplier(data.multiplier);
        }
      } catch {}
    };

    return () => es.close();
  }, []);

  // ── Poll live bets every 2s
  const fetchLive = async () => {
    try {
      const res = await axios.get(`${API}/admin/live-bets`);
      if (res.data.success) setLiveData(res.data);
    } catch (err) {
      console.log("live-bets fetch error:", err.message);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Force crash
  const handleCrash = async () => {
    if (!window.confirm("Plane crash karein? Sab pending bets lost ho jaayengi!")) return;
    if (phase !== "flying") {
      showMsg("Plane abhi flying nahi hai!", "error"); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/crash`);
      showMsg(res.data.message || "Force crash triggered!", "success");
      fetchLive();
    } catch (err) {
      showMsg(err.response?.data?.message || "Error!", "error");
    }
    setLoading(false);
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  // ── Phase color
  const phaseColor = { waiting: "#f59e0b", flying: "#22c55e", crashed: "#ef4444" }[phase] || "#fff";
  const phaseLabel = { waiting: "⏳ WAITING", flying: "✈️ FLYING", crashed: "💥 CRASHED" }[phase] || phase;

  return (
    <div style={{ color: "white", padding: "8px", maxWidth: "1000px" }}>

      <h2 style={{
        fontSize: "24px", fontWeight: "700", marginBottom: "20px",
        background: "linear-gradient(135deg, #FFD700, #FF8C00)",
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
      }}>✈️ Aviator Manager</h2>

      {/* Message */}
      {msg.text && (
        <div style={{
          background: msg.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${msg.type === "success" ? "#22c55e" : "#ef4444"}`,
          color: msg.type === "success" ? "#22c55e" : "#ef4444",
          padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "14px",
        }}>
          {msg.type === "success" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* Live Monitor Card */}
      <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px", padding: "18px", marginBottom: "16px",
      }}>
        <h3 style={{ color: "#f59e0b", marginBottom: "14px", fontSize: "15px", fontWeight: "700" }}>
          📡 Live Monitor
        </h3>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {/* Phase */}
          <div style={{ background: "rgba(0,0,0,0.35)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "6px" }}>PHASE</p>
            <p style={{ fontSize: "13px", fontWeight: "800", color: phaseColor }}>{phaseLabel}</p>
          </div>

          {/* Multiplier */}
          <div style={{ background: "rgba(0,0,0,0.35)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "6px" }}>MULTIPLIER</p>
            <p style={{ fontSize: "22px", fontWeight: "900", color: phase === "crashed" ? "#ef4444" : "#22c55e",
              fontFamily: "monospace" }}>
              {multiplier.toFixed(2)}x
            </p>
          </div>

          {/* Total Bet */}
          <div style={{ background: "rgba(0,0,0,0.35)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "6px" }}>TOTAL BET</p>
            <p style={{ fontSize: "17px", fontWeight: "800", color: "#f59e0b" }}>
              ₹{liveData?.totalBet || "0.00"}
            </p>
          </div>
        </div>

        {/* Round info */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "8px 12px",
          marginBottom: "14px", fontSize: "12px", color: "#94a3b8",
        }}>
          <span>Round ID: <b style={{ color: "#e2e8f0" }}>#{roundId || "—"}</b></span>
          <span>Players: <b style={{ color: "#e2e8f0" }}>{liveData?.totalPlayers || 0}</b></span>
        </div>

        {/* Plane progress bar */}
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "99px", height: "28px",
          overflow: "hidden", position: "relative", marginBottom: "14px" }}>
          <div style={{
            height: "100%", borderRadius: "99px",
            background: phase === "crashed"
              ? "linear-gradient(90deg, #ef4444, #b91c1c)"
              : "linear-gradient(90deg, #22c55e, #16a34a)",
            width: phase === "flying"
              ? `${Math.min(95, ((multiplier - 1) / 9) * 100)}%`
              : phase === "crashed" ? "100%" : "5%",
            transition: "width 0.2s linear",
            opacity: 0.5,
          }} />
          <span style={{
            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
            fontSize: "16px",
          }}>
            {phase === "crashed" ? "💥" : "✈️"}
          </span>
        </div>

        {/* Force Crash Button */}
        <button
          onClick={handleCrash}
          disabled={loading || phase !== "flying"}
          style={{
            width: "100%", padding: "13px", borderRadius: "10px", border: "none",
            background: phase === "flying"
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "rgba(255,255,255,0.08)",
            color: phase === "flying" ? "white" : "#64748b",
            fontWeight: "800", fontSize: "15px", cursor: phase === "flying" ? "pointer" : "not-allowed",
            letterSpacing: "0.5px", transition: "all 0.2s",
            boxShadow: phase === "flying" ? "0 4px 20px rgba(239,68,68,0.4)" : "none",
          }}
        >
          {loading ? "Crashing..." : phase === "flying" ? "💥 FORCE CRASH KARO" : phase === "waiting" ? "⏳ Round Start Hone Do..." : "Round Khatam Ho Gaya"}
        </button>
      </div>

      {/* Live Bets Table */}
      <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px", padding: "16px", marginBottom: "16px",
      }}>
        <h3 style={{ color: "#f59e0b", marginBottom: "12px", fontSize: "15px", fontWeight: "700" }}>
          🎰 Live Bets ({liveData?.totalPlayers || 0})
        </h3>

        {(!liveData?.bets || liveData.bets.length === 0) ? (
          <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
            {phase === "waiting" ? "Naya round shuru hone do..." : "Abhi koi active bet nahi"}
          </p>
        ) : (
          <div style={{ borderRadius: "8px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
              padding: "8px 12px", background: "rgba(255,255,255,0.07)",
              fontSize: "11px", color: "#94a3b8", fontWeight: "600", letterSpacing: "0.5px",
            }}>
              <span>USER</span><span>BET</span><span>TYPE</span>
            </div>
            {/* Rows */}
            {liveData.bets.map((bet, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
                padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: "13px", alignItems: "center",
              }}>
                <span style={{ color: "#e2e8f0" }}>{bet.userId?.username || "User"}</span>
                <span style={{ color: "#f59e0b", fontWeight: "700" }}>₹{bet.amount}</span>
                <span style={{ color: "#22c55e", fontSize: "12px" }}>{bet.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Round History */}
      <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px", padding: "16px",
      }}>
        <h3 style={{ color: "#f59e0b", marginBottom: "12px", fontSize: "15px", fontWeight: "700" }}>
          📋 Last 20 Rounds
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {(liveData?.history || []).map((h, i) => (
            <span key={i} style={{
              padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: "700",
              fontFamily: "monospace",
              background: h.crashAt >= 3
                ? "rgba(155,93,229,0.15)" : h.crashAt >= 2
                ? "rgba(244,185,66,0.15)" : "rgba(239,68,68,0.15)",
              color: h.crashAt >= 3 ? "#9b5de5" : h.crashAt >= 2 ? "#f4b942" : "#ef4444",
              border: `1px solid ${h.crashAt >= 3 ? "rgba(155,93,229,0.3)" : h.crashAt >= 2 ? "rgba(244,185,66,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}>
              {h.crashAt?.toFixed(2)}x
            </span>
          ))}
          {(!liveData?.history || liveData.history.length === 0) && (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Koi history nahi abhi</p>
          )}
        </div>
      </div>

    </div>
  );
}

export default AviatorManager;