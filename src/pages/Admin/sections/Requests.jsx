import { useState, useEffect } from "react";
import "../../../styles/admin/requests.css";

const API = "http://localhost:5000/api";

function Requests() {
  const [deposits, setDeposits] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [activeTab, setActiveTab] = useState("deposit");
  // useEffect(() => {
  //   const refFromUrl = searchParams.get("ref");
  //   if (refFromUrl) {
  //     localStorage.removeItem("token"); // pehla user logout
  //   }
  // }, [searchParams])

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      // ✅ Withdraw Requests
      const res1 = await fetch(`${API}/admin/withdraw-requests`, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const data1 = await res1.json();

      if (data1.success) {
        setWithdraws(data1.requests);
      }

      // ✅ Deposit Requests
      const res2 = await fetch(`${API}/admin/deposit-requests`, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const data2 = await res2.json();

      if (data2.success) {
        setDeposits(data2.requests);
      }

    } catch (err) {
      console.log("Fetch Requests Error:", err);
    }
  };





  // ── Deposit ───────────────────────────────────────────────
  const handleApprove = async (id) => {
    await fetch(`${API}/admin/deposit-approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ id }),
    });

    fetchRequests();
  };




  const deleteWithdraw = async (id) => {
    await fetch(`${API}/admin/withdraw-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ id }),
    });

    fetchRequests();
  };





  const handleReject = async (id) => {
    await fetch(`${API}/admin/deposit-reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchRequests();
  };





  const handleDelete = async (id) => {
    await fetch(`${API}/admin/deposit-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ id }),
    });

    fetchRequests();
  };







  // ── Withdraw ──────────────────────────────────────────────
  const approveWithdraw = async (id) => {
    await fetch(`${API}/admin/withdraw-approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ id }),
    });

    fetchRequests();
  };





  const rejectWithdraw = async (id) => {
    await fetch(`${API}/admin/withdraw-reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ id }),
    });

    fetchRequests();
  };




  // ── Status badge ──────────────────────────────────────────
  const statusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#d97706" },
      approved: { bg: "#dcfce7", color: "#16a34a" },
      completed: { bg: "#dcfce7", color: "#16a34a" },
      rejected: { bg: "#fee2e2", color: "#dc2626" },
    };
    const s = colors[status] || colors.pending;
    return (
      <span
        style={{
          background: s.bg,
          color: s.color,
          padding: "3px 10px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="axr-container">
      <h2 className="axr-title">Requests</h2>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("deposit")}
          style={{
            padding: "10px 24px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "deposit" ? "#f59e0b" : "#374151",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          💰 Deposit
          <span
            style={{
              marginLeft: "8px",
              background: "white",
              color: activeTab === "deposit" ? "#f59e0b" : "#374151",
              borderRadius: "50%",
              padding: "1px 7px",
              fontSize: "12px",
            }}
          >
            {deposits.filter((d) => d.status === "pending").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("withdraw")}
          style={{
            padding: "10px 24px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "withdraw" ? "#ef4444" : "#374151",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          💸 Withdraw
          <span
            style={{
              marginLeft: "8px",
              background: "white",
              color: activeTab === "withdraw" ? "#ef4444" : "#374151",
              borderRadius: "50%",
              padding: "1px 7px",
              fontSize: "12px",
            }}
          >
            {withdraws.filter((w) => w.status === "pending").length}
          </span>
        </button>
      </div>

      {/* ── Deposit Tab ── */}
      {activeTab === "deposit" && (
        <div>
          {deposits.length === 0 && (
            <p
              style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}
            >
              Koi deposit request nahi
            </p>
          )}
          {deposits.map((d) => (
            <div
              key={d._id}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              {/* User Info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <p
                    style={{ fontWeight: "bold", fontSize: "16px", margin: 0 }}
                  >
                    👤 {d.userId?.username || "Unknown"}
                  </p>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      margin: "2px 0",
                    }}
                  >
                    📱 {d.userId?.mobile || "-"}
                  </p>
                </div>
                {statusBadge(d.status)}
              </div>

              {/* Amount + TXN */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >
                <p
                  style={{
                    margin: "2px 0",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#22c55e",
                  }}
                >
                  ₹{d.amount}
                </p>
                <p
                  style={{
                    margin: "2px 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
Order No: {d.txn || d._id}                </p>
                <p
                  style={{
                    margin: "2px 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  🕐 {new Date(d.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Screenshot */}
              {d.screenshot && (
                <img
                  src={d.screenshot}
                  alt="ss"
                  style={{
                    maxWidth: "100%",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                />
              )}

              {/* Buttons */}
              {d.status === "pending" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleApprove(d._id)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#22c55e",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleReject(d._id)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#ef4444",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}

              {(d.status === "approved" || d.status === "rejected") && (
                <button
                  onClick={() => handleDelete(d._id)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#374151",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Withdraw Tab ── */}
      {activeTab === "withdraw" && (
        <div>
          {withdraws.length === 0 && (
            <p
              style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}
            >
              Koi withdraw request nahi
            </p>
          )}
          {withdraws.map((w) => (
            <div
              key={w._id}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              {/* User Info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <p
                    style={{ fontWeight: "bold", fontSize: "16px", margin: 0 }}
                  >
                    👤 {w.userId?.username || w.uid || "Unknown"}
                  </p>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      margin: "2px 0",
                    }}
                  >
                    📱 {w.mobile || w.userId?.mobile || "-"}
                  </p>
                </div>
                {statusBadge(w.status)}
              </div>

              {/* Amount + Details */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >
                <p
                  style={{
                    margin: "2px 0",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#ef4444",
                  }}
                >
                  ₹{w.amount}
                </p>
                <p
                  style={{
                    margin: "2px 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  Order No: {w.orderNo || "-"}
                </p>

                {/* 🔥 METHOD + ACCOUNT DETAILS */}
                <p style={{ margin: "2px 0", fontSize: "12px", color: "#94a3b8" }}>
                  Method: <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                    {w.method?.toUpperCase() || "BANK"}
                  </span>
                </p>

                {w.method === "upi" ? (
                  <p style={{ margin: "2px 0", fontSize: "12px", color: "#94a3b8" }}>
                    UPI: <span style={{ color: "white" }}>{w.accountDetails?.upiId}</span>
                    {" | "}Name: <span style={{ color: "white" }}>{w.accountDetails?.name}</span>
                  </p>
                ) : (
                  <>
                    <p style={{ margin: "2px 0", fontSize: "12px", color: "#94a3b8" }}>
                      Bank: <span style={{ color: "white" }}>{w.accountDetails?.bankName}</span>
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "12px", color: "#94a3b8" }}>
                      Acc: <span style={{ color: "white" }}>{w.accountDetails?.accountNo}</span>
                      {" | "}IFSC: <span style={{ color: "white" }}>{w.accountDetails?.ifsc}</span>
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "12px", color: "#94a3b8" }}>
                      Name: <span style={{ color: "white" }}>{w.accountDetails?.name}</span>
                    </p>
                  </>
                )}


                <p
                  style={{
                    margin: "2px 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  UID: {w.uid || "-"}
                </p>
                <p
                  style={{
                    margin: "2px 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  🕐 {new Date(w.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Screenshot */}
              {w.screenshot && (
                <img
                  src={w.screenshot}
                  alt="ss"
                  style={{
                    maxWidth: "100%",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                />
              )}

              {/* Buttons */}
              {w.status === "pending" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => approveWithdraw(w._id)} style={{
                    flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                    background: "#22c55e", color: "white", fontWeight: "bold", cursor: "pointer"
                  }}>✅ Approve</button>
                  <button onClick={() => rejectWithdraw(w._id)} style={{
                    flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                    background: "#ef4444", color: "white", fontWeight: "bold", cursor: "pointer"
                  }}>❌ Reject</button>
                </div>
              )}

              {/* ✅ DELETE BUTTON - BAHAR NIKALO */}
              {(w.status === "approved" || w.status === "rejected" || w.status === "completed") && (
                <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                  <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", margin: 0 }}>
                    Already processed ✓
                  </p>
                  <button onClick={() => deleteWithdraw(w._id)} style={{
                    width: "100%", padding: "8px", borderRadius: "8px", border: "none",
                    background: "#374151", color: "#94a3b8", cursor: "pointer", fontSize: "13px"
                  }}>🗑️ Delete</button>
                </div>
              )}

              {(w.status === "approved" || w.status === "rejected") && (
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  Already processed ✓
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Requests;
