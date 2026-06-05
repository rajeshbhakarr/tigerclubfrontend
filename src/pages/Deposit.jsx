import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/deposit.css";

const Deposit = () => {

  const handleDeposit = async () => {
  if (!amount || amount < 100) {
    alert("Minimum ₹100 required");
    return;
  }

  try {
    const res = await fetch("https://indr-backend-77tp.onrender.com/api/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        amount,
        txn: "TXN" + Date.now(), // dummy txn
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
    
  const navigate = useNavigate();
  const [value, setValue] = useState("3000");
  const [amount, setAmount] = useState(0);

  const handleClear = () => {
    setValue("");
  };

  const amounts = [100, 200, 300, 500, 1000, 1100, 2000, 3000, 5000];

  const format = (val) => {
    if (val >= 1000) return val / 1000 + "K";
    return val;
  };
  return (
    <div className="deppage">
      <div className="depp">
        <span className="back-btn" onClick={() => navigate("/profile")}>
          ←
        </span>

        <p className="dep">Deposit</p>
      </div>

      <br />

      <div className="chnl">
        <p className="select">select channel </p>

        <div className="slt">
          {" "}
          <span>Phonepe_QR Balance:100-50k</span>{" "}
        </div>
        <div className="sltt">
          {" "}
          <span>upi Phonepe_QR Balance:100-100k </span>{" "}
        </div>
      </div>

      <div className="amm">
        <span>💳 Deposit Ammount</span>

        <div className="ammnt">
          <div
            className={amount === 100 ? "rs active" : "rs"}
            onClick={() => setAmount(100)}
          >
            <span className="rsspn">₹ 100</span>
          </div>
          <div
            className={amount === 200 ? "rs active" : "rs"}
            onClick={() => setAmount(200)}
          >
            <span className="rsspn">₹ 200</span>
          </div>
          <div
            className={amount === 300 ? "rs active" : "rs"}
            onClick={() => setAmount(300)}
          >
            <span className="rsspn">₹ 300</span>
          </div>
        </div>

        <div className="ammntt">
          <div
            className={amount === 500 ? "rs active" : "rs"}
            onClick={() => setAmount(500)}
          >
            <span className="rsspn">₹ 500</span>
          </div>
          <div
            className={amount === 1000 ? "rs active" : "rs"}
            onClick={() => setAmount(1000)}
          >
            <span className="rsspn">₹ 1000</span>
          </div>
          <div
            className={amount === 1500 ? "rs active" : "rs"}
            onClick={() => setAmount(1500)}
          >
            <span className="rsspn">₹ 1500</span>
          </div>
        </div>

        <div className="ammnttt">
          <div
            className={amount === 2000 ? "rs active" : "rs"}
            onClick={() => setAmount(2000)}
          >
            <span className="rsspn">₹ 2000</span>
          </div>
          <div
            className={amount === 3000 ? "rs active" : "rs"}
            onClick={() => setAmount(3000)}
          >
            <span className="rsspn">₹ 3000</span>
          </div>
          <div
            className={amount === 5000 ? "rs active" : "rs"}
            onClick={() => setAmount(5000)}
          >
            <span className="rsspn">₹ 5000</span>
          </div>

          {/* <input   className="inut" type="ammount" /> */}

          <div className="price-wrapper">
            <span className="currency-icon">₹</span>
            <div className="vertical-divider"></div>
            <input
              type="number"
              className="amount-input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0"
            />
            {value && (
              <button className="clear-btn" onClick={handleClear}>
                <span className="close-icon">×</span>
              </button>
            )}
          </div>
        </div>

<div  >

<button className="depositt" onClick={handleDeposit}>
  Deposit
</button>



</div>

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
