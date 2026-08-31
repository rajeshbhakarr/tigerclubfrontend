import axios from "axios";

const API = "https://tigerclubbackend.onrender.com/api";

// 🔑 Get latest token
const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// 🎮 Get game state
export const getGameState = async () => {
  try {
    const res = await axios.get(`${API}/mines/state`);
    return res.data;
  } catch (err) {
    console.error("❌ Get state error:", err.response?.data?.msg || err.message);
    throw err;
  }
};

// 💸 Place bet
export const placeBet = async (amount, roundId) => {
  try {
    const res = await axios.post(
      `${API}/mines/bet`,
      {
        amount,
        roundId,
      },
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("❌ Place bet error:", err.response?.data?.msg || err.message);
    throw err;
  }
};

// 🎯 Reveal tile
export const revealTile = async (roundId, tileIndex) => {
  try {
    const res = await axios.post(
      `${API}/mines/reveal-tile`,
      {
        roundId,
        tileIndex,
      },
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("❌ Reveal error:", err.response?.data?.msg || err.message);
    throw err;
  }
};

// 💰 Cashout
export const cashoutBet = async (roundId) => {
  try {
    const res = await axios.post(
      `${API}/mines/cashout`,
      {
        roundId,
      },
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("❌ Cashout error:", err.response?.data?.msg || err.message);
    throw err;
  }
};



// 📋 Get bet history
export const getMyBets = async (limit = 20) => {
  try {
    const res = await axios.get(
      `${API}/mines/my-bets?limit=${limit}`,
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("❌ Get bets error:", err.response?.data?.msg || err.message);
    throw err;
  }
};




// 📊 Get latest results
export const getLatestResults = async () => {
  try {
    const res = await axios.get(`${API}/mines/latest-results`);
    return res.data;
  } catch (err) {
    console.error("❌ Get results error:", err.response?.data?.msg || err.message);
    throw err;
  }
};