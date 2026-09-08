import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/payment.css";

import scanner from "../assets/scanner.png";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const amount = location.state?.amount || 0;

  const [time, setTime] = useState(300);
  const [selectedMethod, setSelectedMethod] = useState("paytm");
  const [utr, setUtr] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const copyUPI = () => {
    navigator.clipboard.writeText("test@upi");
    alert("UPI Copied!");
  };

  const handleSubmit = () => {
    if (!utr || utr.length < 6) {
      alert("Please enter valid UTR number");
      return;
    }

    navigate("/payment-status");
  };

  return (
    <div className="pay-container">

      {/* HEADER */}
      <div className="pay-header">
        <span
          className="pay-back"
          onClick={() => navigate(-1)}
        >
          ←
        </span>

        <h2>Deposit</h2>

        <span
          className="pay-history"
          onClick={() => navigate("/deposit-history")}
        >
          History
        </span>
      </div>

      {/* AMOUNT CARD */}
      <div className="pay-amount-card">

        <div className="amount-label">
          💳 &nbsp;Wallet Balance
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

      {/* PAYMENT METHOD */}
      <div className="method-section">

        <div className="section-title">
          💳 &nbsp;Select Payment Method
        </div>

        <div className="method-grid">

          {/* PAYTM */}
          <button
            type="button"
            className={
              selectedMethod === "paytm"
                ? "method-card selected"
                : "method-card"
            }
            onClick={() => setSelectedMethod("paytm")}
          >

            <div className="method-logo paytm-logo">
              paytm
            </div>

            <div className="method-qr">
              <img
                src={scanner}
                alt="Paytm QR"
              />
            </div>

            <div className="method-name">
              Paytm X QR
            </div>

          </button>

          {/* UPI */}
          <button
            type="button"
            className={
              selectedMethod === "upi"
                ? "method-card selected"
                : "method-card"
            }
            onClick={() => setSelectedMethod("upi")}
          >

            <div className="method-logo upi-logo">
              UPI
            </div>

            <div className="method-qr">
              <img
                src={scanner}
                alt="UPI QR"
              />
            </div>

            <div className="method-name">
              UPI X QR
            </div>

          </button>

        </div>
      </div>

      {/* PAYMENT DETAILS */}
      <div className="details-card">

        <div className="detail-title">
          {selectedMethod === "paytm"
            ? "Paytm X QR"
            : "UPI X QR"}
        </div>

        <div className="selected-message">
          Selected payment method
        </div>

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

      </div>

      {/* TIMER */}
      <div className="timer-card">

        <span>
          ⏱ Payment Time Remaining
        </span>

        <strong>
          {Math.floor(time / 60)}:
          {String(time % 60).padStart(2, "0")}
        </strong>

      </div>

      {/* UTR */}
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

      {/* SUBMIT */}
      <button
        className="submit-btn"
        disabled={!utr}
        onClick={handleSubmit}
      >
        Submit Payment
      </button>

      {/* INFO */}
      <div className="payment-info">

        <div className="info-title">
          ℹ️ Payment Instructions
        </div>

        <p>
          Please check the selected payment method before continuing.
        </p>

        <p>
          Keep your payment reference number safe.
        </p>

      </div>

    </div>
  );
};

export default Payment;