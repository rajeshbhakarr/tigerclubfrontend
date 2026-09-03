import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const API_BASE = "https://tigerclubbackend.onrender.com";

const FortuneGemsManager = () => {
  const [odds, setOdds] = useState(25);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [liveBets, setLiveBets] = useState([]);
  const [summary, setSummary] = useState({
    totalSpins: 0,
    totalBetAmount: 0,
    totalPayoutAmount: 0,
    houseProfit: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const getAuthToken = () => {
    return (
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  // 1. Fetch Current Odds
  const fetchOdds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fortune-gems/odds`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success && typeof data.winOdds === "number") {
        setOdds(data.winOdds);
      }
    } catch (err) {
      console.error("Odds fetch error:", err);
    }
  };

  // 2. Fetch Live Player Spins
  const fetchLiveBets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fortune-gems/admin/live-bets`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setLiveBets(data.spins || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Live bets fetch error:", err);
    }
  };

  useEffect(() => {
    fetchOdds();
    fetchLiveBets();

    // Auto-refresh live spins every 3 seconds
    const interval = setInterval(fetchLiveBets, 3000);
    return () => clearInterval(interval);
  }, []);

  // 3. Save Odds
  const handleSaveOdds = async () => {
    try {
      setLoadingOdds(true);
      const res = await fetch(`${API_BASE}/api/fortune-gems/odds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ winOdds: Number(odds) }),
      });

      const data = await res.json();
      setLoadingOdds(false);

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Odds Updated!",
          text: `Fortune Gems Win Rate set to ${odds}%`,
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", data.message || "Failed to update odds", "error");
      }
    } catch (err) {
      setLoadingOdds(false);
      Swal.fire("Error", "Server connection failed", "error");
    }
  };

  const getOddsLabel = () => {
    if (odds === 0) return "0% — Complete House Win (100% User Loss)";
    if (odds <= 20) return `${odds}% — High House Edge (Hard)`;
    if (odds <= 40) return `${odds}% — Balanced Casino Edge (Recommended)`;
    if (odds <= 75) return `${odds}% — High Win Rate for Users`;
    return `${odds}% — Extreme Player Wins (100% Win at 100%)`;
  };

  return (
    <div style={{ padding: "20px", color: "#fff", maxWidth: "1200px" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "24px", color: "#f59e0b" }}>💎 Fortune Gems Manager</h2>
          <p style={{ margin: "5px 0 0", color: "#94a3b8", fontSize: "14px" }}>
            Real-time player spins monitor and smart odds control
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true);
            fetchLiveBets().then(() => setRefreshing(false));
          }}
          style={{
            background: "#334155",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {refreshing ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <div style={cardStyle}>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Total Spins</span>
          <h3 style={{ margin: "6px 0 0", fontSize: "22px" }}>{summary.totalSpins}</h3>
        </div>
        <div style={cardStyle}>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Total Bet Volume</span>
          <h3 style={{ margin: "6px 0 0", fontSize: "22px", color: "#38bdf8" }}>
            ₹{summary.totalBetAmount.toLocaleString()}
          </h3>
        </div>
        <div style={cardStyle}>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Total Won By Players</span>
          <h3 style={{ margin: "6px 0 0", fontSize: "22px", color: "#f43f5e" }}>
            ₹{summary.totalPayoutAmount.toLocaleString()}
          </h3>
        </div>
        <div style={cardStyle}>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>House Gross Profit</span>
          <h3
            style={{
              margin: "6px 0 0",
              fontSize: "22px",
              color: summary.houseProfit >= 0 ? "#22c55e" : "#ef4444",
            }}
          >
            ₹{summary.houseProfit.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Smart Odds Card */}
      <div
        style={{
          background: "#1e293b",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "30px",
          border: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <span style={{ fontSize: "20px" }}>⚖️</span>
          <h3 style={{ margin: 0, fontSize: "18px" }}>Smart Odds Controller</h3>
          <span
            style={{
              marginLeft: "auto",
              background: "#0f172a",
              padding: "4px 12px",
              borderRadius: "20px",
              color: "#f59e0b",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {odds}% Win Rate
          </span>
        </div>

        <p style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "18px" }}>
          {getOddsLabel()}
        </p>

        {/* Range Slider */}
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={odds}
          onChange={(e) => setOdds(Number(e.target.value))}
          style={{
            width: "100%",
            height: "8px",
            accentColor: "#f59e0b",
            cursor: "pointer",
            marginBottom: "15px",
          }}
        />

        {/* Preset Percentage Quick Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          {[0, 10, 20, 25, 35, 50, 75, 100].map((val) => (
            <button
              key={val}
              onClick={() => setOdds(val)}
              style={{
                background: odds === val ? "#f59e0b" : "#334155",
                color: odds === val ? "#000" : "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              {val}%
            </button>
          ))}
        </div>

        <button
          onClick={handleSaveOdds}
          disabled={loadingOdds}
          style={{
            background: "#22c55e",
            color: "#000",
            border: "none",
            padding: "10px 24px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          {loadingOdds ? "Saving..." : "✓ Apply Fortune Gems Odds"}
        </button>
      </div>

      {/* Live Players Real-Time Spin Activity */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "12px",
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
            <h3 style={{ margin: 0, fontSize: "17px" }}>Live Player Spins Activity</h3>
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Auto-updates every 3s</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#94a3b8" }}>
                <th style={thStyle}>Player / User</th>
                <th style={thStyle}>Bet Stake</th>
                <th style={thStyle}>Multiplier</th>
                <th style={thStyle}>Result</th>
                <th style={thStyle}>Payout</th>
                <th style={thStyle}>Time</th>
              </tr>
            </thead>
            <tbody>
              {liveBets.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No recent spins recorded yet
                  </td>
                </tr>
              )}
              {liveBets.map((spin, idx) => {
                const user = spin.userId;
                const displayName =
                  user?.username ||
                  user?.email ||
                  user?.phone ||
                  (spin.userId ? `User #${String(spin.userId).slice(-5)}` : "Unknown Player");
                const isWin = spin.result === "WIN" || (spin.winAmount || 0) > 0;

                return (
                  <tr
                    key={spin._id || idx}
                    style={{
                      borderBottom: "1px solid #334155",
                      background: idx % 2 === 0 ? "transparent" : "#192231",
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: "600", color: "#f8fafc" }}>{displayName}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Bal: ₹{Number(user?.wallet || 0).toFixed(2)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: "bold", color: "#e2e8f0" }}>₹{spin.betAmount}</span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: "#334155",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          fontSize: "12px",
                          color: "#f59e0b",
                        }}
                      >
                        {spin.multiplier ? `${spin.multiplier}x` : "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          background: isWin ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: isWin ? "#4ade80" : "#f87171",
                        }}
                      >
                        {isWin ? "WIN" : "LOSS"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: isWin ? "#22c55e" : "#94a3b8",
                        }}
                      >
                        {isWin ? `+₹${Number(spin.winAmount).toFixed(2)}` : "₹0.00"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {spin.createdAt ? new Date(spin.createdAt).toLocaleTimeString() : "Just now"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: "#1e293b",
  padding: "16px",
  borderRadius: "10px",
  border: "1px solid #334155",
};

const thStyle = {
  padding: "12px 16px",
  fontWeight: "600",
  fontSize: "12px",
  textTransform: "uppercase",
};

const tdStyle = {
  padding: "12px 16px",
};

export default FortuneGemsManager;