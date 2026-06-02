import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/banklist.css";

function BankList() {
  const navigate = useNavigate();
  const [bank, setBank] = useState(null);

 useEffect(() => {
  const loadBank = async () => {
    try {
      const res = await fetch(
        "https://indr-backend-production.up.railway.app/api/profile/me",
        {
          headers: {
            Authorization:
              "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setBank(data.user.bankDetails);
      }
    } catch (err) {
      console.log(err);
    }
  };

  loadBank();
}, []);

  return (
    <div className="bank-page">

      {/* HEADER */}
      <div className="bank-header">
        <span onClick={() => navigate("/withdraw")}>←</span>
        <span>Bank account</span>
      </div>

      {/* BANK CARD */}
      {bank && (
        <div className="bank-card">

          <div className="bank-row">
            <span>Bank name</span>
            <span>{bank.name}</span>
          </div>

          <div className="bank-row">
            <span>Bank account number</span>
            <span>{bank.accountNo}</span>
          </div>

          <div className="bank-row">
            <span>IFSC code</span>
            <span>{bank.ifsc}</span>
          </div>

          {/* SELECT */}
          <div className="bank-select">
            <span className="tick">✔</span>
            <span>Select</span>
          </div>

        </div>
      )}

      {/* ADD BOX */}
      <div
        className="bank-add-box"
        onClick={() => navigate("/add-bank")}
      >
        <div className="plus">＋</div>
        <p>Add a bank account number</p>
      </div>

    </div>
  );
}

export default BankList;