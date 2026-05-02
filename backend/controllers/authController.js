import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, user_type } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const [existingRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingRows.length > 0) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, user_type)
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, user_type || 'Salaried']
    );

    return res.status(201).json({
      id: result.insertId,
      name,
      email,
      user_type: user_type || 'Salaried',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user.', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      created_at: user.created_at,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login.', error: error.message });
  }
};
