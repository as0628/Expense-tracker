const db = require("../config/db.js");
const { createOrder, getPaymentStatus } = require("../services/cashfreeService.js");

const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id; 
    const orderId = "order_" + Date.now();
    const amount = 499; 
    const order = await createOrder(
      orderId,
      amount,
      userId,
      "9999999999",
      
    );
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

const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    
    const payment = await getPaymentStatus(orderId);

    if (payment[0]?.payment_status === "SUCCESS") {
      
      await db.promise().query("UPDATE orders SET status = 'SUCCESS' WHERE orderId = ?", [orderId]);
      await db.promise().query("UPDATE signup SET isPremium = 1 WHERE id = ?", [userId]);

      return res.json({
        success: true,
        message: "Payment successful, premium activated",
      });
    } else {
      
      await db.promise().query("UPDATE orders SET status = 'FAILED' WHERE orderId = ?", [orderId]);
      return res.json({ success: false, message: "Payment failed or pending" });
    }
  } catch (err) {
    console.error("Error verifying payment:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Error verifying payment" });
  }
};

const getPaymentStatusById = async (req, res) => {
  const { orderId } = req.params;
  try {
    
    const [rows] = await db.query("SELECT * FROM orders WHERE orderId = ?", [orderId]);
    if (rows.length === 0) {
      return res.status(404).send("Order not found");
    }
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

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatusById,
};
