import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dragontiger.css";
import { useWallet } from "../context/WalletContext";
import axios from "axios";

const API = "https://indr-backend-production.up.railway.appproduction.up.railway.app/api";

function parseCard(cardStr) {
  if (!cardStr) return null;
  const suitMap = { "♠": { red: false }, "♣": { red: false }, "♥": { red: true }, "♦": { red: true } };
  const suit = Object.keys(suitMap).find(s => cardStr.includes(s));
  const rank = suit ? cardStr.replace(suit, "") : cardStr;
  return { rank, suit, red: suit ? suitMap[suit]?.red : false };
}

function PlayingCard({ cardStr, show, winnerClass }) {
  const card = parseCard(cardStr);
  return (
    <div className={"dt-card-outer " + winnerClass}>
      <div className={"dt-card-inner " + (show ? "dt-card-flipped" : "")}>
        <div className="dt-card-backside">
          <div className="dt-card-back-icon">👑</div>
        </div>
        <div className={"dt-card-frontside " + (card?.red ? "dt-suit-red" : "dt-suit-black")}>
          {card ? (
            <>
              <div className="dt-rank-corner"><span>{card.rank}</span><span>{card.suit}</span></div>
              <span className="dt-center-suit">{card.suit}</span>
              <div className="dt-rank-corner-bottom"><span>{card.rank}</span><span>{card.suit}</span></div>
            </>
          ) : (
            <span style={{ fontSize: 28 }}>🂠</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Dragontiger() {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [timer, setTimer] = useState(30);
  const [roundId, setRoundId] = useState("");
  const [bettingLocked, setBettingLocked] = useState(false);
  const [history, setHistory] = useState([]);
  const [dragonCard, setDragonCard] = useState(null);
  const [tigerCard, setTigerCard] = useState(null);
  const [showDragon, setShowDragon] = useState(false);  // dragon flip
  const [showTiger, setShowTiger] = useState(false);    // tiger flip
  const [lastResult, setLastResult] = useState(null);
  const [bets, setBets] = useState({ dragon: [], tiger: [], tie: [] });
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [bet, setBet] = useState(0);
  const [lastBet, setLastBet] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState("");

  const coins = [10, 50, 100, 500, 1000, 5000, 10000];
  const prevRoundRef = useRef("");
  const animationDoneRef = useRef(false);
  const lastResultIdRef = useRef("");  // last seen result roundId track karo
  const isFirstLoadRef = useRef(true); // page load ka pehla call ignore karo
  const flipTimersRef = useRef([]);

  const clearFlipTimers = () => {
    flipTimersRef.current.forEach(t => clearTimeout(t));
    flipTimersRef.current = [];
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(API + "/dragon-tiger/state");
        const data = res.data;
        setTimer(data.timer);
        setRoundId(data.roundId);
        setHistory(data.history || []);
        if (data.timer <= 5) setBettingLocked(true);

        const latest = data.history?.[0];

        // Pehle call par — sirf lastResultIdRef set karo, animation mat chalaao
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false;
          prevRoundRef.current = data.roundId;
          // Agar result pehle se hai toh uska id note kar lo
          if (latest?.roundId) lastResultIdRef.current = latest.roundId;
          else if (data.lastResult) lastResultIdRef.current = data.roundId;
          animationDoneRef.current = true; // pehle se existing result pe animation nahi
          return;
        }

        // Naya round detect
        if (data.roundId !== prevRoundRef.current && prevRoundRef.current !== "") {
          clearFlipTimers();
          animationDoneRef.current = false;
          lastResultIdRef.current = "";
          setBets({ dragon: [], tiger: [], tie: [] });
          setBet(0); setSelectedCoin(null);
          setBettingLocked(false);
          setShowDragon(false); setShowTiger(false);
          setDragonCard(null); setTigerCard(null);
          setLastResult(null); setMessage("");
        }
        prevRoundRef.current = data.roundId;

        // Naya result aaya — aur pehle se ye result nahi chala
        const currentResultId = latest?.roundId || (data.lastResult ? data.roundId : "");
        if (
          data.lastResult &&
          latest?.dragonCard &&
          latest?.tigerCard &&
          !animationDoneRef.current &&
          currentResultId !== lastResultIdRef.current
        ) {
          animationDoneRef.current = true;
          lastResultIdRef.current = currentResultId;
          clearFlipTimers();

          setDragonCard(latest.dragonCard);
          setTigerCard(latest.tigerCard);
          setShowDragon(false);
          setShowTiger(false);
          setLastResult(null);

          const t1 = setTimeout(() => setShowDragon(true), 400);
          const t2 = setTimeout(() => setShowTiger(true), 1800);
          const t3 = setTimeout(() => {
            setLastResult(latest.result);
            fetchBalance();
          }, 3000);
          const t4 = setTimeout(() => {
            setShowDragon(false);
            setShowTiger(false);
            setLastResult(null);
          }, 9000);

          flipTimersRef.current = [t1, t2, t3, t4];
        }
      } catch (err) { console.log("State fetch error:", err.message); }
    }, 1000);
    return () => { clearInterval(interval); clearFlipTimers(); };
  }, []);

  const fmt = (c) => c >= 1000 ? c / 1000 + "K" : c;

  const handleCoinClick = (coin) => { if (bettingLocked) return; setSelectedCoin(coin); setBet(coin); setLastBet(coin); };
  const handleClear = () => { setBet(0); setSelectedCoin(null); setBets({ dragon: [], tiger: [], tie: [] }); };
  const handleBack = () => { setBet(p => Math.max(0, p - lastBet)); };
  const handleRebet = () => { if (bettingLocked) return; setBet(p => p + lastBet); };

  const placeBet = (type) => {
    if (!selectedCoin) { setMessage("⚠️ Pehle coin select karo!"); return; }
    if (bettingLocked) { setMessage("🔒 Betting band ho gayi!"); return; }
    setBets(prev => ({ ...prev, [type]: [...prev[type], selectedCoin] }));
    submitBet(type, bet);
  };

  const submitBet = async (betOn, amount) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(API + "/dragon-tiger/place-bet", { betOn, amount }, { headers: { Authorization: "Bearer " + token } });
      if (res.data.success) { setMessage("✅ ₹" + amount + " bet lagi on " + betOn.toUpperCase() + "!"); fetchBalance(); }
      else { setMessage("❌ " + res.data.message); }
    } catch (err) { setMessage("❌ " + (err.response?.data?.message || "Bet failed!")); }
  };

  const resultLabels = { dragon: "🐉 DRAGON WIN!", tiger: "🐯 TIGER WIN!", tie: "🤝 TIE!" };
  const resultClass = { dragon: "dt-result-win-dragon", tiger: "dt-result-win-tiger", tie: "dt-result-win-tie" };

  return (
    <div className="dt-page-container">
      <div className="dt-main-wrapper">
        <div className="dt-inner-container">

          {/* HEADER */}
          <div className="dt-header-bar">
            <div className="dt-back-button" onClick={() => navigate("/")}>←</div>
            <p className="dt-title-text">DRAGON TIGER</p>
            <div className="dt-balance-amount">
              ₹{balance !== undefined ? balance.toFixed(2) : "0.00"}
            </div>
          </div>

          {/* ROUND + TIMER */}
          <div className="dt-round-panel">
            <p className="dt-round-number">ROUND: {roundId || "Loading..."}</p>
            <div className={"dt-timer-clock" + (timer <= 5 ? " dt-time-critical" : "")}>{timer}</div>
          </div>

          {bettingLocked && <div className="dt-closed-banner">🔒 BETTING CLOSED</div>}
          {message && <div className="dt-alert-msg">{message}</div>}

          <hr className="dt-divider" />

          {/* HISTORY ROW */}
          <div className="dt-history-row-wrapper">
            <div className="dt-history-circle-list">
              {history.slice(0, 20).map((item, i) => (
                <div key={i} className={"dt-history-circle " + item.result}>
                  {item.result === "dragon" ? "D" : item.result === "tiger" ? "T" : "Tie"}
                </div>
              ))}
            </div>
            <div className="dt-history-modal-btn" onClick={() => setShowHistory(true)}>📊</div>
          </div>

          {/* GAME TABLE */}
          <div className="dt-game-arena">
            <div className="dt-table-background">
              <div className="dt-table-felt" />
              <div className="dt-cards-row">
                <div className="dt-card-slot">
                  <p className="dt-side-label">Dragon</p>
                  <PlayingCard
                    cardStr={dragonCard}
                    show={showDragon}
                    winnerClass={showDragon && lastResult === "dragon" ? "dt-winner-dragon-glow" : ""}
                  />
                </div>
                <div className="dt-versus-divider">VS</div>
                <div className="dt-card-slot">
                  <p className="dt-side-label">Tiger</p>
                  <PlayingCard
                    cardStr={tigerCard}
                    show={showTiger}
                    winnerClass={showTiger && lastResult === "tiger" ? "dt-winner-tiger-glow" : ""}
                  />
                </div>
              </div>
            </div>

            {showDragon && showTiger && lastResult && (
              <div className={"dt-result-announce " + resultClass[lastResult]}>
                {resultLabels[lastResult]}
              </div>
            )}
          </div>

          {/* BET BOXES */}
          <div className="dt-betting-panel">
            <div className="dt-betting-row">
              <div
                className={"dt-bet-option" + (bets.dragon.length > 0 ? " dt-active-bet-dragon" : "")}
                onClick={() => placeBet("dragon")}
              >
                <span>DRAGON</span>
                <div className="dt-odds-value">1:1</div>
                <div className="dt-scatter-coins">
                  {bets.dragon.map((c, i) => (
                    <div key={i} className="dt-scatter-coin" style={{
                      left: (15 + (i * 23 + i * 7) % 55) + "%",
                      top: (20 + (i * 17 + i * 11) % 50) + "%",
                      transform: `rotate(${(i * 37) % 30 - 15}deg)`,
                      zIndex: i
                    }}>₹{fmt(c)}</div>
                  ))}
                </div>
              </div>
              <div
                className={"dt-bet-option" + (bets.tiger.length > 0 ? " dt-active-bet-tiger" : "")}
                onClick={() => placeBet("tiger")}
              >
                <span>TIGER</span>
                <div className="dt-odds-value">1:1</div>
                <div className="dt-scatter-coins">
                  {bets.tiger.map((c, i) => (
                    <div key={i} className="dt-scatter-coin" style={{
                      left: (15 + (i * 23 + i * 7) % 55) + "%",
                      top: (20 + (i * 17 + i * 11) % 50) + "%",
                      transform: `rotate(${(i * 37) % 30 - 15}deg)`,
                      zIndex: i
                    }}>₹{fmt(c)}</div>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={"dt-bet-option-tie" + (bets.tie.length > 0 ? " dt-active-bet-tie" : "")}
              onClick={() => placeBet("tie")}
            >
              <span>TIE</span>
              <div className="dt-odds-tie">1:8</div>
              <div className="dt-scatter-coins">
                {bets.tie.map((c, i) => (
                  <div key={i} className="dt-scatter-coin" style={{
                    left: (10 + (i * 23 + i * 7) % 70) + "%",
                    top: (15 + (i * 17 + i * 11) % 55) + "%",
                    transform: `rotate(${(i * 37) % 30 - 15}deg)`,
                    zIndex: i
                  }}>₹{fmt(c)}</div>
                ))}
              </div>
            </div>
          </div>

          {/* COINS */}
          <div className="dt-coin-controls-area">
            {selectedCoin && <div className="dt-selected-chip">₹{fmt(selectedCoin)} Selected</div>}
            <div className="dt-chips-list">
              {coins.map(coin => (
                <div
                  key={coin}
                  className={"dt-chip-value" + (selectedCoin === coin ? " dt-chip-selected" : "")}
                  onClick={() => handleCoinClick(coin)}
                >
                  ₹{fmt(coin)}
                </div>
              ))}
            </div>
            <div className="dt-total-bet-display">BET: ₹{bet.toLocaleString()}</div>
            <div className="dt-action-buttons">
              <button onClick={handleClear}>CLEAR</button>
              <button onClick={handleBack}>BACK</button>
              <button className="dt-rebet-btn" onClick={handleRebet}>REBET</button>
            </div>
          </div>

        </div>

        {/* HISTORY POPUP */}
        {showHistory && (
          <div className="dt-history-overlay" onClick={() => setShowHistory(false)}>
            <div className="dt-history-modal" onClick={e => e.stopPropagation()}>
              <h3>Last Results</h3>
              <div className="dt-history-modal-list">
                {history.map((item, i) => (
                  <div key={i} className={"dt-history-circle " + item.result}>
                    {item.result === "dragon" ? "D" : item.result === "tiger" ? "T" : "Tie"}
                  </div>
                ))}
              </div>
              <button className="dt-modal-close-btn" onClick={() => setShowHistory(false)}>CLOSE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dragontiger;