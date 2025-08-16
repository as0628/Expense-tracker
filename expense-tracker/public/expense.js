// expense.js

const token = localStorage.getItem("token");
console.log("Token in localStorage:", token);   
// If no token, force login
if (!token) {
  alert("You must log in first!");
  window.location.href = "login.html";
}

const expenseContainer = document.getElementById("expense-container");
const expenseBody = document.getElementById("expense-body");
const expenseForm = document.getElementById("expense-form");

// Show page if logged in
expenseContainer.style.display = "block";

// Load Expenses
async function loadExpenses() {
  try {
    const res = await fetch("http://localhost:3000/api/expenses", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
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

// Add Expense
expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = document.getElementById("amount").value;
  const description = document.getElementById("description").value;
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
      alert("Expense added!");
      loadExpenses();
      expenseForm.reset();
    } else {
      alert(data.error || "Failed to add expense");
    }
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

// Delete Expense
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/expenses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      alert("Expense deleted!");
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
