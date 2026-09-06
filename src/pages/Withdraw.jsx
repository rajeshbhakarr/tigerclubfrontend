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

  const [bankData, setBankData] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const res = await fetch(
          "https://tigerclubbackend.onrender.com/api/profile/me",
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
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadPaymentData();
  }, []);

  // Check whether bank account is actually linked
  const hasBankAccount =
    !!bankData &&
    !!(bankData.accountNo || bankData.account);

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);

    console.log("amount =", amount);
    console.log("bankData =", bankData);

    // Bank account check first
    if (!hasBankAccount) {
      return alert("Please add bank account");
    }

    if (!amt || amt < 200) {
      return alert("Minimum withdraw ₹200 hai");
    }

    if (amt > withdrawableBalance) {
      return alert("Withdrawable balance insufficient");
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://tigerclubbackend.onrender.com/api/withdraw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            uid: localStorage.getItem("uid"),
            mobile: localStorage.getItem("mobile"),
            amount: amt,
            orderNo: "WD" + Date.now(),

            // Only BANK withdrawal
            method: "bank",

            accountDetails: {
              bankName: bankData?.bankName || "",
              accountNo:
                bankData?.accountNo || bankData?.account || "",
              ifsc: bankData?.ifsc || "",
              name: bankData?.name || "",
            },
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert(`✅ Withdraw request sent ₹${amt}`);
        setAmount("");
        fetchBalance();
      } else {
        alert(data.message || "Failed");
      }
    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wd-page">

      {/* HEADER */}
      <div className="wd-header">
        <span
          className="wd-back"
          onClick={() => navigate("/profile")}
        >
          ←
        </span>

        <span className="wd-title">Withdraw</span>

        <span
          className="wd-history"
          onClick={() => navigate("/withdrawhistory")}
        >
          History
        </span>
      </div>

      {/* BALANCE CARD */}
      <div className="wd-balance-card">
        <div className="wd-bal-top">
          <span>💰</span>
          <span>Available balance</span>
        </div>

        <div className="wd-bal-amt">
          ₹
          {balance !== undefined
            ? Number(balance).toFixed(2)
            : "0.00"}

          <button
            className="wd-refresh"
            onClick={fetchBalance}
          >
            ↻
          </button>
        </div>
      </div>

      {/* BANK ONLY */}
      <div className="wd-methods">
        <div className="wd-method-btn active">
          <span className="wd-method-icon">🏦</span>
          <span>BANK CARD</span>
        </div>
      </div>

      {/* BANK ACCOUNT CARD */}
      <div
        className="wd-account-card"
        onClick={() => navigate("/bank-list")}
      >
        {hasBankAccount ? (
          <>
            <span className="wd-acc-icon">🏦</span>

            <div className="wd-acc-info">
              <p className="wd-acc-name">
                {bankData.bankName}
              </p>

              <p className="wd-acc-num">
                {(
                  bankData.accountNo ||
                  bankData.account ||
                  ""
                ).replace(
                  /(\d{4})\d+(\d{4})/,
                  "$1******$2"
                )}
              </p>
            </div>

            <span className="wd-acc-arrow">›</span>
          </>
        ) : (
          <>
            <span className="wd-acc-icon">➕</span>

            <span className="wd-acc-add">
              Add Bank Account
            </span>

            <span className="wd-acc-arrow">›</span>
          </>
        )}
      </div>

      {/* REMINDER */}
      <div className="wd-reminder">
        <p>
          ⚠️ Dear Customer, Please confirm your bank
          details are correct. Incorrect information may
          cause withdrawal failure.
        </p>
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
            <button
              className="wd-clear"
              onClick={() => setAmount("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="wd-bal-row">

          <div className="need-to-bet">
            Need To Bet ₹
            {Number(user?.needToBet || 0).toFixed(2)}
          </div>

          <span>
            Withdrawable balance
            <b>₹{withdrawableBalance.toFixed(2)}</b>
          </span>

          <button
            className="wd-all-btn"
            onClick={() =>
              setAmount(withdrawableBalance)
            }
          >
            All
          </button>

        </div>

        <div className="wd-receive-row">
          <span>Withdrawal amount received</span>

          <span className="wd-receive-amt">
            ₹{amount || "0"}
          </span>
        </div>

      </div>

      {/* WITHDRAW BUTTON */}
      <button
        className={`wd-submit-btn ${
          !amount || parseFloat(amount) < 200
            ? "disabled"
            : ""
        }`}
        onClick={handleWithdraw}
        disabled={
          loading ||
          !amount ||
          parseFloat(amount) < 200
        }
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>

      {/* INFO LIST */}
      <div className="wd-info-list">

        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>Need to deposit minimum ₹200 to withdraw</p>
        </div>

        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>
            Withdraw time
            <span className="wd-green">
              {" "} : Any Time
            </span>
          </p>
        </div>

        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>
            Daily withdrawal limit
            <span className="wd-green">
              {" "} : 5
            </span>
          </p>
        </div>

        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>
            Withdrawal amount range
            <span className="wd-green">
              {" "} : ₹200 - ₹2,00,000
            </span>
          </p>
        </div>

        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>
            Please confirm your beneficial bank
            account information before withdrawing.
          </p>
        </div>

        <div className="wd-info-item">
          <span className="wd-diamond">♦</span>
          <p>
            If incorrect, contact customer service
          </p>
        </div>

      </div>

    </div>
  );
}

export default Withdraw;