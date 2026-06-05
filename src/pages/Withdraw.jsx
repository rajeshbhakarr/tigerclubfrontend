import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import "../styles/withdraw.css";

function Withdraw() {

  const navigate = useNavigate();

  const { balance, fetchBalance, user } = useWallet();

const withdrawableBalance =
  Number(user?.needToBet || 0) > 0
    ? 0
    : Number(user?.wallet || 0);
  const [selectedMethod, setSelectedMethod] = useState("bank");
  const [bankData, setBankData] = useState(null);
  const [upiData, setUpiData] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const loadPaymentData = async () => {
    try {
      const res = await fetch(
        "https://indr-backend-77tp.onrender.com/api/profile/me",
        {
          headers: {
            Authorization:
              "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setBankData(data.user.bankDetails || null);
        setUpiData(data.user.upiDetails || null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  loadPaymentData();
}, []);



  const selectedData = selectedMethod === "bank" ? bankData : upiData;

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    console.log("amount =", amount);
    console.log("selectedData =", selectedData);
    if (!amt || amt < 100) return alert("Minimum withdraw ₹100 hai");
    if (amt > withdrawableBalance)
      return alert("Withdrawable balance insufficient");
    if (!selectedData) return alert("Pehle payment method add karo");

    setLoading(true);
    try {
      const res = await fetch(  "https://indr-backend-77tp.onrender.com/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          uid: localStorage.getItem("uid"),
          mobile: localStorage.getItem("mobile"),
          amount: amt,
          orderNo: "WD" + Date.now(),
          method: selectedMethod,
          accountDetails: selectedMethod === "bank" ? {  // 🔥
            bankName: bankData?.bankName || "",
            accountNo: bankData?.accountNo || "",
            ifsc: bankData?.ifsc || "",
            name: bankData?.name || "",
          } : {
upiId: upiData?.upiId || "",
            name: upiData?.name || "",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Withdraw request sent ₹${amt}`);
        setAmount("");
        fetchBalance();
      } else {
        alert(data.message || "Failed");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wd-page">

      {/* HEADER */}
      <div className="wd-header">
        <span className="wd-back" onClick={() => navigate(-2)}>←</span>
        <span className="wd-title">Withdraw</span>
        <span className="wd-history" onClick={() => navigate("/withdrawhistory")}>History</span>
      </div>

      {/* BALANCE CARD */}
      <div className="wd-balance-card">
        <div className="wd-bal-top">
          <span>💰</span>
          <span>Available balance</span>
        </div>
        <div className="wd-bal-amt">
          ₹{balance !== undefined ? Number(balance).toFixed(2) : "0.00"}
          <button className="wd-refresh" onClick={fetchBalance}>↻</button>
        </div>
      </div>

      {/* METHOD TABS */}
      <div className="wd-methods">
        <div
          className={`wd-method-btn ${selectedMethod === "bank" ? "active" : ""}`}
          onClick={() => setSelectedMethod("bank")}
        >
          <span className="wd-method-icon">🏦</span>
          <span>BANK CARD</span>
        </div>
        <div
          className={`wd-method-btn ${selectedMethod === "upi" ? "active" : ""}`}
          onClick={() => setSelectedMethod("upi")}
        >
          <span className="wd-method-icon">💳</span>
          <span>UPI</span>
        </div>
      </div>

      {/* ACCOUNT CARD */}
      {selectedMethod === "bank" && (
        <div className="wd-account-card" onClick={() => navigate("/bank-list")}>
          {bankData ? (
            <>
              <span className="wd-acc-icon">🏦</span>
              <div className="wd-acc-info">
                <p className="wd-acc-name">{bankData.bankName}</p>
                <p className="wd-acc-num">
                  {bankData.account?.replace(/(\d{4})\d+(\d{4})/, "$1******$2")}
                </p>
              </div>
              <span className="wd-acc-arrow">›</span>
            </>
          ) : (
            <>
              <span className="wd-acc-icon">➕</span>
              <span className="wd-acc-add">Add Bank Account</span>
              <span className="wd-acc-arrow">›</span>
            </>
          )}
        </div>
      )}

      {selectedMethod === "upi" && (
        <div className="wd-account-card" onClick={() => navigate("/upi-list")}>
          {upiData ? (
            <>
              <span className="wd-acc-icon">💳</span>
              <div className="wd-acc-info">
                <p className="wd-acc-name">{upiData.name}</p>
                <p className="wd-acc-num">
{upiData.upiId?.replace(/^(\w{4})\w+(@.+)$/, "$1****$2")}                </p>
              </div>
              <span className="wd-acc-arrow">›</span>
            </>
          ) : (
            <>
              <span className="wd-acc-icon">➕</span>
              <span className="wd-acc-add">Add UPI Account</span>
              <span className="wd-acc-arrow">›</span>
            </>
          )}
        </div>
      )}

      {/* REMINDER */}
      <div className="wd-reminder">
        <p>⚠️ Dear Customer, Please confirm your bank/UPI details are correct. Incorrect information may cause withdrawal failure.</p>
      </div>

      {/* AMOUNT INPUT */}
      <div className="wd-amount-section">
        <div className="wd-input-row">
          <span className="wd-rupee">₹</span>
          <input
            type="number"
            className="wd-input"
            placeholder="Please enter the amount"
            value={amount}
            onChange={(e) => {
              let val = e.target.value;

              if (parseFloat(val) > withdrawableBalance) {
                val = withdrawableBalance;
              }

              setAmount(val);
            }}
          />
          {amount && (
            <button className="wd-clear" onClick={() => setAmount("")}>✕</button>
          )}
        </div>

        <div className="wd-bal-row">
          <div className="need-to-bet">
            Need To Bet ₹{Number(user?.needToBet || 0).toFixed(2)}</div>
          <span>
            Withdrawable balance
            <b>₹{withdrawableBalance.toFixed(2)}</b>
          </span>

          <button
            className="wd-all-btn"
            onClick={() => setAmount(withdrawableBalance)}
          >
            All
          </button>
        </div>

        <div className="wd-receive-row">
          <span>Withdrawal amount received</span>
          <span className="wd-receive-amt">₹{amount || "0"}</span>
        </div>
      </div>

      {/* WITHDRAW BTN */}
      <button
        className={`wd-submit-btn ${(!amount || parseFloat(amount) < 100 || !selectedData) ? "disabled" : ""}`}
        onClick={handleWithdraw}
        disabled={loading || !amount || parseFloat(amount) < 100 || !selectedData}
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>

      {/* INFO LIST */}
      <div className="wd-info-list">
        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>Need to deposit minimum ₹100 to withdraw</p>
        </div>
        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>Withdraw time <span className="wd-green"> : Any Time </span></p>
        </div>
        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>Daily withdrawal limit <span className="wd-green">  : 5</span></p>
        </div>
        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>Withdrawal amount range <span className="wd-green"> : ₹100 - ₹2,00,000</span></p>
        </div>
        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>Please confirm your beneficial account information before withdrawing.</p>
        </div>
        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>If incorrect, contact customer service</p>
        </div>
      </div>

    </div>
  );
}

export default Withdraw;