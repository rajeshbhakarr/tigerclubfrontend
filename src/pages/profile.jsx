import React, { useState, useEffect } from "react";
import "../styles/profile.css";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import axios from "axios";


import walletImg from "../assets/wallett.png";
import depositImg from "../assets/deposit.jpeg";
import withdrawImg from "../assets/withdraw.png";
import vipImg from "../assets/vipp.jpeg";

const API = "https://indr-backend-77tp.onrender.com";

const Profile = () => {
const { fetchBalance, balance, user } = useWallet();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  // ── Real user data fetch ──────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/profile/me`, {
          headers: { Authorization: "Bearer " + token },
        });
        if (res.data.success) {
          setUserData(res.data.user);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("savedPhone");
    localStorage.removeItem("savedPassword");
    navigate("/loginpage");
  };

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="member-info">
          <span className="member-id">
            {userData?.username?.toUpperCase() || "Loading..."}
          </span>
          <span className="vip-badge">VIP1</span>
        </div>

        <div className="uid-section">
          <span className="uid-label">UID</span>
          <span className="uid-value">{userData?.uid || "-"}</span>
        </div>

        <div className="last-login">
          Mobile: {userData?.mobile || "-"}
        </div>
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-label">Total balance</div>
        <div className="balance-amount">
          ₹{balance !== undefined ? balance.toFixed(2) : "0.00"}
          <span className="tttt" onClick={fetchBalance}>🔄</span>
        </div>
      </div>

      <div className="btnn">
        <div className="item" onClick={() => navigate("/wallet")}>
          <img  src={walletImg} className="im" />
          <p>wallet</p>
        </div>
        <div className="item" onClick={() => navigate("/deposit")}>
          <img src={depositImg} className="im" />
          <p>Deposit</p>
        </div>
        <div className="item" onClick={() => navigate("/withdraw")}>
          <img src={withdrawImg} className="im" />
          <p>Withdraw</p>
        </div>
        <div className="item" onClick={() => navigate("/vip")}>
          <img  src={vipImg} className="im" />
          <p>VIP</p>
        </div>
      </div>

      <br />

      {/* Menu Items */}
      <div className="menu-list">
        <div className="menu-item" onClick={() => navigate("/bethistory")}>
          <span className="menu-icon">🎮</span>
          <span className="menu-text">Game History</span>
          <span className="menu-sub">My game history</span>
        </div>

        <div className="menu-item" onClick={() => navigate("/deposithistory")}>
          <span className="menu-icon">💰</span>
          <span className="menu-text">Deposit</span>
          <span className="menu-sub">My deposit history</span>
        </div>

        <div className="menu-item" onClick={() => navigate("/withdrawhistory")}>
          <span className="menu-icon">💸</span>
          <span className="menu-text">Withdraw</span>
          <span className="menu-sub">My withdraw history</span>
        </div>

        <div className="menu-item" onClick={() => navigate("/notification")}>
  <span className="menu-icon">🔔</span>
  <span className="menu-text">Notification</span>
            <span className="menu-sub">Notifications And Bonus </span>

</div>

        

        <div className="menu-item" onClick={() => navigate("/customersupport")}>
          <span className="menu-icon">👮‍♂️</span>
          <span className="menu-text">Customer service</span>
                    <span className="menu-sub">Customer Contact</span>

        </div>

        {/* Logout */}
        <div className="menu-item" onClick={handleLogout} style={{ cursor: "pointer" }}>
          <span className="menu-icon">🚪</span>
          <span className="menu-text" style={{ color: "red", fontWeight: "bold" }}>
            Logout
          </span>
          <span className="menu-sub">Sign out from account</span>
        </div>
      </div>

{user?.isAdmin === true && (
  <button
    type="button"
onClick={() => navigate("/admin/login")}    style={{
      width: "90%",
      margin: "20px auto",
      display: "block",
      padding: "12px",
      background: "#ff9800",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontWeight: "bold",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    👑 Admin Panel
  </button>
)}
    </div>
  );
};

export default Profile;