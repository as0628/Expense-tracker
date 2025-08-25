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
  const userId = req.user.id;

  if (!amount || !description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query(
    'INSERT INTO expenses (amount, description, category, user_id) VALUES (?, ?, ?, ?)',
    [amount, description, category, userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      // ✅ Update total_expense in signup table
      db.query(
        'UPDATE signup SET total_expense = total_expense + ? WHERE id = ?',
        [amount, userId],
        (err2) => {
          if (err2) {
            console.error("❌ Error updating total_expense:", err2.sqlMessage);
            return res.status(500).json({ error: 'Failed to update total expenses' });
          }
          res.status(201).json({ message: 'Expense added', expenseId: result.insertId });
        }
      );
    }
  );
};

// Update expense
const updateExpense = (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;
  const userId = req.user.id;

  // First fetch the old expense amount
  db.query(
    'SELECT amount FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const oldAmount = rows[0].amount;
      const difference = amount - oldAmount;

      // Update the expense
      db.query(
        'UPDATE expenses SET amount = ?, description = ?, category = ? WHERE id = ? AND user_id = ?',
        [amount, description, category, id, userId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Database error' });
          if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found' });

          // ✅ Update total_expense correctly (add or subtract difference)
          db.query(
            'UPDATE signup SET total_expense = total_expense + ? WHERE id = ?',
            [difference, userId],
            (err3) => {
              if (err3) {
                console.error("❌ Error updating total_expense:", err3.sqlMessage);
                return res.status(500).json({ error: 'Failed to update total expenses' });
              }
              res.json({ message: 'Expense updated' });
            }
          );
        }
      );
    }
  );
};

// Delete expense
const deleteExpense = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get the expense amount before deleting
  db.query(
    'SELECT amount FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const amount = rows[0].amount;

      // Delete expense
      db.query(
        'DELETE FROM expenses WHERE id = ? AND user_id = ?',
        [id, userId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Database error' });
          if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found' });

          // ✅ Subtract from total_expense
          db.query(
            'UPDATE signup SET total_expense = total_expense - ? WHERE id = ?',
            [amount, userId],
            (err3) => {
              if (err3) {
                console.error("❌ Error updating total_expense:", err3.sqlMessage);
                return res.status(500).json({ error: 'Failed to update total expenses' });
              }
              res.json({ message: 'Expense deleted' });
            }
          );
        }
      );
    }
  );
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
