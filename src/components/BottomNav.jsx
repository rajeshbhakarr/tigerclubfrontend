import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/bottom.css";

const BottomNav = () => {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">

      <div className="nav-item" onClick={() => navigate("/")}>
        <span>🏠</span>
        <p>Home</p>
      </div>

      <div className="nav-item"   onClick={() => navigate("/Activity")} >
        <span>📊</span>
        <p  >Activity</p>
      </div>

      <div className="nav-item center">
        <div className="go">GO</div>
        <p>Spin</p>
      </div>

      <div className="nav-item"    onClick={() => navigate("/promotion")}  >
        <span  className="spark" >💰</span>
        <p>Promotion</p>
      </div>

      <div className="nav-item" onClick={() => navigate("/profile")}>
        <span>👤</span>
        <p>Profile</p>
      </div>

    </div>
  );
};

export default BottomNav;