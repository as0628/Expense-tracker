// Import required modules
const { v4: uuidv4 } = require("uuid"); // For generating unique reset IDs
const bcrypt = require("bcrypt");        // For hashing passwords
require("dotenv").config();              // To use environment variables
const path = require("path");            // For handling file paths
const db = require("../config/db");      // Database connection

// Handler to create a forgot password request
const forgotPassword = (req, res) => {
  const { email } = req.body;

  // Check if email is provided
  if (!email) return res.status(400).json({ error: "Email is required" });

  // Look up user by email
  db.query("SELECT * FROM signup WHERE email = ?", [email], (err, users) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Check if user exists
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    const resetRequestId = uuidv4(); // Generate unique reset ID

    // Insert reset request into ForgotPasswordRequests table
    db.query(
      "INSERT INTO ForgotPasswordRequests (id, userId, isActive) VALUES (?, ?, ?)",
      [resetRequestId, user.id, true],
      (err2) => {
        if (err2) {
          console.error("Insert error:", err2);
          return res.status(500).json({ error: "Failed to create reset request" });
        }

        // Create reset URL
        const resetUrl = `http://localhost:3000/password/resetpassword/${resetRequestId}`;
        console.log("Reset URL:", resetUrl);

        res.json({ message: "Password reset link created!", resetUrl });
      }
    );
  });
};

// Handler to serve the reset password HTML form
const resetPasswordForm = (req, res) => {
  const { id } = req.params;

  // Check if the reset request is valid and active
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

      // Send the reset password HTML page
      res.sendFile(path.join(__dirname, "../public/resetpassword.html"));
    }
  );
};

// Handler to process the reset password submission
const resetPasswordSubmit = (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Validate password
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  // Check if reset request is valid
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
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password in signup table
        db.query(
          "UPDATE signup SET password = ? WHERE id = ?",
          [hashedPassword, requests[0].userId],
          (err2) => {
            if (err2) {
              console.error("Update error:", err2);
              return res.status(500).json({ success: false, message: "Failed to update password." });
            }

            // Deactivate the reset request
            db.query(
              "UPDATE ForgotPasswordRequests SET isActive = FALSE WHERE id = ?",
              [id],
              (err3) => {
                if (err3) {
                  console.error("Deactivate error:", err3);
                  return res.status(500).json({ success: false, message: "Something went wrong." });
                }

                return res.json({
                  success: true,
                  message: "Password reset successfully! You can now login with your new password.",
                  redirect: "login.html"
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

// Export the handlers
module.exports = {
  forgotPassword,
  resetPasswordForm,
  resetPasswordSubmit,
};
