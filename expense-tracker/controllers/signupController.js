const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const { SECRET_KEY } = process.env;

// ==========================
// Signup
// ==========================
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  db.query('SELECT * FROM signup WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    try {
      const hashed = await bcrypt.hash(password, 10);
      db.query(
        'INSERT INTO signup (name, email, password, isPremium) VALUES (?, ?, ?, ?)',
        [name, email, hashed, 0],   // default isPremium = 0 (not premium)
        (err2, result) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: 'Error creating user' });
          }
          res.status(201).json({ message: 'User created', userId: result.insertId });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Hashing error' });
    }
  });
};

// ==========================
// Login
// ==========================
const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  db.query('SELECT * FROM signup WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // ✅ Include isPremium in token
    const token = jwt.sign(
      { id: user.id, email: user.email, isPremium: user.isPremium },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'User logged in successfully',
      token,
      userId: user.id,
      isPremium: !!user.isPremium   // send premium flag to frontend
    });
  });
};

module.exports = { signup, login };
