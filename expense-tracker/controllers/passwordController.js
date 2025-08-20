const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();
const db = require("../config/db"); // MySQL connection (no .promise)

// ==========================
// Forgot password - create reset link (no email sending)
// ==========================
const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  // Find user in DB
  db.query("SELECT * FROM signup WHERE email = ?", [email], (err, users) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    const resetRequestId = uuidv4();

    // Insert reset request
    db.query(
      "INSERT INTO ForgotPasswordRequests (id, userId, isActive) VALUES (?, ?, ?)",
      [resetRequestId, user.id, true],
      (err2) => {
        if (err2) {
          console.error("Insert error:", err2);
          return res.status(500).json({ error: "Failed to create reset request" });
        }

        const resetUrl = `http://localhost:3000/password/resetpassword/${resetRequestId}`;
        console.log("Reset URL:", resetUrl);

        res.json({ message: "Password reset link created!", resetUrl });
      }
    );
  });
};

// ==========================
// Show reset password form
// ==========================
const resetPasswordForm = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
    [id],
    (err, requests) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).send("Something went wrong.");
      }
      if (requests.length === 0) {
        return res.status(400).send("Invalid or expired reset link.");
      }

      res.send(`
        <h2>Reset Password</h2>
        <form action="/password/resetpassword/${id}" method="POST">
          <input type="password" name="password" placeholder="Enter new password" required />
          <button type="submit">Reset Password</button>
        </form>
      `);
    }
  );
};

// ==========================
// Handle reset password submission
// ==========================
const resetPasswordSubmit = (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  db.query(
    "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
    [id],
    async (err, requests) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).send("Something went wrong.");
      }
      if (requests.length === 0) {
        return res.status(400).send("Invalid or expired reset link.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user's password
      db.query(
        "UPDATE signup SET password = ? WHERE id = ?",
        [hashedPassword, requests[0].userId],
        (err2) => {
          if (err2) {
            console.error("Update error:", err2);
            return res.status(500).send("Failed to update password.");
          }

          // Deactivate reset request
          db.query(
            "UPDATE ForgotPasswordRequests SET isActive = FALSE WHERE id = ?",
            [id],
            (err3) => {
              if (err3) {
                console.error("Deactivate error:", err3);
                return res.status(500).send("Something went wrong.");
              }

     res.setHeader("Content-Type", "text/html");
res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
  </head>
  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
    <h2 style="color: green;">Password reset successfully!</h2>
    <p>You can now login with your new password.</p>
    <a href="http://127.0.0.1:5500/expense-tracker/public/login.html">
      <button style="
        background-color: #4CAF50; 
        color: white; 
        padding: 10px 20px; 
        border: none; 
        border-radius: 5px; 
        cursor: pointer;
        font-size: 16px;
        margin-top: 20px;
      ">
        Go to Login
      </button>
    </a>

    <script>
      setTimeout(() => {
        window.location.href = "http://127.0.0.1:5500/expense-tracker/public/login.html";
      }, 3000);
    </script>
  </body>
  </html>
`);


            }
          );
        }
      );
    }
  );
};

module.exports = {
  forgotPassword,
  resetPasswordForm,
  resetPasswordSubmit,
};
