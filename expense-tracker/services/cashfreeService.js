// services/cashfreeService.js
import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,                // Switch to PRODUCTION later
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

// Function to create order
export const createOrder = async (orderId, orderAmount, customerID, customerPhone) => {
  try {
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    const formattedExpiryDate = expiryDate.toISOString();

    const request = {
      order_amount: orderAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: customerID.toString(),
        customer_phone: customerPhone,
        // customer_email: "test@example.com" // optional
      },
      order_meta: {
        return_url: `http://localhost:3000/payment-status/${orderId}`, 
        payment_methods: "cc,dc,upi"
      },
      order_expiry_time: formattedExpiryDate
    };

    const response = await cashfree.PGCreateOrder(request);
    return response.data; // contains payment_session_id
  } catch (error) {
    console.error("Error creating order:", error.response?.data || error.message);
    throw error;
  }
};

// Function to check payment status
export const getPaymentStatus = async (orderId) => {
  try {
    const response = await cashfree.PGOrderFetchPayments(orderId);
    return response.data;
  } catch (error) {
    console.error("Error fetching payment status:", error.response?.data || error.message);
    throw error;
  }
};
