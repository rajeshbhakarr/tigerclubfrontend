import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import "../styles/activity.css";

  const API = "https://indr-backend-production.up.railway.app/api";

  const ATTENDANCE_REWARDS = [
    { day: 1, amount: 8 },
    { day: 2, amount: 10 },
    { day: 3, amount: 10 },
    { day: 4, amount: 26 },
    { day: 5, amount: 26 },
    { day: 6, amount: 26 },
    { day: 7, amount: 66 },
  ];

  const BETTING_TASKS = [
    { id: 1, label: "Lottery bet amount", target: 500,    reward: 6   },
    { id: 2, label: "Lottery bet amount", target: 1000,   reward: 10  },
    { id: 3, label: "Lottery bet amount", target: 5000,   reward: 40  },
    { id: 4, label: "Lottery bet amount", target: 10000,  reward: 76  },
    { id: 5, label: "Lottery bet amount", target: 50000,  reward: 180 },
    { id: 6, label: "Lottery bet amount", target: 100000, reward: 300 },
    { id: 7, label: "Lottery bet amount", target: 300000, reward: 550 },
  ];

  const DEPOSIT_BONUSES = [
    { id: 1, minDeposit: 100,   reward: 3,    label: "First Deposit ₹100"   },
    { id: 2, minDeposit: 200,   reward: 6,    label: "First Deposit ₹200"   },
    { id: 3, minDeposit: 500,   reward: 16,   label: "First Deposit ₹500"   },
    { id: 4, minDeposit: 1000,  reward: 36,   label: "First Deposit ₹1000"  },
    { id: 5, minDeposit: 5000,  reward: 166,  label: "First Deposit ₹5000"  },
  ];

  function Activity() {
    const navigate = useNavigate();
    const [activeTab,      setActiveTab]      = useState("attendance");
    const [attendanceData, setAttendanceData] = useState(null);
    const [bettingTasks,   setBettingTasks]   = useState([]);
    const [depositBonuses, setDepositBonuses] = useState([]);
    const [firstDeposit,   setFirstDeposit]   = useState(0);
    const [loading,        setLoading]        = useState(false);
    const [msg,            setMsg]            = useState("");
    const [msgType,        setMsgType]        = useState("success");

    const token = localStorage.getItem("token");
    const hdr   = { Authorization: "Bearer " + token };

    useEffect(() => {
      fetchAttendance();
      fetchBettingProgress();
      fetchDepositStatus();
    }, []);

    const showMsg = (text, type = "success") => {
      setMsg(text); setMsgType(type);
      setTimeout(() => setMsg(""), 4000);
    };

    const fetchAttendance = async () => {
      try {
        const res  = await fetch(`${API}/activity/attendance`, { headers: hdr });
        const data = await res.json();
        if (data.success) setAttendanceData(data);
      } catch (err) { console.log(err); }
    };

    const fetchBettingProgress = async () => {
      try {
        const res  = await fetch(`${API}/activity/betting-progress`, { headers: hdr });
        const data = await res.json();
        if (data.success) setBettingTasks(data.tasks || []);
      } catch (err) { console.log(err); }
    };

    const fetchDepositStatus = async () => {
      try {
        const res  = await fetch(`${API}/activity/deposit-bonus`, { headers: hdr });
        const data = await res.json();
        if (data.success) {
          setDepositBonuses(data.bonuses || []);
          setFirstDeposit(data.firstDeposit || 0);
        }
      } catch (err) { console.log(err); }
    };

    const claimAttendance = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/activity/attendance/claim`, {
          method: "POST", headers: hdr,
        });
        const data = await res.json();
        showMsg(data.message || data.msg, data.success ? "success" : "error");
        if (data.success) fetchAttendance();
      } catch (err) { console.log(err); }
      finally { setLoading(false); }
    };

    const claimBettingTask = async (taskId) => {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/activity/betting-task/claim/${taskId}`, {
          method: "POST", headers: hdr,
        });
        const data = await res.json();
        showMsg(data.message || data.msg, data.success ? "success" : "error");
        if (data.success) fetchBettingProgress();
      } catch (err) { console.log(err); }
      finally { setLoading(false); }
    };

    const claimDepositBonus = async (bonusId) => {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/activity/deposit-bonus/claim/${bonusId}`, {
          method: "POST", headers: hdr,
        });
        const data = await res.json();
        showMsg(data.message || data.msg, data.success ? "success" : "error");
        if (data.success) fetchDepositStatus();
      } catch (err) { console.log(err); }
      finally { setLoading(false); }
    };

    const consecutiveDays = attendanceData?.consecutiveDays || 0;
    const accumulated     = attendanceData?.accumulated     || 0;
    const todayClaimed    = attendanceData?.todayClaimed    || false;
    const streakBroken    = attendanceData?.streakBroken    || false;

    return (
      <div className="activity-page">

        {/* Header */}
        <div className="act-header">
          <span className="act-back" onClick={() => navigate(-1)}>←</span>
          <h2>Activity</h2>
          <span></span>
        </div>

        {/* Toast */}
        {msg && <div className={`act-toast ${msgType}`}>{msg}</div>}

        {/* Tabs */}
        <div className="act-tabs">
          <button className={`act-tab ${activeTab === "attendance" ? "active" : ""}`} onClick={() => setActiveTab("attendance")}>🗓️ Attendance</button>
          <button className={`act-tab ${activeTab === "betting"    ? "active" : ""}`} onClick={() => setActiveTab("betting")}>🎯 Betting</button>
          <button className={`act-tab ${activeTab === "deposit"    ? "active" : ""}`} onClick={() => setActiveTab("deposit")}>💰 Deposit</button>
        </div>

        {/* ══ ATTENDANCE ══ */}
        {activeTab === "attendance" && (
          <div className="act-content">

            {/* Streak broken warning */}
            {streakBroken && (
              <div style={{
                background: "#fff3cd", border: "1px solid #ffc107",
                borderRadius: "10px", padding: "10px 14px",
                margin: "0 0 12px", fontSize: "13px", color: "#856404",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                ⚠️ Streak toot gayi! Kal login nahi kiya — Day 1 se dobara shuru karo.
              </div>
            )}

            <div className="att-banner">
              <div>
                <h3>Attendance Bonus</h3>
                <p>Consecutive login days pe rewards pao</p>
                <div className="att-stats-row">
                  <div className="att-stat-box">
                    <span>Consecutive days</span>
                    <strong>{consecutiveDays} Day</strong>
                  </div>
                  <div className="att-stat-box">
                    <span>Accumulated</span>
                    <strong>₹{accumulated}</strong>
                  </div>
                </div>
              </div>
              <div className="att-emoji">📅</div>
            </div>

            <div className="att-grid">
              {ATTENDANCE_REWARDS.map((item) => {
                const isCurrent = item.day === consecutiveDays + 1;
                const isDone    = item.day <= consecutiveDays;
                return (
                  <div key={item.day} className={`att-card ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                    <span className="att-amount">₹{item.amount}</span>
                    <div className="att-coin">⭐</div>
                    {isCurrent && !todayClaimed ? (
                      <button className="att-claim-btn" onClick={claimAttendance} disabled={loading}>
                        Claim
                      </button>
                    ) : isDone ? (
                      <span className="att-done">✓</span>
                    ) : (
                      <span className="att-day">{item.day} Day</span>
                    )}
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginTop: "12px" }}>
              ⚠️ Ek din miss kiya to streak reset ho jaati hai — roz claim karo!
            </p>
          </div>
        )}

        {/* ══ BETTING TASKS ══ */}
        {activeTab === "betting" && (
          <div className="act-content">
            <div className="bet-banner">
              <span className="bet-banner-icon">🎁</span>
              <div>
                <h3>Daily tasks complete karo</h3>
                <p>Tasks har roz reset hote hain. Same din claim karo.</p>
              </div>
            </div>

            <div className="bet-list">
              {BETTING_TASKS.map((task) => {
                const st       = bettingTasks.find(t => t.taskId === task.id);
                const progress = st?.progress  || 0;
                const claimed  = st?.claimed   || false;
                const completed = progress >= task.target;
                const pct      = Math.min(100, Math.floor((progress / task.target) * 100));

                return (
                  <div key={task.id} className="bet-card">
                    <div className="bet-left">
                      <span className={`bet-status-icon ${completed ? "complete" : ""}`}>
                        {completed ? "✅" : "❌"}
                      </span>
                      <div>
                        <p className="bet-label">{task.label}</p>
                        <p className="bet-prog">{progress.toLocaleString()} / {task.target.toLocaleString()}</p>
                        <div className="bet-bar">
                          <div className="bet-fill" style={{ width: pct + "%" }} />
                        </div>
                      </div>
                    </div>
                    <div className="bet-right">
                      <span className="bet-reward">+₹{task.reward}</span>
                      <button
                        className={`bet-btn ${claimed ? "claimed" : ""} ${!completed || claimed ? "disabled" : ""}`}
                        onClick={() => completed && !claimed && claimBettingTask(task.id)}
                        disabled={loading || claimed || !completed}
                      >
                        {claimed ? "Claimed" : "Go complete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ DEPOSIT BONUS ══ */}
        {activeTab === "deposit" && (
          <div className="act-content">
            <div className="dep-banner">
              <h3>💰 First Deposit Bonus</h3>
              <p>
                Pehli deposit ke amount ke hisab se bonus milega.
                {firstDeposit > 0 && (
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>
                    {" "}Tumhari pehli deposit: ₹{firstDeposit}
                  </span>
                )}
              </p>
            </div>

            <div className="dep-list">
              {DEPOSIT_BONUSES.map((bonus) => {
                const sb      = depositBonuses.find(b => b.bonusId === bonus.id);
                const claimed  = sb?.claimed  || false;
                const eligible = sb?.eligible || false;

                return (
                  <div key={bonus.id} className="dep-card" style={{
                    opacity: !eligible ? 0.55 : 1,
                  }}>
                    <div className="dep-left">
                      <div className="dep-icon">💳</div>
                      <div>
                        <p className="dep-label">{bonus.label}</p>
                        <p className="dep-sub">Min pehli deposit: ₹{bonus.minDeposit}</p>
                      </div>
                    </div>
                    <div className="dep-right">
                      <span className="dep-reward">+₹{bonus.reward}</span>
                      <button
                        className={`dep-btn ${claimed ? "claimed" : ""} ${!eligible || claimed ? "disabled" : ""}`}
                        onClick={() => eligible && !claimed && claimDepositBonus(bonus.id)}
                        disabled={loading || claimed || !eligible}
                      >
                        {claimed   ? "Claimed ✓"  :
                         eligible  ? "Claim"       :
                                     "Locked 🔒"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: "12px", color: "#888", textAlign: "center", padding: "12px" }}>
              ⚠️ Sirf pehli deposit ke amount tak ke bonuses claim ho sakte hain.
            </p>
          </div>
        )}

      </div>
    );
  }

  export default Activity;