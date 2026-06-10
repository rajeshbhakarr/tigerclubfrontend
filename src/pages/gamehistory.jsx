import React, { useEffect, useState } from "react";
import "../styles/gamehistory.css";

const API_URL = "https://tigerclubbackendonrender.com";

const GameHistory = () => {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p = 1) => {
    try {
      const res = await fetch(`${API_URL}/api/wingo?page=${p}`);
      const data = await res.json();
      setHistory(data.history || []);
      setTotalPages(Math.min(5, data.pagination?.totalPages || 1));
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    fetchHistory(page);
    // Only auto-refresh on page 1
    if (page === 1) {
      const interval = setInterval(() => fetchHistory(1), 3000);
      return () => clearInterval(interval);
    }
  }, [page]);

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchHistory(p);
  };

  return (
    <div className="wingo-history-wrapper">
      <div className="wingo-history-header">
        <div>Period</div>
        <div>Number</div>
        <div>Big Small</div>
        <div>Color</div>
      </div>

      <div className="wingo-history-list">
        {history.length === 0 && <p style={{ textAlign: "center", color: "#aaa" }}>No Data</p>}
        {history.map((item, index) => (
          <div className="wingo-history-row" key={index}>
            <div className="wingo-period">{item.period}</div>
            <div className={`wingo-num-text
              ${item.color === "Green" ? "wingo-num-green" : ""}
              ${item.color === "Red" ? "wingo-num-red" : ""}
              ${item.color === "Violet" ? "wingo-num-mix" : ""}
            `}>{item.number}</div>
            <div className="wingo-size" style={{marginLeft:"20px"}} >{item.number >= 5 ? "Big" : "Small"}</div>
            <div className="wingo-history-color-container">
              {item.color === "Green" && <span className="wingo-dot-base wingo-dot-green"></span>}
              {item.color === "Red" && <span className="wingo-dot-base wingo-dot-red"></span>}
              {item.color === "Violet" && item.number === 0 && (
                <>
                  <span className="wingo-dot-base wingo-dot-red"></span>
                  <span className="wingo-dot-base wingo-dot-violet"></span>
                </>
              )}
              {item.color === "Violet" && item.number === 5 && (
                <>
                  <span className="wingo-dot-base wingo-dot-green"></span>
                  <span className="wingo-dot-base wingo-dot-violet"></span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} goTo={goTo} />
    </div>
  );
};

// ── My History with pagination ──────────────────────────────────
export const MyHistory = () => {
  const [bets, setBets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBets = async (p = 1) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/wingo/my-bets?page=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBets(data.bets || []);
      setTotalPages(Math.min(5, data.pagination?.totalPages || 1));
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchBets(page); }, [page]);

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="wingo-history-wrapper">
      <div className="wingo-history-header" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
        <div>Period</div><div>Bet</div><div>Amount</div><div>Result</div><div>Payout</div>
      </div>

      {bets.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "20px" }}>No bets yet</p>}

      {bets.map((b, i) => (
        <div className="wingo-history-row" key={i}
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
          <div className="wingo-period">{b.period}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6, display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
              background: getBetColor(b.betValue), color: "#fff"
            }}>{b.betValue}</span>
          </div>
          <div>₹{b.amount}</div>
          <div style={{
            color: b.result === "win" ? "#4caf50" : b.result === "loss" ? "#f44336" : "#aaa",
            fontWeight: 600
          }}>
            {b.result === "win" ? "Win" : b.result === "loss" ? "Loss" : "..."}
          </div>
          <div style={{ color: b.result === "win" ? "#4caf50" : "#aaa" }}>
            {b.result === "win" ? `+₹${b.payout?.toFixed(2)}` : b.result === "loss" ? `-₹${b.amount}` : "-"}
          </div>
        </div>
      ))}

      <Pagination page={page} totalPages={totalPages} goTo={goTo} />
    </div>
  );
};

// ── Shared Pagination Component ─────────────────────────────────
const Pagination = ({ page, totalPages, goTo }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, padding: "14px 0 4px"
    }}>
      <button onClick={() => goTo(page - 1)} disabled={page === 1}
        style={arrowBtn(page === 1)}>‹</button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => goTo(p)}
          style={pageBtn(p === page)}>{p}</button>
      ))}

      <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
        style={arrowBtn(page === totalPages)}>›</button>
    </div>
  );
};

function getBetColor(val) {
  if (val === "Big") return "#f97316";
  if (val === "Small") return "#3b82f6";
  if (val === "Green") return "#16a34a";
  if (val === "Red") return "#dc2626";
  if (val === "Violet") return "#7c3aed";
  // Number
  const n = parseInt(val);
  if (n === 0 || n === 5) return "#7c3aed";
  if ([1,3,7,9].includes(n)) return "#16a34a";
  return "#dc2626";
}

const arrowBtn = (disabled) => ({
  width: 32, height: 32, borderRadius: 8, border: "1px solid #ddd",
  background: disabled ? "#f1f5f9" : "#fff", color: disabled ? "#aaa" : "#1e293b",
  fontSize: 18, cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
});

const pageBtn = (active) => ({
  width: 32, height: 32, borderRadius: 8,
  border: active ? "none" : "1px solid #ddd",
  background: active ? "#f97316" : "#fff",
  color: active ? "#fff" : "#475569",
  fontSize: 14, fontWeight: active ? 700 : 400,
  cursor: "pointer",
});

export default GameHistory;