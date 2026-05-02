import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import './Pages.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, panData, form16Data, taxAnalysis } = useContext(AppContext);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Yes':
        return '#e74c3c';
      case 'No':
        return '#27ae60';
      default:
        return '#3498db';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome, {user?.name}!</p>
      </div>

      <div className="dashboard-grid">
        {/* Quick Stats */}
        <div className="stats-section">
          <h2>Your Compliance Status</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>PAN Status</h3>
              <p className="stat-value">{panData ? '✓ Uploaded' : '○ Pending'}</p>
            </div>
            <div className="stat-card">
              <h3>Income Details</h3>
              <p className="stat-value">{form16Data ? '✓ Submitted' : '○ Pending'}</p>
            </div>
            <div className="stat-card">
              <h3>Tax Analysis</h3>
              <p className="stat-value">{taxAnalysis ? '✓ Generated' : '○ Pending'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button
              className="btn btn-action"
              onClick={() => navigate('/pan-details')}
            >
              📋 Enter PAN Details
            </button>
            <button
              className="btn btn-action"
              onClick={() => navigate('/form16-details')}
              disabled={!panData}
            >
              📄 Enter Income Details
            </button>
            <button
              className="btn btn-action"
              onClick={() => navigate('/tax-analysis')}
              disabled={!form16Data}
            >
              📊 View Tax Analysis
            </button>
            <button
              className="btn btn-action"
              onClick={() => navigate('/compliance-tasks')}
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
                <strong>₹{taxAnalysis.taxable_income?.toLocaleString('en-IN')}</strong>
              </div>
              <div className="summary-row">
                <span>Tax Payable:</span>
                <strong style={{ color: getStatusColor(taxAnalysis.tax_payable) }}>
                  {taxAnalysis.tax_payable}
                </strong>
              </div>
              <div className="summary-row">
                <span>ITR Required:</span>
                <strong style={{ color: getStatusColor(taxAnalysis.itr_required) }}>
                  {taxAnalysis.itr_required}
                </strong>
              </div>
              <div className="summary-row">
                <span>Refund Possible:</span>
                <strong style={{ color: getStatusColor(taxAnalysis.refund_possible) }}>
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
