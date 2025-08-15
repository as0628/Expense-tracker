document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();

  const email = event.target.email.value.trim();
  const password = event.target.password.value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
      alert('✅ User logged in successfully');
      // Optional: redirect or store token
      // localStorage.setItem('token', data.token);
      // window.location.href = 'dashboard.html';
    } else {
      alert(`❌ Login failed: ${data.error || 'Credentials not matched'}`);
    }
  } catch (error) {
    alert('⚠ Network or server error. Please try again.');
    console.error('Fetch error:', error);
  }
});
