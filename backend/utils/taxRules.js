export const EXEMPTION_LIMIT = 250000;

export const buildTaxSummary = (taxableIncome, tdsDeducted) => {
  let summary = `Your taxable income is Rs ${Number(taxableIncome).toLocaleString('en-IN')}. `;

  if (taxableIncome > EXEMPTION_LIMIT) {
    summary += 'You are liable to pay income tax. ';
  } else {
    summary += 'You are not liable to pay income tax. ';
  }

  if (tdsDeducted > 0) {
    summary += `TDS of Rs ${Number(tdsDeducted).toLocaleString('en-IN')} has been deducted. ITR filing is required for refund claim.`;
  }

  return summary;
};

export const getTaxDecision = ({ grossSalary, deductions, tdsDeducted }) => {
  const taxableIncome = Number(grossSalary) - Number(deductions);

  const taxPayable = taxableIncome > EXEMPTION_LIMIT ? 'Yes' : 'No';
  const itrRequired = taxableIncome > EXEMPTION_LIMIT || Number(tdsDeducted) > 0 ? 'Yes' : 'No';
  const refundPossible = Number(tdsDeducted) > 0 ? 'Yes' : 'No';

  return {
    taxableIncome,
    taxPayable,
    itrRequired,
    refundPossible,
    analysisSummary: buildTaxSummary(taxableIncome, Number(tdsDeducted)),
  };
};

export const getItrDueDateFromFinancialYear = (financialYear) => {
  // For FY 2023-24, due date is taken as 2024-07-31 for this project.
  const yearParts = String(financialYear).split('-');
  if (yearParts.length !== 2) {
    const nextYear = new Date().getFullYear() + 1;
    return `${nextYear}-07-31`;
  }

  const endYearPart = yearParts[1].trim();
  const fullYear = endYearPart.length === 2 ? `20${endYearPart}` : endYearPart;
  return `${fullYear}-07-31`;
};
