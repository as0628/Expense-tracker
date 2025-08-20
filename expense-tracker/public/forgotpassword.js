document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  try {
    const res = await fetch("http://localhost:3000/password/forgotpassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong");
      return;
    }

    alert(data.message || "Password reset link sent to your email!");
  } catch (err) {
    console.error("Error:", err);
    alert("Failed to send reset link. Try again later.");
  }
});
