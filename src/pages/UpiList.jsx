import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/upilist.css";

function UpiList() {
  const navigate = useNavigate();
  const [upi, setUpi] = useState(null);
useEffect(() => {
  const loadUpi = async () => {
    try {
      const res = await fetch(
        "https://tigerclubbackendonrender.com/api/profile/me",
        {
          headers: {
            Authorization:
              "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setUpi(data.user.upiDetails);
      }
    } catch (err) {
      console.log(err);
    }
  };

  loadUpi();
}, []);

  return (
    <div className="upi-page">

      {/* HEADER */}
      <div className="upi-header">
        <span onClick={() => navigate("/withdraw")}>←</span>
        <span>Payment method</span>
      </div>

      {/* UPI CARD */}
      {upi && (
        <div className="upi-card">

          <div className="upi-top-bar"></div>

          <div className="upi-content">
            <p>Account name: RAJESH KUMAR</p>
            <p>UPI ID: {upi.upiId}</p>

            <div className="upi-active">
              <span className="upi-tick">✔</span>
              <span>Current Payment</span>
            </div>
          </div>
        </div>
      )}

      {/* ADD BUTTON */}
      <div
        className="upi-add-btn"
        onClick={() => navigate("/add-upi")}
      >
        Add payment method
      </div>

    </div>
  );
}

export default UpiList; 