import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "./Pages.css";

const PanDetails = () => {
  const navigate = useNavigate();
  const { panData, savePanDetails } = useContext(AppContext);
  const [formData, setFormData] = useState(
    panData || {
      pan_number: "",
      name_on_pan: "",
      dob: "",
    },
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validatePAN = (pan) => {
    // PAN format: AAAPL5055K
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.pan_number || !formData.name_on_pan || !formData.dob) {
      setError("Please fill in all required fields");
      return;
    }

    if (!validatePAN(formData.pan_number)) {
      setError(
        "Invalid PAN format. Please enter a valid PAN (e.g., AAAPL5055K)",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await savePanDetails(formData);
      setSuccess("PAN details saved successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save PAN details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>PAN Details</h1>
      </div>

      <div className="form-container">
        <div className="form-card">
          <p className="form-subtitle">Please enter your PAN card details</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>PAN Number *</label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                placeholder="e.g., AAAPL5055K"
                maxLength="10"
                style={{ textTransform: "uppercase" }}
              />
              <small>Format: AAAPL5055K</small>
            </div>

            <div className="form-group">
              <label>Name on PAN *</label>
              <input
                type="text"
                name="name_on_pan"
                value={formData.name_on_pan}
                onChange={handleChange}
                placeholder="Enter name as on PAN card"
              />
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <small>
              PAN status and Aadhaar linking status are automatically validated
              from master records after submission.
            </small>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save PAN Details"}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <h3>ℹ️ About PAN</h3>
          <p>
            Permanent Account Number (PAN) is a 10-character alphanumeric
            identifier issued to all taxpayers in India.
          </p>
          <ul>
            <li>Format: AAAPL5055K</li>
            <li>Essential for ITR filing</li>
            <li>Linking with Aadhaar is now mandatory</li>
            <li>PAN remains valid throughout your life</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PanDetails;
