import "../styles/wingo.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import GameHistory, { MyHistory } from "./gamehistory";
import GameHistory1Min from "./gamehistory1min";
import { useNavigate } from "react-router-dom";
import { placeBet, getMyBets } from "../api/wingoApi";
import { useWallet } from "../context/WalletContext";

const ROUND_DURATION_30 = 30;
const ROUND_DURATION_1MIN = 60;

const WINGO_API = `${API_URL}/api/wingo`;
const WINGO_1MIN_API = `${API_URL}/api/wingo-1min`;
const API_URL = "https://tigerclubbackend.onrender.com";

const WinGo = () => {
  const { balance, setBalance, fetchBalance } = useWallet();
  const navigate = useNavigate();

const gameApi =
  gameMode === "1min"
    ? WINGO_1MIN_API
    : WINGO_API;

const [period, setPeriod] = useState("Loading...");
  const [locked, setLocked] = useState(false);
  const [history, setHistory] = useState([]);

  const timerRef = useRef(ROUND_DURATION);
  const clientIntervalRef = useRef(null);
  const lastPeriodRef = useRef(null);

  // ── Win/Loss popup state
  const [popup, setPopup] = useState(null); // null | "win" | "loss"
  const [winAmount, setWinAmount] = useState(0);
  const [resultNumber, setResultNumber] = useState(null);
  const [resultColor, setResultColor] = useState("");
  const [resultSize, setResultSize] = useState("");
  const popupTimerRef = useRef(null);

  // ── Track pending bet so we know what we bet on
  const pendingBetRef = useRef(null); // { betValue, betType, amount }
  // ── Track balance before bet placed
  const balanceBeforeBetRef = useRef(null);
  // ── Flag: result is pending (round just ended, wait for balance update)
  const lastBalanceRef = useRef(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  const totalAmount = amount * multiplier * quantity;

  // Tab
  const [activeTab, setActiveTab] = useState("game");
  const [gameMode, setGameMode] = useState("30sec");
  const [myBets, setMyBets] = useState([]);

  // ── Close popup (manual + auto)
  const closePopup = useCallback(() => {
    clearTimeout(popupTimerRef.current);
    setPopup(null);
  }, []);

  // ── Show popup with auto-close after 3s
  const showPopup = useCallback((type, data = {}) => {
    clearTimeout(popupTimerRef.current);
    if (data.winAmount !== undefined) setWinAmount(data.winAmount);
    if (data.number !== undefined) setResultNumber(data.number);
    if (data.color !== undefined) setResultColor(data.color);
    if (data.size !== undefined) setResultSize(data.size);
    setPopup(type);
    popupTimerRef.current = setTimeout(() => setPopup(null), 3000);
  }, []);

  // ── Client-side countdown
 const startClientCountdown = useCallback((startTime) => {
  if (clientIntervalRef.current) {
    clearInterval(clientIntervalRef.current);
  }

  clientIntervalRef.current = setInterval(() => {
    const elapsed = Math.floor(
      (Date.now() - startTime) / 1000
    );

    const duration = gameMode === "1min" ? 60 : 30;

    const remaining = Math.max(
      0,
      duration - elapsed
    );

    timerRef.current = remaining;
    setTimer(remaining);
    setLocked(remaining <= 5);
  }, 100);
}, [gameMode]);

  // ── Server sync
  useEffect(() => {
    let roundStartClientTime = null;

    const syncWithServer = async () => {
      try {
        const fetchStart = Date.now();
        const res = await fetch(WINGO_1MIN_API); 
        const data = await res.json();

        const fetchEnd = Date.now();
        const networkDelay = Math.floor((fetchEnd - fetchStart) / 2);

        const isNewRound = data.period !== lastPeriodRef.current;

        if (isNewRound) {
          // ── New round detected
          const prevPeriod = lastPeriodRef.current;
          lastPeriodRef.current = data.period;
          setPeriod(data.period);
          setHistory(data.history || []);

          // If we had a bet pending — fresh balance fetch karo server se
          if (prevPeriod && pendingBetRef.current) {
            const lastRound = data.history?.[0];
            const { number, color, size } = lastRound || {};
            const prevBal = balanceBeforeBetRef.current ?? 0;
            pendingBetRef.current = null;
            balanceBeforeBetRef.current = null;

            // 1.8s wait — server settle kare pehle
            setTimeout(async () => {
              try {
                // My bets API se latest settled bet check karo
                const res = await fetch(`${API_URL}/api/wingo/my-bets`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                const resData = await res.json();
                const bets = resData.bets || [];

                // Sabse latest bet dekho
                const latestBet = bets[0];

                if (latestBet && latestBet.result === "win") {
                  // Win confirm — payout se profit nikalo
                  const profit = parseFloat((latestBet.payout - latestBet.amount).toFixed(2));
                  const winAmt = latestBet.payout;
                  showPopup("win", {
                    winAmount: winAmt,
                    number: number ?? null,
                    color: color || "",
                    size: size || "",
                  });
                }
                // Loss = koi popup nahi

                // Balance refresh karo
                if (fetchBalance) fetchBalance();

              } catch (e) {
                if (fetchBalance) fetchBalance();
              }
            }, 1800);
          }

const duration = gameMode === "1min" ? 60 : 30;
const serverElapsed = duration - data.time;          roundStartClientTime = Date.now() - (serverElapsed * 1000) - networkDelay;
          startClientCountdown(roundStartClientTime);

        } else {
          // Same round — drift correction
          const clientElapsed = roundStartClientTime
            ? Math.floor((Date.now() - roundStartClientTime) / 1000) : 0;
const duration = gameMode === "1min" ? 60 : 30;
const serverElapsed = duration - data.time;          const drift = Math.abs(clientElapsed - serverElapsed);
          if (drift > 1) {
            roundStartClientTime = Date.now() - (serverElapsed * 1000) - networkDelay;
            startClientCountdown(roundStartClientTime);
          }
          setHistory(data.history || []);
        }

        setLocked(data.locked);
      } catch (err) {
        console.log("WinGo sync error:", err);
      }
    };

    syncWithServer();
    const syncInterval = setInterval(syncWithServer, 3000);
    return () => {
      clearInterval(syncInterval);
      if (clientIntervalRef.current) clearInterval(clientIntervalRef.current);
    };
}, [startClientCountdown, showPopup, gameMode]);
  // ── Track balance changes for result detection
  useEffect(() => {
    lastBalanceRef.current = balance;
  }, [balance]);

  // ── My bets
  useEffect(() => {
  if (activeTab !== "my") return;

  const loadMyBets = async () => {
    try {
      if (gameMode === "1min") {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${WINGO_1MIN_API}/my-bets`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setMyBets(data.bets || []);
      } else {
        const data = await getMyBets();
        setMyBets(data.bets || []);
      }
    } catch (err) {
      console.log("My bets error:", err);
    }
  };

  loadMyBets();
}, [activeTab, gameMode]);

  // ── Place bet
  const placeBetHandler = async () => {
    if (locked) { alert("Betting is locked! Wait for next round."); return; }
    try {
      const betType =
        selected === "Big" || selected === "Small" ? "bigSmall"
          : isNaN(selected) ? "color"
            : "number";

      const data = { betType, betValue: selected, amount: totalAmount };
      setShowModal(false);

      // Save pre-bet balance and bet info
      balanceBeforeBetRef.current = balance;
      pendingBetRef.current = { betType, betValue: selected, totalAmount };

let res;

if (gameMode === "1min") {
  const token = localStorage.getItem("token");

  const response = await fetch(`${WINGO_1MIN_API}/bet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  res = await response.json();
} else {
  res = await placeBet(data);
}      if (res?.success) {
        setBalance(res.balance);
        lastBalanceRef.current = res.balance;
      } else {
        // Bet failed — clear pending
        pendingBetRef.current = null;
        balanceBeforeBetRef.current = null;
        alert(res?.message || "Bet failed");
      }
    } catch (err) {
      pendingBetRef.current = null;
      balanceBeforeBetRef.current = null;
      console.log("Bet error:", err);
    }
  };

  const openModal = (val) => {
    if (locked) { alert("Betting is locked for this round!"); return; }
    setSelected(val);
    setShowModal(true);
  };

  const timerTens = Math.floor(timer / 10);
  const timerOnes = timer % 10;

  // ── Color class for result tag
  const colorClass = (c) => {
    if (!c) return "";
    const l = c.toLowerCase();
    if (l === "green") return "tag-green";
    if (l === "red") return "tag-red";
    if (l === "violet") return "tag-violet";
    return "";
  };

  return (
    <div className="homey">

      {/* ── WIN POPUP ── */}
      {popup === "win" && (
        <div className="wg-popup-overlay" onClick={closePopup}>
          <div className="wg-popup-card wg-win" onClick={e => e.stopPropagation()}>

            {/* Close btn */}
            <button className="wg-popup-close" onClick={closePopup}>✕</button>

            {/* Auto-close bar */}
            <div className="wg-popup-bar"><div className="wg-popup-bar-fill" /></div>

            {/* Glow */}
            <div className="wg-popup-glow" />

            {/* Stars */}
            <div className="wg-popup-stars">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="wg-star" style={{ animationDelay: `${i * 0.12}s` }}>★</span>
              ))}
            </div>

            <div className="wg-popup-icon">🏆</div>
            <h2 className="wg-popup-title">Congratulations!</h2>
            <p className="wg-popup-sub">You won this round</p>

            {/* Result tags */}
            {(resultColor || resultNumber !== null || resultSize) && (
              <div className="wg-result-row">
                {resultColor && <span className={`wg-tag ${colorClass(resultColor)}`}>{resultColor}</span>}
                {resultNumber !== null && <span className="wg-tag wg-tag-num">{resultNumber}</span>}
                {resultSize && <span className="wg-tag wg-tag-size">{resultSize}</span>}
              </div>
            )}

            {/* Win amount */}
            <div className="wg-popup-bonus">
              <span className="wg-bonus-label">💰 Bonus Added</span>
              <span className="wg-bonus-amount">+₹{winAmount?.toFixed(2)}</span>
            </div>

            <div className="wg-popup-tap">Tap anywhere to close</div>
          </div>
        </div>
      )}

      {/* Loss popup intentionally removed */}

      {/* Header */}
      <div className="indrr">
        <button onClick={() => navigate(-1)} className="backkk-btnnn">←</button>
        <img src="src/assets/inder.png" className="logg" alt="logo" />
        <p className="indd">Tiger ClUB</p>
        <div className="bal">
          <div>
            <p className="wall">WALLET BALANCE</p>
            <span className="bl">
              ₹{balance?.toFixed(2)}
              <span className="vv" onClick={fetchBalance}>🔄</span>
            </span>
          </div>
          <div className="btns">
            <div className="rrrr" onClick={() => navigate("/withdraw")}>WITHDRAW</div>
            <div className="rrrrr" onClick={() => navigate("/deposit")}>DEPOSIT</div>
          </div>
        </div>
      </div>

      {/* Game Tabs */}
      <div className="wingo-tabs">

  <div
    className={`tab ${gameMode === "30sec" ? "active" : ""}`}
    onClick={() => setGameMode("30sec")}
  >
    <div className="icon">⏱️</div>
    <p>WinGo<br />30sec</p>
  </div>

  <div
    className={`tab ${gameMode === "1min" ? "active" : ""}`}
    onClick={() => setGameMode("1min")}
  >
    <div className="icon">⏱️</div>
    <p>WinGo<br />1 Min</p>
  </div>

  <div className="tab">
    <div className="icon">⏱️</div>
    <p>WinGo<br />3 Min</p>
  </div>

  <div className="tab">
    <div className="icon">⏱️</div>
    <p>WinGo<br />5 Min</p>
  </div>

</div>

      {/* Timer Box */}
      <div className="timer-box">
        <div className="left">
          <div className="how">📖 How to play</div>
<p className="game">
  {gameMode === "1min" ? "WinGo 1 Min" : "WinGo 30sec"}
</p>        </div>
        <div className="divider"></div>
        <div className="right">
          <p className="time-text">Time remaining</p>
          <div className={`time ${locked ? "locked-timer" : ""}`}>
            <span>{timerTens}</span>
            <span>{timerOnes}</span>
          </div>
          {locked && <p className="locked-label" style={{ color: "#ff4444", fontSize: "12px", margin: "4px 0 0" }}>🔒 Betting Locked</p>}
          <p className="id">{period}</p>
        </div>
      </div>

      {/* Color Buttons */}
      <div className="color-btns">
        <button className="btn green" onClick={() => openModal("Green")}><span className="gggrrr">Green</span></button>
        <button className="btn violet" onClick={() => openModal("Violet")}>Violet</button>
        <button className="btn red" onClick={() => openModal("Red")}><span className="gggrrr">Red</span></button>
      </div>

      {/* Number Buttons */}
      <div className="all">
        <div className="first">
          {[["0", "ball0", "num0"], ["1", "ball1", "num1"], ["2", "ball2", "num2"], ["3", "ball1", "num1"], ["4", "ball2", "num2"]].map(([n, bc, nc]) => (
            <button key={n} className={bc} onClick={() => openModal(n)}><span className={nc}>{n}</span></button>
          ))}
        </div>
        <div className="first">
          {[["5", "ballll", "ball5"], ["6", "ball2", "num2"], ["7", "ball1", "num1"], ["8", "ball2", "num2"], ["9", "ball1", "num1"]].map(([n, bc, nc]) => (
            <button key={n} className={bc} onClick={() => openModal(n)}><span className={nc}>{n}</span></button>
          ))}
        </div>
      </div>

      {/* Multiplier */}
      <div className="bet-buttons">
        <button className="random">Random</button>
        {[1, 5, 10, 20, 50, 100].map(x => (
          <button key={x} className={`multi ${multiplier === x ? "active" : ""}`} onClick={() => setMultiplier(x)}>X{x}</button>
        ))}
      </div>

      {/* Big / Small */}
      <div className="big-small">
        <div className="big" onClick={() => openModal("Big")}>Big</div>
        <div className="small" onClick={() => openModal("Small")}>  <span className="namsmall" >Small</span> </div>
      </div>

      {/* History Tabs */}
      <div className="al">
        <div className={activeTab === "game" ? "main active" : "main"} onClick={() => setActiveTab("game")}><span>GAME HISTORY</span></div>
        <div className={activeTab === "my" ? "main active" : "main"} onClick={() => setActiveTab("my")}><span>MY HISTORY</span></div>
        <div
          className={activeTab === "game1min" ? "main active" : "main"}
          onClick={() => setActiveTab("game1min")}
        >
          <span>1 MIN</span>
        </div>
      </div>

      <br />
      <div className="history-wrapper">
        {activeTab === "game" && <GameHistory />}
        
        {activeTab === "chart" && <div style={{ textAlign: "center", padding: "20px", color: "#aaa" }}>Chart Coming Soon</div>}
        {activeTab === "my" && <MyHistory />}
        {activeTab === "game1min" && <GameHistory1Min />}
      </div>
      <br />

      {/* Bet Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <div className="back-arrow" onClick={() => setShowModal(false)}><button className="aroo">←</button></div>
              <p>WinGo 30 sec</p>
              <div className="selected">Select {selected}</div>
            </div>
            <div className="modal-body">
              <div className="roww">
                <span>Balance</span>
                <div className="amounts">
                  {[1, 10, 100, 1000].map(a => (
                    <button key={a} className={amount === a ? "active" : ""} onClick={() => setAmount(a)}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="roww">
                <span>Quantity</span>
                <div className="qty">
                  <button onClick={() => { if (quantity > 1) setQuantity(q => q - 1); }}>-</button>
                  <input type="number" value={quantity} style={{ width: "120px", height: "30px" }}
                    onChange={e => { const v = e.target.value; if (v === "") { setQuantity(""); return; } if (!isNaN(v)) setQuantity(Number(v)); }}
                    onBlur={() => { if (!quantity || quantity < 1) setQuantity(1); }}
                  />
                  <button onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>
              </div>
              <div className="multi-btns">
                {[1, 5, 10, 20, 50, 100].map(x => (
                  <button key={x} className={multiplier === x ? "active" : ""} onClick={() => setMultiplier(x)}>X{x}</button>
                ))}
              </div>
              <div className="agree">
                <input type="checkbox" defaultChecked />
                <span>I agree </span>
                <span className="rules">Pre-sale rules</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="submit" onClick={placeBetHandler}>Total ₹{totalAmount}</button>
            </div>

            <br /><br />

          </div>
          <br /><br />

        </div>
      )}


    </div>
  );
};

export default WinGo;