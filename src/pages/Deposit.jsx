import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/deposit.css";

const Deposit = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState("paytm");
  const [value, setValue] = useState("");

  const handleDeposit = async () => {
    if (!amount || amount < 100) {
      alert("Minimum ₹100 required");
      return;
    }

    try {
      const res = await fetch(
        "https://tigerclubbackend.onrender.com/api/deposit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            amount,
            txn: "TXN" + Date.now(),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        navigate("/payment", {
          state: {
            amount,
            channel: selectedChannel,
          },
        });
      } else {
        alert(data.message || "Failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  };

  const selectAmount = (value) => {
    setAmount(value);
    setValue(String(value));
  };

  const clearAmount = () => {
    setAmount(0);
    setValue("");
  };

  return (
    <div className="rw-deposit-page">

      {/* ================= HEADER ================= */}

      <header className="rw-deposit-header">

        <button
          className="rw-back-button"
          onClick={() => navigate("/profile")}
        >
          ←
        </button>

        <h1 className="rw-deposit-title">
          Deposit
        </h1>

        <button
          className="rw-history-button"
          onClick={() => navigate("/deposithistory")}
        >
          History
        </button>

      </header>

      {/* ================= BALANCE CARD ================= */}

      <section className="rw-balance-card">

        <div className="rw-balance-top">
          <span className="rw-wallet-icon">
            💳
          </span>

          <span>
            AMMOUNT OF PAYMENT
          </span>
        </div>

        <div className="rw-balance-amount">
          ₹{amount > 0 ? amount.toFixed(2) : "0.00"}

          <span className="rw-refresh">
            ↻
          </span>
        </div>

      </section>

      {/* ================= BONUS INFO ================= */}

      

      {/* ================= PAYMENT METHOD ================= */}

      <section className="rw-method-section">

        <div className="rw-section-heading">
          <span className="rw-heading-icon">
            💳
          </span>

          <span>
            Select Payment Method
          </span>
        </div>

        <div className="rw-method-grid">

          {/* PAYTM */}

          <button
            type="button"
            className={
              selectedChannel === "paytm"
                ? "rw-method-card rw-method-active"
                : "rw-method-card"
            }
            onClick={() =>
              setSelectedChannel("paytm")
            }
          >

            <div className="rw-paytm-logo">
              paytm
            </div>

            <div className="rw-method-placeholder">
              QR
            </div>

            <div className="rw-method-label">
              Paytm X QR
            </div>

          </button>

          {/* UPI */}

          <button
            type="button"
            className={
              selectedChannel === "upi"
                ? "rw-method-card rw-method-active"
                : "rw-method-card"
            }
            onClick={() =>
              setSelectedChannel("upi")
            }
          >

            <div className="rw-upi-logo">
              UPI
            </div>

            <div className="rw-method-placeholder">
              QR
            </div>

            <div className="rw-method-label">
              UPI X QR
            </div>

          </button>

        </div>

      </section>

      {/* ================= AMOUNT ================= */}

      <section className="rw-amount-section">

        <div className="rw-section-heading">
          <span className="rw-heading-icon">
            🪙
          </span>

          <span>
            Deposit Amount
          </span>
        </div>

        <div className="rw-amount-grid">

          {[100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000].map(
            (item) => (
              <button
                key={item}
                type="button"
                className={
                  amount === item
                    ? "rw-amount-button rw-amount-selected"
                    : "rw-amount-button"
                }
                onClick={() => selectAmount(item)}
              >
                ₹ {item}
              </button>
            )
          )}

        </div>

        {/* CUSTOM AMOUNT */}

        <div className="rw-custom-amount">

          <span className="rw-rupee-symbol">
            ₹
          </span>

          <span className="rw-input-divider"></span>

          <input
            type="number"
            value={value}
            placeholder="Enter amount"
            onChange={(e) => {
              const val = e.target.value;
              setValue(val);
              setAmount(
                val === "" ? 0 : Number(val)
              );
            }}
          />

          <button
            type="button"
            className="rw-clear-amount"
            onClick={clearAmount}
          >
            ×
          </button>

        </div>

        {/* DEPOSIT BUTTON */}

        <button
          type="button"
          className="rw-main-deposit-button"
          onClick={handleDeposit}
        >
          Deposit
        </button>

      </section>

      {/* ================= INSTRUCTIONS ================= */}

      <section className="rw-instruction-section">

        <div className="rw-instruction-heading">
          📕 Recharge Instructions
        </div>

        <div className="rw-instruction-list">

          <div className="rw-instruction-row">
            <span>•</span>
            <p>
              Please complete your payment within
              the given time to avoid cancellation.
            </p>
          </div>

          <div className="rw-instruction-row">
            <span>•</span>
            <p>
              Make sure the transfer amount matches
              your selected amount.
            </p>
          </div>

          <div className="rw-instruction-row">
            <span>•</span>
            <p>
              Double-check your payment details
              before continuing.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
};

export default Deposit;