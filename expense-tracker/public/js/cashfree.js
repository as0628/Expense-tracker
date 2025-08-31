  const BASE_URL = window.location.hostname.includes("localhost") 
    ? "http://localhost:3000/api" 
    : "http://3.110.204.39:3000/api";

  const cashfree = Cashfree({ mode: "sandbox" }); // or "production" when live

  document.getElementById("renderBtn").addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first!");
        return;
      }

      const res = await fetch(`${BASE_URL}/order/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.payment_session_id) {
        alert("Failed to create Cashfree order");
        return;
      }

      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self", // redirect to return_url
      });
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong while starting payment!");
    }
  });