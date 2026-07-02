import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import * as minesApi from "../api/minesApi";
import Swal from "sweetalert2";
import "../styles/mines.css";

const Mines = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  // Game state
  const [gameState, setGameState] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [gameActive, setGameActive] = useState(false);
  const [tilesRevealed, setTilesRevealed] = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [currentPayout, setCurrentPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hitMine, setHitMine] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  // Load game on mount
  useEffect(() => {
    loadGame();
    loadHistory();
  }, []);

  const loadGame = async () => {
    try {
      const state = await minesApi.getGameState();
      setGameState(state);
      setRoundId(state.roundId);
    } catch (err) {
      console.error("Load game error:", err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await minesApi.getMyBets(10);
      setHistory(data.bets);
      setStats(data.stats);
    } catch (err) {
      console.error("Load history error:", err);
    }
  };

  // 💸 Place bet
  const handlePlaceBet = async () => {
    if (!betAmount || betAmount < 10) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Bet",
        text: "Minimum bet is ₹10",
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
      const res = await minesApi.placeBet(betAmount, roundId);
      
      setGameActive(true);
      setGameOver(false);
      setHitMine(false);
      setTilesRevealed([]);
      setCurrentMultiplier(1);
      setCurrentPayout(betAmount);
      await fetchBalance();

      Swal.fire({
        icon: "success",
        title: "Bet Placed!",
        text: "Start revealing tiles!",
        width: "280px",
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.msg || "Failed to place bet",
        width: "280px",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Reveal tile
  const handleRevealTile = async (index) => {
    if (!gameActive || gameOver || tilesRevealed.includes(index)) return;

    try {
      setLoading(true);
      const res = await minesApi.revealTile(roundId, index);

      setTilesRevealed([...tilesRevealed, index]);

      if (res.hitMine) {
        // 💣 HIT MINE!
        setHitMine(true);
        setGameOver(true);
        setGameActive(false);

        Swal.fire({
          icon: "error",
          title: "💣 Mine Hit!",
          html: `<p>You revealed <b>${res.tilesRevealed}</b> tiles</p><p>You lost ₹${betAmount}</p>`,
          width: "280px",
        });

        await loadHistory();
        await fetchBalance();
      } else {
        // ✅ SAFE!
        setCurrentMultiplier(res.multiplier);
        setCurrentPayout(res.payout);

        // Check if user wants to continue
        const tilerRemaining = 25 - res.tilesRevealed - gameState.mineCount;
        
        if (tilerRemaining <= 0) {
          // No more safe tiles!
          setGameOver(true);
          setGameActive(false);
          Swal.fire({
            icon: "warning",
            title: "No Safe Tiles!",
            text: "Cash out now!",
            width: "280px",
          });
        }
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.msg || "Reveal failed",
        width: "280px",
      });
    } finally {
      setLoading(false);
    }
  };

  // 💰 Cashout
  const handleCashout = async () => {
    if (!gameActive) return;

    try {
      setLoading(true);
      const res = await minesApi.cashoutBet(roundId);

      setGameActive(false);
      setGameOver(true);

      Swal.fire({
        icon: "success",
        title: "🎉 Cashed Out!",
        html: `<p>You won <b>₹${res.payout}</b></p><p>Profit: <b style="color:#10b981">₹${res.profit}</b></p>`,
        width: "280px",
      });

      await loadHistory();
      await fetchBalance();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.msg || "Cashout failed",
        width: "280px",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset for new game
  const handleNewGame = () => {
    setGameActive(false);
    setGameOver(false);
    setHitMine(false);
    setTilesRevealed([]);
    setCurrentMultiplier(1);
    setCurrentPayout(betAmount);
    loadGame();
  };

  if (!gameState) return <div className="mines-loading">Loading...</div>;

  return (
    <div className="mines-container">
      {/* HEADER */}
      <div className="mines-header">
        <div className="header-left">
          <span onClick={() => navigate(-1)} className="back-btn">‹</span>
          <h1>💣 MINES</h1>
        </div>
        <div className="header-right">
          <div className="balance-display">₹{balance.toFixed(2)}</div>
        </div>
      </div>

      {/* MAIN GAME AREA */}
      <div className="mines-game">
        {/* BOARD */}
        <div className="mines-board">
          {Array(25)
            .fill(0)
            .map((_, idx) => (
              <div
                key={idx}
                className={`mine-tile ${
                  tilesRevealed.includes(idx) ? "revealed" : "locked"
                } ${hitMine && tilesRevealed.includes(idx) ? "hit" : ""}`}
                onClick={() => handleRevealTile(idx)}
                disabled={loading || !gameActive || tilesRevealed.includes(idx)}
              >
                {tilesRevealed.includes(idx) && !hitMine && "✅"}
                {tilesRevealed.includes(idx) && hitMine && "💣"}
              </div>
            ))}
        </div>

        {/* STATS PANEL */}
        <div className="stats-panel">
          <div className="stat-box">
            <div className="stat-label">Tiles Revealed</div>
            <div className="stat-value">{tilesRevealed.length}</div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Multiplier</div>
            <div className="stat-value highlight">{currentMultiplier.toFixed(2)}x</div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Current Payout</div>
            <div className="stat-value gold">₹{currentPayout.toFixed(2)}</div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Bet Amount</div>
            <div className="stat-value">₹{betAmount}</div>
          </div>
        </div>
      </div>

      {/* BET SECTION */}
      <div className="bet-section">
        <div className="bet-input-group">
          <label>Bet Amount</label>
          <div className="input-wrapper">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min="10"
              max="5000"
              disabled={gameActive}
              className="bet-input"
            />
            <span className="currency">₹</span>
          </div>
        </div>

        <div className="quick-bet-buttons">
          {[50, 100, 200, 500].map((amount) => (
            <button
              key={amount}
              className="quick-bet-btn"
              onClick={() => setBetAmount(amount)}
              disabled={gameActive}
            >
              ₹{amount}
            </button>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="action-buttons">
        {!gameActive && !gameOver && (
          <button
            className="btn btn-primary"
            onClick={handlePlaceBet}
            disabled={loading}
          >
            {loading ? "Placing..." : "🎮 PLAY"}
          </button>
        )}

        {gameActive && (
          <>
            <button
              className="btn btn-cashout"
              onClick={handleCashout}
              disabled={loading}
            >
              💰 CASHOUT (₹{currentPayout.toFixed(2)})
            </button>
          </>
        )}

        {gameOver && (
          <button className="btn btn-primary" onClick={handleNewGame}>
            🔄 NEW GAME
          </button>
        )}
      </div>

      {/* HISTORY */}
      <div className="history-section">
        <h3>📋 Recent Bets</h3>
        
        {stats && (
          <div className="stats-summary">
            <span>Bets: {stats.totalBets}</span>
            <span>Win Rate: {stats.winRate}</span>
            <span>Profit: ₹{stats.totalProfit.toFixed(2)}</span>
          </div>
        )}

        <div className="history-list">
          {history.map((bet, idx) => (
            <div key={idx} className={`history-item ${bet.status}`}>
              <div className="item-left">
                <div className="item-amount">₹{bet.amount}</div>
                <div className="item-tiles">{bet.tilesRevealed} tiles</div>
              </div>
              <div className="item-middle">
                <div className="item-multiplier">{bet.multiplier.toFixed(2)}x</div>
              </div>
              <div className="item-right">
                <div className="item-payout">₹{bet.payout.toFixed(2)}</div>
                <div className={`item-status ${bet.status}`}>
                  {bet.status === "win" ? "✅ WIN" : "❌ LOSS"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Mines;