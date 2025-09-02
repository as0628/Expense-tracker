document.getElementById("reset-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const msg = document.getElementById("msg");

  if (password !== confirmPassword) {
    msg.textContent = "Passwords do not match!";
    msg.className = "message error";
    return;
  }

  const resetId = window.location.pathname.split("/").pop(); 

  try {
    const res = await fetch(`/password/resetpassword/${resetId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = data.message;
      msg.className = "message success";
      setTimeout(() => {
        
        window.location.href = "login.html";
      }, 2000);
    } else {
      msg.textContent = data.message || "Something went wrong!";
      msg.className = "message error";
    }
  } catch (err) {
    console.error("Error:", err);
    msg.textContent = "Server error. Please try again.";
    msg.className = "message error";
  }
});
