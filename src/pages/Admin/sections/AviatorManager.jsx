import React, { useState, useEffect } from "react";
const API = "https://indr-backend-77tp.onrender.com/api";
const ADMIN_KEY = process.env.REACT_APP_ADMIN_KEY || "your-admin-key-here";

const AviatorManager = () => {
  const [state, setState] = useState(null);
  const [liveBets, setLiveBets] = useState([]);
  const [nextCrash, setNextCrash] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadState = async () => {
    try {
      const res = await fetch(`${API}/aviator/admin/state`, {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
      }
    } catch (err) {
      console.error("Load state error:", err);
    }
  };

  const loadLiveBets = async () => {
    try {
      const res = await fetch(`${API}/aviator/admin/live-bets`, {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const data = await res.json();
      if (data.success) {
        setLiveBets(data.bets);
      }
    } catch (err) {
      console.error("Load bets error:", err);
    }
  };

  useEffect(() => {
    loadState();
    loadLiveBets();
    const interval = setInterval(() => {
      loadState();
      loadLiveBets();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🔧 Set next crash multiplier
  const setNextCrashMultiplier = async () => {
    if (!nextCrash || nextCrash < 1.1 || nextCrash > 1000) {
      setMessage("❌ Multiplier must be between 1.1 - 1000");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/aviator/admin/set-crash`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({ multiplier: parseFloat(nextCrash) }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`✅ Next crash set to ${nextCrash}x`);
        setNextCrash("");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${data.msg}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 💥 Force crash now
  const forceCrash = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/aviator/admin/force-crash`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Crash triggered!");
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(`❌ ${data.msg}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aviator-manager">
      <h1>✈️ Aviator Admin Panel</h1>

      {/* CURRENT STATE */}
      {state && (
        <div className="state-box">
          <h2>Current Round</h2>
          <div className="state-row">
            <span>Round ID:</span>
            <code>{state.roundId?.slice(-8)}</code>
          </div>
          <div className="state-row">
            <span>Multiplier:</span>
            <span className="big">{state.multiplier}x</span>
          </div>
          <div className="state-row">
            <span>Status:</span>
            <span className={`badge ${state.phase}`}>{state.phase.toUpperCase()}</span>
          </div>
          <div className="state-row">
            <span>Has Bets:</span>
            <span>{state.hasBets ? "🔴 YES" : "🟢 NO"}</span>
          </div>
          <div className="state-row">
            <span>Predicted Crash:</span>
            <span className="gold">
              {state.predictedCrash ? `${state.predictedCrash}x` : "Hidden (Bets placed)"}
            </span>
          </div>
        </div>
      )}

      {/* LIVE BETS */}
      <div className="bets-box">
        <h2>Live Bets ({liveBets.length})</h2>
        {liveBets.length > 0 ? (
          <div className="bets-list">
            {liveBets.map((bet, idx) => (
              <div key={idx} className="bet-row">
                <span className="bet-user">{bet.user?.mobile || "Unknown"}</span>
                <span className="bet-amount">₹{bet.amount}</span>
                <span className="bet-cashout">{bet.cashoutAt ? `@${bet.cashoutAt.toFixed(2)}x` : "Not set"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No active bets</p>
        )}
      </div>

      {/* CONTROLS */}
      <div className="controls-box">
        <h2>🔧 Control Next Round</h2>

        <div className="control-section">
          <label>Set Crash Multiplier</label>
          <div className="input-group">
            <input
              type="number"
              value={nextCrash}
              onChange={(e) => setNextCrash(e.target.value)}
              placeholder="e.g. 2.5"
              min="1.1"
              max="1000"
              step="0.1"
              disabled={loading}
            />
            <button
              className="btn-set"
              onClick={setNextCrashMultiplier}
              disabled={loading}
            >
              {loading ? "Setting..." : "SET CRASH"}
            </button>
          </div>
          <small>Multiplier will crash at this exact value next round</small>
        </div>

        <div className="control-section">
          <button
            className="btn-force"
            onClick={forceCrash}
            disabled={loading}
          >
            {loading ? "Crashing..." : "💥 FORCE CRASH NOW"}
          </button>
          <small>Immediately crash the current flying plane</small>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .aviator-manager {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          background: #0f0f23;
          color: #fff;
          border-radius: 12px;
        }

        h1 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
        }

        h2 {
          font-size: 16px;
          margin: 15px 0 10px 0;
          border-bottom: 2px solid #7c3aed;
          padding-bottom: 5px;
        }

        .state-box,
        .bets-box,
        .controls-box {
          background: #1a1a3e;
          border: 1px solid #404070;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .state-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #404070;
        }

        .state-row:last-child {
          border: none;
        }

        .state-row span {
          font-weight: 600;
        }

        .big {
          font-size: 20px;
          color: #ffd700;
        }

        .gold {
          color: #ffd700;
          font-weight: 700;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
        }

        .badge.waiting {
          background: #3b82f6;
        }

        .badge.flying {
          background: #10b981;
        }

        .badge.crashed {
          background: #ff6b6b;
        }

        .bets-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .bet-row {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #2d2d5f;
          border-radius: 4px;
          margin-bottom: 5px;
          font-size: 13px;
        }

        .bet-user {
          font-weight: 600;
          color: #b0b0c8;
        }

        .bet-amount {
          color: #ffd700;
          font-weight: 700;
        }

        .bet-cashout {
          color: #10b981;
        }

        .empty {
          text-align: center;
          color: #b0b0c8;
          padding: 10px;
        }

        .control-section {
          margin-bottom: 15px;
        }

        .control-section label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          font-size: 13px;
        }

        .input-group {
          display: flex;
          gap: 8px;
        }

        input[type="number"] {
          flex: 1;
          padding: 8px;
          background: #2d2d5f;
          border: 1px solid #404070;
          border-radius: 4px;
          color: #fff;
        }

        .btn-set,
        .btn-force {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-weight: 700;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s;
        }

        .btn-set {
          background: #7c3aed;
          color: white;
          flex-shrink: 0;
        }

        .btn-set:hover:not(:disabled) {
          background: #6d28d9;
        }

        .btn-force {
          width: 100%;
          background: #ff6b6b;
          color: white;
        }

        .btn-force:hover:not(:disabled) {
          background: #dc2626;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        small {
          display: block;
          margin-top: 5px;
          color: #b0b0c8;
          font-size: 11px;
        }

        .message {
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          margin-top: 15px;
        }

        .message.success {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid #10b981;
        }

        .message.error {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border: 1px solid #ff6b6b;
        }
      `}</style>
    </div>
  );
};

export default AviatorManager;