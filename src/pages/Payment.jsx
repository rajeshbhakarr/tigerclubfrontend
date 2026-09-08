import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/payment.css";

import phonepeQR from "../assets/phonepe-qr.png";
import upiQR from "../assets/upi-qr.png";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const amount = location.state?.amount || 0;

  // Deposit page se selected channel
  const selectedChannel = location.state?.channel || "upi";

  const [time, setTime] = useState(300);
  const [utr, setUtr] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const copyUPI = () => {
    navigator.clipboard
      .writeText("45rizwan@yesfam")
      .then(() => {
        alert("UPI Copied!");
      })
      .catch(() => {
        alert("Copy failed");
      });
  };

  const handleSubmit = () => {
    if (!utr || utr.length < 6) {
      alert("Please enter valid UTR number");
      return;
    }

    navigate("/payment-status");
  };

  const isPaytm = selectedChannel === "paytm";

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
          💳 Wallet Balance
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
          {isPaytm ? "Paytm X QR" : "UPI X QR"}
        </div>

        <div className="selected-method-subtitle">
          {isPaytm
            ? "Scan using PhonePe"
            : "Scan using UPI"}
        </div>

      </div>

      {/* ================= ONLY SELECTED QR ================= */}

      <div className="qr-card">

        <div className="qr-title">
          Scan QR Code
        </div>

        <div className="qr-frame">

          <img
            className="main-qr"
            src={isPaytm ? phonepeQR : upiQR}
            alt={
              isPaytm
                ? "PhonePe QR"
                : "UPI QR"
            }
          />

        </div>

        <div className="qr-caption">
          {isPaytm
            ? "PhonePe QR"
            : "UPI QR"}
        </div>

      </div>

      {/* ================= UPI DETAILS ================= */}

      <div className="upi-box">

        <span>
          45rizwan@yesfam
        </span>

        <button
          type="button"
          onClick={copyUPI}
        >
          Copy
        </button>

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
          onChange={(e) =>
            setUtr(e.target.value)
          }
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
          Please scan the QR shown above.
        </p>

        <p>
          Enter your reference number after payment.
        </p>

      </div>

    </div>
  );
};

export default Payment;