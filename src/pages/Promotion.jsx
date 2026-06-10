import React, { useEffect, useState } from "react";
import "../styles/promotion.css";
import { useNavigate } from "react-router-dom";

function Promotion() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    yesterdayCommission: 0,
    totalInvite: 0,
    totalDeposit: 0,
    inviteCode: "",
    weeklyCommission: 0,
    totalCommission: 0,
    referrals: [],
  });
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPromotionData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://tigerclubbackendonrender.com/api/promotion", {
        headers: { Authorization: "Bearer " + token },
      });
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.log("Promotion API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromotionData(); }, []);

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${data.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="promo-page">

      {/* HEADER */}
      <div className="promo-header">
        <button className="promo-back-btn" onClick={() => navigate("/")}>&#8592;</button>
        <h1 className="promo-header-title">Promotion</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* YESTERDAY COMMISSION */}
      <div className="promo-hero-card">
        <div className="promo-hero-icon">💰</div>
        <div className="promo-hero-amount">₹{Number(data.yesterdayCommission).toLocaleString()}</div>
        <div className="promo-hero-label">Yesterday Total Commission</div>
        <div className="promo-hero-hint">Invite more friends to earn more!</div>
      </div>

      {/* STATS ROW */}
      <div className="promo-stats-row">
        <div className="promo-stat-card promo-stat-invite">
          <div className="promo-stat-icon">👥</div>
          <div className="promo-stat-value">{data.totalInvite}</div>
          <div className="promo-stat-label">Total Invites</div>
        </div>
        <div className="promo-stat-card promo-stat-deposit">
          <div className="promo-stat-icon">💳</div>
          <div className="promo-stat-value">₹{Number(data.totalDeposit).toLocaleString()}</div>
          <div className="promo-stat-label"> Your Total Deposit</div>
        </div>
      </div>

      {/* INVITE CODE SECTION */}
      <div className="promo-invite-section">
        <div className="promo-section-title">Your Invite Code</div>
        <div className="promo-code-box">
          <span className="promo-code-text">{data.inviteCode || "Loading..."}</span>
          <button className="promo-code-copy-btn" onClick={copyCode}>
            {codeCopied ? "✅ Copied!" : "📋 Copy"}
          </button>
        </div>

        <button className="promo-invite-btn" onClick={copyLink}>
          <span className="promo-invite-btn-icon">🔗</span>
          {copied ? "✅ Link Copied!" : "Share Invitation Link"}
        </button>

        <div className="promo-invite-url">
          {window.location.origin}/register?ref={data.inviteCode || "..."}
        </div>
      </div>

      {/* COMMISSION DETAILS */}
      <div className="promo-commission-section">
        <div className="promo-section-title">Commission Details</div>
        <div className="promo-commission-grid">
          <div className="promo-commission-card">
            <div className="promo-commission-icon">📅</div>
            <div className="promo-commission-amount">₹{Number(data.weeklyCommission).toLocaleString()}</div>
            <div className="promo-commission-label">This Week</div>
          </div>
          <div className="promo-commission-card">
            <div className="promo-commission-icon">🏆</div>
            <div className="promo-commission-amount">₹{Number(data.totalCommission).toLocaleString()}</div>
            <div className="promo-commission-label">Total Commission</div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="promo-how-section">
        <div className="promo-section-title">How It Works</div>
        <div className="promo-steps">
          <div className="promo-step">
            <div className="promo-step-num">1</div>
            <div className="promo-step-text">Share your invite link with friends</div>
          </div>
          <div className="promo-step-arrow">→</div>
          <div className="promo-step">
            <div className="promo-step-num">2</div>
            <div className="promo-step-text">Friend registers & deposits</div>
          </div>
          <div className="promo-step-arrow">→</div>
          <div className="promo-step">
            <div className="promo-step-num">3</div>
            <div className="promo-step-text">You earn commission automatically</div>
          </div>
        </div>
      </div>

      {/* REFERRAL LIST */}
      {data.referrals && data.referrals.length > 0 && (
        <div className="promo-referral-section">
          <div className="promo-section-title">My Referrals ({data.referrals.length})</div>
          <div className="promo-referral-list">
            {data.referrals.map((r, i) => (
              <div key={i} className="promo-referral-item">
                <div className="promo-referral-avatar">{(r.username || "U")[0].toUpperCase()}</div>
                <div className="promo-referral-info">
                  <div className="promo-referral-name">{r.username || "User"}</div>
                  <div className="promo-referral-date">{r.joinDate ? new Date(r.joinDate).toLocaleDateString() : "—"}</div>
                </div>
                <div className="promo-referral-deposit">₹{Number(r.totalDeposit || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}

export default Promotion;