const BASE_URL = window.location.hostname.includes("localhost") 
      ? "http://localhost:3000/api" 
      : "http://3.110.204.39:3000/api"; 

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const messageBox = document.getElementById('message');
      const submitBtn = e.target.querySelector("button[type=submit]");

      messageBox.textContent = "";
      messageBox.className = "";

      if (!email || !password) {
        messageBox.className = "error";
        messageBox.textContent = "Email and password are required!";
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";

        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("Login response:", data);

        if (res.ok) {
          // ✅ Save auth details
          localStorage.setItem('token', data.token);
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('isPremium', data.isPremium);

          messageBox.className = "success";
          messageBox.textContent = "Login successful! Redirecting...";

          // ✅ Redirect based on premium status
          setTimeout(() => {
            if (data.isPremium === 1 || data.isPremium === true) {
              window.location.href = "premiumexpense.html";
            } else {
              window.location.href = "expense.html";
            }
          }, 800);
        } else {
          messageBox.className = "error";
          messageBox.textContent = data.error || "Invalid credentials!";
        }
      } catch (err) {
        console.error("Login error:", err);
        messageBox.className = "error";
        messageBox.textContent = "Something went wrong. Try again later.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    });
