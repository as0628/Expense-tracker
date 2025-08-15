document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();

  const email = event.target.email.value.trim();
  const password = event.target.password.value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Login successful:', data); // ✅ Log success to console
      alert('✅ User logged in successfully');
      // Optional: redirect or store token
      // localStorage.setItem('token', data.token);
      // window.location.href = 'dashboard.html';
    } else {
      console.error('❌ Login failed:', data); // ❌ Log failure details
      alert(`❌ Login failed: ${data.error || 'Credentials not matched'}`);
    }
  } catch (error) {
    console.error('⚠ Network or server error:', error); // ⚠ Log network errors
    alert('⚠ Network or server error. Please try again.');
  }
});
