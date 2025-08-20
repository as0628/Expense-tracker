const db = require('../config/db');

// ==========================
// Get all expenses (for premium user)
// ==========================
const getPremiumExpenses = (req, res) => {
  const userId = req.user.id;
  db.query(
    `SELECT id, amount, description, category, created_at AS createdAt 
     FROM expenses 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
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
// Add new expense & update total_expense
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

      // update signup.total_expense
      db.query(
        'UPDATE signup SET total_expense = total_expense + ? WHERE id = ?',
        [amount, userId],
        (err2) => {
          if (err2) {
            console.error("Error updating total_expense:", err2);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ message: 'Premium expense added', expenseId: result.insertId });
        }
      );
    }
  );
};

// ==========================
// Update expense & adjust total_expense
// ==========================
const updatePremiumExpense = (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;
  const userId = req.user.id;

  // first get old amount
  db.query(
    'SELECT amount FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const oldAmount = rows[0].amount;

      // update expense
      db.query(
        'UPDATE expenses SET amount = ?, description = ?, category = ? WHERE id = ? AND user_id = ?',
        [amount, description, category, id, userId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Database error' });

          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Expense not found' });
          }

          // adjust total_expense
          const diff = amount - oldAmount;
          db.query(
            'UPDATE signup SET total_expense = total_expense + ? WHERE id = ?',
            [diff, userId],
            (err3) => {
              if (err3) return res.status(500).json({ error: 'Database error' });
              res.json({ message: 'Expense updated' });
            }
          );
        }
      );
    }
  );
};

// ==========================
// Delete expense & reduce total_expense
// ==========================
const deletePremiumExpense = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // first get amount of the expense
  db.query(
    'SELECT amount FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const expenseAmount = rows[0].amount;

      // delete expense
      db.query(
        'DELETE FROM expenses WHERE id = ? AND user_id = ?',
        [id, userId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Database error' });
          if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found' });

          // reduce total_expense
          db.query(
            'UPDATE signup SET total_expense = total_expense - ? WHERE id = ?',
            [expenseAmount, userId],
            (err3) => {
              if (err3) return res.status(500).json({ error: 'Database error' });
              res.json({ message: 'Expense deleted' });
            }
          );
        }
      );
    }
  );
};

// ==========================
// Leaderboard (directly from signup)
// ==========================
const getLeaderboard = (req, res) => {
  const query = `
    SELECT id, name, email, total_expense
    FROM signup
    WHERE isPremium = 1
    ORDER BY total_expense DESC
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
