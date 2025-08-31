(async () => {
  const BASE_URL = window.location.origin; // http://127.0.0.1:3000 locally or http://3.110.204.39:3000 on AWS
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");  
  const token = localStorage.getItem("token");

  if (!orderId || !token) {
    document.getElementById("status").innerText = "Invalid request!";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/order/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();
    console.log("Verification response:", data);

    const statusEl = document.getElementById("status");
    const okBtn = document.getElementById("ok-btn");

    if (data.success) {
      statusEl.innerText = "✅ Payment successful! Premium activated.";
      okBtn.onclick = () => {
        window.location.href = `${BASE_URL}/login.html`;
      };
    } else {
      statusEl.innerText = "⚠️ Payment failed or pending.";
      okBtn.onclick = () => {
        window.location.href = `${BASE_URL}/expense.html`;
      };
    }

    okBtn.style.display = "inline-block";
  } catch (err) {
    console.error("Verification error:", err);
    document.getElementById("status").innerText = "Error verifying payment.";
  }
})();
