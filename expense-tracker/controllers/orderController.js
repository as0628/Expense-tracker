// controllers/orderController.js
import db from "../config/db.js";        
import { createOrder, getPaymentStatus } from "../services/cashfreeService.js";

// ==============================
// Create new payment order
// ==============================
export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from JWT middleware
    const orderId = "order_" + Date.now();
    const amount = 499; // fixed premium price

    // 1. Create order on Cashfree
    const order = await createOrder(orderId, amount, userId, "9999999999", {
      // 👇 Cashfree will redirect back here after payment
      return_url: `http://localhost:5173/payment-status?order_id=${orderId}`, 
    });

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
    console.error("Error creating order:", err);
    return res.status(500).json({ success: false, error: "Error creating order" });
  }
};

// ==============================
// Verify payment status
// ==============================
export const verifyPayment = async (req, res) => {
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
    console.error("Error verifying payment:", err);
    return res.status(500).json({ success: false, error: "Error verifying payment" });
  }
};
