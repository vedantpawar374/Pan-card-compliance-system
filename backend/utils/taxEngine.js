const toNumber = (value) => Number(value || 0);

const toYesNo = (value) => (value === 'Yes' ? 'Yes' : 'No');

export const buildTaxAnalysis = ({
  financialYearRule,
  panRecord,
  form16Record,
}) => {
  const exemptionLimit = toNumber(financialYearRule.exemption_limit);
  const taxRate = toNumber(financialYearRule.tax_rate);
  const grossSalary = toNumber(form16Record.gross_salary);
  const deductions = toNumber(form16Record.deductions);
  const tdsDeducted = toNumber(form16Record.tds_deducted);
  const taxableIncome = Math.max(0, grossSalary - deductions);
  const excessIncome = Math.max(0, taxableIncome - exemptionLimit);
  const estimatedTaxAmount = excessIncome > 0 ? (excessIncome * taxRate) / 100 : 0;
  const taxPayable = taxableIncome > exemptionLimit ? 'Yes' : 'No';
  const itrRequired = taxableIncome > exemptionLimit || tdsDeducted > 0 ? 'Yes' : 'No';
  const refundPossible = tdsDeducted > estimatedTaxAmount ? 'Yes' : 'No';
  const refundAmount = Math.max(0, tdsDeducted - estimatedTaxAmount);
  const taxDueAmount = Math.max(0, estimatedTaxAmount - tdsDeducted);
  const aisTisVerificationRequired = toYesNo(form16Record.ais_tis_verified) === 'Yes' ? 'No' : 'Yes';
  const panAadhaarIssue = panRecord?.aadhaar_linked_status === 'Not Linked' ? 'Yes' : 'No';
  const overallComplianceStatus =
    itrRequired === 'Yes' || aisTisVerificationRequired === 'Yes' || panAadhaarIssue === 'Yes'
      ? 'Pending'
      : 'Completed';

  const analysisSummary = [
    `For FY ${financialYearRule.financial_year}, your taxable income is Rs ${taxableIncome.toLocaleString('en-IN')}.`,
    `The exemption limit is Rs ${exemptionLimit.toLocaleString('en-IN')} and the simple tax rate applied is ${taxRate}%.`,
    estimatedTaxAmount > 0
      ? `Estimated tax amount is Rs ${estimatedTaxAmount.toLocaleString('en-IN')}.`
      : 'No estimated tax is payable under the configured rule.',
    refundPossible === 'Yes'
      ? `TDS refund is possible for Rs ${refundAmount.toLocaleString('en-IN')}.`
      : taxDueAmount > 0
        ? `Additional tax due is Rs ${taxDueAmount.toLocaleString('en-IN')}.`
        : 'TDS and estimated tax are balanced.',
    aisTisVerificationRequired === 'Yes'
      ? 'AIS/TIS verification is required.'
      : 'AIS/TIS verification is complete.',
    panAadhaarIssue === 'Yes'
      ? 'PAN-Aadhaar linking issue found.'
      : 'PAN-Aadhaar status is linked or not flagged.',
  ].join(' ');

  return {
    taxable_income: taxableIncome,
    tax_payable: taxPayable,
    estimated_tax_amount: estimatedTaxAmount,
    itr_required: itrRequired,
    tds_deducted: tdsDeducted,
    refund_possible: refundPossible,
    refund_amount: refundAmount,
    tax_due_amount: taxDueAmount,
    ais_tis_verification_required: aisTisVerificationRequired,
    pan_aadhaar_issue: panAadhaarIssue,
    overall_compliance_status: overallComplianceStatus,
    analysis_summary: analysisSummary,
  };
};

export const buildComplianceTasks = ({ analysis, dueDate }) => {
  const tasks = [];

  if (analysis.itr_required === 'Yes') {
    tasks.push({
      task_type: 'ITR_FILING',
      title: 'File Income Tax Return',
      description: 'File your Income Tax Return using the submitted Form 16 and PAN details.',
      due_date: dueDate,
    });
  }

  if (analysis.refund_possible === 'Yes') {
    tasks.push({
      task_type: 'REFUND_CHECK',
      title: 'Check TDS Refund Eligibility',
      description: 'Review your TDS deduction and claim refund if applicable.',
      due_date: dueDate,
    });
  }

  if (analysis.tax_due_amount > 0) {
    tasks.push({
      task_type: 'TAX_PAYMENT',
      title: 'Pay Remaining Tax Amount',
      description: 'Pay the remaining tax due before the filing deadline.',
      due_date: dueDate,
    });
  }

  if (analysis.ais_tis_verification_required === 'Yes') {
    tasks.push({
      task_type: 'AIS_TIS_VERIFICATION',
      title: 'Verify AIS/TIS Statement',
      description: 'Verify AIS/TIS details before proceeding with filing.',
      due_date: dueDate,
    });
  }

  if (analysis.pan_aadhaar_issue === 'Yes') {
    tasks.push({
      task_type: 'PAN_AADHAAR_LINKING',
      title: 'Link PAN with Aadhaar',
      description: 'Link PAN with Aadhaar to avoid compliance issues.',
      due_date: null,
    });
  }

  return tasks;
};