import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "https://tigerclubbackend.onrender.com/api";

function AdminChat() {
  // States add karo upar:
  const adminFileRef = useRef();
  const [adminImage, setAdminImage] = useState(null);
  const [adminImagePreview, setAdminImagePreview] = useState(null);

  // Image select function:
  const handleAdminImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAdminImage(file);
    setAdminImagePreview(URL.createObjectURL(file));
  };

  // Image compress function:
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
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("all");
  const bottomRef = useRef();

  const fetchChats = async () => {
    const query = filter !== "all" ? `?type=${filter}` : "";
    const res = await axios.get(`${API}/chat/admin/all${query}`);
    setChats(res.data.chats || []);
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(() => {
      fetchChats();
      // Active chat bhi refresh karo
      if (activeChat) {
        axios.get(`${API}/chat/admin/all`).then((res) => {
          const updated = res.data.chats.find((c) => c._id === activeChat._id);
          if (updated) setActiveChat(updated);
        });
      }
    }, 3000); // ✅ har 3 sec mein

    return () => clearInterval(interval);
  }, [filter, activeChat]);
  const prevMsgCount = useRef(0);

  useEffect(() => {
    const msgs = activeChat?.messages || [];
    const newCount = msgs.length;
    if (newCount > prevMsgCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = newCount;
  }, [activeChat]);

  const handleReply = async () => {
    if (!replyText.trim() && !adminImage) return;

    let imageUrl = null;
    if (adminImage) {
      imageUrl = await compressImage(adminImage); // ✅ compress karo
    }
    await axios.post(`${API}/chat/admin/reply/${activeChat._id}`, {
      text: replyText,
      imageUrl,
    });
    setReplyText("");
    setAdminImage(null); // ✅ reset
    setAdminImagePreview(null);
    // Refresh chat
    const res = await axios.get(`${API}/chat/admin/all`);
    const updated = res.data.chats.find((c) => c._id === activeChat._id);
    setActiveChat(updated);
    fetchChats();
  };

  const handleClose = async (chatId) => {
    await axios.post(`${API}/chat/admin/close/${chatId}`);
    setActiveChat(null);
    fetchChats();
  };

  const typeColor = {
    deposit: "#f59e0b",
    withdraw: "#ef4444",
    game: "#6366f1",
  };

  return (
    <div style={{ display: "flex", height: "100vh", color: "white" }}>
      {/* ── Left: Chat List ── */}
      <div
        style={{
          width: "320px",
          background: "#1e1e2e",
          borderRight: "1px solid #333",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #333" }}>
          <h3 style={{ marginBottom: "12px" }}>💬 Customer Chats</h3>
          <div style={{ display: "flex", gap: "6px" }}>
            {["all", "deposit", "withdraw", "game"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    filter === f ? typeColor[f] || "#6366f1" : "#374151",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => setActiveChat(chat)}
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #2a2a3e",
              cursor: "pointer",
              background:
                activeChat?._id === chat._id ? "#2a2a3e" : "transparent",
              transition: "0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "bold" }}>
                {chat.userId?.username || "User"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: typeColor[chat.type] || "#6366f1",
                }}
              >
                {chat.type}
              </span>
            </div>
            <div
              style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}
            >
              📱 {chat.userId?.mobile || "-"}
            </div>
            <div
              style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}
            >
              {chat.messages.length} messages •{" "}
              <span
                style={{
                  color: chat.status === "open" ? "#22c55e" : "#ef4444",
                }}
              >
                {chat.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Right: Chat Window ── */}
      {activeChat ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#0f172a",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              background: "#1e1e2e",
              borderBottom: "1px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <b>{activeChat.userId?.username}</b>
              <span
                style={{
                  color: "#94a3b8",
                  marginLeft: "8px",
                  fontSize: "13px",
                }}
              >
                {activeChat.userId?.mobile}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  background: typeColor[activeChat.type],
                }}
              >
                {activeChat.type}
              </span>
              <button
                onClick={() => handleClose(activeChat._id)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Close Chat
              </button>

              <button
                onClick={async () => {
                  if (!window.confirm("Delete chat?")) return;

                  await axios.delete(
                    `${API}/chat/admin/delete/${activeChat._id}`
                  );

                  setActiveChat(null);
                  fetchChats();
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>

            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {activeChat.messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "admin" ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: msg.imageUrl && !msg.text ? "0" : "10px 14px", // ✅ sirf image ho to padding nahi
                    borderRadius: "12px",
                    background:
                      msg.imageUrl && !msg.text
                        ? "transparent" // ✅ sirf image ho to background nahi
                        : msg.sender === "admin"
                          ? "#6366f1"
                          : "#1e293b",
                    fontSize: "14px",
                  }}
                >
                  {msg.text && <p style={{ margin: 0 }}>{msg.text}</p>}
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="img"
                      style={{
                        maxWidth: "200px",
                        borderRadius: "8px",
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
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply Input */}
          {activeChat.status === "open" ? (
            <div
              style={{
                padding: "12px 16px",
                background: "#1e1e2e",
                borderTop: "1px solid #333",
              }}
            >
              {/* Image Preview */}
              {adminImagePreview && (
                <div style={{ marginBottom: "8px" }}>
                  <img
                    src={adminImagePreview}
                    alt="preview"
                    style={{ height: "60px", borderRadius: "8px" }}
                  />
                  <button
                    onClick={() => {
                      setAdminImage(null);
                      setAdminImagePreview(null);
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

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  placeholder="Reply karein..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #333",
                    background: "#0f172a",
                    color: "white",
                    outline: "none",
                  }}
                />
                {/* 📎 Image Button */}
                <button
                  onClick={() => adminFileRef.current.click()}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#374151",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  📎
                </button>
                <input
                  type="file"
                  ref={adminFileRef}
                  hidden
                  accept="image/*"
                  onChange={handleAdminImageSelect}
                />

                <button
                  onClick={handleReply}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#6366f1",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                color: "#ef4444",
                background: "#1e1e2e",
              }}
            >
              ❌ Chat closed hai
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
          }}
        >
          <p>👈 Koi chat select karo</p>
        </div>
      )}
    </div>
  );
}

export default AdminChat;
