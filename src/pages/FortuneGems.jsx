import React, { useMemo, useState } from "react";
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

const SYMBOLS = [
  { id: "red", type: "image", src: redGem },
  { id: "purple", type: "image", src: purpleGem },
  { id: "green", type: "image", src: greenGem },
  { id: "blue", type: "image", src: blueGem },
  { id: "wild", type: "image", src: wildImg },
  { id: "j", type: "image", src: jImg },
  { id: "q", type: "image", src: qImg },
  { id: "a", type: "text", value: "A" },
  { id: "k", type: "text", value: "K" },
];

const MULTIPLIERS = ["10x", "5x", "2x"];

const PAYOUTS = {
  red: 36,
  purple: 27,
  green: 21,
  blue: 18,
  wild: 50,
  a: 15,
  k: 12,
  q: 9,
  j: 6,
};

const randomSymbol = () =>
  SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

const makeReels = () =>
  Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, randomSymbol)
  );

const FortuneGems = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [betAmount, setBetAmount] = useState(10);
  const [reels, setReels] = useState(makeReels);
  const [multiplier, setMultiplier] = useState("2x");
  const [winAmount, setWinAmount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [autoSpin, setAutoSpin] = useState(0);

  const multiplierValue = useMemo(
    () => Number.parseInt(multiplier, 10) || 1,
    [multiplier]
  );

  const changeBet = (value) => {
    const next = Math.min(1000, Math.max(1, Number(value) || 1));
    setBetAmount(next);
  };

  const renderSymbol = (symbol) => {
    if (symbol.type === "image") {
      return (
        <img
          className={`fg-symbol-image fg-symbol-${symbol.id}`}
          src={symbol.src}
          alt=""
        />
      );
    }

    return <span className="fg-letter-symbol">{symbol.value}</span>;
  };

  const spin = async () => {
    if (isSpinning) return;

    if (Number(balance || 0) < betAmount) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `Available balance ₹${Number(balance || 0).toFixed(2)}`,
        confirmButtonText: "OK",
        width: 330,
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

        if (
          middle[0].id === middle[1].id &&
          middle[1].id === middle[2].id
        ) {
          baseWin = PAYOUTS[middle[0].id] || 0;
        }

        const selectedMultiplier =
          MULTIPLIERS[
            Math.floor(Math.random() * MULTIPLIERS.length)
          ];

        const selectedMultiplierValue =
          Number.parseInt(selectedMultiplier, 10) || 1;

        const totalWin = baseWin * selectedMultiplierValue;

        setReels(finalReels);
        setMultiplier(selectedMultiplier);
        setWinAmount(totalWin);
        setIsSpinning(false);

        if (typeof fetchBalance === "function") {
          fetchBalance();
        }
      }
    }, turbo ? 45 : 65);
  };

  const startAutoSpin = () => {
    if (isSpinning) return;

    setAutoSpin((old) => {
      if (old > 0) return 0;
      return 10;
    });
  };

  return (
    <main
      className="fg-page"
      style={{ "--fg-bg-image": `url(${templeBg})` }}
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
            <button>+</button>
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
                  className={`fg-reel ${
                    isSpinning ? "is-spinning" : ""
                  }`}
                  key={col}
                >

                  {reel.map((symbol, row) => (
                    <div
                      className={`fg-cell ${
                        row === 1 ? "payline-cell" : ""
                      }`}
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
                  onClick={() =>
                    !isSpinning && setMultiplier(value)
                  }
                >
                  {value}
                </button>
              ))}

            </aside>

          </div>

          {/* WIN BAR */}
          <div className="fg-winbar">
            <span>WIN</span>
            <strong>
              ₹{Number(winAmount || 0).toFixed(2)}
            </strong>
          </div>

        </section>

        {/* BET AREA */}
        <section className="fg-control-panel">

          <div className="fg-bet-heading">
            BET AMOUNT
          </div>

          <div className="fg-bet-row">

            <button
              onClick={() => changeBet(betAmount - 1)}
            >
              −
            </button>

            <div className="fg-bet-value">
              ₹{betAmount}
            </div>

            <button
              onClick={() => changeBet(betAmount + 1)}
            >
              +
            </button>

          </div>

          <div className="fg-quick">

            {[3, 10, 50, 100].map((amount) => (
              <button
                key={amount}
                className={betAmount === amount ? "selected" : ""}
                onClick={() => changeBet(amount)}
              >
                ₹{amount}
              </button>
            ))}

          </div>

        </section>

        {/* ACTION BUTTONS */}
        <section className="fg-actions">

          <button
            className="fg-action"
            onClick={() => setShowRules(true)}
          >
            <span>⚙</span>
            <small>OPTIONS</small>
          </button>

          <button
            className="fg-action"
            onClick={() => setShowPaytable(true)}
          >
            <span>ⓘ</span>
            <small>PAYTABLE</small>
          </button>

          <button
            className={`fg-spin ${
              isSpinning ? "loading" : ""
            }`}
            onClick={spin}
            disabled={isSpinning}
          >
            <span>{isSpinning ? "•••" : "SPIN"}</span>
          </button>

          <button
            className={`fg-action ${
              turbo ? "active" : ""
            }`}
            onClick={() => setTurbo((v) => !v)}
          >
            <span>ϟ</span>
            <small>TURBO</small>
          </button>

          <button
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
            onClick={startAutoSpin}
            className={autoSpin > 0 ? "active" : ""}
          >
            {autoSpin > 0 ? "STOP" : "START"}
          </button>

        </section>

        {/* PAYTABLE MODAL */}
        {showPaytable && (
          <div
            className="fg-modal-bg"
            onClick={() => setShowPaytable(false)}
          >
            <div
              className="fg-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="fg-modal-close"
                onClick={() => setShowPaytable(false)}
              >
                ×
              </button>

              <h2>PAYTABLE</h2>

              <p>
                Matching symbols on the highlighted centre
                payline can produce a result.
              </p>

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
          <div
            className="fg-modal-bg"
            onClick={() => setShowRules(false)}
          >
            <div
              className="fg-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="fg-modal-close"
                onClick={() => setShowRules(false)}
              >
                ×
              </button>

              <h2>GAME OPTIONS</h2>

              <p>
                Use the bet controls to select your stake.
              </p>

              <p>
                Press SPIN to start the reel animation.
              </p>

              <p>
                Turbo changes only the visual animation speed.
              </p>

              <p>
                Wallet settlement should be handled by
                the server-side game system.
              </p>
            </div>
          </div>
        )}

      </section>
    </main>
  );
};

export default FortuneGems;