// premium.js

// Use API_BASE_URL from api.js (must be defined in HTML first)
const API_BASE_URL = window.API_BASE_URL || "http://3.109.62.226:3000";

// Authentication check
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

let currentPage = 1;

/* ---------------- EXPENSES ---------------- */
async function loadExpenses(page = 1) {
  try {
    const pageSize = localStorage.getItem("pageSize") || 30;
    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses?page=${page}&limit=${pageSize}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    if (!res.ok || !data.expenses) {
      alert(data.message || "Failed to load expenses");
      return;
    }

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
  prevBtn.onclick = () => loadExpenses(page - 1);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.onclick = () => loadExpenses(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.onclick = () => loadExpenses(page + 1);
  container.appendChild(nextBtn);
}

/* ---------------- ADD EXPENSE ---------------- */
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;
  const note = document.getElementById("note").value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category, type, note }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to add expense");
      return;
    }

    e.target.reset();
    loadExpenses(currentPage);
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

/* ---------------- DELETE EXPENSE ---------------- */
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to delete expense");
      return;
    }

    loadExpenses(currentPage);
  } catch (err) {
    console.error("Error deleting expense:", err);
  }
}
window.deleteExpense = deleteExpense;

/* ---------------- LEADERBOARD ---------------- */
async function loadLeaderboard() {
  const leaderboardBody = document.getElementById("leaderboard-body");
  const leaderboardSection = document.getElementById("leaderboard-section");
  const leaderboardBtn = document.getElementById("show-leaderboard-btn");

  const isHidden = leaderboardSection.classList.contains("hidden");
  if (isHidden) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

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
    }
  } else {
    leaderboardSection.classList.add("hidden");
    leaderboardBtn.textContent = "Show Leaderboard";
  }
}

/* ---------------- REPORT & DOWNLOAD ---------------- */
async function loadReport(period) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses/report?period=${period}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      alert(data.error || "Failed to load report");
      return;
    }

    const reportBody = document.getElementById("report-body");
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

    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.disabled = false;
    downloadBtn.dataset.period = period;
  } catch (err) {
    console.error("Error loading report:", err);
  }
}
window.loadReport = loadReport;

async function downloadReport() {
  const downloadBtn = document.getElementById("download-btn");
  const period = downloadBtn.dataset.period || "monthly";

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses/download?period=${period}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    if (!res.ok || !data.fileUrl) {
      alert("Download failed.");
      return;
    }

    window.open(data.fileUrl, "_blank");
  } catch (err) {
    console.error("Error downloading report:", err);
  }
}

/* ---------------- EXPORT HISTORY ---------------- */
async function loadExportHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    const tbody = document.getElementById("history-body");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="3">No reports generated yet.</td>`;
      tbody.appendChild(tr);
      return;
    }

    data.forEach((file, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${new Date(file.created_at).toLocaleString()}</td>
        <td><a href="${file.url}" target="_blank">⬇ Download</a></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading history:", err);
  }
}
window.loadExportHistory = loadExportHistory;

/* ---------------- ON PAGE LOAD ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("show-leaderboard-btn")
    .addEventListener("click", loadLeaderboard);

  document.getElementById("download-btn")
    .addEventListener("click", downloadReport);

  const historyBtn = document.getElementById("toggle-history-btn");
  const historySection = document.getElementById("history-section");

  historyBtn.addEventListener("click", async () => {
    const isHidden = historySection.classList.contains("hidden");
    if (isHidden) {
      await loadExportHistory();
      historySection.classList.remove("hidden");
      historyBtn.textContent = "Hide History";
    } else {
      historySection.classList.add("hidden");
      historyBtn.textContent = "Show History";
    }
  });

  // Handle page size change
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const savedSize = localStorage.getItem("pageSize") || 10;
  pageSizeSelect.value = savedSize;
  pageSizeSelect.addEventListener("change", (e) => {
    localStorage.setItem("pageSize", e.target.value);
    loadExpenses(1);
  });

  // Initial load
  loadExpenses(currentPage);
});
