import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import axios from "axios";
import { useWallet } from "../context/WalletContext";


const API = "https://indr-backend-77tp.onrender.com/api";
const LoginPage = () => {

  const { fetchBalance } = useWallet();

  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone || !password) {
      setError("Phone aur password dono bharo!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API}/auth/login`, {
  mobile: phone,
  password,
});

      if (res.data.success) {
  localStorage.setItem("token", res.data.token);
  
    localStorage.setItem("lastLoginTime", Date.now()); 

  localStorage.setItem("uid", res.data.user.uid);
localStorage.setItem("mobile", res.data.user.mobile);
localStorage.setItem("user", JSON.stringify(res.data.user));
  
  // ✅ await mat lagao — background mein chalega
  fetchBalance();
  
  if (remember) {
    localStorage.setItem("savedPhone", phone);
    localStorage.setItem("savedPassword", password);
  } else {
    localStorage.removeItem("savedPhone");
    localStorage.removeItem("savedPassword");
  }
  
  navigate("/"); // ✅ turant navigate karo

      } else {
        setError(res.data.msg || "Login failed!"); // ✅ message → msg
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Server error! Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Remember password load karo
  React.useEffect(() => {
    const savedPhone = localStorage.getItem("savedPhone");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedPhone) setPhone(savedPhone);
    if (savedPassword) setPassword(savedPassword);
    if (savedPhone && savedPassword) setRemember(true);
  }, []);

  return (
    <div className="login-container">
      {/* Header */}
      <div className="header">
        <span className="back-icon" onClick={() => navigate(-1)}>
          ‹
        </span>
        <div className="header-title">
          <span className="logo-icon">INDR</span>
        </div>
        <div className="lang-selector">🇺🇸 EN</div>
      </div>

      <div className="form-section">
        {/* Error message */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "12px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Phone */}
        <div className="input-group">
          <div className="label-container">
            <span className="icon">📱</span> Phone number
          </div>
          <div className="input-wrapper">
            <div className="country-code">+91</div>
            <input
              type="text"
              placeholder="phone number"
              className="main-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
            />
          </div>
        </div>

        {/* Password */}
        <div className="input-group">
          <div className="label-container">
            <span className="icon">🔒</span> Password
          </div>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="please enter password"
              className="main-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        {/* Remember */}
        <div className="remember-me">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="remember">Remember password</label>
        </div>

        {/* Login Button */}
        <button
          className="btn-login"
          onClick={handleLogin}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <button className="btn-register" onClick={() => navigate("/register")}>
          Register
        </button>

        {/* Footer */}
        <div className="footer-links">
          <div className="icon-link">
            <div className="footer-icon">🔒</div>
            <span>Forgot password</span>
          </div>
         <div
  className="icon-link"
  onClick={() => navigate("/customersupport")}
  style={{ cursor: "pointer" }}
>
  <div className="footer-icon">💬</div>
  <span>Customer Service</span>
</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
