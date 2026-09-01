import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Swal from "sweetalert2";
import "./aviator.css";

const API = "https://indr-backend-77tp.onrender.com/api";

const Aviator = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [multiplier, setMultiplier] = useState(1.0);
  const [predictedCrash, setPredictedCrash] = useState(null); // 🎯 Show when no bets
  const [betAmount, setBetAmount] = useState(50);
  const [betPlaced, setBetPlaced] = useState(false);
  const [activeBet, setActiveBet] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load state
  const loadState = async () => {
    try {
      const res = await fetch(`${API}/aviator/state`);
      const data = await res.json();

      if (data.success) {
        setState(data.state);

        // 🎯 Show predicted crash ONLY when no bets!
        if (data.state.predictedCrash && !data.state.hasBets) {
          setPredictedCrash(data.state.predictedCrash);
        } else {
          setPredictedCrash(null);
        }
      }
    } catch (err) {
      console.error("Load state error:", err);
    }
  };

  const loadBets = async () => {
    try {
      const res = await fetch(`${API}/aviator/my-bets?limit=10`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();

      if (data.success) {
        setHistory(data.bets);
      }
    } catch (err) {
      console.error("Load bets error:", err);
    }
  };

  const checkActiveBet = async () => {
    try {
      const res = await fetch(`${API}/aviator/active-bet`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();

      if (data.success && data.bet) {
        setActiveBet(data.bet);
        setBetPlaced(true);
      } else {
        setBetPlaced(false);
        setActiveBet(null);
      }
    } catch (err) {
      console.error("Check active bet error:", err);
    }
  };

  // SSE Connection
  useEffect(() => {
    loadState();
    loadBets();
    checkActiveBet();

    const eventSource = new EventSource(`${API}/aviator/stream`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "state") {
          setState(data);

          // 🎯 Show predicted crash ONLY when NO bets placed
          if (data.predictedCrash && !data.hasBets) {
            setPredictedCrash(parseFloat(data.predictedCrash.toFixed(2)));
          } else {
            setPredictedCrash(null); // Hide when bets placed!
          }

          if (data.phase === "waiting") {
            setGameOver(true);
            setBetPlaced(false);
          } else if (data.phase === "flying") {
            setGameOver(false);
          }
        } else if (data.type === "tick") {
          setMultiplier(parseFloat(data.multiplier));
        } else if (data.type === "crashed") {
          setMultiplier(parseFloat(data.multiplier));
          setGameOver(true);
          setBetPlaced(false);
          loadBets();
        }
      } catch (err) {
        console.error("Parse error:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const placeBet = async () => {
    if (!betAmount || betAmount < 10) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Bet",
        text: "Minimum ₹10",
        width: "260px",
      });
      return;
    }

    if (balance < betAmount) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `You have ₹${balance.toFixed(2)}`,
        width: "260px",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/aviator/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ betAmount }),
      });

      const data = await res.json();

      if (data.success) {
        setBetPlaced(true);
        setPredictedCrash(null); // Hide predicted when bet placed!
        setActiveBet(data.bet);
        await fetchBalance();

        Swal.fire({
          icon: "success",
          title: "Bet Placed!",
          text: `₹${betAmount} - Cashout before crash!`,
          width: "260px",
          timer: 1500,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg,
          width: "260px",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Bet failed",
        width: "260px",
      });
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if (!state || state.phase !== "flying") {
      Swal.fire({
        icon: "warning",
        title: "Can't Cashout",
        text: "Game not flying",
        width: "260px",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/aviator/cashout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          roundId: state.roundId,
          cashoutAt: multiplier,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBetPlaced(false);
        setGameOver(true);
        await fetchBalance();
        await loadBets();

        Swal.fire({
          icon: "success",
          title: "🎉 Cashed Out!",
          text: `Won ₹${(betAmount * multiplier).toFixed(2)}`,
          width: "260px",
          timer: 2000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg,
          width: "260px",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Cashout failed",
        width: "260px",
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

        {/* MULTIPLIER DISPLAY */}
        <div className="multiplier-box">
          <div className={`big-multiplier ${gameOver ? "crashed" : ""}`}>
            {multiplier.toFixed(2)}x
          </div>

          {/* 🎯 PREDICTED CRASH - Show ONLY when NO BETS */}
          {predictedCrash && !betPlaced && (
            <div className="predicted-zone">
              <div className="prediction-label">🎯 Plane Will Fly To:</div>
              <div className="prediction-value">{predictedCrash.toFixed(2)}x</div>
              <div className="prediction-hint">Place a bet and cashout before it crashes!</div>
            </div>
          )}

          {/* BET PLACED - Hide prediction */}
          {betPlaced && (
            <div className="bet-active-zone">
              <div className="bet-alert">⚠️ BET ACTIVE ⚠️</div>
              <div className="bet-amount">₹{betAmount}</div>
              <div className="potential-win">Can Win: ₹{(betAmount * multiplier).toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* STATE INFO */}
        {state && (
          <div className="state-display">
            <div className="state-item">
              <span>Round:</span>
              <span className="mono">{state.roundId?.slice(-6)}</span>
            </div>
            <div className="state-item">
              <span>Status:</span>
              <span className={`status-${state.phase}`}>{state.phase.toUpperCase()}</span>
            </div>
            <div className="state-item">
              <span>Has Bets:</span>
              <span>{state.hasBets ? "🔴 YES" : "🟢 NO"}</span>
            </div>
          </div>
        )}

        {/* BET INPUT */}
        <div className="bet-controls">
          <div className="bet-input-section">
            <label>Bet Amount</label>
            <div className="input-box">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="10"
                max="10000"
                disabled={betPlaced || !gameOver}
              />
              <span>₹</span>
            </div>
          </div>

          <div className="quick-bets">
            {[50, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                className="quick-btn"
                onClick={() => setBetAmount(amt)}
                disabled={betPlaced}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="action-btns">
          {!betPlaced && gameOver && (
            <button className="btn btn-play" onClick={placeBet} disabled={loading}>
              {loading ? "Placing..." : "🎮 PLAY"}
            </button>
          )}

          {betPlaced && state?.phase === "flying" && (
            <button className="btn btn-cashout" onClick={cashout} disabled={loading}>
              💰 CASHOUT @ {multiplier.toFixed(2)}x
            </button>
          )}

          {gameOver && betPlaced && state?.phase === "waiting" && (
            <button className="btn btn-next" onClick={loadState}>
              🔄 NEW ROUND
            </button>
          )}
        </div>

        {/* HISTORY */}
        <div className="history-box">
          <h3>📋 Recent</h3>
          <div className="history-items">
            {history.map((bet, idx) => (
              <div key={idx} className={`history-row ${bet.result}`}>
                <span>₹{bet.amount}</span>
                <span>@ {bet.cashoutAt ? bet.cashoutAt.toFixed(2) : "❌"}x</span>
                <span className="result-badge">
                  {bet.result === "win" ? "✅" : "❌"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aviator;