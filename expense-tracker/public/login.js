import API_BASE_URL from "api.js";

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    console.log("Login response:", data);

    if (res.ok) {
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('isPremium', data.isPremium);

      
      if (data.isPremium === 1 || data.isPremium === true) {
        window.location.href = 'premiumexpense.html';
      } else {
        window.location.href = 'expense.html';
      }
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Something went wrong. Please try again later.');
  }
});
