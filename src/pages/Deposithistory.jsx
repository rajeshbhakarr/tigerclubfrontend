import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/deposithistory.css";

function DepositHistory() {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  // ✅ Dummy data (yahi missing tha)


  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    const res = await fetch("https://indr-backend-77tp.onrender.com/api/my-deposits", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    const data = await res.json();

    if (data.success) {
      setDeposits(data.data);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="depohispage">
      {/* Header */}
      <div className="txtdivvv">
        <button className="backBtn" onClick={() => navigate("/profile")}>
          ←
        </button>

        <span className="txttt">Deposit History</span>
      </div>

      <hr />

      {deposits.map((item) => (
        <div className="deposit-card" key={item._id}>
          <div className="top-row">
            <span className="tag">Deposit</span>

            <span
              className={
                item.status === "approved"
                  ? "status-complete"
                  : item.status === "rejected"
                    ? "status-failed"
                    : "status-pending"
              }
            >
              {item.status?.toUpperCase()}
            </span>
          </div>

          <div className="row">
            <span>Balance</span>
            <span className="aamountt">₹{item.amount}</span>
          </div>



          <div className="row">
            <span>Time</span>
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>

          <div className="row order-row">
            <span>Order number</span>

            <div className="copy-box">
<span>{item.txn || item._id}</span>
<button onClick={() => navigator.clipboard.writeText(item.txn || item._id)}>                📋
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DepositHistory;
