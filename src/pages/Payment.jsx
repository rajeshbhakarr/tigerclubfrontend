import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/payment.css";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const amount = location.state?.amount || 0;
  const selectedChannel = location.state?.channel || "upi";

  const [time, setTime] = useState(300);
  const [utr, setUtr] = useState("");

  const isPaytm = selectedChannel === "paytm";

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (!utr || utr.length < 6) {
      alert("Please enter valid UTR number");
      return;
    }

    navigate("/payment-status");
  };

  return (
    <div className="pay-container">

      {/* ================= HEADER ================= */}
      <div className="pay-header">
        <button
          className="pay-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h2>Deposit</h2>

        <button
          className="pay-history"
          onClick={() => navigate("/deposit-history")}
        >
          History
        </button>
      </div>

      {/* ================= AMOUNT ================= */}
      <div className="pay-amount-card">
        <div className="amount-label">
          💳 Payment Amount
        </div>

        <div className="amount-value">
          ₹{Number(amount).toFixed(2)}
          <span className="refresh-icon">
            ↻
          </span>
        </div>

        <div className="payment-note">
          Payment Amount
        </div>
      </div>

      {/* ================= SELECTED METHOD ================= */}
      <div className="selected-method-card">
        <div className="selected-method-title">
          {isPaytm ? "Paytm Transfer" : "UPI Transfer"}
        </div>

        <div className="selected-method-subtitle">
          {isPaytm
            ? "Pay using Paytm"
            : "Pay using UPI"}
        </div>
      </div>

      {/* ================= TIMER ================= */}
      <div className="timer-card">
        <span>
          ⏱ Payment Time Remaining
        </span>

        <strong>
          {Math.floor(time / 60)}:
          {String(time % 60).padStart(2, "0")}
        </strong>
      </div>

      {/* ================= UTR ================= */}
      <div className="utr-card">
        <div className="utr-title">
          Reference / UTR
        </div>

        <input
          className="utr"
          type="text"
          placeholder="Enter UTR / Reference ID"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
        />
      </div>

      {/* ================= SUBMIT ================= */}
      <button
        className="submit-btn"
        disabled={!utr}
        onClick={handleSubmit}
      >
        Submit Payment
      </button>

      {/* ================= INFO ================= */}
      <div className="payment-info">
        <div className="info-title">
          ℹ️ Payment Instructions
        </div>

        <p>
          Complete the payment and enter your reference number (UTR) below.
        </p>
      </div>

    </div>
  );
};

export default Payment;