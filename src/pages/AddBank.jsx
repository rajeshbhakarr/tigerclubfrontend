import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/addbank.css";

function AddBank() {
  const navigate = useNavigate();

  const [bankName, setBankName] = useState("");
const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [phone, setPhone] = useState("");
  const [ifsc, setIfsc] = useState("");

  // 🏦 BANK LIST
  // 🏦 ALL MAJOR BANKS IN INDIA
const banks = [
  // A
  "Airtel Payments Bank"
  "AU Small Finance Bank",
  "Axis Bank",

  // B
  "Bandhan Bank",
  "Bank of Baroda",
  "Bank of India",
  "Bank of Maharashtra",

  // C
  "Canara Bank",
  "Central Bank of India",
  "City Union Bank",
  "CSB Bank",

  // D
  "DCB Bank",
  "Dhanlaxmi Bank",

  // E
  "Equitas Small Finance Bank",
  "ESAF Small Finance Bank",

  // F
  "Federal Bank",
  "Fino Payments Bank",

  // H
  "HDFC Bank",

  // I
  "ICICI Bank",
  "IDBI Bank",
  "IDFC FIRST Bank",
  "Indian Bank",
  "Indian Overseas Bank",
  "India Post Payments Bank",
  "IndusInd Bank",

  // J
  "Jammu & Kashmir Bank",
  "Jana Small Finance Bank",
  "JIO Payments Bank"

  // K
  "Karnataka Bank",
  "Karur Vysya Bank",
  "Kotak Mahindra Bank",

  // N
  "Nainital Bank",
  "NSDL Payments Bank",

  // P
  "Punjab & Sind Bank",
  "Punjab National Bank",
  "Paytm Payments Bank",

  // R
  "RBL Bank",

  // S
  "Shivalik Small Finance Bank",
  "South Indian Bank",
  "State Bank of India",
  "Suryoday Small Finance Bank",

  // T
  "Tamilnad Mercantile Bank",

  // U
  "UCO Bank",
  "Ujjivan Small Finance Bank",
  "Union Bank of India",
  "Unity Small Finance Bank",
  "Utkarsh Small Finance Bank",

  // Y
  "Yes Bank",

  // Payments
  
];



const isFormComplete =
  bankName.trim() !== "" &&
  name.trim() !== "" &&
  account.trim() !== "" &&
  phone.trim() !== "" &&
  ifsc.trim() !== "";


 const handleSave = async () => {
  if (!bankName || !name || !account || !phone || !ifsc) {
    alert("Fill all fields");
    return;
  }

  try {
    const res = await fetch(
      "https://tigerclubbackend.onrender.com/api/profile/save-bank",
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
<input
  placeholder="Enter real name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
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
      <button
  className={`ab-save ${isFormComplete ? "ab-save-active" : ""}`}
  onClick={handleSave}
  disabled={!isFormComplete}
>
  Save
</button>

    </div>
  );
}

export default AddBank;