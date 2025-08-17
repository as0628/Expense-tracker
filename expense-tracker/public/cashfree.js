const cashfree = Cashfree({ mode: "sandbox" }); // change to "production" later

document.getElementById("renderBtn").addEventListener("click", async () => {
  try {
    // 1. Get user token
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      return;
    }

    // 2. Create order on backend
    const res = await fetch("http://localhost:3000/api/order/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ fixed
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error("Backend Error: " + errText);
    }

    const data = await res.json();
    console.log("Order Response:", data);

    if (!data.payment_session_id || !data.orderId) {
      alert("Failed to create Cashfree order. Please try again.");
      return;
    }

    // 3. Start Cashfree Checkout
    let checkoutOptions = {
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self", // or "_blank"
    };

    cashfree.checkout(checkoutOptions).then(async (result) => {
      console.log("Payment result:", result);

      // 4. Verify payment with backend
      try {
        const verifyRes = await fetch("http://localhost:3000/api/order/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ fixed
          },
          body: JSON.stringify({ orderId: data.orderId }),
        });

        const verifyData = await verifyRes.json();
        console.log("Verification response:", verifyData);

        if (verifyData.success) {
          alert("✅ Payment successful and verified!");
        } else {
          alert("⚠️ Payment done, but verification failed.");
        }
      } catch (verifyErr) {
        console.error("Verification error:", verifyErr);
        alert("Error verifying payment with backend.");
      }
    });

  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong while starting payment!");
  }
});
