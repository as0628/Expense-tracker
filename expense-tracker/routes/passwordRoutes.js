const express = require("express");
const router = express.Router();
const { 
  forgotPassword, 
  resetPasswordForm, 
  resetPasswordSubmit 
} = require("../controllers/passwordController");

// Send reset password email
router.post("/forgotpassword", forgotPassword);

// Show reset password form
router.get("/resetpassword/:id", resetPasswordForm);

// Handle new password submission
router.post("/resetpassword/:id", resetPasswordSubmit);

module.exports = router;
