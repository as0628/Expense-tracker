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
        <td>${exp.type}</td>   <!-- ✅ Show income/expense -->
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
  const type = document.getElementById("type").value; // ✅ New field

  try {
    const res = await fetch("http://localhost:3000/api/premiumexpenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category, type }), // ✅ Send type
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
// Load Leaderboard
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
        <td>${user.total_expense || 0}</td>
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
// Reports
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const reportSection = document.getElementById("report-section");
  const downloadBtn = document.getElementById("download-btn");
  const reportBody = document.getElementById("report-body");

  // ✅ Always show report section for premium users
  reportSection.style.display = "block";

  // ✅ Disable download button until data is loaded
  downloadBtn.disabled = true;

  // Function to fetch report data
  async function loadReport(period) {
    try {
      const res = await fetch(`http://localhost:3000/api/premiumexpenses/report?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      // Clear old rows
      reportBody.innerHTML = "";

      // Fill table with report data
      data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.period}</td>
          <td>${row.total_income}</td>
          <td>${row.total_expense}</td>
        `;
        reportBody.appendChild(tr);
      });

      // ✅ Enable download button after data is loaded
      downloadBtn.disabled = false;

    } catch (err) {
      console.error("Error loading report:", err);
      alert("Failed to load report.");
    }
  }

  // Attach loadReport function to global scope so HTML buttons can call it
  window.loadReport = loadReport;

  // Handle download click
  downloadBtn.addEventListener("click", () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Period,Total Income,Total Expense\n";

    Array.from(reportBody.querySelectorAll("tr")).forEach(tr => {
      const cols = Array.from(tr.querySelectorAll("td")).map(td => td.innerText);
      csvContent += cols.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

// =========================
// Initial Load
// =========================
loadExpenses();
loadLeaderboard();
