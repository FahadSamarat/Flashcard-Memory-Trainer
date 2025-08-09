const express = require('express');
const router = express.Router();
const pg = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'name, email, password are required' });
    }

    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'Email already in use' });
      }

      const hash = await bcrypt.hash(String(password), 10);
      const insert = await client.query(
        `INSERT INTO users (name, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, name, email` ,
        [name, email, hash]
      );
      const user = insert.rows[0];
      const token = signToken(user);
      return res.status(201).json({ success: true, token, user });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Signup failed:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const user = result.rows[0];
      const ok = await bcrypt.compare(String(password), user.password_hash);
      if (!ok) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const publicUser = { id: user.id, name: user.name, email: user.email };
      const token = signToken(publicUser);
      return res.json({ success: true, token, user: publicUser });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;


