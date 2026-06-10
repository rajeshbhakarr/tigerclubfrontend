import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://tigerclubbackend.onrender.com/api";

function AdminNotification() {
  const [users, setUsers]       = useState([]);
  const [title, setTitle]       = useState("");
  const [message, setMessage]   = useState("");
  const [amount, setAmount]     = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading]   = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [notifications, setNotifications] = useState([]);

  // ── Users fetch ───────────────────────────────────────────
 // ── Users fetch ───────────────────────────────────────────
useEffect(() => {
  fetchUsers();
  fetchNotifications();
}, []);

const fetchUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    

    const res = await axios.get(
      `${API}/admin/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("NOTIFICATION USERS =", res.data);

    if (res.data.success) {
      setUsers(res.data.users);
    }
  } catch (err) {
    console.log("FETCH USERS ERROR =", err.response?.data || err);
  }
};

  const fetchNotifications = async () => {
    const res = await axios.get(`${API}/notification/admin/all`);
    if (res.data.success) setNotifications(res.data.notifications);
  };

  // ── Send notification ─────────────────────────────────────
  const handleSend = async () => {
    if (!title || !message) return alert("Title aur message bharo!");
    if (!sendToAll && !selectedUser) return alert("User select karo!");

    setLoading(true);
    try {
      const res = await axios.post(`${API}/notification/admin/send`, {
        title,
        message,
        amount: Number(amount) || 0,
        sendToAll,
        userId: selectedUser,
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setTitle("");
        setMessage("");
        setAmount("");
        setSelectedUser("");
        fetchNotifications();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: "white", padding: "8px 4px" }}>
      <h2 style={{
        fontSize: "28px", fontWeight: "700", marginBottom: "28px",
        background: "linear-gradient(135deg, #FFD700, #FF8C00, #FF6347)",
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent"
      }}>
        🔔 Notifications
      </h2>

      {/* ── Send Form ── */}
      <div style={{
        background: "rgba(17,24,39,0.6)", borderRadius: "16px",
        padding: "24px", marginBottom: "24px",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px", color: "#f59e0b" }}>📤 Notification Bhejo</h3>

        {/* Success message */}
        {successMsg && (
          <div style={{
            background: "#dcfce7", color: "#16a34a",
            padding: "10px", borderRadius: "8px", marginBottom: "12px"
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Send to All / One */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setSendToAll(true)} style={{
            flex: 1, padding: "10px", borderRadius: "8px", border: "none",
            background: sendToAll ? "#6366f1" : "#374151",
            color: "white", cursor: "pointer", fontWeight: "bold"
          }}>
            👥 Sabko Bhejo
          </button>
          <button onClick={() => setSendToAll(false)} style={{
            flex: 1, padding: "10px", borderRadius: "8px", border: "none",
            background: !sendToAll ? "#f59e0b" : "#374151",
            color: "white", cursor: "pointer", fontWeight: "bold"
          }}>
            👤 Ek User Ko
          </button>
        </div>

        {/* User select */}
        {!sendToAll && (
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            style={{
              width: "100%", padding: "10px", borderRadius: "8px",
              border: "1px solid #444", background: "#1e1e2e",
              color: "white", marginBottom: "12px", outline: "none"
            }}
          >
            <option value="">-- User select karo --</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.username} — {u.mobile}
              </option>
            ))}
          </select>
        )}

        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Notification title (e.g. Activity Bonus)"
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid #444", background: "#1e1e2e",
            color: "white", marginBottom: "12px", outline: "none",
            boxSizing: "border-box"
          }}
        />

        {/* Message */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Message likho..."
          rows={3}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid #444", background: "#1e1e2e",
            color: "white", marginBottom: "12px", outline: "none",
            resize: "none", boxSizing: "border-box"
          }}
        />

        {/* Amount */}
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount (0 = sirf message, koi claim nahi)"
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid #444", background: "#1e1e2e",
            color: "white", marginBottom: "16px", outline: "none",
            boxSizing: "border-box"
          }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            width: "100%", padding: "12px", borderRadius: "8px",
            border: "none", background: "#6366f1",
            color: "white", fontWeight: "bold", fontSize: "16px",
            cursor: "pointer", opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Bhej raha hai..." : "🚀 Send Notification"}
        </button>
      </div>

      {/* ── Sent Notifications History ── */}
      <div style={{
        background: "rgba(17,24,39,0.6)", borderRadius: "16px",
        padding: "24px", border: "1px solid rgba(255,255,255,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px", color: "#f59e0b" }}>
          📋 Bheji Gayi Notifications
        </h3>

        {notifications.length === 0 && (
          <p style={{ color: "#64748b", textAlign: "center" }}>
            Koi notification nahi bheji abhi
          </p>
        )}

        {notifications.slice(0, 20).map((n, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "10px", padding: "12px",
            marginBottom: "10px",
            border: "1px solid rgba(255,255,255,0.06)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontWeight: "bold" }}>{n.title}</span>
              {n.amount > 0 && (
                <span style={{ color: "#22c55e", fontWeight: "bold" }}>₹{n.amount}</span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0" }}>{n.message}</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
              <span>👤 {n.userId?.username || "All Users"}</span>
              <span>{n.isClaimed ? "✅ Claimed" : "⏳ Pending"}</span>
              <span>{new Date(n.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminNotification;