const db = require('../config/db');

// ==========================
// Get all expenses (for premium user)
// ==========================
const getPremiumExpenses = (req, res) => {
  const userId = req.user.id;
  db.query(
    `SELECT id, amount, description, category, type, created_at AS createdAt

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
// ==========================
// Add new expense & update total_expense
// ==========================
const addPremiumExpense = (req, res) => {
  const { amount, description, category, type } = req.body; // ✅ include type
  const userId = req.user.id;

  if (!amount || !description || !category || !type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // ✅ validate type
  if (type !== "income" && type !== "expense") {
    return res.status(400).json({ error: "Invalid type (must be income or expense)" });
  }

  db.query(
    'INSERT INTO expenses (amount, description, category, type, user_id) VALUES (?, ?, ?, ?, ?)',
    [amount, description, category, type, userId],
    (err, result) => {
      if (err) {
        console.error("Error inserting expense:", err);
        return res.status(500).json({ error: 'Database error' });
      }

      // ✅ only update signup.total_expense if it's an expense
      if (type === "expense") {
        db.query(
          'UPDATE signup SET total_expense = total_expense + ? WHERE id = ?',
          [amount, userId],
          (err2) => {
            if (err2) {
              console.error("Error updating total_expense:", err2);
              return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'Expense added', expenseId: result.insertId });
          }
        );
      } else {
        // if income, just return success
        res.status(201).json({ message: 'Income added', expenseId: result.insertId });
      }
    }
  );
};

// ==========================
// Update expense & adjust total_expense
// ==========================
const updatePremiumExpense = (req, res) => {
  const { id } = req.params;
  const { amount, description, category, type } = req.body;
  const userId = req.user.id;

  db.query(
    'SELECT amount FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const oldAmount = rows[0].amount;

      db.query(
        'UPDATE expenses SET amount = ?, description = ?, category = ?, type = ? WHERE id = ? AND user_id = ?',
[amount, description, category, type, id, userId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Database error' });

          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Expense not found' });
          }

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

  db.query(
    'SELECT amount FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const expenseAmount = rows[0].amount;

      db.query(
        'DELETE FROM expenses WHERE id = ? AND user_id = ?',
        [id, userId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Database error' });
          if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found' });

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
// Leaderboard
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

// ==========================
// Reports (Daily, Weekly, Monthly)
// ==========================

const getReport = async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.user.id;

    let query = "";

    if (period === "daily") {
      query = `
        SELECT 
          'Today' AS period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? AND DATE(created_at) = CURDATE();
      `;
    } else if (period === "weekly") {
      query = `
        SELECT 
          'This Week' AS period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1);
      `;
    } else if (period === "monthly") {
      query = `
        SELECT 
          'This Month' AS period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? AND MONTH(created_at) = MONTH(CURDATE()) 
          AND YEAR(created_at) = YEAR(CURDATE());
      `;
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }

    db.query(query, [userId], (err, rows) => {
      if (err) {
        console.error("Report query error:", err);
        return res.status(500).json({ error: "Failed to generate report" });
      }

      const result = rows.length > 0
        ? rows
        : [{ period, total_income: 0, total_expense: 0 }];

      res.json(result);
    });
  } catch (err) {
    console.error("Report query error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
};




module.exports = { 
  getPremiumExpenses, 
  addPremiumExpense, 
  updatePremiumExpense, 
  deletePremiumExpense,
  getLeaderboard,
  getReport
};
