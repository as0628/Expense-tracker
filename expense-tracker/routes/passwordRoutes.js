const express = require("express");
const router = express.Router();
const { 
  forgotPassword, 
  resetPasswordForm, 
  resetPasswordSubmit 
} = require("../controllers/passwordController");

router.post("/forgotpassword", forgotPassword);
router.get("/resetpassword/:id", (req, res) => {
  // Optional: validate the ID in DB
  res.sendFile(path.join(__dirname, "../public/resetpassword.html"));
});

router.post("/resetpassword/:id", resetPasswordSubmit);

module.exports = router;
