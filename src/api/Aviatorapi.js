// src/api/aviatorApi.js
const API_URL = "https://indr-backend-77tp.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getAviatorState = async () => {
  const res = await fetch(`${API_URL}/api/aviator/state`);
  return res.json();
};

export const placeBet = async ({ amount, autoCashout }) => {
  const res = await fetch(`${API_URL}/api/aviator/bet`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ amount, autoCashout }),
  });
  return res.json();
};

export const cashout = async (betId) => {
  const res = await fetch(`${API_URL}/api/aviator/cashout`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ betId }),
  });
  return res.json();
};

export const getMyBets = async () => {
  const res = await fetch(`${API_URL}/api/aviator/my-bets`, {
    headers: authHeaders(),
  });
  return res.json();
};

exports.getRecentCrashes = (req, res) => {
  const { getRoundHistory } = require("../services/aviatorEngine");
  const history = getRoundHistory();
  return res.json({ success: true, crashes: history });
};

export const cancelBet = async (betId) => {
  const res = await fetch(`${API_URL}/api/aviator/cancel-bet`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ betId }),
  });
  return res.json();
};

// SSE stream
export const createAviatorStream = (onMessage) => {
  const es = new EventSource(`${API_URL}/api/aviator/stream`);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch {}
  };
  es.onerror = () => es.close();
  return es;
};


exports.getActiveBet = async (req, res) => {
  try {
    const state = require("../services/aviatorEngine").getState();
    const bet = await AviatorBet.findOne({
      user: req.user._id,
      roundId: state.roundId,
      result: "pending",
    }).sort({ createdAt: -1 });

    return res.json({ success: true, bet });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};