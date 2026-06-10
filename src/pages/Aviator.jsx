// src/components/Aviator.jsx
import "../styles/Aviator.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import {
  placeBet as placeBetApi,
  cashout as cashoutApi,
  cancelBet as cancelBetApi,
  getMyBets,
  getActiveBet,
  createAviatorStream,
} from "../api/Aviatorapi";
const API_URL = "https://tigerclubbackend.onrender.com";



// ─── Helpers ──────────────────────────────────────────────────
function getCrashClass(val) {
  if (val >= 10) return "mega";
  if (val >= 3) return "high";
  if (val >= 2) return "mid";
  return "low";
}

// ─── Canvas curve ─────────────────────────────────────────────
function drawCurve(canvas, points, crashed) {
  if (!canvas || points.length < 2) return null;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const pad = { left: 24, bottom: 24, right: 16, top: 16 };
  const maxX = Math.max(points.length - 1, 1);
  const maxY = Math.max(...points, 1.5) * 1.15;

  const toX = (i) => pad.left + (i / maxX) * (W - pad.left - pad.right);
  const toY = (v) => H - pad.bottom - ((v - 1) / Math.max(maxY - 1, 0.01)) * (H - pad.top - pad.bottom);

  const color = crashed ? "#e63946" : "#2dc653";
  const colorFade = crashed ? "rgba(230,57,70," : "rgba(45,198,83,";

  // Fill gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, colorFade + "0.3)");
  grad.addColorStop(1, colorFade + "0.0)");

  // Draw path helper
  const drawPath = () => {
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(points[0]));
    for (let i = 1; i < points.length; i++) {
      const xc = (toX(i - 1) + toX(i)) / 2;
      const yc = (toY(points[i - 1]) + toY(points[i])) / 2;
      ctx.quadraticCurveTo(toX(i - 1), toY(points[i - 1]), xc, yc);
    }
    if (points.length >= 2) {
      ctx.quadraticCurveTo(
        toX(points.length - 2), toY(points[points.length - 2]),
        toX(points.length - 1), toY(points[points.length - 1])
      );
    }
  };

  // Fill
  drawPath();
  ctx.lineTo(toX(points.length - 1), H - pad.bottom);
  ctx.lineTo(toX(0), H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke
  drawPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;

  return {
    x: toX(points.length - 1),
    y: toY(points[points.length - 1]),
    W, H,
  };
}

// ─── Main Component ───────────────────────────────────────────
const Aviator = () => {
  const navigate = useNavigate();
  const { balance, setBalance } = useWallet();

  // ── Game state
  const [phase, setPhase] = useState("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [roundId, setRoundId] = useState(null);
  const [crashHistory, setCrashHistory] = useState([]); // [{roundId, crashAt}]
  const [waitCountdown, setWaitCountdown] = useState(5);

  // ── Single bet slot state
  const [amount, setAmount] = useState(10);
  const [autoCashoutVal, setAutoCashoutVal] = useState(""); // user input
  const [betId, setBetId] = useState(null);
  const [betState, setBetState] = useState("idle"); // idle | placed | cashed
  const [cashedAt, setCashedAt] = useState(null);
  const [cashedPayout, setCashedPayout] = useState(null);

  // ── History modal
  const [showHistory, setShowHistory] = useState(false);
  const [histTab, setHistTab] = useState("all");
  const [allBets, setAllBets] = useState([]); // current round live bets
  const [myBetsList, setMyBetsList] = useState([]);

  // ── Toast
  const [toast, setToast] = useState({ msg: "", type: "", show: false });

  // ── Win popup
  const [winPopup, setWinPopup] = useState(null); // null | { cashoutAt, payout, amount }
  const winPopupTimerRef = useRef(null);

  // ── Refs
  const canvasRef = useRef(null);
  const planeRef = useRef(null);
  const pointsRef = useRef([1.0]);
  const phaseRef = useRef("waiting");
  const betIdRef = useRef(null);
  const betStateRef = useRef("idle");
  const autoCORef = useRef("");
  const multiplierRef = useRef(1.0);
  const streamRef = useRef(null);
  const waitRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { betIdRef.current = betId; }, [betId]);
  useEffect(() => { betStateRef.current = betState; }, [betState]);
  useEffect(() => { autoCORef.current = autoCashoutVal; }, [autoCashoutVal]);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);

  // ── Toast helper
  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  // ── Win popup helper — auto close 3s, manual close bhi
  const showWinPopup = useCallback((cashoutAt, payout, betAmount) => {
    setWinPopup({ cashoutAt, payout, amount: betAmount });
    clearTimeout(winPopupTimerRef.current);
    winPopupTimerRef.current = setTimeout(() => setWinPopup(null), 3000);
  }, []);

  const closeWinPopup = useCallback(() => {
    clearTimeout(winPopupTimerRef.current);
    setWinPopup(null);
  }, []);

  // ── Canvas redraw + plane position
  const redrawCanvas = useCallback((crashed = false) => {
    const pos = drawCurve(canvasRef.current, pointsRef.current, crashed);
    if (pos && planeRef.current && !crashed) {
      const pctX = Math.min(90, (pos.x / pos.W) * 100);
      const pctY = Math.min(85, ((pos.H - pos.y) / pos.H) * 100);
      planeRef.current.style.left = `${pctX}%`;
      planeRef.current.style.bottom = `${pctY}%`;
    }
  }, []);

  // ── Auto cashout — runs client-side as backup (server also handles it)
  const tryAutoCashout = useCallback(async (currentMult) => {
    const auto = parseFloat(autoCORef.current);
    if (!auto || auto < 1.01) return;
    if (betStateRef.current !== "placed") return;
    if (!betIdRef.current) return;
    if (currentMult < auto) return;

    // Trigger cashout
    try {
      const res = await cashoutApi(betIdRef.current);
      if (res.success) {
        setBalance(res.balance);
        setBetId(null);
        setBetState("cashed");
        setCashedAt(res.cashoutAt);
        setCashedPayout(res.payout);
        showWinPopup(res.cashoutAt, res.payout, amount);  // ✅ WIN POPUP
        setAllBets(prev => [{
          user: "You", amount, cashoutAt: res.cashoutAt,
          payout: res.payout, result: "win",
        }, ...prev].slice(0, 50));
      }
    } catch { }
  }, [amount, setBalance, showWinPopup]);

  // ── SSE message handler
  const handleMsg = useCallback((data) => {
    // ── state event (phase change)
    if (data.type === "state") {
      phaseRef.current = data.phase;
      setPhase(data.phase);
      setRoundId(data.roundId);

      if (data.phase === "waiting") {
        // New round started — reset everything
        pointsRef.current = [1.0];
        setMultiplier(1.0);
        setAllBets([]);
        // Reset bet only if it wasn't cashed — cashed shows result briefly then reset
        setBetState(prev => {
          if (prev === "placed") return "idle"; // lost — reset
          if (prev === "cashed") {
            // show cashed message for 2s then idle
            setTimeout(() => {
              setBetState("idle");
              setCashedAt(null);
              setCashedPayout(null);
            }, 2500);
            return "cashed";
          }
          return "idle";
        });
        setBetId(null);
        redrawCanvas(false);

        // Countdown
        let c = 12;
        setWaitCountdown(c);
        clearInterval(waitRef.current);
        waitRef.current = setInterval(() => {
          c--;
          setWaitCountdown(c);
          if (c <= 0) clearInterval(waitRef.current);
        }, 1000);
      }

      if (data.phase === "flying") {
        clearInterval(waitRef.current);
        pointsRef.current = [1.0];
        setMultiplier(1.0);
      }
    }

    // ── history event
    if (data.type === "history") {
      setCrashHistory(data.history || []);
    }

    // ── tick event
    if (data.type === "tick") {
      setMultiplier(data.multiplier);
      multiplierRef.current = data.multiplier;
      pointsRef.current.push(data.multiplier);
      if (pointsRef.current.length > 400) pointsRef.current = pointsRef.current.slice(-400);
      redrawCanvas(false);
      tryAutoCashout(data.multiplier);
    }

    // ── crashed event
    if (data.type === "crashed") {
      phaseRef.current = "crashed";
      setPhase("crashed");
      setMultiplier(data.multiplier);
      redrawCanvas(true);

      // Add to crash history bar
      setCrashHistory(prev => [
        { roundId: data.roundId, crashAt: data.multiplier },
        ...prev
      ].slice(0, 20));

      // If user still has active bet — they lost
      if (betStateRef.current === "placed") {
        setBetState("idle");
        setBetId(null);
        showToast(`💥 Crashed @ ${data.multiplier}x — Bet lost`, "loss");
        setAllBets(prev => [
          { user: "You", amount: 0, cashoutAt: null, payout: 0, result: "loss" },
          ...prev
        ].slice(0, 50));
      }

      // Refresh my bets list
      getMyBets().then(d => setMyBetsList(d.bets || []));
    }

    // ── server-side auto cashout confirmation
    if (data.type === "autoCashout") {
      if (betIdRef.current && betIdRef.current.toString() === data.betId) {
        setBalance(b => parseFloat((b + data.payout).toFixed(2)));
        setBetId(null);
        setBetState("cashed");
        setCashedAt(data.cashoutAt);
        setCashedPayout(data.payout);
        showWinPopup(data.cashoutAt, data.payout, data.payout / data.cashoutAt); // ✅ WIN POPUP
      }
    }
  }, [redrawCanvas, tryAutoCashout, showToast, setBalance]);

  // ── Connect SSE
  useEffect(() => {
    const es = createAviatorStream(handleMsg);
    streamRef.current = es;
    return () => {
      es.close();
      clearInterval(waitRef.current);
    };
  }, []);

  // Reconnect handler on update
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.onmessage = (e) => {
        try { handleMsg(JSON.parse(e.data)); } catch { }
      };
    }
  }, [handleMsg]);

  // ── Canvas resize
  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current) return;
      const wrap = canvasRef.current.parentElement;
      canvasRef.current.width = wrap.clientWidth;
      canvasRef.current.height = wrap.clientHeight;
      redrawCanvas(phase === "crashed");
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [phase, redrawCanvas]);

  // ── My bets load
  useEffect(() => {
    if (histTab === "my") getMyBets().then(d => setMyBetsList(d.bets || []));
  }, [histTab]);

  // ── Place bet
  const handleBet = async () => {
    if (phase !== "waiting") {
      showToast("Wait for next round!", "info"); return;
    }
    if (amount < 1) { showToast("Min bet ₹1", "info"); return; }

    try {
      const auto = autoCashoutVal ? parseFloat(autoCashoutVal) : null;
      const res = await placeBetApi({ amount, autoCashout: auto });
      if (res.success) {
        setBalance(res.balance);
        setBetId(res.betId);
        setBetState("placed");
        showToast(`✅ Bet ₹${amount} placed!`, "info");
      } else {
        showToast(res.message || "Bet failed", "loss");
      }
    } catch {
      showToast("Network error", "loss");
    }
  };

  // ── Cancel bet — server pe delete karo, wallet refund lo
  const handleCancel = async () => {
    if (!betId) return;
    try {
      const res = await cancelBetApi(betId);
      if (res.success) {
        setBalance(res.balance);           // ✅ wallet update
        setBetId(null);
        setBetState("idle");
        showToast(`✅ Bet cancel! ₹${res.refund} wapas add ho gaye`, "info");
      } else {
        showToast(res.message || "Cancel nahi hua", "loss");
      }
    } catch {
      // Fallback — sirf state reset karo
      setBetId(null);
      setBetState("idle");
      showToast("Bet cancel ho gaya", "info");
    }
  };

  // ── Manual cashout
  const handleCashout = async () => {
    if (!betId || betState !== "placed") return;
    try {
      const res = await cashoutApi(betId);
      if (res.success) {
        setBalance(res.balance);
        setBetId(null);
        setBetState("cashed");
        setCashedAt(res.cashoutAt);
        setCashedPayout(res.payout);
        showWinPopup(res.cashoutAt, res.payout, amount);  // ✅ WIN POPUP
        setAllBets(prev => [{
          user: "You", amount, cashoutAt: res.cashoutAt,
          payout: res.payout, result: "win",
        }, ...prev].slice(0, 50));
        getMyBets().then(d => setMyBetsList(d.bets || []));
      } else {
        showToast(res.message || "Cashout failed", "loss");
      }
    } catch {
      showToast("Network error", "loss");
    }
  };

  // ── Render action button
  const renderActionBtn = () => {
    if (betState === "placed" && phase === "waiting") {
      return (
        <button className="av-action-btn cancel" onClick={handleCancel}>
          CANCEL BET
        </button>
      );
    }
    if (betState === "placed" && phase === "flying") {
      return (
        <button className="av-action-btn cashout" onClick={handleCashout}>
          <span className="av-cashout-label">CASHOUT</span>
          <span className="av-cashout-multi">{multiplier.toFixed(2)}x</span>
          <span className="av-cashout-amount">₹{(amount * multiplier).toFixed(2)}</span>
        </button>
      );
    }
    if (betState === "cashed") {
      return (
        <button className="av-action-btn cashed" disabled>
          ✓ CASHED @ {cashedAt}x &nbsp;+₹{cashedPayout}
        </button>
      );
    }
    // idle
    return (
      <button
        className="av-action-btn bet"
        disabled={phase === "flying" || phase === "crashed"}
        onClick={handleBet}
      >
        {phase === "waiting" ? `BET  ₹${amount}` : "WAIT NEXT ROUND"}
      </button>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────
  return (
    <div className="aviator-root">

      {/* Toast */}
      <div className={`av-toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>

      {/* ── WIN POPUP — manual close + 3s auto close ── */}
      {winPopup && (
        <div className="av-win-overlay" onClick={closeWinPopup}>
          <div className="av-win-card" onClick={e => e.stopPropagation()}>
            <button className="av-win-close" onClick={closeWinPopup}>✕</button>

            {/* Glow ring */}
            <div className="av-win-glow" />

            {/* Stars */}
            <div className="av-win-stars">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="av-win-star" style={{ animationDelay: `${i * 0.15}s` }}>★</span>
              ))}
            </div>

            {/* Plane icon */}
            <div className="av-win-plane">✈️</div>

            {/* Title */}
            <div className="av-win-title">YOU CASHED OUT!</div>

            {/* Multiplier */}
            <div className="av-win-multi">{winPopup.cashoutAt?.toFixed(2)}x</div>

            {/* Payout */}
            <div className="av-win-payout">
              <span className="av-win-payout-label">Profit</span>
              <span className="av-win-payout-val">+₹{winPopup.payout?.toFixed(2)}</span>
            </div>

            {/* Auto close bar */}
            <div className="av-win-bar">
              <div className="av-win-bar-fill" />
            </div>
            <div className="av-win-tap">Tap anywhere to close</div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="av-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="av-modal" onClick={e => e.stopPropagation()}>
            <div className="av-modal-header">
              <span>Round History</span>
              <button className="av-modal-close" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            <div className="av-modal-body">
              {crashHistory.length === 0 && (
                <div className="av-modal-empty">No history yet</div>
              )}
              {crashHistory.map((h, i) => (
                <div className="av-hist-row" key={i}>
                  <span className="av-hist-rid">#{h.roundId}</span>
                  <span className={`av-hist-crash ${getCrashClass(h.crashAt)}`}>
                    {h.crashAt?.toFixed(2)}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="av-header">
        <button className="av-header-back" onClick={() => navigate(-1)}>‹</button>
        <div className="av-header-title">✈ AVIATOR</div>
        <div className="av-header-balance"  style={{fontSize:"18px"}} >₹{balance?.toFixed(2)}</div>
      </div>

      {/* Crash history bar */}
      <div className="av-history-bar">
        {crashHistory.slice(0, 8).map((h, i) => (
          <span key={i} className={`av-crash-pill ${getCrashClass(h.crashAt)}`}>
            {h.crashAt?.toFixed(2)}x
          </span>
        ))}
        <button className="av-history-btn" onClick={() => setShowHistory(true)}>
          🕐
        </button>
      </div>

      {/* Round ID bar */}
      <div className="av-round-bar">
        <div className="av-round-id">Round: <span>#{roundId || "—"}</span></div>
        <div className="av-ping">Ping: <span>42ms</span></div>
      </div>

      {/* Game Canvas */}
      <div className="av-canvas-wrap">
        <canvas ref={canvasRef} />

        {/* Plane */}
        {phase === "flying" && (
          <div ref={planeRef} className="av-plane" style={{ left: "8%", bottom: "8%" }}>
            ✈️
          </div>
        )}

        {/* Waiting overlay */}
        {phase === "waiting" && (
          <div className="av-waiting-overlay">
            <div className="av-waiting-label">NEXT ROUND IN</div>
            <div className="av-waiting-countdown">{waitCountdown}</div>
          </div>
        )}

        {/* Multiplier display */}
        <div className={`av-multiplier ${phase}`}>
          {phase === "waiting" && "WAITING..."}
          {phase === "flying" && `${multiplier.toFixed(2)}x`}
          {phase === "crashed" && (
            <>
              <div className="av-flew">{multiplier.toFixed(2)}x</div>
              <div className="av-flew-label">FLEW AWAY!</div>
            </>
          )}
        </div>
      </div>

      {/* Bet Panel */}
      <div className="av-bet-panel">
        <div className="av-bet-tabs">
          <div className="av-bet-tab active">Bet</div>
          <div className="av-bet-tab">Auto</div>
        </div>

        <div className="av-bet-slot">
          {/* Amount control */}
          <div className="av-amount-ctrl">
            <button onClick={() => setAmount(a => Math.max(1, a - 10))}>−</button>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button onClick={() => setAmount(a => a + 10)}>+</button>
          </div>

          {/* Quick amounts */}
          <div className="av-quick-amounts">
            {[10, 100, 500, 1000].map(q => (
              <button
                key={q}
                className={`av-quick-btn ${amount === q ? "active" : ""}`}
                onClick={() => setAmount(q)}
              >{q}</button>
            ))}
          </div>

          {/* Auto cashout */}
          <div className="av-auto-row">
            <span className="av-auto-label">Auto ×</span>
            <input
              className="av-auto-input"
              type="number"
              placeholder="e.g. 2.00"
              step="0.1"
              min="1.1"
              value={autoCashoutVal}
              onChange={e => setAutoCashoutVal(e.target.value)}
            />
            {autoCashoutVal && (
              <button className="av-auto-clear" onClick={() => setAutoCashoutVal("")}>✕</button>
            )}
          </div>

          {/* Action button */}
          {renderActionBtn()}
        </div>
      </div>

      {/* Live bet list */}
      <div className="av-history-section">
        <div className="av-hist-tabs">
          <div className={`av-hist-tab ${histTab === "all" ? "active" : ""}`}
            onClick={() => setHistTab("all")}>All Bets</div>
          <div className={`av-hist-tab ${histTab === "my" ? "active" : ""}`}
            onClick={() => setHistTab("my")}>My Bets</div>
          <div className={`av-hist-tab ${histTab === "top" ? "active" : ""}`}
            onClick={() => setHistTab("top")}>Top</div>
        </div>

        <div className="av-bet-row av-bet-row-header">
          <span>User</span>
          <span>Bet</span>
          <span>×</span>
          <span>Profit</span>
        </div>

        <div className="av-bet-list">
          {histTab === "all" && allBets.map((b, i) => (
            <div className="av-bet-row" key={i}>
              <span className="av-bet-user">{b.user}</span>
              <span className="av-bet-amount"   >₹{b.amount}</span>
              <span className={`av-bet-cashout ${b.result}`}>
                {b.cashoutAt ? `${b.cashoutAt}x` : "—"}
              </span>
              <span className={`av-bet-payout ${b.result}`}>
                {b.result === "win" ? `+₹${b.payout?.toFixed(2)}` : b.result === "loss" ? "BUST" : "—"}
              </span>
            </div>
          ))}

          {histTab === "my" && myBetsList.map((b, i) => (
            <div className="av-bet-row" key={i}>
              <span className="av-bet-user" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                #{b.roundId}
              </span>
              <span className="av-bet-amount">₹{b.amount}</span>
              <span className={`av-bet-cashout ${b.result}`}>
                {b.cashoutAt ? `${b.cashoutAt}x` : b.result === "loss" ? "BUST" : "—"}
              </span>
              <span className={`av-bet-payout ${b.result}`}>
                {b.result === "win" ? `+₹${b.payout?.toFixed(2)}` : b.result === "loss" ? `-₹${b.amount}` : "—"}
              </span>
            </div>
          ))}

          {histTab === "top" && (
            <div className="av-empty">Top bets coming soon</div>
          )}

          {histTab !== "top" && allBets.length === 0 && myBetsList.length === 0 && (
            <div className="av-empty">No bets yet this round</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Aviator;