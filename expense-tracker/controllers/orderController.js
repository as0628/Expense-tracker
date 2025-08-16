// controllers/orderController.js
const axios = require("axios");
const db = require("../config/db"); // ✅ should be pool.promise()
require("dotenv").config();

const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY } = process.env;


// Create Order
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ available from JWT auth middleware

    // Insert PENDING order into DB
    db.query(
      "INSERT INTO orders (user_id, status) VALUES (?, ?)",
      [userId, "PENDING"],
      async (err, result) => {
        if (err) {
          console.error("DB Error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        const orderId = result.insertId; // ✅ DB-generated order ID

        try {
          // Call Cashfree API
          const response = await axios.post(
            "https://sandbox.cashfree.com/pg/orders",
            {
              order_id: orderId.toString(),
              order_amount: 499,
              order_currency: "INR",
              customer_details: {
                customer_id: userId.toString(),
                customer_email: req.user.email,
                customer_phone: "9999999999", // dummy for now
              },
            },
            {
              headers: {
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY,
                "x-api-version": "2022-09-01",
                "Content-Type": "application/json",
              },
            }
          );

          res.json({ paymentLink: response.data.payment_link, orderId });
        } catch (apiErr) {
          console.error("Cashfree API Error:", apiErr.response?.data || apiErr.message);
          res.status(500).json({ error: "Failed to create order" });
        }
      }
    );
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Update Order Status
const updateOrderStatus = (req, res) => {
  const { orderId, status } = req.body;

  db.query("UPDATE orders SET status=? WHERE id=?", [status, orderId], (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (status === "SUCCESS") {
      db.query("UPDATE signup SET isPremium=? WHERE id=?", [true, req.user.id], (err2) => {
        if (err2) {
          console.error("DB Error:", err2);
          return res.status(500).json({ error: "Failed to update user premium" });
        }
        return res.json({ message: "Order successful, user upgraded to premium" });
      });
    } else {
      res.json({ message: "Order status updated" });
    }
  });
};

module.exports = { createOrder, updateOrderStatus };
