import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Swal from "sweetalert2";
import "./fortuneGems.css";

// 🔥 ADD THIS IMPORT
import * as fortuneGemsApi from "../api/fortuneGemsApi";

const API = "https://indr-backend-77tp.onrender.com/api";

const SYMBOLS = [
  "RED_GEM",
  "PURPLE_GEM",
  "GREEN_GEM",
  "BLUE_GEM",
  "WILD",
  "J",
  "Q",
];

const PAYTABLE = {
  RED_GEM: 3,
  PURPLE_GEM: 2.5,
  GREEN_GEM: 2,
  BLUE_GEM: 1.5,
  WILD: 5,
  J: 1,
  Q: 1,
};

const MULTIPLIERS = [1, 1, 1, 2, 2];

const FortuneGems = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [reels, setReels] = useState([
    ["RED_GEM", "PURPLE_GEM", "GREEN_GEM"],
    ["BLUE_GEM", "WILD", "J"],
    ["Q", "RED_GEM", "PURPLE_GEM"],
  ]);
  const [betAmount, setBetAmount] = useState(3);
  const [winAmount, setWinAmount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [history, setHistory] = useState([]);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [turboMode, setTurboMode] = useState(false);

  // Random item from array
  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Generate losing reels
  function generateLosingReels() {
    const allSymbols = ["RED_GEM", "PURPLE_GEM", "GREEN_GEM", "BLUE_GEM", "J", "Q"];
    const reels = [];
    for (let row = 0; row < 3; row++) {
      const rowArr = [];
      for (let col = 0; col < 3; col++) {
        if (row === 1) {
          const remaining = allSymbols.filter(s => !rowArr.includes(s));
          rowArr.push(remaining[Math.floor(Math.random() * remaining.length)]);
        } else {
          rowArr.push(allSymbols[Math.floor(Math.random() * allSymbols.length)]);
        }
      }
      reels.push(rowArr);
    }
    return reels;
  }

  // Generate reels
  function generateReels() {
    const newReels = [];
    for (let row = 0; row < 3; row++) {
      const currentRow = [];
      for (let col = 0; col < 3; col++) {
        currentRow.push(randomItem(SYMBOLS));
      }
      newReels.push(currentRow);
    }
    return newReels;
  }

  // Get lines
  function getLines(reels) {
    return [[reels[1][0], reels[1][1], reels[1][2]]];
  }

  // Calculate win
  function calculateWin(reels, betAmount) {
    const lines = getLines(reels);
    let totalMultiplier = 0;

    for (const line of lines) {
      const first = line[0];
      const same = line.every(
        (symbol) => symbol === first || symbol === "WILD" || first === "WILD"
      );

      if (!same) continue;

      const normalSymbols = line.filter((s) => s !== "WILD");

      if (normalSymbols.length === 0) {
        totalMultiplier += PAYTABLE.WILD;
        continue;
      }

      const symbol = normalSymbols[0];

      if (PAYTABLE[symbol]) {
        totalMultiplier += PAYTABLE[symbol];
      }
    }

    if (totalMultiplier <= 0) {
      return {
        result: "LOSS",
        multiplier: 0,
        winAmount: 0,
      };
    }

    const bonusMultiplier = randomItem(MULTIPLIERS);
    const finalMultiplier = totalMultiplier * bonusMultiplier;
    const winAmount = Number((betAmount * finalMultiplier).toFixed(2));

    return {
      result: "WIN",
      multiplier: finalMultiplier,
      winAmount,
    };
  }

  // Main spin function
  const spinGame = async () => {
    if (balance < betAmount) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `You have ₹${balance.toFixed(2)}`,
        width: "280px",
      });
      return;
    }

    setIsSpinning(true);
    setWinAmount(0);

    // 🔥 STEP 1: DEDUCT BET FROM WALLET
    try {
      const betResponse = await fortuneGemsApi.placeBet(betAmount);
      console.log("✅ Bet placed:", betResponse);
      await fetchBalance();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Bet Failed",
        text: err.response?.data?.msg || "Could not place bet",
        width: "280px",
      });
      console.error("❌ Bet error:", err);
      setIsSpinning(false);
      return;
    }

    // Spin animation
    const spinDuration = turboMode ? 500 : 1000;
    const startTime = Date.now();

    const spinInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      setReels([generateReels(), generateReels(), generateReels()]);

      if (elapsed >= spinDuration) {
        clearInterval(spinInterval);

        // Final reels
        let finalReels;
        if (Math.random() < 0.20) {
          finalReels = [generateLosingReels(), generateLosingReels(), generateLosingReels()];
        } else {
          finalReels = [generateReels(), generateReels(), generateReels()];
        }

        setReels(finalReels);

        // Calculate result
        const result = calculateWin(finalReels[0], betAmount);
        setMultiplier(result.multiplier);
        setWinAmount(result.winAmount);

        // Add to history
        const newBet = {
          bet: betAmount,
          win: result.winAmount,
          multiplier: result.multiplier,
          timestamp: new Date().toLocaleTimeString(),
        };
        setHistory([newBet, ...history.slice(0, 9)]);

        if (result.result === "WIN") {
          // 🔥 STEP 2: SAVE WIN + ADD TO WALLET
          try {
            const roundId = Date.now().toString();
            const spinResponse = await fortuneGemsApi.spinReels(roundId, finalReels[0], result.winAmount);
            console.log("✅ Win saved:", spinResponse);
            await fetchBalance();
          } catch (err) {
            console.error("❌ Win save error:", err);
          }

          Swal.fire({
            icon: "success",
            title: "🎉 WIN!",
            html: `<p>You won ₹${result.winAmount}</p><p>${result.multiplier}x Multiplier</p>`,
            width: "280px",
            timer: 2000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "❌ Loss",
            text: "Better luck next time!",
            width: "280px",
            timer: 1500,
          });
        }

        setIsSpinning(false);

        // Auto spin continue
        if (isAutoSpinning && autoSpinCount > 0) {
          setAutoSpinCount(autoSpinCount - 1);
          setTimeout(spinGame, 500);
        }
      }
    }, 50);
  };

  const handleAutoSpin = () => {
    if (autoSpinCount > 0) {
      setIsAutoSpinning(!isAutoSpinning);
      if (!isAutoSpinning) {
        spinGame();
      }
    }
  };

  return (
    <div className="fortune-gems-wrapper">
      <div className="fortune-gems-container">
        {/* HEADER */}
        <div className="fg-header">
          <span className="fg-back" onClick={() => navigate(-1)}>‹</span>
          <h1>Fortune Gems</h1>
          <span className="fg-welcome">Welcome</span>
        </div>

        {/* GAME AREA */}
        <div className="fg-game-area">
          <div className="fg-background">
            <div className="temple-bg">🏰</div>
          </div>

          {/* REELS */}
          <div className="fg-reels-container">
            {reels.map((reel, reelIdx) => (
              <div key={reelIdx} className="fg-reel">
                {reel.map((symbol, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`fg-symbol ${isSpinning ? "spinning" : ""} ${
                      rowIdx === 1 ? "active" : ""
                    }`}
                  >
                    {symbol === "RED_GEM" && "🔴"}
                    {symbol === "PURPLE_GEM" && "🟣"}
                    {symbol === "GREEN_GEM" && "🟢"}
                    {symbol === "BLUE_GEM" && "🔵"}
                    {symbol === "WILD" && "👑"}
                    {symbol === "J" && "J"}
                    {symbol === "Q" && "Q"}
                  </div>
                ))}
              </div>
            ))}

            {/* 4th Reel - Multiplier */}
            <div className="fg-reel-special">
              <div className="fg-symbol-special">{multiplier}x</div>
            </div>
          </div>

          {/* WIN DISPLAY */}
          <div className="fg-win-display">
            <span className="fg-win-label">WIN</span>
            <span className="fg-win-amount">₹{winAmount.toFixed(2)}</span>
          </div>

          {/* BALANCE */}
          <div className="fg-balance">Balance: ₹{balance.toFixed(2)}</div>
        </div>

        {/* BET SECTION */}
        <div className="fg-bet-section">
          <div className="fg-bet-label">Bet Amount</div>
          <div className="fg-bet-controls">
            <button
              className="fg-bet-btn"
              onClick={() => setBetAmount(Math.max(1, betAmount - 1))}
            >
              −
            </button>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
              className="fg-bet-input"
              min="1"
              max="1000"
            />
            <button
              className="fg-bet-btn"
              onClick={() => setBetAmount(betAmount + 1)}
            >
              +
            </button>
          </div>

          <div className="fg-quick-bets">
            {[3, 10, 50, 100].map((amt) => (
              <button
                key={amt}
                className="fg-quick-btn"
                onClick={() => setBetAmount(amt)}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="fg-controls">
          <button className="fg-control-btn" onClick={() => setTurboMode(!turboMode)}>
            ⚡
          </button>
          <button className="fg-control-btn">⚡⚡</button>
          <button className="fg-control-btn" onClick={() => setShowRules(!showRules)}>
            ℹ️
          </button>
          <button className="fg-control-btn">📋</button>
          <button className="fg-control-btn">📂</button>
        </div>

        {/* SPIN BUTTON */}
        <button
          className={`fg-spin-btn ${isSpinning ? "disabled" : ""}`}
          onClick={spinGame}
          disabled={isSpinning}
        >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </button>

        {/* AUTO SPIN */}
        <div className="fg-autospin-section">
          <div className="fg-autospin-input">
            <label>Auto Spin</label>
            <input
              type="number"
              value={autoSpinCount}
              onChange={(e) => setAutoSpinCount(Math.max(0, Number(e.target.value)))}
              min="0"
              max="100"
              className="fg-autospin-input-field"
            />
          </div>
          <button
            className={`fg-autospin-btn ${isAutoSpinning ? "active" : ""}`}
            onClick={handleAutoSpin}
          >
            {isAutoSpinning ? "STOP" : "START"}
          </button>
        </div>

        {/* HISTORY */}
        <div className="fg-history-section">
          <h3>Recent Spins</h3>
          <div className="fg-history-list">
            {history.map((bet, idx) => (
              <div key={idx} className="fg-history-item">
                <span>₹{bet.bet}</span>
                <span className={bet.win > 0 ? "win" : ""}>
                  {bet.win > 0 ? `+₹${bet.win}` : "Loss"}
                </span>
                <span className="multiplier">{bet.multiplier}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* RULES MODAL */}
        {showRules && (
          <div className="fg-modal-overlay" onClick={() => setShowRules(false)}>
            <div className="fg-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="fg-modal-close"
                onClick={() => setShowRules(false)}
              >
                ✕
              </button>
              <h2>Game Rules</h2>
              <div className="fg-rules-content">
                <p>
                  <strong>Win Combinations:</strong>
                  <br />
                  3 Matching Symbols = Win<br />
                  4th Reel Multiplier Applied
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FortuneGems;