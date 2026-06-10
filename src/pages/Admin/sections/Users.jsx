import { useState, useEffect } from "react";
import "../../../styles/admin/users.css";

const API = "https://tigerclubbackend.onrender.com/api/admin";

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState("add");
  const [needToBet, setNeedToBet] = useState("");

  const token = localStorage.getItem("token");

  // ── Fetch Users ───────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ── Online Status ─────────────────────────────────────────
  const isOnline = (lastActive) => {
    if (!lastActive) return false;

    const diff = Date.now() - new Date(lastActive).getTime();

    return diff < 5 * 60 * 1000;
  };

  // ── Filters ───────────────────────────────────────────────
  const filteredUsers = users
    .filter((u) => {
      const name = (u.username || "").toLowerCase();
      const mobile = (u.mobile || "").toLowerCase();
      const uid = (u.uid || u._id || "").toLowerCase();

      return (
        name.includes(search.toLowerCase()) ||
        mobile.includes(search.toLowerCase()) ||
        uid.includes(search.toLowerCase())
      );
    })
    .filter((u) => {
      if (filter === "active") return !u.isBlocked;
      if (filter === "blocked") return u.isBlocked;

      return true;
    });

  // ── Edit Balance ──────────────────────────────────────────
  const handleEditBalance = async () => {
    if (!editAmount) return alert("Amount bharo!");

    try {
      await fetch(`${API}/edit-balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          amount: Number(editAmount),
          type: editType,
          needToBet: Number(needToBet),
        }),
      });

      setSelectedUser(null);
      setEditAmount("");
      setNeedToBet("");

      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };

  // ── Block User ────────────────────────────────────────────
  const handleBlock = async (userId) => {
    try {
      await fetch(`${API}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };

  // ── Unblock User ──────────────────────────────────────────
  const handleUnblock = async (userId) => {
    try {
      await fetch(`${API}/unblock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="axu-container">
      <h2 className="axu-title">Users</h2>

      {/* ── Top Bar ───────────────────────────────────── */}
      <div className="axu-topbar">
        <input
          type="text"
          className="axu-search"
          placeholder="Search by name, mobile, UID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="axu-filters">
          {["all", "active", "blocked"].map((f) => (
            <button
              key={f}
              className={`axu-filter-btn ${
                filter === f ? "active" : ""
              }`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      <div className="axu-table">
        <div className="axu-head">
          <span>UID</span>
          <span>Name</span>
          <span>Mobile</span>
          <span>Balance</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filteredUsers.map((u) => (
          <div key={u._id} className="axu-row">
            <span style={{ fontSize: "12px", color: "#aaa" }}>
              {u.uid || u._id.slice(-8).toUpperCase()}
            </span>

            <span>{u.username || "-"}</span>

            <span>{u.mobile || "-"}</span>

            <span>₹{Number(u.wallet).toFixed(2)}</span>

            <span
              style={{
                width: "90px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                background: u.isBlocked
                  ? "rgba(239,68,68,0.15)"
                  : isOnline(u.lastActive)
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(239,68,68,0.15)",
                color: u.isBlocked
                  ? "#ef4444"
                  : isOnline(u.lastActive)
                  ? "#10b981"
                  : "#ef4444",
              }}
            >
              <span style={{ fontSize: "8px" }}>●</span>

              {u.isBlocked
                ? "blocked"
                : isOnline(u.lastActive)
                ? "active"
                : "inactive"}
            </span>

            <div className="axu-actions">
              <button
                onClick={() => setSelectedUser(u)}
                style={{
                  background: "#f59e0b",
                  color: "white",
                }}
              >
                Edit ₹
              </button>

              {u.isBlocked ? (
                <button onClick={() => handleUnblock(u._id)}>
                  Unblock
                </button>
              ) : (
                <button onClick={() => handleBlock(u._id)}>
                  Block
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal ─────────────────────────────────────── */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              background: "#1e1e2e",
              padding: "24px",
              borderRadius: "12px",
              color: "white",
              minWidth: "320px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "16px" }}>
              ✏️ Balance Edit
            </h3>

            {/* User Info */}
            <div
              style={{
                background: "#2a2a3e",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <p>
                👤 <b>{selectedUser.username}</b>
              </p>

              <p>📱 {selectedUser.mobile}</p>

              <p>
                🆔{" "}
                {selectedUser.uid ||
                  selectedUser._id.slice(-8).toUpperCase()}
              </p>

              <p>
                💰 Current Balance:{" "}
                <b>₹{selectedUser.wallet}</b>
              </p>
            </div>

            {/* Edit Type */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={() => setEditType("add")}
                style={{
                  flex: 1,
                  padding: "8px",
                  background:
                    editType === "add"
                      ? "#22c55e"
                      : "#374151",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ➕ Add/Subtract
              </button>

              <button
                onClick={() => setEditType("set")}
                style={{
                  flex: 1,
                  padding: "8px",
                  background:
                    editType === "set"
                      ? "#f59e0b"
                      : "#374151",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                🎯 Set Exact
              </button>
            </div>

            {/* Need To Bet */}
            <input
              type="number"
              placeholder="Need To Bet Amount"
              value={needToBet}
              onChange={(e) => setNeedToBet(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#2a2a3e",
                color: "white",
                marginBottom: "12px",
              }}
            />

            {/* Amount */}
            <input
              type="number"
              placeholder={
                editType === "add"
                  ? "Amount (negative = deduct)"
                  : "New balance amount"
              }
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#2a2a3e",
                color: "white",
                marginBottom: "8px",
              }}
            />

            {/* Preview */}
            {editAmount && (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                Preview: ₹{selectedUser.wallet} →{" "}
                <b style={{ color: "#22c55e" }}>
                  ₹
                  {editType === "set"
                    ? Number(editAmount)
                    : selectedUser.wallet +
                      Number(editAmount)}
                </b>
              </p>
            )}

            {/* Need To Bet Update */}
            <div
              style={{
                marginTop: "12px",
                borderTop: "1px solid #333",
                paddingTop: "12px",
              }}
            >
              <button
                onClick={async () => {
                  try {
                    await fetch(
                      "https://tigerclubbackend.onrender.com/api/admin/edit-needtobet",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type":
                            "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          userId: selectedUser._id,
                          amount: needToBet,
                        }),
                      }
                    );

                    fetchUsers();
                    setSelectedUser(null);
                  } catch (err) {
                    console.log(err);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#f59e0b",
                  color: "black",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                Update Need To Bet
              </button>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleEditBalance}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✅ Update Balance
              </button>

              <button
                onClick={() => {
                  setSelectedUser(null);
                  setEditAmount("");
                  setNeedToBet("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;