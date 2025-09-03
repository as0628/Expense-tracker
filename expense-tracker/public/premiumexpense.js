import API_BASE_URL from "./api.js";
//import API_BASE_URL from "api.js";
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}
let currentPage = 1;

async function loadExpenses(page = 1) {
  try {
    const pageSize = localStorage.getItem("pageSize") || 30;

    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses?page=${page}&limit=${pageSize}`,
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

document.addEventListener("DOMContentLoaded", () => {
  const leaderboardBtn = document.getElementById("show-leaderboard-btn");
  const leaderboardSection = document.getElementById("leaderboard-section");
  const leaderboardBody = document.getElementById("leaderboard-body");
  const reportBody = document.getElementById("report-body");
  const downloadBtn = document.getElementById("download-btn");
  const pageSizeSelect = document.getElementById("pageSizeSelect");
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

  leaderboardBtn.addEventListener("click", async () => {
    const isHidden = leaderboardSection.classList.contains("hidden");
    if (isHidden) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/premiumexpenses/leaderboard`,
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
      }
    } else {
      leaderboardSection.classList.add("hidden");
      leaderboardBtn.textContent = "Show Leaderboard";
    }
  });

  
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

      downloadBtn.disabled = false;
      downloadBtn.dataset.period = period;
    } catch (err) {
      console.error("Error loading report:", err);
    }
  };

  downloadBtn.addEventListener("click", async () => {
    const period = downloadBtn.dataset.period || "monthly";
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/premiumexpenses/download?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");

      const data = await res.json();
      if (!data.fileUrl) throw new Error("No file URL returned");

      window.open(data.fileUrl, "_blank");
      console.log("📤 Report ready at:", data.fileUrl);
    } catch (err) {
      console.error("Error downloading:", err);
      alert("Download failed.");
    }
  });

  
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

  
  const savedSize = localStorage.getItem("pageSize") || 10;
  pageSizeSelect.value = savedSize;
  pageSizeSelect.addEventListener("change", (e) => {
    localStorage.setItem("pageSize", e.target.value);
    loadExpenses(1);
  });

  
  loadExpenses(currentPage);
});
