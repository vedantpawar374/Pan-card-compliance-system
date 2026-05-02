import pool from '../config/db.js';

export const getLatestAnalysisByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      `SELECT
         a.*,
         COALESCE(a.taxable_income, f.taxable_income) AS taxable_income,
         f.tds_deducted
       FROM tax_analysis a
       LEFT JOIN form16_details f
         ON f.id = a.form16_id
       WHERE a.user_id = ?
       ORDER BY a.id DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tax analysis not found.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch tax analysis.', error: error.message });
  }
};
