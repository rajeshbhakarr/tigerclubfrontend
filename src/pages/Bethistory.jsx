import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/bethistory.css";
import axios from "axios";

const API = "https://indr-backend-77tp.onrender.com";

const authHeader = () => ({
  headers: { Authorization: "Bearer " + localStorage.getItem("token") },
});

function Bethistory() {
  const navigate    = useNavigate();
  const [activeTab, setActiveTab] = useState("wingo");
  const [bets, setBets]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [error, setError]         = useState("");

  // ── Fetch history — har game ka alag endpoint
  const fetchHistory = async (game) => {
    setLoading(true);
    setError("");
    setBets([]);
    try {
      let res;

      if (game === "wingo") {
        // WinGo — /api/wingo/my-bets
        res = await axios.get(`${API}/wingo/my-bets`, authHeader());
        if (res.data.success) {
          // Normalize wingo bets
          const normalized = (res.data.bets || []).map(b => ({
            _id       : b._id,
            roundId   : b.period,
            betType   : b.betType,
            betValue  : b.betValue,
            amount    : b.amount,
            winAmount : b.result === "win" ? b.payout : 0,
            status    : b.result === "win" ? "won" : b.result === "loss" ? "lost" : "pending",
            createdAt : b.createdAt,
            payout    : b.payout,
          }));
          setBets(normalized);
        }

      } else if (game === "dragontiger") {
        // Dragon Tiger — /api/dragon-tiger/my-bets
        res = await axios.get(`${API}/dragon-tiger/my-bets`, authHeader());
        if (res.data.success) {
          const normalized = (res.data.bets || []).map(b => ({
            _id       : b._id,
            roundId   : b.roundId,
            betType   : "dragonTiger",
            betValue  : b.betOn || b.betValue,   // dono handle karo
            amount    : b.amount,
            winAmount : b.result === "win" ? b.payout : 0,
            status    : b.result === "win" ? "won"      // normalized
                      : b.result === "loss" ? "lost"
                      : b.status === "won"  ? "won"     // DT original fields
                      : b.status === "lost" ? "lost"
                      : "pending",
            createdAt : b.createdAt,
            payout    : b.payout || b.winAmount || 0,
          }));
          setBets(normalized);
        }

      } else if (game === "aviator") {
        // Aviator — /api/aviator/my-bets
        res = await axios.get(`${API}/aviator/my-bets`, authHeader());
        if (res.data.success) {
          const normalized = (res.data.bets || []).map(b => ({
            _id       : b._id,
            roundId   : b.roundId,
            betType   : "aviator",
            betValue  : b.cashoutAt ? `${b.cashoutAt}x pe cashout` : "BUST",
            amount    : b.amount,
            winAmount : b.result === "win" ? b.payout : 0,
            status    : b.result === "win" ? "won" : b.result === "loss" ? "lost" : "pending",
            createdAt : b.createdAt,
            payout    : b.payout,
            cashoutAt : b.cashoutAt,
          }));
          setBets(normalized);
        }
      }

    } catch (err) {
      console.log("fetchHistory error:", err);
      setError("History load nahi hui — dobara try karo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(activeTab);
  }, [activeTab]);

  // ── Display label
  const getBetLabel = (bet) => {
    if (bet.betType === "color")      return bet.betValue;
    if (bet.betType === "number")     return `Number ${bet.betValue}`;
    if (bet.betType === "bigSmall")   return bet.betValue;
    if (bet.betType === "dragonTiger") return bet.betValue;
    if (bet.betType === "aviator")    return bet.betValue;
    return "-";
  };

  const profit = (bet) => {
    if (bet.status === "won")  return `+₹${(bet.payout - bet.amount).toFixed(2)}`;
    if (bet.status === "lost") return `-₹${bet.amount}`;
    return "Pending";
  };

  const tabs = [
    { key: "wingo",       label: "🎯 WinGo"       },
    { key: "dragontiger", label: "🐉 Dragon Tiger" },
    { key: "aviator",     label: "✈️ Aviator"      },
  ];

  return (
    <div className="betpage">

      {/* Header */}
      <div className="txtdiv">
        <button className="backBtn" onClick={() => navigate(-1)}>←</button>
        <span className="txtt">Game History</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "2px solid #eee" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "12px 4px", border: "none",
              background: "transparent", cursor: "pointer",
              fontSize: "12px", fontWeight: "700",
              color: activeTab === tab.key ? "#d4c83f" : "#888",
              borderBottom: activeTab === tab.key ? "3px solid #d4c83f" : "3px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <hr />

      {/* Loading */}
      {loading && (
        <div className="loading">Loading...</div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="loading" style={{ color: "red" }}>{error}</div>
      )}

      {/* Empty */}
      {!loading && !error && bets.length === 0 && (
        <div className="loading" style={{ color: "#888" }}>
          Koi history nahi (last 24 ghante)
        </div>
      )}

      {/* Bet List */}
      {!loading && bets.map((bet, i) => (
        <div
          key={i}
          className="result-container"
          style={{ marginBottom: "10px", cursor: "pointer" }}
          onClick={() => setSelectedBet(selectedBet?._id === bet._id ? null : bet)}
        >
          {/* Header */}
          <div className="result-header">
            <span>
              {activeTab === "wingo"       ? "Win Go" :
               activeTab === "dragontiger" ? "Dragon Tiger" : "Aviator"}
            </span>
            <span className={bet.status === "won" ? "win" : bet.status === "lost" ? "lose" : ""}>
              {bet.status === "won" ? "✅ Win" : bet.status === "lost" ? "❌ Lose" : "⏳ Pending"}
            </span>
          </div>

          {/* Basic Details */}
          <div className="details">
            <p><b>Period:</b> {bet.roundId || "-"}</p>
            <p><b>Select:</b> {getBetLabel(bet)}</p>
            <p><b>Total Bet:</b> ₹{bet.amount}</p>
            <p style={{ color: bet.status === "won" ? "green" : bet.status === "lost" ? "red" : "#888", fontWeight: 700 }}>
              <b>P&L:</b> {profit(bet)}
            </p>
          </div>

          {/* Expanded Details */}
          {selectedBet?._id === bet._id && (
            <>
              <div className="details" style={{ borderTop: "1px solid #eee", paddingTop: "8px" }}>
                <p><b>Order ID:</b> {bet._id}</p>
                <p><b>Game:</b> {activeTab}</p>
                <p><b>Date:</b> {new Date(bet.createdAt).toLocaleString()}</p>
                {bet.cashoutAt && <p><b>Cashout At:</b> {bet.cashoutAt}x</p>}
              </div>

              {/* Amount Box */}
              <div className="amount-box">
                <div>
                  <p>₹{bet.amount}</p>
                  <span>Bet Amount</span>
                </div>
                <div>
                  <p>₹{bet.winAmount?.toFixed(2) || "0.00"}</p>
                  <span>Winnings</span>
                </div>
                <div>
                  <p>₹{(bet.amount * 0.04).toFixed(2)}</p>
                  <span>Fee (4%)</span>
                </div>
                <div>
                  <p className={bet.status === "won" ? "profit" : "loss"}>
                    {profit(bet)}
                  </p>
                  <span>Profit/Loss</span>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

    </div>
  );
}

export default Bethistory;