import pool from '../config/db.js';

const toNormalizedDate = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
};

const toAadhaarLinked = (status) => {
  if (status === 'Linked') {
    return 'Yes';
  }

  if (status === 'Not Linked') {
    return 'No';
  }

  return null;
};

const fetchPanDetailsWithMaster = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
       pd.*,
       pmr.pan_status,
       pmr.aadhaar_linked_status,
       pmr.aadhaar_last4,
       pmr.mobile_last4,
       pmr.email,
       pmr.full_name,
       pmr.dob AS master_dob
     FROM pan_details pd
     LEFT JOIN pan_master_records pmr
       ON pmr.pan_number = pd.pan_number
     WHERE pd.user_id = ?
     ORDER BY pd.id DESC
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    ...row,
    aadhaar_linked: toAadhaarLinked(row.aadhaar_linked_status),
  };
};

export const upsertPanDetails = async (req, res) => {
  try {
    const {
      user_id,
      pan_number,
      name_on_pan,
      dob,
    } = req.body;

    if (!user_id || !pan_number || !name_on_pan || !dob) {
      return res.status(400).json({
        message: 'user_id, pan_number, name_on_pan and dob are required.',
      });
    }

    const normalizedPan = String(pan_number).trim().toUpperCase();
    const normalizedName = String(name_on_pan).trim();
    const normalizedDob = toNormalizedDate(dob);

    const [masterRows] = await pool.query(
      `SELECT *
       FROM pan_master_records
       WHERE pan_number = ?
       LIMIT 1`,
      [normalizedPan]
    );

    let verificationStatus = 'Mismatch';
    let mismatchReason = 'PAN number not found in master records.';
    let verifiedAt = null;

    if (masterRows.length > 0) {
      const master = masterRows[0];
      const reasons = [];

      if (master.full_name.trim().toLowerCase() !== normalizedName.toLowerCase()) {
        reasons.push('Name does not match PAN master records.');
      }

      if (toNormalizedDate(master.dob) !== normalizedDob) {
        reasons.push('Date of birth does not match PAN master records.');
      }

      if (reasons.length === 0) {
        verificationStatus = 'Verified';
        mismatchReason = null;
        verifiedAt = new Date();
      } else {
        mismatchReason = reasons.join(' ');
      }
    }

    const [existingRows] = await pool.query('SELECT id FROM pan_details WHERE user_id = ?', [user_id]);

    if (existingRows.length > 0) {
      await pool.query(
        `UPDATE pan_details
         SET pan_number = ?,
             name_on_pan = ?,
             dob = ?,
             verification_status = ?,
             mismatch_reason = ?,
             verified_at = ?
         WHERE user_id = ?`,
        [
          normalizedPan,
          normalizedName,
          normalizedDob,
          verificationStatus,
          mismatchReason,
          verifiedAt,
          user_id,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO pan_details
         (user_id, pan_number, name_on_pan, dob, verification_status, mismatch_reason, verified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          normalizedPan,
          normalizedName,
          normalizedDob,
          verificationStatus,
          mismatchReason,
          verifiedAt,
        ]
      );
    }

    const savedRow = await fetchPanDetailsWithMaster(user_id);
    return res.status(201).json(savedRow);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save PAN details.', error: error.message });
  }
};

export const getPanDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const row = await fetchPanDetailsWithMaster(userId);

    if (!row) {
      return res.status(404).json({ message: 'PAN details not found.' });
    }

    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch PAN details.', error: error.message });
  }
};

export const validatePanNumber = async (req, res) => {
  try {
    const { user_id, pan_number } = req.body;

    if (!user_id || !pan_number) {
      return res.status(400).json({ message: 'user_id and pan_number are required.' });
    }

    const normalizedPan = String(pan_number).trim().toUpperCase();

    const [masterRows] = await pool.query(
      `SELECT pan_number, full_name, dob
       FROM pan_master_records
       WHERE pan_number = ?
       LIMIT 1`,
      [normalizedPan]
    );

    if (masterRows.length === 0) {
      return res.status(400).json({ message: 'Invalid PAN card number.' });
    }

    const master = masterRows[0];
    const [existingRows] = await pool.query('SELECT id FROM pan_details WHERE user_id = ?', [user_id]);

    if (existingRows.length > 0) {
      await pool.query(
        `UPDATE pan_details
         SET pan_number = ?,
             name_on_pan = ?,
             dob = ?,
             verification_status = 'Verified',
             mismatch_reason = NULL,
             verified_at = NOW()
         WHERE user_id = ?`,
        [normalizedPan, master.full_name, toNormalizedDate(master.dob), user_id]
      );
    } else {
      await pool.query(
        `INSERT INTO pan_details
         (user_id, pan_number, name_on_pan, dob, verification_status, mismatch_reason, verified_at)
         VALUES (?, ?, ?, ?, 'Verified', NULL, NOW())`,
        [user_id, normalizedPan, master.full_name, toNormalizedDate(master.dob)]
      );
    }

    const savedRow = await fetchPanDetailsWithMaster(user_id);
    return res.status(200).json(savedRow);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to validate PAN number.', error: error.message });
  }
};
