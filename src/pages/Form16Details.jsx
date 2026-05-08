import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "./Pages.css";

const Form16Details = () => {
  const navigate = useNavigate();
  const { form16Data, saveForm16Details, panData } = useContext(AppContext);
  const [formData, setFormData] = useState(
    form16Data || {
      financial_year: "2024-25",
      gross_salary: "",
      deductions: "",
      tds_deducted: "",
      ais_tis_verified: "No",
    },
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!panData) {
    return (
      <div className="page-container">
        <div className="error-message" style={{ marginTop: "50px" }}>
          ⚠️ Please complete PAN details first before entering income details.
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/pan-details")}
          style={{ marginTop: "20px" }}
        >
          Go to PAN Details
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : parseFloat(value) || value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.gross_salary ||
      !formData.deductions ||
      formData.tds_deducted === ""
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const grossSalary = parseFloat(formData.gross_salary);
    const deductions = parseFloat(formData.deductions);
    const tdsDeducted = parseFloat(formData.tds_deducted);

    if (deductions > grossSalary) {
      setError("Deductions cannot be more than gross salary");
      return;
    }

    // Save data
    const dataToSave = {
      ...formData,
      gross_salary: grossSalary,
      deductions: deductions,
      tds_deducted: tdsDeducted,
    };

    try {
      setIsSubmitting(true);
      setError("");
      await saveForm16Details(dataToSave);
      setSuccess("Income details saved successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to save income details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const taxableIncome =
    formData.gross_salary && formData.deductions
      ? parseFloat(formData.gross_salary) - parseFloat(formData.deductions)
      : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>Income / Form 16 Details</h1>
      </div>

      <div className="form-container">
        <div className="form-card">
          <p className="form-subtitle">
            Enter your salary and deduction details
          </p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Financial Year</label>
              <select
                name="financial_year"
                value={formData.financial_year}
                onChange={handleChange}
              >
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
              </select>
            </div>

            <div className="form-group">
              <label>Gross Salary (Annual) *</label>
              <input
                type="number"
                name="gross_salary"
                value={formData.gross_salary}
                onChange={handleChange}
                placeholder="e.g., 600000"
              />
            </div>

            <div className="form-group">
              <label>Deductions (Standard/Specified) *</label>
              <input
                type="number"
                name="deductions"
                value={formData.deductions}
                onChange={handleChange}
                placeholder="e.g., 100000"
              />
              <small>
                Includes standard deduction, HRA, medical insurance, etc.
              </small>
            </div>

            <div className="form-group">
              <label>TDS Deducted *</label>
              <input
                type="number"
                name="tds_deducted"
                value={formData.tds_deducted}
                onChange={handleChange}
                placeholder="e.g., 30000"
              />
              <small>Tax Deducted at Source from your salary</small>
            </div>

            <div className="form-group">
              <label>AIS/TIS Verified *</label>
              <select
                name="ais_tis_verified"
                value={formData.ais_tis_verified}
                onChange={handleChange}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <small>
                Mark Yes only if AIS and TIS statements are already verified.
              </small>
            </div>

            {/* Display Calculated Values */}
            <div className="calculation-display">
              <div className="calc-row">
                <span>Gross Salary:</span>
                <strong>
                  ₹
                  {parseFloat(formData.gross_salary || 0).toLocaleString(
                    "en-IN",
                  )}
                </strong>
              </div>
              <div className="calc-row">
                <span>Deductions:</span>
                <strong>
                  - ₹
                  {parseFloat(formData.deductions || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="calc-row separator">
                <span>Taxable Income:</span>
                <strong>= ₹{taxableIncome.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Income Details"}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <h3>ℹ️ About Form 16</h3>
          <p>
            Form 16 is a certificate of tax deducted at source (TDS) issued by
            your employer.
          </p>
          <ul>
            <li>Issued by employer on request</li>
            <li>Contains your salary and TDS details</li>
            <li>Essential for ITR filing</li>
            <li>Must be issued before July 15th of financial year-end</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Form16Details;
