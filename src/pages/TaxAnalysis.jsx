import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import './Pages.css';

const TaxAnalysis = () => {
  const navigate = useNavigate();
  const { taxAnalysis, form16Data, panData } = useContext(AppContext);

  if (!taxAnalysis || !form16Data) {
    return (
      <div className="page-container">
        <div className="error-message" style={{ marginTop: '50px' }}>
          ⚠️ Please complete PAN and income details first.
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '20px' }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    return status === 'Yes' ? '🔴 Yes' : '🟢 No';
  };

  const getStatusClass = (status) => {
    return status === 'Yes' ? 'status-yes' : 'status-no';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1>Tax Analysis Report</h1>
      </div>

      <div className="analysis-container">
        {/* PAN Summary */}
        <div className="analysis-card">
          <h2>📋 PAN Information</h2>
          <div className="info-table">
            <div className="info-row">
              <span>PAN Number:</span>
              <strong>{panData.pan_number}</strong>
            </div>
            <div className="info-row">
              <span>Name on PAN:</span>
              <strong>{panData.name_on_pan}</strong>
            </div>
            <div className="info-row">
              <span>PAN Status:</span>
              <strong style={{ color: '#27ae60' }}>✓ {panData.pan_status}</strong>
            </div>
            <div className="info-row">
              <span>Aadhaar Linked:</span>
              <strong>{panData.aadhaar_linked}</strong>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="analysis-card">
          <h2>💰 Financial Details</h2>
          <div className="info-table">
            <div className="info-row">
              <span>Financial Year:</span>
              <strong>{form16Data.financial_year}</strong>
            </div>
            <div className="info-row">
              <span>Gross Salary:</span>
              <strong>₹{form16Data.gross_salary?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="info-row">
              <span>Deductions:</span>
              <strong>- ₹{form16Data.deductions?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="info-row highlighted">
              <span>Taxable Income:</span>
              <strong>= ₹{taxAnalysis.taxable_income?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="info-row">
              <span>TDS Deducted:</span>
              <strong>₹{form16Data.tds_deducted?.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Tax Compliance Analysis */}
        <div className="analysis-card">
          <h2>📊 Tax Compliance Analysis</h2>
          <div className="compliance-grid">
            <div className={`compliance-item ${getStatusClass(taxAnalysis.tax_payable)}`}>
              <h3>Tax Payable</h3>
              <p className="status-value">{getStatusBadge(taxAnalysis.tax_payable)}</p>
              <p className="status-note">
                {taxAnalysis.tax_payable === 'Yes'
                  ? 'You are liable to pay income tax'
                  : 'You are not liable to pay income tax'}
              </p>
            </div>

            <div className={`compliance-item ${getStatusClass(taxAnalysis.itr_required)}`}>
              <h3>ITR Filing Required</h3>
              <p className="status-value">{getStatusBadge(taxAnalysis.itr_required)}</p>
              <p className="status-note">
                {taxAnalysis.itr_required === 'Yes'
                  ? 'You must file your Income Tax Return'
                  : 'ITR filing is optional'}
              </p>
            </div>

            <div className={`compliance-item ${getStatusClass(taxAnalysis.refund_possible)}`}>
              <h3>Refund Possible</h3>
              <p className="status-value">{getStatusBadge(taxAnalysis.refund_possible)}</p>
              <p className="status-note">
                {taxAnalysis.refund_possible === 'Yes'
                  ? 'You may be eligible for tax refund'
                  : 'No refund expected'}
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="analysis-card">
          <h2>📝 Analysis Summary</h2>
          <p className="summary-text">{taxAnalysis.analysis_summary}</p>
        </div>

        {/* Compliance Rules */}
        <div className="analysis-card">
          <h2>⚙️ Tax Rules Applied</h2>
          <div className="rules-list">
            <div className="rule-item">
              <strong>Rule 1: Tax Applicability</strong>
              <p>
                If taxable income exceeds ₹{(250000).toLocaleString('en-IN')}, tax is applicable.
                Your taxable income: ₹{taxAnalysis.taxable_income?.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rule-item">
              <strong>Rule 2: ITR Requirement</strong>
              <p>
                ITR is required if: (a) Tax is applicable, OR (b) TDS has been deducted.
                Current TDS: ₹{form16Data.tds_deducted?.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rule-item">
              <strong>Rule 3: Refund Eligibility</strong>
              <p>
                Refund is possible if TDS deducted is more than actual tax liability.
                TDS: ₹{form16Data.tds_deducted?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="analysis-card highlight-card">
          <h2>📌 Next Steps</h2>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/compliance-tasks')}
            style={{ width: '100%', marginTop: '10px' }}
          >
            View Compliance Tasks →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxAnalysis;
