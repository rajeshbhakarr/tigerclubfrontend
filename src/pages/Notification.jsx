import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import "../styles/notification.css";
import axios from "axios";

const API = "http://localhost:5000/api";

function Notification() {
  const navigate = useNavigate();
  const { fetchBalance } = useWallet();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // ── Notifications fetch karo ──────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notification/my`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  // ── Claim karo ────────────────────────────────────────────
  const handleClaim = async (id) => {
    try {
      const res = await axios.post(
        `${API}/notification/claim/${id}`,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );

      if (res.data.success) {
        fetchNotifications(); // refresh
        fetchBalance();       // balance update
        alert(`✅ ₹${res.data.amount} aapke wallet mein add ho gaye!`);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="notification-page">
      {/* Header */}
      <div className="top-bar">
        <span className="back-btn" onClick={() => navigate(-1)}>←</span>
        <h2>Message</h2>
      </div>

      {/* Notification Cards */}
      <div className="notification-container">
        {loading && (
          <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
            Loading...
          </p>
        )}

        {!loading && notifications.length === 0 && (
          <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
            Koi notification nahi
          </p>
        )}

        {notifications.map((item) => (
          <div className="notification-card" key={item._id}>
            <div className="card-top">
              <div className="icon-box">📄</div>

              <div className="title-section">
                <h3>{item.title}</h3>
                <p>{item.message}</p>

                <div className="card-footer">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>

                  {/* Amount wali notification */}
                  {item.amount > 0 ? (
                    item.isClaimed ? (
                      <button className="received-btn" disabled>
                        Received ✓
                      </button>
                    ) : (
                      <button
                        className="detail-btn"
                        onClick={() => handleClaim(item._id)}
                      >
                        Receive
                      </button>
                    )
                  ) : (
                    // Sirf message — no claim button
                    <button className="received-btn" disabled>
                      Read ✓
                    </button>
                  )}
                </div>
              </div>

              {item.amount > 0 && (
                <div className="amount">₹{item.amount}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="no-more">No more</div>
    </div>
  );
}

export default Notification;