const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();
const path = require("path");
const db = require("../config/db");

// ===== Forgot Password =====
const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  db.query("SELECT * FROM signup WHERE email = ?", [email], (err, users) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const user = users[0];
    const resetRequestId = uuidv4();

    // Deactivate any old requests
    db.query(
      "UPDATE forgotpasswordrequests SET isActive = 0 WHERE userId = ?",
      [user.id],
      (err) => {
        if (err) console.error("Failed to deactivate old requests:", err);

        // Insert new reset request
        db.query(
          "INSERT INTO forgotpasswordrequests (id, userId, isActive, createdAt) VALUES (?, ?, 1, NOW())",
          [resetRequestId, user.id],
          (err2, result) => {
            if (err2) {
              console.error("Failed to insert new reset request:", err2);
              return res.status(500).json({ error: "Failed to create reset request" });
            }

            console.log("Inserted reset request:", result);

            const resetUrl = `${process.env.FRONTEND_URL}/password/resetpassword/${resetRequestId}`;
            console.log("Reset URL:", resetUrl);

            res.json({ message: "Password reset link created!", resetUrl });
          }
        );
      }
    );
  });
};

// ===== Reset Password Form =====
const resetPasswordForm = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM forgotpasswordrequests WHERE id = ? AND isActive = 1",
    [id],
    (err, requests) => {
      if (err) return res.status(500).send("Something went wrong.");
      if (requests.length === 0) return res.status(400).send("Invalid or expired reset link.");

      res.sendFile(path.join(__dirname, "../public/resetpassword.html"));
    }
  );
};

// ===== Reset Password Submit =====
const resetPasswordSubmit = (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  db.query(
    "SELECT * FROM forgotpasswordrequests WHERE id = ? AND isActive = 1",
    [id],
    async (err, requests) => {
      if (err) return res.status(500).json({ success: false, message: "Database error." });
      if (requests.length === 0) return res.status(400).json({ success: false, message: "Invalid or expired reset link." });

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "UPDATE signup SET password = ? WHERE id = ?",
          [hashedPassword, requests[0].userId],
          (err2) => {
            if (err2) return res.status(500).json({ success: false, message: "Failed to update password." });

            // Deactivate this reset request
            db.query(
              "UPDATE forgotpasswordrequests SET isActive = 0 WHERE id = ?",
              [id],
              (err3) => {
                if (err3) return res.status(500).json({ success: false, message: "Something went wrong." });

                res.json({
                  success: true,
                  message: "Password reset successfully! You can now login with your new password.",
                  redirect: "login.html",
                });
              }
            );
          }
        );
      } catch (hashErr) {
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
