import API_BASE_URL from "api.js";
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

let currentPage = 1;
let leaderboardPage = 1;

// ------------------ EXPENSES ------------------
async function loadExpenses(page = 1) {
  try {
    const pageSize = localStorage.getItem("pageSize") || 10;

    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses?page=${page}&limit=${pageSize}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    if (!res.ok || !data.expenses) {
      console.error("Error fetching expenses:", data);
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

// ------------------ ADD EXPENSE ------------------
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
      console.error("Error adding expense:", data);
      alert(data.error || "Failed to add expense");
      return;
    }

    e.target.reset();
    loadExpenses(currentPage);
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

// ------------------ DELETE EXPENSE ------------------
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/${id}`, {
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

// ------------------ REPORTS ------------------
window.loadReport = async (period) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses/report?period=${period}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      console.error("Report error:", data);
      alert(data.error || "Failed to load report");
      return;
    }

    const reportBody = document.getElementById("report-body");
    reportBody.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.period}</td>
        <td>${Number(row.total_income || 0).toFixed(2)}</td>
        <td>${Number(row.total_expense || 0).toFixed(2)}</td>
      `;
      reportBody.appendChild(tr);
    });

    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.disabled = false;
    downloadBtn.dataset.period = period;
  } catch (err) {
    console.error("Error loading report:", err);
  }
};

document.getElementById("download-btn").addEventListener("click", async () => {
  const period = document.getElementById("download-btn").dataset.period || "monthly";
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/download?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Download failed");
    const data = await res.json();
    if (!data.fileUrl) throw new Error("No file URL returned");
    window.open(data.fileUrl, "_blank");
  } catch (err) {
    console.error("Error downloading:", err);
    alert("Download failed.");
  }
});

// ------------------ EXPORT HISTORY ------------------
async function loadExportHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    const tbody = document.getElementById("history-body");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3">No reports generated yet.</td></tr>`;
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

document.getElementById("toggle-history-btn").addEventListener("click", async () => {
  const historySection = document.getElementById("history-section");
  if (historySection.classList.contains("hidden")) {
    await loadExportHistory();
    historySection.classList.remove("hidden");
    document.getElementById("toggle-history-btn").textContent = "Hide History";
  } else {
    historySection.classList.add("hidden");
    document.getElementById("toggle-history-btn").textContent = "Show History";
  }
});

// ------------------ LEADERBOARD ------------------
const leaderboardSection = document.getElementById("leaderboard-section");
const leaderboardBody = document.getElementById("leaderboard-body");

document.getElementById("show-leaderboard-btn").addEventListener("click", () => {
  leaderboardSection.classList.toggle("hidden");
  document.getElementById("show-leaderboard-btn").textContent = 
    leaderboardSection.classList.contains("hidden") ? "Show Leaderboard" : "Hide Leaderboard";
  if (!leaderboardSection.classList.contains("hidden")) {
    loadLeaderboard(1);
  }
});

document.getElementById("leaderboardPageSize").addEventListener("change", () => {
  loadLeaderboard(1);
});

async function loadLeaderboard(page = 1) {
  try {
    const pageSize = document.getElementById("leaderboardPageSize").value;
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/leaderboard?page=${page}&limit=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!Array.isArray(data.users)) throw new Error("Invalid leaderboard data");

    leaderboardBody.innerHTML = "";
    data.users.forEach((user, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${(page-1)*pageSize + idx + 1}</td>
        <td>${user.name}</td>
        <td>${user.total_expense ?? 0}</td>
      `;
      leaderboardBody.appendChild(tr);
    });

    renderLeaderboardPagination(data.pagination);
  } catch (err) {
    console.error("Error loading leaderboard:", err);
  }
}

function renderLeaderboardPagination({ page, totalPages }) {
  const container = document.getElementById("leaderboard-pagination");
  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => loadLeaderboard(page-1));
  container.appendChild(prevBtn);

  for (let i=1; i<=totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.addEventListener("click", () => loadLeaderboard(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => loadLeaderboard(page+1));
  container.appendChild(nextBtn);
}

// ------------------ LOGOUT ------------------
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

// ------------------ INITIAL LOAD ------------------
const savedSize = localStorage.getItem("pageSize") || 10;
document.getElementById("pageSizeSelect").value = savedSize;
document.getElementById("pageSizeSelect").addEventListener("change", (e) => {
  localStorage.setItem("pageSize", e.target.value);
  loadExpenses(1);
});

loadExpenses(currentPage);
