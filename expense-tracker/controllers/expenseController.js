const db = require('../config/db');

// Get all expenses for logged in user
const getExpenses = (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM expenses WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
};


// Add new expense
const addExpense = (req, res) => {
  const { amount, description, category } = req.body;
  const userId = req.user.id;  // 👈 This is the critical line

  if (!amount || !description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query(
    'INSERT INTO expenses (amount, description, category, user_id) VALUES (?, ?, ?, ?)',
    [amount, description, category, userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ message: 'Expense added', expenseId: result.insertId });
    }
  );
};


// Update expense
const updateExpense = (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;
  const userId = req.user.id;

  db.query(
    'UPDATE expenses SET amount = ?, description = ?, category = ? WHERE id = ? AND user_id = ?',
    [amount, description, category, id, userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json({ message: 'Expense updated' });
    }
  );
};

// Delete expense
const deleteExpense = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json({ message: 'Expense deleted' });
    }
  );
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
