import pool from '../config/db.js';
import { buildComplianceTasks, buildTaxAnalysis } from '../utils/taxEngine.js';

const upsertComplianceTasks = async ({ connection, userId, taxAnalysisId, tasks, dueDate }) => {
  const [existingRows] = await connection.query(
    `SELECT id, task_type
     FROM compliance_tasks
     WHERE user_id = ? AND tax_analysis_id = ?`,
    [userId, taxAnalysisId]
  );

  const existingByType = new Map(existingRows.map((row) => [row.task_type, row]));
  const desiredTypes = new Set(tasks.map((task) => task.task_type));

  for (const task of tasks) {
    const existingTask = existingByType.get(task.task_type);
    const taskValues = [
      userId,
      taxAnalysisId,
      task.task_type,
      task.title,
      task.description,
      task.due_date || dueDate || null,
      'Pending',
    ];

    if (existingTask) {
      await connection.query(
        `UPDATE compliance_tasks
         SET title = ?, description = ?, due_date = ?, status = 'Pending'
         WHERE id = ? AND status <> 'Completed'`,
        [task.title, task.description, task.due_date || dueDate || null, existingTask.id]
      );
    } else {
      await connection.query(
        `INSERT INTO compliance_tasks
         (user_id, tax_analysis_id, task_type, title, description, due_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        taskValues
      );
    }
  }

  for (const existingTask of existingRows) {
    if (!desiredTypes.has(existingTask.task_type)) {
      await connection.query(
        `DELETE FROM compliance_tasks
         WHERE id = ? AND status <> 'Completed'`,
        [existingTask.id]
      );
    }
  }
};

export const saveForm16Details = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      user_id,
      financial_year,
      gross_salary,
      deductions,
      tds_deducted,
      ais_tis_verified,
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

    const [panRows] = await connection.query(
      `SELECT pd.pan_number, pmr.pan_status, pmr.aadhaar_linked_status, pmr.full_name, pmr.dob
       FROM pan_details pd
       INNER JOIN pan_master_records pmr
         ON pmr.pan_number = pd.pan_number
       WHERE pd.user_id = ?
         AND pd.verification_status = 'Verified'
       ORDER BY pd.id DESC
       LIMIT 1`,
      [user_id]
    );

    if (panRows.length === 0) {
      return res.status(400).json({
        message: 'Please validate PAN card number first before submitting Form 16 details.',
      });
    }

    const [ruleRows] = await connection.query(
      `SELECT exemption_limit, tax_rate, tax_rule_note, itr_due_date
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
    const taxRate = Number(ruleRows[0].tax_rate || 0);
    const taxRuleNote = ruleRows[0].tax_rule_note || '';
    const itrDueDate = ruleRows[0].itr_due_date;
    const grossSalaryNumber = Number(gross_salary);
    const deductionsNumber = Number(deductions);
    const tdsDeductedNumber = Number(tds_deducted);
    const aisTisVerifiedValue = String(ais_tis_verified || 'No');
    const taxableIncome = grossSalaryNumber - deductionsNumber;
    const analysis = buildTaxAnalysis({
      financialYearRule: {
        financial_year,
        exemption_limit: exemptionLimit,
        tax_rate: taxRate,
        tax_rule_note: taxRuleNote,
        itr_due_date: itrDueDate,
      },
      panRecord: panRows[0],
      form16Record: {
        gross_salary: grossSalaryNumber,
        deductions: deductionsNumber,
        tds_deducted: tdsDeductedNumber,
        ais_tis_verified: aisTisVerifiedValue,
      },
    });

    let form16Id;

    const [existingFormRows] = await connection.query(
      `SELECT id
       FROM form16_details
       WHERE user_id = ? AND financial_year = ?
       ORDER BY id DESC
       LIMIT 1`,
      [user_id, financial_year]
    );

    if (existingFormRows.length > 0) {
      form16Id = existingFormRows[0].id;
      await connection.query(
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
      const [insertFormResult] = await connection.query(
        `INSERT INTO form16_details
         (user_id, financial_year, gross_salary, deductions, taxable_income, tds_deducted, ais_tis_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          financial_year,
          grossSalaryNumber,
          deductionsNumber,
          taxableIncome,
          tdsDeductedNumber,
          aisTisVerifiedValue,
        ]
      );

      form16Id = insertFormResult.insertId;
    }

    let taxAnalysisId;

    const [existingAnalysisRows] = await connection.query(
      `SELECT id
       FROM tax_analysis
       WHERE user_id = ? AND financial_year = ?
       ORDER BY id DESC
       LIMIT 1`,
      [user_id, financial_year]
    );

    if (existingAnalysisRows.length > 0) {
      taxAnalysisId = existingAnalysisRows[0].id;
      await connection.query(
        `UPDATE tax_analysis
         SET form16_id = ?,
             taxable_income = ?,
             tax_payable = ?,
             estimated_tax_amount = ?,
             itr_required = ?,
             tds_deducted = ?,
             refund_possible = ?,
             refund_amount = ?,
             tax_due_amount = ?,
             ais_tis_verification_required = ?,
             pan_aadhaar_issue = ?,
             overall_compliance_status = ?,
             analysis_summary = ?
         WHERE id = ?`,
        [
          form16Id,
          analysis.taxable_income,
          analysis.tax_payable,
          analysis.estimated_tax_amount,
          analysis.itr_required,
          analysis.tds_deducted,
          analysis.refund_possible,
          analysis.refund_amount,
          analysis.tax_due_amount,
          analysis.ais_tis_verification_required,
          analysis.pan_aadhaar_issue,
          analysis.overall_compliance_status,
          analysis.analysis_summary,
          taxAnalysisId,
        ]
      );
    } else {
      const [insertAnalysisResult] = await connection.query(
        `INSERT INTO tax_analysis
         (user_id, form16_id, financial_year, taxable_income, tax_payable, estimated_tax_amount, itr_required, tds_deducted, refund_possible, refund_amount, tax_due_amount, ais_tis_verification_required, pan_aadhaar_issue, overall_compliance_status, analysis_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          form16Id,
          financial_year,
          analysis.taxable_income,
          analysis.tax_payable,
          analysis.estimated_tax_amount,
          analysis.itr_required,
          analysis.tds_deducted,
          analysis.refund_possible,
          analysis.refund_amount,
          analysis.tax_due_amount,
          analysis.ais_tis_verification_required,
          analysis.pan_aadhaar_issue,
          analysis.overall_compliance_status,
          analysis.analysis_summary,
        ]
      );

      taxAnalysisId = insertAnalysisResult.insertId;
    }

    const tasks = buildComplianceTasks({ analysis, dueDate: itrDueDate });
    await upsertComplianceTasks({
      connection,
      userId: user_id,
      taxAnalysisId,
      tasks,
      dueDate: itrDueDate,
    });

    await connection.commit();

    return res.status(201).json({
      message: 'Form 16 details saved and analysis generated successfully.',
      form16_id: form16Id,
      ...analysis,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: 'Failed to save Form 16 details.', error: error.message });
  } finally {
    connection.release();
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
