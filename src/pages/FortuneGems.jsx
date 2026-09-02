import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Swal from "sweetalert2";
import "../styles/fortuneGems.css";

const SYMBOLS = ["🔴", "🔷", "💚", "A", "K", "Q", "J"];
const MULTIPLIERS = ["2x", "5x", "10x"];

const makeReels = () =>
  Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  );

const FortuneGems = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [betAmount, setBetAmount] = useState(3);
  const [reels, setReels] = useState(makeReels);
  const [multiplier, setMultiplier] = useState("2x");
  const [winAmount, setWinAmount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [history, setHistory] = useState([]);

  const multiplierValue = useMemo(() => Number.parseInt(multiplier, 10) || 1, [multiplier]);

  useEffect(() => {
    return () => {};
  }, []);

  const spin = async () => {
    if (isSpinning) return;

    // UI/demo guard. Keep real wallet settlement in your existing backend.
    if (Number(balance) < betAmount) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `You have ₹${Number(balance || 0).toFixed(2)}`,
        confirmButtonText: "OK",
        width: 300,
      });
      return;
    }

    setIsSpinning(true);
    setWinAmount(0);

    const duration = turbo ? 650 : 1200;
    const started = Date.now();

    const timer = setInterval(() => {
      setReels(makeReels());

      if (Date.now() - started >= duration) {
        clearInterval(timer);

        const finalReels = makeReels();
        const middle = finalReels.map((reel) => reel[1]);

        let baseWin = 0;
        if (middle.every((s) => s === middle[0])) {
          const payouts = {
            "🔴": 36,
            "🔷": 27,
            "💚": 21,
            A: 15,
            K: 12,
            Q: 9,
            J: 6,
          };
          baseWin = payouts[middle[0]] || 0;
        }

        const nextMultiplier =
          MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
        const nextMultiplierValue = Number.parseInt(nextMultiplier, 10) || 1;
        const totalWin = baseWin * nextMultiplierValue;

        setReels(finalReels);
        setMultiplier(nextMultiplier);
        setWinAmount(totalWin);
        setIsSpinning(false);

        setHistory((old) => [
          {
            bet: betAmount,
            win: totalWin,
            multiplier: nextMultiplierValue,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...old.slice(0, 7),
        ]);

        if (typeof fetchBalance === "function") fetchBalance();
      }
    }, turbo ? 45 : 65);
  };

  const changeBet = (value) => {
    const next = Math.min(1000, Math.max(1, Number(value) || 1));
    setBetAmount(next);
  };

  return (
    <main className="fg-page">
      <section className="fortune-gems">
        <header className="fg-topbar">
          <button className="fg-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            ‹
          </button>
          <div className="fg-title">Fortune Gems</div>
          <div className="fg-welcome">Welcome</div>
        </header>

        <section className="fg-scene">
          <div className="fg-sky">
            <div className="fg-sun" />
            <div className="fg-mountain m1" />
            <div className="fg-mountain m2" />
            <div className="fg-mountain m3" />
            <div className="fg-temple">
              <div className="fg-tower tower-left"><i /><b /><em /></div>
              <div className="fg-tower tower-main"><i /><b /><em /><strong /></div>
              <div className="fg-tower tower-right"><i /><b /><em /></div>
              <div className="fg-ground" />
            </div>
          </div>

          <div className="fg-ex-badge">
            <b>EX</b><span>↗</span>
          </div>

          <div className="fg-message">Guaranteed to be at least 2x.</div>

          <div className="fg-machine">
            <div className="fg-payline">
              <span>4</span><span>2</span><span>1</span><span>3</span><span>5</span>
            </div>

            <div className="fg-reels">
              {reels.map((reel, col) => (
                <div className={`fg-reel ${isSpinning ? "is-spinning" : ""}`} key={col}>
                  {reel.map((symbol, row) => (
                    <div className={`fg-cell ${row === 1 ? "payline-cell" : ""}`} key={row}>
                      <span>{symbol}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="fg-multiplier-reel">
                {["10x", "5x", "2x"].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`fg-multiplier ${value === multiplier ? "selected" : ""} ${value === "10x" ? "purple" : value === "5x" ? "blue" : "green"}`}
                    onClick={() => !isSpinning && setMultiplier(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="fg-winbar">
            <span>WIN</span>
            <strong>₹{Number(winAmount || 0).toFixed(2)}</strong>
          </div>

          <div className="fg-balancebar">
            <span>LV 0</span>
            <b>Balance</b>
            <strong>₹{Number(balance || 0).toFixed(2)}</strong>
            <i>⌁</i>
          </div>
        </section>

        <section className="fg-bottom">
          <div className="fg-bet-card">
            <div className="fg-bet-heading">BET ₹{betAmount}</div>
            <div className="fg-bet-row">
              <button onClick={() => changeBet(betAmount - 1)}>−</button>
              <div className="fg-bet-value">₹{betAmount}</div>
              <button onClick={() => changeBet(betAmount + 1)}>+</button>
            </div>
            <div className="fg-quick">
              {[3, 10, 50, 100].map((amount) => (
                <button key={amount} onClick={() => changeBet(amount)}>₹{amount}</button>
              ))}
            </div>
          </div>

          <div className="fg-actions">
            <button onClick={() => setShowRules(true)}>⚙<small>Option</small></button>
            <button onClick={() => setShowPaytable(true)}>◎<small>Paytable</small></button>

            <button className={`fg-spin ${isSpinning ? "loading" : ""}`} onClick={spin} disabled={isSpinning}>
              <span>{isSpinning ? "•••" : "SPIN"}</span>
            </button>

            <button className={turbo ? "active" : ""} onClick={() => setTurbo((v) => !v)}>↻<small>Turbo</small></button>
            <button onClick={() => setShowRules(true)}>⚡<small>Help</small></button>
          </div>

          <div className="fg-auto">
            <div>
              <b>Auto Spin</b>
              <span>Demo control</span>
            </div>
            <button onClick={spin} disabled={isSpinning}>START</button>
          </div>

          {history.length > 0 && (
            <div className="fg-history">
              <h3>Recent Spins</h3>
              {history.map((item, index) => (
                <div className="fg-history-item" key={`${item.time}-${index}`}>
                  <span>₹{item.bet}</span>
                  <b>{item.win > 0 ? `+₹${item.win}` : "Loss"}</b>
                  <i>{item.multiplier}x</i>
                  <small>{item.time}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        {showPaytable && (
          <div className="fg-modal-bg" onClick={() => setShowPaytable(false)}>
            <div className="fg-modal" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPaytable(false)}>×</button>
              <h2>Paytable</h2>
              <p>3 matching symbols on the centre payline can produce a win.</p>
              <div className="fg-table">
                <span>🔴</span><b>36</b>
                <span>🔷</span><b>27</b>
                <span>💚</span><b>21</b>
                <span>A</span><b>15</b>
                <span>K</span><b>12</b>
                <span>Q</span><b>9</b>
                <span>J</span><b>6</b>
              </div>
              <p>Multipliers shown on the special reel: 2x, 5x and 10x.</p>
            </div>
          </div>
        )}

        {showRules && (
          <div className="fg-modal-bg" onClick={() => setShowRules(false)}>
            <div className="fg-modal" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowRules(false)}>×</button>
              <h2>Game Rules</h2>
              <p>Tap SPIN to animate the three reels. The centre row is the highlighted payline.</p>
              <p>Turbo shortens the visual spin animation.</p>
              <p>Wallet settlement and real-money game logic should remain on your existing server.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default FortuneGems;