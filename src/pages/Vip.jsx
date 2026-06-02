import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/vip.css";

const API = "https://indr-backend-production.up.railway.app/api";

const VIP_COLORS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #ffecd2, #fcb69f)",
  "linear-gradient(135deg, #ff9a9e, #fecfef)",
  "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
  "linear-gradient(135deg, #f6d365, #fda085)",
  "linear-gradient(135deg, #89f7fe, #66a6ff)",
  "linear-gradient(135deg, #fddb92, #d1fdff)",
  "linear-gradient(135deg, #96fbc4, #f9f586)",
  "linear-gradient(135deg, #fccb90, #d57eeb)",
  "linear-gradient(135deg, #e0c3fc, #8ec5fc)",
  "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
  "linear-gradient(135deg, #fdfc47, #24fe41)",
  "linear-gradient(135deg, #43cbff, #9708cc)",
  "linear-gradient(135deg, #f77062, #fe5196)",
  "linear-gradient(135deg, #c79081, #dfa579)",
];

function formatNum(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(0) + "Cr";
  if (n >= 100000)   return (n / 100000).toFixed(0)   + "L";
  if (n >= 1000)     return (n / 1000).toFixed(0)     + "K";
  return n.toString();
}

function Vip() {
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [active, setActive] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState({ text: "", type: "" });

  const token = localStorage.getItem("token");

  useEffect(() => { fetchVip(); }, []);

  const fetchVip = async () => {
    try {
      const res  = await fetch(`${API}/vip/status`, {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.currentLevel > 0) setActive(json.currentLevel);
      }
    } catch (err) { console.log(err); }
  };

  const claim = async (vipLevel, claimType) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/vip/claim`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ vipLevel, claimType }),
      });
      const json = await res.json();
      setMsg({ text: json.msg, type: json.success ? "success" : "error" });
      if (json.success) fetchVip();
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const selectedVip = data?.vipLevels?.find(v => v.level === active);

  // Progress to next level
  const getProgress = (level) => {
    if (!data) return 0;
    const vip = data.vipLevels.find(v => v.level === level);
    if (!vip) return 0;
    if (data.totalDeposit >= vip.depositReq) return 100;
    const prev = level === 1 ? 0 : (data.vipLevels.find(v => v.level === level - 1)?.depositReq || 0);
    return Math.min(100, Math.floor(((data.totalDeposit - prev) / (vip.depositReq - prev)) * 100));
  };

  return (
    <div className="vip-page">

      {/* Header */}
      <div className="vip-header">
        <span className="vip-back" onClick={() => navigate(-1)}>←</span>
        <h2>VIP Benefits</h2>
        <span></span>
      </div>

      {/* Toast */}
      {msg.text && <div className={`vip-toast ${msg.type}`}>{msg.text}</div>}

      {/* Stats */}
      {data && (
        <div className="vip-stats">
          <div className="vip-stat-box">
            <span className="vip-stat-val">VIP{data.currentLevel}</span>
            <span className="vip-stat-label">Current Level</span>
          </div>
          <div className="vip-stat-box">
            <span className="vip-stat-val">₹{formatNum(data.totalDeposit || 0)}</span>
            <span className="vip-stat-label">Total Deposit</span>
          </div>
          <div className="vip-stat-box">
            <span className="vip-stat-val">₹{formatNum(data.thisMonthDeposit || 0)}</span>
            <span className="vip-stat-label">This Month</span>
          </div>
        </div>
      )}

      {/* Level Tabs */}
      <div className="vip-tabs">
        {[...Array(20)].map((_, i) => {
          const l   = i + 1;
          const vip = data?.vipLevels?.find(v => v.level === l);
          return (
            <div
              key={l}
              className={`vip-tab ${active === l ? "active" : ""} ${vip?.unlocked ? "unlocked" : "locked"}`}
              onClick={() => setActive(l)}
              style={active === l ? { background: VIP_COLORS[i], color: "#fff", border: "none" } : {}}
            >
              V{l}
            </div>
          );
        })}
      </div>

      {/* Selected VIP Card */}
      {selectedVip && (
        <div className="vip-card" style={{ background: VIP_COLORS[active - 1] }}>
          <div className="vip-card-top">
            <div>
              <h3 className="vip-card-name">VIP {active}</h3>
              <p className="vip-card-sub">
                {selectedVip.unlocked
                  ? "✅ Unlocked"
                  : `🔒 ₹${selectedVip.depositReq.toLocaleString()} deposit karo`}
              </p>
            </div>
            <div className="vip-crown">👑</div>
          </div>

          {/* Progress */}
          <div className="vip-prog-wrap">
            <div className="vip-prog-bar">
              <div className="vip-prog-fill" style={{ width: getProgress(active) + "%" }}></div>
            </div>
            <span className="vip-prog-txt">{getProgress(active)}%</span>
          </div>
          <p className="vip-prog-label">
            ₹{(data?.totalDeposit || 0).toLocaleString()} / ₹{selectedVip.depositReq.toLocaleString()} deposited
          </p>
        </div>
      )}

      {/* Bonus Cards */}
      {selectedVip && (
        <div className="vip-bonuses">

          {/* Level Up Bonus */}
          <div className="vip-bonus-card">
            <div className="vip-bonus-left">
              <span className="vip-bonus-icon">🎁</span>
              <div>
                <p className="vip-bonus-title">Level Up Bonus</p>
                <p className="vip-bonus-sub">Lifetime mein sirf ek baar • ₹{selectedVip.depositReq.toLocaleString()} deposit required</p>
              </div>
            </div>
            <div className="vip-bonus-right">
              <span className="vip-bonus-amt">₹{selectedVip.levelupBonus.toLocaleString()}</span>
              <button
                className={`vip-claim-btn ${selectedVip.levelupClaimed ? "claimed" : ""} ${!selectedVip.unlocked ? "locked" : ""}`}
                onClick={() => selectedVip.unlocked && !selectedVip.levelupClaimed && claim(active, "levelup")}
                disabled={loading || selectedVip.levelupClaimed || !selectedVip.unlocked}
              >
                {selectedVip.levelupClaimed ? "Claimed ✓" : selectedVip.unlocked ? "Claim" : "Locked"}
              </button>
            </div>
          </div>

          {/* Monthly Bonus */}
          <div className="vip-bonus-card">
            <div className="vip-bonus-left">
              <span className="vip-bonus-icon">📅</span>
              <div>
                <p className="vip-bonus-title">Monthly Bonus</p>
                <p className="vip-bonus-sub">
                  Har month • Is month ₹{selectedVip.monthlyDepReq.toLocaleString()} deposit required
                </p>
                <p className="vip-bonus-sub" style={{ color: data?.thisMonthDeposit >= selectedVip.monthlyDepReq ? "#16a34a" : "#ef4444" }}>
                  Is month: ₹{(data?.thisMonthDeposit || 0).toLocaleString()} deposited
                </p>
              </div>
            </div>
            <div className="vip-bonus-right">
              <span className="vip-bonus-amt">₹{selectedVip.monthlyBonus.toLocaleString()}</span>
              <button
                className={`vip-claim-btn ${selectedVip.monthlyClaimed ? "claimed" : ""} ${!selectedVip.monthlyEligible ? "locked" : ""}`}
                onClick={() => selectedVip.monthlyEligible && !selectedVip.monthlyClaimed && claim(active, "monthly")}
                disabled={loading || selectedVip.monthlyClaimed || !selectedVip.monthlyEligible}
              >
                {selectedVip.monthlyClaimed
                  ? "Claimed ✓"
                  : selectedVip.monthlyEligible
                    ? "Claim"
                    : selectedVip.unlocked ? "Deposit Karo" : "Locked"}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Rules */}
      <div className="vip-rules">
        <h4>📋 Rules</h4>
        <p>• Total deposit ke hisaab se VIP level unlock hoga</p>
        <p>• Level Up bonus sirf ek baar milega lifetime</p>
        <p>• Monthly bonus har mahine claim kar sakte ho</p>
        <p>• Monthly bonus ke liye us mahine ka deposit required hai</p>
        <p>• Bonus claim karne ke baad utni bet lagani padegi withdraw ke liye</p>
      </div>

    </div>
  );
}

export default Vip;