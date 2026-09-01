import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Swal from "sweetalert2";
import "../styles/Aviator.css";

const API = "https://indr-backend-77tp.onrender.com/api";

const Aviator = () => {
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [multiplier, setMultiplier] = useState(1.0);
  const [predictedCrash, setPredictedCrash] = useState(null);

  const [betAmount, setBetAmount] = useState(50);
  const [betPlaced, setBetPlaced] = useState(false);
  const [activeBet, setActiveBet] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("bet");
  const [historyTab, setHistoryTab] = useState("recent");

  const [autoCashout, setAutoCashout] = useState("");
  const [toast, setToast] = useState({
    show: false,
    type: "info",
    message: "",
  });

  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMultiplier, setWinMultiplier] = useState(0);
  const [winPayout, setWinPayout] = useState(0);

  // ------------------------------------------------------------
  // TOAST
  // ------------------------------------------------------------

  const showToast = (message, type = "info") => {
    setToast({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }));
    }, 2200);
  };

  // ------------------------------------------------------------
  // LOAD GAME STATE
  // ------------------------------------------------------------

  const loadState = async () => {
    try {
      const res = await fetch(`${API}/aviator/state`);
      const data = await res.json();

      if (data.success) {
        setState(data.state);

        if (data.state.predictedCrash && !data.state.hasBets) {
          setPredictedCrash(data.state.predictedCrash);
        } else {
          setPredictedCrash(null);
        }

        if (data.state.phase === "waiting") {
          setGameOver(true);
        } else if (data.state.phase === "flying") {
          setGameOver(false);
        }
      }
    } catch (err) {
      console.error("Load state error:", err);
    }
  };

  // ------------------------------------------------------------
  // LOAD BET HISTORY
  // ------------------------------------------------------------

  const loadBets = async () => {
    try {
      const res = await fetch(`${API}/aviator/my-bets?limit=10`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setHistory(data.bets || []);
      }
    } catch (err) {
      console.error("Load bets error:", err);
    }
  };

  // ------------------------------------------------------------
  // CHECK ACTIVE BET
  // ------------------------------------------------------------

  const checkActiveBet = async () => {
    try {
      const res = await fetch(`${API}/aviator/active-bet`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      if (data.success && data.bet) {
        setActiveBet(data.bet);
        setBetPlaced(true);

        if (data.bet.amount) {
          setBetAmount(data.bet.amount);
        }
      } else {
        setBetPlaced(false);
        setActiveBet(null);
      }
    } catch (err) {
      console.error("Check active bet error:", err);
    }
  };

  // ------------------------------------------------------------
  // SSE CONNECTION
  // ------------------------------------------------------------

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

          if (data.predictedCrash && !data.hasBets) {
            setPredictedCrash(
              parseFloat(Number(data.predictedCrash).toFixed(2))
            );
          } else {
            setPredictedCrash(null);
          }

          if (data.phase === "waiting") {
            setGameOver(true);
          } else if (data.phase === "flying") {
            setGameOver(false);
          }
        }

        if (data.type === "tick") {
          const nextMultiplier = parseFloat(data.multiplier);

          setMultiplier(nextMultiplier);

          // Auto cashout
          if (
            betPlaced &&
            autoCashout &&
            Number(autoCashout) > 1 &&
            nextMultiplier >= Number(autoCashout)
          ) {
            cashout();
          }
        }

        if (data.type === "crashed") {
          const crashMultiplier = parseFloat(data.multiplier);

          setMultiplier(crashMultiplier);
          setGameOver(true);
          setBetPlaced(false);
          setActiveBet(null);

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
  }, [betPlaced, autoCashout]);

  // ------------------------------------------------------------
  // PLACE BET
  // ------------------------------------------------------------

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
        body: JSON.stringify({
          betAmount,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBetPlaced(true);
        setPredictedCrash(null);
        setActiveBet(data.bet);

        await fetchBalance();

        showToast(`₹${betAmount} bet placed`, "win");

        Swal.fire({
          icon: "success",
          title: "Bet Placed!",
          text: `₹${betAmount} - Cashout before crash!`,
          width: "260px",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "Unable to place bet",
          width: "260px",
        });
      }
    } catch (err) {
      console.error("Bet error:", err);

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

  // ------------------------------------------------------------
  // CASHOUT
  // ------------------------------------------------------------

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

    if (!betPlaced) {
      return;
    }

    try {
      setLoading(true);

      const cashoutMultiplier = multiplier;

      const res = await fetch(`${API}/aviator/cashout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          roundId: state.roundId,
          cashoutAt: cashoutMultiplier,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const payout =
          Number(betAmount) * Number(cashoutMultiplier);

        setBetPlaced(false);
        setActiveBet(null);
        setGameOver(true);

        setWinMultiplier(cashoutMultiplier);
        setWinPayout(payout);
        setShowWinPopup(true);

        await fetchBalance();
        await loadBets();

        showToast(`Won ₹${payout.toFixed(2)}`, "win");

        Swal.fire({
          icon: "success",
          title: "🎉 Cashed Out!",
          text: `Won ₹${payout.toFixed(2)}`,
          width: "260px",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "Cashout failed",
          width: "260px",
        });
      }
    } catch (err) {
      console.error("Cashout error:", err);

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

  // ------------------------------------------------------------
  // QUICK BET
  // ------------------------------------------------------------

  const setQuickAmount = (amount) => {
    if (!betPlaced) {
      setBetAmount(amount);
    }
  };

  // ------------------------------------------------------------
  // CLOSE WIN POPUP
  // ------------------------------------------------------------

  const closeWinPopup = () => {
    setShowWinPopup(false);
  };

  // ------------------------------------------------------------
  // HISTORY FILTER
  // ------------------------------------------------------------

  const visibleHistory =
    historyTab === "wins"
      ? history.filter((bet) => bet.result === "win")
      : historyTab === "losses"
      ? history.filter((bet) => bet.result !== "win")
      : history;

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="aviator-root">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="av-header">
        <button
          className="av-header-back"
          onClick={() => navigate(-1)}
        >
          ‹
        </button>

        <div className="av-header-title">
          ✈ AVIATOR
        </div>

        <div className="av-header-balance">
          ₹<span>{Number(balance || 0).toFixed(2)}</span>
        </div>
      </header>

      {/* ======================================================
          CRASH HISTORY BAR
      ====================================================== */}

      <div className="av-history-bar">

        <span className="av-crash-pill low">
          1.24x
        </span>

        <span className="av-crash-pill low">
          1.67x
        </span>

        <span className="av-crash-pill mid">
          2.75x
        </span>

        <span className="av-crash-pill high">
          4.21x
        </span>

        <span className="av-crash-pill low">
          1.13x
        </span>

        <span className="av-crash-pill mega">
          8.92x
        </span>

        {predictedCrash && !betPlaced && (
          <span className="av-crash-pill high">
            {Number(predictedCrash).toFixed(2)}x
          </span>
        )}
      </div>

      {/* ======================================================
          ROUND INFO
      ====================================================== */}

      <div className="av-round-bar">

        <div className="av-round-id">
          Round:{" "}
          <span>
            {state?.roundId
              ? state.roundId.slice(-8)
              : "--------"}
          </span>
        </div>

        <div className="av-ping">
          ● <span>LIVE</span>
        </div>

      </div>

      {/* ======================================================
          GAME CANVAS
      ====================================================== */}

      <div className="av-canvas-wrap">

        <svg
          className="av-svg"
          viewBox="0 0 420 280"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="aviatorLineGradient"
              x1="0"
              y1="1"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#e63946"
                stopOpacity="0.15"
              />

              <stop
                offset="100%"
                stopColor="#f4b942"
                stopOpacity="0.9"
              />
            </linearGradient>
          </defs>

          <path
            d="M 0 270 C 90 268, 145 250, 205 215 C 265 180, 315 110, 420 20"
            fill="none"
            stroke="url(#aviatorLineGradient)"
            strokeWidth="3"
          />

          <path
            d="M 0 270 C 90 268, 145 250, 205 215 C 265 180, 315 110, 420 20 L420 280 L0 280 Z"
            fill="rgba(230,57,70,0.05)"
          />
        </svg>

        {/* Plane */}

        <div
          className={`av-plane ${
            gameOver && state?.phase === "crashed"
              ? "crashed"
              : ""
          }`}
          style={{
            left:
              state?.phase === "flying"
                ? `${Math.min(
                    92,
                    15 + multiplier * 7
                  )}%`
                : "12%",
            bottom:
              state?.phase === "flying"
                ? `${Math.min(
                    78,
                    12 + multiplier * 5
                  )}%`
                : "12%",
          }}
        >
          ✈️
        </div>

        {/* Multiplier */}

        <div
          className={`av-multiplier ${
            gameOver && state?.phase === "crashed"
              ? "crashed"
              : ""
          } ${
            state?.phase === "waiting"
              ? "waiting"
              : ""
          }`}
        >
          {state?.phase === "waiting"
            ? "WAITING FOR NEXT ROUND"
            : `${Number(multiplier).toFixed(2)}x`}
        </div>

        {/* Waiting overlay */}

        {state?.phase === "waiting" && (
          <div className="av-waiting-overlay">
            <div className="av-waiting-label">
              NEXT ROUND STARTING
            </div>

            <div className="av-waiting-countdown">
              GET READY
            </div>
          </div>
        )}

      </div>

      {/* ======================================================
          PREDICTION / ACTIVE BET INFO
      ====================================================== */}

      {!betPlaced && predictedCrash && (
        <div
          style={{
            background: "#111420",
            padding: "12px 14px",
            textAlign: "center",
            borderBottom: "1px solid #252a3a",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#8892aa",
              marginBottom: "4px",
            }}
          >
            🎯 PREDICTED CRASH
          </div>

          <div
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "22px",
              fontWeight: "900",
              color: "#f4b942",
            }}
          >
            {Number(predictedCrash).toFixed(2)}x
          </div>
        </div>
      )}

      {/* ======================================================
          BET PANEL
      ====================================================== */}

      <div className="av-bet-panel">

        {/* Bet Tabs */}

        <div className="av-bet-tabs">

          <div
            className={`av-bet-tab ${
              activeTab === "bet"
                ? "active"
                : ""
            }`}
            onClick={() => setActiveTab("bet")}
          >
            BET
          </div>

          <div
            className={`av-bet-tab ${
              activeTab === "auto"
                ? "active"
                : ""
            }`}
            onClick={() => setActiveTab("auto")}
          >
            AUTO
          </div>

        </div>

        {/* ====================================================
            BET CONTENT
        ==================================================== */}

        {activeTab === "bet" && (
          <div className="av-dual-bets">

            {/* FIRST BET SLOT */}

            <div className="av-bet-slot">

              <div className="av-amount-row">

                <div className="av-amount-ctrl">

                  <button
                    type="button"
                    onClick={() =>
                      setBetAmount((prev) =>
                        Math.max(10, Number(prev) - 10)
                      )
                    }
                    disabled={betPlaced}
                  >
                    −
                  </button>

                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) =>
                      setBetAmount(
                        Number(e.target.value)
                      )
                    }
                    min="10"
                    max="10000"
                    disabled={betPlaced}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setBetAmount((prev) =>
                        Math.min(
                          10000,
                          Number(prev) + 10
                        )
                      )
                    }
                    disabled={betPlaced}
                  >
                    +
                  </button>

                </div>

              </div>

              {/* QUICK AMOUNTS */}

              <div className="av-quick-amounts">

                {[50, 100, 500, 1000].map(
                  (amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`av-quick-btn ${
                        Number(betAmount) === amount
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setQuickAmount(amount)
                      }
                      disabled={betPlaced}
                    >
                      ₹{amount}
                    </button>
                  )
                )}

              </div>

              {/* AUTO CASHOUT */}

              <div className="av-auto-row">

                <span className="av-auto-label">
                  Auto Cashout
                </span>

                <input
                  className="av-auto-input"
                  type="number"
                  min="1.01"
                  step="0.01"
                  placeholder="e.g. 2.00x"
                  value={autoCashout}
                  onChange={(e) =>
                    setAutoCashout(e.target.value)
                  }
                  disabled={betPlaced}
                />

              </div>

              {/* ACTION BUTTON */}

              {!betPlaced && gameOver && (
                <button
                  className="av-action-btn bet"
                  onClick={placeBet}
                  disabled={loading}
                >
                  {loading
                    ? "PLACING..."
                    : "🎮 PLACE BET"}
                </button>
              )}

              {betPlaced &&
                state?.phase === "flying" && (
                  <button
                    className="av-action-btn cashout"
                    onClick={cashout}
                    disabled={loading}
                  >
                    💰 CASHOUT @{" "}
                    {Number(multiplier).toFixed(2)}x
                  </button>
                )}

              {betPlaced &&
                state?.phase === "waiting" && (
                  <button
                    className="av-action-btn cancel"
                    disabled
                  >
                    ROUND STARTING...
                  </button>
                )}

            </div>

            {/* SECOND SLOT */}

            <div className="av-bet-slot">

              <div
                style={{
                  textAlign: "center",
                  padding: "8px 4px 14px",
                }}
              >
                <div
                  style={{
                    color: "#8892aa",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  CURRENT BET
                </div>

                {betPlaced ? (
                  <>
                    <div
                      style={{
                        fontFamily:
                          "Orbitron, monospace",
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#f0f4ff",
                      }}
                    >
                      ₹{Number(betAmount).toFixed(2)}
                    </div>

                    <div
                      style={{
                        marginTop: "7px",
                        color: "#2dc653",
                        fontSize: "12px",
                      }}
                    >
                      BET ACTIVE
                    </div>

                    <div
                      style={{
                        marginTop: "7px",
                        color: "#f4b942",
                        fontSize: "13px",
                      }}
                    >
                      Potential: ₹
                      {(
                        Number(betAmount) *
                        Number(multiplier)
                      ).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontFamily:
                          "Orbitron, monospace",
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#4a5270",
                      }}
                    >
                      NO BET
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        color: "#4a5270",
                        fontSize: "12px",
                      }}
                    >
                      Place your bet for next round
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ====================================================
            AUTO TAB
        ==================================================== */}

        {activeTab === "auto" && (
          <div className="av-bet-slot">

            <div className="av-auto-row">

              <span className="av-auto-label">
                Bet Amount
              </span>

              <input
                className="av-auto-input"
                type="number"
                min="10"
                max="10000"
                value={betAmount}
                onChange={(e) =>
                  setBetAmount(
                    Number(e.target.value)
                  )
                }
                disabled={betPlaced}
              />

            </div>

            <div className="av-auto-row">

              <span className="av-auto-label">
                Auto Cashout
              </span>

              <input
                className="av-auto-input"
                type="number"
                min="1.01"
                step="0.01"
                placeholder="2.00"
                value={autoCashout}
                onChange={(e) =>
                  setAutoCashout(e.target.value)
                }
                disabled={betPlaced}
              />

            </div>

            {!betPlaced && gameOver && (
              <button
                className="av-action-btn bet"
                onClick={placeBet}
                disabled={loading}
              >
                {loading
                  ? "PLACING..."
                  : "🎮 START AUTO BET"}
              </button>
            )}

            {betPlaced &&
              state?.phase === "flying" && (
                <button
                  className="av-action-btn cashout"
                  onClick={cashout}
                  disabled={loading}
                >
                  💰 CASHOUT @{" "}
                  {Number(multiplier).toFixed(2)}x
                </button>
              )}

          </div>
        )}

      </div>

      {/* ======================================================
          ACTIVE BET SUMMARY
      ====================================================== */}

      {betPlaced && activeBet && (
        <div
          style={{
            padding: "10px 14px",
            background: "#161925",
            borderBottom: "1px solid #252a3a",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#8892aa",
              fontSize: "11px",
              marginBottom: "4px",
            }}
          >
            ACTIVE BET
          </div>

          <div
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "18px",
              fontWeight: "700",
              color: "#f0f4ff",
            }}
          >
            ₹{Number(betAmount).toFixed(2)}
          </div>

          <div
            style={{
              marginTop: "5px",
              fontSize: "12px",
              color: "#f4b942",
            }}
          >
            Potential Win: ₹
            {(
              Number(betAmount) *
              Number(multiplier)
            ).toFixed(2)}
          </div>
        </div>
      )}

      {/* ======================================================
          HISTORY SECTION
      ====================================================== */}

      <div className="av-history-section">

        <div className="av-hist-tabs">

          <div
            className={`av-hist-tab ${
              historyTab === "recent"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setHistoryTab("recent")
            }
          >
            RECENT
          </div>

          <div
            className={`av-hist-tab ${
              historyTab === "wins"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setHistoryTab("wins")
            }
          >
            WINS
          </div>

          <div
            className={`av-hist-tab ${
              historyTab === "losses"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setHistoryTab("losses")
            }
          >
            LOSSES
          </div>

        </div>

        {/* BET LIST */}

        <div className="av-bet-list">

          <div className="av-bet-row av-bet-row-header">
            <span>USER</span>
            <span>BET</span>
            <span>CASHOUT</span>
            <span>PAYOUT</span>
          </div>

          {visibleHistory.length > 0 ? (
            visibleHistory.map((bet, idx) => {

              const isWon =
                bet.result === "win";

              const amount =
                Number(
                  bet.amount ??
                  bet.betAmount ??
                  0
                );

              const cashoutAt =
                bet.cashoutAt
                  ? Number(bet.cashoutAt)
                  : null;

              const payout =
                bet.payout
                  ? Number(bet.payout)
                  : cashoutAt
                  ? amount * cashoutAt
                  : 0;

              return (
                <div
                  key={
                    bet._id ||
                    bet.id ||
                    idx
                  }
                  className="av-bet-row"
                >

                  <span className="av-bet-user">
                    {bet.username ||
                      bet.user?.username ||
                      "You"}
                  </span>

                  <span className="av-bet-amount">
                    ₹{amount.toFixed(2)}
                  </span>

                  <span
                    className={`av-bet-cashout ${
                      isWon
                        ? "won"
                        : cashoutAt
                        ? "lost"
                        : "pending"
                    }`}
                  >
                    {cashoutAt
                      ? `${cashoutAt.toFixed(2)}x`
                      : "—"}
                  </span>

                  <span
                    className={`av-bet-payout ${
                      isWon
                        ? "won"
                        : "lost"
                    }`}
                  >
                    {isWon
                      ? `₹${payout.toFixed(2)}`
                      : "₹0.00"}
                  </span>

                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "30px 15px",
                textAlign: "center",
                color: "#4a5270",
                fontSize: "13px",
              }}
            >
              No bets found
            </div>
          )}

        </div>

      </div>

      {/* ======================================================
          TOAST
      ====================================================== */}

      <div
        className={`av-toast ${
          toast.show ? "show" : ""
        } ${toast.type}`}
      >
        {toast.message}
      </div>

      {/* ======================================================
          WIN POPUP
      ====================================================== */}

      {showWinPopup && (
        <div
          className="av-win-overlay"
          onClick={closeWinPopup}
        >

          <div
            className="av-win-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="av-win-close"
              onClick={closeWinPopup}
            >
              ✕
            </button>

            <div className="av-win-glow" />

            <div className="av-win-stars">

              <span className="av-win-star">
                ★
              </span>

              <span className="av-win-star">
                ★
              </span>

              <span className="av-win-star">
                ★
              </span>

              <span className="av-win-star">
                ★
              </span>

              <span className="av-win-star">
                ★
              </span>

            </div>

            <div className="av-win-plane">
              ✈️
            </div>

            <div className="av-win-title">
              CASHOUT SUCCESSFUL
            </div>

            <div className="av-win-multi">
              {Number(winMultiplier).toFixed(2)}x
            </div>

            <div className="av-win-payout">

              <span className="av-win-payout-label">
                Your Payout
              </span>

              <span className="av-win-payout-val">
                ₹{Number(winPayout).toFixed(2)}
              </span>

            </div>

            <div className="av-win-bar">
              <div className="av-win-bar-fill" />
            </div>

            <div className="av-win-tap">
              Tap anywhere to close
            </div>

            <button
              className="av-auto-clear"
              onClick={closeWinPopup}
              style={{
                marginTop: "10px",
              }}
            >
              CLOSE
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default Aviator;