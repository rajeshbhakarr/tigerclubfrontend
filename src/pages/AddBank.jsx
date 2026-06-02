import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/addbank.css";

function AddBank() {
  const navigate = useNavigate();

  const [bankName, setBankName] = useState("");
  const [name, setName] = useState("RAJESH KUMAR");
  const [account, setAccount] = useState("");
  const [phone, setPhone] = useState("");
  const [ifsc, setIfsc] = useState("");

  // 🏦 BANK LIST
  const banks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Kotak Mahindra Bank",
    "Yes Bank",
    "Union Bank",
    "Canara Bank"
  ];

 const handleSave = async () => {
  if (!bankName || !name || !account || !phone || !ifsc) {
    alert("Fill all fields");
    return;
  }

  try {
    const res = await fetch(
      "http://localhost:5000/api/profile/save-bank",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          bankName,
          accountNo: account,
          phone,
          ifsc,
          name,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Bank added ✅");
      navigate("/bank-list");
    } else {
      alert(data.message || "Failed");
    }
  } catch (err) {
    alert("Server error");
  }
};

  return (
    <div className="ab-container">

      {/* HEADER */}
      <div className="ab-head">
        <span onClick={() => navigate("/bank-list")}>←</span>
        <span>Add a bank account number</span>
      </div>

      {/* WARNING */}
      <div className="ab-warning">
        ⚠ To ensure safety, please bind your bank account
      </div>

      {/* FORM */}
      <div className="ab-form">

        {/* BANK SELECT */}
        <label>Choose a bank</label>
        <select
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        >
          <option value="">Please select a bank</option>
          {banks.map((bank, i) => (
            <option key={i} value={bank}>
              {bank}
            </option>
          ))}
        </select>

        {/* NAME */}
        <label>Full recipient's name</label>
        <input value={name} readOnly />

        {/* ACCOUNT */}
        <label>Bank account number</label>
        <input
          placeholder="Enter account number"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />

        {/* PHONE */}
        <label>Phone number</label>
        <input
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* IFSC */}
        <label>IFSC code</label>
        <input
          placeholder="Enter IFSC code"
          value={ifsc}
          onChange={(e) => setIfsc(e.target.value)}
        />

      </div>

      {/* SAVE */}
      <button className="ab-save" onClick={handleSave}>
        Save
      </button>

    </div>
  );
}

export default AddBank;