  const BASE_URL = window.location.hostname.includes("localhost") 
      ? "http://localhost:3000" 
      : "http://3.110.204.39:3000"; 

    document.getElementById("forgot-form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const messageBox = document.getElementById("message");
      const submitBtn = e.target.querySelector("button[type=submit]");

      // Reset message
      messageBox.textContent = "";
      messageBox.className = "";

      if (!email) {
        messageBox.className = "error";
        messageBox.textContent = "Email is required!";
        return;
      }

      try {
        // Disable button while sending
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        const res = await fetch(`${BASE_URL}/password/forgotpassword`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!res.ok) {
          messageBox.className = "error";
          messageBox.textContent = data.error || "Something went wrong";
        } else {
          messageBox.className = "success";
          messageBox.innerHTML = `
            <p>${data.message}</p>
            <p>Reset Link: <a href="${data.resetUrl}" target="_blank">${data.resetUrl}</a></p>
          `;
        }
      } catch (err) {
        console.error("Error:", err);
        messageBox.className = "error";
        messageBox.textContent = "Failed to send reset link. Try again later.";
      } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Reset Link";
      }
    });