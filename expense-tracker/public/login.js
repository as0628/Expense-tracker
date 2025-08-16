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

    if (res.ok) {
      localStorage.setItem('token', data.token);
      alert('Login successful!');
      window.location.href = 'expense.html'; // Redirect
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Something went wrong');
  }
});
