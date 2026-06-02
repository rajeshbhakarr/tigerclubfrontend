import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/addupi.css";

function AddUpi() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upi, setUpi] = useState("");
  const [confirmUpi, setConfirmUpi] = useState("");

 const handleSave = async () => {
  if (!name || !phone || !upi || !confirmUpi) {
    alert("All fields required");
    return;
  }

  if (upi !== confirmUpi) {
    alert("UPI does not match");
    return;
  }

  try {
    const res = await fetch(
      "http://localhost:5000/api/profile/save-upi",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          name,
          phone,
          upiId: upi,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("UPI added ✅");
      navigate("/upi-list");
    } else {
      alert(data.message || "Failed");
    }
  } catch (err) {
    alert("Server error");
  }
};

  return (
    <div className="au-container">

      {/* HEADER */}
      <div className="au-head">
        <span onClick={() => navigate("/upi-list")}>←</span>
        <span>Add a UPI</span>
      </div>

      {/* WARNING */}
      <div className="au-warning">
        ⚠ To ensure safety, enter correct details
      </div>

      {/* FORM */}
      <div className="au-form">

        <label>UPI Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Upi Holder Name "
        />

        <label>Phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
        />

        <p className="au-note">
          ⚠ Please enter your real mobile number
        </p>

        <label>UPI ID</label>
        <input
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
          placeholder="Enter UPI ID"
        />

        <label>Confirm UPI ID</label>
        <input
          value={confirmUpi}
          onChange={(e) => setConfirmUpi(e.target.value)}
          placeholder="Confirm UPI ID"
        />

      </div>

      {/* SAVE BUTTON */}
      <button className="au-save" onClick={handleSave}>
        Save
      </button>

    </div>
  );
}

export default AddUpi;