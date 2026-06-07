import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/chat.css";
import axios from "axios";




let guestId = localStorage.getItem("guestId");

if (!guestId) {
  guestId = "guest_" + Date.now();
  localStorage.setItem("guestId", guestId);
}

const API = "https://indr-backend-77tp.onrender.com";

const BOT_MSG = {
  deposit:
    "Namaskar! 🙏\nDeposit issue ke liye ye details bhejein:\n\n• UID\n• Name\n• Order ID\n• UTR Number\n• Payment Screenshot",
  withdraw:
    "Namaskar! 🙏\nWithdraw issue ke liye ye details bhejein:\n\n• UID\n• Name\n• Withdraw Amount\n• Issue Detail",
  game: "Namaskar! 🙏\nGame issue ke liye clearly describe karein:\n\n• Game Name\n• Round ID\n• Issue Detail",
};

function ChatPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const fileRef = useRef();

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const token = localStorage.getItem("token");

  // ── Chat pehli baar load karo ────────────────────────────
  useEffect(() => {
    const loadChat = async () => {
      try {
const res = await axios.get(`${API}/api/chat/my/${type}`, {         headers: {
  "guest-id": guestId,
},
        });
        setChatId(res.data.chat._id);
        setMessages(res.data.chat.messages || []);
      } catch (err) {
        console.log(err);
      }
    };
    loadChat();
  }, [type]);

  // ── Auto refresh har 3 sec ───────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
const res = await axios.get(`${API}/api/chat/my/${type}`, {  headers: {
    Authorization: "Bearer " + token,
    "guest-id": guestId,
  },
}); 
        setMessages(res.data.chat.messages || []);
      } catch (err) {
        console.log(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [type]);

  // ── Auto scroll ──────────────────────────────────────────
  // ── Auto scroll ──────────────────────────────────────────
  const prevMsgCount = useRef(0);

  useEffect(() => {
    const newCount = messages.length;
    if (newCount > prevMsgCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = newCount;
  }, [messages]);

  // ── Image select ─────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };
  // ── Image compress ────────────────────────────────────────
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 600;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
      };
    });
  };
  // ── Message bhejo ────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() && !image) return;
    setLoading(true);

    try {
      let imageUrl = null;

      if (image) {
        imageUrl = await compressImage(image); // ✅ compress karke bhejo
      }

    const res = await axios.post(
  `${API}/api/chat/send/${type}`,
  { text: input, imageUrl },
  {
    headers: {
      Authorization: "Bearer " + token,
      "guest-id": guestId,
    },
  }
);

      setMessages(res.data.chat.messages);
      setInput("");
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <span className="back-btn" onClick={() => navigate(-1)}>
          ←
        </span>
        <p>Customer Support — {type.charAt(0).toUpperCase() + type.slice(1)}</p>
      </div>

      <div className="chat-body">
        <div className="msg bot">
          {BOT_MSG[type]?.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </div>

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg ${msg.sender === "user" ? "user" : "bot"}`}
            style={{
              background: msg.imageUrl && !msg.text ? "transparent" : "", // ✅
              padding: msg.imageUrl && !msg.text ? "0" : "", // ✅
            }}
          >
            {msg.sender === "admin" && (
              <span
                style={{
                  fontSize: "11px",
                  color: "#facc15",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                👮 Admin
              </span>
            )}
            {msg.text && <span>{msg.text}</span>}
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="screenshot"
                style={{
                  maxWidth: "200px",
                  borderRadius: "8px",
                  marginTop: "6px",
                  display: "block",
                }}
              />
            )}
            <span
              style={{
                fontSize: "10px",
                opacity: 0.5,
                display: "block",
                marginTop: "4px",
              }}
            >
              {new Date(msg.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {imagePreview && (
        <div style={{ padding: "8px 16px", background: "#1e1e2e" }}>
          <img
            src={imagePreview}
            alt="preview"
            style={{ height: "60px", borderRadius: "8px" }}
          />
          <button
            onClick={() => {
              setImage(null);
              setImagePreview(null);
            }}
            style={{
              marginLeft: "8px",
              color: "red",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="chat-input">
        <input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <label className="file-btn" onClick={() => fileRef.current.click()}>
          📎
        </label>
        <input
          type="file"
          ref={fileRef}
          hidden
          accept="image/*"
          onChange={handleImageSelect}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "➤"}
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
