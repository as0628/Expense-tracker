// services/cashfreeService.js
const axios = require("axios");

// ==============================
// Function to create order
// ==============================
const createOrder = async (orderId, orderAmount, userId, customerPhone) => {
  try {
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(userId),   // 👈 force it to string
          customer_phone: String(customerPhone),
          customer_email: "test@gmail.com",
        },
        order_meta: {
          return_url: `http://3.110.204.39:3000/expense-tracker/public/payment-status.html?order_id=${orderId}`,
        },
      },
      {
        headers: {
          accept: "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "content-type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error creating order:", error.response?.data || error.message);
    throw error;
  }
};


// ==============================
// Function to check payment status
// ==============================
const getPaymentStatus = async (orderId) => {
  try {
    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`,
      {
        headers: {
          accept: "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
        },
      }
    );

    return response.data; // ✅ array of payments
  } catch (error) {
    console.error(
      "Error fetching payment status:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Export functions in CommonJS
module.exports = {
  createOrder,
  getPaymentStatus,
};
