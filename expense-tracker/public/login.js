document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    console.log("Login response:", data); // 👈 debug

    if (res.ok) {
      // ✅ store token properly (check your backend response key!)
      localStorage.setItem('token', data.token || data.jwt || data.accessToken);

      alert('Login successful!');
      window.location.href = 'expense.html'; // Redirect to expenses page
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Something went wrong');
  }
});
