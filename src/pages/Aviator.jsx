import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Swal from "sweetalert2";
import "../styles/Aviator.css";

const API = "https://indr-backend-77tp.onrender.com/api";

const Aviator = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState(null);
  const [multiplier, setMultiplier] = useState(1.0);
  const [predictedCrash, setPredictedCrash] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [betPlaced, setBetPlaced] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [planeHeight, setPlaneHeight] = useState(0);

  // Load initial state
  const loadState = async () => {
    try {
      const res = await fetch(`${API}/aviator/state`);
      const data = await res.json();

      if (data.success) {
        setGameState(data.state);

        // Show predicted crash only when NO bets placed
        if (data.state.predictedCrash && !data.state.hasBets) {
          setPredictedCrash(parseFloat(data.state.predictedCrash));
        } else {
          setPredictedCrash(null);
        }

        if (data.state.phase === "flying") {
          setGameActive(true);
          setCrashed(false);
        } else if (data.state.phase === "crashed") {
          setCrashed(true);
          setGameActive(false);
        } else {
          setGameActive(false);
          setCrashed(false);
        }

        setMultiplier(parseFloat(data.state.multiplier || 1.0));
      }
    } catch (err) {
      console.error("Load state error:", err);
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API}/aviator/my-bets?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setHistory(data.bets || []);
      }
    } catch (err) {
      console.error("Load history error:", err);
    }
  };

  // SSE Connection
  useEffect(() => {
    loadState();
    loadHistory();

    try {
      const eventSource = new EventSource(`${API}/aviator/stream`);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          if (data.type === "state") {
            setGameState(data);

            // Show predicted crash ONLY when NO bets
            if (data.predictedCrash && !data.hasBets) {
              setPredictedCrash(parseFloat(data.predictedCrash));
            } else {
              setPredictedCrash(null);
            }

            if (data.phase === "waiting") {
              setGameActive(false);
              setCrashed(true);
              setPlaneHeight(0);
            } else if (data.phase === "flying") {
              setGameActive(true);
              setCrashed(false);
            }
          } else if (data.type === "tick") {
            const mult = parseFloat(data.multiplier);
            setMultiplier(mult);
            // Plane rises as multiplier increases
            setPlaneHeight(Math.min(mult * 20, 350)); // Max 350px
          } else if (data.type === "crashed") {
            setCrashed(true);
            setGameActive(false);
            setMultiplier(parseFloat(data.multiplier));
            loadHistory();
          }
        } catch (err) {
          console.error("Parse error:", err);
        }
      };

      eventSource.onerror = () => {
        console.error("SSE error");
        eventSource.close();
        // Retry in 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      };

      return () => {
        eventSource.close();
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }
  }, []);

  const placeBet = async () => {
    if (!betAmount || betAmount < 10) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Bet",
        text: "Minimum ₹10",
        width: "280px",
      });
      return;
    }

    if (balance < betAmount) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `You have ₹${balance.toFixed(2)}`,
        width: "280px",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/aviator/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ betAmount }),
      });

      const data = await res.json();

      if (data.success) {
        setBetPlaced(true);
        setPredictedCrash(null); // Hide prediction when bet placed
        await fetchBalance();

        Swal.fire({
          icon: "success",
          title: "Bet Placed!",
          text: `₹${betAmount} - Cashout before crash!`,
          width: "280px",
          timer: 1500,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg,
          width: "280px",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        width: "280px",
      });
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if (!gameActive || !gameState) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/aviator/cashout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roundId: gameState.roundId,
          cashoutAt: multiplier,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBetPlaced(false);
        setGameActive(false);
        await fetchBalance();
        await loadHistory();

        Swal.fire({
          icon: "success",
          title: "🎉 Cashed Out!",
          text: `Won ₹${(betAmount * multiplier).toFixed(2)}`,
          width: "280px",
          timer: 2000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg,
          width: "280px",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        width: "280px",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aviator-wrapper">
      <div className="aviator-container">
        {/* HEADER */}
        <div className="aviator-header">
          <span className="back-btn" onClick={() => navigate(-1)}>‹</span>
          <h1>✈️ AVIATOR</h1>
          <div className="balance-display">₹{balance.toFixed(2)}</div>
        </div>

        {/* GAME AREA */}
        <div className="game-area">
          {/* SKY & PLANE */}
          <div className="sky-container">
            <div className="sky">
              {/* Plane Animation */}
              <div className="plane" style={{ bottom: `${planeHeight}px` }}>
                ✈️
              </div>

              {/* Multiplier Text */}
              <div className="flying-multiplier">
                {multiplier.toFixed(2)}x
              </div>

              {/* Crash Message */}
              {crashed && (
                <div className="crash-message">💥 CRASHED!</div>
              )}
            </div>
          </div>

          {/* PREDICTED CRASH - Show ONLY when NO bets */}
          {predictedCrash && !betPlaced && (
            <div className="prediction-box">
              <div className="prediction-title">🎯 Next Crash Prediction</div>
              <div className="prediction-value">{predictedCrash.toFixed(2)}x</div>
              <div className="prediction-hint">Place bet before it reaches this!</div>
            </div>
          )}

          {/* BET ACTIVE BOX */}
          {betPlaced && gameActive && (
            <div className="bet-active-box">
              <div className="bet-info">₹{betAmount} @ {multiplier.toFixed(2)}x</div>
              <div className="potential-win">Can Win: ₹{(betAmount * multiplier).toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* STATE INFO */}
        {gameState && (
          <div className="state-info">
            <div className="info-row">
              <span>Round:</span>
              <code>{gameState.roundId?.slice(-6)}</code>
            </div>
            <div className="info-row">
              <span>Status:</span>
              <span className={`status-badge ${gameState.phase}`}>
                {gameState.phase.toUpperCase()}
              </span>
            </div>
            {gameState.hasBets && (
              <div className="info-row warn">
                <span>🔴 Bets Active</span>
              </div>
            )}
          </div>
        )}

        {/* BET CONTROLS */}
        <div className="controls-section">
          <div className="bet-input-section">
            <label>Bet Amount (₹)</label>
            <div className="input-group">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="10"
                max="10000"
                disabled={betPlaced || gameActive}
                className="bet-input"
              />
            </div>
          </div>

          <div className="quick-bets">
            {[50, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                className="quick-bet-btn"
                onClick={() => setBetAmount(amt)}
                disabled={betPlaced || gameActive}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="action-buttons">
          {!betPlaced && !gameActive && (
            <button
              className="btn btn-play"
              onClick={placeBet}
              disabled={loading}
            >
              {loading ? "Placing..." : "🎮 PLAY"}
            </button>
          )}

          {betPlaced && gameActive && (
            <button
              className="btn btn-cashout"
              onClick={cashout}
              disabled={loading}
            >
              💰 CASHOUT @ {multiplier.toFixed(2)}x
            </button>
          )}

          {crashed && (
            <button
              className="btn btn-next"
              onClick={loadState}
            >
              🔄 NEXT
            </button>
          )}
        </div>

        {/* HISTORY */}
        <div className="history-section">
          <h3>📋 Recent Bets</h3>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((bet, idx) => (
                <div key={idx} className={`history-item ${bet.result}`}>
                  <span className="bet-amount">₹{bet.amount}</span>
                  <span className="bet-multiplier">
                    @ {bet.cashoutAt ? bet.cashoutAt.toFixed(2) : "❌"}x
                  </span>
                  <span className="result-badge">
                    {bet.result === "win" ? "✅" : "❌"}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-history">No bets yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aviator;