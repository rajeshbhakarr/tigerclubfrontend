import React, { useState, useEffect } from "react";
import "../../../styles/admin/aviatoradmin.css";

const API = "https://indr-backend-77tp.onrender.com/api";

// Get admin key from environment or prompt
const getAdminKey = () => {
  let key = localStorage.getItem("aviator-admin-key");
  if (!key) {
    key = prompt("Enter admin key:");
    if (key) localStorage.setItem("aviator-admin-key", key);
  }
  return key;
};

const AviatorManager = () => {
  const [state, setGameState] = useState(null);
  const [liveBets, setLiveBets] = useState([]);
  const [nextCrash, setNextCrash] = useState("2.5");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [adminKey, setAdminKey] = useState(() => getAdminKey() || "");

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // Load game state
  const loadState = async () => {
    try {
      if (!adminKey) {
        showMessage("❌ Admin key required", "error");
        return;
      }

      const res = await fetch(`${API}/aviator/admin/state`, {
        headers: {
          "x-admin-key": adminKey,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          showMessage("❌ Invalid admin key", "error");
          localStorage.removeItem("aviator-admin-key");
          setAdminKey("");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setGameState(data.state);
      } else {
        showMessage(`❌ ${data.msg}`, "error");
      }
    } catch (err) {
      console.error("Load state error:", err);
      showMessage(`❌ Load failed: ${err.message}`, "error");
    }
  };

  // Load live bets
  const loadLiveBets = async () => {
    try {
      if (!adminKey) return;

      const res = await fetch(`${API}/aviator/admin/live-bets`, {
        headers: {
          "x-admin-key": adminKey,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.success) {
        setLiveBets(data.bets || []);
      }
    } catch (err) {
      console.error("Load bets error:", err);
    }
  };

  // Auto-refresh every 2 seconds
  useEffect(() => {
    if (!adminKey) return;

    loadState();
    loadLiveBets();

    const interval = setInterval(() => {
      loadState();
      loadLiveBets();
    }, 2000);

    return () => clearInterval(interval);
  }, [adminKey]);

  // 🔧 Set next crash
  const setNextCrashMultiplier = async () => {
    if (!adminKey) {
      showMessage("❌ Admin key required", "error");
      return;
    }

    if (!nextCrash || nextCrash < 1.1 || nextCrash > 1000) {
      showMessage("❌ Multiplier must be 1.1 - 1000", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/aviator/admin/set-crash`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ multiplier: parseFloat(nextCrash) }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          showMessage("❌ Invalid admin key", "error");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        showMessage(`✅ Next crash set to ${nextCrash}x`);
        setNextCrash("");
        await loadState();
      } else {
        showMessage(`❌ ${data.msg}`, "error");
      }
    } catch (err) {
      console.error("Set crash error:", err);
      showMessage(`❌ Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 💥 Force crash
  const forceCrash = async () => {
    if (!adminKey) {
      showMessage("❌ Admin key required", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/aviator/admin/force-crash`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          showMessage("❌ Invalid admin key", "error");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        showMessage("✅ Crash triggered!");
        await loadState();
      } else {
        showMessage(`❌ ${data.msg}`, "error");
      }
    } catch (err) {
      console.error("Force crash error:", err);
      showMessage(`❌ Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aviator-admin">
      <div className="admin-header">
        <h1>✈️ Aviator Admin Panel</h1>
      </div>

      {/* Admin Key Section */}
      {!adminKey && (
        <div className="admin-key-section">
          <input
            type="password"
            placeholder="Enter admin key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="key-input"
          />
          <button className="key-btn" onClick={() => loadState()}>
            Login
          </button>
        </div>
      )}

      {adminKey && (
        <>
          {/* CURRENT STATE */}
          {state && (
            <div className="state-box">
              <h2>Current Round</h2>
              <div className="state-grid">
                <div className="state-item">
                  <span className="label">Round ID</span>
                  <code>{state.roundId?.slice(-8) || "..."}</code>
                </div>
                <div className="state-item">
                  <span className="label">Multiplier</span>
                  <span className="value">{parseFloat(state.multiplier || 1).toFixed(2)}x</span>
                </div>
                <div className="state-item">
                  <span className="label">Status</span>
                  <span className={`badge ${state.phase}`}>
                    {state.phase?.toUpperCase()}
                  </span>
                </div>
                <div className="state-item">
                  <span className="label">Has Bets</span>
                  <span>{state.hasBets ? "🔴 YES" : "🟢 NO"}</span>
                </div>
                {state.predictedCrash && (
                  <div className="state-item">
                    <span className="label">Predicted</span>
                    <span className="value gold">{state.predictedCrash}x</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIVE BETS */}
          <div className="bets-box">
            <h2>Live Bets ({liveBets.length})</h2>
            {liveBets.length > 0 ? (
              <div className="bets-table">
                <div className="bets-header">
                  <span>User</span>
                  <span>Amount</span>
                  <span>Cashout</span>
                </div>
                {liveBets.map((bet, idx) => (
                  <div key={idx} className="bet-row">
                    <span className="user">{bet.user?.mobile || "Unknown"}</span>
                    <span className="amount">₹{bet.amount}</span>
                    <span className="cashout">
                      {bet.cashoutAt ? `@${parseFloat(bet.cashoutAt).toFixed(2)}x` : "Not set"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-bets">No active bets</div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="controls-box">
            <h2>🔧 Control Panel</h2>

            <div className="control">
              <label>Set Next Crash Multiplier</label>
              <div className="control-group">
                <input
                  type="number"
                  value={nextCrash}
                  onChange={(e) => setNextCrash(e.target.value)}
                  placeholder="e.g. 2.5"
                  min="1.1"
                  max="1000"
                  step="0.1"
                  disabled={loading}
                  className="crash-input"
                />
                <button
                  className="btn-set"
                  onClick={setNextCrashMultiplier}
                  disabled={loading}
                >
                  {loading ? "Setting..." : "SET"}
                </button>
              </div>
              <small>Next round will crash at this exact multiplier</small>
            </div>

            <div className="control">
              <button
                className="btn-force"
                onClick={forceCrash}
                disabled={loading}
              >
                {loading ? "Processing..." : "💥 FORCE CRASH NOW"}
              </button>
              <small>Immediately crash the current flying round</small>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            className="btn-logout"
            onClick={() => {
              localStorage.removeItem("aviator-admin-key");
              setAdminKey("");
            }}
          >
            Logout
          </button>
        </>
      )}

      {/* MESSAGE */}
      {message && (
        <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .aviator-admin {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          background: #0f0f23;
          color: #fff;
          border-radius: 12px;
          min-height: 100vh;
        }

        .admin-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .admin-header h1 {
          font-size: 24px;
          margin: 0;
        }

        .admin-key-section {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .key-input {
          flex: 1;
          padding: 10px;
          background: #2d2d5f;
          border: 1px solid #404070;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
        }

        .key-btn {
          padding: 10px 20px;
          background: #7c3aed;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .key-btn:hover {
          background: #6d28d9;
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

        .state-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .state-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .state-item .label {
          font-size: 11px;
          color: #b0b0c8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .state-item code {
          background: rgba(124, 58, 237, 0.2);
          padding: 4px 6px;
          border-radius: 4px;
          font-family: monospace;
          color: #ffd700;
          font-size: 13px;
        }

        .state-item .value {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
        }

        .state-item .value.gold {
          color: #ffd700;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
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

        .bets-table {
          display: flex;
          flex-direction: column;
          max-height: 200px;
          overflow-y: auto;
        }

        .bets-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          padding: 8px;
          background: rgba(124, 58, 237, 0.2);
          border-bottom: 1px solid #404070;
          font-weight: 600;
          font-size: 12px;
        }

        .bet-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          padding: 8px;
          border-bottom: 1px solid #404070;
          font-size: 12px;
        }

        .bet-row:last-child {
          border: none;
        }

        .user {
          color: #b0b0c8;
        }

        .amount {
          color: #ffd700;
          font-weight: 700;
        }

        .cashout {
          color: #10b981;
        }

        .empty-bets {
          text-align: center;
          color: #b0b0c8;
          padding: 15px;
        }

        .control {
          margin-bottom: 15px;
        }

        .control label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .control-group {
          display: flex;
          gap: 8px;
        }

        .crash-input {
          flex: 1;
          padding: 8px;
          background: #2d2d5f;
          border: 1px solid #404070;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
        }

        .btn-set,
        .btn-force,
        .btn-logout {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
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

        .btn-logout {
          width: 100%;
          background: #404070;
          color: white;
          margin-top: 20px;
        }

        .btn-logout:hover {
          background: #505090;
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
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          z-index: 1000;
        }

        .message.success {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 2px solid #10b981;
        }

        .message.error {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border: 2px solid #ff6b6b;
        }
      `}</style>
    </div>
  );
};

export default AviatorManager;