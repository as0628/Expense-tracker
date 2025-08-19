// ✅ Step 1: Get token first
const token = localStorage.getItem("token");

if (!token) {
  alert("You must log in first!");
  window.location.href = "login.html";
} else {
  // Show page if logged in
  document.getElementById("expense-container").style.display = "block";
}

// =========================
// Load Expenses
// =========================
async function loadExpenses() {
  try {
    const res = await fetch("http://localhost:3000/api/premiumexpenses", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error fetching expenses:", data);
      alert(data.message || "Failed to load expenses");
      return;
    }

    if (!Array.isArray(data)) {
      console.error("Unexpected response:", data);
      return;
    }

    const expenseBody = document.getElementById("expense-body");
    expenseBody.innerHTML = ""; // clear old data

    data.forEach((exp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${exp.amount}</td>
        <td>${exp.description}</td>
        <td>${exp.category}</td>
        <td>
          <button onclick="deleteExpense(${exp.id})">Delete</button>
        </td>
      `;
      expenseBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// =========================
// Add Expense
// =========================
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;

  try {
    const res = await fetch("http://localhost:3000/api/premiumexpenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error adding expense:", data);
      alert(data.error || "Failed to add expense");
      return;
    }

    loadExpenses(); // refresh list
    document.getElementById("expense-form").reset();
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

// =========================
// Delete Expense
// =========================
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/premiumexpenses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error deleting expense:", data);
      alert(data.error || "Failed to delete expense");
      return;
    }

    loadExpenses();
  } catch (err) {
    console.error("Error deleting expense:", err);
  }
}

// =========================
// Load Leaderboard (✅ Fixed URL + handling)
// =========================
// Load Leaderboard (✅ Fixed for your HTML)
// =========================
async function loadLeaderboard() {
  try {
    const res = await fetch("http://localhost:3000/api/premiumexpenses/leaderboard", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    console.log("Leaderboard data:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid leaderboard data");
    }

    // ✅ Target correct tbody
    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = "";

    data.forEach((user, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.name} (${user.email})</td>
        <td>${user.total_spent || 0}</td>
      `;
      leaderboardBody.appendChild(row);
    });

    // ✅ Show section only when loaded
    document.getElementById("leaderboard-section").style.display = "block";

  } catch (err) {
    console.error("Error loading leaderboard:", err);
  }
}

// =========================
// Button to Show Leaderboard
// =========================
document.getElementById("show-leaderboard-btn")
  .addEventListener("click", loadLeaderboard);



// =========================
// Initial Load
// =========================
loadExpenses();
loadLeaderboard();
