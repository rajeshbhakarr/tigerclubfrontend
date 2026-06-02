import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/adminlogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError("");

    if (!username || !password) {
      setError("⚠️ Fill all fields");
      return;
    }

    // 🔐 simple rate limit (3 attempts)
    let attempts = localStorage.getItem("loginAttempts") || 0;

    if (attempts >= 3 ) {
      setError("❌ Too many attempts. Try later");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (username === "admin" && password === "8787") {
        localStorage.setItem("adminAuth", "true");
        localStorage.removeItem("loginAttempts");
        navigate("/admin");
      } else {
        attempts++;
        localStorage.setItem("loginAttempts", attempts);
        setError("❌ Invalid login");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="axl-container">

      <div className="axl-box">

        <h2>🔐 Admin Login</h2>

        {error && <p className="axl-error">{error}</p>}

        <div className="axl-input">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="axl-input">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={() => setShowPass(!showPass)}>
            {showPass ? "🙈" : "👁"}
          </span>
        </div>

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging..." : "Login"}
        </button>

      </div>

    </div>
  );
}

export default AdminLogin;