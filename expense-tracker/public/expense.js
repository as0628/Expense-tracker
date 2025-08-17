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
// Premium Purchase (updated)
// =========================
document.getElementById("buy-premium-btn").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must log in first!");
      window.location.href = "login.html";
      return;
    }

    const res = await fetch("http://localhost:3000/api/order/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });

    const data = await res.json();
    console.log("Order response:", data);

    if (!res.ok || !data.success) {
      alert(data.error || "Failed to create order.");
      return;
    }

    // 👉 Redirect to Cashfree page with session
    const qs = new URLSearchParams({
      orderId: data.orderId,
      sessionId: data.payment_session_id
    }).toString();

    window.location.href = `cashfree.html?${qs}`;
  } catch (err) {
    console.error("Error creating order:", err);
    alert("Something went wrong while creating order");
  }
});

// =========================
// Load Expenses
// =========================
async function loadExpenses() {
  try {
    const res = await fetch("http://localhost:3000/api/expenses", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

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
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;

  try {
    const res = await fetch("http://localhost:3000/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category }),
    });

    const data = await res.json();
    if (res.ok) {
      loadExpenses(); // refresh list
      document.getElementById("expense-form").reset();
    } else {
      alert(data.error || "Failed to add expense");
    }
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

// =========================
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/expenses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      loadExpenses();
    } else {
      alert(data.error || "Failed to delete expense");
    }
  } catch (err) {
    console.error("Error deleting expense:", err);
  }
}

// Initial load
loadExpenses();
