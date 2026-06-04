import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/register.css";
import axios from "axios";

const API = "https://indr-backend-77tp.onrender.com

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
  const refFromUrl = searchParams.get("ref");
  if (refFromUrl) {
    localStorage.removeItem("token");      // purana login hatao
    localStorage.removeItem("uid");        // purana uid hatao
    localStorage.removeItem("mobile");     // purana mobile hatao
  }
}, []);

  // 🔥 URL se ref code auto fill
  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    if (refFromUrl) {
      setInviteCode(refFromUrl);
    }
  }, [searchParams]);

  const handleRegister = async () => {
    setError("");
    if (!name) return setError("Naam bharo!");
    if (!phone) return setError("Phone number bharo!");
    if (phone.length !== 10) return setError("Phone 10 digit ka hona chahiye!");
    if (!password) return setError("Password bharo!");
    if (password.length < 6) return setError("Password kam se kam 6 characters ka ho!");
    if (password !== confirmPassword) return setError("Password match nahi kar raha!");
    if (!agreed) return setError("Privacy Agreement accept karo!");

    try {
      setLoading(true);
      const res = await axios.post(`${API}/auth/register`, {
        username: name,
        mobile: phone,
        password,
        refCode: inviteCode, // 🔥 refer code backend ko jayega
      });

      if (res.data.success) {
        alert("✅ Registration successful! Ab login karo.");
        navigate("/loginpage");
      } else {
        setError(res.data.msg || "Registration failed!");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Server error! Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-header">
        <div className="top-row">
          <span className="back" onClick={() => navigate("/loginpage")}>←</span>
          <h2>INDR</h2>
          <span className="lang">EN</span>
        </div>
        <p>Please register by your phone number</p>
      </div>

      <div className="register-body">
        <p className="ttiitle">Register your Phone Number</p>

        {error && (
          <div style={{
            background: "#fee2e2", color: "#dc2626", padding: "10px",
            borderRadius: "8px", marginBottom: "12px", fontSize: "14px", textAlign: "center",
          }}>
            ❌ {error}
          </div>
        )}

        <label>Full Name</label>
        <div className="input-box">
          <input type="text" placeholder="Please enter your name"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <label>Phone number</label>
        <div className="phone-box">
          <span className="code">+91</span>
          <input type="text" placeholder="Please enter the phone number"
            value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} />
        </div>

        <label>Set password</label>
        <div className="input-box">
          <input type={showPass ? "text" : "password"} placeholder="Set password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <span onClick={() => setShowPass(!showPass)} style={{ cursor: "pointer" }}>
            {showPass ? "🙈" : "👁️"}
          </span>
        </div>

        <label>Confirm password</label>
        <div className="input-box">
          <input type={showConfirm ? "text" : "password"} placeholder="Confirm password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <span onClick={() => setShowConfirm(!showConfirm)} style={{ cursor: "pointer" }}>
            {showConfirm ? "🙈" : "👁️"}
          </span>
        </div>

        {/* 🔥 Invite code - URL se auto fill hoga */}
        <label>Invite code</label>
        <div className="input-box">
          <input type="text" placeholder="Please enter the invitation code"
            value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
        </div>

        <div className="agree">
          <input type="checkbox" checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)} />
          <span>I have read and agree [Privacy Agreement]</span>
        </div>

        <button className="register-btn" onClick={handleRegister}
          disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="login-link">
          I have an account{" "}
          <span onClick={() => navigate("/loginpage")}
            style={{ cursor: "pointer", color: "#e11d48" }}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;