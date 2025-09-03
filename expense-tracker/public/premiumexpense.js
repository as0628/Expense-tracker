import API_BASE_URL from "api.js";
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

let currentPage = 1;
let leaderboardPage = 1; // track leaderboard current page

// ================== EXPENSES ==================
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

    renderPagination("pagination", data.pagination, loadExpenses);
    currentPage = data.pagination.page;
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// Reusable pagination renderer
function renderPagination(containerId, { page, totalPages }, callback) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => callback(page - 1));
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.addEventListener("click", () => callback(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => callback(page + 1));
  container.appendChild(nextBtn);
}

// ================== LEADERBOARD ==================
async function loadLeaderboard(page = 1) {
  try {
    const limit = 5; // fixed per page
    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses/leaderboard?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    if (!res.ok || !data.users) throw new Error("Invalid leaderboard data");

    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = "";

    data.users.forEach((user, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${(page - 1) * limit + idx + 1}</td>
        <td>${user.name}</td>
        <td>${user.total_expense ?? 0}</td>
      `;
      leaderboardBody.appendChild(tr);
    });

    renderPagination("leaderboard-pagination", data.pagination, loadLeaderboard);
    leaderboardPage = data.pagination.page;
  } catch (err) {
    console.error("Error loading leaderboard:", err);
  }
}

// ================== FORM & EVENTS ==================
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

// ================== PAGE LOAD ==================
document.addEventListener("DOMContentLoaded", () => {
  const leaderboardBtn = document.getElementById("show-leaderboard-btn");
  const leaderboardSection = document.getElementById("leaderboard-section");

  leaderboardBtn.addEventListener("click", async () => {
    const isHidden = leaderboardSection.classList.contains("hidden");
    if (isHidden) {
      await loadLeaderboard(1);
      leaderboardSection.classList.remove("hidden");
      leaderboardBtn.textContent = "Hide Leaderboard";
    } else {
      leaderboardSection.classList.add("hidden");
      leaderboardBtn.textContent = "Show Leaderboard";
    }
  });

  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const savedSize = localStorage.getItem("pageSize") || 10;
  pageSizeSelect.value = savedSize;
  pageSizeSelect.addEventListener("change", (e) => {
    localStorage.setItem("pageSize", e.target.value);
    loadExpenses(1);
  });

  loadExpenses(currentPage);
});
