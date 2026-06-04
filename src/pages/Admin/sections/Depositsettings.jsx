import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://indr-backend-77tp.onrender.com/api";

function DepositSettings() {
  const [upiId, setUpiId] = useState("");
  const [qrImage, setQrImage] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // success | error

  // Load current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(API + "/admin/deposit-settings", {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.data.success) {
        setUpiId(res.data.upiId || "");
        if (res.data.qrImage) {
          setQrPreview(res.data.qrImage);
        }
      }
    } catch (e) {
      console.log("Error loading settings:", e.message);
    }
  };

  const handleQrImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrImage(file);
      // Preview
      const reader = new FileReader();
      reader.onload = (event) => setQrPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMsg("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("upiId", upiId);
      if (qrImage) formData.append("qrImage", qrImage);

      const res = await axios.post(API + "/admin/deposit-settings", formData, {
        headers: {
  Authorization: "Bearer " + token,
},
      });

      if (res.data.success) {
        setMsg("✅ Settings updated successfully!");
        setMsgType("success");
        setQrImage(null);
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg("❌ " + (res.data.message || "Error updating settings"));
        setMsgType("error");
      }
    } catch (e) {
  console.log("FULL FRONTEND ERROR =>", e);
  console.log("RESPONSE =>", e.response);
  console.log("DATA =>", e.response?.data);

  setMsg("❌ " + (e.response?.data?.message || e.message));
  setMsgType("error");
}

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>💳 Deposit Settings</h1>
        <p style={styles.subtitle}>QR Code aur UPI ID configure karein</p>
      </div>

      {/* Message */}
      {msg && (
        <div
          style={{
            ...styles.msgBox,
            background: msgType === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${msgType === "success" ? "#86efac" : "#fca5a5"}`,
            color: msgType === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {msg}
        </div>
      )}

      <div style={styles.cardsContainer}>
        {/* UPI ID Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📱</span>
            <h2 style={styles.cardTitle}>UPI ID</h2>
          </div>

          <label style={styles.label}>UPI ID (example: yourname@okhdfcbank)</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="example@upi"
            style={styles.input}
          />
          <p style={styles.helpText}>
            Ye UPI ID users ke wallet se paise lene ke liye use hota hai
          </p>
        </div>

        {/* QR Code Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📷</span>
            <h2 style={styles.cardTitle}>QR Code Image</h2>
          </div>

          {qrPreview && (
            <div style={styles.qrPreviewContainer}>
              <img src={qrPreview} alt="QR Preview" style={styles.qrImage} />
              <p style={styles.previewLabel}>Current QR Code</p>
            </div>
          )}

          <label style={styles.label}>Upload New QR Code</label>
          <div style={styles.uploadBox}>
            <input
              type="file"
              accept="image/*"
              onChange={handleQrImageChange}
              style={styles.fileInput}
            />
            <div style={styles.uploadLabel}>
              <span style={styles.uploadIcon}>📤</span>
              <p>Click or drag image here</p>
              <p style={styles.uploadHint}>PNG, JPG supported (Max 5MB)</p>
            </div>
          </div>

          {qrImage && (
            <p style={styles.selectedFile}>
              ✅ Selected: {qrImage.name} ({(qrImage.size / 1024).toFixed(2)} KB)
            </p>
          )}

          <p style={styles.helpText}>
            Users is QR code ko scan karke payment karega
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSave} disabled={loading}>
        {loading ? "🔄 Saving..." : "💾 Save Changes"}
      </button>

      {/* Info Box */}
      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>ℹ️ Kaise Kaam Karta Hai</h3>
        <ul style={styles.infoList}>
          <li>
            <strong>Deposit Page:</strong> Users ko ye QR code aur UPI ID dekhte hain
          </li>
          <li>
            <strong>QR Scan:</strong> Users QR code scan karke directly payment app khul jayega
          </li>
          <li>
            <strong>UPI ID:</strong> Manual entry ke liye ya payment confirmation ke liye
          </li>
          <li>
            <strong>Update Karo:</strong> Jab bhi UPI ID change ho ya QR change karna ho
          </li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },

  header: {
    marginBottom: 30,
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 8px 0",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: 0,
  },

  msgBox: {
    padding: "14px 18px",
    borderRadius: 12,
    marginBottom: 20,
    fontWeight: 600,
    border: "1px solid",
    fontSize: 14,
  },

  cardsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    marginBottom: 30,
  },

  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "2px solid #f1f5f9",
  },

  cardIcon: {
    fontSize: 28,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'Courier New','monospace'",
    boxSizing: "border-box",
    marginBottom: 12,
    transition: "all 0.2s",
    outline: "none",
  },

  uploadBox: {
    border: "2px dashed #cbd5e1",
    borderRadius: 12,
    padding: 24,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#f8fafc",
    position: "relative",
    marginBottom: 12,
  },

  fileInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
    left: 0,
    top: 0,
    zIndex: 2,
  },

  uploadLabel: {
    position: "relative",
    zIndex: 1,
    pointerEvents: "none",
  },

  uploadIcon: {
    fontSize: 28,
    display: "block",
    marginBottom: 6,
  },

  uploadHint: {
    fontSize: 12,
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },

  qrPreviewContainer: {
    textAlign: "center",
    marginBottom: 20,
    padding: 16,
    background: "#f1f5f9",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  },

  qrImage: {
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: 10,
    border: "2px solid #e2e8f0",
  },

  previewLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
    fontWeight: 600,
  },

  selectedFile: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: 600,
    padding: "8px 12px",
    background: "#f0fdf4",
    borderRadius: 8,
    border: "1px solid #86efac",
    marginBottom: 12,
  },

  helpText: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
    margin: 0,
  },

  saveBtn: {
    width: "100%",
    maxWidth: 400,
    display: "block",
    margin: "0 auto 30px",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(37,99,235,0.3)",
    transition: "all 0.2s",
  },

  infoBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: 20,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1e40af",
    marginTop: 0,
    marginBottom: 12,
  },

  infoList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
};

export default DepositSettings;