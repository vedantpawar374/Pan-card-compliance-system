import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "./Pages.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    user,
    panData,
    form16Data,
    taxAnalysis,
    validatePanFromDashboard,
    pendingTasksCount,
    emailReminderSent,
  } = useContext(AppContext);
  const [panInput, setPanInput] = useState(panData?.pan_number || "");
  const [panError, setPanError] = useState("");
  const [panSuccess, setPanSuccess] = useState("");
  const [isValidatingPan, setIsValidatingPan] = useState(false);

  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const handlePanSubmit = async (e) => {
    e.preventDefault();
    setPanError("");
    setPanSuccess("");

    const normalizedPan = String(panInput || "")
      .trim()
      .toUpperCase();

    if (!normalizedPan) {
      setPanError("Please enter PAN card number.");
      return;
    }

    if (!validatePAN(normalizedPan)) {
      setPanError(
        "Invalid PAN format. Please enter a valid PAN (e.g., AAAPL5055K).",
      );
      return;
    }

    try {
      setIsValidatingPan(true);
      await validatePanFromDashboard(normalizedPan);
      setPanInput(normalizedPan);
      setPanSuccess(
        "PAN validated successfully. You can continue the process.",
      );
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to validate PAN card number.";
      setPanError(message);
    } finally {
      setIsValidatingPan(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Yes":
        return "#e74c3c";
      case "No":
        return "#27ae60";
      default:
        return "#3498db";
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome, {user?.name}!</p>
      </div>

      {emailReminderSent && pendingTasksCount > 0 && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            color: "#856404",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <strong>📧 Email Reminder Sent!</strong>
          <p>
            A reminder email has been sent to your email address for{" "}
            {pendingTasksCount} pending task(s).
          </p>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Quick Stats */}
        <div className="stats-section">
          <h2>Your Compliance Status</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>PAN Status</h3>
              <p className="stat-value">
                {panData ? "✓ Uploaded" : "○ Pending"}
              </p>
            </div>
            <div className="stat-card">
              <h3>Income Details</h3>
              <p className="stat-value">
                {form16Data ? "✓ Submitted" : "○ Pending"}
              </p>
            </div>
            <div className="stat-card">
              <h3>Tax Analysis</h3>
              <p className="stat-value">
                {taxAnalysis ? "✓ Generated" : "○ Pending"}
              </p>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <h2>PAN Verification</h2>
          <form onSubmit={handlePanSubmit}>
            <div className="form-group">
              <label>Enter PAN Card Number</label>
              <input
                type="text"
                value={panInput}
                onChange={(e) => {
                  setPanInput(e.target.value);
                  setPanError("");
                  setPanSuccess("");
                }}
                placeholder="e.g., AAAPL5055K"
                maxLength="10"
                style={{ textTransform: "uppercase" }}
              />
            </div>

            {panError && <div className="error-message">{panError}</div>}
            {panSuccess && <div className="success-message">{panSuccess}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isValidatingPan}
            >
              {isValidatingPan ? "Validating..." : "Validate PAN"}
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button
              className="btn btn-action"
              onClick={() => navigate("/pan-details")}
            >
              📋 PAN Details (Optional)
            </button>
            <button
              className="btn btn-action"
              onClick={() => navigate("/form16-details")}
              disabled={!panData}
            >
              📄 Enter Income Details
            </button>
            <button
              className="btn btn-action"
              onClick={() => navigate("/tax-analysis")}
              disabled={!form16Data}
            >
              📊 View Tax Analysis
            </button>
            <button
              className="btn btn-action"
              onClick={() => navigate("/compliance-tasks")}
              disabled={!taxAnalysis}
            >
              ✓ View Tasks
            </button>
          </div>
        </div>

        {/* Current Status Summary */}
        {taxAnalysis && (
          <div className="summary-section">
            <h2>Current Tax Status</h2>
            <div className="summary-card">
              <div className="summary-row">
                <span>Taxable Income:</span>
                <strong>
                  ₹{taxAnalysis.taxable_income?.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="summary-row">
                <span>Tax Payable:</span>
                <strong
                  style={{ color: getStatusColor(taxAnalysis.tax_payable) }}
                >
                  {taxAnalysis.tax_payable}
                </strong>
              </div>
              <div className="summary-row">
                <span>ITR Required:</span>
                <strong
                  style={{ color: getStatusColor(taxAnalysis.itr_required) }}
                >
                  {taxAnalysis.itr_required}
                </strong>
              </div>
              <div className="summary-row">
                <span>Refund Possible:</span>
                <strong
                  style={{ color: getStatusColor(taxAnalysis.refund_possible) }}
                >
                  {taxAnalysis.refund_possible}
                </strong>
              </div>
              <p className="analysis-summary">{taxAnalysis.analysis_summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
