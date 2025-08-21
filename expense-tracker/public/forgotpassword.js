document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const messageBox = document.getElementById("message"); // use existing div

  try {
    const res = await fetch("http://localhost:3000/password/forgotpassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      messageBox.className = "error";  // styled via CSS
      messageBox.textContent = data.error || "Something went wrong";
      return;
    }

    // Show success
    messageBox.className = "success";
    messageBox.innerHTML = `
      <p>${data.message}</p>
      <p>Reset Link: <a href="${data.resetUrl}" target="_blank">${data.resetUrl}</a></p>
    `;
  } catch (err) {
    console.error("Error:", err);
    messageBox.className = "error";
    messageBox.textContent = "Failed to send reset link. Try again later.";
  }
});
