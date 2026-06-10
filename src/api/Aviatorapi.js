// src/api/aviatorApi.js
const API_URL = "https://tigerclubbackend.onrender.com";

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

export const getRecentCrashes = async () => {
  const res = await fetch(`${API_URL}/api/aviator/recent-crashes`);
  return res.json();
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


export const getActiveBet = async () => {
  const res = await fetch(`${API_URL}/api/aviator/active-bet`, {
    headers: authHeaders(),
  });
  return res.json();
};