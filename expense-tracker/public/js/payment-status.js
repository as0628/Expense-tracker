const BASE_URL = window.location.hostname.includes("localhost")
      ? "http://localhost:3000/api"
      : "http://3.110.204.39:3000/api";

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("order_id"); // Cashfree adds ?order_id=xxxx
      const token = localStorage.getItem("token");

      if (!orderId || !token) {
        document.getElementById("status").innerText = "❌ Invalid request!";
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/order/status`, {
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

        if (res.ok && data.success) {
          statusEl.innerText = "✅ Payment successful! Premium activated.";
          okBtn.onclick = () => {
            window.location.href = "login.html";
          };
        } else {
          statusEl.innerText = "⚠️ Payment failed or still pending.";
          okBtn.onclick = () => {
            window.location.href = "expense.html";
          };
        }

        // ✅ Show button in both cases
        okBtn.style.display = "inline-block";
      } catch (err) {
        console.error("Verification error:", err);
        document.getElementById("status").innerText = "❌ Error verifying payment. Try again.";
      }
    })();