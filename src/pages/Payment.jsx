import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/payment.css";

import scanner from "../assets/scanner.png";

const Payment = () => {
  const location = useLocation();
  const amount = location.state?.amount || 0;
  const navigate = useNavigate();

  const [time, setTime] = useState(300);
  const [utr, setUtr] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const openUPI = () => {
    window.location.href = `src/assets/qrcode.jpeg=VIPPAY&am=${amount}`;
  };

  const copyUPI = () => {
    navigator.clipboard.writeText("test@upi");
    alert("UPI Copied!");
  };

  return (
    <div className="pay-container">
      {/* Header */}
      <div className="pay-header">
        <span onClick={() => navigate(-1)}>←</span>
        <h2>Pay Here</h2>
      </div>

      {/* Amount Card */}
      <div className="amount-card">
        ₹{amount}
        <span className="timer">
          ⏱ {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
        </span>
      </div>

      {/* Payment Options */}
      <div className="pay-options">
        <div className="option" onClick={openUPI}>
          📱 PhonePe
        </div>

        <div className="option" onClick={openUPI}>
          💰 Paytm
        </div>
      </div>

      {/* QR Box */}
      <div className="qr-box">
        <img className="qrcode" src={scanner} alt="qr" />
      </div>

      {/* UPI */}
      <div className="upi-box">
        <span>indr86@freecharge</span>
        <button onClick={copyUPI}>Copy</button>
      </div>

      {/* UTR */}
      <input
        className="utr"
        placeholder="Enter UTR / Reference ID"
        value={utr}
        onChange={(e) => setUtr(e.target.value)}
      />

      {/* Submit */}
      <button
        className="submit-btn"
        disabled={!utr}
        onClick={() => {
          if (!utr || utr.length < 6) {
            alert("Please enter valid UTR number");
            return;
          }
          navigate("/payment-status");
        }}
      >
        Submit Payment
      </button>
    </div>
  );
};

export default Payment;
