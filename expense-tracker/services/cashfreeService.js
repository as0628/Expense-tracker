// services/cashfreeService.js
const axios = require("axios");

// Base URL for redirects (local or AWS)
const BASE_URL = process.env.BASE_URL || "http://3.110.204.39:3000";

/**
 * Create a new payment order on Cashfree
 * @param {string} orderId - Unique order ID
 * @param {number} orderAmount - Amount in INR
 * @param {string|number} userId - User ID
 * @param {string|number} customerPhone - Customer phone number
 * @param {string} customerEmail - Customer email
 * @returns {Promise<object>} - Cashfree order response
 */
const createOrder = async (orderId, orderAmount, userId, customerPhone, customerEmail = "test@gmail.com") => {
  try {
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(userId),
          customer_phone: String(customerPhone),
          customer_email: customerEmail,
        },
        order_meta: {
          return_url: `${BASE_URL}/payment-status.html?order_id=${orderId}`, // dynamic redirect
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

/**
 * Check payment status of an order on Cashfree
 * @param {string} orderId
 * @returns {Promise<object>} - Cashfree payment status response
 */
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

    return response.data; // array of payment objects
  } catch (error) {
    console.error("Error fetching payment status:", error.response?.data || error.message);
    throw error;
  }
};

// Export functions
module.exports = {
  createOrder,
  getPaymentStatus,
  BASE_URL, // export BASE_URL for frontend redirects
};
