import React, { useState, useRef } from 'react';
import '../styles/deposit.css';



import { QrReader } from 'react-qr-reader';

const DepositSystem = () => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: details, 2: payment, 3: success
  const [paymentStatus, setPaymentStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Payment methods
  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', color: '#4361ee' },
    { id: 'upi', name: 'UPI', icon: '📱', color: '#3b82f6' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', color: '#10b981' },
    { id: 'crypto', name: 'Cryptocurrency', icon: '₿', color: '#f59e0b' }
  ];

  // Handle scanner
  const handleScan = (data) => {
    if (data) {
      setScannedData(data.text);
      setScanning(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    alert('Scanner error. Please try again.');
  };

  const startScanner = () => {
    setScanning(true);
    setScannedData(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Simulate QR code reading from uploaded image
      const reader = new FileReader();
      reader.onload = (e) => {
        // In real app, you'd process the image for QR code
        setScannedData("UPI_ID@bank: payment_reference_123");
      };
      reader.readAsDataURL(file);
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success');
      setStep(3);
      setProcessing(false);
      
      // Reset after success
      setTimeout(() => {
        resetForm();
      }, 3000);
    }, 2000);
  };

  const resetForm = () => {
    setStep(1);
    setAmount('');
    setScannedData(null);
    setPaymentStatus(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && amount > 0) {
      setStep(2);
    }
  };

  // Render QR Scanner
  const renderScanner = () => {
    if (!scanning) return null;
    
    return (
      <div className="scanner-overlay">
        <div className="scanner-container">
          <div className="scanner-header">
            <h3>Scan QR Code</h3>
            <button className="close-scanner" onClick={() => setScanning(false)}>✕</button>
          </div>
          <div className="qr-reader-wrapper">
            <QrReader
              onResult={(result, error) => {
                if (result) {
                  handleScan(result);
                }
                if (error) {
                  console.info(error);
                }
              }}
              constraints={{ facingMode: 'environment' }}
              className="qr-reader"
            />
          </div>
          <div className="scanner-actions">
            <button onClick={() => fileInputRef.current.click()} className="upload-btn">
              📁 Upload QR Code
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          {scannedData && (
            <div className="scanned-data">
              <p>✓ QR Code Detected</p>
              <small>{scannedData}</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Step 1: Deposit Details
  const renderStep1 = () => (
    <div className="deposit-step fade-in">
      <div className="amount-section">
        <h2>Enter Deposit Amount</h2>
        <div className="amount-input-wrapper">
          <span className="currency">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="amount-input"
            min="1"
            step="1"
          />
        </div>
        <div className="quick-amounts">
          {[500, 1000, 2500, 5000, 10000].map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className="quick-amount-btn"
            >
              ₹{amt}
            </button>
          ))}
        </div>
      </div>

      <div className="payment-methods">
        <h3>Select Payment Method</h3>
        <div className="methods-grid">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`method-btn ${selectedMethod === method.id ? 'active' : ''}`}
              style={{ borderColor: selectedMethod === method.id ? method.color : '#e5e7eb' }}
            >
              <span className="method-icon" style={{ background: method.color + '20', color: method.color }}>
                {method.icon}
              </span>
              <span className="method-name">{method.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="scanner-section">
        <button onClick={startScanner} className="scan-btn">
          📷 Scan QR Code
        </button>
        {scannedData && (
          <div className="scanned-info">
            ✓ QR Scanned: {scannedData.substring(0, 30)}...
          </div>
        )}
      </div>

      <button onClick={handleSubmit} className="continue-btn" disabled={!amount}>
        Continue to Payment
      </button>
    </div>
  );

  // Render Step 2: Payment Processing
  const renderStep2 = () => (
    <div className="deposit-step fade-in">
      <div className="payment-summary">
        <h2>Payment Summary</h2>
        <div className="summary-card">
          <div className="summary-row">
            <span>Amount:</span>
            <strong>₹{amount}</strong>
          </div>
          <div className="summary-row">
            <span>Payment Method:</span>
            <strong>{paymentMethods.find(m => m.id === selectedMethod)?.name}</strong>
          </div>
          {scannedData && (
            <div className="summary-row">
              <span>QR Reference:</span>
              <small>{scannedData.substring(0, 20)}...</small>
            </div>
          )}
          <div className="summary-row total">
            <span>Total:</span>
            <strong>₹{amount}</strong>
          </div>
        </div>
      </div>

      <div className="payment-form">
        {selectedMethod === 'card' && (
          <div className="card-details">
            <input type="text" placeholder="Card Number" className="payment-input" />
            <div className="card-row">
              <input type="text" placeholder="MM/YY" className="payment-input half" />
              <input type="text" placeholder="CVV" className="payment-input half" />
            </div>
            <input type="text" placeholder="Card Holder Name" className="payment-input" />
          </div>
        )}
        
        {selectedMethod === 'upi' && (
          <div className="upi-details">
            <input type="text" placeholder="UPI ID (e.g., name@bank)" className="payment-input" />
            <button className="verify-upi">Verify UPI ID</button>
          </div>
        )}

        {selectedMethod === 'bank' && (
          <div className="bank-details">
            <select className="payment-input">
              <option>Select Bank</option>
              <option>SBI</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
            </select>
            <input type="text" placeholder="Account Number" className="payment-input" />
            <input type="text" placeholder="IFSC Code" className="payment-input" />
          </div>
        )}

        {selectedMethod === 'crypto' && (
          <div className="crypto-details">
            <select className="payment-input">
              <option>Select Cryptocurrency</option>
              <option>Bitcoin (BTC)</option>
              <option>Ethereum (ETH)</option>
              <option>USDT (TRC20)</option>
            </select>
            <input type="text" placeholder="Wallet Address" className="payment-input" />
          </div>
        )}

        <div className="payment-actions">
          <button onClick={() => setStep(1)} className="back-btn">Back</button>
          <button onClick={processPayment} className="pay-btn" disabled={processing}>
            {processing ? 'Processing...' : `Pay ₹${amount}`}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Step 3: Success
  const renderStep3 = () => (
    <div className="success-step fade-in">
      <div className="success-icon">✓</div>
      <h2>Payment Successful!</h2>
      <p>Your deposit of ₹{amount} has been processed successfully.</p>
      <div className="transaction-details">
        <p>Transaction ID: TXN{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
        <p>Date: {new Date().toLocaleString()}</p>
      </div>
      <button onClick={() => { setStep(1); resetForm(); }} className="new-deposit-btn">
        Make Another Deposit
      </button>
    </div>
  );

  return (
    <div className="deposit-system">
      {renderScanner()}
      <div className="deposit-container">
        <div className="deposit-header">
          <h1>Deposit Funds</h1>
          <div className="steps-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Amount</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Payment</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Success</div>
          </div>
        </div>
        
        <div className="deposit-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default DepositSystem;