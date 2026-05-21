import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "./Pages.css";

const Form16Details = () => {
  const navigate = useNavigate();
  const { form16Data, saveForm16Details, panData } = useContext(AppContext);
  const initialFormState = {
    financial_year: "2024-25",
    gross_salary: "",
    deductions: "",
    tds_deducted: "",
    ais_tis_verified: "No",
    employer_name: "",
    employer_tan: "",
    employee_pan: "",
    employee_id: "",
    tax_regime: "New",
    basic_salary: "",
    hra: "",
    special_allowance: "",
    form16_part: "Both",
    deduction_80c: false,
    deduction_health_insurance: false,
    deduction_home_loan: false,
    deduction_education_loan: false,
    pan_verified: "Verified",
    aadhaar_linked: "Linked",
    form_verified: "Pending",
  };

  const [formData, setFormData] = useState(
    form16Data ? { ...initialFormState, ...form16Data } : initialFormState,
  );
  const [showPreview, setShowPreview] = useState(false);
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value === "" ? "" : parseFloat(value) || value,
    }));
    setError("");
  };

  const handlePreview = () => {
    setShowPreview(true);
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
            <div className="field-grid">
              <div className="form-group">
                <label>Employer Name</label>
                <input
                  type="text"
                  name="employer_name"
                  value={formData.employer_name}
                  onChange={handleChange}
                  placeholder="e.g., ABC Pvt Ltd"
                />
              </div>
              <div className="form-group">
                <label>Employer TAN Number</label>
                <input
                  type="text"
                  name="employer_tan"
                  value={formData.employer_tan}
                  onChange={handleChange}
                  placeholder="e.g., ABCDE1234F"
                />
              </div>
            </div>

            <div className="section-heading">
              <h2>Employee Information</h2>
            </div>
            <div className="field-grid">
              <div className="form-group">
                <label>Employee PAN Number</label>
                <input
                  type="text"
                  name="employee_pan"
                  value={formData.employee_pan}
                  onChange={handleChange}
                  placeholder="e.g., QWERT1234A"
                />
              </div>
              <div className="form-group">
                <label>Employee ID (Optional)</label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  placeholder="e.g., EMP-4567"
                />
              </div>
            </div>

            <div className="section-heading">
              <h2>Tax Regime</h2>
            </div>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="tax_regime"
                  value="Old"
                  checked={formData.tax_regime === "Old"}
                  onChange={handleChange}
                />
                Old Tax Regime
              </label>
              <label>
                <input
                  type="radio"
                  name="tax_regime"
                  value="New"
                  checked={formData.tax_regime === "New"}
                  onChange={handleChange}
                />
                New Tax Regime
              </label>
            </div>

            <div className="section-heading">
              <h2>Salary Breakdown</h2>
            </div>
            <div className="field-grid">
              <div className="form-group">
                <label>Basic Salary</label>
                <input
                  type="number"
                  name="basic_salary"
                  value={formData.basic_salary}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label>HRA</label>
                <input
                  type="number"
                  name="hra"
                  value={formData.hra}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label>Special Allowance</label>
                <input
                  type="number"
                  name="special_allowance"
                  value={formData.special_allowance}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="section-heading">
              <h2>Form 16 Part Selection</h2>
            </div>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="form16_part"
                  value="Part A"
                  checked={formData.form16_part === "Part A"}
                  onChange={handleChange}
                />
                Part A
              </label>
              <label>
                <input
                  type="radio"
                  name="form16_part"
                  value="Part B"
                  checked={formData.form16_part === "Part B"}
                  onChange={handleChange}
                />
                Part B
              </label>
              <label>
                <input
                  type="radio"
                  name="form16_part"
                  value="Both"
                  checked={formData.form16_part === "Both"}
                  onChange={handleChange}
                />
                Both
              </label>
            </div>

            <div className="section-heading">
              <h2>Additional Deductions</h2>
            </div>
            <div className="checkbox-grid">
              <label>
                <input
                  type="checkbox"
                  name="deduction_80c"
                  checked={formData.deduction_80c}
                  onChange={handleChange}
                />
                80C Deduction
              </label>
              <label>
                <input
                  type="checkbox"
                  name="deduction_health_insurance"
                  checked={formData.deduction_health_insurance}
                  onChange={handleChange}
                />
                Health Insurance
              </label>
              <label>
                <input
                  type="checkbox"
                  name="deduction_home_loan"
                  checked={formData.deduction_home_loan}
                  onChange={handleChange}
                />
                Home Loan
              </label>
              <label>
                <input
                  type="checkbox"
                  name="deduction_education_loan"
                  checked={formData.deduction_education_loan}
                  onChange={handleChange}
                />
                Education Loan
              </label>
            </div>

            <div className="section-divider" />

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

            <div className="button-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreview}
              >
                Generate Preview
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Income Details"}
              </button>
            </div>

            {showPreview && (
              <div className="preview-section">
                <h4>Form 16 Preview</h4>
                <p>This preview shows the selected Form 16 settings and salary breakdown.</p>
                <div className="status-row">
                  <div>
                    <strong>Tax Regime:</strong> {formData.tax_regime}
                  </div>
                  <div>
                    <strong>Form 16 Part:</strong> {formData.form16_part}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <h3>📄 Form 16 Required Documents</h3>
          <ul className="document-list">
            <li>
              <span className="document-item-icon">✓</span>
              PAN Card
            </li>
            <li>
              <span className="document-item-icon">✓</span>
              Aadhaar Card
            </li>
            <li>
              <span className="document-item-icon">✓</span>
              Salary Slips
            </li>
            <li>
              <span className="document-item-icon">✓</span>
              Bank Details
            </li>
          </ul>

          <div className="section-heading section-heading-small">
            <h4>Verification Status</h4>
          </div>
          <div className="status-grid">
            <div className="status-badge">
              <span>PAN Verified</span>
              <strong>{formData.pan_verified}</strong>
            </div>
            <div className="status-badge">
              <span>Aadhaar Linked</span>
              <strong>{formData.aadhaar_linked}</strong>
            </div>
            <div className="status-badge">
              <span>Form Verified</span>
              <strong>{formData.form_verified}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form16Details;
