const db = require('../config/db');

const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
// ==========================
// Get all expenses (for premium user)
// ==========================
// GET /api/premiumexpenses?page=1&limit=10
const getPremiumExpenses = (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // user decides
  const offset = (page - 1) * limit;

  // Fetch total count
  db.query(
    `SELECT COUNT(*) AS total FROM expenses WHERE user_id = ?`,
    [userId],
    (err, countResult) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      db.query(
        `SELECT id, amount, description, category, type, note, created_at 
         FROM expenses 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err2, results) => {
          if (err2) return res.status(500).json({ error: "Database error" });

          res.json({
            expenses: results,
            pagination: { page, limit, total, totalPages },
          });
        }
      );
    }
  );
};


// ==========================
// Add new expense & update total_expense
// ==========================

const addPremiumExpense = (req, res) => {
  const { amount, description, category, type, note } = req.body; 
  const userId = req.user.id;

  if (!amount || !description || !category || !type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (type !== "income" && type !== "expense") {
    return res.status(400).json({ error: "Invalid type (must be income or expense)" });
  }

  db.query(
    'INSERT INTO expenses (amount, description, category, type, note, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [amount, description, category, type, note || null, userId],
    (err, result) => {
      if (err) {
        console.error("Error inserting expense:", err);
        return res.status(500).json({ error: 'Database error' });
      }

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
  const { amount, description, category, type, note } = req.body;
  const userId = req.user.id;

  db.query(
    'SELECT amount FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const oldAmount = rows[0].amount;

      db.query(
        'UPDATE expenses SET amount = ?, description = ?, category = ?, type = ?, note = ? WHERE id = ? AND user_id = ?',
        [amount, description, category, type, note || null, id, userId],
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
    SELECT id, name, total_expense
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



// Download Expense Report




const downloadReport = async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.user.id;

    console.log("📥 Generating Excel Report for user:", userId, "period:", period);

    // === Detailed Transactions ===
    let rows;
    try {
      [rows] = await db.promise().query(
        `SELECT 
           id, amount, description, category, type, note, created_at AS date
         FROM expenses
         WHERE user_id = ?
         ORDER BY created_at ASC`,
        [userId]
      );
      console.log("✅ Detailed transactions fetched:", rows.length);
    } catch (err) {
      console.error("❌ Error fetching detailed transactions:", err);
      return res.status(500).json({ error: "DB error - details" });
    }

    // === Monthly (Yearly Summary) ===
    let yearly;
    try {
      [yearly] = await db.promise().query(
        `SELECT 
           DATE_FORMAT(created_at, '%M %Y') AS month,
           SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
           SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
         FROM expenses
         WHERE user_id = ?
         GROUP BY DATE_FORMAT(created_at, '%M %Y')
         ORDER BY MIN(created_at)`,
        [userId]
      );
      console.log("✅ Yearly summary fetched:", yearly.length);
    } catch (err) {
      console.error("❌ Error fetching yearly summary:", err);
      return res.status(500).json({ error: "DB error - yearly summary" });
    }

    // === Notes ===
    let notes;
    try {
      [notes] = await db.promise().query(
        `SELECT created_at AS date, note
         FROM expenses
         WHERE user_id = ? 
           AND note IS NOT NULL 
           AND note <> ''
         ORDER BY created_at ASC`,
        [userId]
      );
      console.log("✅ Notes fetched:", notes.length);
    } catch (err) {
      console.error("❌ Error fetching notes:", err);
      return res.status(500).json({ error: "DB error - notes" });
    }

    // === Create Excel Workbook ===
    let workbook;
    try {
      workbook = new ExcelJS.Workbook();

      // --- Sheet 1: Detailed Expenses ---
      const sheet1 = workbook.addWorksheet("Detailed Expenses");
      sheet1.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Description", key: "description", width: 25 },
        { header: "Category", key: "category", width: 15 },
        { header: "Income", key: "income", width: 15 },
        { header: "Expense", key: "expense", width: 15 },
        { header: "Savings", key: "savings", width: 15 },
        { header: "Note", key: "note", width: 40 }, // ✅ Added Note here too
      ];

      rows.forEach((row) => {
        sheet1.addRow({
          date: new Date(row.date).toLocaleDateString(),
          description: row.description,
          category: row.category,
          income: row.type === "income" ? Number(row.amount) : null,
          expense: row.type === "expense" ? Number(row.amount) : null,
          savings: null,
          note: row.note || "",
        });
      });

      // Totals
      const totalIncome = rows
        .filter((r) => r.type === "income")
        .reduce((acc, r) => acc + Number(r.amount), 0);

      const totalExpense = rows
        .filter((r) => r.type === "expense")
        .reduce((acc, r) => acc + Number(r.amount), 0);

      sheet1.addRow({});
      sheet1.addRow({
        description: "TOTAL",
        income: totalIncome,
        expense: totalExpense,
        savings: totalIncome - totalExpense,
      });

      // --- Sheet 2: Yearly Summary ---
      const sheet2 = workbook.addWorksheet("Yearly Summary");
      sheet2.columns = [
        { header: "Month", key: "month", width: 20 },
        { header: "Income", key: "income", width: 15 },
        { header: "Expense", key: "expense", width: 15 },
        { header: "Savings", key: "savings", width: 15 },
      ];

      yearly.forEach((row) => {
        sheet2.addRow({
          month: row.month,
          income: Number(row.income),
          expense: Number(row.expense),
          savings: Number(row.income) - Number(row.expense),
        });
      });

      const yearlyIncome = yearly.reduce((acc, r) => acc + Number(r.income), 0);
      const yearlyExpense = yearly.reduce((acc, r) => acc + Number(r.expense), 0);

      sheet2.addRow({});
      sheet2.addRow({
        month: "TOTAL",
        income: yearlyIncome,
        expense: yearlyExpense,
        savings: yearlyIncome - yearlyExpense,
      });

      // --- Sheet 3: Yearly Notes ---
      const sheet3 = workbook.addWorksheet("Yearly Notes");
      sheet3.columns = [
        { header: "Date", key: "date", width: 20 },
        { header: "Note", key: "note", width: 50 },
      ];

      if (notes.length > 0) {
        notes.forEach((row) => {
          sheet3.addRow({
            date: new Date(row.date).toLocaleDateString(),
            note: row.note,
          });
        });
      } else {
        sheet3.addRow({
          date: "—",
          note: "No notes found",
        });
      }

      console.log("✅ All sheets filled");
    } catch (err) {
      console.error("❌ Error building Excel workbook:", err);
      return res.status(500).json({ error: "Workbook creation failed" });
    }

    // === Generate buffer ===
    let buffer;
    try {
      buffer = await workbook.xlsx.writeBuffer();
      console.log("✅ Excel buffer generated, size:", buffer.byteLength);

      // Save locally for debugging
      const debugPath = path.join(__dirname, "debug-report.xlsx");
      fs.writeFileSync(debugPath, buffer);
      console.log("💾 Debug Excel saved at:", debugPath);
    } catch (err) {
      console.error("❌ Error generating Excel buffer:", err);
      return res.status(500).json({ error: "Buffer generation failed" });
    }

    // === Send Response ===
    try {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report-${period || "full"}.xlsx`
      );

      res.send(buffer);
      console.log("📤 Excel file sent successfully.");
    } catch (err) {
      console.error("❌ Error sending Excel file:", err);
      res.status(500).json({ error: "Failed to send Excel file" });
    }
  } catch (err) {
    console.error("❌ Unexpected error in downloadReport:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
};









module.exports = { 
  getPremiumExpenses, 
  addPremiumExpense, 
  updatePremiumExpense, 
  deletePremiumExpense,
  getLeaderboard,
  getReport,downloadReport
};
