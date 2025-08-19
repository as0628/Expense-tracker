const db = require('../config/db');

// ==========================
// Get all premium expenses
// ==========================
const getPremiumExpenses = (req, res) => {
  const userId = req.user.id;
  db.query(
    'SELECT * FROM expenses WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching expenses:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
};

// ==========================
// Add new premium expense
// ==========================
const addPremiumExpense = (req, res) => {
  const { amount, description, category } = req.body;
  const userId = req.user.id;

  if (!amount || !description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query(
    'INSERT INTO expenses (amount, description, category, user_id) VALUES (?, ?, ?, ?)',
    [amount, description, category, userId],
    (err, result) => {
      if (err) {
        console.error("Error inserting expense:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Premium expense added', expenseId: result.insertId });
    }
  );
};

// ==========================
// Update premium expense
// ==========================
const updatePremiumExpense = (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;
  const userId = req.user.id;

  db.query(
    'UPDATE expenses SET amount = ?, description = ?, category = ? WHERE id = ? AND user_id = ?',
    [amount, description, category, id, userId],
    (err, result) => {
      if (err) {
        console.error("Error updating expense:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Premium expense not found' });
      }
      res.json({ message: 'Premium expense updated' });
    }
  );
};

// ==========================
// Delete premium expense
// ==========================
const deletePremiumExpense = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, result) => {
      if (err) {
        console.error("Error deleting expense:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Premium expense not found' });
      }
      res.json({ message: 'Premium expense deleted' });
    }
  );
};

// ==========================
// Leaderboard (sum expenses per user)
// ==========================
const getLeaderboard = (req, res) => {
  const query = `
    SELECT s.id, s.name, s.email, SUM(e.amount) AS total_spent
    FROM signup s
    JOIN expenses e ON s.id = e.user_id
    WHERE s.isPremium = 1
    GROUP BY s.id, s.name, s.email
    ORDER BY total_spent DESC
    LIMIT 10;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Leaderboard query error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};


module.exports = { 
  getPremiumExpenses, 
  addPremiumExpense, 
  updatePremiumExpense, 
  deletePremiumExpense,
  getLeaderboard
};
