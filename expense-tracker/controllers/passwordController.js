// const Sib = require("sib-api-v3-sdk");
// const { v4: uuidv4 } = require("uuid");
// const bcrypt = require("bcrypt");
// require("dotenv").config();
// const db = require("../config/db"); // your MySQL connection

// // Forgot password - send reset link
// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ error: "Email is required" });

//     // Find user in DB
//     const [users] = await db.execute("SELECT * FROM signup WHERE email = ?", [email]);
//     if (users.length === 0) return res.status(404).json({ error: "User not found" });

//     const user = users[0];

//     // Create reset request
//     const resetRequestId = uuidv4();
//     await db.execute(
//       "INSERT INTO ForgotPasswordRequests (id, userId, isActive) VALUES (?, ?, ?)",
//       [resetRequestId, user.id, true]
//     );

//     const resetUrl = `http://localhost:3000/password/resetpassword/${resetRequestId}`;

//     // Send email via Sendinblue / Brevo
//     const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.SENDINBLUE_API;

//     const tranEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = { email: process.env.FROM_EMAIL, name: "Expense Tracker App" };
//     const receivers = [{ email }];

//     await tranEmailApi.sendTransacEmail({
//       sender,
//       to: receivers,
//       subject: "Reset your password",
//       textContent: `Hi, you requested a password reset. Copy this link: ${resetUrl}`,
//       htmlContent: `<p>Click the link below to reset your password:</p>
//                     <a href="${resetUrl}">Reset Password</a>`
//     });

//     res.json({ message: "Password reset link sent successfully!", resetUrl });
//   } catch (err) {
//     console.error("Forgot password error:", err);
//     res.status(500).json({ error: "Failed to send reset email" });
//   }
// };

// // Show reset password form
// const resetPasswordForm = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [requests] = await db.execute(
//       "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
//       [id]
//     );

//     if (requests.length === 0) return res.status(400).send("Invalid or expired reset link.");

//     res.send(`
//       <h2>Reset Password</h2>
//       <form action="/password/resetpassword/${id}" method="POST">
//         <input type="password" name="password" placeholder="Enter new password" required />
//         <button type="submit">Reset Password</button>
//       </form>
//     `);
//   } catch (err) {
//     console.error("Reset password form error:", err);
//     res.status(500).send("Something went wrong.");
//   }
// };

// // Handle reset password submission
// const resetPasswordSubmit = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { password } = req.body;

//     const [requests] = await db.execute(
//       "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
//       [id]
//     );

//     if (requests.length === 0) return res.status(400).send("Invalid or expired reset link.");

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Update user's password
//     await db.execute(
//       "UPDATE signup SET password = ? WHERE id = ?",
//       [hashedPassword, requests[0].userId]
//     );

//     // Deactivate reset request
//     await db.execute(
//       "UPDATE ForgotPasswordRequests SET isActive = FALSE WHERE id = ?",
//       [id]
//     );

//     res.send("Password reset successfully! You can now login with your new password.");
//   } catch (err) {
//     console.error("Reset password submit error:", err);
//     res.status(500).send("Something went wrong.");
//   }
// };

// module.exports = {
//   forgotPassword,
//   resetPasswordForm,
//   resetPasswordSubmit
// };
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();
const db = require("../config/db"); // your MySQL connection

// Forgot password - create reset link (no email sending)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Find user in DB
    const [users] = await db.execute("SELECT * FROM signup WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const user = users[0];

    // Create reset request
    const resetRequestId = uuidv4();
    await db.execute(
      "INSERT INTO ForgotPasswordRequests (id, userId, isActive) VALUES (?, ?, ?)",
      [resetRequestId, user.id, true]
    );

    const resetUrl = `http://localhost:3000/password/resetpassword/${resetRequestId}`;

    // Instead of sending email, just log and return the link
    console.log("Reset URL:", resetUrl);
    res.json({ message: "Password reset link created!", resetUrl });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to create reset link" });
  }
};

// Show reset password form
const resetPasswordForm = async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await db.execute(
      "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
      [id]
    );

    if (requests.length === 0) return res.status(400).send("Invalid or expired reset link.");

    res.send(`
      <h2>Reset Password</h2>
      <form action="/password/resetpassword/${id}" method="POST">
        <input type="password" name="password" placeholder="Enter new password" required />
        <button type="submit">Reset Password</button>
      </form>
    `);
  } catch (err) {
    console.error("Reset password form error:", err);
    res.status(500).send("Something went wrong.");
  }
};

// Handle reset password submission
const resetPasswordSubmit = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const [requests] = await db.execute(
      "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
      [id]
    );

    if (requests.length === 0) return res.status(400).send("Invalid or expired reset link.");

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await db.execute(
      "UPDATE signup SET password = ? WHERE id = ?",
      [hashedPassword, requests[0].userId]
    );

    // Deactivate reset request
    await db.execute(
      "UPDATE ForgotPasswordRequests SET isActive = FALSE WHERE id = ?",
      [id]
    );

    res.send("Password reset successfully! You can now login with your new password.");
  } catch (err) {
    console.error("Reset password submit error:", err);
    res.status(500).send("Something went wrong.");
  }
};

module.exports = {
  forgotPassword,
  resetPasswordForm,
  resetPasswordSubmit
};
