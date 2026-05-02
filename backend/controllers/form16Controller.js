import pool from '../config/db.js';

const buildTaxSummary = ({ taxableIncome, tdsDeducted, exemptionLimit }) => {
  let summary = `Your taxable income is Rs ${Number(taxableIncome).toLocaleString('en-IN')}. `;

  if (taxableIncome > exemptionLimit) {
    summary += 'You are liable to pay income tax. ';
  } else {
    summary += 'You are not liable to pay income tax. ';
  }

  if (tdsDeducted > 0) {
    summary += `TDS of Rs ${Number(tdsDeducted).toLocaleString('en-IN')} has been deducted. ITR filing is required for refund claim.`;
  }

  return summary;
};

export const saveForm16Details = async (req, res) => {
  try {
    const {
      user_id,
      financial_year,
      gross_salary,
      deductions,
      tds_deducted,
    } = req.body;

    if (
      !user_id ||
      !financial_year ||
      gross_salary === undefined ||
      deductions === undefined ||
      tds_deducted === undefined
    ) {
      return res.status(400).json({
        message: 'user_id, financial_year, gross_salary, deductions and tds_deducted are required.',
      });
    }

    const [ruleRows] = await pool.query(
      `SELECT exemption_limit, itr_due_date
       FROM financial_year_rules
       WHERE financial_year = ?
       LIMIT 1`,
      [financial_year]
    );

    if (ruleRows.length === 0) {
      return res.status(400).json({
        message: `No financial year rule configured for ${financial_year}.`,
      });
    }

    const exemptionLimit = Number(ruleRows[0].exemption_limit);
    const itrDueDate = ruleRows[0].itr_due_date;
    const grossSalaryNumber = Number(gross_salary);
    const deductionsNumber = Number(deductions);
    const tdsDeductedNumber = Number(tds_deducted);
    const taxableIncome = grossSalaryNumber - deductionsNumber;

    const taxPayable = taxableIncome > exemptionLimit ? 'Yes' : 'No';
    const itrRequired = taxableIncome > exemptionLimit || tdsDeductedNumber > 0 ? 'Yes' : 'No';
    const refundPossible = tdsDeductedNumber > 0 ? 'Yes' : 'No';
    const analysisSummary = buildTaxSummary({
      taxableIncome,
      tdsDeducted: tdsDeductedNumber,
      exemptionLimit,
    });

    let form16Id;

    const [existingFormRows] = await pool.query(
      `SELECT id
       FROM form16_details
       WHERE user_id = ? AND financial_year = ?
       ORDER BY id DESC
       LIMIT 1`,
      [user_id, financial_year]
    );

    if (existingFormRows.length > 0) {
      form16Id = existingFormRows[0].id;
      await pool.query(
        `UPDATE form16_details
         SET gross_salary = ?, deductions = ?, taxable_income = ?, tds_deducted = ?
         WHERE id = ?`,
        [
          grossSalaryNumber,
          deductionsNumber,
          taxableIncome,
          tdsDeductedNumber,
          form16Id,
        ]
      );
    } else {
      const [insertFormResult] = await pool.query(
        `INSERT INTO form16_details
         (user_id, financial_year, gross_salary, deductions, taxable_income, tds_deducted)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          financial_year,
          grossSalaryNumber,
          deductionsNumber,
          taxableIncome,
          tdsDeductedNumber,
        ]
      );

      form16Id = insertFormResult.insertId;
    }

    let taxAnalysisId;

    const [existingAnalysisRows] = await pool.query(
      `SELECT id
       FROM tax_analysis
       WHERE user_id = ? AND financial_year = ?
       ORDER BY id DESC
       LIMIT 1`,
      [user_id, financial_year]
    );

    if (existingAnalysisRows.length > 0) {
      taxAnalysisId = existingAnalysisRows[0].id;
      await pool.query(
        `UPDATE tax_analysis
         SET form16_id = ?,
             taxable_income = ?,
             tax_payable = ?,
             itr_required = ?,
             refund_possible = ?,
             analysis_summary = ?
         WHERE id = ?`,
        [
          form16Id,
          taxableIncome,
          taxPayable,
          itrRequired,
          refundPossible,
          analysisSummary,
          taxAnalysisId,
        ]
      );
    } else {
      const [insertAnalysisResult] = await pool.query(
        `INSERT INTO tax_analysis
         (user_id, form16_id, financial_year, taxable_income, tax_payable, itr_required, refund_possible, analysis_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          form16Id,
          financial_year,
          taxableIncome,
          taxPayable,
          itrRequired,
          refundPossible,
          analysisSummary,
        ]
      );

      taxAnalysisId = insertAnalysisResult.insertId;
    }

    if (itrRequired === 'Yes') {
      const [existingTaskRows] = await pool.query(
        `SELECT id
         FROM compliance_tasks
         WHERE user_id = ? AND tax_analysis_id = ? AND task_type = ?
         LIMIT 1`,
        [user_id, taxAnalysisId, 'ITR_FILING']
      );

      const taskDescription =
        'File your Income Tax Return on the e-filing portal with Form 16 details before the due date.';

      if (existingTaskRows.length > 0) {
        await pool.query(
          `UPDATE compliance_tasks
           SET title = ?, description = ?, due_date = ?
           WHERE id = ?`,
          ['File Income Tax Return', taskDescription, itrDueDate, existingTaskRows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO compliance_tasks
           (user_id, tax_analysis_id, task_type, title, description, due_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user_id, taxAnalysisId, 'ITR_FILING', 'File Income Tax Return', taskDescription, itrDueDate, 'Pending']
        );
      }
    } else {
      await pool.query(
        `DELETE FROM compliance_tasks
         WHERE user_id = ? AND tax_analysis_id = ? AND task_type = ? AND status <> 'Completed'`,
        [user_id, taxAnalysisId, 'ITR_FILING']
      );
    }

    return res.status(201).json({
      message: 'Form 16 details saved and analysis generated successfully.',
      form16_id: form16Id,
      taxable_income: taxableIncome,
      tax_payable: taxPayable,
      itr_required: itrRequired,
      refund_possible: refundPossible,
      analysis_summary: analysisSummary,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save Form 16 details.', error: error.message });
  }
};

export const getLatestForm16ByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      `SELECT *
       FROM form16_details
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Form 16 details not found.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch Form 16 details.', error: error.message });
  }
};
