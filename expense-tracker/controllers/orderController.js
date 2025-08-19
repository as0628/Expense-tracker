// controllers/orderController.js
const db = require("../config/db.js");
const { createOrder, getPaymentStatus } = require("../services/cashfreeService.js");

// ==============================
// Create new payment order
// ==============================
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from JWT middleware
    const orderId = "order_" + Date.now();
    const amount = 499; // fixed premium price

    // 1. Create order on Cashfree
    const order = await createOrder(
      orderId,
      amount,
      userId,
      "9999999999",
      
    );

    // 2. Save order in DB
    await db
      .promise()
      .query(
        "INSERT INTO orders (orderId, amount, status, userId) VALUES (?, ?, ?, ?)",
        [orderId, amount, "PENDING", userId]
      );

    return res.json({
      success: true,
      message: "Order created successfully",
      payment_session_id: order.payment_session_id,
      orderId,
    });
  } catch (err) {
  console.error("Error creating order (controller):", {
    message: err.message,
    response: err.response?.data,
    status: err.response?.status,
    headers: err.response?.headers,
    stack: err.stack
  });
  return res.status(500).json({ success: false, error: "Error creating order" });
}
}

// ==============================
// Verify payment status
// ==============================
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // 1. Ask Cashfree for status
    const payment = await getPaymentStatus(orderId);

    if (payment[0]?.payment_status === "SUCCESS") {
      // ✅ Mark order + upgrade user
      await db.promise().query("UPDATE orders SET status = 'SUCCESS' WHERE orderId = ?", [orderId]);
      await db.promise().query("UPDATE signup SET isPremium = 1 WHERE id = ?", [userId]);

      return res.json({
        success: true,
        message: "Payment successful, premium activated",
      });
    } else {
      // ❌ Payment failed
      await db.promise().query("UPDATE orders SET status = 'FAILED' WHERE orderId = ?", [orderId]);
      return res.json({ success: false, message: "Payment failed or pending" });
    }
  } catch (err) {
    console.error("Error verifying payment:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error verifying payment" });
  }
};

// ==============================
// Get payment status by orderId (for redirect page)
// ==============================
const getPaymentStatusById = async (req, res) => {
  const { orderId } = req.params;
  try {
    // fetch from DB
    const [rows] = await db.query("SELECT * FROM orders WHERE orderId = ?", [orderId]);
    if (rows.length === 0) {
      return res.status(404).send("Order not found");
    }

    // show simple HTML page (since Cashfree redirects user here)
    res.send(`
      <h1>Payment Status</h1>
      <p>Order ID: ${orderId}</p>
      <p>Status: ${rows[0].status}</p>
    `);
  } catch (err) {
    console.error("Error fetching order status:", err.message);
    res.status(500).send("Error fetching order status");
  }
};

// ✅ Export functions in CommonJS style
module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatusById,
};
