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
  const connection = await pool.getConnection();

  try {
    const { taskId } = req.params;

    const [taskRows] = await connection.query(
      `SELECT id, user_id, task_type
       FROM compliance_tasks
       WHERE id = ?
       LIMIT 1`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const task = taskRows[0];

    await connection.beginTransaction();

    await connection.query(
      `UPDATE compliance_tasks
       SET status = 'Completed', completed_at = NOW()
       WHERE id = ?`,
      [taskId]
    );

    if (task.task_type === 'PAN_AADHAAR_LINKING') {
      await connection.query(
        `UPDATE pan_master_records pmr
         INNER JOIN pan_details pd
           ON pd.pan_number = pmr.pan_number
         SET pmr.aadhaar_linked_status = 'Linked'
         WHERE pd.user_id = ?`,
        [task.user_id]
      );

      await connection.query(
        `UPDATE tax_analysis
         SET pan_aadhaar_issue = 'No',
             overall_compliance_status = CASE
               WHEN itr_required = 'Yes' OR ais_tis_verification_required = 'Yes'
                 THEN 'Pending'
               ELSE 'Completed'
             END,
             analysis_summary = REPLACE(
               analysis_summary,
               'PAN-Aadhaar linking issue found.',
               'PAN-Aadhaar status is linked or not flagged.'
             )
         WHERE user_id = ?`,
        [task.user_id]
      );

      await connection.query(
        `UPDATE compliance_tasks
         SET status = 'Completed',
             completed_at = COALESCE(completed_at, NOW())
         WHERE user_id = ?
           AND task_type = 'PAN_AADHAAR_LINKING'`,
        [task.user_id]
      );
    }

    await connection.commit();

    const [rows] = await connection.query('SELECT * FROM compliance_tasks WHERE id = ?', [taskId]);

    return res.json(rows[0]);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: 'Failed to update task status.', error: error.message });
  } finally {
    connection.release();
  }
};
