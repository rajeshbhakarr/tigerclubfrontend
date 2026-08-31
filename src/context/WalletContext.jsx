import { createContext, useContext, useState, useEffect } from "react";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [user, setUser]       = useState(null);
  const [needToBet, setNeedToBet] = useState(0);   

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      localStorage.setItem("lastLoginTime", Date.now());

      const res  = await fetch("https://tigerclubbackend.onrender.com/api/profile/me", {
        headers: { Authorization: "Bearer " + token },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/loginpage";
        return;
      }

      const data = await res.json();

     if (data.success) {
  console.log("Context updated with wallet:", data.user.wallet); // Debugging ke liye
const w = Number(data.user.wallet) || 0;
const c = Number(data.user.coins) || 0;
setBalance(Math.max(w, c));
setUser(data.user);
setNeedToBet(data.user.needToBet || 0);
}
    } catch (err) {
      console.log("fetchBalance error:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchBalance();



    const interval = setInterval(() => {
      const t = localStorage.getItem("token");
      if (t) fetchBalance();
    }, 100000);


    return () => clearInterval(interval);
  }, []);

  return (
    <WalletContext.Provider value={{ balance, setBalance, fetchBalance, user, setUser, needToBet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);   