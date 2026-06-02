import { useNavigate } from "react-router-dom";
import "../styles/support.css";

function CustomerSupport() {
  const navigate = useNavigate();

  return (
    <div className="cs-page">
      <div className="cs-header">
<span onClick={() => navigate("/customer-support")}>←</span>  Customer Service
</div>

      <div className="cs-options">
        <div onClick={() => navigate("/chat/deposit")} className="cs-btn">
          Deposit Issue
        </div>

        <div onClick={() => navigate("/chat/withdraw")} className="cs-btn">
          Withdraw Issue
        </div>

        <div onClick={() => navigate("/chat/game")} className="cs-btn">
          Game Issue
        </div>
      </div>
    </div>
  );
}

export default CustomerSupport;