import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { WalletProvider } from "./context/WalletContext";

import AdminLogin from "./pages/Admin/AdminLogin";
import AdminPanel from "./pages/Admin/AdminPanel";
import AdminChat from "./pages/Admin/sections/AdminChat";

import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";

import Home from "./pages/Home";
import WinGo from "./pages/WinGo";
import Profile from "./pages/profile";
import Activity from "./pages/Activity";
import BottomNav from "./components/BottomNav";
import Payment from "./pages/Payment";
import Wallet from "./pages/Wallet";
import PaymentStatus from "./pages/PaymentStatus";
import Deposit from "./pages/Deposit";
import Dragontiger from "./pages/Dragontiger";
import Bethistory from "./pages/Bethistory";
import Deposithistory from "./pages/Deposithistory";
import Withdraw from "./pages/Withdraw";
import Withdrawhistory from "./pages/Withdrawhistory";
import AddBank from "./pages/AddBank";
import AddUpi from "./pages/AddUpi";
import BankList from "./pages/BankList";
import UpiList from "./pages/UpiList";
import Customersupport from "./pages/Customersupport";
import ChatPage from "./pages/ChatPage";
import Vip from "./pages/Vip";
import Promotion from "./pages/Promotion";
import Notification from "./pages/Notification";
import Aviator from "./pages/Aviator";

// ✅ Agar login nahi hai to login page pe bhejo
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/loginpage" replace />;
  }
  return children;
}

// ✅ Agar login hai to login page pe jaane se roko
function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
}



function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const uid = localStorage.getItem("uid");

  // ✅ Sirf admin UID allow
  if (uid !== "100000") {
    return <Navigate to="/" replace />;
  }

  return children;
}




function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </WalletProvider>
  );
}

// AppContent function mein sabse upar add karo:
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 2 din wala auto logout check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const lastLogin = localStorage.getItem("lastLoginTime");
      if (lastLogin) {
        const diff = Date.now() - Number(lastLogin);
        const twoDays = 2 * 24 * 60 * 60 * 1000; // 2 din milliseconds mein
        if (diff > twoDays) {
          // 2 din se zyada — logout karo
          localStorage.removeItem("token");
          localStorage.removeItem("lastLoginTime");
          localStorage.removeItem("savedPhone");
          localStorage.removeItem("savedPassword");
          navigate("/loginpage");
        }
      }
    }
  }, []);

  // 👉 hide navbar routes
  const hideNavbarRoutes = [
    "/withdraw",
    "/bank-list",
    "/wingo",
    "/upi-list",
    "/add-bank",
    "/add-upi",
    "/dragontiger",
    "/deposit",
    "/support",
    "/chat/deposit",
    "/chat/withdraw",
    "/chat/game",
    "/admin",
    "/admin/dashboard",
    "/admin/game",
    "/admin/bets",
    "/admin/users",
    "/admin/requests",
    "/admin/login",
    "/loginpage",
    "/register",
    "/aviator",

    "/vip", // ✅ YE ADD KAR

    "/wallet",
    "/payment-status",
  ];

  const hideNavbar =
    hideNavbarRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/admin");
  return (
    <div
      className={`app-container ${location.pathname.startsWith("/admin") ? "admin-full" : ""}`}
      style={{
        paddingBottom: hideNavbar ? "0px" : "70px",
      }}
    >
      <Routes>
        {/* USER ROUTES */}
        {/* Login page - agar already login hai to home pe bhejo */}
        <Route
          path="/loginpage"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - agar login nahi hai to login pe bhejo */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wingo"
          element={
            <ProtectedRoute>
              <WinGo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aviator"
          element={
            <ProtectedRoute>
              <Aviator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dragontiger"
          element={
            <ProtectedRoute>
              <Dragontiger />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/deposit"
          element={
            <ProtectedRoute>
              <Deposit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <Withdraw />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bethistory"
          element={
            <ProtectedRoute>
              <Bethistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/deposithistory"
          element={
            <ProtectedRoute>
              <Deposithistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/withdrawhistory"
          element={
            <ProtectedRoute>
              <Withdrawhistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vip"
          element={
            <ProtectedRoute>
              <Vip />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Promotion"
          element={
            <ProtectedRoute>
              <Promotion />
            </ProtectedRoute>
          }
        />



<Route
  path="/admin"
  element={
    <ProtectedAdminRoute>
      <AdminPanel />
    </ProtectedAdminRoute>
  }
/>

        {/* Baaki routes same rahenge */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-status" element={<PaymentStatus />} />
        <Route path="/add-bank" element={<AddBank />} />
        <Route path="/add-upi" element={<AddUpi />} />
        <Route path="/bank-list" element={<BankList />} />
        <Route path="/upi-list" element={<UpiList />} />
        <Route path="/customersupport" element={<Customersupport />} />
        <Route path="/chat/:type" element={<ChatPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/chat" element={<AdminChat />} />
        <Route path="/notification" element={<Notification />} />
      </Routes>

      {/* ✅ Bottom Nav */}
      {!hideNavbar && <BottomNav />}
    </div>
  );
}

export default App;
