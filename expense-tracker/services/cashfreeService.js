const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

const createOrder = async (orderId, orderAmount, userId, customerPhone) => {
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
          customer_email: "test@gmail.com",
        },
        order_meta: {
          return_url: `${BASE_URL}/payment-status.html?order_id=${orderId}`, // ✅ updated
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
