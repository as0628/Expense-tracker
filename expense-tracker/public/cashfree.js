import API_BASE_URL from "api.js"; // make sure api.js exists in /public/js

// Initialize Cashfree in sandbox mode (use "production" when going live)
const cashfree = Cashfree({ mode: "sandbox" });

document.getElementById("renderBtn").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      return;
    }

    // Call backend to create order
    const res = await fetch(`${API_BASE_URL}/api/order/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("Order API response:", data);

    if (!data.payment_session_id) {
      alert("❌ Failed to create Cashfree order");
      return;
    }

    // Open Cashfree checkout
    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self", // redirect back to return_url after payment
    });
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong while starting payment!");
  }
});
