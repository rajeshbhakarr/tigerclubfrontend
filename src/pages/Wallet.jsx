import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import "../styles/wallet.css";

function Wallet() {
  const navigate = useNavigate();
  const { balance, fetchBalance } = useWallet();

  return (
    <div className="wl-page">
      {/* Header */}
      <div className="wl-header">
        <span className="wl-back" onClick={() => navigate(-1)}>←</span>
        <h2>My Wallet</h2>
      </div>

      {/* Balance Card */}
      <div className="wl-balance-card">
        <p className="wl-balance-label">Total Balance</p>
        <h1 className="wl-balance-amount">
          ₹{balance !== undefined ? balance.toFixed(2) : "0.00"}
        </h1>
        <button className="wl-refresh-btn" onClick={fetchBalance}>
          🔄 Refresh
        </button>
      </div>

      {/* Action Buttons */}
      <div className="wl-actions">
        <div className="wl-action-card" onClick={() => navigate("/deposit")}>
          <div className="wl-action-icon deposit">💰</div>
          <p className="wl-action-label">Deposit</p>
          <span className="wl-action-sub">Add money</span>
        </div>

        <div className="wl-action-card" onClick={() => navigate("/withdraw")}>
          <div className="wl-action-icon withdraw">💸</div>
          <p className="wl-action-label">Withdraw</p>
          <span className="wl-action-sub">Get money</span>
        </div>
      </div>

      {/* Info Card */}
      <div className="wl-info-card">
        <div className="wl-info-row">
          <span>💳 Main Wallet</span>
          <span>₹{balance !== undefined ? balance.toFixed(2) : "0.00"}</span>
        </div>
        <div className="wl-divider" />
        <div className="wl-info-row">
          <span>🎮 Game Wallet</span>
          <span>₹0.00</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="wl-quick">
        <div className="wl-quick-btn" onClick={() => navigate("/deposithistory")}>
          📋 Deposit History
        </div>
        <div className="wl-quick-btn" onClick={() => navigate("/withdrawhistory")}>
          📋 Withdraw History
        </div>
      </div>

      <br />
    </div>
  );
}

export default Wallet;