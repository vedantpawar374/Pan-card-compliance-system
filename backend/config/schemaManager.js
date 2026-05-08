import pool from './db.js';

const ensureColumn = async (tableName, columnName, columnDefinition) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?`,
    [tableName, columnName]
  );

  if (rows[0].columnCount === 0) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
};

export const ensureSchema = async () => {
  await ensureColumn('financial_year_rules', 'tax_rate', 'tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER exemption_limit');
  await ensureColumn('financial_year_rules', 'tax_rule_note', 'tax_rule_note TEXT NULL AFTER tax_rate');
  await ensureColumn('form16_details', 'ais_tis_verified', 'ais_tis_verified VARCHAR(10) DEFAULT "No" AFTER tds_deducted');
  await ensureColumn('tax_analysis', 'estimated_tax_amount', 'estimated_tax_amount DECIMAL(10,2) DEFAULT 0 AFTER taxable_income');
  await ensureColumn('tax_analysis', 'tds_deducted', 'tds_deducted DECIMAL(10,2) DEFAULT 0 AFTER estimated_tax_amount');
  await ensureColumn('tax_analysis', 'refund_amount', 'refund_amount DECIMAL(10,2) DEFAULT 0 AFTER refund_possible');
  await ensureColumn('tax_analysis', 'tax_due_amount', 'tax_due_amount DECIMAL(10,2) DEFAULT 0 AFTER refund_amount');
  await ensureColumn('tax_analysis', 'ais_tis_verification_required', 'ais_tis_verification_required VARCHAR(10) DEFAULT "No" AFTER tax_due_amount');
  await ensureColumn('tax_analysis', 'pan_aadhaar_issue', 'pan_aadhaar_issue VARCHAR(10) DEFAULT "No" AFTER ais_tis_verification_required');
  await ensureColumn('tax_analysis', 'overall_compliance_status', 'overall_compliance_status VARCHAR(20) DEFAULT "Pending" AFTER pan_aadhaar_issue');
};

export const seedFinancialYearRules = async () => {
  await pool.query(
    `INSERT INTO financial_year_rules
     (financial_year, exemption_limit, tax_rate, tax_rule_note, itr_due_date)
     VALUES
     ('2024-25', 300000.00, 5.00, 'Simplified rule for mini-project tax analysis.', '2025-07-31'),
     ('2025-26', 300000.00, 7.50, 'Salaried user rule for FY 2025-26.', '2026-07-31'),
     ('2026-27', 300000.00, 10.00, 'Expanded tax rate for FY 2026-27.', '2027-07-31')
     ON DUPLICATE KEY UPDATE
       exemption_limit = VALUES(exemption_limit),
       tax_rate = VALUES(tax_rate),
       tax_rule_note = VALUES(tax_rule_note),
       itr_due_date = VALUES(itr_due_date)`
  );
};

export const initializeSchema = async () => {
  await ensureSchema();
  await seedFinancialYearRules();
};