// Set your API base URL
const API_BASE_URL = "http://3.109.62.226";

document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const messageBox = document.getElementById("message");

  // Clear previous messages
  messageBox.textContent = "";
  messageBox.className = "";

  if (!email) {
    messageBox.className = "error";
    messageBox.textContent = "Please enter your email.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/password/forgotpassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      messageBox.className = "error";
      messageBox.textContent = data.error || "Something went wrong.";
      return;
    }

    // Success: show reset link
    messageBox.className = "success";
    messageBox.innerHTML = `
      <p>${data.message}</p>
      <p>Reset Link: <a href="${data.resetUrl}" target="_blank">${data.resetUrl}</a></p>
    `;

    console.log("Reset URL:", data.resetUrl);

  } catch (err) {
    console.error("Error:", err);
    messageBox.className = "error";
    messageBox.textContent = "Failed to send reset link. Try again later.";
  }
});
