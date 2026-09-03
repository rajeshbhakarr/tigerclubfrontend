import axios from "axios";

const API = "https://indr-backend-77tp.onrender.com/api";

// 🎰 Place bet (deduct from wallet)
export const placeBet = async (betAmount) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API}/fortunegems/bet`,
      { betAmount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err) {
    console.error("Bet error:", err);
    throw err;
  }
};

// 🎰 Spin reels
export const spinReels = async (roundId, reels, winAmount) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API}/fortunegems/spin`,
      { roundId, reels, winAmount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err) {
    console.error("Spin error:", err);
    throw err;
  }
};

// 💰 Get wallet balance
export const getBalance = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${API}/auth/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.user.wallet;
  } catch (err) {
    console.error("Balance error:", err);
    throw err;
  }
};

// 📋 Get bet history
export const getBetHistory = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${API}/fortunegems/history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err) {
    console.error("History error:", err);
    throw err;
  }
};