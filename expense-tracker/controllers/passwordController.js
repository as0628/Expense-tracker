const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();
const path = require("path");  // <-- add this

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

      // ✅ Better: Serve frontend page instead of inline HTML
      res.sendFile(path.join(__dirname, "../public/resetpassword.html"));
    }
  );
};
// ==========================
// Handle reset password submission
// ==========================
const resetPasswordSubmit = (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  db.query(
    "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
    [id],
    async (err, requests) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ success: false, message: "Something went wrong." });
      }
      if (requests.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password
        db.query(
          "UPDATE signup SET password = ? WHERE id = ?",
          [hashedPassword, requests[0].userId],
          (err2) => {
            if (err2) {
              console.error("Update error:", err2);
              return res.status(500).json({ success: false, message: "Failed to update password." });
            }

            // Deactivate reset request
            db.query(
              "UPDATE ForgotPasswordRequests SET isActive = FALSE WHERE id = ?",
              [id],
              (err3) => {
                if (err3) {
                  console.error("Deactivate error:", err3);
                  return res.status(500).json({ success: false, message: "Something went wrong." });
                }

                // ✅ Respond with JSON (frontend will handle UI)
                return res.json({
                  success: true,
                  message: "Password reset successfully! You can now login with your new password.",
                  redirect: "/login.html" // optional, frontend can auto-redirect
                });
              }
            );
          }
        );
      } catch (hashErr) {
        console.error("Hashing error:", hashErr);
        return res.status(500).json({ success: false, message: "Failed to process password." });
      }
    }
  );
};


module.exports = {
  forgotPassword,
  resetPasswordForm,
  resetPasswordSubmit,
};
