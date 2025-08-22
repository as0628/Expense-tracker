// ===== JWT check =====
const token = localStorage.getItem("token");
if (!token) {
  alert("You must log in first!");
  window.location.href = "login.html";
}

// ====== Load Expenses ======
async function loadExpenses() {
  try {
    const res = await fetch("http://localhost:3000/api/premiumexpenses", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      console.error("Error fetching expenses:", data);
      alert(data.message || "Failed to load expenses");
      return;
    }

    const tbody = document.getElementById("expense-body");
    tbody.innerHTML = "";

    data.forEach((exp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${Number(exp.amount).toFixed(2)}</td>
        <td>${exp.description}</td>
        <td>${exp.category}</td>
        <td>${exp.type}</td>
        <td><button onclick="deleteExpense(${exp.id})">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// ====== Add Expense ======
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;

  try {
    const res = await fetch("http://localhost:3000/api/premiumexpenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category, type }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error("Error adding expense:", data);
      alert(data.error || "Failed to add expense");
      return;
    }

    e.target.reset();
    loadExpenses();
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

// ====== Delete Expense ======
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

// ====== Leaderboard + Reports ======
document.addEventListener("DOMContentLoaded", () => {
  const leaderboardBtn = document.getElementById("show-leaderboard-btn");
  const leaderboardSection = document.getElementById("leaderboard-section");
  const leaderboardBody = document.getElementById("leaderboard-body");
  const reportBody = document.getElementById("report-body");
  const downloadBtn = document.getElementById("download-btn");

  // --- Leaderboard toggle ---
  leaderboardBtn.addEventListener("click", async () => {
    const isHidden = leaderboardSection.classList.contains("hidden");
    if (isHidden) {
      try {
        const res = await fetch("http://localhost:3000/api/premiumexpenses/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!Array.isArray(data)) throw new Error("Invalid leaderboard data");

        leaderboardBody.innerHTML = "";
        data.forEach((user, idx) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${user.name}</td>
            <td>${user.total_expense ?? 0}</td>
          `;
          leaderboardBody.appendChild(tr);
        });

        leaderboardSection.classList.remove("hidden");
        leaderboardBtn.textContent = "Hide Leaderboard";
      } catch (err) {
        console.error("Error loading leaderboard:", err);
        alert("Failed to load leaderboard");
      }
    } else {
      leaderboardSection.classList.add("hidden");
      leaderboardBtn.textContent = "Show Leaderboard";
    }
  });

  // --- Load report into table (JSON endpoint) ---
  window.loadReport = async (period) => {
    try {
      const res = await fetch(`http://localhost:3000/api/premiumexpenses/report?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        console.error("Report error:", data);
        alert(data.error || "Failed to load report");
        return;
      }

      reportBody.innerHTML = "";
      data.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.period}</td>
          <td>${Number(row.total_income || row.totalIncome || 0).toFixed(2)}</td>
          <td>${Number(row.total_expense || row.totalExpense || 0).toFixed(2)}</td>
        `;
        reportBody.appendChild(tr);
      });

      // enable download, remember selected period
      downloadBtn.disabled = false;
      downloadBtn.dataset.period = period;
    } catch (err) {
      console.error("Error loading report:", err);
      alert("Failed to load report.");
    }
  };

  // --- Download (fetch + Blob so JWT is included) ---
  downloadBtn.addEventListener("click", async () => {
  const period = downloadBtn.dataset.period || "monthly";
  try {
    const res = await fetch(
      `http://localhost:3000/api/premiumexpenses/download?period=${period}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Download failed");

    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || "";
    console.log("📥 Content-Type:", contentType);

    // ✅ handle Excel properly
    const ext = contentType.includes("spreadsheetml") ? "xlsx" :
                contentType.includes("pdf") ? "pdf" :
                contentType.includes("csv") ? "csv" : "dat";

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ExpenseReport-${period}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log("📤 Excel downloaded successfully:", a.download);
  } catch (err) {
    console.error("Error downloading:", err);
    alert("Download failed.");
  }
});

});

// ===== initial load =====
loadExpenses();
