import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/paymentstatus.css";

const PaymentStatus = () => {
  const navigate = useNavigate();

  return (
    <div className="ps-page">
      <div className="ps-card">

        {/* Icon */}
        <div className="ps-icon-wrap">
          <div className="ps-icon">⏳</div>
        </div>

        {/* Title */}
        <h2 className="ps-title">Payment Processing</h2>
        <p className="ps-sub">Aapka payment verify ho raha hai</p>
        <p className="ps-warn">⚠️ Please wait</p>

        {/* Info box */}
       
        {/* Steps */}
        <div className="ps-steps">
          <div className="ps-step done">
            <span className="ps-step-icon">✅</span>
            <span className="ps-step-text">Payment Initiated</span>
            <span className="ps-badge green">Done</span>
          </div>
          <div className="ps-step active">
            <span className="ps-step-icon">🔄</span>
            <span className="ps-step-text">Bank Verification</span>
            <span className="ps-badge yellow">In Progress</span>
          </div>
          <div className="ps-step">
            <span className="ps-step-icon">⬜</span>
            <span className="ps-step-text">Amount Credited</span>
          </div>
        </div>

        {/* Buttons */}
        <button className="ps-btn-home" onClick={() => navigate("/")}>
          🏠 Go to Home
        </button>
        <button className="ps-btn-support" onClick={() => navigate("/customersupport")}>
          💬 Customer Support
        </button>

      </div>
    </div>
  );
};

export default PaymentStatus;