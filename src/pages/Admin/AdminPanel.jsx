import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/adminpanel.css";

import AdminChat from "./sections/AdminChat";

import Dashboard from "./sections/Dashboard";
import Users from "./sections/Users";
import Requests from "./sections/Requests";
import WinGoManager from "./sections/WinGoManager";
import DragonManager from "./sections/DragonManager";
import AdminNotification from "./sections/AdminNotification";
import AviatorManager from "./sections/AviatorManager";
import DepositSettings from "./sections/Depositsettings";



function AdminPanel() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "aviator":
        return <AviatorManager />;

      case "notification":
        return <AdminNotification />;

      case "wingo":
        return <WinGoManager />;

      case "dragon":
        return <DragonManager />;
case "game-control":
  return <GameControl />; 
  case "depositsettings":
  return <DepositSettings />; 

      case "users":
        return <Users />;

     

      case "requests":
        return <Requests />;

      
      case "chat":
        return <AdminChat />;

      default:
        return <Dashboard />;
    }
  };




  return (
    <div className="adminpanelpage">
      {/* SIDEBAR */}
      <div className={`axp-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <h2 className="axp-logo">🎮 Admin</h2>

        <button
          className={activePage === "dashboard" ? "active" : ""}
          onClick={() => setActivePage("dashboard")}
        >
          Dashboard
        </button>

        {/* ✅ WinGo Manager */}
        <button
          className={activePage === "wingo" ? "active" : ""}
          onClick={() => setActivePage("wingo")}
        >
          WinGo Manager
        </button>

        {/* ✅ Dragon Manager */}
        <button
          className={activePage === "dragon" ? "active" : ""}
          onClick={() => setActivePage("dragon")}
        >
          Dragon Manager
        </button>

        {/* ✅ Aviator Manager */}
        <button
          className={activePage === "aviator" ? "active" : ""}
          onClick={() => setActivePage("aviator")}
        >
          Aviator Manager
        </button>

        <button
          className={activePage === "users" ? "active" : ""}
          onClick={() => setActivePage("users")}
        >
          Users
        </button>


        <button
          className={activePage === "requests" ? "active" : ""}
          onClick={() => setActivePage("requests")}
        >
          Requests
        </button>

       

        <button
          className={activePage === "chat" ? "active" : ""}
          onClick={() => setActivePage("chat")}
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
          }}
        >
          💬 Customer Chat
        </button>


        <button
          className={activePage === "notification" ? "active" : ""}
          onClick={() => setActivePage("notification")}
        >
          🔔 Notifications
        </button>




{/* <button
  className={activePage === "depositsettings" ? "active" : ""}
  onClick={() => setActivePage("depositsettings")}
>
  Deposit settings
</button> */}




        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("adminAuth");
            window.location.href = "/admin/login";
          }}
        >
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="axp-content">
        {/* TOP BAR */}
        <div className="axp-topbar">
          <button
            className="axp-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h3>Admin Panel</h3>
        </div>

        {renderPage()}
      </div>






    </div>
  );
}

export default AdminPanel;
