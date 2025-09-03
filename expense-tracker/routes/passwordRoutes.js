const express = require("express");
const path = require("path"); // ✅ needed if using sendFile here
const router = express.Router();
const { 
  forgotPassword, 
  resetPasswordForm, 
  resetPasswordSubmit 
} = require("../controllers/passwordController");

router.post("/forgotpassword", forgotPassword);


router.get("/resetpassword/:id", resetPasswordForm);

router.post("/resetpassword/:id", resetPasswordSubmit);

module.exports = router;
