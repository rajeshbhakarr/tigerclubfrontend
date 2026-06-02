import { useState, useEffect, useRef } from "react";

const API = "http://localhost:5000/api/admin";
const token = () => localStorage.getItem("token");
const hdr = () => ({ Authorization: "Bearer " + token() });

// ── Mini sparkline chart
function Sparkline({ data = [], color = "#6366f1", height = 36 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`g${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} 100,${height}`}
        fill={`url(#g${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat card
function StatCard({ icon, label, value, sub, color, spark, trend, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 16, padding: "20px 22px",
      border: "1.5px solid #f0f0f5", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.2s, transform 0.2s",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{
          background: color + "18", borderRadius: 10, width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
        }}>{icon}</div>
        {trend !== undefined && (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
            background: trend >= 0 ? "#dcfce7" : "#fee2e2",
            color: trend >= 0 ? "#16a34a" : "#dc2626"
          }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: -1, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b" }}>{sub}</div>}
      {spark && (
        <div style={{ marginTop: 12 }}>
          <Sparkline data={spark} color={color} />
        </div>
      )}
    </div>
  );
}

// ── Progress bar row
function BarRow({ label, value, total, color, icon }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: "#334155" }}>{icon} {label}</span>
        <span style={{ fontWeight: 700, color: "#0f172a" }}>₹{Number(value).toLocaleString()} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{
          width: pct + "%", height: "100%", background: color, borderRadius: 99,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [pendingWD, setPendingWD] = useState([]);
  const [now, setNow] = useState(new Date());
  const timerRef = useRef(null);

  const fetchStats = async () => {
    try {
      const [statsRes, usersRes, wdRes] = await Promise.all([
        fetch(`${API}/dashboard-stats`, { headers: hdr() }),
        fetch(`${API}/users`, { headers: hdr() }),
        fetch(`${API}/withdraw-requests`, { headers: hdr() }),
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const wdData = await wdRes.json();

      setStats(statsData);

      setRecentUsers(usersData.users || []);

      const pendingReqs =
        (wdData.requests || []).filter(
          r => r.status === "pending"
        );

      setPendingWD(pendingReqs);

      setLoading(false);
    } catch (e) {
      console.log("Dashboard fetch error:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    timerRef.current = setInterval(fetchStats, 30000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(clock); };
  }, []);

  const isOnline = (u) => u.lastActive &&
    (Date.now() - new Date(u.lastActive).getTime()) < 3 * 60 * 1000;

  // Dummy sparkline data for visual appeal
  const spark1 = [40, 55, 35, 70, 60, 80, 75, 90, 85, 100];
  const spark2 = [20, 30, 25, 40, 35, 50, 45, 60, 55, 70];
  const spark3 = [80, 70, 85, 65, 75, 60, 70, 55, 65, 50];

  return (
    <div style={{
      background: "#f8fafc", minHeight: "100vh", padding: "28px 32px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}{now.toLocaleTimeString("en-IN")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, background: "#dcfce7",
            border: "1px solid #86efac", borderRadius: 99, padding: "6px 14px",
            fontSize: 12, fontWeight: 700, color: "#16a34a",
          }}>
            <span style={{
              width: 7, height: 7, background: "#16a34a", borderRadius: "50%",
              boxShadow: "0 0 0 2px #bbf7d0", display: "inline-block",
              animation: "pulse 1.5s infinite"
            }} />
            Live
          </div>
          <button onClick={fetchStats} style={{
            background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10,
            padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: "#475569", display: "flex", alignItems: "center", gap: 6,
          }}>↻ Refresh</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 15 }}>
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard icon="👥" label="Total Users" value={stats?.totalUsers?.toLocaleString() || 0}
              sub="Registered users" color="#6366f1" spark={spark1} trend={12} />
            <StatCard icon="🟢" label="Online Now" value={stats?.onlineNow || 0}
              sub="Active in last 3 min" color="#10b981" spark={spark2} trend={8} />
            <StatCard icon="💰" label="Total Wallet" value={"₹" + Number(stats?.totalWallet || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              sub="All users combined" color="#f59e0b" spark={spark3} />
           <StatCard
  icon="⏳"
  label="Pending Withdrawals"
  value={stats?.pendingWithdraw || 0}
  sub={"₹" + Number(stats?.pendingWithdrawAmount || 0).toLocaleString() + " total"}
  color="#ef4444"
  trend={stats?.pendingWithdraw > 5 ? 20 : -10}
/>



            <StatCard
              icon="📥"
              label="Today Deposit"
              value={"₹" + Number(stats?.todayDeposit || 0).toLocaleString()}
              color="#10b981"
            />

            <StatCard
              icon="📤"
              label="Today Withdraw"
              value={"₹" + Number(stats?.todayWithdraw || 0).toLocaleString()}
              color="#ef4444"
            />

            <StatCard
              icon="💹"
              label="Today Profit"
              value={"₹" + Number(stats?.todayProfit || 0).toLocaleString()}
              color="#6366f1"
            />

            <StatCard
              icon="⏳"
              label="Pending Deposits"
              value={stats?.pendingDeposit || 0}
              sub={"₹" + Number(stats?.pendingDepositAmount || 0).toLocaleString()}
              color="#f59e0b"
            />


          </div>

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>


            <StatCard
              icon="🏦"
              label="Lifetime Deposit"
              value={"₹" + Number(stats?.lifetimeDeposit || 0).toLocaleString()}
              color="#10b981"
            />

            <StatCard
              icon="💸"
              label="Lifetime Withdraw"
              value={"₹" + Number(stats?.lifetimeWithdraw || 0).toLocaleString()}
              color="#ef4444"
            />

            <StatCard
              icon="💰"
              label="Lifetime Profit"
              value={"₹" + Number(stats?.lifetimeProfit || 0).toLocaleString()}
              color="#6366f1"
            />

            <StatCard
              icon="🎮"
              label="Gaming Profit"
              value={"₹" + Number(stats?.gamingProfit || 0).toLocaleString()}
              color="#8b5cf6"
            />

            {/* Recent Users */}
            <div style={{
              background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f5",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden"
            }}>
              <div style={{
                padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>👤 Recent Users</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Last {recentUsers.length} registered</span>
              </div>
              <div>
                {recentUsers.map((u, i) => (
                  <div key={u._id} style={{
                    padding: "11px 20px", display: "flex", alignItems: "center",
                    gap: 12, borderBottom: i < recentUsers.length - 1 ? "1px solid #f8fafc" : "none",
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", display: "flex",
                      alignItems: "center", justifyContent: "center", fontWeight: 700,
                      fontSize: 14, flexShrink: 0,
                      background: ["#ede9fe", "#dcfce7", "#fef3c7", "#fee2e2", "#dbeafe"][i % 5],
                      color: ["#7c3aed", "#16a34a", "#d97706", "#dc2626", "#2563eb"][i % 5],
                    }}>
                      {(u.username || "U")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: "#0f172a",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {u.username || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.mobile || "—"}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        ₹{Number(u.wallet || 0).toFixed(0)}
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                        background: isOnline(u) ? "#dcfce7" : "#f1f5f9",
                        color: isOnline(u) ? "#16a34a" : "#94a3b8",
                      }}>
                        {isOnline(u) ? "● online" : "offline"}
                      </div>
                    </div>
                  </div>
                ))}
                {recentUsers.length === 0 && (
                  <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No users yet</div>
                )}
              </div>
            </div>

            {/* Pending Withdrawals */}
            <div style={{
              background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f5",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden"
            }}>
              <div style={{
                padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>💸 Pending Withdrawals</span>
                {pendingWD.length > 0 && (
                  <span style={{
                    background: "#fee2e2", color: "#dc2626", fontSize: 11,
                    fontWeight: 700, padding: "2px 8px", borderRadius: 99
                  }}>
                    {pendingWD.length} pending
                  </span>
                )}
              </div>
              <div>
                {pendingWD.map((r, i) => (
                  <div key={r._id} style={{
                    padding: "11px 20px", display: "flex", alignItems: "center", gap: 12,
                    borderBottom: i < pendingWD.length - 1 ? "1px solid #f8fafc" : "none",
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", background: "#fff7ed",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0
                    }}>💳</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: "#0f172a",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {r.userId?.username || r.mobile || "User"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {r.method?.toUpperCase()} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#ef4444", flexShrink: 0 }}>
                      ₹{Number(r.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
                {pendingWD.length === 0 && (
                  <div style={{ padding: 24, textAlign: "center", color: "#10b981", fontSize: 13, fontWeight: 600 }}>
                    ✅ Koi pending withdrawal nahi!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Game Bet Distribution */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            <div style={{
              background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f5",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "20px 22px"
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 18 }}>
                🐉 Dragon Tiger Bets
              </div>
              <StatCard
                icon="🐉"
                label="Dragon Tiger Bets"
                value={"₹" + Number(stats?.dragonBetAmount || 0).toLocaleString()}
                color="#6366f1"
              />

              <StatCard
                icon="🎯"
                label="WinGo Bets"
                value={"₹" + Number(stats?.wingoBetAmount || 0).toLocaleString()}
                color="#10b981"
              />

              <StatCard
                icon="✈️"
                label="Aviator Bets"
                value={"₹" + Number(stats?.aviatorBetAmount || 0).toLocaleString()}
                color="#3b82f6"
              />

              <StatCard
                icon="💰"
                label="Gaming Profit"
                value={"₹" + Number(stats?.gamingProfit || 0).toLocaleString()}
                color="#f59e0b"
              />
            </div>

           <div style={{
  background: "#fff",
  borderRadius: 16,
  border: "1.5px solid #f0f0f5",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  padding: "20px 22px"
}}>
  <div style={{
    fontWeight: 700,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 18
  }}>
    📥 Pending Deposits
  </div>

  {stats?.pendingDepositsList?.length ? (
    stats.pendingDepositsList.map(dep => (
      <div
        key={dep._id}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid #f1f5f9"
        }}
      >
        <div>
          <div style={{
            fontWeight: 700,
            color: "#0f172a"
          }}>
            {dep.userId?.username || "Unknown User"}
          </div>

          <div style={{
            fontSize: 13,
            color: "#64748b"
          }}>
            {dep.userId?.mobile || ""}
          </div>
        </div>

        <div style={{
          fontWeight: 800,
          color: "#f59e0b"
        }}>
          ₹{Number(dep.amount || 0).toLocaleString()}
        </div>
      </div>
    ))
  ) : (
    <div style={{
      textAlign: "center",
      padding: "30px",
      color: "#22c55e",
      fontWeight: 600
    }}>
      ✅ No Pending Deposits
    </div>
  )}
</div>

          </div>




          <div style={{
            marginTop: 16, background: "#fff", borderRadius: 16,
            border: "1.5px solid #f0f0f5", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            padding: "18px 22px"
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 14 }}>
              ⚡ Quick Actions
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { key: "users", label: "👥 Users", color: "#6366f1" },
                { key: "requests", label: "💸 Withdrawals", color: "#ef4444" },
                { key: "wingo", label: "🎯 WinGo", color: "#10b981" },
                { key: "dragon", label: "🐉 Dragon Tiger", color: "#f59e0b" },
                { key: "aviator", label: "✈️ Aviator", color: "#3b82f6" },
                { key: "chat", label: "💬 Customer Chat", color: "#8b5cf6" },
              ].map(btn => (
                <button key={btn.label}
                  onClick={() => onNavigate && onNavigate(btn.key)}
                  style={{
                    padding: "9px 18px", border: "none", borderRadius: 10, fontWeight: 700,
                    fontSize: 13, cursor: "pointer", background: btn.color + "15",
                    color: btn.color, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = btn.color; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = btn.color + "15"; e.currentTarget.style.color = btn.color; }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 2px #bbf7d0; }
          50%       { opacity: 0.7; box-shadow: 0 0 0 4px #86efac; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}