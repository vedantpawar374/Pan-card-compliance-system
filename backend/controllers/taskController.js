import pool from '../config/db.js';

export const getTasksByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      `SELECT *
       FROM compliance_tasks
       WHERE user_id = ?
       ORDER BY id DESC`,
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch compliance tasks.', error: error.message });
  }
};

export const markTaskAsCompleted = async (req, res) => {
  try {
    const { taskId } = req.params;

    await pool.query(
      `UPDATE compliance_tasks
       SET status = 'Completed', completed_at = NOW()
       WHERE id = ?`,
      [taskId]
    );

    const [rows] = await pool.query('SELECT * FROM compliance_tasks WHERE id = ?', [taskId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update task status.', error: error.message });
  }
};
