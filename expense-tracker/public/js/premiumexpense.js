// ===== JWT check =====
const token = localStorage.getItem("token");
if (!token) {
  alert("You must log in first!");
  window.location.href = "login.html";
}

let currentPage = 1;

// ====== Load Expenses with Pagination ======
async function loadExpenses(page = 1) {
  try {
    const pageSize = localStorage.getItem("pageSize") || 10;

    const res = await fetch(
      `http://localhost:3000/api/premiumexpenses?page=${page}&limit=${pageSize}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    if (!res.ok || !data.expenses) {
      console.error("Error fetching expenses:", data);
      alert(data.message || "Failed to load expenses");
      return;
    }

    // === Render table ===
    const tbody = document.getElementById("expense-body");
    tbody.innerHTML = "";

    data.expenses.forEach((exp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${Number(exp.amount).toFixed(2)}</td>
        <td>${exp.description}</td>
        <td>${exp.category}</td>
        <td>${exp.type}</td>
        <td>${exp.note || ""}</td>
        <td><button onclick="deleteExpense(${exp.id})">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });

    // === Render pagination ===
    renderPagination(data.pagination);
    currentPage = data.pagination.page;
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

function renderPagination({ page, totalPages }) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => loadExpenses(page - 1));
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.addEventListener("click", () => loadExpenses(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => loadExpenses(page + 1));
  container.appendChild(nextBtn);
}

// ====== Add Expense ======
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;
  const note = document.getElementById("note").value.trim();

  try {
    const res = await fetch("http://localhost:3000/api/premiumexpenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category, type, note }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error("Error adding expense:", data);
      alert(data.error || "Failed to add expense");
      return;
    }

    e.target.reset();
    loadExpenses(currentPage); // reload same page
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
    loadExpenses(currentPage);
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
  const pageSizeSelect = document.getElementById("pageSizeSelect");

  // --- Leaderboard toggle ---
  leaderboardBtn.addEventListener("click", async () => {
    const isHidden = leaderboardSection.classList.contains("hidden");
    if (isHidden) {
      try {
        const res = await fetch(
          "http://localhost:3000/api/premiumexpenses/leaderboard",
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  // --- Load report into table ---
  window.loadReport = async (period) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/premiumexpenses/report?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  // --- Download ---
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

      console.log("📤 Report downloaded:", a.download);
    } catch (err) {
      console.error("Error downloading:", err);
      alert("Download failed.");
    }
  });

  // --- Page size dropdown ---
  const savedSize = localStorage.getItem("pageSize") || 10;
  pageSizeSelect.value = savedSize;
  pageSizeSelect.addEventListener("change", (e) => {
    localStorage.setItem("pageSize", e.target.value);
    loadExpenses(1); // reset to first page
  });

  // Initial load
  loadExpenses(currentPage);
});
