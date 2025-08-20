document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const resultContainer = document.getElementById("result");

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

    // Display link on the page
    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
      resultDiv = document.createElement("div");
      resultDiv.id = "result";
      document.body.appendChild(resultDiv);
    }
    resultDiv.innerHTML = `
      <p>${data.message}</p>
      <p>Reset Link: <a href="${data.resetUrl}" target="_blank">${data.resetUrl}</a></p>
    `;
  } catch (err) {
    console.error("Error:", err);
    alert("Failed to send reset link. Try again later.");
  }
});
