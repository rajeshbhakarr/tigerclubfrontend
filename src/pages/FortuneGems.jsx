import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Swal from "sweetalert2";
import "./fortuneGems.css";

const API = "https://indr-backend-77tp.onrender.com/api";

// Symbols for reels
const SYMBOLS = ["🔷", "💎", "👑", "A", "K", "Q", "J", "🎁"];
const MULTIPLIERS = ["1x", "2x", "5x", "10x", "15x"];

const FortuneGems = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  // Game state
  const [betAmount, setBetAmount] = useState(3);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[3], SYMBOLS[4], SYMBOLS[5]],
    [SYMBOLS[6], SYMBOLS[0], SYMBOLS[1]],
  ]);
  const [multiplier, setMultiplier] = useState("1x");
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState([]);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [turboMode, setTurboMode] = useState(false);

  // Paytable
  const PAYTABLE = {
    "3-gem": 1000,
    "3-wild": 500,
    "3-crown": 300,
    "3-a": 200,
    "3-k": 150,
    "3-q": 100,
    "3-j": 50,
    "2-gem": 10,
  };

  // Check winning combination
  const checkWin = (symbols) => {
    const col1 = symbols[0][1]; // middle row
    const col2 = symbols[1][1];
    const col3 = symbols[2][1];

    if (col1 === col2 && col2 === col3) {
      if (col1 === "🔷") return 1000;
      if (col1 === "💎") return 500;
      if (col1 === "👑") return 300;
      if (col1 === "A") return 200;
      if (col1 === "K") return 150;
      if (col1 === "Q") return 100;
      if (col1 === "J") return 50;
    }

    // 2 in a row
    if (col1 === col2 || col2 === col3) return 10;

    return 0;
  };

  // Spin logic
  const spinReels = async () => {
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

    // Deduct bet from balance (simulate)
    await fetchBalance();

    // Spin animation
    const spinDuration = turboMode ? 500 : 1000;
    const startTime = Date.now();

    const spinInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      setReels([
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
      ]);

      if (elapsed >= spinDuration) {
        clearInterval(spinInterval);
        setIsSpinning(false);

        // Final result
        const finalReels = [
          [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          ],
          [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          ],
          [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          ],
        ];

        setReels(finalReels);

        // Check win
        const baseWin = checkWin(finalReels);
        const multiplierValue =
          parseInt(MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)]) || 1;
        const totalWin = baseWin * multiplierValue;

        setMultiplier(
          MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)]
        );
        setWinAmount(totalWin);

        // Add to history
        const newBet = {
          bet: betAmount,
          win: totalWin,
          multiplier: multiplierValue,
          timestamp: new Date().toLocaleTimeString(),
        };
        setHistory([newBet, ...history.slice(0, 9)]);

        if (totalWin > 0) {
          Swal.fire({
            icon: "success",
            title: "🎉 WIN!",
            html: `<p>You won ₹${totalWin}</p><p>${multiplierValue}x Multiplier</p>`,
            width: "280px",
            timer: 2000,
          });
        }

        // Continue auto-spin
        if (isAutoSpinning && autoSpinCount > 0) {
          setAutoSpinCount(autoSpinCount - 1);
          setTimeout(spinReels, 500);
        }
      }
    }, 50);
  };

  const handleAutoSpin = () => {
    if (autoSpinCount > 0) {
      setIsAutoSpinning(!isAutoSpinning);
      if (!isAutoSpinning) {
        spinReels();
      }
    }
  };

  const toggleTurbo = () => {
    setTurboMode(!turboMode);
  };

  const doubleTurbo = () => {
    setTurboMode(true);
    setTimeout(() => setTurboMode(false), 2000);
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
          {/* TEMPLE BACKGROUND */}
          <div className="fg-background">
            <div className="temple-bg">🏰</div>
          </div>

          {/* REELS */}
          <div className="fg-reels-container">
            {/* Reel 1, 2, 3 */}
            {reels.map((reel, reelIdx) => (
              <div key={reelIdx} className="fg-reel">
                {reel.map((symbol, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`fg-symbol ${
                      isSpinning ? "spinning" : ""
                    } ${rowIdx === 1 ? "active" : ""}`}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
            ))}

            {/* Reel 4 - Special Multiplier Reel */}
            <div className="fg-reel-special">
              <div className="fg-symbol-special">{multiplier}</div>
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

        {/* BET CONTROLS */}
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
          <button
            className="fg-control-btn"
            onClick={toggleTurbo}
            title="Toggle Turbo Spin"
          >
            ⚡ Turbo
          </button>
          <button
            className="fg-control-btn"
            onClick={doubleTurbo}
            title="Super Turbo"
          >
            ⚡⚡
          </button>
          <button
            className="fg-control-btn"
            onClick={() => setShowRules(!showRules)}
          >
            ℹ️ Help
          </button>
          <button
            className="fg-control-btn"
            onClick={() => setShowRules(!showRules)}
          >
            📋 Rules
          </button>
          <button
            className="fg-control-btn"
            onClick={() => setShowRules(!showRules)}
          >
            📂 History
          </button>
        </div>

        {/* SPIN BUTTON */}
        <button
          className={`fg-spin-btn ${isSpinning ? "disabled" : ""}`}
          onClick={spinReels}
          disabled={isSpinning}
        >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </button>

        {/* AUTO SPIN SECTION */}
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
                  4th Reel Multiplier Applied<br />
                  Payouts vary by symbol
                </p>
                <p>
                  <strong>Payouts:</strong>
                  <br />
                  Gems: ₹1000 | Wild: ₹500 | Crown: ₹300<br />
                  A: ₹200 | K: ₹150 | Q: ₹100 | J: ₹50
                </p>
                <p>
                  <strong>Multipliers:</strong>
                  <br />
                  1x, 2x, 5x, 10x, 15x
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