import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/witrhdrawhistory.css";

function Withdrawhistory() {

  const navigate = useNavigate();
  const [withdraws, setWithdraws] = useState([]);

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const fetchWithdraws = async () => {
    const res = await fetch("https://tigerclubbackend.onrender.com/api/withdraw/my-withdraws", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    const data = await res.json();

    if (data.success) {
      setWithdraws(data.withdraws);
    }
  };

  return (
    <div className="wh-page">

      {/* Header */}
      <div className="wh-header">
        <button className="wh-back" onClick={() => navigate("/profile")}>
          ←
        </button>
        <span className="wh-title">Withdraw History</span>
      </div>

      {/* Cards */}
      {withdraws.map((item) => (
        <div className="wh-card" key={item._id}>

          <div className="wh-top">
            <span className="wh-tag">Withdraw</span>

            <span className={`wh-status wh-${item.status?.toLowerCase()}`}>
              {item.status?.toUpperCase()}
            </span>
          </div>

          <div className="wh-row">
            <span>Amount</span>
            <span className="wh-amount">₹{item.amount}</span>
          </div>

          <div className="wh-row">
            <span>Type</span>
            <span>
              {item.method === "upi" ? "UPI" : "BANK CARD"}
            </span>          </div>

          <div className="wh-row">
            <span>Time</span>
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>

          <div className="wh-row">
            <span>Order number</span>

            <div className="wh-copy">
<span>{item.orderNo || item._id}</span>
<button onClick={() => navigator.clipboard.writeText(item.orderNo || item._id)}>                  📋
              </button>
            </div>
          </div>

        </div>
      ))}

    </div>
  );
}

export default Withdrawhistory;