import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Swal from "sweetalert2";
import "../styles/fortuneGems.css";

import templeBg from "../assets/fortune-gems/temple-bg.png";
import redGem from "../assets/fortune-gems/red-gem.png";
import purpleGem from "../assets/fortune-gems/purple-gem.png";
import greenGem from "../assets/fortune-gems/green-gem.png";
import blueGem from "../assets/fortune-gems/blue-gem.png";
import wildImg from "../assets/fortune-gems/wild.png";
import jImg from "../assets/fortune-gems/j.png";
import qImg from "../assets/fortune-gems/q.png";

const API_BASE = "https://tigerclubbackend.onrender.com";

const SYMBOL_IMAGES = {
  RED_GEM: { id: "red", type: "image", src: redGem },
  PURPLE_GEM: { id: "purple", type: "image", src: purpleGem },
  GREEN_GEM: { id: "green", type: "image", src: greenGem },
  BLUE_GEM: { id: "blue", type: "image", src: blueGem },
  WILD: { id: "wild", type: "image", src: wildImg },
  J: { id: "j", type: "image", src: jImg },
  Q: { id: "q", type: "image", src: qImg },
  A: { id: "a", type: "text", value: "A" },
  K: { id: "k", type: "text", value: "K" },
};

const INITIAL_REELS = [
  [SYMBOL_IMAGES.RED_GEM, SYMBOL_IMAGES.BLUE_GEM, SYMBOL_IMAGES.GREEN_GEM],
  [SYMBOL_IMAGES.PURPLE_GEM, SYMBOL_IMAGES.WILD, SYMBOL_IMAGES.Q],
  [SYMBOL_IMAGES.BLUE_GEM, SYMBOL_IMAGES.RED_GEM, SYMBOL_IMAGES.J],
];

const MULTIPLIERS = ["10x", "5x", "2x"];

const randomSymbol = () => {
  const values = Object.values(SYMBOL_IMAGES);
  return values[Math.floor(Math.random() * values.length)];
};

const makeReels = () =>
  Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => randomSymbol())
  );

const getToken = () => {
  const possibleKeys = ["token", "authToken", "accessToken", "jwt"];
  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// Backend reels format conversion [rows][cols] -> [cols][rows] display
const convertBackendReels = (backendReels) => {
  if (!Array.isArray(backendReels)) return makeReels();

  const grid = [[], [], []];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const sym = backendReels[r] && backendReels[r][c] ? backendReels[r][c] : "BLUE_GEM";
      grid[c][r] = SYMBOL_IMAGES[sym] || SYMBOL_IMAGES.BLUE_GEM;
    }
  }
  return grid;
};

const FortuneGems = () => {
  const { balance, setBalance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [betAmount, setBetAmount] = useState(10);
  const [reels, setReels] = useState(INITIAL_REELS);
  const [multiplier, setMultiplier] = useState("2x");
  const [winAmount, setWinAmount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [autoSpin, setAutoSpin] = useState(0);

  const animationTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, []);

  const changeBet = (value) => {
    if (value === "") {
      setBetAmount("");
      return;
    }
    const num = Number(value);
    if (isNaN(num)) return;
    const next = Math.min(100000, Math.max(1, num));
    setBetAmount(next);
  };

  const renderSymbol = (symbol) => {
    if (!symbol) return null;
    if (symbol.type === "image") {
      return (
        <img
          className={`fg-symbol-image fg-symbol-${symbol.id}`}
          src={symbol.src}
          alt=""
          draggable="false"
        />
      );
    }
    return <span className="fg-letter-symbol">{symbol.value}</span>;
  };

  const showError = (title, text) => {
    Swal.fire({
      icon: "error",
      title,
      text,
      confirmButtonText: "OK",
      width: 330,
    });
  };

  const spin = async () => {
    if (isSpinning) return;

    const currentBalance = Number(balance || 0);
    const amount = Number(betAmount || 0);

    if (!Number.isFinite(amount) || amount < 1) {
      showError("Invalid Bet", "Please enter a valid bet amount (Min ₹1).");
      return;
    }

    if (currentBalance < amount) {
      showError("Insufficient Balance", `Available balance ₹${currentBalance.toFixed(2)}`);
      return;
    }

    const token = getToken();
    if (!token) {
      showError("Login Required", "Please login again before playing.");
      return;
    }

    // 1. Instant deduction from wallet
    setBalance((prev) => parseFloat((Number(prev) - amount).toFixed(2)));
    setIsSpinning(true);
    setWinAmount(0);

    // Safety clear
    if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    animationTimerRef.current = setInterval(() => {
      setReels(makeReels());
    }, turbo ? 45 : 65);

    const minSpinDuration = turbo ? 600 : 1200;
    const spinStartTime = Date.now();

    try {
      const requestId = createRequestId();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_BASE}/api/fortune-gems/spin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          betAmount: amount,
          requestId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        setBalance((prev) => parseFloat((Number(prev) + amount).toFixed(2)));
        throw new Error(data?.message || `Server error (${response.status})`);
      }

      const spinData = data.spin;
      if (!spinData) {
        setBalance((prev) => parseFloat((Number(prev) + amount).toFixed(2)));
        throw new Error("Invalid response received from server.");
      }

      const finalReels = convertBackendReels(spinData.reels);
      const finalMultiplier = Number(spinData.multiplier) || 2;
      const finalWin = Number(spinData.winAmount) || 0;

      const elapsed = Date.now() - spinStartTime;
      const remainingTime = Math.max(0, minSpinDuration - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }

      setReels(finalReels);
      setMultiplier(`${finalMultiplier}x`);
      setWinAmount(finalWin);

      if (typeof data.balance === "number") {
        setBalance(data.balance);
      } else if (typeof fetchBalance === "function") {
        await fetchBalance();
      }
    } catch (error) {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      console.error("Fortune Gems spin error:", error);

      setReels(INITIAL_REELS);
      setWinAmount(0);

      const msg = error.name === "AbortError" 
        ? "Server response timed out. Please retry." 
        : error?.message || "Unable to connect to game server.";

      showError("Spin Failed", msg);
    } finally {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      setIsSpinning(false);
    }
  };

  const startAutoSpin = () => {
    if (isSpinning) return;
    setAutoSpin((old) => (old > 0 ? 0 : 10));
  };

  return (
    <main
      className="fg-page"
      style={{
        "--fg-bg-image": `url(${templeBg})`,
      }}
    >
      <div className="fg-background-overlay" />

      <section className="fortune-gems">
        {/* TOP HEADER */}
        <header className="fg-topbar">
          <button
            className="fg-round-btn"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            ←
          </button>

          <div className="fg-brand">
            <div className="fg-brand-gem">◆</div>
            <div className="fg-brand-main">FORTUNE</div>
            <div className="fg-brand-sub">GEMS</div>
          </div>

          <div className="fg-wallet">
            <span>₹{Number(balance || 0).toFixed(2)}</span>
            <small>Balance</small>
            <button type="button" onClick={() => fetchBalance?.()}>
              +
            </button>
          </div>
        </header>

        {/* EX BADGE */}
        <div className="fg-ex-badge">
          <strong>EX</strong>
          <span>↗</span>
        </div>

        {/* GAME MACHINE */}
        <section className="fg-game-wrapper">
          {/* PAYLINE NUMBERS */}
          <div className="fg-payline-numbers">
            <span>4</span>
            <span>2</span>
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>

          {/* REELS */}
          <div className="fg-reel-machine">
            <div className="fg-reels">
              {reels.map((reel, col) => (
                <div
                  className={`fg-reel ${isSpinning ? "is-spinning" : ""}`}
                  key={col}
                >
                  {reel.map((symbol, row) => (
                    <div
                      className={`fg-cell ${row === 1 ? "payline-cell" : ""}`}
                      key={row}
                    >
                      <div className="fg-cell-inner">
                        {renderSymbol(symbol)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* MULTIPLIER */}
            <aside className="fg-multiplier-panel">
              <div className="fg-multiplier-title">
                <span>WIN</span>
                <b>MULTIPLIER</b>
              </div>

              {MULTIPLIERS.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`fg-multiplier ${
                    value === multiplier ? "selected" : ""
                  } ${
                    value === "10x"
                      ? "purple"
                      : value === "5x"
                      ? "blue"
                      : "green"
                  }`}
                  onClick={() => {
                    if (!isSpinning) {
                      setMultiplier(value);
                    }
                  }}
                >
                  {value}
                </button>
              ))}
            </aside>
          </div>

          {/* WIN BAR */}
          <div className="fg-winbar">
            <span>WIN</span>
            <strong>₹{Number(winAmount || 0).toFixed(2)}</strong>
          </div>
        </section>

        {/* BET AREA */}
        <section className="fg-control-panel">
          <div className="fg-bet-heading">BET AMOUNT</div>

          <div className="fg-bet-row">
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => changeBet(Math.max(1, (Number(betAmount) || 1) - 10))}
            >
              −
            </button>

            {/* Editable Input Box */}
            <div className="fg-bet-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
              <span style={{ fontSize: "16px", marginRight: "2px" }}>₹</span>
              <input
                type="number"
                disabled={isSpinning}
                value={betAmount}
                onChange={(e) => changeBet(e.target.value)}
                onBlur={() => {
                  if (!betAmount || Number(betAmount) < 1) setBetAmount(10);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffd700",
                  fontSize: "18px",
                  fontWeight: "bold",
                  width: "90px",
                  textAlign: "center",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => changeBet((Number(betAmount) || 0) + 10)}
            >
              +
            </button>
          </div>

          {/* Quick Amount Select Buttons */}
          <div className="fg-quick">
            {[3, 10, 50, 100].map((amount) => (
              <button
                type="button"
                key={amount}
                disabled={isSpinning}
                className={Number(betAmount) === amount ? "selected" : ""}
                onClick={() => setBetAmount(amount)}
              >
                ₹{amount}
              </button>
            ))}
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <section className="fg-actions">
          <button
            type="button"
            className="fg-action"
            onClick={() => setShowRules(true)}
          >
            <span>⚙</span>
            <small>OPTIONS</small>
          </button>

          <button
            type="button"
            className="fg-action"
            onClick={() => setShowPaytable(true)}
          >
            <span>ⓘ</span>
            <small>PAYTABLE</small>
          </button>

          <button
            type="button"
            className={`fg-spin ${isSpinning ? "loading" : ""}`}
            onClick={spin}
            disabled={isSpinning}
          >
            <span>{isSpinning ? "•••" : "SPIN"}</span>
          </button>

          <button
            type="button"
            className={`fg-action ${turbo ? "active" : ""}`}
            onClick={() => setTurbo((v) => !v)}
          >
            <span>ϟ</span>
            <small>TURBO</small>
          </button>

          <button
            type="button"
            className="fg-action"
            onClick={() => setShowRules(true)}
          >
            <span>?</span>
            <small>HELP</small>
          </button>
        </section>

        {/* AUTO SPIN */}
        <section className="fg-auto">
          <div>
            <b>AUTO SPIN</b>
            <span>
              {autoSpin > 0
                ? `${autoSpin} spins selected`
                : "Select automatic spins"}
            </span>
          </div>

          <button
            type="button"
            disabled={isSpinning}
            onClick={startAutoSpin}
            className={autoSpin > 0 ? "active" : ""}
          >
            {autoSpin > 0 ? "STOP" : "START"}
          </button>
        </section>

        {/* PAYTABLE MODAL */}
        {showPaytable && (
          <div className="fg-modal-bg" onClick={() => setShowPaytable(false)}>
            <div className="fg-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="fg-modal-close"
                onClick={() => setShowPaytable(false)}
              >
                ×
              </button>
              <h2>PAYTABLE</h2>
              <p>Matching symbols on the highlighted centre payline produce a win.</p>
              <div className="fg-paytable-grid">
                <span>🔴 GEM</span>
                <b>36x</b>
                <span>💜 GEM</span>
                <b>27x</b>
                <span>💚 GEM</span>
                <b>21x</b>
                <span>💎 GEM</span>
                <b>18x</b>
                <span>WILD</span>
                <b>50x</b>
                <span>A</span>
                <b>15x</b>
                <span>K</span>
                <b>12x</b>
                <span>Q</span>
                <b>9x</b>
                <span>J</span>
                <b>6x</b>
              </div>
            </div>
          </div>
        )}

        {/* RULES MODAL */}
        {showRules && (
          <div className="fg-modal-bg" onClick={() => setShowRules(false)}>
            <div className="fg-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="fg-modal-close"
                onClick={() => setShowRules(false)}
              >
                ×
              </button>
              <h2>GAME OPTIONS</h2>
              <p>Use the bet controls to select your stake.</p>
              <p>Press SPIN to start the reel animation.</p>
              <p>Turbo changes visual animation speed.</p>
              <p>The game result is generated server-side.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default FortuneGems;