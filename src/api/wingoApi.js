const API_URL = "https://tigerclubbackend.onrender.com";

// Bet place karna
export const placeBet = async (data) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/wingo/bet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("placeBet API error:", err);
    return { success: false, message: "Network error" };
  }
};

// My bet history
export const getMyBets = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/wingo/my-bets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("getMyBets API error:", err);
    return { success: false, bets: [] };
  }
};