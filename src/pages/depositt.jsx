import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/deposit.css";

const Deposit = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(0);

  const handleDeposit = async () => {
    if (!amount || amount < 100) {
      alert("Minimum ₹100 required");
      return;
    }

    try {
      const res = await fetch("https://tigerclubbackend.onrender.com/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          amount,
          txn: "TXN" + Date.now(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        navigate("/payment", { state: { amount } });
      } else {
        alert(data.message || "Failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  };

  const handleClear = () => {
    setAmount(0);
  };

  const amounts = [100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000];
  
  // Split amounts into rows of 3
  const row1 = amounts.slice(0, 3);
  const row2 = amounts.slice(3, 6);
  const row3 = amounts.slice(6, 9);

  return (
    <div className="deppage">
      <div className="depp">
        <span className="back-btn" onClick={() => navigate("/profile")}>
          ←
        </span>
        <p className="dep">Deposit</p>
      </div>

      <div className="chnl">
        <p className="select">Select Channel</p>
        <div className="channel-buttons">
          <div className="slt" onClick={() => console.log("Phonepe selected")}>
            <span>📱 Phonepe_QR</span>
            <span style={{ fontSize: "10px", marginTop: "4px" }}>Balance: 100-50k</span>
          </div>
          <div className="sltt" onClick={() => console.log("UPI selected")}>
            <span>💳 UPI Phonepe_QR</span>
            <span style={{ fontSize: "10px", marginTop: "4px" }}>Balance: 100-100k</span>
          </div>
        </div>
      </div>

      <div className="amm">
        <span>💳 Deposit Amount</span>
        
        <div className="amount-rows">
          <div className="ammnt">
            {row1.map((amt) => (
              <div
                key={amt}
                className={amount === amt ? "rs active" : "rs"}
                onClick={() => setAmount(amt)}
              >
                <span>₹ {amt}</span>
              </div>
            ))}
          </div>

          <div className="ammntt">
            {row2.map((amt) => (
              <div
                key={amt}
                className={amount === amt ? "rs active" : "rs"}
                onClick={() => setAmount(amt)}
              >
                <span>₹ {amt}</span>
              </div>
            ))}
          </div>

          <div className="ammnttt">
            {row3.map((amt) => (
              <div
                key={amt}
                className={amount === amt ? "rs active" : "rs"}
                onClick={() => setAmount(amt)}
              >
                <span>₹ {amt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="custom-input-wrapper">
          <div className="price-wrapper">
            <span className="currency-icon">₹</span>
            <div className="vertical-divider"></div>
            <input
              type="number"
              className="amount-input"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
            />
            {amount > 0 && (
              <button className="clear-btn" onClick={handleClear}>
                <span className="close-icon">×</span>
              </button>
            )}
          </div>
        </div>

        <button className="depositt" onClick={handleDeposit}>
          Deposit
        </button>
      </div>

      <div className="instructions-box">
        <div className="inst-title">
          <span className="inst-icon">📕</span>
          Recharge Instructions
        </div>

        <div className="inst-content">
          <div className="inst-item">
            <span className="dot"></span>
            <p>
              Please complete your payment within the given time to avoid order
              cancellation.
            </p>
          </div>

          <div className="inst-item">
            <span className="dot"></span>
            <p>
              Make sure the transfer amount matches exactly with your selected
              amount.
            </p>
          </div>

          <div className="inst-item">
            <span className="dot"></span>
            <p>
              Incorrect payments may not be processed, so double-check before
              sending.
            </p>
          </div>

          <div className="inst-item">
            <span className="dot"></span>
            <p>
              After payment, do not refresh or leave the page until
              confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;