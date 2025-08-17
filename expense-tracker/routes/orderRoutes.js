const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");

// Create Cashfree Order (requires login)
router.post("/order", auth, orderController.createPaymentOrder);

// Verify / Update Order Status (also requires login)
router.post("/status", auth, orderController.verifyPayment);

module.exports = router;
