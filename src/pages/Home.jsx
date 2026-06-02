import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import axios from "axios";
import Swal from "sweetalert2";
import "./home.css";

const Home = () => {
const { balance, user } = useWallet();  
const navigate = useNavigate();
const openGame = (path) => {
  if ((user?.totalDeposit || 0) < 0) {
    Swal.fire({
      icon: "warning",
      title: "Deposit Required",
      text: "Minimum ₹100 deposit required",
      confirmButtonText: "Deposit",
      width: "260px",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/deposit");
      }
    });

    return;
  }

  navigate(path);
};
  return (
    <div className="home">
      {/* HEADER */}
      <div className="indr">
        <img src="src/assets/inder.png" className="log" alt="logo" />
        <p className="ind">INDR</p>
      </div>

      {/* TOP NAV */}
      <div className="top-nav">
        <div className="nav active">🏠 Lobby</div>
        <div className="nav">🎮 Mini</div>
        <div className="nav">🎰 Slots</div>
        <div className="nav">🃏 Card</div>
        <div className="nav">🎣 Fish</div>
      </div>

      {/* BANNER */}
      <img src="src/assets/logoo.png" className="logoo" alt="banner" />

      {/* WALLET */}
      <div className="wallet">
        <div className="wallet-left">
          <p>Wallet Balance 🔄</p>
          <h2>₹{balance?.toFixed(2)}</h2>
        </div>

        <div className="wallet-btns">
          <button className="deposit" onClick={() => navigate("/deposit")}>
            DEPOSIT
          </button>
          <button className="withdraw" onClick={() => navigate("/withdraw")}>
            WITHDRAW
          </button>
        </div>
      </div>

      {/* RECOMMENDED */}
      <div className="section">
        <div className="titlee"  style={{fontSize:"20px"}} >⭐ Recommended Games</div>

        <div className="scroll-roww">
          <img
            src="src/assets/wingo.png"
            className="ccarddd redd"
            alt="wingo"
onClick={() => openGame("/wingo")}            style={{ cursor: "pointer" }}
          />
          <img src="src/assets/mines.jpeg" className="carddd greenn " />
          <img src="src/assets/aviator.jpeg" className="carddd orange"   onClick={() => openGame("/aviator")} />
        </div>
      </div>

      {/* LOTTERY */}
      <div className="section"> 
        <div className="lottery-title">🎱 Lottery</div>
        <p className="sub">Fun, fair and safe</p>

        <div className="grid">
          <div className="game-card">
            <img
              src="src/assets/wingooo.jpeg"
onClick={() => openGame("/wingo")}            />
          </div>

          <div className="game-card">
            <img src="src/assets/k3.png" />
          </div>

          <div className="game-card">
            <img src="src/assets/5d.png" />
          </div>

          <div className="game-card">
            <img src="src/assets/trxx.png" />
          </div>
        </div>

        <img
          src="src/assets/dragon.png"
onClick={() => openGame("/dragontiger")}          className="dragon"
        />
      </div>

      {/* INFO */}
      <div className="info-box">
        <h3>🎮 INDR GAME</h3>
        <p>
          INDR GAME ek fast & exciting online gaming platform hai jahan aap
          WinGo, K3, 5D aur TRX khel sakte ho.
        </p>
        <p>🚀 Play karo aur jeetne ka mauka pao!</p>
      </div>

      <br />

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div>
          🏠<p>Home</p>
        </div>
        <div>
          📊<p>Activity</p>
        </div>
        <div className="go">GO</div>
        <div>
          💰<p>Promotion</p>
        </div>
        <div>
          👤<p>Profile</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
